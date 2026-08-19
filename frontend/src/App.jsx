import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AttendanceCamera from './pages/AttendanceCamera';
import StudentEnrollment from './pages/StudentEnrollment';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import ReportsPage from './pages/ReportsPage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/enrollment" element={<StudentEnrollment />} />
          </Route>

          {/* Teacher Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['TEACHER']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/attendance" element={<AttendanceCamera />} />
            <Route path="/teacher/enrollment" element={<StudentEnrollment />} />
          </Route>

          {/* Student Protected Routes */}
          <Route element={<ProtectedLayout allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/history" element={<StudentDashboard />} />
          </Route>

          {/* Shared Protected Reports Route */}
          <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'TEACHER']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
