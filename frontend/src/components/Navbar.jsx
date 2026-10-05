import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminNavbar from './navbars/AdminNavbar';
import DonorNavbar from './navbars/DonorNavbar';
import HospitalNavbar from './navbars/HospitalNavbar';

export default function Navbar({ loggedInUser, handleLogout }) {
  const location = useLocation();

  // Route /admin or /admin/login -> AdminNavbar ONLY
  if (location.pathname.startsWith('/admin')) {
    return <AdminNavbar user={loggedInUser} onLogout={handleLogout} />;
  }

  // Route /hospital -> HospitalNavbar ONLY
  if (location.pathname.startsWith('/hospital')) {
    return <HospitalNavbar user={loggedInUser} onLogout={handleLogout} />;
  }

  // Route / -> DonorNavbar ONLY
  return <DonorNavbar user={loggedInUser} onLogout={handleLogout} />;
}
