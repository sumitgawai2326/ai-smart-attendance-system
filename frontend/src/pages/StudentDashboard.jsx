import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { User, CheckCircle2, AlertTriangle, BookOpen, Calendar, Percent } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [user]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const studentId = user?.id || 'STU-001';
      const res = await reportAPI.getStudentSummary(studentId);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading student attendance profile...</div>;
  }

  const overall = summary?.overallPercentage || 90.0;
  const isLow = summary?.isLowAttendance || overall < 75.0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Student Attendance Portal</h2>
          <p className="text-sm text-slate-400">Welcome, {user?.name || 'Rahul Patil'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/student/profile')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <User className="w-4 h-4" /> My Profile & Documents
          </button>
        </div>
      </div>

      {/* Low Attendance Warning Alert */}
      {isLow && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-sm font-bold">Low Attendance Warning (&lt; 75%)</p>
            <p className="text-xs text-rose-300 mt-0.5">
              Your overall attendance is currently {overall}%. College rules require at least 75% attendance to qualify for term exams.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={`${overall}%`}
          icon={Percent}
          color={isLow ? 'rose' : 'emerald'}
          subtitle={isLow ? 'Below minimum 75% threshold' : 'Good attendance standing'}
        />
        <StatCard
          title="Total Lectures Attended"
          value={summary?.totalAttended || 53}
          icon={CheckCircle2}
          color="blue"
          subtitle={`Out of ${summary?.totalConducted || 60} conducted sessions`}
        />
        <StatCard
          title="Enrolled Subjects"
          value={summary?.subjectStats?.length || 3}
          icon={BookOpen}
          color="purple"
          subtitle="Current semester courses"
        />
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subject-Wise Attendance Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Attended / Total</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Progress Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {summary?.subjectStats?.map((subj) => (
                <tr key={subj.subjectId} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{subj.subjectCode}</td>
                  <td className="py-3.5 px-4 font-medium text-white">{subj.subjectName}</td>
                  <td className="py-3.5 px-4 font-mono">{subj.attended} / {subj.total}</td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold ${subj.percentage < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {subj.percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 w-48">
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          subj.percentage < 75 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${subj.percentage}%` }}
                      ></div>
                    </div>
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

export default StudentDashboard;
