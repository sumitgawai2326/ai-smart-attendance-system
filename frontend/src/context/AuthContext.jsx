import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('attendance_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem('attendance_role') || null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('attendance_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-warm backend container in background on initial page load
    authAPI.wakeUp();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const data = response.data;
      
      setUser(data.user);
      setRole(data.role);
      setToken(data.token);

      localStorage.setItem('attendance_user', JSON.stringify(data.user));
      localStorage.setItem('attendance_role', data.role);
      localStorage.setItem('attendance_token', data.token);

      return data;
    } catch (err) {
      if (err.response?.data?.detail) {
        throw err.response.data.detail;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw 'Cloud server is waking up from standby (Render spin-up takes ~20s on first load). Please wait a moment and click Sign In again.';
      } else if (!err.response) {
        throw 'Connecting to cloud backend... If the server was idle, it takes a few seconds to wake up. Please click Sign In again in a few moments.';
      } else if (err.response?.status === 401) {
        throw 'Invalid email or password. Please check your credentials.';
      } else {
        throw 'Authentication failed. Please verify credentials or try again.';
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem('attendance_user');
    localStorage.removeItem('attendance_role');
    localStorage.removeItem('attendance_token');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
