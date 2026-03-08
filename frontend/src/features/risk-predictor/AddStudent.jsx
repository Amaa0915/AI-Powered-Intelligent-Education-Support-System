import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URLS } from "../../api/config";
import {
  ArrowLeft,
  Save,
  School,
  BookOpen,
  Brain,
  TrendingDown,
  Percent,
  Clock3,
  MonitorSmartphone,
} from "lucide-react";

const clamp = (value, min, max) => {
  if (value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Math.min(max, Math.max(min, num));
};

const getTrend = (g8, g9, g10) => {
  if (g8 === "" || g9 === "" || g10 === "") return "—";

  const n8 = Number(g8);
  const n9 = Number(g9);
  const n10 = Number(g10);

  if (n8 < n9 && n9 < n10) return "Improving";
  if (n8 > n9 && n9 > n10) return "Declining";
  return "Stable";
};

const RiskPredictionForm = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    attendance: "",
    grade8Average: "",
    grade9Average: "",
    grade10Average: "",
    homeworkCompletion: "Often",
    studyHoursPerWeek: "",
    iqRate: "",
    screenTimePerDay: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numericFields = [
      "attendance",
      "grade8Average",
      "grade9Average",
      "grade10Average",
      "studyHoursPerWeek",
      "iqRate",
      "screenTimePerDay",
    ];

    if (numericFields.includes(name)) {
      let newValue = value;

      if (
        name === "attendance" ||
        name === "grade8Average" ||
        name === "grade9Average" ||
        name === "grade10Average"
      ) {
        newValue = clamp(value, 0, 100);
      } else if (name === "iqRate") {
        newValue = clamp(value, 50, 200);
      } else {
        newValue = value === "" ? "" : Number(value);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const averageScore = useMemo(() => {
    const { grade8Average, grade9Average, grade10Average } = formData;

    if (
      grade8Average === "" ||
      grade9Average === "" ||
      grade10Average === ""
    ) {
      return "—";
    }

    const avg =
      (Number(grade8Average) +
        Number(grade9Average) +
        Number(grade10Average)) /
      3;

    return avg.toFixed(1);
  }, [formData.grade8Average, formData.grade9Average, formData.grade10Average]);

  const performanceTrend = useMemo(() => {
    return getTrend(
      formData.grade8Average,
      formData.grade9Average,
      formData.grade10Average
    );
  }, [
    formData.grade8Average,
    formData.grade9Average,
    formData.grade10Average,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate a unique student ID
      const studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Validate required fields
      if (!formData.grade8Average || !formData.grade9Average || !formData.grade10Average) {
        alert("Please fill in all grade averages");
        setSubmitting(false);
        return;
      }

      // Build one record per grade
      const grades = [
        { grade: 8, avg: Number(formData.grade8Average) || 0, year: 2022 },
        { grade: 9, avg: Number(formData.grade9Average) || 0, year: 2023 },
        { grade: 10, avg: Number(formData.grade10Average) || 0, year: 2024 },
      ];

      const records = grades.map(({ grade, avg, year }) => ({
        grade,
        year,
        attendance_percentage: Number(formData.attendance) || 75,
        average_score: avg,
        study_hours_per_week: Number(formData.studyHoursPerWeek) || 4,
        behavior_frequency: 0,
        subject_marks: {
          mathematics: avg,
          science: avg,
          english: avg,
          history: avg,
          sinhala: avg,
          buddhism: avg,
        },
        performance_trend: performanceTrend || "Stable",
      }));

      const payload = {
        student_id: studentId,
        records,
      };

      console.log("Submitting payload:", payload);
      const response = await axios.post(`${API_URLS.RISK_PREDICTOR_BACKEND}/api/students`, payload);
      console.log("Response:", response.data);

      // Use the student_id returned from backend
      const returnedStudentId = response.data.student_id || studentId;

      // Navigate to the risk assessment results page with the student ID
      navigate(`/risk-predictor?studentId=${returnedStudentId}`);
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to save data. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const trendColor =
    performanceTrend === "Improving"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : performanceTrend === "Declining"
      ? "text-red-600 bg-red-50 border-red-200"
      : "text-amber-600 bg-amber-50 border-amber-200";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Student Risk Assessment Form
              </h1>
              <p className="mt-2 text-sm md:text-base text-white/90">
                Enter simple academic and study details to predict student risk
                in a user-friendly way.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm">
              Easy to fill • School friendly • Auto indicators
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* School Records */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                  <School size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    School Records
                  </h2>
                  <p className="text-sm text-slate-500">
                    Basic attendance information
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Attendance Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="attendance"
                    value={formData.attendance}
                    onChange={handleChange}
                    placeholder="Enter attendance %"
                    min="0"
                    max="100"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <Percent
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </section>

            {/* Study Behaviour */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                  <Brain size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Study Behaviour
                  </h2>
                  <p className="text-sm text-slate-500">
                    Learning habits and daily routine
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Homework Completion
                  </label>
                  <select
                    name="homeworkCompletion"
                    value={formData.homeworkCompletion}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="Often">Often</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Rarely">Rarely</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Study Hours / Week
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="studyHoursPerWeek"
                      value={formData.studyHoursPerWeek}
                      onChange={handleChange}
                      placeholder="e.g. 10"
                      min="0"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                    <Clock3
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Screen Time / Day
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="screenTimePerDay"
                      value={formData.screenTimePerDay}
                      onChange={handleChange}
                      placeholder="e.g. 3"
                      min="0"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                    <MonitorSmartphone
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    IQ Rate
                  </label>
                  <input
                    type="number"
                    name="iqRate"
                    value={formData.iqRate}
                    onChange={handleChange}
                    placeholder="Enter IQ rate"
                    min="50"
                    max="200"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Academic Performance */}
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Academic Performance
                </h2>
                <p className="text-sm text-slate-500">
                  Enter yearly average marks instead of many subject marks
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Grade 8 Average %
                </label>
                <input
                  type="number"
                  name="grade8Average"
                  value={formData.grade8Average}
                  onChange={handleChange}
                  placeholder="Enter Grade 8 average"
                  min="0"
                  max="100"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Grade 9 Average %
                </label>
                <input
                  type="number"
                  name="grade9Average"
                  value={formData.grade9Average}
                  onChange={handleChange}
                  placeholder="Enter Grade 9 average"
                  min="0"
                  max="100"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Grade 10 Average %
                </label>
                <input
                  type="number"
                  name="grade10Average"
                  value={formData.grade10Average}
                  onChange={handleChange}
                  placeholder="Enter Grade 10 average"
                  min="0"
                  max="100"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* Auto Indicators */}
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <TrendingDown size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  System Indicators
                </h2>
                <p className="text-sm text-slate-500">
                  These values are calculated automatically
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Overall Average Score
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {averageScore === "—" ? "—" : `${averageScore}%`}
                </p>
              </div>

              <div className={`rounded-2xl border p-5 ${trendColor}`}>
                <p className="text-sm font-medium">Performance Trend</p>
                <p className="mt-2 text-3xl font-bold">{performanceTrend}</p>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {submitting ? "Saving..." : "Submit & Analyze Risk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskPredictionForm;