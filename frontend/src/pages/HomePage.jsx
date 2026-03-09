import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, getUser } from '../services/authService';
import {
    Activity, BookOpen, Brain, BarChart2, Shield, ChevronRight,
    Sparkles, GraduationCap, TrendingUp, Users, Star, ArrowRight,
    Mail, Github, Lock, Zap
} from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
    navy:      '#0d034c',
    white:     '#FFFFFF',
    mintLight: '#E3F6F5',
    mint:      '#BAE8E8',
};

// ── Nav ─────────────────────────────────────────────────────────────────
const Navbar = () => {
    const navigate = useNavigate();
    const user = isAuthenticated() ? getUser() : null;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDashboard = () => {
        if (!user) return navigate('/login');
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    };

    return (
        <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-end gap-10 px-8 py-1 transition-all duration-300"
            style={{ 
                background: scrolled 
                    ? `${C.navy}ee` 
                    : 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                borderBottom: scrolled ? `1px solid ${C.mint}33` : 'none'
            }}>
            {/* Logo — far left via mr-auto */}
            <Link to="/" className="flex items-center gap-2.5 mr-auto">
                <img 
                    src="/src/assets/images/EduGuidelogo11.png" 
                    alt="EduGuide Logo" 
                    className="w-auto h-20 transition-all hover:opacity-90"
                    style={{ filter: scrolled ? 'none' : 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}
                />
            </Link>

            {/* Nav links — right side */}
            <div className="items-center hidden text-sm md:flex gap-7">
                {['Features', 'How it Works', 'Benefits'].map(s => (
                    <a key={s} href={`#${s.toLowerCase().replace(/ /g, '-')}`}
                        className="font-medium transition-colors hover:opacity-80"
                        style={{ color: C.white, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>{s}</a>
                ))}
            </div>

            {/* Action buttons — rightmost */}
            <div className="flex items-center gap-3">
                {user ? (
                    <button onClick={handleDashboard}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-xl hover:opacity-90"
                        style={{ background: C.mint, color: C.navy, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        Dashboard <ArrowRight size={14} />
                    </button>
                ) : (
                    <>
                        <Link to="/login"
                            className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ color: C.white, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                            Sign In
                        </Link>
                        <Link to="/register"
                            className="px-4 py-2 text-sm font-semibold transition-all rounded-xl hover:opacity-90"
                            style={{ background: C.mint, color: C.navy, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
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
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const heroImages = [
        '/src/assets/images/picture1.png',
        '/src/assets/images/picture2.png'
    ];

    // Auto-slide effect - change image every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative flex items-center justify-center h-screen px-6 pt-16 pb-8 overflow-hidden">
            {/* Auto-sliding Background Images - Full Width */}
            <div className="absolute inset-0 z-0">
                {heroImages.map((img, index) => (
                    <div
                        key={index}
                        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                        style={{
                            opacity: currentSlide === index ? 1 : 0,
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                ))}
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0" 
                    style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.5), rgba(0,0,0,0.75))' }} />
            </div>

            {/* Slide indicators */}
            <div className="absolute z-20 flex gap-2 transform -translate-x-1/2 bottom-8 left-1/2">
                {heroImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="w-2 h-2 transition-all duration-300 rounded-full"
                        style={{
                            background: currentSlide === index ? C.mint : `${C.mint}40`,
                            width: currentSlide === index ? '32px' : '8px'
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Centered Content Overlay */}
            <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border"
                    style={{ background: `${C.mint}15`, borderColor: `${C.mint}50`, color: C.mint }}>
                    <Sparkles size={14} />
                    AI-Powered Education Platform for Sri Lanka
                </div>

                {/* Main Headline - Large and Centered */}
                <h1 className="px-4 mb-6 text-5xl font-black leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
                    style={{ color: C.white, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    EMPOWERING{' '}
                    <span style={{ color: C.mint }}>O/L STUDENTS</span>
                    <br />
                    WITH AI
                </h1>

                <p className="max-w-3xl px-4 mx-auto mb-10 text-lg leading-relaxed sm:text-xl" 
                    style={{ color: C.mintLight, textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
                    Advanced AI-driven platform for academic risk prediction, attendance analysis, 
                    personalized learning paths, and student stress monitoring
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <button onClick={() => navigate('/register')}
                        className="flex items-center gap-2 px-8 py-4 text-lg font-bold transition-all rounded-2xl hover:-translate-y-1 hover:shadow-2xl"
                        style={{ background: C.mint, color: C.navy, boxShadow: `0 10px 40px ${C.mint}66` }}>
                        <Sparkles size={20} /> Get Started Free
                    </button>
                    <button onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-8 py-4 text-lg font-bold transition-all border-2 rounded-2xl hover:bg-white/10"
                        style={{ borderColor: C.mint, color: C.white }}>
                        Student Login <ChevronRight size={20} />
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap justify-center gap-12 lg:gap-16">
                    {[
                        { label: 'Students Supported', value: '10,000+', icon: <Users size={22} /> },
                        { label: 'AI Accuracy Rate', value: '94.7%', icon: <Star size={22} /> },
                        { label: 'Successful Interventions', value: '2,800+', icon: <TrendingUp size={22} /> },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2 text-3xl font-black sm:text-4xl"
                                style={{ color: C.mint, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                {s.icon} {s.value}
                            </div>
                            <p className="text-sm font-medium" 
                                style={{ color: C.mintLight, textShadow: '0 1px 5px rgba(0,0,0,0.7)' }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
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
    <section id="features" className="px-6 py-24" style={{ background: C.mintLight }}>
        <div className="max-w-6xl mx-auto">
            <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold tracking-widest uppercase" style={{ color: C.navy }}>Capabilities</p>
                <h2 className="mb-4 text-4xl font-black md:text-5xl" style={{ color: C.navy }}>
                    Everything a student needs to succeed
                </h2>
                <p className="max-w-2xl mx-auto text-lg" style={{ color: '#4a6572' }}>
                    Four AI engines working in harmony to give teachers and students an unfair advantage.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((f, i) => (
                    <div key={i} className="p-6 transition-all duration-300 border-2 group rounded-2xl hover:-translate-y-1 hover:shadow-xl"
                        style={{ background: C.white, borderColor: C.mint }}>
                        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl"
                            style={{ background: C.mint, color: C.navy }}>
                            {f.icon}
                        </div>
                        <h3 className="mb-2 text-base font-bold" style={{ color: C.navy }}>{f.title}</h3>
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
    <section id="how-it-works" className="px-6 py-24" style={{ background: C.white }}>
        <div className="max-w-5xl mx-auto">
            <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-semibold tracking-widest uppercase" style={{ color: C.mint.replace('BA','80') }}>Process</p>
                <h2 className="mb-4 text-4xl font-black md:text-5xl" style={{ color: C.navy }}>How EduGuide works</h2>
                <p className="text-lg" style={{ color: '#4a6572' }}>Three steps from raw data to personalised outcomes.</p>
            </div>

            <div className="relative">
                <div className="hidden md:block absolute top-12 left-[calc(16.5%+24px)] right-[calc(16.5%+24px)] h-0.5"
                    style={{ background: `linear-gradient(to right, ${C.mint}, ${C.navy})` }} />
                <div className="grid gap-8 md:grid-cols-3">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="relative z-10 flex items-center justify-center shadow-lg w-14 h-14 rounded-2xl"
                                    style={{ background: C.mint, color: C.navy }}>
                                    {s.icon}
                                </div>
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center"
                                    style={{ background: C.navy, color: C.mint, border: `2px solid ${C.mint}` }}>
                                    {s.n}
                                </span>
                            </div>
                            <h3 className="mb-2 text-base font-bold" style={{ color: C.navy }}>{s.title}</h3>
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
    <section id="benefits" className="px-6 py-24" style={{ background: C.mint }}>
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
                <p className="mb-3 text-sm font-semibold tracking-widest uppercase" style={{ color: C.navy }}>Why EduGuide</p>
                <h2 className="mb-4 text-4xl font-black md:text-5xl" style={{ color: C.navy }}>Built for Sri Lankan students</h2>
                <p className="max-w-2xl mx-auto text-lg" style={{ color: '#2a4a55' }}>
                    Every feature is designed around the realities of GCE O/L preparation.
                </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {BENEFITS.map((b, i) => (
                    <div key={i} className="flex gap-4 p-5 transition-all border-2 rounded-2xl hover:shadow-lg"
                        style={{ background: C.white, borderColor: `${C.navy}22` }}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                            style={{ background: `${C.navy}15`, color: C.navy }}>
                            {b.icon}
                        </div>
                        <div>
                            <h4 className="mb-1 text-sm font-semibold" style={{ color: C.navy }}>{b.title}</h4>
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
        <section className="px-6 py-20" style={{ background: C.navy }}>
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="mb-6 text-4xl font-black md:text-5xl" style={{ color: C.white }}>
                    Ready to unlock your{' '}
                    <span style={{ color: C.mint }}>potential?</span>
                </h2>
                <p className="mb-10 text-lg" style={{ color: C.mintLight }}>
                    Join thousands of O/L students already using EduGuide to study smarter.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => navigate('/register')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5 hover:opacity-90"
                        style={{ background: C.mint, color: C.navy, boxShadow: `0 8px 28px ${C.mint}55` }}>
                        Sign Up Free <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-8 py-4 text-base font-bold transition-all border-2 rounded-2xl hover:opacity-80"
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
        <div className="grid max-w-6xl grid-cols-1 gap-10 mx-auto md:grid-cols-3">
            {/* Brand column */}
            <div className="flex flex-col gap-3">
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-lg w-7 h-7"
                        style={{ background: C.mint }}>
                        <BookOpen size={13} style={{ color: C.navy }} />
                    </div>
                    <span className="text-base font-bold" style={{ color: C.white }}>EduGuide</span>
                </Link>
                <p className="text-xs leading-relaxed" style={{ color: `${C.mintLight}99` }}>
                    AI-powered education support system built for Sri Lanka's students and educators.
                </p>
            </div>

            {/* Links column */}
            <div className="flex flex-col gap-3">
                <p className="mb-1 text-xs font-semibold tracking-widest uppercase" style={{ color: C.mint }}>Quick Links</p>
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
                <p className="mb-1 text-xs font-semibold tracking-widest uppercase" style={{ color: C.mint }}>Contact</p>
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
                <p className="mt-2 text-xs" style={{ color: `${C.mint}99` }}>© 2026 EduGuide. All rights reserved.</p>
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
