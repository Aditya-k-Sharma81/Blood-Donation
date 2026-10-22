import BloodStock from '../models/BloodStock.js';
import Admin from '../models/Admin.js';
import HospitalUser from '../models/HospitalUser.js';
import Donor from '../models/Donor.js';
import DonationRecord from '../models/DonationRecord.js';
import Notification from '../models/Notification.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import BloodIssue from '../models/BloodIssue.js';
import EmergencyDonation from '../models/EmergencyDonation.js';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * Calculate distance between two coordinates using Haversine formula (km)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Determine stock status based on clinical rules:
 * - Critical Shortage: < 5 units
 * - Low Stock: 5 - 15 units
 * - Sufficient: > 15 units
 */
const getStockStatus = (units) => {
  if (units < 5) return 'CRITICAL';
  if (units <= 15) return 'LOW';
  return 'SUFFICIENT';
};

/**
 * Resolve the Admin who owns/authorizes this hospital
 * (Since there is 1 hospital in the system right now, hospitalUserId stores Admin's _id)
 */
const resolveAdmin = async (req) => {
  // 1. Direct admin ID from headers or query
  const adminId = req.headers['x-admin-id'] || req.query?.adminId;
  if (adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (admin) return admin;
    } catch (e) { }
  }

  // 2. From logged in Hospital User (permittedBy points to Admin._id)
  const userId = req.headers['x-user-id'] || req.headers['x-hospital-id'];
  if (userId) {
    try {
      const hUser = await HospitalUser.findById(userId);
      if (hUser?.permittedBy) {
        const admin = await Admin.findById(hUser.permittedBy);
        if (admin) return admin;
      }

      const adminUser = await Admin.findById(userId);
      if (adminUser) return adminUser;
    } catch (e) { }
  }

  // 3. Fallback: Query the system admin
  const admin = await Admin.findOne();
  return admin;
};

/**
 * Resolve hospital and admin details including permanent geographic coordinates
 */
const resolveHospitalInfo = async (req) => {
  const admin = await resolveAdmin(req);
  const hospitalName =
    req.query?.hospitalName?.trim() ||
    admin?.hospitalName?.trim() ||
    'City Central Hospital';

  let latitude = admin?.latitude ?? null;
  let longitude = admin?.longitude ?? null;
  let locationName = admin?.locationName || admin?.city || '';
  let address = admin?.address || '';
  let city = admin?.city || '';

  if (admin && admin.hospitals && admin.hospitals.length > 0) {
    const matched = admin.hospitals.find(
      (h) =>
        (h.hospitalName && h.hospitalName.toLowerCase() === hospitalName.toLowerCase()) ||
        (req.headers['x-user-id'] && h.hospitalUserId?.toString() === req.headers['x-user-id'])
    );
    if (matched) {
      if (matched.latitude !== null && matched.latitude !== undefined) latitude = matched.latitude;
      if (matched.longitude !== null && matched.longitude !== undefined) longitude = matched.longitude;
      if (matched.locationName) locationName = matched.locationName;
      if (matched.address) address = matched.address;
      if (matched.city) city = matched.city;
    }
  }

  // Query parameter override if explicitly provided
  if (req.query?.latitude && req.query?.longitude) {
    const lat = Number(req.query.latitude);
    const lng = Number(req.query.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      latitude = lat;
      longitude = lng;
    }
  }

  return {
    admin,
    hospitalUserId: admin ? admin._id : null,
    hospitalName,
    latitude,
    longitude,
    locationName,
    address,
    city,
  };
};

// @desc    Get all 8 blood groups stock directly from database in real time
// @route   GET /api/hospital/stock
// @access  Hospital Staff / Public
export const getHospitalStock = async (req, res) => {
  try {
    const { admin, hospitalUserId, hospitalName } = await resolveHospitalInfo(req);

    // Query filter: match by hospitalUserId or hospitalName
    const query = hospitalUserId
      ? { $or: [{ hospitalUserId }, { hospitalName }] }
      : { hospitalName };

    // Fetch live records directly from MongoDB
    let stockRecords = await BloodStock.find(query);

    // Ensure all existing documents carry the resolved hospitalUserId (admin's id)
    if (hospitalUserId && stockRecords.some((s) => !s.hospitalUserId)) {
      await BloodStock.updateMany(
        { hospitalName, hospitalUserId: { $in: [null, undefined] } },
        { $set: { hospitalUserId } }
      );
      stockRecords = await BloodStock.find(query);
    }

    // Ensure all 8 blood groups have a document in the database
    if (stockRecords.length < ALL_BLOOD_GROUPS.length) {
      const existingGroups = new Set(stockRecords.map((s) => s.bloodGroup));

      const docsToInsert = ALL_BLOOD_GROUPS.filter((bg) => !existingGroups.has(bg)).map((bg) => ({
        hospitalUserId,
        hospitalName,
        bloodGroup: bg,
        units: 0,
        units350: 0,
        units450: 0,
        units500: 0,
        capacity: 50,
        updatedBy: 'Database Setup',
      }));

      if (docsToInsert.length > 0) {
        await BloodStock.insertMany(docsToInsert, { ordered: false }).catch(() => { });
      }

      // Re-fetch latest documents from MongoDB
      stockRecords = await BloodStock.find(query);
    }

    // Ensure all documents have bag volume breakdown initialized (units350, units450, units500)
    for (const record of stockRecords) {
      const u350 = record.units350 || 0;
      const u450 = record.units450 || 0;
      const u500 = record.units500 || 0;
      if (u350 + u450 + u500 !== record.units) {
        if (record.units <= 0) {
          record.units350 = 0;
          record.units450 = 0;
          record.units500 = 0;
          await record.save().catch(() => {});
        } else {
          // Proportionate distribution for existing baseline stock: ~65% 350 mL, ~25% 450 mL, ~10% 500 mL
          const total = record.units;
          const p500 = Math.max(0, Math.floor(total * 0.10));
          const p450 = Math.max(0, Math.floor(total * 0.25));
          const p350 = total - p500 - p450;
          record.units350 = p350;
          record.units450 = p450;
          record.units500 = p500;
          await record.save().catch(() => {});
        }
      }
    }

    // Map database documents to consistent blood group order
    const stockMap = new Map(stockRecords.map((s) => [s.bloodGroup, s]));
    const formattedStocks = ALL_BLOOD_GROUPS.map((bg) => {
      const item = stockMap.get(bg);
      const units350 = item ? (item.units350 || 0) : 0;
      const units450 = item ? (item.units450 || 0) : 0;
      const units500 = item ? (item.units500 || 0) : 0;
      const units = item ? ((units350 + units450 + units500 > 0) ? (units350 + units450 + units500) : item.units) : 0;
      const capacity = item ? item.capacity : 50;
      return {
        id: item?._id || bg,
        hospitalUserId: item?.hospitalUserId || hospitalUserId,
        bloodGroup: bg,
        units,
        units350,
        units450,
        units500,
        breakdown: {
          ml350: units350,
          ml450: units450,
          ml500: units500,
        },
        capacity,
        percentage: Math.min(100, Math.round((units / capacity) * 100)),
        status: getStockStatus(units),
        lastUpdated: item?.updatedAt || new Date(),
        updatedBy: item?.updatedBy || 'Medical Staff',
      };
    });

    const totalUnits = formattedStocks.reduce((sum, item) => sum + item.units, 0);
    const totalUnits350 = formattedStocks.reduce((sum, item) => sum + item.units350, 0);
    const totalUnits450 = formattedStocks.reduce((sum, item) => sum + item.units450, 0);
    const totalUnits500 = formattedStocks.reduce((sum, item) => sum + item.units500, 0);
    const criticalCount = formattedStocks.filter((s) => s.status === 'CRITICAL').length;
    const lowCount = formattedStocks.filter((s) => s.status === 'LOW').length;
    const sufficientCount = formattedStocks.filter((s) => s.status === 'SUFFICIENT').length;

    res.status(200).json({
      success: true,
      hospitalName,
      hospitalUserId,
      totalUnits,
      metrics: {
        totalUnits,
        totalUnits350,
        totalUnits450,
        totalUnits500,
        criticalCount,
        lowCount,
        sufficientCount,
        totalGroups: 8,
      },
      stocks: formattedStocks,
    });
  } catch (error) {
    console.error('Get Hospital Stock Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving blood stock data from database.' });
  }
};

// @desc    Update single blood group stock in database (increment, decrement, or set exact units per volume)
// @route   POST /api/hospital/stock/update or PATCH /api/hospital/stock/update
// @access  Hospital Staff
export const updateBloodStock = async (req, res) => {
  try {
    const { bloodGroup, units, units350, units450, units500, delta, updatedBy } = req.body;
    const { admin, hospitalUserId, hospitalName } = await resolveHospitalInfo(req);

    if (!bloodGroup || !ALL_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Must be one of: ${ALL_BLOOD_GROUPS.join(', ')}`,
      });
    }

    const query = hospitalUserId
      ? { $or: [{ hospitalUserId, bloodGroup }, { hospitalName, bloodGroup }] }
      : { hospitalName, bloodGroup };

    let record = await BloodStock.findOne(query);

    if (!record) {
      record = new BloodStock({
        hospitalUserId,
        hospitalName,
        bloodGroup,
        units: 0,
        units350: 0,
        units450: 0,
        units500: 0,
        capacity: 50,
      });
    } else if (hospitalUserId && !record.hospitalUserId) {
      record.hospitalUserId = hospitalUserId;
    }

    if (units350 !== undefined || units450 !== undefined || units500 !== undefined) {
      const u350 = Math.max(0, Number(units350) || 0);
      const u450 = Math.max(0, Number(units450) || 0);
      const u500 = Math.max(0, Number(units500) || 0);
      record.units350 = u350;
      record.units450 = u450;
      record.units500 = u500;
      record.units = u350 + u450 + u500;
    } else if (units !== undefined) {
      const parsedUnits = Number(units);
      if (isNaN(parsedUnits) || parsedUnits < 0) {
        return res.status(400).json({ success: false, message: 'Units must be a non-negative number.' });
      }
      record.units = parsedUnits;
      record.units350 = parsedUnits;
      record.units450 = 0;
      record.units500 = 0;
    } else if (delta !== undefined && typeof delta === 'number') {
      record.units = Math.max(0, record.units + delta);
      record.units350 = Math.max(0, (record.units350 || 0) + delta);
    }

    record.updatedBy = updatedBy?.trim() || 'Hospital Staff';
    await record.save();

    // Fetch and return the fresh real-time database state
    return getHospitalStock(req, res);
  } catch (error) {
    console.error('Update Blood Stock Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update blood stock in database.' });
  }
};

// @desc    Reset all blood stock to 0 in database
// @route   POST /api/hospital/stock/reset
// @access  Hospital Staff
export const resetBloodStock = async (req, res) => {
  try {
    const { hospitalUserId, hospitalName } = await resolveHospitalInfo(req);

    for (const bg of ALL_BLOOD_GROUPS) {
      const filter = hospitalUserId
        ? { $or: [{ hospitalUserId, bloodGroup: bg }, { hospitalName, bloodGroup: bg }] }
        : { hospitalName, bloodGroup: bg };

      await BloodStock.findOneAndUpdate(
        filter,
        {
          hospitalUserId,
          hospitalName,
          bloodGroup: bg,
          units: 0,
          units350: 0,
          units450: 0,
          units500: 0,
          capacity: 50,
          updatedBy: 'Stock Reset to Zero',
        },
        { upsert: true, new: true }
      );
    }

    return getHospitalStock(req, res);
  } catch (error) {
    console.error('Reset Blood Stock Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset blood stock in database.' });
  }
};

// @desc    Get donors within specified radius (5km, 10km, 15km) from permanent hospital location
// @route   GET /api/hospital/nearby-donors
// @access  Hospital Staff / Admin
export const getNearbyDonors = async (req, res) => {
  try {
    const hospitalInfo = await resolveHospitalInfo(req);

    const hospitalLat = hospitalInfo.latitude;
    const hospitalLng = hospitalInfo.longitude;

    if (hospitalLat === null || hospitalLng === null || hospitalLat === undefined || hospitalLng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Permanent hospital location is not set. Please configure hospital coordinates in Admin Profile.',
        hospitalLocation: {
          hospitalName: hospitalInfo.hospitalName,
          locationName: hospitalInfo.locationName || '',
          latitude: null,
          longitude: null,
        },
        donors: [],
      });
    }

    const radius = Number(req.query.radius) || 5;
    const bloodGroup = (req.query.bloodGroup || '').trim();

    // Query all registered donors who have stored coordinates
    const donors = await Donor.find({
      latitude: { $ne: null, $exists: true },
      longitude: { $ne: null, $exists: true },
    }).select('-password');

    const donorsWithinRadius = [];

    for (const donor of donors) {
      if (typeof donor.latitude !== 'number' || typeof donor.longitude !== 'number') continue;
      if (isNaN(donor.latitude) || isNaN(donor.longitude)) continue;

      if (bloodGroup && bloodGroup !== 'ALL' && donor.bloodGroup !== bloodGroup) {
        continue;
      }

      const dist = calculateDistanceKm(
        hospitalLat,
        hospitalLng,
        donor.latitude,
        donor.longitude
      );

      if (dist <= radius) {
        donorsWithinRadius.push({
          _id: donor._id,
          id: donor._id,
          name: donor.name,
          email: donor.email,
          phone: donor.phone || '',
          bloodGroup: donor.bloodGroup || '',
          lastLocation: donor.lastLocation || donor.city || 'Location unavailable',
          permanentLocation: donor.permanentLocation || '',
          city: donor.city || '',
          latitude: donor.latitude,
          longitude: donor.longitude,
          lastLocationUpdate: donor.lastLocationUpdate,
          lastDonationDate: donor.lastDonationDate || null,
          isAvailable: donor.isAvailable !== false,
          emergencyContact: donor.emergencyContact || '',
          profilePic: donor.profilePic || '',
          distanceKm: Number(dist.toFixed(2)),
          distanceMeters: Math.round(dist * 1000),
        });
      }
    }

    // Check donation records for all donors within radius to verify 90-day cooldown
    const donorIds = donorsWithinRadius.map((d) => d._id);
    const donationRecords = await DonationRecord.find({ donorId: { $in: donorIds } }).sort({ donationDate: -1 });

    const latestDonationByDonor = new Map();
    for (const rec of donationRecords) {
      if (rec.donorId && rec.donationDate && !latestDonationByDonor.has(rec.donorId.toString())) {
        latestDonationByDonor.set(rec.donorId.toString(), new Date(rec.donationDate));
      }
    }

    const now = Date.now();
    for (const d of donorsWithinRadius) {
      const recDate = latestDonationByDonor.get(d._id.toString());
      const profileDate = d.lastDonationDate ? new Date(d.lastDonationDate) : null;

      let effectiveLastDonation = null;
      if (recDate && profileDate) {
        effectiveLastDonation = recDate > profileDate ? recDate : profileDate;
      } else {
        effectiveLastDonation = recDate || profileDate || null;
      }

      if (effectiveLastDonation && !isNaN(effectiveLastDonation.getTime())) {
        const diffDays = Math.floor((now - effectiveLastDonation.getTime()) / (1000 * 60 * 60 * 24));
        d.lastDonationDate = effectiveLastDonation;
        d.daysSinceLastDonation = diffDays;
        d.isEligibleForDonation = diffDays >= 90;
        d.daysUntilEligible = diffDays >= 90 ? 0 : 90 - diffDays;

        const nextEligible = new Date(effectiveLastDonation);
        nextEligible.setDate(nextEligible.getDate() + 90);
        d.nextEligibleDate = nextEligible;
      } else {
        d.lastDonationDate = null;
        d.daysSinceLastDonation = null;
        d.isEligibleForDonation = true;
        d.daysUntilEligible = 0;
        d.nextEligibleDate = null;
      }
    }

    // Sort ascending by distance (nearest first)
    donorsWithinRadius.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      radius,
      totalCount: donorsWithinRadius.length,
      hospitalLocation: {
        hospitalName: hospitalInfo.hospitalName,
        locationName: hospitalInfo.locationName || '',
        address: hospitalInfo.address || '',
        city: hospitalInfo.city || '',
        latitude: hospitalLat,
        longitude: hospitalLng,
      },
      donors: donorsWithinRadius,
    });
  } catch (error) {
    console.error('Get Nearby Donors Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve donors within radius.',
    });
  }
};

/**
 * @desc    Send emergency blood request to selected donors within radius (strictly requires 90+ days since last donation)
 * @route   POST /api/hospital/send-emergency-request
 * @access  Hospital Staff / Admin
 */
export const sendEmergencyRequest = async (req, res) => {
  try {
    const { donorIds, bloodGroup, urgency = 'CRITICAL', message, contactPhone, radiusKm = 5 } = req.body;

    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one donor to send the emergency request.',
      });
    }

    const hospitalInfo = await resolveHospitalInfo(req);
    const hospitalLat = hospitalInfo.latitude;
    const hospitalLng = hospitalInfo.longitude;
    const hospitalPhone =
      (contactPhone || hospitalInfo.admin?.phone || hospitalInfo.admin?.emergencyContact || '').trim();

    // Fetch the target donors from DB
    const donors = await Donor.find({ _id: { $in: donorIds } });

    // Fetch clinical donation records for these donors
    const donationRecords = await DonationRecord.find({ donorId: { $in: donorIds } }).sort({ donationDate: -1 });
    const latestDonationByDonor = new Map();
    for (const rec of donationRecords) {
      if (rec.donorId && rec.donationDate && !latestDonationByDonor.has(rec.donorId.toString())) {
        latestDonationByDonor.set(rec.donorId.toString(), new Date(rec.donationDate));
      }
    }

    const now = Date.now();
    const eligibleDonors = [];
    const ineligibleDonors = [];
    const notificationsToCreate = [];

    for (const donor of donors) {
      const recDate = latestDonationByDonor.get(donor._id.toString());
      const profileDate = donor.lastDonationDate ? new Date(donor.lastDonationDate) : null;

      let effectiveLastDonation = null;
      if (recDate && profileDate) {
        effectiveLastDonation = recDate > profileDate ? recDate : profileDate;
      } else {
        effectiveLastDonation = recDate || profileDate || null;
      }

      // Check 90 days eligibility rule
      if (effectiveLastDonation && !isNaN(effectiveLastDonation.getTime())) {
        const diffDays = Math.floor((now - effectiveLastDonation.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 90) {
          ineligibleDonors.push({
            donorId: donor._id,
            name: donor.name,
            email: donor.email,
            daysSinceLastDonation: diffDays,
            daysUntilEligible: 90 - diffDays,
            reason: `Donated ${diffDays} days ago. Mandatory 90-day cooldown in effect (Eligible in ${90 - diffDays} days).`,
          });
          continue; // Strict: Do NOT send request to ineligible donors
        }
      }

      // Calculate distance if coordinates available
      let dist = 0;
      if (
        hospitalLat !== null &&
        hospitalLng !== null &&
        donor.latitude !== null &&
        donor.longitude !== null
      ) {
        dist = Number(
          calculateDistanceKm(hospitalLat, hospitalLng, donor.latitude, donor.longitude).toFixed(2)
        );
      }

      eligibleDonors.push({
        donorId: donor._id,
        donorName: donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone || '',
        distanceKm: dist,
        lastDonationDate: effectiveLastDonation,
        status: 'SENT',
        sentAt: new Date(),
      });

      const effectiveGroup = bloodGroup && bloodGroup !== 'ALL' ? bloodGroup : donor.bloodGroup || 'Blood';
      const defaultMsg = `Emergency: Urgent ${effectiveGroup} blood required immediately at ${hospitalInfo.hospitalName}. Please report to the hospital or contact ${hospitalPhone || 'the staff'} if you can donate.`;

      notificationsToCreate.push({
        recipientId: donor._id,
        recipientEmail: donor.email,
        type: 'EMERGENCY_REQUEST',
        severity: 'critical',
        title: `🚨 Emergency: Urgent ${effectiveGroup} Blood Needed`,
        message: message && message.trim() ? message.trim() : defaultMsg,
        details: {
          hospitalName: hospitalInfo.hospitalName,
          hospitalLocation: hospitalInfo.locationName || hospitalInfo.address || '',
          contactPhone: hospitalPhone,
          requiredBloodGroup: effectiveGroup,
          urgency: urgency || 'CRITICAL',
          distanceKm: dist,
          donationDate: new Date(),
        },
      });
    }

    if (eligibleDonors.length === 0) {
      return res.status(400).json({
        success: false,
        message: `None of the selected donors are eligible to donate. All ${ineligibleDonors.length} selected donor(s) donated within the last 90 days.`,
        sentCount: 0,
        ineligibleCount: ineligibleDonors.length,
        ineligibleDonors,
      });
    }

    // Bulk create notifications for all eligible donors
    await Notification.insertMany(notificationsToCreate);

    // Create EmergencyRequest audit log
    const emergencyReq = await EmergencyRequest.create({
      hospitalId: hospitalInfo.hospitalUserId || hospitalInfo.admin?._id || null,
      hospitalName: hospitalInfo.hospitalName,
      hospitalLocation: hospitalInfo.locationName || hospitalInfo.address || '',
      hospitalPhone,
      bloodGroup: bloodGroup || 'ANY',
      urgency: urgency || 'CRITICAL',
      message: message || `Urgent blood request dispatched to ${eligibleDonors.length} nearby donors.`,
      radiusKm: Number(radiusKm) || 5,
      targetedDonorCount: eligibleDonors.length,
      recipients: eligibleDonors,
      status: 'ACTIVE',
    });

    return res.status(200).json({
      success: true,
      message: `Emergency request successfully sent to ${eligibleDonors.length} eligible donor(s)!${
        ineligibleDonors.length > 0
          ? ` (${ineligibleDonors.length} donor(s) were excluded because they donated within the last 90 days).`
          : ''
      }`,
      sentCount: eligibleDonors.length,
      ineligibleCount: ineligibleDonors.length,
      ineligibleDonors,
      requestId: emergencyReq._id,
    });
  } catch (error) {
    console.error('Send Emergency Request Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send emergency blood request.',
    });
  }
};

// @desc    Dispense / Issue blood to a patient in need and reduce hospital stock
// @route   POST /api/hospital/blood-issue
// @access  Hospital Staff
export const issueBloodToPatient = async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      patientAge,
      patientGender,
      patientHospitalId,
      prescribingDoctor,
      bloodGroup,
      bagSize = '350ml',
      units = 1,
      purpose,
      notes,
      staffName,
      staffEmail,
      staffId,
    } = req.body;

    // Validate required fields
    if (!patientName?.trim() || !patientPhone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and contact phone are required to issue blood.',
      });
    }

    if (!bloodGroup || !ALL_BLOOD_GROUPS.includes(bloodGroup.trim())) {
      return res.status(400).json({
        success: false,
        message: `Valid blood group is required. Allowed: ${ALL_BLOOD_GROUPS.join(', ')}`,
      });
    }

    const requestedUnits = Number(units);
    if (isNaN(requestedUnits) || requestedUnits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of units must be at least 1.',
      });
    }

    const normalizedBagSize = ['350ml', '450ml', '500ml'].includes(bagSize) ? bagSize : '350ml';
    const cleanGroup = bloodGroup.trim();

    const { admin, hospitalUserId, hospitalName } = await resolveHospitalInfo(req);

    const query = hospitalUserId
      ? { $or: [{ hospitalUserId, bloodGroup: cleanGroup }, { hospitalName, bloodGroup: cleanGroup }] }
      : { hospitalName, bloodGroup: cleanGroup };

    let stockItem = await BloodStock.findOne(query);

    if (!stockItem) {
      return res.status(400).json({
        success: false,
        message: `No stock record found for ${cleanGroup} in hospital inventory.`,
      });
    }

    // Determine available units for the selected bag size
    let availableInBag = 0;
    if (normalizedBagSize === '350ml') {
      availableInBag = stockItem.units350 || 0;
    } else if (normalizedBagSize === '450ml') {
      availableInBag = stockItem.units450 || 0;
    } else if (normalizedBagSize === '500ml') {
      availableInBag = stockItem.units500 || 0;
    }

    // Check if enough stock exists in this specific bag size
    if (availableInBag < requestedUnits) {
      const totalAvailable = stockItem.units || 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory! Hospital only has ${availableInBag} bag(s) of ${cleanGroup} (${normalizedBagSize}). Total all sizes available: ${totalAvailable} bag(s).`,
      });
    }

    // Deduct from stock
    if (normalizedBagSize === '350ml') {
      stockItem.units350 = Math.max(0, (stockItem.units350 || 0) - requestedUnits);
    } else if (normalizedBagSize === '450ml') {
      stockItem.units450 = Math.max(0, (stockItem.units450 || 0) - requestedUnits);
    } else if (normalizedBagSize === '500ml') {
      stockItem.units500 = Math.max(0, (stockItem.units500 || 0) - requestedUnits);
    }

    stockItem.units = (stockItem.units350 || 0) + (stockItem.units450 || 0) + (stockItem.units500 || 0);
    const effectiveStaff = staffName?.trim() || req.headers['x-user-name'] || 'Hospital Staff';
    stockItem.updatedBy = `Dispensed ${requestedUnits}x ${cleanGroup} (${normalizedBagSize}) to ${patientName.trim()} by ${effectiveStaff}`;
    await stockItem.save();

    // Generate unique issue reference
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const issueReference = `ISSUE-${datePart}-${cleanGroup.replace('+', 'P').replace('-', 'N')}-${randPart}`;

    const newIssue = await BloodIssue.create({
      issueReference,
      hospitalUserId,
      hospitalName,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail?.trim() || '',
      patientAge: patientAge ? Number(patientAge) : null,
      patientGender: patientGender || 'Not Specified',
      patientHospitalId: patientHospitalId?.trim() || '',
      prescribingDoctor: prescribingDoctor?.trim() || '',
      bloodGroup: cleanGroup,
      bagSize: normalizedBagSize,
      units: requestedUnits,
      purpose: purpose?.trim() || 'Emergency Patient Transfusion',
      notes: notes?.trim() || '',
      dispensedByStaffName: effectiveStaff,
      dispensedByStaffEmail: staffEmail?.trim() || '',
      dispensedByStaffId: staffId || null,
      issueDate: now,
      status: 'ISSUED',
    });

    // Check if patient phone or email corresponds to a registered donor, and send notification
    try {
      if (patientEmail?.trim() || patientPhone?.trim()) {
        const donorRecipient = await Donor.findOne({
          $or: [
            ...(patientEmail?.trim() ? [{ email: patientEmail.trim().toLowerCase() }] : []),
            ...(patientPhone?.trim() ? [{ phone: patientPhone.trim() }] : []),
          ],
        });

        if (donorRecipient) {
          await Notification.create({
            recipientId: donorRecipient._id,
            recipientEmail: donorRecipient.email,
            type: 'GENERAL',
            severity: 'info',
            title: `Blood Dispensation: ${requestedUnits} Unit(s) of ${cleanGroup}`,
            message: `Hospital ${hospitalName} has issued ${requestedUnits} bag(s) of ${cleanGroup} (${normalizedBagSize}) for patient ${patientName.trim()} (Ref: ${issueReference}).`,
          });
        }
      }
    } catch (notifErr) {
      console.warn('Optional patient notification skipped:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully dispensed ${requestedUnits} bag(s) of ${cleanGroup} (${normalizedBagSize}) to ${patientName.trim()}. Inventory stock reduced.`,
      issue: newIssue,
      updatedStock: {
        bloodGroup: cleanGroup,
        units: stockItem.units,
        units350: stockItem.units350,
        units450: stockItem.units450,
        units500: stockItem.units500,
      },
    });
  } catch (error) {
    console.error('Issue Blood to Patient Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while issuing blood.',
    });
  }
};

// @desc    Get blood issue history for hospital
// @route   GET /api/hospital/blood-issues
// @access  Hospital Staff
export const getBloodIssueHistory = async (req, res) => {
  try {
    const { hospitalName } = await resolveHospitalInfo(req);
    const filter = hospitalName ? { hospitalName } : {};

    const issues = await BloodIssue.find(filter)
      .sort({ issueDate: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error('Get Blood Issue History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving blood dispensation history.',
    });
  }
};

/**
 * @desc    Get emergency requests targeted to a specific donor
 * @route   GET /api/donor/emergency-requests
 * @access  Donor
 */
export const getDonorEmergencyRequests = async (req, res) => {
  try {
    const donorId =
      req.headers['x-user-id'] ||
      req.headers['x-donor-id'] ||
      req.query.donorId ||
      req.user?.id ||
      req.user?._id;
    const donorEmail = (
      req.headers['x-user-email'] ||
      req.query.email ||
      req.user?.email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!donorId && !donorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Donor identification required.',
      });
    }

    const query = {
      $or: [
        ...(donorId ? [{ 'recipients.donorId': donorId }] : []),
        ...(donorEmail ? [{ 'recipients.donorEmail': donorEmail }] : []),
      ],
    };

    const requests = await EmergencyRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(60);

    // Format requests to reflect this specific donor's response
    const formatted = requests.map((reqDoc) => {
      const recipient = reqDoc.recipients.find(
        (r) =>
          (donorId && r.donorId?.toString() === donorId.toString()) ||
          (donorEmail && r.donorEmail?.toLowerCase() === donorEmail)
      );

      return {
        _id: reqDoc._id,
        hospitalId: reqDoc.hospitalId,
        hospitalName: reqDoc.hospitalName,
        hospitalLocation: reqDoc.hospitalLocation,
        hospitalPhone: reqDoc.hospitalPhone,
        bloodGroup: reqDoc.bloodGroup,
        urgency: reqDoc.urgency,
        message: reqDoc.message,
        radiusKm: reqDoc.radiusKm,
        status: reqDoc.status, // 'ACTIVE' | 'FULFILLED' | 'CANCELLED'
        donatedDonorId: reqDoc.donatedDonorId,
        donatedDonorName: reqDoc.donatedDonorName,
        fulfilledAt: reqDoc.fulfilledAt,
        myResponseStatus: recipient?.status || 'SENT', // 'SENT' | 'ACCEPTED' | 'DECLINED' | 'DONATED'
        respondedAt: recipient?.respondedAt || null,
        distanceKm: recipient?.distanceKm ?? 0,
        createdAt: reqDoc.createdAt,
      };
    });

    // Also get this donor's emergency donation receipts
    const receiptFilter = [];
    if (donorId) receiptFilter.push({ donorId });
    if (donorEmail) receiptFilter.push({ donorEmail });
    const receipts = await EmergencyDonation.find({ $or: receiptFilter }).sort({ donationDate: -1 });

    return res.status(200).json({
      success: true,
      requests: formatted,
      receipts,
    });
  } catch (error) {
    console.error('Get Donor Emergency Requests Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving emergency requests.',
    });
  }
};

/**
 * @desc    Donor accepts or declines an emergency request
 * @route   POST /api/donor/emergency-requests/:id/respond
 * @access  Donor
 */
export const respondToEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, donorId: bodyDonorId, donorEmail: bodyDonorEmail } = req.body; // 'ACCEPT' | 'DECLINE'
    const donorId =
      bodyDonorId ||
      req.headers['x-user-id'] ||
      req.headers['x-donor-id'] ||
      req.user?.id ||
      req.user?._id;
    const donorEmail = (
      bodyDonorEmail ||
      req.headers['x-user-email'] ||
      req.user?.email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response action. Must be ACCEPT or DECLINE.',
      });
    }

    const emergencyReq = await EmergencyRequest.findById(id);
    if (!emergencyReq) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found.',
      });
    }

    if (emergencyReq.status === 'FULFILLED') {
      return res.status(400).json({
        success: false,
        isFulfilled: true,
        message:
          'This emergency has already been fulfilled by another voluntary donor. Thank you for your readiness to help!',
      });
    }

    if (emergencyReq.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This emergency request has been cancelled.',
      });
    }

    const recipientIndex = emergencyReq.recipients.findIndex(
      (r) =>
        (donorId && r.donorId?.toString() === donorId.toString()) ||
        (donorEmail && r.donorEmail?.toLowerCase() === donorEmail)
    );

    if (recipientIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not listed as a recipient for this emergency request.',
      });
    }

    emergencyReq.recipients[recipientIndex].status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    emergencyReq.recipients[recipientIndex].respondedAt = new Date();
    await emergencyReq.save();

    // If accepted, send an urgent notification to the hospital
    if (action === 'ACCEPT') {
      try {
        const donor = await Donor.findById(emergencyReq.recipients[recipientIndex].donorId);
        const donorName =
          donor?.name || emergencyReq.recipients[recipientIndex].donorName || 'Voluntary Donor';
        const donorPhone = donor?.phone || emergencyReq.recipients[recipientIndex].donorPhone || '';

        // Resolve hospital admin email and recipientId
        let targetHospitalAdmin = null;
        if (emergencyReq.hospitalId) {
          targetHospitalAdmin = await Admin.findById(emergencyReq.hospitalId);
        }
        if (!targetHospitalAdmin && emergencyReq.hospitalName) {
          targetHospitalAdmin = await Admin.findOne({
            $or: [
              { hospitalName: emergencyReq.hospitalName },
              { name: emergencyReq.hospitalName },
            ],
          });
        }

        const hospitalEmail = targetHospitalAdmin?.email || 'hospital@rakt.org';
        const hospitalRecipientId =
          targetHospitalAdmin?._id || emergencyReq.hospitalId || emergencyReq._id;

        await Notification.create({
          recipientId: hospitalRecipientId,
          recipientEmail: hospitalEmail,
          type: 'EMERGENCY_REQUEST',
          severity: 'critical',
          title: `🚨 Donor Accepted Emergency: ${donorName}`,
          message: `${donorName} (${emergencyReq.bloodGroup}, Ph: ${
            donorPhone || 'N/A'
          }) has ACCEPTED your emergency blood dispatch for ${emergencyReq.bloodGroup} at ${
            emergencyReq.hospitalName
          } and is reporting to donate.`,
          details: {
            emergencyRequestId: emergencyReq._id,
            donorId: donor?._id,
            donorName,
            donorPhone,
            bloodGroup: emergencyReq.bloodGroup,
            hospitalName: emergencyReq.hospitalName,
          },
        });
      } catch (notifErr) {
        console.warn('Could not dispatch acceptance notification to hospital:', notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message:
        action === 'ACCEPT'
          ? 'Thank you! You have accepted the emergency dispatch. Please report to the hospital emergency department.'
          : 'Emergency request declined. Thank you.',
      action,
    });
  } catch (error) {
    console.error('Respond To Emergency Request Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error responding to emergency request.',
    });
  }
};

/**
 * @desc    Get all emergency requests dispatched by hospital
 * @route   GET /api/hospital/emergency-requests
 * @access  Hospital Staff / Admin
 */
export const getHospitalEmergencyRequests = async (req, res) => {
  try {
    const { hospitalName, hospitalUserId } = await resolveHospitalInfo(req);
    const filter = {};
    if (hospitalUserId) {
      filter.$or = [{ hospitalId: hospitalUserId }, { hospitalName }];
    } else if (hospitalName) {
      filter.hospitalName = hospitalName;
    }

    const requests = await EmergencyRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Get Hospital Emergency Requests Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving hospital emergency requests.',
    });
  }
};

/**
 * @desc    Collect blood from donor for an emergency (Does NOT add to regular bloodstock, applies 90-day cooldown, resolves emergency, and notifies other donors)
 * @route   POST /api/hospital/emergency-requests/:id/collect
 * @access  Hospital Staff / Admin
 */
export const collectEmergencyBlood = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      donorId,
      bagVolume = '350ml',
      units = 1,
      staffName,
      patientName = 'Emergency Patient',
      patientWard = 'Emergency / ICU',
      notes = 'Emergency Direct Patient Transfusion. Not added to general inventory stock.',
    } = req.body;

    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: 'Donor ID is required to record blood collection.',
      });
    }

    const emergencyReq = await EmergencyRequest.findById(id);
    if (!emergencyReq) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found.',
      });
    }

    if (emergencyReq.status === 'FULFILLED') {
      return res.status(400).json({
        success: false,
        message: 'This emergency request has already been fulfilled.',
      });
    }

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor record not found.',
      });
    }

    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days cooldown

    // Generate unique official receipt number
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = `EMERG-REC-${dateStr}-${randomHex}`;

    // 1. Create EmergencyDonation Record (STRICTLY NOT ADDED TO BLOODSTOCK!)
    const emergencyDonation = await EmergencyDonation.create({
      emergencyRequestId: emergencyReq._id,
      receiptNumber,
      donorId: donor._id,
      donorName: donor.name,
      donorEmail: donor.email,
      donorPhone: donor.phone || '',
      bloodGroup: donor.bloodGroup || emergencyReq.bloodGroup || 'O+',
      hospitalId: emergencyReq.hospitalId,
      hospitalName: emergencyReq.hospitalName,
      hospitalLocation: emergencyReq.hospitalLocation,
      hospitalPhone: emergencyReq.hospitalPhone,
      bagVolume: ['350ml', '450ml', '500ml'].includes(bagVolume) ? bagVolume : '350ml',
      units: Math.max(1, parseInt(units, 10) || 1),
      donationDate: now,
      cooldownUntil,
      collectedByStaffName: staffName?.trim() || 'Emergency Medical Officer',
      patientName: patientName?.trim() || 'Emergency Patient',
      patientWard: patientWard?.trim() || 'Emergency / ICU',
      notes: notes?.trim() || 'Emergency Direct Patient Transfusion. Not added to general stock.',
      isDirectPatientTransfusion: true,
      addedToBloodStock: false, // Critical: strictly not added to regular blood stock
      status: 'COMPLETED',
    });

    // 2. Update Donor: Activate 90-Day Cooldown & increment donations
    donor.lastDonationDate = now;
    donor.totalDonations = (donor.totalDonations || 0) + 1;
    await donor.save();

    // 3. Update EmergencyRequest: Set to FULFILLED and mark donating recipient
    emergencyReq.status = 'FULFILLED';
    emergencyReq.fulfilledAt = now;
    emergencyReq.donatedDonorId = donor._id;
    emergencyReq.donatedDonorName = donor.name;
    emergencyReq.emergencyDonationId = emergencyDonation._id;

    // Mark donating recipient as DONATED
    const recipientIndex = emergencyReq.recipients.findIndex(
      (r) => r.donorId?.toString() === donor._id.toString()
    );
    if (recipientIndex !== -1) {
      emergencyReq.recipients[recipientIndex].status = 'DONATED';
    }
    await emergencyReq.save();

    // 4. NOTIFY ALL OTHER DONORS: "Emergency fulfilled / no longer needed"
    try {
      const otherRecipients = emergencyReq.recipients.filter(
        (r) =>
          r.donorId &&
          r.donorEmail &&
          r.donorId.toString() !== donor._id.toString()
      );

      const resolveNotifications = otherRecipients.map((rec) => ({
        recipientId: rec.donorId,
        recipientEmail: rec.donorEmail,
        type: 'EMERGENCY_REQUEST',
        severity: 'info',
        title: '✅ Emergency Resolved: Blood Collected',
        message: `The urgent blood requirement for ${emergencyReq.bloodGroup} at ${emergencyReq.hospitalName} has been fulfilled by a responding voluntary donor. You do not need to report to the hospital. Thank you for your readiness to save lives!`,
        details: {
          emergencyRequestId: emergencyReq._id,
          hospitalName: emergencyReq.hospitalName,
          bloodGroup: emergencyReq.bloodGroup,
          isResolved: true,
        },
      }));

      if (resolveNotifications.length > 0) {
        await Notification.insertMany(resolveNotifications);
      }
    } catch (notifErr) {
      console.warn('Could not dispatch emergency resolved notifications to other donors:', notifErr.message);
    }

    // 5. Notify Donating Donor with their Official Emergency Receipt
    try {
      if (donor._id && donor.email) {
        await Notification.create({
          recipientId: donor._id,
          recipientEmail: donor.email,
          type: 'DONATION_COMPLETED',
          severity: 'success',
          title: '🎉 Emergency Blood Donation Completed!',
          message: `Thank you, ${donor.name}! Your emergency donation of ${emergencyDonation.bloodGroup} (${emergencyDonation.bagVolume}) has been officially registered at ${emergencyReq.hospitalName}. Receipt #${receiptNumber} generated. Under clinical safety protocols, your 90-day cooldown period is now active.`,
          details: {
            receiptNumber,
            emergencyDonationId: emergencyDonation._id,
            donationDate: now,
            hospitalName: emergencyReq.hospitalName,
            cooldownUntil,
            bloodGroup: emergencyDonation.bloodGroup,
          },
        });
      }
    } catch (donorNotifErr) {
      console.warn('Could not dispatch receipt notification to donor:', donorNotifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Emergency blood donation officially registered! Receipt #${receiptNumber} generated. Cooldown active for 90 days. Other donors have been notified that emergency is resolved.`,
      receipt: emergencyDonation,
      emergencyRequest: emergencyReq,
    });
  } catch (error) {
    console.error('Collect Emergency Blood Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record emergency donation.',
    });
  }
};

/**
 * @desc    Get emergency donation receipt details
 * @route   GET /api/emergency-donations/receipt/:receiptNumber
 * @access  Public / Donor / Hospital
 */
export const getEmergencyDonationReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const receipt = await EmergencyDonation.findOne({ receiptNumber });
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Emergency donation receipt not found.',
      });
    }
    return res.status(200).json({ success: true, receipt });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving receipt.',
    });
  }
};


