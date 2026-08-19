import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Shield, Loader2, Info, X, HelpCircle, Server, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      if (res.role === 'ADMIN') navigate('/admin');
      else if (res.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Login failed');
    }
  };

  const fillQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Help Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setShowHelpModal(true)}
          className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg transition-all"
        >
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>System Help & Guide</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/25">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Smart Attendance AI</h2>
          <p className="text-sm text-slate-400 mt-1">College Portal & Face Recognition System</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. teacher@college.edu"
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connecting to Cloud Backend...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
            Quick Role Demo Access (Optional)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillQuickLogin('admin@college.edu')}
              className="px-2.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-[11px] font-medium text-purple-300 transition-all flex flex-col items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={() => fillQuickLogin('teacher@college.edu')}
              className="px-2.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-[11px] font-medium text-blue-300 transition-all flex flex-col items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Teacher
            </button>
            <button
              onClick={() => fillQuickLogin('student@college.edu')}
              className="px-2.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-[11px] font-medium text-emerald-300 transition-all flex flex-col items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Student
            </button>
          </div>
        </div>
      </div>

      {/* Interactive System Help / Info Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">System Guide & FAQ</h3>
                  <p className="text-xs text-slate-400">Everything you need to know about the AI Attendance Portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Cloud Server Spin-up Notice */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-300 font-semibold">
                  <Server className="w-4 h-4" />
                  <span>Cloud Container Status</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The AI backend is hosted on a secure cloud server. If the system was idle, the first request may take <strong className="text-white">~15–20 seconds</strong> to spin up. Subsequent requests respond in milliseconds!
                </p>
              </div>

              {/* Portal Roles */}
              <div className="space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">User Roles & Portals</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="font-semibold text-blue-400">👨‍🏫 Faculty Teacher:</span>
                    <p className="text-slate-400">Start attendance sessions with multi-student live webcam recognition, view attendance logs, and manual override.</p>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="font-semibold text-purple-400">🛡️ Administrator:</span>
                    <p className="text-slate-400">Manage student directory, edit/delete students, register faculty teachers, and configure classes/subjects.</p>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
                    <span className="font-semibold text-emerald-400">🎓 Student:</span>
                    <p className="text-slate-400">Check personal attendance percentage, view subject attendance progress, and get low-attendance alerts.</p>
                  </div>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="space-y-2">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Quick Demo Accounts</p>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                  <p><span className="text-blue-400">Teacher:</span> teacher@college.edu / password123</p>
                  <p><span className="text-purple-400">Admin:</span> admin@college.edu / password123</p>
                  <p><span className="text-emerald-400">Student:</span> student@college.edu / password123</p>
                </div>
              </div>

              {/* Camera Security Tips */}
              <div className="space-y-1 text-slate-400">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">📷 Camera & Face Recognition Tips</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ensure good lighting facing your camera.</li>
                  <li>Allow camera permissions when prompted by your browser.</li>
                  <li>Before starting attendance, enroll your face under <strong>Student Face Enrollment</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Got it, let me sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
