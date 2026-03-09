import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { Layers } from 'lucide-react';

const subNav = [
  { to: '/attendance/contextual', label: 'Contextual Impact',   icon: Layers },
];

export default function AttendanceLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar title="Attendance Trends" />

        {/* Sub-navigation bar */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto shadow-sm">
          {subNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'text-blue-600 border-blue-500'
                    : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Light-themed content area for attendance pages */}
        <main className="flex-1 bg-slate-50 attendance-section p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
