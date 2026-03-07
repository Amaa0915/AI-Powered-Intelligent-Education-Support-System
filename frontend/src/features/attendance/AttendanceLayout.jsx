import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import {
  LayoutDashboard, Users, AlertTriangle,
  TrendingUp, Brain, Layers
} from 'lucide-react';

const subNav = [
  { to: '/attendance',            label: 'Dashboard',           icon: LayoutDashboard, end: true },
  { to: '/attendance/students',   label: 'Students',            icon: Users },
  { to: '/attendance/anomalies',  label: 'Anomaly Report',      icon: AlertTriangle },
  { to: '/attendance/trends',     label: 'Trends & Analytics',  icon: TrendingUp },
  { to: '/attendance/forecast',   label: 'AI Forecasting',      icon: Brain },
  { to: '/attendance/contextual', label: 'Contextual Impact',   icon: Layers },
];

export default function AttendanceLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar title="Attendance Trends" />

        {/* Sub-navigation bar */}
        <div className="bg-[#0f172a] border-b border-slate-700/60 px-6 flex gap-1 overflow-x-auto">
          {subNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-500'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Dark-themed content area for attendance pages */}
        <main className="flex-1 bg-[#0f172a] attendance-section p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
