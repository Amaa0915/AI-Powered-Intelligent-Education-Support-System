import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, getUser } from '../services/authService';
import {
    Activity, BookOpen, Brain, BarChart2, Shield, ChevronRight,
    Sparkles, GraduationCap, TrendingUp, Users, Star, ArrowRight,
    Mail, Github, Lock, Zap
} from 'lucide-react';

// ── Floating orb component ──────────────────────────────────────────────
const Orb = ({ className }) => (
    <div className={`absolute rounded-full opacity-20 blur-3xl pointer-events-none ${className}`} />
);

// ── Nav ─────────────────────────────────────────────────────────────────
const Navbar = () => {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;

    const handleDashboard = () => {
        if (!user) return navigate('/login');
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    };

    return (
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4"
            style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <BookOpen size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">EduGuide</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                {['Features', 'How it Works', 'Benefits'].map(s => (
                    <a key={s} href={`#${s.toLowerCase().replace(/ /g, '-')}`}
                        className="hover:text-white transition-colors">{s}</a>
                ))}
            </div>

            <div className="flex items-center gap-3">
                {user ? (
                    <button onClick={handleDashboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-all">
                        Dashboard <ArrowRight size={14} />
                    </button>
                ) : (
                    <>
                        <Link to="/login"
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/register"
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/25">
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

// ── Hero ─────────────────────────────────────────────────────────────────
const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
            <Orb className="w-[600px] h-[600px] bg-emerald-500 -top-40 -left-40" />
            <Orb className="w-[500px] h-[500px] bg-cyan-500 top-20 right-0" />
            <Orb className="w-[400px] h-[400px] bg-violet-600 bottom-0 left-1/3" />

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-emerald-300 border"
                style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' }}>
                <Sparkles size={12} />
                AI-Powered Education Platform for Sri Lanka
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight max-w-4xl mb-6">
                Smart Learning for{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    O/L Students
                </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-2xl mb-10 leading-relaxed">
                EduGuide uses advanced AI to predict academic risk, analyse attendance patterns,
                generate personalised learning paths, and monitor student stress — helping every
                Sri Lankan student reach their full potential.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
                <button onClick={() => navigate('/register')}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-base shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    <Sparkles size={18} /> Get Started Free
                </button>
                <button onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-600 text-slate-200 font-semibold text-base hover:border-slate-400 hover:bg-white/5 transition-all">
                    Student Login <ChevronRight size={18} />
                </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-10">
                {[
                    { label: 'Students Supported', value: '10,000+', icon: <Users size={18} /> },
                    { label: 'Prediction Accuracy', value: '94.7%', icon: <Star size={18} /> },
                    { label: 'Risk Interventions', value: '2,800+', icon: <TrendingUp size={18} /> },
                ].map(s => (
                    <div key={s.label} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-2xl font-black mb-1">
                            {s.icon} {s.value}
                        </div>
                        <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

// ── Features ─────────────────────────────────────────────────────────────
const FEATURES = [
    {
        icon: <Activity size={28} />,
        color: 'from-cyan-500 to-blue-500',
        glow: 'shadow-cyan-500/20',
        title: 'Attendance Trend Analysis',
        desc: 'AI-powered ARIMA forecasting detects slipping attendance early. Weather, distance, and event-aware — built for the Sri Lankan school calendar.',
    },
    {
        icon: <Shield size={28} />,
        color: 'from-violet-500 to-purple-500',
        glow: 'shadow-violet-500/20',
        title: 'Academic Risk Prediction',
        desc: 'Gradient Boosting models trained on thousands of students identify at-risk learners before their grades decline, enabling timely intervention.',
    },
    {
        icon: <Brain size={28} />,
        color: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/20',
        title: 'Adaptive Learning Paths',
        desc: 'Personalised curriculum recommendations adapt in real time to each student\'s weak areas, learning style, and performance trajectory.',
    },
    {
        icon: <BarChart2 size={28} />,
        color: 'from-rose-500 to-pink-500',
        glow: 'shadow-rose-500/20',
        title: 'Student Stress Monitoring',
        desc: 'ML-based stress level predictor analyses academic load, attendance patterns, and performance signals to flag burnout before it impacts results.',
    },
];

const Features = () => (
    <section id="features" className="relative py-24 px-6">
        <Orb className="w-[400px] h-[400px] bg-violet-600 bottom-0 right-0" />
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Capabilities</p>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Everything a student needs to succeed
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Four AI engines working in harmony to give teachers and students an unfair advantage.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f, i) => (
                    <div key={i} className="group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1"
                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                        {/* Glow on hover */}
                        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${f.color} blur-xl -z-10`}
                            style={{ opacity: 0 }} />
                        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${f.color} text-white shadow-xl ${f.glow}`}>
                            {f.icon}
                        </div>
                        <h3 className="text-white font-bold mb-2 text-base">{f.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// ── How It Works ─────────────────────────────────────────────────────────
const STEPS = [
    { n: '01', icon: <GraduationCap size={22} />, title: 'Student Data Analysis', desc: 'Attendance records, grades, stress indicators, and contextual factors are securely collected and normalised.' },
    { n: '02', icon: <Brain size={22} />, title: 'AI Predicts Learning Insights', desc: 'Multiple ML models run in parallel — ARIMA for trends, Gradient Boosting for risk, NLP for learning style.' },
    { n: '03', icon: <Sparkles size={22} />, title: 'Personalised Recommendations', desc: 'Each student receives a unique action plan: targeted resources, schedule adjustments, and teacher alerts.' },
];

const HowItWorks = () => (
    <section id="how-it-works" className="relative py-24 px-6 overflow-hidden">
        <Orb className="w-[500px] h-[500px] bg-emerald-600 top-0 left-0" />
        <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-16">
                <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How EduGuide works</h2>
                <p className="text-slate-400 text-lg">Three steps from raw data to personalised outcomes.</p>
            </div>

            <div className="relative">
                {/* Connector line */}
                <div className="hidden md:block absolute top-12 left-[calc(16.5%+24px)] right-[calc(16.5%+24px)] h-0.5"
                    style={{ background: 'linear-gradient(to right, #10b981, #06b6d4, #8b5cf6)' }} />

                <div className="grid md:grid-cols-3 gap-8">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl z-10 relative"
                                    style={{ background: `linear-gradient(135deg, ${['#10b981','#06b6d4','#8b5cf6'][i]}, ${['#06b6d4','#8b5cf6','#ec4899'][i]})` }}>
                                    {s.icon}
                                </div>
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-600 text-[9px] font-black text-slate-400 flex items-center justify-center">
                                    {s.n}
                                </span>
                            </div>
                            <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// ── Benefits ─────────────────────────────────────────────────────────────
const BENEFITS = [
    { icon: <TrendingUp size={20} />, title: 'Improve Pass Rates', desc: 'Schools using EduGuide report up to 23% improvement in O/L pass rates within two terms.' },
    { icon: <Zap size={20} />, title: 'Early Intervention', desc: 'Identify struggling students weeks before exams, not days — giving teachers time to act.' },
    { icon: <Lock size={20} />, title: 'Privacy First', desc: 'All student data is encrypted, role-gated, and never shared with third parties.' },
    { icon: <Brain size={20} />, title: 'Contextual AI', desc: 'Our models account for Sri Lankan school calendar, weather patterns, and distance to school.' },
    { icon: <Users size={20} />, title: 'For Everyone', desc: 'Works equally well for a single student analysing their own trends or a principal monitoring the whole school.' },
    { icon: <BarChart2 size={20} />, title: 'Real-Time Analytics', desc: 'Dashboards update automatically as new attendance and assessment data flows in.' },
];

const Benefits = () => (
    <section id="benefits" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl p-10 md:p-16 border relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 50%, rgba(139,92,246,0.08) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Orb className="w-[300px] h-[300px] bg-emerald-500 -top-20 -right-20" />
                <div className="text-center mb-14">
                    <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Why EduGuide</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Built for Sri Lankan students</h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Every feature is designed around the realities of GCE O/L preparation — the pressure, the distance, the weather, the calendar.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BENEFITS.map((b, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-2xl border"
                            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                {b.icon}
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm mb-1">{b.title}</h4>
                                <p className="text-slate-400 text-xs leading-relaxed">{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// ── CTA Banner ────────────────────────────────────────────────────────────
const CTABanner = () => {
    const navigate = useNavigate();
    return (
        <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                    Ready to unlock your{' '}
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        potential?
                    </span>
                </h2>
                <p className="text-slate-400 text-lg mb-10">
                    Join thousands of O/L students already using EduGuide to study smarter.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => navigate('/register')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-base shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 transition-all">
                        Sign Up Free <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-600 text-slate-200 font-bold text-base hover:border-slate-400 hover:bg-white/5 transition-all">
                        Student Login
                    </button>
                </div>
            </div>
        </section>
    );
};

// ── Footer ────────────────────────────────────────────────────────────────
const Footer = () => (
    <footer className="border-t px-6 py-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                    <BookOpen size={13} className="text-white" />
                </div>
                <span className="text-white font-bold">EduGuide</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-500">
                <a href="#" className="hover:text-slate-300 transition-colors">About</a>
                <a href="mailto:support@eduguide.lk" className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                    <Mail size={13} /> Contact
                </a>
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
                <a href="https://github.com" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                    <Github size={13} /> GitHub
                </a>
            </div>
            <p className="text-xs text-slate-600">© 2026 EduGuide. Built for Sri Lanka.</p>
        </div>
    </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
    return (
        <div className="min-h-screen" style={{ background: '#020617', color: '#fff' }}>
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <Benefits />
            <CTABanner />
            <Footer />
        </div>
    );
}
