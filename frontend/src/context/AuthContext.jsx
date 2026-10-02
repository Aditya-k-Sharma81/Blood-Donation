import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginDonor = async (email, password) => {
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password, expectedRole: 'DONOR' });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Donor Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const signupDonor = async (donorData) => {
    setError(null);
    try {
      const res = await API.post('/auth/donor/signup', donorData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role: 'DONOR' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Donor Signup failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const loginAdmin = async (email, password) => {
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password, expectedRole: 'ADMIN' });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Admin Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const loginHospital = async (email, password) => {
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password, expectedRole: 'HOSPITAL' });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Hospital Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        loginDonor,
        signupDonor,
        loginAdmin,
        loginHospital,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
