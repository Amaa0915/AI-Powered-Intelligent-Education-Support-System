import { useEffect, useState } from 'react';
import { fetchSummary, fetchGradeBreakdown, fetchMonthlySummary, fetchRateDistribution } from '../../api/attendanceApi';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, UserX, Calendar, Activity, BarChart2 } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RISK_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, sub, color = 'blue', loading }) {
    const colorMap = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{label}</p>
                    {loading ? (
                        <div className="h-8 w-24 mt-2 rounded-lg bg-slate-700 shimmer" />
                    ) : (
                        <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
                    )}
                    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
            <p className="font-semibold text-slate-300 mb-2">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
                    <span>{p.name}:</span><span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </p>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [gradeBreakdown, setGradeBreakdown] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [rateDistribution, setRateDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchSummary(), fetchGradeBreakdown(), fetchMonthlySummary(), fetchRateDistribution()])
            .then(([s, g, m, r]) => {
                setSummary(s || null);
                const safeG = Array.isArray(g) ? g : [];
                const safeM = Array.isArray(m) ? m : [];
                const safeR = Array.isArray(r) ? r : [];
                setGradeBreakdown(safeG.map(d => ({ grade: d._id || 'N/A', count: d.count, rate: parseFloat(d.avg_attendance?.toFixed(1) || 0), anomalous: d.anomalous })));
                setMonthlyData(safeM.map(d => ({
                    name: `${MONTHS[(d._id?.month || 1) - 1]} ${d._id?.year || ''}`,
                    rate: parseFloat(d.attendance_rate?.toFixed(1) || 0),
                    present: d.present,
                    absent: d.absent,
                })));
                setRateDistribution(safeR.map(d => ({ range: `${d._id}%+`, count: d.count })));
            })
            .catch(err => { console.error('Dashboard fetch error:', err); })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold gradient-text">Overview Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Real-time student attendance analytics and predictions</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Students" value={summary?.totalStudents?.toLocaleString()} sub="Registered in system" color="blue" loading={loading} />
                <StatCard icon={Activity} label="Avg. Attendance Rate" value={summary?.overallAttendanceRate ? `${summary.overallAttendanceRate}%` : null} sub="Across all records" color="green" loading={loading} />
                <StatCard icon={AlertTriangle} label="Anomalous Students" value={summary?.anomalousStudents?.toLocaleString()} sub="Irregular patterns detected" color="orange" loading={loading} />
                <StatCard icon={UserX} label="Critical Risk" value={summary?.criticalStudents?.toLocaleString()} sub="Below 60% attendance" color="red" loading={loading} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Monthly Attendance Trend */}
                <div className="card">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" />Monthly Attendance Trend</h3>
                    <p className="text-slate-500 text-xs mb-4">Overall attendance rate over time</p>
                    {loading ? (
                        <div className="h-64 rounded-xl bg-slate-700/40 shimmer" />
                    ) : monthlyData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No data available. Run the seed script to load data.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                                <YAxis domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="rate" name="Attendance Rate" stroke="#3b82f6" fill="url(#rateGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Grade Breakdown */}
                <div className="card">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-purple-400" />Attendance by Grade</h3>
                    <p className="text-slate-500 text-xs mb-4">Average attendance rate per grade</p>
                    {loading ? (
                        <div className="h-64 rounded-xl bg-slate-700/40 shimmer" />
                    ) : gradeBreakdown.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No data available.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={gradeBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="grade" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                                <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="rate" name="Avg Rate (%)" radius={[6, 6, 0, 0]}>
                                    {gradeBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Rate Distribution */}
                <div className="card xl:col-span-2">
                    <h3 className="text-white font-semibold mb-1">Attendance Rate Distribution</h3>
                    <p className="text-slate-500 text-xs mb-4">Number of students per attendance rate range</p>
                    {loading ? (
                        <div className="h-52 rounded-xl bg-slate-700/40 shimmer" />
                    ) : rateDistribution.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No data.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={rateDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                                    {rateDistribution.map((d, i) => {
                                        const v = parseInt(d.range);
                                        const color = v < 60 ? '#ef4444' : v < 75 ? '#f97316' : v < 85 ? '#eab308' : '#22c55e';
                                        return <Cell key={i} fill={color} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Risk Level Pie */}
                <div className="card">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" />Risk Distribution</h3>
                    <p className="text-slate-500 text-xs mb-3">Students by risk category</p>
                    {loading ? (
                        <div className="h-40 rounded-xl bg-slate-700/40 shimmer mt-4" />
                    ) : !summary ? null : (() => {
                        const pieData = [
                            { name: 'Low', value: summary.totalStudents - summary.highRiskStudents - summary.criticalStudents - (summary.anomalousStudents - summary.highRiskStudents), color: '#22c55e' },
                            { name: 'Medium', value: Math.max(0, summary.anomalousStudents - summary.highRiskStudents - summary.criticalStudents), color: '#eab308' },
                            { name: 'High', value: summary.highRiskStudents, color: '#f97316' },
                            { name: 'Critical', value: summary.criticalStudents, color: '#ef4444' },
                        ].filter(d => d.value > 0);
                        return (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                                            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                    {pieData.map(d => (
                                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                            <span>{d.name}: <span className="text-white font-medium">{d.value}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Records', value: summary?.totalRecords?.toLocaleString(), icon: Calendar, color: 'blue' },
                    { label: 'High Risk Students', value: summary?.highRiskStudents?.toLocaleString(), icon: AlertTriangle, color: 'orange' },
                    { label: 'System Average Rate', value: summary?.avgAttendanceRate ? `${summary.avgAttendanceRate}%` : null, icon: TrendingUp, color: 'green' },
                ].map(s => (
                    <StatCard key={s.label} {...s} loading={loading} />
                ))}
            </div>
        </div>
    );
}
