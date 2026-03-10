import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { login as apiLogin, googleAuth as apiGoogleAuth } from '../../api/authApi';
import { saveAuth } from '../../services/authService';
import { GoogleLogin } from '@react-oauth/google';

const C = { navy: '#272343', white: '#FFFFFF', mintLight: '#E3F6F5', mint: '#BAE8E8' };

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
        navigate(role === 'admin' ? '/admin/dashboard' : '/add-student', { replace: true });
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
            style={{ background: C.mintLight }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
                style={{ background: C.mint }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: C.mint }} />

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <img src="/src/assets/images/EduGuidelogo11.png" alt="EduGuide Logo" className="h-12 w-auto rounded-xl shadow-md" />
                    <span className="font-black text-xl" style={{ color: C.navy }}>EduGuide</span>
                </Link>

                <div className="rounded-3xl p-8 border-2 shadow-xl"
                    style={{ background: C.white, borderColor: C.mint }}>
                    <h1 className="text-2xl font-black mb-1" style={{ color: C.navy }}>Welcome back</h1>
                    <p className="text-sm mb-8" style={{ color: '#4a6572' }}>Sign in to your EduGuide account</p>

                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogle}
                            onError={() => setError('Google sign-in failed.')}
                            useOneTap={false}
                            theme="outline"
                            shape="rectangular"
                            text="continue_with"
                            width="100%"
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ background: C.mint }} />
                        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#4a6572' }}>or</span>
                        <div className="flex-1 h-px" style={{ background: C.mint }} />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5 border"
                            style={{ color: '#b91c1c', background: '#fee2e2', borderColor: '#fca5a5' }}>
                            <AlertCircle size={15} className="shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: C.navy }}>Password</label>
                                <a href="#" className="text-xs font-medium transition-opacity hover:opacity-70"
                                    style={{ color: C.navy }}>Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                    style={{ color: '#4a6572' }} />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••"
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
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                            style={{ background: C.navy, color: C.mint }}>
                            {loading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: '#4a6572' }}>
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="font-semibold transition-opacity hover:opacity-70"
                            style={{ color: C.navy }}>Sign up free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
