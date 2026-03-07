import { useState, useEffect, useCallback } from 'react';
import { fetchAnomalies, fetchAnomalyTypeSummary } from '../../api/attendanceApi';
import { AlertTriangle, ChevronLeft, ChevronRight, TrendingDown, Zap, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_BADGE = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
            <p className="font-semibold text-slate-300 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span></p>
            ))}
        </div>
    );
};

export default function AnomalyReport() {
    const [data, setData] = useState({ anomalies: [], total: 0, pages: 1 });
    const [typeSummary, setTypeSummary] = useState([]);
    const [page, setPage] = useState(1);
    const [riskLevel, setRiskLevel] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            fetchAnomalies({ page, limit: 15, riskLevel, sort: '-anomaly_score' }),
            fetchAnomalyTypeSummary()
        ]).then(([d, t]) => {
            setData(d);
            setTypeSummary(t.map(item => ({
                type: (item._id || 'Unknown').replace(/_/g, ' '),
                count: item.count,
                avg_score: parseFloat(item.avg_score?.toFixed(2) || 0),
                avg_rate: parseFloat(item.avg_rate?.toFixed(1) || 0),
            })));
        }).catch(console.error).finally(() => setLoading(false));
    }, [page, riskLevel]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [riskLevel]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text">Anomaly Detection Report</h1>
                <p className="text-slate-400 text-sm mt-1">AI-detected irregular attendance patterns flagged for review</p>
            </div>

            {/* Summary Chart */}
            <div className="card">
                <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-400" />Anomaly Type Distribution
                </h3>
                <p className="text-slate-500 text-xs mb-4">Count and average anomaly score by type</p>
                {loading ? (
                    <div className="h-52 rounded-xl bg-slate-700/40 shimmer" />
                ) : typeSummary.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No anomaly data found. Run the seed script first.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={typeSummary} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                            <YAxis type="category" dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} width={120} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Count" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Filters & Table */}
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold">
                        {loading ? 'Loading…' : `${data.total.toLocaleString()} Anomalous Students`}
                    </span>
                </div>
                <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="input-field w-44">
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                {['Student', 'Grade', 'Anomaly Type', 'Score', 'Attendance %', 'Consecutive Abs.', 'Risk'].map(h => (
                                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-700/30">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 rounded bg-slate-700 shimmer" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.anomalies.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-slate-500">No anomalies found.</td></tr>
                            ) : data.anomalies.map(a => (
                                <tr key={a.student_id} className="table-row">
                                    <td className="px-6 py-4">
                                        <p className="text-white font-medium text-sm">{a.name || '—'}</p>
                                        <p className="text-slate-500 text-xs font-mono">{a.student_id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 text-sm">{a.grade || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-sm text-amber-300">
                                            <Zap className="w-3 h-3" />
                                            {a.anomaly_type?.replace(/_/g, ' ') || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-orange-400">{a.anomaly_score?.toFixed(3)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.min(a.attendance_rate, 100)}%` }} />
                                            </div>
                                            <span className="text-red-400 text-sm font-semibold">{a.attendance_rate?.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1 text-sm text-slate-300">
                                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                            {a.consecutive_absences ?? 0} days
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={RISK_BADGE[a.risk_level] || 'badge bg-slate-600 text-slate-300'}>
                                            {a.risk_level?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">Page {page} of {data.pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-primary disabled:opacity-40 px-3 py-1.5">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-primary disabled:opacity-40 px-3 py-1.5">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
