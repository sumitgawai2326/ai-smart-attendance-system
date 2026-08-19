import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Camera, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Shield, Loader2, Info, X, HelpCircle, Server, CheckCircle2, KeyRound, Smartphone, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email Input, 2: OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ text: '', type: '', generatedOtp: '' });

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

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotMessage({ text: '', type: '', generatedOtp: '' });

    try {
      const res = await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage({
        text: `✓ 6-Digit OTP verification code sent to ${res.data.maskedTarget || forgotEmail}!`,
        type: 'success',
        generatedOtp: res.data.otp || ''
      });
      setForgotStep(2);
    } catch (err) {
      setForgotMessage({
        text: err.response?.data?.detail || 'Failed to send OTP. Please verify email address.',
        type: 'error',
        generatedOtp: ''
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotMessage({ text: 'Passwords do not match. Please re-enter.', type: 'error', generatedOtp: forgotMessage.generatedOtp });
      return;
    }
    if (newPassword.length < 4) {
      setForgotMessage({ text: 'Password must be at least 4 characters.', type: 'error', generatedOtp: forgotMessage.generatedOtp });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authAPI.resetPassword(forgotEmail.trim(), otpCode.trim(), newPassword);
      setForgotMessage({
        text: '✓ Password updated successfully! Please sign in with your new password.',
        type: 'success',
        generatedOtp: ''
      });
      // Fill email in login form
      setEmail(forgotEmail);
      setPassword('');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setForgotMessage({
        text: err.response?.data?.detail || 'Failed to reset password. Please check OTP code.',
        type: 'error',
        generatedOtp: forgotMessage.generatedOtp
      });
    } finally {
      setForgotLoading(false);
    }
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

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                name="user_email_login_field"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (e.g. teacher@college.edu)"
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotMessage({ text: '', type: '', generatedOtp: '' });
                  setShowForgotModal(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                name="user_pwd_login_field"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="new-password"
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

      {/* Forgot Password / OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Verify via 6-digit OTP sent to your email</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotMessage.text && (
              <div className={`p-3.5 rounded-xl text-xs font-medium space-y-1.5 ${
                forgotMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <p>{forgotMessage.text}</p>
                {forgotMessage.generatedOtp && (
                  <div className="mt-2 p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300">Your Verification OTP:</span>
                    <span className="font-mono font-bold text-sm tracking-widest text-white bg-emerald-600 px-2 py-0.5 rounded">
                      {forgotMessage.generatedOtp}
                    </span>
                  </div>
                )}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Enter Registered Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. teacher@college.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white tracking-widest focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify OTP & Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
