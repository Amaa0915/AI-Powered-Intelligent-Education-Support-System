import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { login as apiLogin, googleAuth as apiGoogleAuth } from '../../api/authApi';
import { saveAuth } from '../../services/authService';
import { GoogleLogin } from '@react-oauth/google';

const Orb = ({ className }) => (
    <div className={`absolute rounded-full opacity-20 blur-3xl pointer-events-none ${className}`} />
);

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const redirect = (role) => {
        if (from && from !== '/login' && from !== '/register') return navigate(from, { replace: true });
        navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) return setError('Please enter your email and password.');
        setLoading(true);
        try {
            const data = await apiLogin(form);
            saveAuth(data);
            redirect(data.user.role);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            const data = await apiGoogleAuth(credentialResponse.credential);
            saveAuth(data);
            redirect(data.user.role);
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: '#020617' }}>
            <Orb className="w-[500px] h-[500px] bg-emerald-500 -top-32 -left-32" />
            <Orb className="w-[400px] h-[400px] bg-cyan-500 bottom-0 right-0" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    <span className="text-white font-black text-xl">EduGuide</span>
                </Link>

                {/* Card */}
                <div className="rounded-3xl p-8 border"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
                    <p className="text-slate-400 text-sm mb-8">Sign in to your EduGuide account</p>

                    {/* Google */}
                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogle}
                            onError={() => setError('Google sign-in failed.')}
                            useOneTap={false}
                            theme="filled_black"
                            shape="rectangular"
                            text="continue_with"
                            width="100%"
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <span className="text-slate-600 text-xs font-medium uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                            <AlertCircle size={15} className="shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</label>
                                <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPwd(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                            {loading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                            Sign up free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
