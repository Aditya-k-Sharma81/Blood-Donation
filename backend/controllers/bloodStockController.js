import BloodStock from '../models/BloodStock.js';
import Admin from '../models/Admin.js';
import HospitalUser from '../models/HospitalUser.js';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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
 * Resolve hospital and admin details
 */
const resolveHospitalInfo = async (req) => {
  const admin = await resolveAdmin(req);
  const hospitalName =
    req.query?.hospitalName?.trim() ||
    admin?.hospitalName?.trim() ||
    'City Central Hospital';

  return {
    admin,
    hospitalUserId: admin ? admin._id : null,
    hospitalName,
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
        capacity: 50,
        updatedBy: 'Database Setup',
      }));

      if (docsToInsert.length > 0) {
        await BloodStock.insertMany(docsToInsert, { ordered: false }).catch(() => { });
      }

      // Re-fetch latest documents from MongoDB
      stockRecords = await BloodStock.find(query);
    }

    // Map database documents to consistent blood group order
    const stockMap = new Map(stockRecords.map((s) => [s.bloodGroup, s]));
    const formattedStocks = ALL_BLOOD_GROUPS.map((bg) => {
      const item = stockMap.get(bg);
      const units = item ? item.units : 0;
      const capacity = item ? item.capacity : 50;
      return {
        id: item?._id || bg,
        hospitalUserId: item?.hospitalUserId || hospitalUserId,
        bloodGroup: bg,
        units,
        capacity,
        percentage: Math.min(100, Math.round((units / capacity) * 100)),
        status: getStockStatus(units),
        lastUpdated: item?.updatedAt || new Date(),
        updatedBy: item?.updatedBy || 'Medical Staff',
      };
    });

    const totalUnits = formattedStocks.reduce((sum, item) => sum + item.units, 0);
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

// @desc    Update single blood group stock in database (increment, decrement, or set exact units)
// @route   POST /api/hospital/stock/update or PATCH /api/hospital/stock/update
// @access  Hospital Staff
export const updateBloodStock = async (req, res) => {
  try {
    const { bloodGroup, units, delta, updatedBy } = req.body;
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
        capacity: 50,
      });
    } else if (hospitalUserId && !record.hospitalUserId) {
      record.hospitalUserId = hospitalUserId;
    }

    if (delta !== undefined && typeof delta === 'number') {
      record.units = Math.max(0, record.units + delta);
    } else if (units !== undefined) {
      const parsedUnits = Number(units);
      if (isNaN(parsedUnits) || parsedUnits < 0) {
        return res.status(400).json({ success: false, message: 'Units must be a non-negative number.' });
      }
      record.units = parsedUnits;
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
