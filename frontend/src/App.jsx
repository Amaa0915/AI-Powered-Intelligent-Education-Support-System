import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';

// Learning Path features
import LPAddStudent from './features/learning-path/AddStudent';
import LPDashboard from './features/learning-path/Dashboard';
import StudentList from './features/learning-path/StudentList';
import StudentProfile from './features/learning-path/StudentProfile';
import AdaptivePath from './features/learning-path/AdaptivePath';
import AttendanceAnalyze from './features/learning-path/AttendanceAnalyze';

// Stress Prediction feature
import StressPrediction from './features/stress/StressPrediction';

// Risk Predictor features
import RiskDashboard from './features/risk-predictor/RiskDashboard';
import RiskAddStudent from './features/risk-predictor/AddStudent';

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
        <Route path="/attendance-analyze" element={<AttendanceAnalyze />} />

        {/* Stress Prediction */}
        <Route path="/stress" element={<StressPrediction />} />

        {/* Risk Predictor */}
        <Route path="/risk-predictor" element={<RiskPredictorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
