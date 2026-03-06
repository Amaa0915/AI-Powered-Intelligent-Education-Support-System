import React, { useState, useEffect } from 'react';
import client from '../../api/learningPathClient';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Users } from 'lucide-react';
import Layout from '../../components/Layout';

const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await client.get('/students');
                setStudents(response.data);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchId.trim()) {
            navigate(`/students/${searchId.trim().toUpperCase()}`);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 75) return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
        if (score >= 50) return { bg: 'bg-blue-50', text: 'text-blue-600' };
        return { bg: 'bg-rose-50', text: 'text-rose-600' };
    };

    return (
        <Layout title="Students Directory" searchId={searchId} setSearchId={setSearchId} handleSearch={handleSearch}>
            <div className="animate-fadeIn">
                <div className="mb-8 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by Student ID or Type..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                    </span>
                </div>

                <div className="card bg-white border-slate-100 shadow-sm overflow-hidden p-0">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 font-medium">Loading students...</div>
                    ) : (
                        <>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="text-left px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Score</th>
                                        <th className="text-left px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="text-left px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cluster</th>
                                        <th className="px-6 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map(student => {
                                        const scoreStyle = getScoreColor(student.avg_score);
                                        return (
                                            <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-sm">
                                                            {student.student_id.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{student.student_id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${scoreStyle.bg} ${scoreStyle.text}`}>
                                                        {student.avg_score.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm text-slate-500 capitalize">{student.student_type.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-slate-400">#{student.cluster}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Link to={`/students/${student.student_id}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all group-hover:shadow-md">
                                                        View Profile <ChevronRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-20 text-center">
                                    <Users size={48} className="mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-400 font-medium">No students found matching <span className="font-bold">"{searchTerm}"</span></p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudentList;
