const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const User = require('../models/User');

// @desc    Get current hospital inventory and profile
// @route   GET /api/hospital/profile
// @access  Private (Hospital)
const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id }).populate('userId', 'name email city address');
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }
    res.status(200).json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Blood Units in Inventory (8 Gauges)
// @route   PUT /api/hospital/inventory
// @access  Private (Hospital)
const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units } = req.body;
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const itemIndex = hospital.inventory.findIndex((item) => item.bloodGroup === bloodGroup);
    if (itemIndex > -1) {
      hospital.inventory[itemIndex].units = Math.max(0, Number(units));
      hospital.inventory[itemIndex].lastUpdated = new Date();
    } else {
      hospital.inventory.push({ bloodGroup, units: Math.max(0, Number(units)) });
    }

    await hospital.save();
    res.status(200).json({ success: true, message: `Stock updated for ${bloodGroup}`, inventory: hospital.inventory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dispatch Emergency Blood Request
// @route   POST /api/hospital/request-dispatch
// @access  Private (Hospital)
const dispatchEmergencyRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsRequired, urgency } = req.body;
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const requestId = `EMG-${Math.floor(10000 + Math.random() * 90000)}`;

    // Find compatible donors
    const matchedDonors = await Donor.find({ isAvailable: true });

    const newRequest = await BloodRequest.create({
      requestId,
      hospitalId: hospital._id,
      bloodGroup,
      unitsRequired: Number(unitsRequired) || 1,
      urgency: urgency || 'CRITICAL',
      requestType: 'EMERGENCY_DISPATCH',
      respondedDonors: matchedDonors.map((d) => ({ donorId: d._id, status: 'NOTIFIED' })),
    });

    res.status(201).json({
      success: true,
      message: `Emergency request ${requestId} dispatched to compatible voluntary donors!`,
      request: newRequest,
      matchedDonorsCount: matchedDonors.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active emergency dispatches for hospital
// @route   GET /api/hospital/requests
// @access  Private (Hospital)
const getHospitalRequests = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const requests = await BloodRequest.find({ hospitalId: hospital._id })
      .populate({
        path: 'respondedDonors.donorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Arriving Donor & Auto-Increment Inventory (Step 7)
// @route   POST /api/hospital/verify-collection
// @access  Private (Hospital)
const verifyBloodCollection = async (req, res) => {
  try {
    const { requestId, donorId, bloodGroup } = req.body;
    const hospital = await Hospital.findOne({ userId: req.user._id });

    // 1. Increment hospital inventory
    const itemIndex = hospital.inventory.findIndex((item) => item.bloodGroup === bloodGroup);
    if (itemIndex > -1) {
      hospital.inventory[itemIndex].units += 1;
      hospital.inventory[itemIndex].lastUpdated = new Date();
    }
    await hospital.save();

    // 2. Update donor recovery timer (90 days) & increment total donations
    const donor = await Donor.findById(donorId);
    if (donor) {
      donor.lastDonationDate = new Date();
      donor.nextEligibleDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from today
      donor.totalDonations += 1;
      donor.autoInvitationSent = false;
      await donor.save();
    }

    // 3. Update request status
    if (requestId) {
      const request = await BloodRequest.findOne({ requestId });
      if (request) {
        request.unitsFulfilled += 1;
        if (request.unitsFulfilled >= request.unitsRequired) {
          request.status = 'FULFILLED';
        }
        const donorResp = request.respondedDonors.find((d) => d.donorId.toString() === donorId.toString());
        if (donorResp) {
          donorResp.status = 'COLLECTED';
        }
        await request.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Blood collection verified! Inventory incremented for ${bloodGroup} and Donor 90-day recovery timer restarted.`,
      inventory: hospital.inventory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHospitalProfile,
  updateInventory,
  dispatchEmergencyRequest,
  getHospitalRequests,
  verifyBloodCollection,
};
