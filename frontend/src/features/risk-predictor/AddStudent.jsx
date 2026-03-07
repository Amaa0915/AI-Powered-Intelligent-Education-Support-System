import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { API_URLS } from "../../api/config";

const GRADES = [8, 9, 10];

const SUBJECTS = [
  { key: "mathematics", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "english", label: "English" },
  { key: "history", label: "History" },
  { key: "sinhala", label: "Sinhala" },
  { key: "buddhism", label: "Buddhism" },
];

const makeGradeState = (grade, year) => ({
  grade,
  year,
  attendance_percentage: "",
  average_score: "",
  performance_trend: "",
  behavior_frequency: "",
  study_hours_per_week: "",
  subject_marks: {
    mathematics: "",
    science: "",
    english: "",
    history: "",
    sinhala: "",
    buddhism: "",
  },
});

const clampNumber = (value, min, max) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.min(max, Math.max(min, n));
};

const AddStudent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(8);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [gradesData, setGradesData] = useState(() => ({
    8: makeGradeState(8, 2023),
    9: makeGradeState(9, 2024),
    10: makeGradeState(10, 2025),
  }));

  const current = gradesData[activeTab];

  const computedAverage = useMemo(() => {
    const marks = Object.values(current.subject_marks).map(Number);
    const valid = marks.filter((m) => !Number.isNaN(m));
    if (!valid.length) return 0;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
  }, [current.subject_marks]);

  const updateGradeField = (grade, name, value) => {
    setGradesData((prev) => ({
      ...prev,
      [grade]: { ...prev[grade], [name]: value },
    }));
  };

  const updateSubject = (grade, subjectKey, value) => {
    setGradesData((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        subject_marks: {
          ...prev[grade].subject_marks,
          [subjectKey]: value,
        },
      },
    }));
  };

  const cloneToNext = (fromGrade) => {
    if (fromGrade >= 10) return;
    const next = fromGrade + 1;
    setGradesData((prev) => ({
      ...prev,
      [next]: {
        ...prev[fromGrade],
        grade: next,
        year: prev[fromGrade].year + 1,
      },
    }));
    setActiveTab(next);
  };

  const validateAll = () => {
    if (!studentId.trim()) return "Student ID is required.";
    for (const g of GRADES) {
      const d = gradesData[g];
      if (!d.year) return `Year is required for Grade ${g}.`;
      if (d.attendance_percentage === "" || d.attendance_percentage == null)
        return `Attendance % is required for Grade ${g}.`;
      if (d.average_score === "" || d.average_score == null)
        return `Average score is required for Grade ${g}.`;
      for (const s of SUBJECTS) {
        const v = d.subject_marks[s.key];
        if (v === "" || v == null) return `${s.label} mark is required for Grade ${g}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateAll();
    if (v) {
      setError(v);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        student_id: studentId.trim(),
        records: GRADES.map((g) => gradesData[g]),
      };
      await axios.post(`${API_URLS.RISK_PREDICTOR_BACKEND}/api/students`, payload);
      alert("Student multi-grade data saved successfully!");
      navigate(`/risk-predictor?studentId=${encodeURIComponent(studentId.trim())}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save student data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-6 py-10 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  Add Multi-Grade Performance Data
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter Grade 8–10 marks and attendance to predict O/L risk.
                </p>
              </div>
              <div className="flex w-full lg:w-auto items-center rounded-xl bg-slate-100 p-1">
                {GRADES.map((g) => (
                  <button key={g} type="button" onClick={() => setActiveTab(g)}
                    className={`w-full lg:w-auto px-5 py-2 rounded-lg text-sm font-semibold transition
                      ${activeTab === g ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 lg:p-8">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                  Student Identity (Main Identifier)
                </label>
                <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter unique Student ID (e.g., STU1234)"
                  className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-7">
                  <section className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-6 w-2 rounded-full bg-blue-500" />
                      <h3 className="text-base font-bold text-slate-900">Grade {activeTab} Academics</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500">Year</label>
                        <input type="number" value={current.year}
                          onChange={(e) => updateGradeField(activeTab, "year", clampNumber(e.target.value, 2000, 2100))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500">Attendance %</label>
                        <input type="number" value={current.attendance_percentage}
                          onChange={(e) => updateGradeField(activeTab, "attendance_percentage", clampNumber(e.target.value, 0, 100))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" min={0} max={100} required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-500">Average Score %</label>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          <input type="number" value={current.average_score}
                            onChange={(e) => updateGradeField(activeTab, "average_score", clampNumber(e.target.value, 0, 100))}
                            className="sm:col-span-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" min={0} max={100} required />
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 flex items-center justify-between">
                            <span className="text-slate-500">From subjects</span>
                            <span>{computedAverage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Subject-wise Scores (0–100)</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {SUBJECTS.map((s) => (
                        <div key={s.key}>
                          <label className="block text-xs font-bold uppercase text-slate-500">{s.label}</label>
                          <input type="number" value={current.subject_marks[s.key]}
                            onChange={(e) => updateSubject(activeTab, s.key, clampNumber(e.target.value, 0, 100))}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" min={0} max={100} required />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-5 space-y-7">
                  <section className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-6 w-2 rounded-full bg-emerald-500" />
                      <h3 className="text-base font-bold text-slate-900">Behavior & Engagement</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500">Performance Trend</label>
                        <select value={current.performance_trend}
                          onChange={(e) => updateGradeField(activeTab, "performance_trend", e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500">
                          <option value="" disabled>Select trend</option>
                          <option value="Improving">Improving</option>
                          <option value="Stable">Stable</option>
                          <option value="Declining">Declining</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500">Behavior Frequency</label>
                        <input type="number" value={current.behavior_frequency}
                          onChange={(e) => updateGradeField(activeTab, "behavior_frequency", clampNumber(e.target.value, 0, 999))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" min={0} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-500">Study Hours / Week</label>
                        <input type="number" value={current.study_hours_per_week}
                          onChange={(e) => updateGradeField(activeTab, "study_hours_per_week", clampNumber(e.target.value, 0, 80))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" min={0} />
                      </div>
                    </div>
                  </section>

                  <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="rounded bg-white/20 px-2 py-1">✨</span>
                      Efficiency Tip
                    </div>
                    <p className="mt-2 text-xs text-indigo-100 leading-relaxed">
                      You can copy Grade {activeTab} values to the next grade to save time.
                    </p>
                    <button type="button" disabled={activeTab === 10} onClick={() => cloneToNext(activeTab)}
                      className="mt-4 w-full rounded-xl bg-white py-3 font-bold text-indigo-700 hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      Clone to Grade {activeTab + 1}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 italic">
                  Please fill data for all three grades for accurate prediction.
                </p>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-10 py-3.5 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition disabled:opacity-60">
                  <Save size={18} />
                  {saving ? "Saving..." : "Save & Finish Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
