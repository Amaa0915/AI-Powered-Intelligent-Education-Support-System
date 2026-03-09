// Unified backend — all services on port 8000
export const API_URLS = {
  STRESS_BACKEND:          import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  LEARNING_PATH_BACKEND:   import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  RISK_PREDICTOR_BACKEND:  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ATTENDANCE_BACKEND:      import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5050',
  AUTH_BACKEND:            import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5050',
};
