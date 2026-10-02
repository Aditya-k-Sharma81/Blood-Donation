import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 10px auto', width: '20px', height: '20px' }}></div>
          <div>Verifying credentials & session...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (allowedRoles.includes('ADMIN')) return <Navigate to="/admin/login" replace />;
    if (allowedRoles.includes('HOSPITAL')) return <Navigate to="/hospital/login" replace />;
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'HOSPITAL') return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'DONOR') return <Navigate to="/donor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
