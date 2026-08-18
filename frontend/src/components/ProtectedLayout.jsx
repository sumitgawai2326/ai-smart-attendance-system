import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ProtectedLayout = ({ allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to assigned default dashboard if trying to access unauthorized route
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
