import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Target,
  Activity,
  CalendarCheck,
  Shield,
  LogOut
} from 'lucide-react';
import { clearAuth, getUser, isAdmin } from '../services/authService';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const navItems = [
    { name: 'Learning Path',      icon: <Home          size={20} />, path: '/add-student' },
    { name: 'Risk Predictor',     icon: <Target        size={20} />, path: '/risk-predictor' },
    { name: 'Stress Prediction',  icon: <Activity      size={20} />, path: '/stress' },
    { name: 'Attendance Trends',  icon: <CalendarCheck size={20} />, path: '/attendance' },
  ];

  const handleSignOut = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-white flex flex-col z-20">
      <div className="flex items-center gap-3 p-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-none">EduGuide</h2>
          <span className="text-xs text-slate-400">Grade 11 • Sri Lanka</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <Shield size={20} />
            <span className="text-sm font-medium">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-500 text-[10px] truncate capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center w-full gap-3 px-4 py-2.5 transition-all rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
