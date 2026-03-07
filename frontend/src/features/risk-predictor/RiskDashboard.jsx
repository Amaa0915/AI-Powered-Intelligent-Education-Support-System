import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URLS } from '../../api/config';
import RiskGauge from './components/RiskGauge';
import MetricCard from './components/MetricCard';
import SubjectAnalysis from './components/SubjectAnalysis';
import ActionPlan from './components/ActionPlan';
import HistoryModal, { fmtDate } from '../../components/HistoryModal';
import { getUser } from '../../services/authService';

const RISK_COLOR = { 'Low Risk': '#10b981', 'Medium Risk': '#f59e0b', 'High Risk': '#ef4444' };

const RiskDashboard = () => {
  const [searchParams] = useSearchParams();
  const _user     = getUser();
  const studentId = _user?._id || _user?.id || searchParams.get('studentId') || 'GUEST';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecs, setHistoryRecs] = useState([]);
  const [historyLoad, setHistoryLoad] = useState(false);
  const [historyErr,  setHistoryErr]  = useState('');

  useEffect(() => {
    fetchData(studentId);
  }, [studentId]);

  const fetchData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URLS.RISK_PREDICTOR_BACKEND}/api/risk/${id}`);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please check the Backend API or Student ID.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoad(true);
    setHistoryErr('');
    try {
      const res = await axios.get(`${API_URLS.RISK_PREDICTOR_BACKEND}/api/risk/history/${studentId}`);
      setHistoryRecs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistoryErr(err.response?.data?.error || 'Failed to load history.');
    } finally {
      setHistoryLoad(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-emerald-600 font-bold">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* History Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Your Risk Prediction History"
        loading={historyLoad}
        error={historyErr}
        records={historyRecs}
        emptyText="No risk predictions saved for this student yet. Run a prediction first."
        columns={['#', 'Date', 'Risk Level', 'Confidence', 'Avg Score', 'Attendance', 'Study Hrs']}
        renderRow={(rec, i) => {
          const lvl   = rec.risk_level || '—';
          const color = RISK_COLOR[lvl] || '#94a3b8';
          return (
            <>
              <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
              <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(rec.predicted_at)}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                  {lvl}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300 text-xs">{rec.confidence != null ? `${(rec.confidence * 100).toFixed(1)}%` : '—'}</td>
              <td className="px-4 py-3 text-slate-300 text-xs">{rec.metrics?.avg_score?.toFixed(1) ?? '—'}%</td>
              <td className="px-4 py-3 text-slate-300 text-xs">{rec.metrics?.attendance_rate?.toFixed(1) ?? '—'}%</td>
              <td className="px-4 py-3 text-slate-300 text-xs">{rec.metrics?.study_hours_per_week?.toFixed(1) ?? '—'} h</td>
            </>
          );
        }}
      />

      {error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-200 text-center">
          <p className="font-bold text-lg mb-2">Student Not Found</p>
          <p className="opacity-75 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/risk-predictor" className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold">Add This Student</Link>
            <button onClick={openHistory}
              className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
              📋 View History
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* History button row */}
          <div className="flex justify-end">
            <button onClick={openHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-colors">
              📋 Prediction History
            </button>
          </div>

          <RiskGauge
            riskLevel={data?.risk_assessment?.risk_level}
            probability={data?.risk_assessment?.probabilities?.low}
            studentName={data?.student_info?.name}
            studentGrade={data?.student_info?.grade}
          />

          <div className="grid grid-cols-4 gap-6">
            <MetricCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>}
              label="Academic Performance"
              value={`${data?.metrics?.academic_performance?.value}%`}
              subtext="Average"
              status={data?.metrics?.academic_performance?.status}
              color="bg-indigo-50"
            />
            <MetricCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Attendance Rate"
              value={`${data?.metrics?.attendance_rate?.value}%`}
              subtext="Present"
              status={data?.metrics?.attendance_rate?.status}
              color="bg-purple-50"
            />
            <MetricCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Study Habits"
              value={`${data?.metrics?.study_habits?.value}h`}
              subtext="/ week"
              status={data?.metrics?.study_habits?.status}
              color="bg-orange-50"
            />
            <MetricCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              label="Health Status"
              value={data?.metrics?.health_status?.value}
              subtext=""
              status={data?.metrics?.health_status?.status}
              color="bg-rose-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <SubjectAnalysis subjects={data?.subject_analysis || {}} />
            </div>
            <div className="col-span-1">
              <ActionPlan recommendations={data?.action_plan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskDashboard;
