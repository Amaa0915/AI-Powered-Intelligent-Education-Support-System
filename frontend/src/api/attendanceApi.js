import axios from 'axios';
import { API_URLS } from './config';

const api = axios.create({ baseURL: `${API_URLS.ATTENDANCE_BACKEND}/api`, timeout: 30000 });
const mlApi = axios.create({ baseURL: `${API_URLS.ATTENDANCE_BACKEND}/api`, timeout: 180000 });

// Analytics
export const fetchSummary = () => api.get('/analytics/summary').then(r => r.data);
export const fetchGradeBreakdown = () => api.get('/analytics/grade-breakdown').then(r => r.data);
export const fetchRateDistribution = () => api.get('/analytics/rate-distribution').then(r => r.data);

// Students
export const fetchStudents = (params) => api.get('/students', { params }).then(r => r.data);
export const fetchStudent = (id) => api.get(`/students/${id}`).then(r => r.data);
export const fetchRiskSummary = () => api.get('/students/stats/risk-summary').then(r => r.data);

// Attendance
export const fetchMonthlySummary = () => api.get('/attendance/monthly-summary').then(r => r.data);
export const fetchStudentAttendance = (id, params) => api.get(`/attendance/student/${id}`, { params }).then(r => r.data);
export const fetchDayOfWeek = () => api.get('/attendance/day-of-week').then(r => r.data);
export const fetchWeatherCorrelation = () => api.get('/attendance/weather-correlation').then(r => r.data);
export const fetchStudentFilteredAttendance = (params) => api.get('/attendance/student-filter', { params }).then(r => r.data);

// Anomalies
export const fetchAnomalies = (params) => api.get('/anomalies', { params }).then(r => r.data);
export const fetchAnomalyTypeSummary = () => api.get('/anomalies/type-summary').then(r => r.data);

// Forecasting (requires ML service on port 8001)
export const fetchGlobalLSTM = (steps = 30) =>
    mlApi.get('/forecast/global/lstm', { params: { steps } }).then(r => r.data);
export const fetchGlobalARIMA = (steps = 12) =>
    mlApi.get('/forecast/global/arima', { params: { steps } }).then(r => r.data);
export const fetchStudentForecast = (studentId, steps = 6) =>
    mlApi.get(`/forecast/student/${studentId}`, { params: { steps } }).then(r => r.data);
export const refreshForecasts = () => mlApi.post('/forecast/refresh').then(r => r.data);
export const fetchForecastHealth = () => api.get('/forecast/health').then(r => r.data);

// Contextual Impact Analysis (requires ML service on port 8001)
export const fetchContextualImpact = () =>
    mlApi.get('/contextual/impact').then(r => r.data);
export const fetchStudentImpact = (studentId) =>
    mlApi.post('/contextual/student-impact', { student_id: studentId }).then(r => r.data);
export const predictContextual = (payload) =>
    mlApi.post('/contextual/predict', payload).then(r => r.data);
export const predictStudentContextual = (payload) =>
    mlApi.post('/contextual/predict-student', payload).then(r => r.data);
export const predictGuestTrend = (payload) =>
    mlApi.post('/contextual/guest-trend', payload).then(r => r.data);

export default api;
