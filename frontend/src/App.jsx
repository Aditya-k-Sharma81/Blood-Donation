import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './components/Navbar';
import DonorAuth from './components/DonorAuth';
import AdminLogin from './components/AdminLogin';
import HospitalLogin from './components/HospitalLogin';
import DonorPage from './pages/DonorPage';
import AdminPage from './pages/AdminPage';
import HospitalPage from './pages/HospitalPage';
import HospitalAppointmentsPage from './pages/HospitalAppointmentsPage';
import HospitalSignUpPage from './pages/HospitalSignUpPage';
import AdminProfilePage from './pages/AdminProfilePage';
import StaffManagementPage from './pages/StaffManagementPage';
import DonorProfilePage from './pages/DonorProfilePage';
import AppointmentPage from './pages/AppointmentPage';
import MyBookingsPage from './pages/MyBookingsPage';
import useDonorAutoLocation from './hooks/useDonorAutoLocation';

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rakt_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('rakt_user', JSON.stringify(user));
  };

  // Background Auto-sync GPS location every 5 minutes for logged-in donors
  const autoLocation = useDonorAutoLocation(loggedInUser, handleLoginSuccess);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of your portal session.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#0f172a',
      iconColor: '#e11d48',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoggedInUser(null);
        localStorage.removeItem('rakt_user');

        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been logged out successfully.',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#0f172a',
          iconColor: '#10b981',
        });
      }
    });
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar loggedInUser={loggedInUser} handleLogout={handleLogout} autoLocation={autoLocation} />

        <main className="flex-1 flex justify-center items-center p-6 md:p-10">
          <Routes>
            {/* / -> Donor Portal */}
            <Route
              path="/"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <DonorPage user={loggedInUser} onLogout={handleLogout} autoLocation={autoLocation} />
                ) : (
                  <DonorAuth onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            {/* /profile and /donor/profile -> Voluntary Donor Profile Setup */}
            <Route
              path="/profile"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <DonorProfilePage
                    user={loggedInUser}
                    onUserUpdate={handleLoginSuccess}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/donor/profile"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <DonorProfilePage
                    user={loggedInUser}
                    onUserUpdate={handleLoginSuccess}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* /appointment and /appointments -> Blood Donation Appointment Booking */}
            <Route
              path="/appointment"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <AppointmentPage user={loggedInUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/appointments"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <AppointmentPage user={loggedInUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* /my-bookings and /bookings -> Donor's Dedicated Appointments & Booking Details Page */}
            <Route
              path="/my-bookings"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <MyBookingsPage user={loggedInUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/bookings"
              element={
                loggedInUser && loggedInUser.role === 'DONOR' ? (
                  <MyBookingsPage user={loggedInUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* /admin/login -> Standalone Admin Login Form */}
            <Route
              path="/admin/login"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <Navigate to={new URLSearchParams(window.location.search).get('redirect') || '/admin'} replace />
                ) : (
                  <AdminLogin onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            {/* /admin -> Shows "this is admin page" when logged in */}
            <Route
              path="/admin"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <AdminPage user={loggedInUser} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />

            {/* /admin/hospital-signup -> Full-page Hospital Sign Up Form for Admin */}
            <Route
              path="/admin/hospital-signup"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <HospitalSignUpPage user={loggedInUser} />
                ) : (
                  <Navigate to="/admin/login" replace />
                )
              }
            />

            {/* /admin/profile -> Admin Profile Setup Form (Tasks 1, 2, 3) */}
            <Route
              path="/admin/profile"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <AdminProfilePage
                    user={loggedInUser}
                    onUserUpdate={handleLoginSuccess}
                  />
                ) : (
                  <Navigate to="/admin/login?redirect=/admin/profile" replace />
                )
              }
            />

            {/* /staff and /admin/staff -> Staff Directory & Permission Control */}
            <Route
              path="/staff"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <StaffManagementPage user={loggedInUser} />
                ) : (
                  <Navigate to="/admin/login?redirect=/staff" replace />
                )
              }
            />
            <Route
              path="/admin/staff"
              element={
                loggedInUser && loggedInUser.role === 'ADMIN' ? (
                  <StaffManagementPage user={loggedInUser} />
                ) : (
                  <Navigate to="/admin/login?redirect=/admin/staff" replace />
                )
              }
            />

            {/* /hospital -> Hospital UI Login and Post-Login Hospital Page */}
            <Route
              path="/hospital"
              element={
                loggedInUser && (loggedInUser.role === 'HOSPITAL' || loggedInUser.role === 'ADMIN') ? (
                  <HospitalPage user={loggedInUser} onLogout={handleLogout} />
                ) : (
                  <HospitalLogin onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            {/* /hospital/appointments -> Hospital Appointments Overview & Verification */}
            <Route
              path="/hospital/appointments"
              element={
                loggedInUser && (loggedInUser.role === 'HOSPITAL' || loggedInUser.role === 'ADMIN') ? (
                  <HospitalAppointmentsPage user={loggedInUser} onLogout={handleLogout} />
                ) : (
                  <HospitalLogin onLoginSuccess={handleLoginSuccess} />
                )
              }
            />
            <Route
              path="/hospital/appointment"
              element={
                loggedInUser && (loggedInUser.role === 'HOSPITAL' || loggedInUser.role === 'ADMIN') ? (
                  <HospitalAppointmentsPage user={loggedInUser} onLogout={handleLogout} />
                ) : (
                  <HospitalLogin onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            {/* Catch-all redirect to / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
