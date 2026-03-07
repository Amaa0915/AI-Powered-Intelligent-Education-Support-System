import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users, BookOpen, Shield, TrendingUp, AlertTriangle, LogOut,
    Trash2, ChevronDown, Loader, RefreshCw, UserCheck, UserX,
    BarChart2, Activity, Brain, Calendar, Search, X, Home
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { adminGetUsers, adminGetStats, adminDeleteUser, adminUpdateRole } from '../../api/authApi';
import { getUser, clearAuth, isAdmin } from '../../services/authService';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border px-3 py-2 text-xs shadow-xl"
            style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.08)' }}>
            {label && <p className="text-slate-300 font-semibold mb-1">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.fill }} className="flex gap-3 justify-between">
                    <span>{p.name}:</span>
                    <span className="font-bold text-white">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

// ── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="rounded-2xl p-5 border flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <span style={{ color }}>{icon}</span>
        </div>
        <div>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ── Role badge ────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        role === 'admin'
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
    }`}>{role}</span>
);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const me = getUser();

    const [users, setUsers]   = useState([]);
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [prompting, setPrompting] = useState(null); // id for role change confirm
    const [error, setError]   = useState('');

    const load = async () => {
        setLoading(true); setError('');
        try {
            const [u, s] = await Promise.all([adminGetUsers(), adminGetStats()]);
            setUsers(u);
            setStats(s);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleLogout = () => {
        clearAuth();
        navigate('/login', { replace: true });
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await adminDeleteUser(id);
            setUsers(prev => prev.filter(u => u._id !== id));
            setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed.');
        } finally {
            setDeleting(null);
        }
    };

    const handleRoleToggle = async (user) => {
        const newRole = user.role === 'admin' ? 'student' : 'admin';
        try {
            const updated = await adminUpdateRole(user._id, newRole);
            setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
        } catch (err) {
            setError(err.response?.data?.error || 'Role update failed.');
        } finally {
            setPrompting(null);
        }
    };

    // Charts data
    const roleData = stats ? [
        { name: 'Students', value: stats.students },
        { name: 'Admins',   value: stats.admins },
    ] : [];

    // Sign-up trend: last 7 days (simulated from createdAt dates)
    const signupTrend = (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = users.filter(u => {
                const c = new Date(u.createdAt);
                return c.toDateString() === d.toDateString();
            }).length;
            days.push({ label, count });
        }
        return days;
    })();

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const navItems = [
        { label: 'Learning Path',     path: '/add-student',    icon: <Home size={16} /> },
        { label: 'Risk Predictor',    path: '/risk-predictor', icon: <AlertTriangle size={16} /> },
        { label: 'Attendance',        path: '/attendance',   icon: <Calendar size={16} /> },
        { label: 'Stress Prediction', path: '/stress',       icon: <Activity size={16} /> },
    ];

    return (
        <div className="min-h-screen flex" style={{ background: '#020617' }}>
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-20 border-r"
                style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Shield size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-none">Admin Panel</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">EduGuide</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 pt-4 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Admin</p>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 text-sm font-medium">
                        <Users size={16} /> User Management
                    </div>

                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mt-4 mb-2">Student Tools</p>
                    {navItems.map(n => (
                        <Link key={n.path} to={n.path}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">
                            {n.icon} {n.label}
                        </Link>
                    ))}
                </nav>

                {/* Me card */}
                <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {me?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{me?.name || 'Admin'}</p>
                            <p className="text-slate-500 text-[10px] truncate">{me?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                        <LogOut size={13} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 ml-60 p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Manage users and monitor platform analytics.</p>
                    </div>
                    <button onClick={load}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        <AlertTriangle size={15} /> {error}
                        <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader size={28} className="animate-spin text-slate-500" />
                    </div>
                ) : (
                    <>
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={<Users size={20} />}     label="Total Users"    value={stats?.total ?? 0}          color="#10b981" />
                            <StatCard icon={<BookOpen size={20} />}  label="Students"       value={stats?.students ?? 0}        color="#06b6d4" />
                            <StatCard icon={<Shield size={20} />}    label="Admins"         value={stats?.admins ?? 0}          color="#8b5cf6" />
                            <StatCard icon={<TrendingUp size={20} />} label="New This Week" value={stats?.recentSignups ?? 0}  color="#f59e0b" sub="Last 7 days" />
                        </div>

                        {/* Charts row */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Signups trend */}
                            <div className="lg:col-span-2 rounded-2xl p-5 border"
                                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                                    <TrendingUp size={15} className="text-emerald-400" /> Signups — Last 7 Days
                                </h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={signupTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                                        <Tooltip content={<CT />} />
                                        <Bar dataKey="count" name="Signups" fill="#10b981" radius={[4,4,0,0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Role donut */}
                            <div className="rounded-2xl p-5 border"
                                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                                    <Users size={15} className="text-violet-400" /> Role Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                                            dataKey="value" nameKey="name" paddingAngle={4}>
                                            {roleData.map((_, i) => (
                                                <Cell key={i} fill={['#10b981','#8b5cf6'][i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CT />} />
                                        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* User table */}
                        <div className="rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    <Users size={15} className="text-cyan-400" /> All Users ({users.length})
                                </h3>
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search users…"
                                        className="pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', width: 200 }}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <th className="text-left px-5 py-3">User</th>
                                            <th className="text-left px-5 py-3">Email</th>
                                            <th className="text-left px-5 py-3">Role</th>
                                            <th className="text-left px-5 py-3">Joined</th>
                                            <th className="text-left px-5 py-3">Auth</th>
                                            <th className="text-right px-5 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No users found.</td></tr>
                                        ) : filtered.map(u => (
                                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                                className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                            style={{ background: u.role === 'admin' ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
                                                            {u.avatar
                                                                ? <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                                : u.name[0]?.toUpperCase()}
                                                        </div>
                                                        <span className="text-white font-medium text-sm">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 text-xs">{u.email}</td>
                                                <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                                                <td className="px-5 py-3 text-slate-500 text-xs">
                                                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-500">
                                                    {u.googleId ? '🔵 Google' : '🔑 Email'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Toggle role */}
                                                        <button
                                                            onClick={() => handleRoleToggle(u)}
                                                            className={`p-1.5 rounded-lg transition-colors ${u.role === 'admin' ? 'text-violet-400 hover:bg-violet-500/15' : 'text-emerald-400 hover:bg-emerald-500/15'}`}
                                                            title={u.role === 'admin' ? 'Demote to student' : 'Promote to admin'}>
                                                            {u.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
                                                        </button>
                                                        {/* Delete */}
                                                        {u._id !== me?.id && (
                                                            <button onClick={() => handleDelete(u._id)} disabled={deleting === u._id}
                                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-40"
                                                                title="Delete user">
                                                                {deleting === u._id
                                                                    ? <Loader size={13} className="animate-spin" />
                                                                    : <Trash2 size={13} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Feature summary cards */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Risk Predictor',   sub: 'ML-based academic risk', icon: <AlertTriangle size={18} />, color: '#ef4444', path: '/risk-predictor' },
                                { label: 'Attendance AI',    sub: 'ARIMA forecasting',        icon: <Activity size={18} />,       color: '#06b6d4', path: '/attendance' },
                                { label: 'Learning Paths',   sub: 'Adaptive curriculum',      icon: <Brain size={18} />,          color: '#10b981', path: '/add-student' },
                                { label: 'Stress Monitor',   sub: 'Wellbeing prediction',     icon: <BarChart2 size={18} />,      color: '#f59e0b', path: '/stress' },
                            ].map(c => (
                                <Link key={c.label} to={c.path}
                                    className="rounded-2xl p-5 border flex items-center gap-3 group hover:-translate-y-0.5 transition-all"
                                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: `${c.color}15`, border: `1px solid ${c.color}25`, color: c.color }}>
                                        {c.icon}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold group-hover:text-emerald-300 transition-colors">{c.label}</p>
                                        <p className="text-slate-500 text-[11px]">{c.sub}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
