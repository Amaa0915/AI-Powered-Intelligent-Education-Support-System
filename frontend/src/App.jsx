import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';

// Learning Path features
import LPAddStudent from './features/learning-path/AddStudent';
import LPDashboard from './features/learning-path/Dashboard';
import StudentList from './features/learning-path/StudentList';
import StudentProfile from './features/learning-path/StudentProfile';
import AdaptivePath from './features/learning-path/AdaptivePath';

// Stress Prediction feature
import StressPrediction from './features/stress/StressPrediction';

// Risk Predictor features
import RiskDashboard from './features/risk-predictor/RiskDashboard';
import RiskAddStudent from './features/risk-predictor/AddStudent';

// Attendance Trends features
import AttendanceLayout from './features/attendance/AttendanceLayout';
import AttendanceDashboard from './features/attendance/AttendanceDashboard';
import AttendanceTrendsPage from './features/attendance/AttendanceTrendsPage';
import AnomalyReport from './features/attendance/AnomalyReport';
import ContextualAnalysis from './features/attendance/ContextualAnalysis';
import AttendanceForecasting from './features/attendance/AttendanceForecasting';
import StudentDirectory from './features/attendance/StudentDirectory';

import Layout from './components/Layout';

// Risk Predictor Page — shows Dashboard if studentId in URL, otherwise AddStudent form
function RiskPredictorPage() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');

  return (
    <Layout title="Risk Predictor">
      {studentId ? <RiskDashboard /> : <RiskAddStudent />}
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Learning Path routes */}
        <Route path="/" element={<LPAddStudent />} />
        <Route path="/add-student" element={<LPAddStudent />} />
        <Route path="/dashboard" element={<LPDashboard />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/adaptive-path" element={<AdaptivePath />} />

        {/* Stress Prediction */}
        <Route path="/stress" element={<StressPrediction />} />

        {/* Risk Predictor */}
        <Route path="/risk-predictor" element={<RiskPredictorPage />} />

        {/* Attendance Trends */}
        <Route path="/attendance" element={<AttendanceLayout />}>
          <Route index element={<AttendanceDashboard />} />
          <Route path="trends" element={<AttendanceTrendsPage />} />
          <Route path="anomalies" element={<AnomalyReport />} />
          <Route path="contextual" element={<ContextualAnalysis />} />
          <Route path="forecast" element={<AttendanceForecasting />} />
          <Route path="students" element={<StudentDirectory />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
