import { useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";
import { API_URLS } from "../../api/config";
import HistoryModal, { fmtDate } from "../../components/HistoryModal";
import { getUser } from "../../services/authService";
import { Activity, Brain, BarChart2, Zap, TrendingUp, BookOpen } from "lucide-react";


// Uses model's actual prediction string: "Good" | "Bad" | "Awful"
function stressColor(pred) {
  if (!pred) return { bg: "bg-slate-100", text: "text-slate-500", hex: "#94a3b8", ring: "ring-slate-200" };
  if (pred === "Good")  return { bg: "bg-emerald-100", text: "text-emerald-600", hex: "#10b981", ring: "ring-emerald-200" };
  if (pred === "Bad")   return { bg: "bg-orange-100",  text: "text-orange-600",  hex: "#f97316", ring: "ring-orange-200"  };
  return                       { bg: "bg-red-100",     text: "text-red-600",     hex: "#ef4444", ring: "ring-red-200"     };
}
function friendlyLabel(pred) {
  if (pred === "Good")  return "Low Stress";
  if (pred === "Bad")   return "High Stress";
  if (pred === "Awful") return "Critical";
  return "—";
}

/* ── sub-components ─────────────────────────────────── */
function SectionHeading({ icon, label, color }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/60">
      <span className="text-base leading-none">{icon}</span>
      <span className={`text-[10px] font-bold tracking-widest uppercase ${color || "text-slate-400"}`}>{label}</span>
    </div>
  );
}

function SliderField({ label, name, value, onChange, min, max, step, unit }) {
  const v = value !== "" ? parseFloat(value) : min;
  const pct = ((v - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-slate-500">{label}</label>
        <span className="text-sm font-bold text-teal-600">{v}{unit}</span>
      </div>
      <input
        type="range" name={name} value={v} onChange={onChange}
        min={min} max={max} step={step}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
          outline: "none", WebkitAppearance: "none", appearance: "none",
        }}
      />
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-slate-300">{min}{unit}</span>
        <span className="text-[9px] text-slate-300">{max}{unit}</span>
      </div>
    </div>
  );
}

function ToggleField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-2">{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button key={opt.value} type="button"
            onClick={() => onChange({ target: { name, value: opt.value } })}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all
              ${value === opt.value
                ? "border-teal-400 bg-teal-50 text-teal-600"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FactorBar({ label, percent, hex }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-700">{percent}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: hex }} />
      </div>
    </div>
  );
}

function RecommendationCard({ index, description }) {
  const palette = [
    { bg: "bg-amber-50",   border: "border-l-amber-400",   text: "text-amber-600",   icon: "💡" },
    { bg: "bg-emerald-50", border: "border-l-emerald-400",  text: "text-emerald-600", icon: "🌿" },
    { bg: "bg-purple-50",  border: "border-l-purple-400",   text: "text-purple-600",  icon: "🧪" },
    { bg: "bg-teal-50",    border: "border-l-teal-400",     text: "text-teal-600",    icon: "🎯" },
  ];
  const p = palette[index % palette.length];
  return (
    <div className={`p-4 rounded-2xl border-l-4 ${p.bg} ${p.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg leading-none">{p.icon}</span>
        <span className={`text-xs font-bold ${p.text}`}>Recommendation {index + 1}</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StressPrediction() {
  const [formData, setFormData] = useState({
    studentName: "Student",
    term_mark_avg: "0",
    prev_term_mark_avg: "0",
    daily_study: "0",
    prefer_study: "1",
    travel_time: "0",
    financial_status: "0",
    social_media: "0",
    sleep_hours: "0",
    attendance: "0",
    tuition_hours_per_week: "0",
    disaster_impact: "0",
  });

  const [prediction, setPrediction]   = useState(null);
  const [stressScore, setStressScore] = useState(null);
  const [recommendations, setRecs]    = useState([]);
  const [stressFactors, setFactors]   = useState({ academic: 0, lifestyle: 0, external: 0 });
  const [trendData, setTrendData]     = useState([]);
  const [loading, setLoading]         = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecs, setHistoryRecs] = useState([]);
  const [historyLoad, setHistoryLoad] = useState(false);
  const [historyErr,  setHistoryErr]  = useState("");

  const _user     = getUser();
  const studentId = _user?._id || _user?.id || "GUEST";

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const d = {
        studentId,
        studentName: formData.studentName,
        term_mark_avg:          parseFloat(formData.term_mark_avg)          || 0,
        prev_term_mark_avg:     parseFloat(formData.prev_term_mark_avg)     || 0,
        daily_study:            parseFloat(formData.daily_study)            || 0,
        prefer_study:           parseInt(formData.prefer_study, 10),
        travel_time:            parseFloat(formData.travel_time)            || 0,
        financial_status:       parseInt(formData.financial_status)         || 0,
        social_media:           parseFloat(formData.social_media)           || 0,
        sleep_hours:            parseFloat(formData.sleep_hours)            || 0,
        attendance:             parseFloat(formData.attendance)             || 0,
        tuition_hours_per_week: parseFloat(formData.tuition_hours_per_week) || 0,
        disaster_impact:        parseInt(formData.disaster_impact)          || 0,
      };
      const res = await axios.post(`${API_URLS.STRESS_BACKEND}/api/predict`, d);
      const code  = res.data.prediction_code;
      // Good=low(20), Bad=high(75), Awful=critical(95) — correct risk mapping
      const score = code === 0 ? 20 : code === 1 ? 75 : 95;
      setPrediction(res.data.stress_level);
      setStressScore(score);

      try {
        const hist = await axios.get(`${API_URLS.STRESS_BACKEND}/api/history/${studentId}`);
        if (Array.isArray(hist.data)) {
          const last7 = hist.data.slice(0, 7).reverse();
          const scores = last7.map(p => p.predictionCode === 0 ? 20 : p.predictionCode === 1 ? 75 : 95);
          while (scores.length < 7) scores.unshift(score);
          setTrendData(scores);
        }
      } catch { setTrendData([20,75,20,75,20,75, score]); }

      setFactors({
        academic:  Math.min(100, Math.max(0, Math.round(((100 - d.term_mark_avg)*0.5 + (100 - d.attendance)*0.5) / 2))),
        lifestyle: Math.min(100, Math.max(0, Math.round(((8 - d.sleep_hours)*12.5 + d.social_media*15 + d.daily_study*5) / 3))),
        external:  Math.min(100, Math.max(0, Math.round((d.financial_status*25 + d.disaster_impact*25 + d.travel_time*10) / 3))),
      });
      setRecs(Array.isArray(res.data.ai_recommendations) ? res.data.ai_recommendations : []);
    } catch (err) {
      console.error(err);
      alert("Error getting prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoad(true);
    setHistoryErr("");
    try {
      const res = await axios.get(`${API_URLS.STRESS_BACKEND}/api/history/${studentId.trim()}`);
      setHistoryRecs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistoryErr(err.response?.data?.error || "Failed to load history.");
    } finally {
      setHistoryLoad(false);
    }
  };

  const sc        = stressColor(prediction);
  const chartData = trendData.length > 0 ? trendData : [20,75,20,75,20,75,20];
  const days      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <Layout title="Exam Stress Prediction">
      {/* History Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Your Stress History"
        loading={historyLoad}
        error={historyErr}
        records={historyRecs}
        emptyText="No stress predictions saved for this student yet."
        columns={["#","Date","Stress Level","Term Marks","Attendance","Sleep","Social Media"]}
        renderRow={(rec, i) => {
          const lvl   = rec.stressLevel;
          const color = lvl === "Good" ? "#10b981" : lvl === "Bad" ? "#f59e0b" : "#ef4444";
          return (
            <>
              <td className="px-4 py-3 text-xs text-slate-500">{i + 1}</td>
              <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(rec.timestamp)}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{lvl}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{rec.inputData?.term_mark_avg ?? "—"}%</td>
              <td className="px-4 py-3 text-xs text-slate-500">{rec.inputData?.attendance ?? "—"}%</td>
              <td className="px-4 py-3 text-xs text-slate-500">{rec.inputData?.sleep_hours ?? "—"} hrs</td>
              <td className="px-4 py-3 text-xs text-slate-500">{rec.inputData?.social_media ?? "—"} hrs</td>
            </>
          );
        }}
      />

      <div className="animate-fadeIn max-w-7xl mx-auto space-y-5">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 p-8 shadow-lg shadow-teal-500/20">
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
          <div className="absolute right-8 top-24 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Brain size={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight">Exam Stress Predictor</h1>
                <p className="text-teal-100 text-sm mt-1">AI-powered stress analysis with personalised recommendations</p>
              </div>
            </div>
            <button type="button" onClick={openHistory}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-semibold text-sm hover:bg-white/30 transition-all">
              📋 View History
            </button>
          </div>
        </div>

        {/* ── 3-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ═══ LEFT: Form Panel ═══ */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Predict Stress</h3>
                <p className="text-xs text-slate-400">Adjust your wellness indicators</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Academic */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <SectionHeading icon="📚" label="Academic" color="text-blue-500" />
                <div className="space-y-4">
                  <SliderField label="Current Term Marks (%)"  name="term_mark_avg"      value={formData.term_mark_avg}      onChange={handleChange} min={0} max={100} step={1}   unit="%" />
                  <SliderField label="Previous Term Marks (%)" name="prev_term_mark_avg"  value={formData.prev_term_mark_avg}  onChange={handleChange} min={0} max={100} step={1}   unit="%" />
                  <SliderField label="Attendance (%)"          name="attendance"          value={formData.attendance}          onChange={handleChange} min={0} max={100} step={1}   unit="%" />
                </div>
              </div>

              {/* Lifestyle */}
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <SectionHeading icon="🌙" label="Lifestyle" color="text-purple-500" />
                <div className="space-y-4">
                  <SliderField label="Sleep Hours / Night"   name="sleep_hours"            value={formData.sleep_hours}            onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
                  <SliderField label="Daily Study Hours"     name="daily_study"            value={formData.daily_study}            onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
                  <SliderField label="Tuition Hours / Week"  name="tuition_hours_per_week" value={formData.tuition_hours_per_week} onChange={handleChange} min={0} max={25} step={1}   unit="hrs" />
                  <SliderField label="Travel Time (hrs/day)" name="travel_time"            value={formData.travel_time}            onChange={handleChange} min={0} max={6}  step={0.5} unit="hrs" />
                  <ToggleField label="Study Preference" name="prefer_study" value={formData.prefer_study} onChange={handleChange}
                    options={[{ value: "0", label: "Morning" }, { value: "1", label: "Afternoon" }, { value: "2", label: "Night" }]} />
                </div>
              </div>

              {/* External */}
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <SectionHeading icon="🌐" label="External" color="text-orange-500" />
                <div className="space-y-4">
                  <SliderField label="Social Media (hrs/day)" name="social_media" value={formData.social_media} onChange={handleChange} min={0} max={12} step={0.5} unit="hrs" />
                  <ToggleField label="Financial Status" name="financial_status" value={formData.financial_status} onChange={handleChange}
                    options={[{ value: "0", label: "Stable" }, { value: "1", label: "Moderate" }, { value: "2", label: "Critical" }]} />
                  <ToggleField label="Disaster Impact" name="disaster_impact" value={formData.disaster_impact} onChange={handleChange}
                    options={[{ value: "0", label: "None" }, { value: "1", label: "Moderate" }, { value: "2", label: "Severe" }]} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analysing...
                  </>
                ) : (
                  <><Zap size={16}/> Predict Stress Level</>
                )}
              </button>
            </form>
          </div>

          {/* ═══ RIGHT 2/3: Results ═══ */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Row 1: Stress badge + Factor bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Stress Level */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Stress Level</p>
                {prediction ? (
                  <>
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 ring-8 ${sc.ring} ${sc.bg}`}>
                      <span className={`text-2xl font-black ${sc.text}`}>{prediction}</span>
                    </div>
                    <span className={`text-lg font-bold ${sc.text} mb-1`}>{friendlyLabel(prediction)}</span>
                    <span className="text-xs text-slate-400">Model prediction · {stressScore}/100</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <div className="w-24 h-24 rounded-full bg-slate-50 ring-8 ring-slate-100 flex items-center justify-center mb-4">
                      <Brain size={32} className="text-slate-200" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">Submit form to see result</p>
                  </div>
                )}
              </div>

              {/* Factor Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                    <BarChart2 size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Stress Factor Breakdown</span>
                </div>
                <FactorBar label="Academic Pressure" percent={stressFactors.academic}  hex="#6366f1" />
                <FactorBar label="Lifestyle Factors"  percent={stressFactors.lifestyle} hex="#14b8a6" />
                <FactorBar label="External Factors"   percent={stressFactors.external}  hex="#f97316" />
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"/>Academic</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block"/>Lifestyle</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/>External</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">AI Academic Coach</h3>
                  <p className="text-xs text-slate-400">Personalised recommendations</p>
                </div>
              </div>

              {recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">No Recommendations Yet</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Submit your wellness data to receive<br/>AI-powered personalised guidance</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.map((rec, i) => (
                    <RecommendationCard key={i} index={i} description={rec} />
                  ))}
                </div>
              )}
            </div>

            {/* 7-Day Trend */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <span className="text-sm font-bold text-slate-700">7-Day Stress Trend</span>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-3 h-0.5 bg-teal-400 inline-block rounded"/>Stress Score
                </div>
              </div>
              <svg width="100%" height="150" viewBox="0 0 700 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0"    />
                  </linearGradient>
                </defs>
                {[0,25,50,75,100].map(v => (
                  <line key={v} x1="0" y1={150 - v*1.4} x2="700" y2={150 - v*1.4} stroke="#f1f5f9" strokeWidth="1"/>
                ))}
                <path
                  d={[`M 0 ${150 - chartData[0]*1.4}`,
                    ...chartData.map((v,i) => `L ${i*(700/6)} ${150 - v*1.4}`),
                    `L 700 150 L 0 150 Z`].join(" ")}
                  fill="url(#trendGrad)"
                />
                <path
                  d={[`M 0 ${150 - chartData[0]*1.4}`,
                    ...chartData.map((v,i) => `L ${i*(700/6)} ${150 - v*1.4}`)].join(" ")}
                  fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinejoin="round"
                />
                {chartData.map((v,i) => (
                  <circle key={i} cx={i*(700/6)} cy={150 - v*1.4} r="5" fill="white" stroke="#14b8a6" strokeWidth="2.5"/>
                ))}
              </svg>
              <div className="flex justify-between mt-2">
                {days.map(d => (
                  <span key={d} className="text-[10px] text-slate-400 text-center" style={{ width: "14.28%" }}>{d}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default StressPrediction;
