const Donor = require('../models/Donor');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');

// @desc    Get donor profile & automated 90-day eligibility status
// @route   GET /api/donor/profile
// @access  Private (Donor)
const getDonorProfile = async (req, res) => {
  try {
    let donor = await Donor.findOne({ userId: req.user._id }).populate('userId', 'name email city phone');
    if (!donor) {
      // Create if missing
      donor = await Donor.create({
        userId: req.user._id,
        bloodGroup: 'O+',
      });
      donor = await Donor.findById(donor._id).populate('userId', 'name email city phone');
    }

    // 🤖 Automated 90-Day Eligibility Re-Engagement Engine Checker
    const now = new Date();
    let isEligible = true;
    let daysRemaining = 0;

    if (donor.lastDonationDate) {
      const diffTime = Math.abs(now - new Date(donor.lastDonationDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        isEligible = false;
        daysRemaining = 90 - diffDays;
      } else {
        isEligible = true;
        donor.autoInvitationSent = true;
        await donor.save();
      }
    }

    // Fetch active requests suitable for donor
    const activeRequests = await BloodRequest.find({ status: 'ACTIVE' }).populate({
      path: 'hospitalId',
      populate: { path: 'userId', select: 'name email city address' },
    });

    res.status(200).json({
      success: true,
      donor,
      eligibility: {
        isEligible,
        daysRemaining,
        lastDonationDate: donor.lastDonationDate,
        nextEligibleDate: donor.nextEligibleDate,
        autoInvitationMsg: isEligible
          ? '🎉 Congratulations! Your 90-day recovery period is complete. You are now eligible to donate blood again! City Central Hospital welcomes your contribution.'
          : `⏳ Recovery in progress. You can donate blood again in ${daysRemaining} days.`,
      },
      activeRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Donor Availability (Available 🟢 / Busy 🔴)
// @route   PUT /api/donor/availability
// @access  Private (Donor)
const toggleAvailability = async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    donor.isAvailable = !donor.isAvailable;
    await donor.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${donor.isAvailable ? 'Available 🟢' : 'Busy 🔴'}`,
      isAvailable: donor.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Donor Responds to Emergency Alert / Schedule Visit
// @route   POST /api/donor/respond-request
// @access  Private (Donor)
const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const request = await BloodRequest.findOne({ requestId });
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const donorResp = request.respondedDonors.find((d) => d.donorId.toString() === donor._id.toString());
    if (donorResp) {
      donorResp.status = 'ACCEPTED';
      donorResp.updatedAt = new Date();
    } else {
      request.respondedDonors.push({
        donorId: donor._id,
        status: 'ACCEPTED',
        updatedAt: new Date(),
      });
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: "Response recorded! Central Hospital staff will await your arrival.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDonorProfile,
  toggleAvailability,
  respondToRequest,
};
