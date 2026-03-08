import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, getUser } from '../services/authService';
import {
    Activity, BookOpen, Brain, BarChart2, Shield, ChevronRight,
    Sparkles, GraduationCap, TrendingUp, Users, Star, ArrowRight,
    Mail, Github, Lock, Zap
} from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
    navy:      '#272343',
    white:     '#FFFFFF',
    mintLight: '#E3F6F5',
    mint:      '#BAE8E8',
};

// ── Nav ─────────────────────────────────────────────────────────────────
const Navbar = () => {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;

    const handleDashboard = () => {
        if (!user) return navigate('/login');
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    };

    return (
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-end px-8 py-4 gap-10"
            style={{ background: C.navy, borderBottom: `2px solid ${C.mint}` }}>
            {/* Logo — far left via mr-auto */}
            <Link to="/" className="flex items-center gap-2.5 mr-auto">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: C.mint }}>
                    <BookOpen size={16} style={{ color: C.navy }} />
                </div>
                <span className="font-black text-lg tracking-tight" style={{ color: C.white }}>EduGuide</span>
            </Link>

            {/* Nav links — right side */}
            <div className="hidden md:flex items-center gap-7 text-sm">
                {['Features', 'How it Works', 'Benefits'].map(s => (
                    <a key={s} href={`#${s.toLowerCase().replace(/ /g, '-')}`}
                        className="transition-colors hover:opacity-80"
                        style={{ color: C.mintLight }}>{s}</a>
                ))}
            </div>

            {/* Action buttons — rightmost */}
            <div className="flex items-center gap-3">
                {user ? (
                    <button onClick={handleDashboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: C.mint, color: C.navy }}>
                        Dashboard <ArrowRight size={14} />
                    </button>
                ) : (
                    <>
                        <Link to="/login"
                            className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ color: C.mintLight }}>
                            Sign In
                        </Link>
                        <Link to="/register"
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                            style={{ background: C.mint, color: C.navy }}>
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
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${C.navy} 0%, #1a3040 60%, #0d2233 100%)` }}>
            {/* Background decorations */}
            <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: C.mint }} />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: C.mintLight }} />

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border"
                style={{ background: `${C.mint}22`, borderColor: `${C.mint}66`, color: C.mint }}>
                <Sparkles size={12} />
                AI-Powered Education Platform for Sri Lanka
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight max-w-4xl mb-6"
                style={{ color: C.white }}>
                Smart Learning for{' '}
                <span style={{ color: C.mint }}>O/L Students</span>
            </h1>

            <p className="text-lg max-w-2xl mb-10 leading-relaxed" style={{ color: C.mintLight }}>
                EduGuide uses advanced AI to predict academic risk, analyse attendance patterns,
                generate personalised learning paths, and monitor student stress — helping every
                Sri Lankan student reach their full potential.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
                <button onClick={() => navigate('/register')}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5 hover:opacity-90"
                    style={{ background: C.mint, color: C.navy, boxShadow: `0 8px 28px ${C.mint}55` }}>
                    <Sparkles size={18} /> Get Started Free
                </button>
                <button onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base border transition-all hover:opacity-80"
                    style={{ borderColor: `${C.mint}66`, color: C.mintLight }}>
                    Student Login <ChevronRight size={18} />
                </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-10">
                {[
                    { label: 'Students Supported', value: '10,000+', icon: <Users size={18} /> },
                    { label: 'Prediction Accuracy', value: '94.7%', icon: <Star size={18} /> },
                    { label: 'Risk Interventions', value: '2,800+', icon: <TrendingUp size={18} /> },
                ].map(s => (
                    <div key={s.label} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-2xl font-black mb-1"
                            style={{ color: C.mint }}>
                            {s.icon} {s.value}
                        </div>
                        <p className="text-xs" style={{ color: C.mintLight }}>{s.label}</p>
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
        title: 'Attendance Trend Analysis',
        desc: 'AI-powered ARIMA forecasting detects slipping attendance early. Weather, distance, and event-aware — built for the Sri Lankan school calendar.',
        accent: '#BAE8E8',
    },
    {
        icon: <Shield size={28} />,
        title: 'Academic Risk Prediction',
        desc: 'Gradient Boosting models trained on thousands of students identify at-risk learners before their grades decline, enabling timely intervention.',
        accent: '#96d4d4',
    },
    {
        icon: <Brain size={28} />,
        title: 'Adaptive Learning Paths',
        desc: 'Personalised curriculum recommendations adapt in real time to each student\'s weak areas, learning style, and performance trajectory.',
        accent: '#BAE8E8',
    },
    {
        icon: <BarChart2 size={28} />,
        title: 'Student Stress Monitoring',
        desc: 'ML-based stress level predictor analyses academic load, attendance patterns, and performance signals to flag burnout before it impacts results.',
        accent: '#96d4d4',
    },
];

const Features = () => (
    <section id="features" className="py-24 px-6" style={{ background: C.mintLight }}>
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.navy }}>Capabilities</p>
                <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: C.navy }}>
                    Everything a student needs to succeed
                </h2>
                <p className="text-lg max-w-2xl mx-auto" style={{ color: '#4a6572' }}>
                    Four AI engines working in harmony to give teachers and students an unfair advantage.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f, i) => (
                    <div key={i} className="group rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        style={{ background: C.white, borderColor: C.mint }}>
                        <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                            style={{ background: C.mint, color: C.navy }}>
                            {f.icon}
                        </div>
                        <h3 className="font-bold mb-2 text-base" style={{ color: C.navy }}>{f.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#4a6572' }}>{f.desc}</p>
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
    <section id="how-it-works" className="py-24 px-6" style={{ background: C.white }}>
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.mint.replace('BA','80') }}>Process</p>
                <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: C.navy }}>How EduGuide works</h2>
                <p className="text-lg" style={{ color: '#4a6572' }}>Three steps from raw data to personalised outcomes.</p>
            </div>

            <div className="relative">
                <div className="hidden md:block absolute top-12 left-[calc(16.5%+24px)] right-[calc(16.5%+24px)] h-0.5"
                    style={{ background: `linear-gradient(to right, ${C.mint}, ${C.navy})` }} />
                <div className="grid md:grid-cols-3 gap-8">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center z-10 relative shadow-lg"
                                    style={{ background: C.mint, color: C.navy }}>
                                    {s.icon}
                                </div>
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center"
                                    style={{ background: C.navy, color: C.mint, border: `2px solid ${C.mint}` }}>
                                    {s.n}
                                </span>
                            </div>
                            <h3 className="font-bold text-base mb-2" style={{ color: C.navy }}>{s.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: '#4a6572' }}>{s.desc}</p>
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
    <section id="benefits" className="py-24 px-6" style={{ background: C.mint }}>
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: C.navy }}>Why EduGuide</p>
                <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: C.navy }}>Built for Sri Lankan students</h2>
                <p className="text-lg max-w-2xl mx-auto" style={{ color: '#2a4a55' }}>
                    Every feature is designed around the realities of GCE O/L preparation.
                </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {BENEFITS.map((b, i) => (
                    <div key={i} className="flex gap-4 p-5 rounded-2xl border-2 transition-all hover:shadow-lg"
                        style={{ background: C.white, borderColor: `${C.navy}22` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${C.navy}15`, color: C.navy }}>
                            {b.icon}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1" style={{ color: C.navy }}>{b.title}</h4>
                            <p className="text-xs leading-relaxed" style={{ color: '#4a6572' }}>{b.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// ── CTA Banner ────────────────────────────────────────────────────────────
const CTABanner = () => {
    const navigate = useNavigate();
    return (
        <section className="py-20 px-6" style={{ background: C.navy }}>
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ color: C.white }}>
                    Ready to unlock your{' '}
                    <span style={{ color: C.mint }}>potential?</span>
                </h2>
                <p className="text-lg mb-10" style={{ color: C.mintLight }}>
                    Join thousands of O/L students already using EduGuide to study smarter.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => navigate('/register')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5 hover:opacity-90"
                        style={{ background: C.mint, color: C.navy, boxShadow: `0 8px 28px ${C.mint}55` }}>
                        Sign Up Free <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-2 transition-all hover:opacity-80"
                        style={{ borderColor: C.mint, color: C.mintLight }}>
                        Student Login
                    </button>
                </div>
            </div>
        </section>
    );
};

// ── Footer ────────────────────────────────────────────────────────────────
const Footer = () => (
    <footer className="px-8 py-12" style={{ background: `#1a1a2e`, borderTop: `2px solid ${C.mint}44` }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand column */}
            <div className="flex flex-col gap-3">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: C.mint }}>
                        <BookOpen size={13} style={{ color: C.navy }} />
                    </div>
                    <span className="font-bold text-base" style={{ color: C.white }}>EduGuide</span>
                </Link>
                <p className="text-xs leading-relaxed" style={{ color: `${C.mintLight}99` }}>
                    AI-powered education support system built for Sri Lanka's students and educators.
                </p>
            </div>

            {/* Links column */}
            <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.mint }}>Quick Links</p>
                {[
                    { label: 'Features', href: '#features' },
                    { label: 'How it Works', href: '#how-it-works' },
                    { label: 'About', href: '#' },
                    { label: 'Privacy Policy', href: '#' },
                ].map(l => (
                    <a key={l.label} href={l.href}
                        className="text-sm transition-opacity hover:opacity-70 w-fit"
                        style={{ color: C.mintLight }}>{l.label}</a>
                ))}
            </div>

            {/* Contact column */}
            <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.mint }}>Contact</p>
                <a href="mailto:support@eduguide.lk"
                    className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 w-fit"
                    style={{ color: C.mintLight }}>
                    <Mail size={13} /> support@eduguide.lk
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 w-fit"
                    style={{ color: C.mintLight }}>
                    <Github size={13} /> GitHub Repository
                </a>
                <p className="text-xs mt-2" style={{ color: `${C.mint}99` }}>© 2026 EduGuide. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
    return (
        <div className="min-h-screen" style={{ background: C.navy }}>
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
