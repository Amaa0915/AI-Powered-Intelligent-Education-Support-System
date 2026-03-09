import { useState, useEffect } from 'react';
import {
    fetchGlobalLSTM, fetchGlobalARIMA, fetchStudentForecast,
    refreshForecasts, fetchForecastHealth
} from '../../api/attendanceApi';
import {
    ComposedChart, Area, Line, AreaChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    Brain, TrendingUp, RefreshCw, Search, Wifi, WifiOff,
    AlertTriangle, CheckCircle, Loader, ChevronDown
} from 'lucide-react';

// ─── Shared Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs max-w-xs">
            <p className="font-semibold text-slate-300 mb-2">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.stroke }} className="flex justify-between gap-4 mt-0.5">
                    <span className="text-slate-400">{p.name}:</span>
                    <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}%</span>
                </p>
            ))}
        </div>
    );
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const ChartSkeleton = () => (
    <div className="h-64 rounded-xl bg-slate-700/40 shimmer flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader className="w-6 h-6 animate-spin" />
            <span className="text-xs">Loading forecast from ML service…</span>
        </div>
    </div>
);

// ─── ML Status Badge ─────────────────────────────────────────────────────────
function MLStatusBadge({ status }) {
    if (!status) return null;
    const online = status.ml_service === 'online';
    return (
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${online ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            ML Service: {online ? 'Online' : 'Offline'}
            {online && status.model_exists && <CheckCircle className="w-3 h-3 ml-1" />}
        </div>
    );
}

// ─── LSTM Tab ────────────────────────────────────────────────────────────────
function LSTMChart({ data, loading, error }) {
    if (error && !loading) return (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-medium mb-1">ML Service Error</p>
            <p className="text-red-400/80 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-3">Make sure the Python ML service is running: <code className="text-[#272343]">python ml_service/app.py</code></p>
        </div>
    );

    // Merge historical + forecast into a single series for smooth chart
    const chartData = [];
    if (data?.historical) {
        data.historical.forEach(h => chartData.push({ label: h.label, actual: h.rate, predicted: null }));
    }
    if (data?.forecast) {
        data.forecast.forEach(f => chartData.push({ label: f.date || f.label, actual: null, predicted: f.predicted_rate }));
    }

    return loading ? <ChartSkeleton /> : (
        <div>
            {data?.fromCache && (
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" /> Served from cache
                    {data.meta?.input_shape && <span className="ml-2 text-slate-600">· LSTM input shape: {data.meta.input_shape}</span>}
                </p>
            )}
            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                    <defs>
                        <linearGradient id="lstmGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#272343" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#272343" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <ReferenceLine x={data?.historical?.[data.historical.length - 1]?.label}
                        stroke="#475569" strokeDasharray="4 2" label={{ value: 'Forecast Start', fill: '#64748b', fontSize: 10 }} />
                    <Area type="monotone" dataKey="actual" name="Historical Rate" stroke="#272343" fill="url(#actualGrad)" strokeWidth={2} dot={false} connectNulls={false} />
                    <Area type="monotone" dataKey="predicted" name="LSTM Predicted" stroke="#8b5cf6" fill="url(#lstmGrad)" strokeWidth={2.5} dot={false} strokeDasharray="5 3" connectNulls={false} />
                </ComposedChart>
            </ResponsiveContainer>
            {data?.forecast && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {data.forecast.slice(0, 5).map((f, i) => (
                        <div key={i} className="card py-2 px-3 text-center">
                            <p className="text-xs text-slate-500">{(f.date || f.label || '').slice(5)}</p>
                            <p className={`text-lg font-bold ${f.predicted_rate >= 85 ? 'text-green-400' : f.predicted_rate >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {f.predicted_rate?.toFixed(1)}%
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── ARIMA Tab ───────────────────────────────────────────────────────────────
function ARIMAChart({ data, loading, error }) {
    if (error && !loading) return (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-medium">{error}</p>
        </div>
    );

    const chartData = [];
    if (data?.historical) {
        data.historical.forEach(h => chartData.push({
            label: h.label, actual: h.rate, mean: null, ci_lower: null, ci_upper: null,
        }));
    }
    if (data?.forecast) {
        data.forecast.forEach(f => chartData.push({
            label: f.label, actual: null, mean: f.mean, ci_lower: f.ci_lower, ci_upper: f.ci_upper,
        }));
    }

    return loading ? <ChartSkeleton /> : (
        <div>
            {data && (
                <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                    {data.fromCache && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" />Cached</span>}
                    {data.order && <span>Order: ARIMA({data.order?.join(',')})</span>}
                    {data.converged === false && <span className="text-yellow-400">⚠ Linear fallback used</span>}
                </div>
            )}
            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                    <defs>
                        <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} interval={2} />
                    <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <ReferenceLine x={data?.historical?.[data.historical.length - 1]?.label}
                        stroke="#475569" strokeDasharray="4 2" />
                    {/* CI band */}
                    <Area type="monotone" dataKey="ci_upper" fill="url(#ciGrad)" stroke="transparent" name="CI Upper (80%)" legendType="none" connectNulls={false} />
                    <Area type="monotone" dataKey="ci_lower" fill="#0f172a" stroke="transparent" name="CI Lower (80%)" legendType="none" connectNulls={false} />
                    <Line type="monotone" dataKey="actual" name="Historical Rate" stroke="#272343" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="mean" name="ARIMA Forecast" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} strokeDasharray="6 3" connectNulls={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Student Forecast ────────────────────────────────────────────────────────
function StudentForecast() {
    const [studentId, setStudentId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!studentId.trim()) return;
        setLoading(true); setError(''); setData(null);
        try {
            const res = await fetchStudentForecast(studentId.trim(), 6);
            setData(res);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        ...(data?.historical || []).map(h => ({ label: h.label, actual: h.rate, mean: null })),
        ...(data?.forecast || []).map(f => ({ label: f.label, actual: null, mean: f.mean, ci_lower: f.ci_lower, ci_upper: f.ci_upper })),
    ];

    return (
        <div className="card space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-[#272343]" />Per-Student ARIMA Forecast
            </h3>
            <p className="text-slate-500 text-xs">Enter a student ID to forecast their next 6 months of attendance</p>
            <div className="flex gap-2">
                <input
                    type="text" placeholder="e.g. STU_001"
                    value={studentId} onChange={e => setStudentId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="input-field flex-1"
                />
                <button onClick={handleSearch} disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Forecast
                </button>
            </div>

            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}

            {data && data.forecast && (
                <>
                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="ci_upper" fill="#8b5cf620" stroke="transparent" legendType="none" connectNulls={false} />
                            <Area type="monotone" dataKey="ci_lower" fill="#0f172a" stroke="transparent" legendType="none" connectNulls={false} />
                            <Line type="monotone" dataKey="actual" name="Historical" stroke="#272343" strokeWidth={2} dot={false} connectNulls={false} />
                            <Line type="monotone" dataKey="mean" name="Forecast" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: '#a78bfa' }} connectNulls={false} />
                        </ComposedChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                        {data.forecast.map((f, i) => (
                            <div key={i} className="card py-2 px-3 text-center">
                                <p className="text-xs text-slate-500">{f.label}</p>
                                <p className={`text-base font-bold ${f.mean >= 85 ? 'text-green-400' : f.mean >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {f.mean?.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-600">{f.ci_lower?.toFixed(0)}–{f.ci_upper?.toFixed(0)}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS = [
    { id: 'lstm', label: 'LSTM Forecast', icon: Brain, color: 'purple' },
    { id: 'arima', label: 'ARIMA Forecast', icon: TrendingUp, color: 'cyan' },
];

export default function Forecasting() {
    const [activeTab, setActiveTab] = useState('lstm');
    const [mlStatus, setMlStatus] = useState(null);
    const [lstmData, setLstmData] = useState(null);
    const [lstmLoading, setLstmLoading] = useState(false);
    const [lstmError, setLstmError] = useState('');
    const [arimaData, setArimaData] = useState(null);
    const [arimaLoading, setArimaLoading] = useState(false);
    const [arimaError, setArimaError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Check ML service health on mount
    useEffect(() => {
        fetchForecastHealth().then(setMlStatus).catch(() => setMlStatus({ ml_service: 'offline' }));
    }, []);

    // Load LSTM when tab selected
    useEffect(() => {
        if (activeTab === 'lstm' && !lstmData && !lstmLoading) {
            setLstmLoading(true);
            fetchGlobalLSTM(30)
                .then(d => setLstmData(d))
                .catch(e => setLstmError(e.response?.data?.error || e.message))
                .finally(() => setLstmLoading(false));
        }
    }, [activeTab]);

    // Load ARIMA when tab selected
    useEffect(() => {
        if (activeTab === 'arima' && !arimaData && !arimaLoading) {
            setArimaLoading(true);
            fetchGlobalARIMA(12)
                .then(d => setArimaData(d))
                .catch(e => setArimaError(e.response?.data?.error || e.message))
                .finally(() => setArimaLoading(false));
        }
    }, [activeTab]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setLstmData(null); setArimaData(null);
        setLstmError(''); setArimaError('');
        try {
            await refreshForecasts();
        } finally {
            setRefreshing(false);
            // Reload current tab
            if (activeTab === 'lstm') {
                setLstmLoading(true);
                fetchGlobalLSTM(30).then(setLstmData).catch(e => setLstmError(e.message)).finally(() => setLstmLoading(false));
            } else {
                setArimaLoading(true);
                fetchGlobalARIMA(12).then(setArimaData).catch(e => setArimaError(e.message)).finally(() => setArimaLoading(false));
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">AI Attendance Forecasting</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        LSTM neural network & ARIMA statistical model predictions
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <MLStatusBadge status={mlStatus} />
                    <button onClick={handleRefresh} disabled={refreshing} className="btn-primary disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Forecasts
                    </button>
                </div>
            </div>

            {/* ML offline notice */}
            {mlStatus?.ml_service === 'offline' && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-300 font-medium text-sm">ML Microservice is not running</p>
                        <p className="text-amber-400/70 text-xs mt-1">Start it in a separate terminal:</p>
                        <code className="block mt-1 text-xs bg-slate-800 rounded-lg px-3 py-2 text-green-400">
                            cd ml_service &amp;&amp; pip install -r requirements.txt &amp;&amp; python app.py
                        </code>
                    </div>
                </div>
            )}

            {/* Model Info Banner */}
            <div className="card flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                    <p className="text-white font-medium text-sm">Pre-trained LSTM Model Loaded</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                        <code className="text-[#272343]">attendance_lstm_enhanced_model.h5</code> (17MB) — trained on your research dataset
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <p className="text-white font-medium text-sm">ARIMA(2,1,2)</p>
                    <p className="text-slate-400 text-xs mt-0.5">Fitted live on historical monthly data</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-0">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${activeTab === tab.id
                            ? 'text-white border-[#272343] bg-slate-800/60'
                            : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'lstm' && (
                    <>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                LSTM 30-Day Attendance Forecast
                            </h3>
                        </div>
                        <p className="text-slate-500 text-xs mb-5">
                            Uses the pre-trained LSTM model to predict daily attendance probability for the next 30 days.
                            Iterative multi-step prediction with {lstmData?.look_back || '…'}-day look-back window.
                        </p>
                        <LSTMChart data={lstmData} loading={lstmLoading} error={lstmError} />
                    </>
                )}
                {activeTab === 'arima' && (
                    <>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                ARIMA 12-Month Attendance Forecast
                            </h3>
                        </div>
                        <p className="text-slate-500 text-xs mb-5">
                            ARIMA statistical model fitted on historical monthly attendance rates.
                            Shaded region shows 80% confidence interval.
                        </p>
                        <ARIMAChart data={arimaData} loading={arimaLoading} error={arimaError} />
                    </>
                )}
            </div>

            {/* Per-student forecast */}
            <StudentForecast />
        </div>
    );
}
