import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Eye, EyeOff, Loader, AlertCircle, CheckCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { register as apiRegister } from '../../api/authApi';
import { saveAuth } from '../../services/authService';

const Orb = ({ className }) => (
    <div className={`absolute rounded-full opacity-20 blur-3xl pointer-events-none ${className}`} />
);

const ROLES = [
    { value: 'student', label: 'Student', icon: <GraduationCap size={16} />, desc: 'Access my learning dashboard' },
    { value: 'admin',   label: 'Admin',   icon: <Shield size={16} />,        desc: 'Manage students & analytics' },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordStrength = () => {
        const p = form.password;
        if (!p) return null;
        if (p.length < 6)  return { level: 1, label: 'Too short',  color: '#ef4444' };
        if (p.length < 8 || !/[0-9]/.test(p))  return { level: 2, label: 'Weak',  color: '#f97316' };
        if (p.length < 12) return { level: 3, label: 'Good',       color: '#eab308' };
        return               { level: 4, label: 'Strong',           color: '#22c55e' };
    };
    const strength = passwordStrength();

    const validate = () => {
        if (!form.name.trim())    return 'Name is required.';
        if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
        if (!form.email)          return 'Email is required.';
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.';
        if (!form.password)       return 'Password is required.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) return setError(err);
        setError('');
        setLoading(true);
        try {
            const data = await apiRegister(form);
            saveAuth(data);
            setSuccess(true);
            setTimeout(() => {
                navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
            style={{ background: '#020617' }}>
            <Orb className="w-[500px] h-[500px] bg-violet-600 -top-32 -right-32" />
            <Orb className="w-[400px] h-[400px] bg-emerald-600 bottom-0 left-0" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    <span className="text-white font-black text-xl">EduGuide</span>
                </Link>

                <div className="rounded-3xl p-8 border"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>

                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-black text-white mb-2">Account created!</h2>
                            <p className="text-slate-400 text-sm">Redirecting to your dashboard…</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black text-white mb-1">Create account</h1>
                            <p className="text-slate-400 text-sm mb-7">Join EduGuide and start your journey</p>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                                    <AlertCircle size={15} className="shrink-0" /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Kavindu Perera"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Min. 6 characters"
                                            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        />
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowPwd(p => !p)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {/* Strength bar */}
                                    {strength && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex gap-1 flex-1">
                                                {[1,2,3,4].map(n => (
                                                    <div key={n} className="flex-1 h-1 rounded-full transition-all"
                                                        style={{ background: n <= strength.level ? strength.color : 'rgba(255,255,255,0.08)' }} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">I am a…</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ROLES.map(r => (
                                            <button key={r.value} type="button"
                                                onClick={() => setForm(p => ({ ...p, role: r.value }))}
                                                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                                                    form.role === r.value
                                                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                                        : 'border-slate-700 bg-transparent text-slate-400 hover:border-slate-500'
                                                }`}>
                                                <span className="flex items-center gap-2 font-semibold text-sm mb-0.5">
                                                    {r.icon} {r.label}
                                                </span>
                                                <span className="text-[10px] opacity-75">{r.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                                    {loading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                    {loading ? 'Creating account…' : 'Create Account'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-slate-500 mt-6">
                                Already have an account?{' '}
                                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
