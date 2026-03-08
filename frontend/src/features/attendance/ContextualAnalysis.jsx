import { useState, useEffect } from 'react';
import {
    fetchContextualImpact, fetchStudentImpact,
    predictContextual, predictStudentContextual,
    fetchStudentFilteredAttendance, predictGuestTrend
} from '../../api/attendanceApi';
import {
    BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, Legend
} from 'recharts';
import {
    Cloud, Sun, BookOpen, Calendar, Search, Loader, AlertTriangle,
    Activity, Zap, TrendingUp, TrendingDown, Brain, MapPin,
    X, ChevronRight, CheckCircle, AlertCircle, Info, Sparkles, BarChart2
} from 'lucide-react';
import { Area, AreaChart, ComposedChart, ReferenceLine } from 'recharts';

// ─── Shared Helpers ───────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEATHER_COLORS = {
    sunny: '#f59e0b', cloudy: '#94a3b8', rainy: '#3b82f6',
    windy: '#06b6d4', Sunny: '#f59e0b', Cloudy: '#94a3b8', Rainy: '#3b82f6',
    Stormy: '#6366f1', Foggy: '#64748b', Windy: '#06b6d4', Unknown: '#475569'
};
const DISTANCE_COLORS = { Nearby: '#22c55e', Moderate: '#eab308', Far: '#f97316', 'Very Far': '#ef4444' };
const EVENT_COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308', '#3b82f6', '#ef4444', '#10b981', '#f43f5e', '#a78bfa', '#fb923c', '#34d399'];
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
const DISTANCE_BANDS = ['Nearby', 'Moderate', 'Far', 'Very Far'];

const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
            <p className="text-slate-300 font-semibold mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.fill }} className="flex justify-between gap-4">
                    <span>{p.name}:</span>
                    <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.name?.includes('Rate') || p.name?.includes('rate') ? '%' : ''}</span>
                </p>
            ))}
        </div>
    );
};

const ChartSkel = ({ h = 200 }) => (
    <div className="rounded-xl bg-slate-700/40 shimmer flex items-center justify-center" style={{ height: h }}>
        <Loader className="w-5 h-5 animate-spin text-slate-500" />
    </div>
);

const RateGauge = ({ value, label, sub }) => {
    const color = value >= 85 ? '#22c55e' : value >= 75 ? '#eab308' : '#ef4444';
    return (
        <div className="stat-card text-center">
            <p className="text-slate-400 text-xs mb-2">{label}</p>
            <p className="text-4xl font-black" style={{ color }}>{value?.toFixed(1)}%</p>
            {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
    );
};

// ─── Global Impact Section ────────────────────────────────────────────────────
function GlobalImpact({ data, loading }) {
    if (loading) return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map(i => <div key={i} className="card"><ChartSkel /></div>)}
        </div>
    );
    if (!data) return null;

    const monthData = (data.monthly_impact || []).map(m => ({
        month: MONTHS[m.month - 1], rate: m.rate, total: m.total
    }));

    const holidayBar = [
        { label: 'School Day', rate: data.holiday_impact?.find(h => !h.is_holiday)?.rate || 0, fill: '#22c55e' },
        { label: 'Holiday', rate: data.holiday_impact?.find(h => h.is_holiday)?.rate || 0, fill: '#ef4444' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="card">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-cyan-400" />Weather Impact on All Students
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">Attendance rate grouped by weather condition</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={data.weather_impact || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="condition" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                            <YAxis domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                            <Tooltip content={<CT />} />
                            <Bar dataKey="rate" name="Attendance Rate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {(data.weather_impact || []).map((d, i) => (
                                    <Cell key={i} fill={WEATHER_COLORS[d.condition] || '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />Holiday vs School Day
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">How academic holidays affect overall attendance</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={holidayBar}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                            <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                            <Tooltip content={<CT />} />
                            <Bar dataKey="rate" name="Attendance Rate" radius={[8, 8, 0, 0]} maxBarSize={80}>
                                {holidayBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex gap-4 justify-center text-xs text-slate-400">
                        <span>Drop on holidays: <span className="text-red-400 font-bold">
                            {(holidayBar[0].rate - holidayBar[1].rate).toFixed(1)}%
                        </span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="card">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-400" />School Event Impact
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">Attendance rate during each school event</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={data.event_impact || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                            <YAxis type="category" dataKey="event" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} width={130} />
                            <Tooltip content={<CT />} />
                            <Bar dataKey="rate" name="Attendance Rate" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                {(data.event_impact || []).map((d, i) => <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />Monthly Attendance Trend
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">Overall attendance rate by month of year</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <LineChart data={monthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                            <YAxis domain={[75, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                            <Tooltip content={<CT />} />
                            <Line type="monotone" dataKey="rate" name="Attendance Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />Day-of-Week Attendance Pattern
                </h4>
                <p className="text-slate-500 text-xs mb-4">Which day of the week has highest attendance?</p>
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={(data.dow_impact || []).filter(d => d.day)}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                        <Radar name="Attendance Rate" dataKey="rate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                        <Tooltip content={<CT />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Distance to School */}
            {data.distance_impact && data.distance_impact.length > 0 && (
                <div className="card">
                    <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />Distance to School Impact
                    </h4>
                    <p className="text-slate-500 text-xs mb-4">How far students live affects their attendance rate</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={data.distance_impact}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="band" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                            <YAxis domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                            <Tooltip content={<CT />} />
                            <Bar dataKey="rate" name="Attendance Rate" radius={[6, 6, 0, 0]} maxBarSize={70}>
                                {(data.distance_impact).map((d, i) => (
                                    <Cell key={i} fill={DISTANCE_COLORS[d.band] || '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400 justify-center">
                        {DISTANCE_BANDS.map(b => (
                            <span key={b} className="flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: DISTANCE_COLORS[b] }} />
                                {b}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Student Lookup Section ───────────────────────────────────────────────────
function StudentImpact() {
    const [inputVal, setInputVal] = useState('');
    const [studentId, setStudentId] = useState('');
    const [baseData, setBaseData] = useState(null);
    const [filterData, setFilterData] = useState(null);
    const [activeFilter, setActiveFilter] = useState({ type: null, value: null });
    const [loading, setLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [err, setErr] = useState('');

    const loadStudent = async (sid) => {
        setLoading(true); setErr(''); setBaseData(null); setFilterData(null); setActiveFilter({ type: null, value: null });
        try {
            const res = await fetchStudentFilteredAttendance({ student_id: sid });
            setBaseData(res);
        } catch (e) { setErr(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const handleSearch = () => {
        const sid = inputVal.trim();
        if (!sid) return;
        setStudentId(sid);
        loadStudent(sid);
    };

    const applyFilter = async (type, value) => {
        if (!studentId) return;
        if (activeFilter.type === type && activeFilter.value === value) {
            setActiveFilter({ type: null, value: null });
            setFilterData(null);
            return;
        }
        setFilterLoading(true);
        setActiveFilter({ type, value });
        try {
            const res = await fetchStudentFilteredAttendance({ student_id: studentId, [type]: value });
            setFilterData(res);
        } catch { }
        finally { setFilterLoading(false); }
    };

    const shown = filterData || baseData;
    const rate = shown?.attendance_rate;
    const rateColor = rate == null ? '#64748b' : rate >= 85 ? '#22c55e' : rate >= 75 ? '#eab308' : '#ef4444';

    const dowData = (baseData?.dow_breakdown || []).map(d => ({ day: d._id, rate: d.rate, total: d.total }));
    const weatherData = (baseData?.weather_breakdown || []).map(w => ({ condition: w._id, rate: w.rate, total: w.total }));
    const eventData = (baseData?.event_breakdown || []).map(e => ({ event: e._id, rate: e.rate, total: e.total }));
    const monthData = (baseData?.monthly || []).map(m => ({
        month: `${MONTHS[(m._id.month || 1) - 1]} ${m._id.year}`, rate: m.rate
    }));

    const filterLabel = activeFilter.type
        ? `Filtered: ${activeFilter.value} (${activeFilter.type.replace(/_/g, ' ')})`
        : 'Overall — all days, all conditions';

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="card space-y-3">
                <h4 className="text-white font-semibold flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" />Student Attendance Lookup
                </h4>
                <p className="text-slate-400 text-xs">
                    Enter a student ID (STU0001 – STU0100). Once loaded, <strong className="text-slate-300">click any bar</strong> in the charts below to instantly see the attendance rate for that specific day / weather / event.
                </p>
                <div className="flex gap-2">
                    <input type="text" placeholder="e.g. STU0001, STU0051, STU0100"
                        value={inputVal} onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="input-field flex-1" />
                    <button onClick={handleSearch} disabled={loading || !inputVal.trim()}
                        className="btn-primary px-5 disabled:opacity-40 flex items-center gap-2">
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loading ? 'Loading…' : 'Lookup'}
                    </button>
                </div>
            </div>

            {err && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">❌ {err}</div>}
            {loading && <div className="card flex items-center justify-center h-44"><Loader className="w-6 h-6 animate-spin text-blue-400" /></div>}

            {baseData && !loading && (
                <div className="space-y-4">
                    {/* Main rate card */}
                    <div className="card text-center py-7" style={{ border: `1px solid ${rateColor}40`, boxShadow: `0 0 28px ${rateColor}15` }}>
                        <p className="text-slate-400 text-sm">Attendance Rate — <span className="text-white font-bold">{baseData.student_id}</span></p>
                        <p className="text-slate-500 text-xs mt-0.5 mb-1 flex items-center justify-center gap-2">
                            📌 {filterLoading ? '⏳ Calculating…' : filterLabel}
                            {activeFilter.type && !filterLoading && (
                                <button onClick={() => { setActiveFilter({ type: null, value: null }); setFilterData(null); }}
                                    className="text-blue-400 hover:text-white text-xs underline ml-1">[clear]</button>
                            )}
                        </p>
                        <p className="text-8xl font-black my-3" style={{ color: filterLoading ? '#64748b' : rateColor }}>
                            {filterLoading ? '…' : (rate != null ? `${rate}%` : 'No data')}
                        </p>
                        <div className="flex justify-center gap-6 text-sm text-slate-400 mb-3">
                            <span>✅ Present: <span className="text-green-400 font-semibold">{shown?.present ?? '—'}</span></span>
                            <span>❌ Absent: <span className="text-red-400 font-semibold">{shown?.absent ?? '—'}</span></span>
                            <span>📊 Total: <span className="text-slate-300 font-semibold">{shown?.total ?? '—'}</span></span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="text-xs bg-slate-700/60 text-slate-300 px-3 py-1 rounded-full">
                                Overall: <strong className="text-white">{baseData.attendance_rate}%</strong> ({baseData.total} days)
                            </span>
                            {/* Distance badge */}
                            {baseData.distance_km != null && (
                                <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1.5"
                                    style={{ background: `${DISTANCE_COLORS[baseData.distance_band]}20`, color: DISTANCE_COLORS[baseData.distance_band] || '#94a3b8', border: `1px solid ${DISTANCE_COLORS[baseData.distance_band] || '#475569'}40` }}>
                                    <MapPin className="w-3 h-3" />
                                    {baseData.distance_km} km — <strong>{baseData.distance_band}</strong>
                                </span>
                            )}
                            {dowData.length > 0 && <span className="text-xs bg-green-500/10 text-green-300 px-3 py-1 rounded-full">
                                Best day: <strong>{[...dowData].sort((a, b) => b.rate - a.rate)[0]?.day}</strong>
                            </span>}
                            {weatherData.length > 0 && <span className="text-xs bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full">
                                Best weather: <strong>{[...weatherData].sort((a, b) => b.rate - a.rate)[0]?.condition}</strong>
                            </span>}
                            {eventData.length > 0 && <span className="text-xs bg-orange-500/10 text-orange-300 px-3 py-1 rounded-full">
                                Best event: <strong>{[...eventData].sort((a, b) => b.rate - a.rate)[0]?.event}</strong>
                            </span>}
                        </div>
                    </div>

                    {/* Day-of-week */}
                    {dowData.length > 0 && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-0.5 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-green-400" />Attendance by Day of Week
                                <span className="text-slate-500 text-xs font-normal">— click a bar to filter</span>
                            </h5>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={dowData} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                    <YAxis domain={[40, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                                    <Tooltip content={<CT />} />
                                    <Bar dataKey="rate" name="Attendance Rate" radius={[6, 6, 0, 0]} maxBarSize={55}
                                        onClick={d => applyFilter('day_of_week', d.day)}>
                                        {dowData.map((d, i) => (
                                            <Cell key={i}
                                                fill={activeFilter.type === 'day_of_week' && activeFilter.value === d.day ? '#22c55e' : CHART_COLORS[i % CHART_COLORS.length]}
                                                opacity={activeFilter.type === 'day_of_week' && activeFilter.value !== d.day ? 0.35 : 1} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Weather */}
                    {weatherData.length > 0 && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-0.5 flex items-center gap-2">
                                <Cloud className="w-3.5 h-3.5 text-cyan-400" />Attendance by Weather Condition
                                <span className="text-slate-500 text-xs font-normal">— click a bar to filter</span>
                            </h5>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={weatherData} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="condition" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                    <YAxis domain={[40, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" tickLine={false} />
                                    <Tooltip content={<CT />} />
                                    <Bar dataKey="rate" name="Attendance Rate" radius={[6, 6, 0, 0]} maxBarSize={70}
                                        onClick={d => applyFilter('weather_condition', d.condition)}>
                                        {weatherData.map((d, i) => (
                                            <Cell key={i}
                                                fill={activeFilter.type === 'weather_condition' && activeFilter.value === d.condition ? '#06b6d4' : (WEATHER_COLORS[d.condition] || '#3b82f6')}
                                                opacity={activeFilter.type === 'weather_condition' && activeFilter.value !== d.condition ? 0.35 : 1} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Event */}
                    {eventData.length > 0 && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-0.5 flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-orange-400" />Attendance by School Event
                                <span className="text-slate-500 text-xs font-normal">— click a bar to filter</span>
                            </h5>
                            <ResponsiveContainer width="100%" height={Math.max(220, eventData.length * 26)}>
                                <BarChart data={eventData} layout="vertical" style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" domain={[40, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" tickLine={false} />
                                    <YAxis type="category" dataKey="event" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} width={115} />
                                    <Tooltip content={<CT />} />
                                    <Bar dataKey="rate" name="Attendance Rate" radius={[0, 5, 5, 0]} maxBarSize={22}
                                        onClick={d => applyFilter('school_event', d.event)}>
                                        {eventData.map((d, i) => (
                                            <Cell key={i}
                                                fill={activeFilter.type === 'school_event' && activeFilter.value === d.event ? '#f59e0b' : EVENT_COLORS[i % EVENT_COLORS.length]}
                                                opacity={activeFilter.type === 'school_event' && activeFilter.value !== d.event ? 0.35 : 1} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Monthly trend */}
                    {monthData.length > 0 && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-0.5 flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />Monthly Attendance Trend (2023–2025)
                            </h5>
                            <p className="text-slate-500 text-xs mb-3">Overall attendance rate for every month</p>
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={monthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 8 }} tickLine={false} interval="preserveStartEnd" />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" tickLine={false} />
                                    <Tooltip content={<CT />} />
                                    <Line type="monotone" dataKey="rate" name="Rate" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 2, fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Prediction Form ──────────────────────────────────────────────────────────
const WEATHER_OPTIONS = ['sunny', 'cloudy', 'rainy', 'windy'];
const EVENT_OPTIONS = ['normal', 'term_start', 'term_end', 'exam', 'sports_meet', 'after_sports', 'before_sports', 'prize_giving', 'after_prize', 'before_prize', 'teachers_day', 'childrens_day', 'sil_camp'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function PredictionForm() {
    const [mode, setMode] = useState('global'); // 'global' | 'student'
    const [form, setForm] = useState({
        weather: 'sunny', is_holiday: false, school_event: 'normal',
        temperature: 28, day_of_week: 0, month: 6, student_id: '', distance_km: 5,
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handlePredict = async () => {
        setLoading(true); setErr(''); setResult(null);
        try {
            const payload = { ...form, day_of_week: parseInt(form.day_of_week), month: parseInt(form.month), temperature: parseFloat(form.temperature) };
            const res = mode === 'global' ? await predictContextual(payload) : await predictStudentContextual(payload);
            setResult(res);
        } catch (e) { setErr(e.response?.data?.error || e.message); }
        finally { setLoading(false); }
    };

    const rate = result?.predicted_attendance_rate;
    const rateColor = rate >= 85 ? '#22c55e' : rate >= 75 ? '#eab308' : '#ef4444';

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                {['global', 'student'].map(m => (
                    <button key={m} onClick={() => { setMode(m); setResult(null); }}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}>
                        {m === 'global' ? '🏫 All Students' : '👤 Single Student'}
                    </button>
                ))}
            </div>

            <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mode === 'student' && (
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label className="text-xs text-slate-400 mb-1 block">Student ID</label>
                        <input type="text" placeholder="e.g. STU0001" value={form.student_id}
                            onChange={e => update('student_id', e.target.value)} className="input-field w-full" />
                    </div>
                )}

                <div>
                    <label className="text-xs text-slate-400 mb-1 block">☁️ Weather</label>
                    <select value={form.weather} onChange={e => update('weather', e.target.value)} className="input-field w-full">
                        {WEATHER_OPTIONS.map(w => <option key={w}>{w}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-400 mb-1 block">📅 School Event</label>
                    <select value={form.school_event} onChange={e => update('school_event', e.target.value)} className="input-field w-full">
                        {EVENT_OPTIONS.map(e => <option key={e}>{e}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-400 mb-1 block">🗓️ Day of Week</label>
                    <select value={form.day_of_week} onChange={e => update('day_of_week', e.target.value)} className="input-field w-full">
                        {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-400 mb-1 block">📆 Month</label>
                    <select value={form.month} onChange={e => update('month', e.target.value)} className="input-field w-full">
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-400 mb-1 block">🌡️ Temperature (°C)</label>
                    <input type="number" min={-5} max={50} value={form.temperature}
                        onChange={e => update('temperature', e.target.value)} className="input-field w-full" />
                </div>

                {/* Distance Slider */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        Distance to School: <span className="text-white font-semibold ml-1">{form.distance_km} km</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: `${DISTANCE_COLORS[form.distance_km < 6.75 ? 'Nearby' : form.distance_km < 13 ? 'Moderate' : form.distance_km < 19.25 ? 'Far' : 'Very Far']}25`, color: DISTANCE_COLORS[form.distance_km < 6.75 ? 'Nearby' : form.distance_km < 13 ? 'Moderate' : form.distance_km < 19.25 ? 'Far' : 'Very Far'] }}>
                            {form.distance_km < 6.75 ? 'Nearby' : form.distance_km < 13 ? 'Moderate' : form.distance_km < 19.25 ? 'Far' : 'Very Far'}
                        </span>
                    </label>
                    <input type="range" min={0.5} max={25} step={0.5} value={form.distance_km}
                        onChange={e => update('distance_km', parseFloat(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#10b981' }} />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>0.5 km</span><span>6.75</span><span>13</span><span>19.25</span><span>25 km</span>
                    </div>
                </div>

                <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer group w-full">
                        <input type="checkbox" checked={form.is_holiday} onChange={e => update('is_holiday', e.target.checked)}
                            className="w-4 h-4 rounded accent-blue-500" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Academic Holiday</span>
                    </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                    <button onClick={handlePredict} disabled={loading}
                        className="btn-primary px-8 disabled:opacity-50 text-base py-2.5">
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        {loading ? 'Predicting…' : 'Predict Attendance'}
                    </button>
                </div>
            </div>

            {err && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">{err}</div>}

            {result && !loading && (
                <div className="space-y-5">
                    <div className="card text-center py-8 glow-blue" style={{ border: `1px solid ${rateColor}40` }}>
                        <p className="text-slate-400 text-sm mb-2">{mode === 'global' ? 'Predicted School-Wide Attendance' : `Predicted Attendance for ${result.student_id || form.student_id}`}</p>
                        <p className="text-7xl font-black mb-2" style={{ color: rateColor }}>{rate?.toFixed(1)}%</p>
                        {result.historical_rate && (
                            <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                                Historical average: <span className="text-slate-300 font-medium">{result.historical_rate}%</span>
                                {rate > result.historical_rate
                                    ? <TrendingUp className="w-4 h-4 text-green-400" />
                                    : <TrendingDown className="w-4 h-4 text-red-400" />}
                            </p>
                        )}
                        {result.fallback && <p className="text-amber-400 text-xs mt-2">⚠ Statistical fallback used (limited student data)</p>}
                    </div>

                    {mode === 'global' && result.weather_comparison && result.event_comparison && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div className="card">
                                <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />Predicted Rate by Weather
                                </h5>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={result.weather_comparison}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="condition" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                        <YAxis domain={[60, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                        <Tooltip content={<CT />} />
                                        <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[4, 4, 0, 0]}>
                                            {result.weather_comparison.map((d, i) => <Cell key={i} fill={WEATHER_COLORS[d.condition] || '#3b82f6'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="card">
                                <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />Predicted Rate by Event
                                </h5>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={result.event_comparison} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                        <XAxis type="number" domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" tickLine={false} />
                                        <YAxis type="category" dataKey="event" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} width={130} />
                                        <Tooltip content={<CT />} />
                                        <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[0, 4, 4, 0]}>
                                            {result.event_comparison.map((d, i) => <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Distance Comparison — global mode */}
                    {mode === 'global' && result.distance_comparison && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />Predicted Rate by Distance Band
                            </h5>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={result.distance_comparison}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="band" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                    <YAxis domain={[60, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                    <Tooltip content={<CT />} />
                                    <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[6, 6, 0, 0]} maxBarSize={70}>
                                        {result.distance_comparison.map((d, i) => <Cell key={i} fill={DISTANCE_COLORS[d.band] || '#3b82f6'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {mode === 'student' && result.weather_scan && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div className="card">
                                <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />Weather Impact for this Student
                                </h5>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={result.weather_scan}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="condition" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                        <YAxis domain={[50, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                        <Tooltip content={<CT />} />
                                        <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[4, 4, 0, 0]}>
                                            {result.weather_scan.map((d, i) => <Cell key={i} fill={WEATHER_COLORS[d.condition] || '#3b82f6'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="card">
                                <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />Event Impact for this Student
                                </h5>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={result.event_scan} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                        <XAxis type="number" domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" tickLine={false} />
                                        <YAxis type="category" dataKey="event" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} width={130} />
                                        <Tooltip content={<CT />} />
                                        <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[0, 4, 4, 0]}>
                                            {result.event_scan.map((d, i) => <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Distance Comparison — student mode */}
                    {mode === 'student' && result.distance_scan && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />Distance Impact for this Student
                                {result.distance_band && (
                                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: `${DISTANCE_COLORS[result.distance_band]}20`, color: DISTANCE_COLORS[result.distance_band] }}>
                                        {result.distance_km} km — {result.distance_band}
                                    </span>
                                )}
                            </h5>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={result.distance_scan}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="band" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                                    <YAxis domain={[50, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                                    <Tooltip content={<CT />} />
                                    <Bar dataKey="predicted_rate" name="Predicted Rate" radius={[6, 6, 0, 0]} maxBarSize={70}>
                                        {result.distance_scan.map((d, i) => <Cell key={i} fill={DISTANCE_COLORS[d.band] || '#3b82f6'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {result.holiday_comparison && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-purple-400" />Holiday Effect
                            </h5>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <RateGauge value={result.holiday_comparison.without_holiday} label="Normal School Day" sub="Predicted" />
                                <RateGauge value={result.holiday_comparison.with_holiday} label="Academic Holiday" sub="Predicted" />
                                <div className="stat-card text-center">
                                    <p className="text-slate-400 text-xs mb-2">Impact of Holiday</p>
                                    <p className={`text-4xl font-black ${result.holiday_comparison.holiday_impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {result.holiday_comparison.holiday_impact > 0 ? '+' : ''}{result.holiday_comparison.holiday_impact?.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result.feature_importance && (
                        <div className="card">
                            <h5 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />Top Factors Driving Attendance
                            </h5>
                            <div className="space-y-2">
                                {result.feature_importance.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-slate-400 text-xs w-36 truncate flex-shrink-0">{f.feature.replace('weather_', '').replace('event_', '')}</span>
                                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                                style={{ width: `${(f.importance / result.feature_importance[0].importance) * 100}%` }} />
                                        </div>
                                        <span className="text-slate-300 text-xs w-14 text-right font-mono">{(f.importance * 100).toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Guest Trend Analyzer ─────────────────────────────────────────────────────
const WEATHER_OPTS = ['sunny', 'cloudy', 'rainy', 'windy', 'stormy', 'foggy'];
const EVENT_OPTS = ['normal', 'exam', 'term_start', 'term_end', 'sports_meet', 'before_sports', 'after_sports', 'prize_giving', 'teachers_day', 'childrens_day', 'sil_camp'];
const SEV_STYLES = {
    green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', badge: 'bg-yellow-500/20 text-yellow-300' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', badge: 'bg-red-500/20 text-red-300' },
};

function GuestTrendAnalyzer({ onClose }) {
    const DAYS = 30;
    const [attendance, setAttendance] = useState(() => {
        // Default: realistic ~80% attendance pattern (24 present, 6 absent spread out)
        const a = Array(DAYS).fill(1);
        [4, 9, 14, 19, 24, 29].forEach(i => { a[i] = 0; });
        return a;
    });
    const [weather, setWeather] = useState('sunny');
    const [temperature, setTemp] = useState(28);
    const [distKm, setDistKm] = useState(5);
    const [horizon, setHorizon] = useState(14);
    const [upcomingEvts, setUpEvts] = useState([]);
    const [step, setStep] = useState(1); // 1=form, 2=results
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [result, setResult] = useState(null);

    const distBand = distKm < 6.75 ? 'Nearby' : distKm < 13 ? 'Moderate' : distKm < 19.25 ? 'Far' : 'Very Far';
    const distColor = { Nearby: '#22c55e', Moderate: '#eab308', Far: '#f97316', 'Very Far': '#ef4444' }[distBand];
    const presentCount = attendance.filter(Boolean).length;
    const absentCount = DAYS - presentCount;
    const histRate = ((presentCount / DAYS) * 100).toFixed(1);

    const toggleDay = (i) => setAttendance(prev => { const a = [...prev]; a[i] = a[i] ? 0 : 1; return a; });
    const fillAll = (v) => setAttendance(Array(DAYS).fill(v));

    const addEvent = () => {
        const today = new Date();
        today.setDate(today.getDate() + upcomingEvts.length + 1);
        const ds = today.toISOString().split('T')[0];
        setUpEvts(prev => [...prev, { date: ds, event: 'normal', is_holiday: false }]);
    };
    const updateEvt = (i, k, v) => setUpEvts(prev => prev.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
    const removeEvt = (i) => setUpEvts(prev => prev.filter((_, idx) => idx !== i));

    const handleAnalyze = async () => {
        setLoading(true); setErr('');
        try {
            const res = await predictGuestTrend({
                attendance_series: attendance,
                forecast_days: horizon,
                weather, temperature: parseFloat(temperature),
                distance_km: parseFloat(distKm),
                upcoming_events: upcomingEvts,
            });
            setResult(res);
            setStep(2);
        } catch (e) { setErr(e.response?.data?.error || e.message); }
        finally { setLoading(false); }
    };

    // Build chart data: historical weekly + forecast
    const chartData = result ? [
        ...(result.historical_weekly || []).map(w => ({ label: w.label, historical: w.rate, type: 'hist' })),
        ...(result.forecast || []).map(f => ({ label: f.day + ' ' + f.date.slice(5), adjusted: f.adjusted_rate, arima: f.arima_rate, lo: f.ci_lower, hi: f.ci_upper, type: 'fc' }))
    ] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Guest Trend Analyzer
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">Context-aware ARIMA forecast for new students — no database required</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {step === 2 && <button onClick={() => setStep(1)} className="text-xs text-blue-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition">← Edit Inputs</button>}
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            {/* Step indicator */}
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                {['Attendance History', 'Your Context', 'Upcoming Schedule'].map((s, i) => (
                                    <><span key={s} className={`px-3 py-1 rounded-full font-medium ${i === 0 ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/50 text-slate-500'}`}>{i + 1}. {s}</span>
                                        {i < 2 && <ChevronRight className="w-3 h-3" />}</>
                                ))}
                            </div>

                            {/* Section 1: Attendance Grid */}
                            <div className="card space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Last 30 Days Attendance</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => fillAll(1)} className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">All Present</button>
                                        <button onClick={() => fillAll(0)} className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">All Absent</button>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xs">Click each day to toggle between <span className="text-emerald-400 font-medium">Present ✅</span> and <span className="text-red-400 font-medium">Absent ❌</span></p>
                                <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10,1fr)' }}>
                                    {attendance.map((v, i) => (
                                        <button key={i} onClick={() => toggleDay(i)}
                                            title={`Day ${i + 1}: ${v ? 'Present' : 'Absent'}`}
                                            className={`aspect-square rounded-lg text-xs font-bold transition-all border ${v ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                                                }`}>{i + 1}</button>
                                    ))}
                                </div>
                                <div className="flex gap-4 text-sm pt-1">
                                    <span className="text-slate-400">Present: <strong className="text-emerald-400">{presentCount}</strong></span>
                                    <span className="text-slate-400">Absent: <strong className="text-red-400">{absentCount}</strong></span>
                                    <span className="text-slate-400">Rate: <strong className="text-white">{histRate}%</strong></span>
                                </div>
                            </div>

                            {/* Section 2: Contextual Settings */}
                            <div className="card space-y-4">
                                <h3 className="text-white font-semibold flex items-center gap-2"><Cloud className="w-4 h-4 text-cyan-400" />Your Context</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">☁️ Typical Weather</label>
                                        <select value={weather} onChange={e => setWeather(e.target.value)} className="input-field w-full">
                                            {WEATHER_OPTS.map(w => <option key={w}>{w}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">🌡️ Temperature (°C)</label>
                                        <input type="number" min={0} max={50} value={temperature}
                                            onChange={e => setTemp(e.target.value)} className="input-field w-full" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-emerald-400" />
                                            Distance to School: <span className="text-white font-semibold ml-1">{distKm} km</span>
                                            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `${distColor}20`, color: distColor }}>{distBand}</span>
                                        </label>
                                        <input type="range" min={0.5} max={25} step={0.5} value={distKm}
                                            onChange={e => setDistKm(parseFloat(e.target.value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#10b981' }} />
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5"><span>0.5km</span><span>6.75</span><span>13</span><span>19.25</span><span>25km</span></div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-2 block">📅 Forecast Horizon</label>
                                    <div className="flex gap-2">
                                        {[7, 10, 14].map(h => (
                                            <button key={h} onClick={() => setHorizon(h)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${horizon === h ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                                    }`}>{h} days</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Upcoming Schedule */}
                            <div className="card space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" />Upcoming Schedule <span className="text-slate-500 text-xs font-normal">(optional)</span></h3>
                                    <button onClick={addEvent} className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition">+ Add Day</button>
                                </div>
                                {upcomingEvts.length === 0
                                    ? <p className="text-slate-500 text-xs italic">No upcoming days added. Add specific dates with events or holidays to improve prediction accuracy.</p>
                                    : <div className="space-y-2">{upcomingEvts.map((ev, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2">
                                            <input type="date" value={ev.date} onChange={e => updateEvt(i, 'date', e.target.value)} className="input-field text-xs py-1 w-36" />
                                            <select value={ev.event} onChange={e => updateEvt(i, 'event', e.target.value)} className="input-field text-xs py-1 flex-1">
                                                {EVENT_OPTS.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer whitespace-nowrap">
                                                <input type="checkbox" checked={ev.is_holiday} onChange={e => updateEvt(i, 'is_holiday', e.target.checked)} className="accent-blue-500" />
                                                Holiday
                                            </label>
                                            <button onClick={() => removeEvt(i)} className="p-1 text-slate-500 hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}</div>
                                }
                            </div>

                            {err && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">{err}</div>}

                            <button onClick={handleAnalyze} disabled={loading}
                                className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Running ARIMA + Context Analysis…' : 'Analyze My Attendance Trend'}
                            </button>
                        </>
                    ) : result && (
                        <div className="space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Historical Rate', value: `${result.historical_rate}%`, color: result.historical_rate >= 85 ? '#22c55e' : result.historical_rate >= 75 ? '#eab308' : '#ef4444', icon: <Activity className="w-4 h-4" /> },
                                    { label: 'Distance Band', value: result.distance_band, color: distColor, icon: <MapPin className="w-4 h-4" /> },
                                    { label: 'Forecast Days', value: `${horizon} days`, color: '#8b5cf6', icon: <Calendar className="w-4 h-4" /> },
                                    { label: 'Total Context Δ', value: `${result.factor_summary?.total_contextual_delta > 0 ? '+' : ''}${result.factor_summary?.total_contextual_delta}%`, color: (result.factor_summary?.total_contextual_delta || 0) >= 0 ? '#22c55e' : '#ef4444', icon: <Zap className="w-4 h-4" /> },
                                ].map((c, i) => (
                                    <div key={i} className="card text-center py-4" style={{ borderColor: `${c.color}30` }}>
                                        <div className="flex justify-center mb-1" style={{ color: c.color }}>{c.icon}</div>
                                        <p className="text-xs text-slate-400 mb-1">{c.label}</p>
                                        <p className="text-lg font-black" style={{ color: c.color }}>{c.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Combined chart */}
                            <div className="card">
                                <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-blue-400" />Attendance Timeline
                                </h4>
                                <p className="text-slate-500 text-xs mb-4">
                                    <span className="inline-block w-3 h-0.5 bg-blue-400 mr-1 align-middle"></span>Historical weekly rate &nbsp;
                                    <span className="inline-block w-3 h-0.5 bg-purple-400 mr-1 align-middle" style={{ borderTop: '2px dashed #a78bfa' }}></span>ARIMA forecast &nbsp;
                                    <span className="inline-block w-3 h-2 align-middle rounded" style={{ background: 'rgba(139,92,246,0.15)' }}></span> Confidence band
                                </p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <ComposedChart data={chartData} margin={{ left: 0, right: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                                        <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" tickLine={false} />
                                        <Tooltip content={<CT />} />
                                        <Area dataKey="hi" stroke="none" fill="#8b5cf620" name="CI Upper" legendType="none" />
                                        <Area dataKey="lo" stroke="none" fill="#8b5cf600" name="CI Lower" legendType="none" />
                                        <Line type="monotone" dataKey="historical" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} name="Historical" connectNulls />
                                        <Line type="monotone" dataKey="adjusted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 2, fill: '#a78bfa' }} name="Forecast (adjusted)" connectNulls />
                                        <ReferenceLine x={result.historical_weekly?.length > 0 ? result.historical_weekly[result.historical_weekly.length - 1]?.label : undefined}
                                            stroke="#475569" strokeDasharray="4 2" label={{ value: 'Today', fill: '#64748b', fontSize: 9 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Context-Aware Explanation Cards — THE RESEARCH NOVELTY */}
                            <div className="space-y-3">
                                <h4 className="text-white font-semibold flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-400" />
                                    Context-Aware Insights
                                    <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-medium">Research Novelty</span>
                                </h4>
                                <p className="text-slate-500 text-xs">AI explanations tied to Sri Lankan school life — holiday impact, weather risk, and distance factors analysed per forecast week</p>
                                {(result.context_explanations || []).map((ex, i) => {
                                    const sty = SEV_STYLES[ex.severity_color] || SEV_STYLES.yellow;
                                    return (
                                        <div key={i} className={`rounded-xl border p-4 space-y-3 ${sty.bg} ${sty.border}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sty.badge}`}>
                                                            {ex.severity_emoji} Week {ex.week} — {ex.severity}
                                                        </span>
                                                        <span className="text-slate-500 text-xs">{ex.period}</span>
                                                    </div>
                                                    <p className={`font-semibold text-sm ${sty.text}`}>{ex.headline}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`text-2xl font-black ${sty.text}`}>{ex.avg_rate}%</p>
                                                    <p className="text-slate-500 text-[10px]">Expected: {ex.expected_range}</p>
                                                </div>
                                            </div>

                                            {/* Detail bullets */}
                                            {ex.details?.length > 0 && (
                                                <ul className="space-y-1">
                                                    {ex.details.map((d, di) => (
                                                        <li key={di} className="text-xs text-slate-300 flex items-start gap-2">
                                                            <span className="text-slate-500 mt-0.5 shrink-0">›</span>{d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Factor contribution bars */}
                                            {ex.factors?.length > 0 && (
                                                <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Factor Contributions</p>
                                                    {ex.factors.map((f, fi) => {
                                                        const maxAbs = Math.max(...ex.factors.map(x => Math.abs(x.delta)), 1);
                                                        const pct = Math.abs(f.delta) / maxAbs * 100;
                                                        const fColor = f.delta > 0 ? '#22c55e' : '#ef4444';
                                                        return (
                                                            <div key={fi} className="flex items-center gap-2">
                                                                <span className="text-xs w-4">{f.icon}</span>
                                                                <span className="text-xs text-slate-400 w-40 truncate shrink-0">{f.name}</span>
                                                                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                                                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: fColor }} />
                                                                </div>
                                                                <span className="text-xs font-mono w-10 text-right" style={{ color: fColor }}>{f.delta > 0 ? '+' : ''}{f.delta}%</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Factor summary */}
                            {result.factor_summary && (
                                <div className="card">
                                    <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Overall Context Factors</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[result.factor_summary.weather, result.factor_summary.temperature, result.factor_summary.distance].map((f, i) => (
                                            <div key={i} className="bg-slate-800/60 rounded-xl p-3 text-center">
                                                <p className="text-xs text-slate-500 mb-1">{['Weather', 'Temperature', 'Distance'][i]}</p>
                                                <p className="text-white text-sm font-bold">{f?.name || f?.label || f?.band}</p>
                                                <p className={`text-lg font-black mt-1 ${(f?.delta || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {(f?.delta || 0) > 0 ? '+' : ''}{f?.delta || 0}%
                                                </p>
                                                <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">{f?.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!result.converged && (
                                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-center gap-2">
                                    <Info className="w-4 h-4 shrink-0" />
                                    ARIMA convergence fallback used — linear trend extrapolation applied. Results may be less precise with limited data.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'global', label: 'All Students Impact', icon: Activity },
    { id: 'student', label: 'Student Impact Lookup', icon: Search },
    { id: 'predict', label: 'Contextual Prediction', icon: Brain },
];

export default function ContextualAnalysis() {
    const [tab, setTab] = useState('global');
    const [impact, setImpact] = useState(null);
    const [impactLoading, setImpactLoading] = useState(false);
    const [impactErr, setImpactErr] = useState('');
    const [showGuestAnalyzer, setShowGuestAnalyzer] = useState(false);

    useEffect(() => {
        if (tab === 'global' && !impact && !impactLoading) {
            setImpactLoading(true);
            fetchContextualImpact()
                .then(setImpact)
                .catch(e => setImpactErr(e.response?.data?.error || e.message))
                .finally(() => setImpactLoading(false));
        }
    }, [tab]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text">Contextual Impact Analysis</h1>
                <p className="text-slate-400 text-sm mt-1">
                    How weather, academic holidays, and school events affect student attendance — with ML predictions
                </p>
            </div>

            <div className="card py-4 flex items-center gap-4">
                <div className="flex gap-3">
                    {[{ icon: Cloud, c: 'text-cyan-400', l: 'Weather' }, { icon: Calendar, c: 'text-purple-400', l: 'Holidays' },
                    { icon: BookOpen, c: 'text-orange-400', l: 'Events' }, { icon: MapPin, c: 'text-emerald-400', l: 'Distance' },
                    { icon: Brain, c: 'text-green-400', l: 'ML Predict' }
                    ].map(({ icon: I, c, l }) => (
                        <div key={l} className="flex items-center gap-2 text-xs text-slate-400">
                            <I className={`w-4 h-4 ${c}`} />{l}
                        </div>
                    ))}
                </div>
                <div className="ml-auto text-xs text-slate-500">
                    Model: <span className="text-blue-400">Gradient Boosting Classifier</span>
                </div>
            </div>

            <div className="flex gap-2 border-b border-slate-700/50">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${tab === t.id
                            ? 'text-white border-blue-500 bg-slate-800/60'
                            : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            {tab === 'global' && (
                impactErr
                    ? <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center text-red-300 text-sm">
                        <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-red-400" />
                        {impactErr}
                        <p className="text-slate-500 text-xs mt-2">Start the ML service: <code className="text-blue-400">python ml_service/app.py</code></p>
                    </div>
                    : <GlobalImpact data={impact} loading={impactLoading} />
            )}
            {tab === 'student' && <StudentImpact />}
            {tab === 'predict' && (
                <div className="space-y-4">
                    {/* Guest Trend Analyzer CTA */}
                    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-slate-800/40 to-blue-500/10 p-5 flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-white font-semibold text-sm">Guest Trend Analyzer</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">NEW</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                New student? Enter your last 30 days of attendance and get an ARIMA-powered forecast with <strong className="text-purple-300">context-aware explanations</strong> tied to Sri Lankan school life — holidays, weather, distance & events.
                            </p>
                        </div>
                        <button onClick={() => setShowGuestAnalyzer(true)}
                            className="shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Try It Free
                        </button>
                    </div>
                    <PredictionForm />
                </div>
            )}
            {showGuestAnalyzer && <GuestTrendAnalyzer onClose={() => setShowGuestAnalyzer(false)} />}
        </div>
    );
}
