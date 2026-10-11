import HospitalUser from './HospitalUser.js';

/**
 * Hospital Architecture:
 * 1. Hospital Login Permission Accounts -> Handled by HospitalUser ('hospital_users' collection).
 *    Admin gives permission for login (isPermitted: true, permittedBy: Admin._id).
 * 2. Hospital Details (name, license, contact, address) -> Saved directly inside Admin schema ('admins' collection under `admin.hospitals`).
 */

export { HospitalUser };
export default HospitalUser;
