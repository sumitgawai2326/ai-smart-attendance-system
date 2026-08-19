import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Camera, 
  FileText, 
  UserCheck
} from 'lucide-react';

const Sidebar = () => {
  const { role, user } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between min-h-[calc(100vh-61px)] p-4">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {role === 'ADMIN' && (
              <>
                <NavLink to="/admin" end className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                </NavLink>
                <NavLink to="/admin/enrollment" className={navItemClass}>
                  <UserCheck className="w-4 h-4" /> Student Face Enrollment
                </NavLink>
                <NavLink to="/reports" className={navItemClass}>
                  <FileText className="w-4 h-4" /> Attendance Reports
                </NavLink>
              </>
            )}

            {role === 'TEACHER' && (
              <>
                <NavLink to="/teacher" end className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" /> Teacher Dashboard
                </NavLink>
                <NavLink to="/teacher/attendance" className={navItemClass}>
                  <Camera className="w-4 h-4" /> Start AI Attendance
                </NavLink>
                <NavLink to="/teacher/manual" className={navItemClass}>
                  <FileText className="w-4 h-4" /> Manual Register
                </NavLink>
                <NavLink to="/teacher/enrollment" className={navItemClass}>
                  <UserCheck className="w-4 h-4" /> Enroll Student Face
                </NavLink>
                <NavLink to="/teacher/profile" className={navItemClass}>
                  <GraduationCap className="w-4 h-4" /> Profile & Subjects
                </NavLink>
                <NavLink to="/reports" className={navItemClass}>
                  <BookOpen className="w-4 h-4" /> Attendance Reports
                </NavLink>
              </>
            )}

            {role === 'STUDENT' && (
              <>
                <NavLink to="/student" end className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" /> Attendance Overview
                </NavLink>
                <NavLink to="/student/profile" className={navItemClass}>
                  <UserCheck className="w-4 h-4" /> My Profile & Documents
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-slate-300">Target Classroom</p>
        <p className="text-xs text-slate-400 mt-0.5">B.Tech AI & DS (Div A)</p>
        <div className="mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded inline-flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          AI Camera Ready
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
