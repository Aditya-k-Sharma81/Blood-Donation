const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

const seedInitialData = async () => {
  try {
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    
    // Seed / Ensure admin@gmail.com exists
    await User.findOneAndUpdate(
      { email: 'admin@gmail.com' },
      { name: 'System Admin', password: hashedPasswordAdmin, role: 'ADMIN', city: 'Central City' },
      { upsert: true, new: true }
    );

    // Seed / Ensure admin@email.com exists as well for convenience
    await User.findOneAndUpdate(
      { email: 'admin@email.com' },
      { name: 'System Admin', password: hashedPasswordAdmin, role: 'ADMIN', city: 'Central City' },
      { upsert: true, new: true }
    );

    console.log('✅ Seeded System Admin accounts: admin@gmail.com & admin@email.com / admin123');

    // 2. Seed Default Central Hospital Node if not exists
    const hospitalExists = await User.findOne({ role: 'HOSPITAL' });
    if (!hospitalExists) {
      const hashedPasswordHosp = await bcrypt.hash('hospital123', 10);
      const hospitalUser = await User.create({
        name: 'City Central Hospital Staff',
        email: 'hospital@centralbank.org',
        password: hashedPasswordHosp,
        role: 'HOSPITAL',
        city: 'City Central',
        address: '124 Healthcare Avenue, Medical District',
      });

      await Hospital.create({
        userId: hospitalUser._id,
        hospitalName: 'City Central Hospital & Blood Bank',
        licenseNumber: 'HOSP-8849-VERIFIED',
        location: { lat: 30.901, lng: 75.857 },
        inventory: [
          { bloodGroup: 'A+', units: 22 },
          { bloodGroup: 'A-', units: 10 },
          { bloodGroup: 'B+', units: 18 },
          { bloodGroup: 'B-', units: 7 },
          { bloodGroup: 'O+', units: 30 },
          { bloodGroup: 'O-', units: 3 }, // Critical shortage trigger
          { bloodGroup: 'AB+', units: 15 },
          { bloodGroup: 'AB-', units: 5 },
        ],
      });
      console.log('✅ Seeded Central Hospital user: hospital@centralbank.org / hospital123');
    }

    // 3. Seed Default Voluntary Donor if not exists
    const donorExists = await User.findOne({ role: 'DONOR' });
    if (!donorExists) {
      const hashedPasswordDonor = await bcrypt.hash('donor123', 10);
      const donorUser = await User.create({
        name: 'John Donor',
        email: 'donor@example.com',
        password: hashedPasswordDonor,
        role: 'DONOR',
        city: 'City Central',
      });

      // 95 days ago to trigger auto 90-day eligibility!
      const past95Days = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);

      await Donor.create({
        userId: donorUser._id,
        bloodGroup: 'O-',
        lastDonationDate: past95Days,
        nextEligibleDate: new Date(past95Days.getTime() + 90 * 24 * 60 * 60 * 1000),
        autoInvitationSent: true,
        isAvailable: true,
        totalDonations: 4,
        location: { lat: 30.908, lng: 75.852 },
      });
      console.log('✅ Seeded initial Voluntary Donor user: donor@example.com / donor123');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

module.exports = seedInitialData;
