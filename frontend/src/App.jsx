import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Auth pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, isAdmin } from './services/authService';

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <Router>
        <Routes>
          {/* ── Public routes ───────────────────────────────────────── */}
          <Route path="/" element={
            isAuthenticated()
              ? <Navigate to={isAdmin() ? '/admin/dashboard' : '/add-student'} replace />
              : <HomePage />
          } />
          <Route path="/login" element={
            isAuthenticated()
              ? <Navigate to={isAdmin() ? '/admin/dashboard' : '/add-student'} replace />
              : <LoginPage />
          } />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Admin route ─────────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Protected: Learning Path ─────────────────────────────── */}
          <Route path="/add-student" element={<ProtectedRoute><LPAddStudent /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><LPDashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
          <Route path="/adaptive-path" element={<ProtectedRoute><AdaptivePath /></ProtectedRoute>} />

          {/* ── Protected: Stress Prediction ─────────────────────────── */}
          <Route path="/stress" element={<ProtectedRoute><StressPrediction /></ProtectedRoute>} />

          {/* ── Protected: Risk Predictor ────────────────────────────── */}
          <Route path="/risk-predictor" element={<ProtectedRoute><RiskPredictorPage /></ProtectedRoute>} />

          {/* ── Protected: Attendance Trends ─────────────────────────── */}
          <Route path="/attendance" element={<ProtectedRoute><AttendanceLayout /></ProtectedRoute>}>
            <Route index element={<AttendanceDashboard />} />
            <Route path="trends" element={<AttendanceTrendsPage />} />
            <Route path="anomalies" element={<AnomalyReport />} />
            <Route path="contextual" element={<ContextualAnalysis />} />
            <Route path="forecast" element={<AttendanceForecasting />} />
            <Route path="students" element={<StudentDirectory />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
