import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock3,
  Percent,
  Brain,
  MonitorSmartphone,
  BookOpenCheck,
  Lightbulb,
} from "lucide-react";

// ── Result Card ───────────────────────────────────────────────────────────────
const RiskResultCard = ({
  riskLevel = "Medium Risk",
  probability = 0.72,
  attendance = 78,
  grade8Average = 68,
  grade9Average = 64,
  grade10Average = 58,
  homeworkCompletion = "Sometimes",
  studyHoursPerWeek = 6,
  iqRate = 95,
  screenTimePerDay = 4,
}) => {
  const getRiskColor = (level) => {
    switch (level) {
      case "Low Risk":
        return {
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
          accent: "from-emerald-500 to-teal-500",
          soft: "bg-emerald-50",
          text: "text-emerald-700",
        };
      case "Medium Risk":
        return {
          badge: "bg-amber-100 text-amber-700 border-amber-200",
          accent: "from-amber-500 to-orange-500",
          soft: "bg-amber-50",
          text: "text-amber-700",
        };
      case "High Risk":
        return {
          badge: "bg-red-100 text-red-700 border-red-200",
          accent: "from-red-500 to-rose-500",
          soft: "bg-red-50",
          text: "text-red-700",
        };
      default:
        return {
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          accent: "from-slate-500 to-slate-600",
          soft: "bg-slate-50",
          text: "text-slate-700",
        };
    }
  };

  const riskStyle = getRiskColor(riskLevel);
  const overallAverage = (
    (Number(grade8Average) + Number(grade9Average) + Number(grade10Average)) / 3
  ).toFixed(1);

  const getTrend = () => {
    const g8 = Number(grade8Average);
    const g9 = Number(grade9Average);
    const g10 = Number(grade10Average);
    if (g8 < g9 && g9 < g10) return "Improving";
    if (g8 > g9 && g9 > g10) return "Declining";
    return "Stable";
  };

  const trend = getTrend();

  const getTrendIcon = () => {
    if (trend === "Improving") return <TrendingUp size={18} className="text-emerald-600" />;
    if (trend === "Declining") return <TrendingDown size={18} className="text-red-600" />;
    return <Minus size={18} className="text-amber-600" />;
  };

  const getAttendanceStatus = () => {
    if (attendance >= 85) return "Good";
    if (attendance >= 70) return "Moderate";
    return "Poor";
  };

  const getContributingFactors = () => {
    const factors = [];
    if (attendance < 75) factors.push("Low attendance may negatively affect academic consistency.");
    if (trend === "Declining") factors.push("Academic performance shows a declining trend across grades.");
    if (Number(studyHoursPerWeek) < 8) factors.push("Weekly study hours are below the recommended level.");
    if (homeworkCompletion === "Rarely") factors.push("Homework completion is low, which may reduce subject understanding.");
    else if (homeworkCompletion === "Sometimes") factors.push("Homework completion is inconsistent.");
    if (Number(screenTimePerDay) > 4) factors.push("Higher screen time may reduce focused study time.");
    if (factors.length === 0) factors.push("Current academic and behaviour indicators appear balanced.");
    return factors;
  };

  const getRecommendations = () => {
    const tips = [];
    if (attendance < 75) tips.push("Improve school attendance and maintain a regular learning routine.");
    if (trend === "Declining") tips.push("Review recent academic difficulties and create a weekly improvement plan.");
    if (Number(studyHoursPerWeek) < 8) tips.push("Increase study hours gradually with a fixed weekly timetable.");
    if (homeworkCompletion !== "Often") tips.push("Complete homework regularly to strengthen daily learning progress.");
    if (Number(screenTimePerDay) > 4) tips.push("Reduce daily screen time and allocate more time for revision.");
    if (tips.length === 0) tips.push("Maintain current study habits and continue monitoring academic progress.");
    return tips;
  };

  const factors = getContributingFactors();
  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${riskStyle.accent}`} />
        <div className="grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          {/* Left */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${riskStyle.soft}`}>
                <AlertTriangle className={riskStyle.text} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Prediction Result</p>
                <h2 className="text-2xl font-bold text-slate-900">Academic Risk Assessment</h2>
              </div>
            </div>
            <div className="mt-6">
              <span className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${riskStyle.badge}`}>
                {riskLevel}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Percent size={16} />
                <span className="text-sm font-medium">Overall Average</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{overallAverage}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                {getTrendIcon()}
                <span className="text-sm font-medium">Performance Trend</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{trend}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <BookOpenCheck size={16} />
                <span className="text-sm font-medium">Attendance Status</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{getAttendanceStatus()}</p>
              <p className="text-sm text-slate-500">{attendance}% attendance</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock3 size={16} />
                <span className="text-sm font-medium">Study Hours</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {studyHoursPerWeek || 0} hrs/week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Summary */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-5">Academic Summary by Year</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">Grade 8 Average</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{grade8Average}%</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">Grade 9 Average</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{grade9Average}%</p>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <p className="text-sm font-medium text-purple-700">Grade 10 Average</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{grade10Average}%</p>
          </div>
        </div>
      </div>

      {/* Study Behaviour + Recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-5">Study Behaviour Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <BookOpenCheck size={18} className="text-indigo-600" />
                <span className="font-medium text-slate-700">Homework Completion</span>
              </div>
              <span className="font-bold text-slate-900">{homeworkCompletion}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <Clock3 size={18} className="text-emerald-600" />
                <span className="font-medium text-slate-700">Study Hours / Week</span>
              </div>
              <span className="font-bold text-slate-900">{studyHoursPerWeek} hrs</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-600" />
                <span className="font-medium text-slate-700">IQ Rate</span>
              </div>
              <span className="font-bold text-slate-900">{iqRate}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <MonitorSmartphone size={18} className="text-amber-600" />
                <span className="font-medium text-slate-700">Screen Time / Day</span>
              </div>
              <span className="font-bold text-slate-900">{screenTimePerDay} hrs</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
              <Lightbulb size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Recommendations</h3>
              <p className="text-sm text-slate-500">Suggested actions based on the current prediction</p>
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.map((tip, index) => (
              <div
                key={index}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-slate-700"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page Wrapper ──────────────────────────────────────────────────────────────
const RiskDashboard = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId") || "";
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saved = JSON.parse(localStorage.getItem("riskFormData") || "{}");

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    axios
      .get(`http://localhost:8000/api/risk/${studentId}`)
      .then((res) => setRiskData(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-emerald-600 font-bold text-lg">
        Analyzing risk...
      </div>
    );

  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
        <p className="font-bold text-lg mb-2">Error</p>
        <p className="opacity-75">{error}</p>
      </div>
    );

  return (
    <RiskResultCard
      riskLevel={riskData?.risk_assessment?.risk_level || "Medium Risk"}
      probability={riskData?.risk_assessment?.probabilities?.high || 0}
      attendance={Number(saved.attendance) || riskData?.metrics?.attendance_rate?.value || 0}
      grade8Average={Number(saved.grade8Average) || 0}
      grade9Average={Number(saved.grade9Average) || 0}
      grade10Average={Number(saved.grade10Average) || 0}
      homeworkCompletion={saved.homeworkCompletion || "Sometimes"}
      studyHoursPerWeek={Number(saved.studyHoursPerWeek) || riskData?.metrics?.study_habits?.value || 0}
      iqRate={Number(saved.iqRate) || 100}
      screenTimePerDay={Number(saved.screenTimePerDay) || 0}
    />
  );
};

export default RiskDashboard;
