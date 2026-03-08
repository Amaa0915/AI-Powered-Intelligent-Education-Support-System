import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Eye, EyeOff, Loader, AlertCircle, CheckCircle, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { register as apiRegister } from '../../api/authApi';
import { saveAuth } from '../../services/authService';

const C = { navy: '#272343', white: '#FFFFFF', mintLight: '#E3F6F5', mint: '#BAE8E8' };

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
            style={{ background: C.mintLight }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
                style={{ background: C.mint }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: C.mint }} />

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                        style={{ background: C.navy }}>
                        <BookOpen size={18} style={{ color: C.mint }} />
                    </div>
                    <span className="font-black text-xl" style={{ color: C.navy }}>EduGuide</span>
                </Link>

                <div className="rounded-3xl p-8 border-2 shadow-xl"
                    style={{ background: C.white, borderColor: C.mint }}>
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2"
                                style={{ background: `${C.mint}33`, borderColor: C.mint }}>
                                <CheckCircle size={32} style={{ color: C.navy }} />
                            </div>
                            <h2 className="text-xl font-black mb-2" style={{ color: C.navy }}>Account created!</h2>
                            <p className="text-sm" style={{ color: '#4a6572' }}>Redirecting to your dashboard…</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black mb-1" style={{ color: C.navy }}>Create account</h1>
                            <p className="text-sm mb-7" style={{ color: '#4a6572' }}>Join EduGuide and start your journey</p>

                            {error && (
                                <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5 border"
                                    style={{ color: '#b91c1c', background: '#fee2e2', borderColor: '#fca5a5' }}>
                                    <AlertCircle size={15} className="shrink-0" /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: C.navy }}>Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: '#4a6572' }} />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Kavindu Perera"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                                            style={{ background: C.mintLight, border: `1.5px solid ${C.mint}`, color: C.navy }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: C.navy }}>Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: '#4a6572' }} />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition"
                                            style={{ background: C.mintLight, border: `1.5px solid ${C.mint}`, color: C.navy }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: C.navy }}>Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: '#4a6572' }} />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Min. 6 characters"
                                            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition"
                                            style={{ background: C.mintLight, border: `1.5px solid ${C.mint}`, color: C.navy }}
                                        />
                                        <button type="button" tabIndex={-1}
                                            onClick={() => setShowPwd(p => !p)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                                            style={{ color: '#4a6572' }}>
                                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {strength && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex gap-1 flex-1">
                                                {[1,2,3,4].map(n => (
                                                    <div key={n} className="flex-1 h-1 rounded-full transition-all"
                                                        style={{ background: n <= strength.level ? strength.color : `${C.mint}66` }} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                                        style={{ color: C.navy }}>I am a…</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ROLES.map(r => (
                                            <button key={r.value} type="button"
                                                onClick={() => setForm(p => ({ ...p, role: r.value }))}
                                                className="flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all"
                                                style={{
                                                    background: form.role === r.value ? C.mint : C.mintLight,
                                                    borderColor: form.role === r.value ? C.navy : C.mint,
                                                    color: form.role === r.value ? C.navy : '#4a6572',
                                                }}>
                                                <span className="flex items-center gap-2 font-semibold text-sm mb-0.5">
                                                    {r.icon} {r.label}
                                                </span>
                                                <span className="text-[10px] opacity-75">{r.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: C.navy, color: C.mint }}>
                                    {loading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                    {loading ? 'Creating account…' : 'Create Account'}
                                </button>
                            </form>

                            <p className="text-center text-sm mt-6" style={{ color: '#4a6572' }}>
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold transition-opacity hover:opacity-70"
                                    style={{ color: C.navy }}>Sign in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
