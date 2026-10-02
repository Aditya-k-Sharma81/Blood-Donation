import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import DonorHeader from './components/DonorHeader';
import AdminHeader from './components/AdminHeader';
import HospitalHeader from './components/HospitalHeader';

import DonorAuth from './pages/DonorAuth';
import AdminLogin from './pages/AdminLogin';
import HospitalLogin from './pages/HospitalLogin';

import DonorDashboard from './pages/DonorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HospitalDashboard from './pages/HospitalDashboard';

// Isolated Layout Component for Voluntary Donor
function DonorLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DonorHeader />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

// Isolated Layout Component for Admin (/admin/...)
function AdminLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

// Isolated Layout Component for Central Hospital (/hospital/...)
function HospitalLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HospitalHeader />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🩸 1. DONOR PORTAL (Route '/') */}
          <Route element={<DonorLayout />}>
            <Route path="/" element={<DonorAuth />} />
            <Route
              path="/donor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DONOR']}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 👨‍💼 2. ADMIN PORTAL (Route '/admin/...') */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="login" element={<AdminLogin />} />
            <Route index element={<Navigate to="/admin/login" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 🏥 3. HOSPITAL PORTAL (Route '/hospital/...') */}
          <Route path="/hospital" element={<HospitalLayout />}>
            <Route path="login" element={<HospitalLogin />} />
            <Route index element={<Navigate to="/hospital/login" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['HOSPITAL']}>
                  <HospitalDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback redirect to Donor route '/' */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
