import { useState, useEffect, useCallback } from 'react';
import { fetchStudents } from '../../api/attendanceApi';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';

const RISK_BADGE = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

export default function StudentList() {
    const [data, setData] = useState({ students: [], total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [riskLevel, setRiskLevel] = useState('');
    const [sort, setSort] = useState('-attendance_rate');
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        fetchStudents({ page, limit: 20, search, riskLevel, sort })
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, search, riskLevel, sort]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, riskLevel, sort]);

    const handleSearch = (e) => setSearch(e.target.value);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text">Student Directory</h1>
                <p className="text-slate-400 text-sm mt-1">Browse and filter student attendance records</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text" placeholder="Search by name..."
                        value={search} onChange={handleSearch}
                        className="input-field w-full pl-9" />
                </div>
                <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="input-field w-full sm:w-44">
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <select value={sort} onChange={e => setSort(e.target.value)} className="input-field w-full sm:w-52">
                    <option value="-attendance_rate">Lowest Attendance</option>
                    <option value="attendance_rate">Highest Attendance</option>
                    <option value="name">Name A-Z</option>
                    <option value="-absent_days">Most Absences</option>
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        Students
                        {!loading && <span className="text-slate-400 font-normal text-sm">({data.total.toLocaleString()} total)</span>}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                {['Student ID', 'Name', 'Grade', 'Section', 'Attendance %', 'Present', 'Absent', 'Risk'].map(h => (
                                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-700/30">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 rounded bg-slate-700 shimmer" style={{ width: `${40 + Math.random() * 60}%` }} /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.students.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-slate-500">
                                    No students found. {!search && !riskLevel && "Run `npm run seed` to load data."}
                                </td></tr>
                            ) : data.students.map(s => (
                                <tr key={s.student_id} className="table-row">
                                    <td className="px-6 py-4 text-slate-400 text-sm font-mono">{s.student_id}</td>
                                    <td className="px-6 py-4 text-white font-medium text-sm">{s.name}</td>
                                    <td className="px-6 py-4 text-slate-300 text-sm">{s.grade}</td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{s.section || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-20">
                                                <div
                                                    className="h-1.5 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(s.attendance_rate, 100)}%`,
                                                        background: s.attendance_rate < 60 ? '#ef4444' : s.attendance_rate < 75 ? '#f97316' : s.attendance_rate < 85 ? '#eab308' : '#22c55e'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-white text-sm font-semibold w-12">{s.attendance_rate?.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-green-400 text-sm font-medium">{s.present_days?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-400 text-sm font-medium">{s.absent_days?.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={RISK_BADGE[s.risk_level] || 'badge bg-slate-600 text-slate-300'}>
                                            {s.risk_level?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">Page {page} of {data.pages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
