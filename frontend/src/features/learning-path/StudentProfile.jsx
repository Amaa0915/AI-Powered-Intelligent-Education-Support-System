import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/learningPathClient';
import {
    CheckCircle,
    AlertTriangle,
    Book,
    Video,
    Star,
    ArrowRight,
    Activity,
    ArrowLeft,
    LayoutGrid,
    TrendingUp,
    Award,
    BookOpen
} from 'lucide-react';
import Layout from '../../components/Layout';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await client.get(`/students/${id}`);
                setProfile(response.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchId.trim()) {
            navigate(`/students/${searchId.trim().toUpperCase()}`);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading Profile...</div>;
    if (!profile) return (
        <Layout title="Student Not Found" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Student Not Found</h2>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-emerald-500 text-white rounded-full font-bold shadow-lg">
                    Back to Dashboard
                </button>
            </div>
        </Layout>
    );

    const { current_performance, weak_subjects, al_stream_recommendations, action_plan, online_resources } = profile;

    return (
        <Layout title="Student Profile" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="animate-fadeIn max-w-6xl mx-auto pb-10">
                <div className="card mb-8 p-10 bg-white border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center font-bold text-3xl">
                                <Activity size={32} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold text-slate-800">Suggested Learning Path & Resources   </h1>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                        {current_performance.student_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Overall Average</p>
                            <h2 className="text-4xl font-bold text-emerald-500">{current_performance.overall_avg}%</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400 font-medium">IQ Level</span>
                                <span className="font-bold text-slate-700">{current_performance.iq_level}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400 font-medium">Study Hours</span>
                                <span className="font-bold text-slate-700">{current_performance.study_hours}h / week</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                <Award size={20} />
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400 font-medium">Attendance</span>
                                <span className={`font-bold ${current_performance.attendance_rate < 80 ? 'text-orange-500' : 'text-slate-700'}`}>
                                    {current_performance.attendance_rate}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="card bg-white border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                                <AlertTriangle size={18} />
                            </div>
                            Learning Gaps Identified
                        </h3>
                        {Object.keys(weak_subjects).length === 0 ? (
                            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700">
                                <CheckCircle size={24} />
                                <p className="font-bold italic">Excellent! No significant weak areas detected.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(weak_subjects).map(([subj, score]) => (
                                    <div key={subj} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-all">
                                        <span className="font-bold text-slate-700">{subj}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${score}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 min-w-[40px]">{score.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Priority Lessons</h4>
                            <div className="space-y-4">
                                {profile.priority_lessons.map((lesson, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <p className="text-sm font-bold text-slate-700">{lesson.subject}: <span className="font-medium text-slate-500">{lesson.lesson}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{lesson.current_score}%</span>
                                            <ArrowRight size={14} className="text-slate-300" />
                                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">{lesson.target_score}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white border-slate-100 p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                <Video size={18} />
                            </div>
                            Personalized Resources
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {online_resources.map((res, idx) => (
                                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h5 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase text-sm">{res.title}</h5>
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform">
                                            <ArrowRight size={14} />
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        <span>{res.platform}</span>
                                        <span>•</span>
                                        <span>{res.level}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-yellow-500" /> {res.rating}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 italic mb-2">Targeted area: <span className="text-slate-700 font-bold">{res.subject || 'All Subjects'}</span></p>
                                </div>
                            ))}
                            {online_resources.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <BookOpen size={40} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No specific resources recommended.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card bg-white border-slate-100 p-8 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                            <LayoutGrid size={18} />
                        </div>
                        Post-O/L Career Path Matching
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {al_stream_recommendations.map((stream, idx) => (
                            <div key={idx} className={`p-6 rounded-3xl border-2 transition-all relative ${idx === 0 ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                                {idx === 0 && (
                                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Top Choice</div>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-slate-800">{stream.stream}</h4>
                                    <span className="text-xs font-bold text-slate-400">{stream.total_score.toFixed(0)}/100</span>
                                </div>
                                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${stream.recommendation_strength.includes('Highly') ? 'bg-emerald-100 text-emerald-600' :
                                    stream.recommendation_strength.includes('Not') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {stream.recommendation_strength}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-6">{stream.description}</p>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Readiness Index</span>
                                        <span>{stream.required_subjects_avg}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${stream.meets_minimum ? 'bg-emerald-500' : 'bg-rose-400'}`} style={{ width: `${stream.required_subjects_avg}%` }}></div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${stream.meets_minimum ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${stream.meets_minimum ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {stream.meets_minimum ? 'Criteria Met' : 'Gap Exists'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StudentProfile;
