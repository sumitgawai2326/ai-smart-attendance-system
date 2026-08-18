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
      throw err.response?.data?.detail || 'Authentication failed. Check your credentials.';
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
