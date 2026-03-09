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
            <div className="py-20 text-center">
                <h2 className="mb-4 text-2xl font-bold text-slate-800">Student Not Found</h2>
                <button onClick={() => navigate('/')} className="px-6 py-2 font-bold text-white rounded-full shadow-lg bg-emerald-500">
                    Back to Dashboard
                </button>
            </div>
        </Layout>
    );

    const { current_performance, weak_subjects, al_stream_recommendations, action_plan, online_resources } = profile;

    return (
        <Layout title="Suggested Student Learning Path & Resources " searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="max-w-6xl pb-10 mx-auto animate-fadeIn">
                <div className="relative p-10 mb-8 overflow-hidden bg-white shadow-sm card border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center justify-center w-20 h-20 text-3xl font-bold bg-emerald-50 text-emerald-600 rounded-3xl">
                                <Activity size={32} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold text-slate-800">Suggested Student Learning Path & Resources</h1>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                        {current_performance.student_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="mb-1 text-xs font-bold uppercase text-slate-400">Overall Average</p>
                            <h2 className="text-4xl font-bold text-emerald-500">{current_performance.overall_avg}%</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-3 px-5 py-3 border bg-slate-50 rounded-2xl border-slate-100">
                            <div className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-100 rounded-xl">
                                <Activity size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-slate-400">IQ Level</span>
                                <span className="font-bold text-slate-700">{current_performance.iq_level}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 border bg-slate-50 rounded-2xl border-slate-100">
                            <div className="flex items-center justify-center w-10 h-10 text-purple-600 bg-purple-100 rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-slate-400">Study Hours</span>
                                <span className="font-bold text-slate-700">{current_performance.study_hours}h / week</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 border bg-slate-50 rounded-2xl border-slate-100">
                            <div className="flex items-center justify-center w-10 h-10 text-orange-600 bg-orange-100 rounded-xl">
                                <Award size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-slate-400">Attendance</span>
                                <span className={`font-bold ${current_performance.attendance_rate < 80 ? 'text-orange-500' : 'text-slate-700'}`}>
                                    {current_performance.attendance_rate}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
                    <div className="p-8 bg-white shadow-sm card border-slate-100">
                        <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-slate-800">
                            <div className="flex items-center justify-center w-8 h-8 text-orange-500 rounded-lg bg-orange-50">
                                <AlertTriangle size={18} />
                            </div>
                            Learning Gaps Identified
                        </h3>
                        {Object.keys(weak_subjects).length === 0 ? (
                            <div className="flex items-center gap-3 p-6 border bg-emerald-50 rounded-2xl border-emerald-100 text-emerald-700">
                                <CheckCircle size={24} />
                                <p className="italic font-bold">Excellent! No significant weak areas detected.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(weak_subjects).map(([subj, score]) => (
                                    <div key={subj} className="flex items-center justify-between p-4 transition-all border bg-slate-50 rounded-2xl border-slate-100 group hover:border-orange-200">
                                        <span className="font-bold text-slate-700">{subj}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${score}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 min-w-[40px]">{score.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-10">
                            <h4 className="mb-4 text-xs font-bold tracking-widest uppercase text-slate-400">Priority Lessons</h4>
                            <div className="space-y-4">
                                {profile.priority_lessons.map((lesson, idx) => (
                                    <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-100">
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

                    <div className="p-8 bg-white shadow-sm card border-slate-100">
                        <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-slate-800">
                            <div className="flex items-center justify-center w-8 h-8 text-blue-500 rounded-lg bg-blue-50">
                                <Video size={18} />
                            </div>
                            Personalized Resources
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {online_resources.map((res, idx) => (
                                <div key={idx} className="p-5 transition-all border bg-slate-50 rounded-2xl border-slate-100 hover:border-blue-200 hover:bg-white group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h5 className="text-sm font-bold leading-tight uppercase transition-colors text-slate-800 group-hover:text-blue-600">{res.title}</h5>
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-white transition-transform bg-blue-500 rounded-full shadow-lg shadow-blue-500/20 hover:scale-110">
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
                                    <p className="mb-2 text-xs italic text-slate-500">Targeted area: <span className="font-bold text-slate-700">{res.subject || 'All Subjects'}</span></p>
                                </div>
                            ))}
                            {online_resources.length === 0 && (
                                <div className="py-10 text-center opacity-50">
                                    <BookOpen size={40} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No specific resources recommended.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-hidden bg-white shadow-sm card border-slate-100">
                    <h3 className="flex items-center gap-2 mb-8 text-lg font-bold text-slate-800">
                        <div className="flex items-center justify-center w-8 h-8 text-purple-500 rounded-lg bg-purple-50">
                            <LayoutGrid size={18} />
                        </div>
                        Post-A/L Career Path Matching
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {al_stream_recommendations.map((stream, idx) => (
                            <div key={idx} className={`p-6 rounded-3xl border-2 transition-all relative ${idx === 0 ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                                {idx === 0 && (
                                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Top Choice</div>
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <h4 className="font-bold text-slate-800">{stream.stream}</h4>
                                    <span className="text-xs font-bold text-slate-400">{stream.total_score.toFixed(0)}/100</span>
                                </div>
                                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${stream.recommendation_strength.includes('Highly') ? 'bg-emerald-100 text-emerald-600' :
                                        stream.recommendation_strength.includes('Not') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {stream.recommendation_strength}
                                </div>
                                <p className="mb-6 text-xs leading-relaxed text-slate-500">{stream.description}</p>

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
