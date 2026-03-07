import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';
import { API_URLS } from '../../api/config';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, Cell,
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle, BookOpen, Clock } from 'lucide-react';

/* ─── colour helpers ─── */
const bracketColour = (bracket) => {
  if (bracket.startsWith('<') || bracket.startsWith('50') || bracket.startsWith('60')) return '#ef4444';
  if (bracket.startsWith('70') || bracket.startsWith('70-75')) return '#f97316';
  if (bracket.startsWith('75') || bracket.startsWith('80')) return '#f59e0b';
  if (bracket.startsWith('85') || bracket.startsWith('90')) return '#22c55e';
  return '#10b981';
};
const dotColour = (type) => {
  const map = {
    science_oriented: '#6366f1',
    arts_oriented:    '#f59e0b',
    commerce_oriented:'#10b981',
    mixed:            '#ec4899',
  };
  return map[type] || '#94a3b8';
};
const riskBadge = (rate) => {
  if (rate < 60) return { label: 'Critical', cls: 'bg-red-100 text-red-700' };
  if (rate < 75) return { label: 'At Risk',  cls: 'bg-orange-100 text-orange-700' };
  return           { label: 'Low Risk', cls: 'bg-yellow-100 text-yellow-700' };
};

/* ─── stat card ─── */
const StatCard = ({ icon, label, value, sub, colour }) => (
  <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm border ${colour}`}>
    <div className="p-3 shadow-inner rounded-xl bg-white/70">{icon}</div>
    <div>
      <p className="text-xs font-medium tracking-wide uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold leading-tight text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── custom scatter dot ─── */
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={4} fill={dotColour(payload.student_type)} fillOpacity={0.75} stroke="none" />;
};

const AttendanceAnalyze = () => {
  const BASE = API_URLS.LEARNING_PATH_BACKEND;

  const [overview,     setOverview]     = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [correlation,  setCorrelation]  = useState([]);
  const [byType,       setByType]       = useState([]);
  const [atRisk,       setAtRisk]       = useState([]);
  const [trend,        setTrend]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ov, dist, corr, type, risk, tr] = await Promise.all([
          axios.get(`${BASE}/api/attendance/overview`),
          axios.get(`${BASE}/api/attendance/distribution`),
          axios.get(`${BASE}/api/attendance/performance-correlation`),
          axios.get(`${BASE}/api/attendance/by-student-type`),
          axios.get(`${BASE}/api/attendance/at-risk-students`),
          axios.get(`${BASE}/api/attendance/monthly-trend`),
        ]);
        setOverview(ov.data);
        setDistribution(dist.data);
        setCorrelation(corr.data);
        setByType(type.data);
        setAtRisk(risk.data);
        setTrend(tr.data);
      } catch (e) {
        setError('Failed to load attendance data. Is the backend running on port 8000?');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [BASE]);

  const tabs = [
    { id: 'overview',     label: 'Overview' },
    { id: 'distribution', label: 'Distribution' },
    { id: 'correlation',  label: 'Attendance vs Performance' },
    { id: 'types',        label: 'By Student Type' },
    { id: 'atrisk',       label: 'At-Risk Students' },
    { id: 'trend',        label: 'Grade Trend' },
  ];

  return (
    <Layout title="Attendance Trend Analyzer">
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="p-6 text-white shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={22} />
            <h1 className="text-xl font-bold">Attendance Trend Analyzer</h1>
          </div>
          <p className="text-sm text-emerald-100">
            Visualise attendance patterns, identify at-risk students and explore correlations with academic performance.
          </p>
        </div>

        {/* ── Loading / Error ── */}
        {loading && (
          <div className="flex items-center justify-center h-48 bg-white border shadow-sm rounded-2xl border-slate-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 rounded-full border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-500">Loading attendance data…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-600 border border-red-200 bg-red-50 rounded-2xl">
            <AlertTriangle size={28} className="mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && overview && (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<Users size={20} className="text-indigo-600" />}
                label="Total Students"
                value={overview.total_students}
                sub="in dataset"
                colour="bg-indigo-50 border-indigo-100"
              />
              <StatCard
                icon={<TrendingUp size={20} className="text-emerald-600" />}
                label="Average Attendance"
                value={`${overview.average_attendance}%`}
                sub="across all students"
                colour="bg-emerald-50 border-emerald-100"
              />
              <StatCard
                icon={<AlertTriangle size={20} className="text-red-500" />}
                label="At-Risk Students"
                value={overview.at_risk_count}
                sub={`${overview.at_risk_pct}% — below 75%`}
                colour="bg-red-50 border-red-100"
              />
              <StatCard
                icon={<CheckCircle size={20} className="text-teal-600" />}
                label="High Attendance"
                value={overview.high_attendance_count}
                sub={`${overview.high_att_pct}% — above 90%`}
                colour="bg-teal-50 border-teal-100"
              />
            </div>

            {/* ── Tabs ── */}
            <div className="flex flex-wrap gap-2">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB: Overview ── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Risk breakdown donut-style bar */}
                <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                  <h3 className="mb-4 font-semibold text-slate-700">Attendance Risk Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'High Attendance (≥90%)', value: overview.high_attendance_count, total: overview.total_students, colour: 'bg-emerald-500' },
                      { label: 'Moderate (75–90%)',      value: overview.moderate_count,         total: overview.total_students, colour: 'bg-yellow-400' },
                      { label: 'At Risk (<75%)',          value: overview.at_risk_count,          total: overview.total_students, colour: 'bg-red-500' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-semibold text-slate-800">{item.value} students</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.colour} transition-all duration-700`}
                            style={{ width: `${(item.value / item.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                  <h3 className="mb-4 font-semibold text-slate-700">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'At-Risk %',     value: `${overview.at_risk_pct}%`,   colour: 'text-red-600' },
                      { label: 'High Att. %',   value: `${overview.high_att_pct}%`,  colour: 'text-emerald-600' },
                      { label: 'Moderate %',    value: `${(100 - overview.at_risk_pct - overview.high_att_pct).toFixed(1)}%`, colour: 'text-yellow-600' },
                      { label: 'Avg. Attendance', value: `${overview.average_attendance}%`, colour: 'text-indigo-600' },
                    ].map(s => (
                      <div key={s.label} className="p-4 text-center bg-slate-50 rounded-xl">
                        <p className={`text-2xl font-bold ${s.colour}`}>{s.value}</p>
                        <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Distribution ── */}
            {activeTab === 'distribution' && (
              <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                <h3 className="mb-1 font-semibold text-slate-700">Attendance Rate Distribution</h3>
                <p className="mb-5 text-xs text-slate-400">Number of students in each attendance bracket</p>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`${v} students`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distribution.map((entry, i) => (
                        <Cell key={i} fill={bracketColour(entry.bracket)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-4">
                  {[
                    { label: 'Critical (<70%)',   colour: '#ef4444' },
                    { label: 'At Risk (70–75%)',  colour: '#f97316' },
                    { label: 'Moderate (75–85%)', colour: '#f59e0b' },
                    { label: 'Good (85%+)',        colour: '#22c55e' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.colour }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: Attendance vs Performance ── */}
            {activeTab === 'correlation' && (
              <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                <h3 className="mb-1 font-semibold text-slate-700">Attendance vs Academic Performance</h3>
                <p className="mb-5 text-xs text-slate-400">Each dot is a student — higher attendance often corresponds to better scores</p>
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="attendance_rate" name="Attendance %" type="number" domain={[40, 100]} tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Attendance Rate (%)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="avg_score" name="Avg Score" type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Avg Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                      formatter={(v, name) => [typeof v === 'number' ? v.toFixed(1) : v, name]}
                    />
                    <Scatter data={correlation} shape={<CustomDot />} />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-4">
                  {['science_oriented', 'arts_oriented', 'commerce_oriented', 'mixed'].map(t => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColour(t) }} />
                      {t.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: By Student Type ── */}
            {activeTab === 'types' && (
              <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                <h3 className="mb-1 font-semibold text-slate-700">Attendance by Student Type</h3>
                <p className="mb-5 text-xs text-slate-400">Average attendance and score per academic stream</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={byType} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="student_type" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.replace('_', ' ')} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`${v}%`]}
                    />
                    <Legend />
                    <Bar dataKey="avg_attendance" name="Avg Attendance %" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avg_score"      name="Avg Score %"      fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-5 sm:grid-cols-4">
                  {byType.map(t => (
                    <div key={t.student_type} className="p-3 text-center bg-slate-50 rounded-xl">
                      <p className="mb-2 text-xs font-semibold capitalize text-slate-700">{t.student_type.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-emerald-600">{t.avg_attendance}%</p>
                      <p className="text-xs text-slate-400">attendance</p>
                      <p className="mt-1 text-sm font-semibold text-indigo-600">{t.avg_score}%</p>
                      <p className="text-xs text-slate-400">avg score</p>
                      <p className="mt-1 text-xs text-slate-400">{t.count} students</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: At-Risk Students ── */}
            {activeTab === 'atrisk' && (
              <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-700">At-Risk Students</h3>
                    <p className="text-xs text-slate-400">Students with attendance below 75%, sorted by severity</p>
                  </div>
                  <span className="px-3 py-1 text-sm font-bold text-red-700 bg-red-100 rounded-full">
                    {atRisk.length} students
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left bg-slate-50">
                        {['Student ID', 'Attendance', 'Avg Score', 'Study hrs/wk', 'Type', 'Risk Level'].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold tracking-wide uppercase rounded-lg text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {atRisk.map((s, i) => {
                        const badge = riskBadge(s.attendance_rate);
                        return (
                          <tr key={i} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-medium text-slate-700">{s.student_id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${s.attendance_rate}%` }} />
                                </div>
                                <span className="font-semibold text-red-600">{s.attendance_rate}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{s.avg_score}%</td>
                            <td className="px-4 py-3 text-slate-700">{s.study_hours}h</td>
                            <td className="px-4 py-3 capitalize text-slate-500">{s.student_type?.replace('_', ' ')}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {atRisk.length === 0 && (
                    <p className="py-12 text-center text-slate-400">No at-risk students found.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: Grade Trend ── */}
            {activeTab === 'trend' && (
              <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-100">
                <h3 className="mb-1 font-semibold text-slate-700">Attendance & Score Trend by Grade</h3>
                <p className="mb-5 text-xs text-slate-400">Average values across all students at each grade level</p>
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(v) => [`${v}%`]}
                      />
                      <Legend wrapperStyle={{ paddingTop: 40 }} />
                      <Line type="monotone" dataKey="avg_attendance" name="Avg Attendance %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                      <Line type="monotone" dataKey="avg_score"      name="Avg Score %"      stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-slate-400">No trend data available.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceAnalyze;
