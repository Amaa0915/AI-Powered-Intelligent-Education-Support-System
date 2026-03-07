import React, { useState } from 'react';
import { Save, UserPlus, Activity, Target, X, TrendingUp, Award, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/learningPathClient';
import Layout from '../../components/Layout';
import { getUser } from '../../services/authService';

/* ── Subject config ─────────────────────────────────────── */
const SUBJECTS = [
    { name: 'Sinhala',     emoji: '✍️' },
    { name: 'Mathematics', emoji: '📐' },
    { name: 'Science',     emoji: '🔬' },
    { name: 'English',     emoji: '📖' },
    { name: 'History',     emoji: '🏛️' },
    { name: 'Buddhism',    emoji: '☸️' },
    { name: 'Geography',   emoji: '🌍' },
    { name: 'ICT',         emoji: '💻' },
];

/* Prevent -, e, + keys in number inputs */
const blockNegative = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
};

/* Return hardcoded Tailwind classes based on score value */
const scoreStyle = (val) => {
    const n = parseFloat(val);
    if (val === '' || isNaN(n)) return {
        card:  'border-slate-100 bg-white hover:border-slate-200',
        input: 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-400',
        bar:   null,
    };
    if (n < 60) return {
        card:  'border-red-200 bg-red-50',
        input: 'border-red-300 focus:ring-red-100 focus:border-red-400',
        bar:   'bg-red-400',
    };
    if (n < 75) return {
        card:  'border-yellow-200 bg-yellow-50',
        input: 'border-yellow-300 focus:ring-yellow-100 focus:border-yellow-400',
        bar:   'bg-yellow-400',
    };
    return {
        card:  'border-emerald-200 bg-emerald-50',
        input: 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400',
        bar:   'bg-emerald-400',
    };
};

const scoreBadge = (val) => {
    const n = parseFloat(val);
    if (val === '' || isNaN(n)) return null;
    if (n < 60)  return { text: 'Needs work',    cls: 'bg-red-100 text-red-600' };
    if (n < 75)  return { text: 'Satisfactory',  cls: 'bg-yellow-100 text-yellow-700' };
    return               { text: 'Excellent',     cls: 'bg-emerald-100 text-emerald-700' };
};

const EMPTY_SCORES = { Sinhala: '', Mathematics: '', Science: '', English: '', History: '', Buddhism: '', Geography: '', ICT: '' };

/* ─────────────────────────────────────────────────────────── */
const AddStudent = () => {
    const navigate = useNavigate();
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const _user             = getUser();
    const loggedInStudentId = _user?._id || _user?.id || '';

    const [formData, setFormData] = useState({
        iq_level: '',
        study_hours_per_week: '',
        attendance_rate: '',
        student_type: 'balanced',
        subject_scores: { ...EMPTY_SCORES },
    });
    const [submitting, setSubmitting] = useState(false);

    const [profileOpen, setProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [profileLoad, setProfileLoad] = useState(false);
    const [profileErr,  setProfileErr]  = useState('');

    /* ── Inline validation ──────────────────────────────── */
    const validateFieldValue = (name, value) => {
        const n = parseFloat(value);
        if (value === '' || isNaN(n)) return '';
        if (n < 0) return 'Cannot be negative';
        if (name === 'iq_level'              && n > 200) return 'Maximum is 200';
        if (name === 'study_hours_per_week'  && n > 168) return 'Maximum is 168h/week';
        if (name === 'attendance_rate'       && n > 100) return 'Maximum is 100%';
        if (SUBJECTS.some(s => s.name === name) && n > 100) return 'Maximum is 100';
        return '';
    };

    const handleMetricChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: validateFieldValue(field, value) }));
        setError('');
    };

    const handleSubjectChange = (subject, value) => {
        setFormData(prev => ({ ...prev, subject_scores: { ...prev.subject_scores, [subject]: value } }));
        setFieldErrors(prev => ({ ...prev, [subject]: validateFieldValue(subject, value) }));
        setError('');
    };

    /* ── My Profile modal ───────────────────────────────── */
    const openHistory = async () => {
        if (!loggedInStudentId) { setError('Please log in to view your profile.'); return; }
        const upperStudentId = loggedInStudentId.toUpperCase();
        setProfileOpen(true);
        setProfileLoad(true);
        setProfileErr('');
        setProfileData(null);
        try {
            const res = await client.get(`/students/mongodb/${upperStudentId}`);
            setProfileData(res.data);
        } catch (err) {
            setProfileErr(
                err.response?.status === 404
                    ? 'No learning path found. Submit your details first.'
                    : err.response?.data?.detail || 'Failed to load profile.'
            );
        } finally {
            setProfileLoad(false);
        }
    };

    /* ── Full validation before submit ─────────────────── */
    const validateForm = () => {
        const iq = parseFloat(formData.iq_level);
        if (isNaN(iq) || iq < 0 || iq > 200) { setError('IQ Level must be between 0 and 200'); return false; }
        const sh = parseFloat(formData.study_hours_per_week);
        if (isNaN(sh) || sh < 0 || sh > 168) { setError('Study hours must be between 0 and 168'); return false; }
        const at = parseFloat(formData.attendance_rate);
        if (isNaN(at) || at < 0 || at > 100) { setError('Attendance rate must be between 0 and 100'); return false; }
        for (const [subject, score] of Object.entries(formData.subject_scores)) {
            const sv = parseFloat(score);
            if (isNaN(sv) || sv < 0 || sv > 100) { setError(`${subject} score must be between 0 and 100`); return false; }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess(false);
        if (!validateForm()) { setSubmitting(false); return; }
        try {
            const payload = {
                student_id: loggedInStudentId,
                iq_level: parseFloat(formData.iq_level),
                study_hours_per_week: parseFloat(formData.study_hours_per_week),
                attendance_rate: parseFloat(formData.attendance_rate),
                student_type: formData.student_type,
                subject_scores: Object.keys(formData.subject_scores).reduce((acc, key) => {
                    acc[key] = parseFloat(formData.subject_scores[key]);
                    return acc;
                }, {}),
            };
            const response = await client.post('/students/add', payload);
            setSuccess(true);
            const savedStudentId = response.data.student_id;
            setFormData({ iq_level: '', study_hours_per_week: '', attendance_rate: '', student_type: 'balanced', subject_scores: { ...EMPTY_SCORES } });
            setFieldErrors({});
            setTimeout(() => navigate(`/students/${savedStudentId}`), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to add student. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchId.trim()) navigate(`/students/${searchId.trim().toUpperCase()}`);
    };

    return (
        <Layout title="Student Registration" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>

            {/* ══════════════════════════════════════════
                Profile / History Modal
            ══════════════════════════════════════════ */}
            {profileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">📋 My Learning Path Profile</h2>
                            <button onClick={() => setProfileOpen(false)} className="p-2 transition-colors rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
                            {profileLoad && <p className="py-10 text-center text-slate-400">Loading...</p>}
                            {profileErr  && <p className="py-10 text-center text-red-500">{profileErr}</p>}
                            {profileData && (() => {
                                const d = profileData;
                                const weak      = d.weak_subject_analysis?.weak_subjects   || {};
                                const recs      = d.weak_subject_analysis?.recommendations || [];
                                const advice    = d.weak_subject_analysis?.overall_advice  || '';
                                const alPath    = d.al_path   || {};
                                const schedule  = d.weekly_schedule || [];
                                const materials = d.recommended_materials || [];
                                const scores    = d.subject_scores || {};
                                const updatedAt = d.updated_at ? new Date(d.updated_at).toLocaleString() : '—';
                                return (
                                    <>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="flex items-center gap-3 p-3 border border-blue-100 bg-blue-50 rounded-2xl">
                                                <div className="text-blue-500"><Activity size={16}/></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">IQ Level</p>
                                                    <p className="text-sm font-bold text-slate-700">{d.iq_level ?? '—'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 border border-purple-100 bg-purple-50 rounded-2xl">
                                                <div className="text-purple-500"><TrendingUp size={16}/></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Study Hours</p>
                                                    <p className="text-sm font-bold text-slate-700">{d.study_hours_per_week ?? '—'}h/wk</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 border bg-emerald-50 rounded-2xl border-emerald-100">
                                                <div className="text-emerald-500"><Award size={16}/></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance</p>
                                                    <p className="text-sm font-bold text-slate-700">{d.attendance_rate ?? '—'}%</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 border bg-slate-50 rounded-2xl border-slate-100">
                                            <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-500">📊 Subject Scores</h4>
                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                                {Object.entries(scores).map(([subj, score]) => (
                                                    <div key={subj} className="flex items-center justify-between">
                                                        <span className="w-24 text-xs font-medium text-slate-600">{subj}</span>
                                                        <div className="flex items-center flex-1 gap-2">
                                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${score < 60 ? 'bg-red-400' : score < 75 ? 'bg-yellow-400' : 'bg-emerald-400'}`} style={{ width: `${score}%` }} />
                                                            </div>
                                                            <span className={`text-xs font-bold w-8 text-right ${score < 60 ? 'text-red-500' : score < 75 ? 'text-yellow-600' : 'text-emerald-600'}`}>{score}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-4 border border-orange-100 bg-orange-50 rounded-2xl">
                                            <h4 className="flex items-center gap-1 mb-3 text-xs font-bold tracking-wider text-orange-500 uppercase"><AlertTriangle size={13}/> Weak Subjects</h4>
                                            {Object.keys(weak).length === 0
                                                ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle size={14}/> No weak subjects detected — great work!</p>
                                                : <div className="flex flex-wrap gap-2 mb-3">
                                                    {Object.entries(weak).map(([s, sc]) => (
                                                        <span key={s} className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">{s} — {sc}</span>
                                                    ))}
                                                  </div>
                                            }
                                            {recs.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Recommendations</p>
                                                    {recs.map((r, i) => (
                                                        <p key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                            <span className="text-orange-400 mt-0.5">•</span>{r}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {advice && <p className="pt-2 mt-3 text-xs italic border-t border-orange-100 text-slate-500">{advice}</p>}
                                        </div>
                                        {alPath.stream && (
                                            <div className="p-4 border bg-emerald-50 rounded-2xl border-emerald-100">
                                                <h4 className="flex items-center gap-1 mb-2 text-xs font-bold tracking-wider uppercase text-emerald-600"><Star size={13}/> Recommended AL Stream</h4>
                                                <p className="mb-2 text-base font-bold text-slate-800">{alPath.stream}</p>
                                                {alPath.career_paths?.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Career Paths</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {alPath.career_paths.map(c => (
                                                                <span key={c} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">{c}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {alPath.universities?.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Universities</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {alPath.universities.map(u => (
                                                                <span key={u} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full">{u}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {alPath.target_z_score && (
                                                    <p className="text-xs text-slate-400">Target Z-Score: <span className="font-bold text-slate-700">{alPath.target_z_score}</span></p>
                                                )}
                                                {alPath.study_tips?.length > 0 && (
                                                    <div className="pt-3 mt-3 border-t border-emerald-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Study Tips</p>
                                                        {alPath.study_tips.map((t, i) => (
                                                            <p key={i} className="flex items-start gap-2 mb-1 text-xs text-slate-600">
                                                                <span className="text-emerald-400 mt-0.5">✓</span>{t}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {schedule.length > 0 && (
                                            <div className="p-4 border border-purple-100 bg-purple-50 rounded-2xl">
                                                <h4 className="mb-3 text-xs font-bold tracking-wider text-purple-500 uppercase">📅 Weekly Study Schedule</h4>
                                                <div className="space-y-2">
                                                    {schedule.map((day, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full min-w-[72px] text-center">{day.day}</span>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-medium text-slate-700">{Array.isArray(day.subjects) ? day.subjects.join(', ') : day.subjects}</span>
                                                                <span className="text-[10px] text-slate-400 ml-2">({day.duration})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {materials.length > 0 && (
                                            <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl">
                                                <h4 className="mb-3 text-xs font-bold tracking-wider text-blue-500 uppercase">📚 Recommended Study Materials</h4>
                                                <div className="space-y-3">
                                                    {materials.map((m, i) => (
                                                        <div key={i}>
                                                            <p className="mb-1 text-xs font-bold text-slate-700">{m.subject}</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(m.materials || []).map((book, bi) => (
                                                                    <span key={bi} className="px-2 py-0.5 bg-white border border-blue-100 text-blue-700 text-[10px] rounded-lg">{book}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 text-right pb-2">Last updated: {updatedAt}</p>
                                    </>
                                );
                            })()}
                        </div>
                        {profileData && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                                <button onClick={() => setProfileOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">Close</button>
                                <button onClick={() => { setProfileOpen(false); navigate(`/students/${profileData.student_id}`); }}
                                    className="px-5 py-2 text-sm font-bold text-white transition-colors bg-emerald-500 hover:bg-emerald-600 rounded-xl">
                                    View Full Analysis →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ Main Page ═══ */}
            <div className="max-w-5xl mx-auto animate-fadeIn">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between pb-5 border-b mb-7 border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center flex-shrink-0 shadow-md w-11 h-11 bg-emerald-600 rounded-xl">
                            <UserPlus size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Student Registration</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Complete all fields to generate an AI-powered personalised learning path</p>
                        </div>
                    </div>
                    <button type="button" onClick={openHistory}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all bg-white border shadow-sm border-slate-200 rounded-xl text-slate-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50">
                        📋 My Profile
                    </button>
                </div>

                {/* ── Alert banners ── */}
                {success && (
                    <div className="flex items-center gap-3 p-4 mb-5 border bg-emerald-50 border-emerald-200 rounded-xl text-emerald-700">
                        <CheckCircle size={18} className="flex-shrink-0" />
                        <p className="text-sm font-semibold">Student added successfully! Redirecting to analysis...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 p-4 mb-5 text-red-600 border border-red-200 bg-red-50 rounded-xl">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                    {/* ── Section 1: Learning Metrics ── */}
                    <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
                            <span className="w-0.5 h-5 bg-purple-500 rounded-full flex-shrink-0" />
                            <Activity size={14} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Learning Metrics</span>
                            <span className="text-[11px] text-slate-400">— Core performance indicators</span>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                                {/* IQ Level */}
                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
                                        <span className="text-base leading-none">🧠</span> IQ Level
                                        <span className="ml-auto text-[10px] font-normal text-slate-400">0 – 200</span>
                                    </label>
                                    <input
                                        type="number" required min="0" max="200"
                                        value={formData.iq_level}
                                        onChange={(e) => handleMetricChange('iq_level', e.target.value)}
                                        onKeyDown={blockNegative}
                                        placeholder="e.g. 120"
                                        disabled={submitting}
                                        className={`w-full px-4 py-3 text-sm font-semibold border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
                                            fieldErrors.iq_level
                                                ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                                : 'border-slate-200 focus:ring-purple-100 focus:border-purple-400 hover:border-slate-300'
                                        }`}
                                    />
                                    {fieldErrors.iq_level ? (
                                        <p className="mt-1.5 text-[11px] text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={10}/>{fieldErrors.iq_level}</p>
                                    ) : formData.iq_level !== '' && (
                                        <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle size={10}/>Valid</p>
                                    )}
                                </div>

                                {/* Study Hours */}
                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
                                        <span className="text-base leading-none">⏱️</span> Study Hours / Week
                                        <span className="ml-auto text-[10px] font-normal text-slate-400">0 – 168h</span>
                                    </label>
                                    <input
                                        type="number" required min="0" max="168"
                                        value={formData.study_hours_per_week}
                                        onChange={(e) => handleMetricChange('study_hours_per_week', e.target.value)}
                                        onKeyDown={blockNegative}
                                        placeholder="e.g. 20"
                                        disabled={submitting}
                                        className={`w-full px-4 py-3 text-sm font-semibold border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
                                            fieldErrors.study_hours_per_week
                                                ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                                : 'border-slate-200 focus:ring-blue-100 focus:border-blue-400 hover:border-slate-300'
                                        }`}
                                    />
                                    {fieldErrors.study_hours_per_week ? (
                                        <p className="mt-1.5 text-[11px] text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={10}/>{fieldErrors.study_hours_per_week}</p>
                                    ) : formData.study_hours_per_week !== '' && (
                                        <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle size={10}/>Valid</p>
                                    )}
                                </div>

                                {/* Attendance */}
                                <div>
                                    <label className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
                                        <span className="text-base leading-none">📊</span> Attendance Rate
                                        <span className="ml-auto text-[10px] font-normal text-slate-400">0 – 100%</span>
                                    </label>
                                    <input
                                        type="number" required min="0" max="100"
                                        value={formData.attendance_rate}
                                        onChange={(e) => handleMetricChange('attendance_rate', e.target.value)}
                                        onKeyDown={blockNegative}
                                        placeholder="e.g. 85"
                                        disabled={submitting}
                                        className={`w-full px-4 py-3 text-sm font-semibold border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
                                            fieldErrors.attendance_rate
                                                ? 'border-red-300 focus:ring-red-100 bg-red-50'
                                                : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-400 hover:border-slate-300'
                                        }`}
                                    />
                                    {fieldErrors.attendance_rate ? (
                                        <p className="mt-1.5 text-[11px] text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={10}/>{fieldErrors.attendance_rate}</p>
                                    ) : formData.attendance_rate !== '' && (
                                        <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle size={10}/>Valid</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Subject Performance ── */}
                    <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <span className="w-0.5 h-5 bg-orange-500 rounded-full flex-shrink-0" />
                                <Target size={14} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Subject Performance</span>
                                <span className="text-[11px] text-slate-400">— Marks 0 – 100</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500"><span className="inline-block w-2 h-2 bg-red-400 rounded-full"/> &lt;60</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-yellow-600"><span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"/> 60–74</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400"/> 75+</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {SUBJECTS.map(({ name, emoji }) => {
                                    const val   = formData.subject_scores[name];
                                    const n     = parseFloat(val);
                                    const err   = fieldErrors[name];
                                    const s     = scoreStyle(val);
                                    const badge = scoreBadge(val);
                                    const pct   = (!isNaN(n) && n >= 0 && n <= 100) ? n : 0;
                                    return (
                                        <div key={name} className={`border rounded-xl p-4 transition-all ${err ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                            <div className="flex items-center justify-between mb-2.5">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                                    <span className="text-sm leading-none">{emoji}</span> {name}
                                                </label>
                                                {badge && !err && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
                                                )}
                                            </div>
                                            <input
                                                type="number" required min="0" max="100"
                                                onKeyDown={blockNegative}
                                                value={val}
                                                onChange={(e) => handleSubjectChange(name, e.target.value)}
                                                placeholder="0 – 100"
                                                disabled={submitting}
                                                className={`w-full px-3 py-2.5 text-sm font-bold text-center border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white ${
                                                    err ? 'border-red-300 focus:ring-red-100' : s.input
                                                }`}
                                            />
                                            {val !== '' && !isNaN(n) && n >= 0 && n <= 100 && (
                                                <div className="h-1 mt-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${s.bar || 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            )}
                                            {err && (
                                                <p className="mt-1.5 text-[10px] text-red-500 font-medium flex items-center gap-1"><AlertTriangle size={9}/>{err}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <div className="flex justify-end pb-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Generating Path...
                                </>
                            ) : (
                                <><Save size={16}/> Generate Learning Path</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default AddStudent;
