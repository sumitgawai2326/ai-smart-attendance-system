import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { 
  Camera, 
  Users, 
  School, 
  BookOpen, 
  UserCheck, 
  ArrowRight, 
  ClipboardList, 
  User, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, subjectAPI } from '../services/api';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [stRes, sbRes] = await Promise.all([
        studentAPI.list('CLS-AIDS-3A'),
        subjectAPI.list('CLS-AIDS-3A')
      ]);
      setStudents(stRes.data);
      setSubjects(sbRes.data);
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Faculty Teacher Portal</h2>
          <p className="text-sm text-slate-400">Welcome back, {user?.name || 'Prof. Alan Turing'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4" /> AI Face Camera
          </button>
          <button
            onClick={() => navigate('/teacher/manual')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
          >
            <ClipboardList className="w-4 h-4 text-emerald-400" /> Manual Register
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Classes" value="1" icon={School} color="blue" subtitle="B.Tech AI & DS (Div A)" />
        <StatCard title="Assigned Subjects" value={subjects.length || 3} icon={BookOpen} color="purple" subtitle="Active curriculum courses" />
        <StatCard title="Enrolled Students" value={students.length || 32} icon={Users} color="emerald" subtitle={`${students.filter(s => s.hasFaceEnrolled).length} with AI Face Enrolled`} />
        <StatCard title="Average Class Attendance" value="88.5%" icon={UserCheck} color="amber" subtitle="Current term average" />
      </div>

      {/* Command Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Camera Attendance */}
        <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Live AI Attendance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-student facial detection, blink liveness verification, and real-time auto marking.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <span>Launch AI Camera</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Manual Attendance Register */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Manual Register</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No webcam mode fallback • Roll-call roster, batch marking, and lecture topic notes.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/manual')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <span>Open Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Subjects & Curriculum */}
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Subjects & Courses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add new subjects, configure class curriculum, and manage assigned course codes.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/profile')}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
          >
            <span>Manage Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Faculty Profile */}
        <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Faculty Profile</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage personal credentials, office consultation hours, cabin location, and qualifications.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/profile')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            <span>View Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Classroom Student Directory & Biometric Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Classroom Student Directory</h3>
            <p className="text-xs text-slate-400">Class: B.Tech AI & DS (Div A) • {students.length} Students Registered</p>
          </div>
          <button
            onClick={() => navigate('/teacher/enrollment')}
            className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <UserCheck className="w-4 h-4" /> Enroll Student Face
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Branch & Year</th>
                <th className="py-3 px-4">AI Biometrics</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {students.slice(0, 6).map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-semibold text-white">{s.rollNumber}</td>
                  <td className="py-3 px-4 font-medium text-white">{s.name}</td>
                  <td className="py-3 px-4 text-slate-400">{s.email}</td>
                  <td className="py-3 px-4">{s.branch} - {s.year}</td>
                  <td className="py-3 px-4">
                    {s.hasFaceEnrolled ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/teacher/manual')}
                      className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 bg-blue-500/10 rounded-lg"
                    >
                      Mark / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
