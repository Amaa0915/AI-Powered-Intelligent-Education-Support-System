const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ATTENDANCE_URL = import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5050';

export const API_URLS = {
<<<<<<< Updated upstream
  STRESS_BACKEND:          import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  LEARNING_PATH_BACKEND:   import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  RISK_PREDICTOR_BACKEND:  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  ATTENDANCE_BACKEND:      import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5050',
  AUTH_BACKEND:            import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5050',
=======
  STRESS_BACKEND:          BASE_URL,
  LEARNING_PATH_BACKEND:   BASE_URL,
  RISK_PREDICTOR_BACKEND:  BASE_URL,
  ATTENDANCE_BACKEND:      ATTENDANCE_URL,
  AUTH_BACKEND:            ATTENDANCE_URL
>>>>>>> Stashed changes
};
