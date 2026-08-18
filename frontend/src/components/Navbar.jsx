import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Camera, School } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = (r) => {
    switch (r) {
      case 'ADMIN':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'TEACHER':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1"><School className="w-3 h-3" /> Faculty / Teacher</span>;
      case 'STUDENT':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1"><User className="w-3 h-3" /> Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
            Smart Attendance AI
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Department of AI & Data Science</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            {getRoleBadge(role)}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
