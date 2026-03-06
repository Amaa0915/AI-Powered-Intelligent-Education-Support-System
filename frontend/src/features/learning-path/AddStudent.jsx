import React, { useState } from 'react';
import { Save, ArrowLeft, UserPlus, Info, BookOpen, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/learningPathClient';
import Layout from '../../components/Layout';

const AddStudent = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchId, setSearchId] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        iq_level: '',
        study_hours_per_week: '',
        attendance_rate: '',
        student_type: 'balanced',
        subject_scores: {
            Sinhala: '',
            Mathematics: '',
            Science: '',
            English: '',
            History: '',
            Buddhism: '',
            Geography: '',
            ICT: ''
        }
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubjectChange = (subject, value) => {
        setFormData(prev => ({
            ...prev,
            subject_scores: {
                ...prev.subject_scores,
                [subject]: value
            }
        }));
    };

    const validateForm = () => {
        const iq = parseFloat(formData.iq_level);
        if (isNaN(iq) || iq < 0 || iq > 200) {
            setError('IQ Level must be between 0 and 200');
            return false;
        }

        const studyHours = parseFloat(formData.study_hours_per_week);
        if (isNaN(studyHours) || studyHours < 0 || studyHours > 168) {
            setError('Study hours must be between 0 and 168');
            return false;
        }

        const attendance = parseFloat(formData.attendance_rate);
        if (isNaN(attendance) || attendance < 0 || attendance > 100) {
            setError('Attendance rate must be between 0 and 100');
            return false;
        }

        for (const [subject, score] of Object.entries(formData.subject_scores)) {
            const scoreValue = parseFloat(score);
            if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
                setError(`${subject} score must be between 0 and 100`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess(false);

        if (!validateForm()) {
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                student_id: formData.student_id.trim().toUpperCase(),
                iq_level: parseFloat(formData.iq_level),
                study_hours_per_week: parseFloat(formData.study_hours_per_week),
                attendance_rate: parseFloat(formData.attendance_rate),
                student_type: formData.student_type,
                subject_scores: Object.keys(formData.subject_scores).reduce((acc, key) => {
                    acc[key] = parseFloat(formData.subject_scores[key]);
                    return acc;
                }, {})
            };

            console.log('Submitting student data:', payload);
            const response = await client.post('/students/add', payload);
            console.log('Student added successfully:', response.data);

            setSuccess(true);
            const savedStudentId = response.data.student_id;

            setFormData({
                student_id: '',
                iq_level: '',
                study_hours_per_week: '',
                attendance_rate: '',
                student_type: 'balanced',
                subject_scores: {
                    Sinhala: '',
                    Mathematics: '',
                    Science: '',
                    English: '',
                    History: '',
                    Buddhism: '',
                    Geography: '',
                    ICT: ''
                }
            });

            setTimeout(() => {
                navigate(`/students/${savedStudentId}`);
            }, 2000);
        } catch (err) {
            console.error('Error adding student:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to add student. Please try again.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchId.trim()) {
            navigate(`/students/${searchId.trim().toUpperCase()}`);
        }
    };

    return (
        <Layout
            title="Student Registration"
            searchId={searchId}
            setSearchId={setSearchId}
            handleSearch={handleSearch}
        >
            <div className="animate-fadeIn max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Enter Student Details</h1>
                        <p className="text-slate-500">Fill in the details to add a new student to the AI monitoring system.</p>
                    </div>
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <UserPlus size={32} />
                    </div>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 animate-fadeIn">
                        <Info size={20} />
                        <p className="font-medium text-sm">Student added successfully! Redirecting...</p>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-fadeIn">
                        <Info size={20} />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="card bg-white p-8 border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            Learning Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">IQ Level</label>
                                <input type="number" required className="input" value={formData.iq_level}
                                    onChange={(e) => setFormData({ ...formData, iq_level: e.target.value })}
                                    placeholder="0-200" disabled={submitting} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Hours</label>
                                <input type="number" required className="input" value={formData.study_hours_per_week}
                                    onChange={(e) => setFormData({ ...formData, study_hours_per_week: e.target.value })}
                                    placeholder="hours/week" disabled={submitting} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance %</label>
                                <input type="number" required className="input" value={formData.attendance_rate}
                                    onChange={(e) => setFormData({ ...formData, attendance_rate: e.target.value })}
                                    placeholder="0-100" disabled={submitting} />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white p-8 border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                                <Target size={18} />
                            </div>
                            Subject Performance
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.keys(formData.subject_scores).map(subject => (
                                <div key={subject} className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subject}</label>
                                    <input type="number" required className="input text-center"
                                        value={formData.subject_scores[subject]}
                                        onChange={(e) => handleSubjectChange(subject, e.target.value)}
                                        placeholder="0-100" disabled={submitting} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="submit" disabled={submitting}
                            className="px-10 py-3 bg-emerald-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50">
                            {submitting ? 'Registering...' : (
                                <><Save size={18} /> Save Student</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default AddStudent;
