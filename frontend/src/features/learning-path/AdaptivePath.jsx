import React, { useState } from 'react';
import {
    Shuffle,
    ArrowRight,
    Target,
    TrendingUp,
    CheckCircle,
    Lightbulb,
    BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import Layout from '../../components/Layout';

const AdaptivePath = () => {
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState('');

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchId.trim()) {
            navigate(`/students/${searchId.trim().toUpperCase()}`);
        }
    };

    const suggestedPaths = [
        {
            title: "Science & Technology Acceleration",
            description: "Intensive focus on Mathematics and Science for students aiming for Engineering streams.",
            tags: ["Science", "STEM", "Advanced"],
            progress: 75,
            color: "blue"
        },
        {
            title: "Language & Communications Mastery",
            description: "Pathway designed for excellence in English and Sinhala, suitable for Arts and Management streams.",
            tags: ["Linguistics", "Arts", "Communications"],
            progress: 40,
            color: "emerald"
        },
        {
            title: "Balanced Academic Improvement",
            description: "A generalized path focusing on bridging gaps across all core O/L subjects.",
            tags: ["Balanced", "Foundation", "Core"],
            progress: 90,
            color: "purple"
        }
    ];

    return (
        <Layout
            title="Adaptive Path"
            searchId={searchId}
            setSearchId={setSearchId}
            handleSearch={handleSearch}
        >
            <div className="animate-fadeIn max-w-6xl mx-auto">
                <div className="card mb-8 p-10 bg-white border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="max-w-xl">
                            <h1 className="text-3xl font-bold text-slate-800 mb-4">AI-Driven Adaptive Learning Paths</h1>
                            <p className="text-slate-500 leading-relaxed mb-6">
                                Our adaptive engine creates personalized learning journeys by analyzing individual performance gaps, learning styles, and future career goals.
                            </p>
                            <div className="flex gap-3">
                                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-2">
                                    <Target size={14} />
                                    Performance Based
                                </div>
                                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-2">
                                    <Shuffle size={14} />
                                    Dynamic Realignment
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="w-48 h-48 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center p-8 animate-pulse">
                                <Shuffle size={80} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {suggestedPaths.map((path, idx) => (
                        <div key={idx} className="card bg-white p-8 border-slate-100 shadow-sm hover:border-emerald-200 transition-all group cursor-pointer">
                            <div className={`w-12 h-12 bg-${path.color}-50 text-${path.color}-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3">{path.title}</h3>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{path.description}</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {path.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase tracking-wider">{tag}</span>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Path Readiness</span>
                                    <span>{path.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className={`bg-${path.color}-500 h-full rounded-full`} style={{ width: `${path.progress}%` }}></div>
                                </div>
                                <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                    Explore Path <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Lightbulb className="text-yellow-400" />
                            AI Strategy Highlights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                                <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Automated Skill Gap Closure
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Our engine identifies critical failures early and automatically shifts teaching resources to bridge those gaps before exams.
                                </p>
                            </div>
                            <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                                <h4 className="text-blue-400 font-bold flex items-center gap-2">
                                    <BookOpen size={18} />
                                    Resource Optimization
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    By prioritizing high-impact lessons first, we increase the efficiency of study hours by up to 40% based on historical data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdaptivePath;
