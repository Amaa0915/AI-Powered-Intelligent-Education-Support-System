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
    { name: 'Attendance Trends',  icon: <CalendarCheck size={20} />, path: '/attendance/contextual' },
  ].filter(item => !['Dashboard', 'Students', 'Anomaly Report', 'Trends & Analytics', 'AI Forecasting'].includes(item.name));

  const handleSignOut = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const C = { navy: '#272343', white: '#FFFFFF', mint: '#BAE8E8' };

  return (
    <div className="fixed inset-y-0 left-0 w-64 flex flex-col z-20"
        style={{ background: C.navy }}>
      <div className="flex items-center gap-3 p-6">
        <a href="/" className="flex items-center gap-2">
          <img src="/src/assets/images/EduGuidelogo11.png" alt="EduGuide Logo" className="h-10 w-auto rounded-lg shadow-md" />
          <span className="text-lg font-bold leading-none" style={{ color: C.white }}>EduGuide</span>
        </a>
        <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Grade 11 • Sri Lanka</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={({ isActive }) => ({
              background: isActive ? C.mint : 'transparent',
              color: isActive ? C.navy : 'rgba(255,255,255,0.65)',
            })}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <NavLink
            to="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={({ isActive }) => ({
              background: isActive ? C.mint : 'transparent',
              color: isActive ? C.navy : 'rgba(255,255,255,0.65)',
            })}
          >
            <Shield size={20} />
            <span className="text-sm font-medium">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full shrink-0"
                style={{ background: C.mint, color: C.navy }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: C.white }}>{user.name}</p>
              <p className="text-[10px] truncate capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center w-full gap-3 px-4 py-2.5 transition-all rounded-xl"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
