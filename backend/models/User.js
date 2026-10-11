import Donor from './Donor.js';
import Admin from './Admin.js';
import HospitalUser from './HospitalUser.js';

/**
 * Architecture:
 * - Donor: 'donors' collection (Donor.js)
 * - Admin: 'admins' collection (Admin.js) - stores admin credentials AND hospital details array
 * - Hospital User: 'hospital_users' collection (HospitalUser.js) - login accounts permitted by Admin
 */

export { Donor, Admin, HospitalUser, HospitalUser as Hospital };
export default { Donor, Admin, HospitalUser };
