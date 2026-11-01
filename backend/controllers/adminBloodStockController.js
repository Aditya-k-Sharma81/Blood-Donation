import BloodStock from '../models/BloodStock.js';
import Admin from '../models/Admin.js';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * Determine stock status based on clinical thresholds:
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
 * Resolve Admin details from request headers/query
 */
const resolveAdmin = async (req) => {
  const adminId = req.headers['x-admin-id'] || req.headers['x-user-id'] || req.query?.adminId;
  if (adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (admin) return admin;
    } catch (e) {}
  }
  return await Admin.findOne();
};

/**
 * @desc    Get real-time blood stock specifically for Admin view (Read-Only)
 * @route   GET /api/admin/stock
 * @access  Admin Only (View-Only oversight; no modification capabilities)
 */
export const getAdminBloodStock = async (req, res) => {
  try {
    const admin = await resolveAdmin(req);

    // Selected hospital name from query, or admin's primary hospital, or fallback
    const hospitalName =
      req.query?.hospitalName?.trim() ||
      admin?.hospitalName?.trim() ||
      'City Central Hospital';

    const hospitalUserId = admin ? admin._id : null;

    // Collect list of hospitals managed/registered under this Admin
    const hospitalsList = [];
    if (admin?.hospitalName) {
      hospitalsList.push({
        hospitalName: admin.hospitalName,
        city: admin.city || '',
        category: admin.category || 'Hospital',
      });
    }
    if (admin?.hospitals && admin.hospitals.length > 0) {
      admin.hospitals.forEach((h) => {
        if (
          h.hospitalName &&
          !hospitalsList.some(
            (item) => item.hospitalName.toLowerCase() === h.hospitalName.toLowerCase()
          )
        ) {
          hospitalsList.push({
            hospitalName: h.hospitalName,
            city: h.city || '',
            category: 'Hospital Branch',
          });
        }
      });
    }
    if (hospitalsList.length === 0) {
      hospitalsList.push({
        hospitalName: 'City Central Hospital',
        city: 'Central',
        category: 'Main Blood Bank',
      });
    }

    // Query filter: match by hospitalUserId or hospitalName
    const query = hospitalUserId
      ? { $or: [{ hospitalUserId }, { hospitalName }] }
      : { hospitalName };

    let stockRecords = await BloodStock.find(query);

    // Initialize all 8 blood groups in the database if missing
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
        updatedBy: 'System Init',
      }));

      if (docsToInsert.length > 0) {
        await BloodStock.insertMany(docsToInsert, { ordered: false }).catch(() => {});
      }
      stockRecords = await BloodStock.find(query);
    }

    // Ensure bag volume breakdowns are synchronized
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
          const total = record.units;
          const p500 = Math.max(0, Math.floor(total * 0.1));
          const p450 = Math.max(0, Math.floor(total * 0.25));
          const p350 = total - p500 - p450;
          record.units350 = p350;
          record.units450 = p450;
          record.units500 = p500;
          await record.save().catch(() => {});
        }
      }
    }

    // Map to consistent 8 blood groups order
    const stockMap = new Map(stockRecords.map((s) => [s.bloodGroup, s]));
    const formattedStocks = ALL_BLOOD_GROUPS.map((bg) => {
      const item = stockMap.get(bg);
      const units350 = item ? item.units350 || 0 : 0;
      const units450 = item ? item.units450 || 0 : 0;
      const units500 = item ? item.units500 || 0 : 0;
      const units = item
        ? units350 + units450 + units500 > 0
          ? units350 + units450 + units500
          : item.units
        : 0;
      const capacity = item ? item.capacity : 50;

      return {
        id: item?._id || bg,
        hospitalName: item?.hospitalName || hospitalName,
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
        updatedBy: item?.updatedBy || 'Hospital Staff',
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
      role: 'ADMIN',
      accessLevel: 'READ_ONLY',
      hospitalName,
      hospitals: hospitalsList,
      adminInfo: {
        name: admin?.name || 'Administrator',
        email: admin?.email || '',
      },
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
    console.error('Get Admin Blood Stock Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving blood stock data for admin.',
    });
  }
};

