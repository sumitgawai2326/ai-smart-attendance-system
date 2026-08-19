import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { User, CheckCircle2, AlertTriangle, BookOpen, Calendar, Percent, Loader2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, [user]);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const studentId = user?.id || user?.email || 'STU-001';
      const res = await reportAPI.getStudentSummary(studentId);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load real-time attendance records for this student account.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading Attendance Profile from cloud database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Student Record Not Found</h3>
        <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const overall = summary?.overallPercentage ?? 0.0;
  const totalConducted = summary?.totalConducted ?? 0;
  const totalAttended = summary?.totalAttended ?? 0;
  const isLow = summary?.isLowAttendance && totalConducted > 0;
  const subjectStats = summary?.subjectStats || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Student Attendance Portal</h2>
          <p className="text-sm text-slate-400">
            Welcome, <span className="text-slate-200 font-semibold">{summary?.student?.name || user?.name}</span> • Roll: {summary?.student?.rollNumber || 'Enrolled'}
          </p>
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

      {/* Authoritative Real-Time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={totalConducted > 0 ? `${overall}%` : 'No sessions yet'}
          icon={Percent}
          color={isLow ? 'rose' : (totalConducted > 0 ? 'emerald' : 'blue')}
          subtitle={totalConducted > 0 ? (isLow ? 'Below minimum 75% threshold' : 'Good attendance standing') : '0 conducted sessions'}
        />
        <StatCard
          title="Lectures Attended"
          value={totalAttended}
          icon={CheckCircle2}
          color="blue"
          subtitle={totalConducted > 0 ? `Out of ${totalConducted} conducted sessions` : 'No sessions conducted'}
        />
        <StatCard
          title="Enrolled Subjects"
          value={subjectStats.length}
          icon={BookOpen}
          color="purple"
          subtitle="Curriculum semester courses"
        />
      </div>

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subject-Wise Attendance Breakdown</h3>

        {subjectStats.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No subjects registered for this class yet.</p>
          </div>
        ) : (
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
                {subjectStats.map((subj) => (
                  <tr key={subj.subjectId} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{subj.subjectCode}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{subj.subjectName}</td>
                    <td className="py-3.5 px-4 font-mono">{subj.attended} / {subj.total}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${subj.total > 0 && subj.percentage < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {subj.total > 0 ? `${subj.percentage}%` : '0%'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 w-48">
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            subj.total > 0 && subj.percentage < 75 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
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
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
