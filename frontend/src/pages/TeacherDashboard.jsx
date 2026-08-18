import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { Camera, Users, School, BookOpen, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Faculty Teacher Portal</h2>
          <p className="text-sm text-slate-400">Welcome back, {user?.name || 'Prof. Faculty'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4" /> Start AI Attendance Session
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Assigned Classes" value="1" icon={School} color="blue" subtitle="B.Tech AI & DS (Div A)" />
        <StatCard title="Assigned Subjects" value="3" icon={BookOpen} color="purple" subtitle="DSA, DBMS, AI" />
        <StatCard title="Total Students" value="32" icon={Users} color="emerald" subtitle="Registered in class" />
        <StatCard title="Average Class Attendance" value="88.5%" icon={UserCheck} color="amber" subtitle="Monthly average" />
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Live AI Facial Attendance Camera</h3>
            <p className="text-xs text-slate-400">
              Open webcam feed to automatically identify students, verify liveness anti-spoofing, and log attendance in real-time.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <span>Launch Attendance Camera</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Student Face Registration</h3>
            <p className="text-xs text-slate-400">
              Enroll new student faces with multi-angle capture guidance to update AI recognition vector templates.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/enrollment')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <span>Enroll Student Face</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
