import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Target,
  Activity,
  Settings,
  LogOut,
  CalendarCheck
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Learning Path', icon: <Home size={20} />, path: '/' },
    { name: 'Risk Predictor', icon: <Target size={20} />, path: '/risk-predictor' },
    { name: 'Stress Prediction', icon: <Activity size={20} />, path: '/stress' },
    { name: 'Attendance Trends', icon: <CalendarCheck size={20} />, path: '/attendance-analyze' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-white flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
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
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-6 border-t border-slate-800 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </NavLink>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
