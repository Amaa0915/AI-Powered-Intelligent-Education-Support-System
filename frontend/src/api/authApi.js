import axios from 'axios';
import { API_URLS } from './config';

<<<<<<< Updated upstream
const authApi = axios.create({ baseURL: `${API_URLS.AUTH_BACKEND}/api/auth`, timeout: 15000 });
const adminApi = axios.create({ baseURL: `${API_URLS.AUTH_BACKEND}/api/admin`, timeout: 15000 });
=======
import { API_URLS } from './config';

const BASE = API_URLS.AUTH_BACKEND;
const authApi = axios.create({ baseURL: `${BASE}/api/auth`, timeout: 15000 });
const adminApi = axios.create({ baseURL: `${BASE}/api/admin`, timeout: 15000 });
>>>>>>> Stashed changes

// Attach JWT to every request
const addToken = (config) => {
    const token = localStorage.getItem('eduguide_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};
authApi.interceptors.request.use(addToken);
adminApi.interceptors.request.use(addToken);

// Auth endpoints
export const register = (data) => authApi.post('/register', data).then(r => r.data);
export const login    = (data) => authApi.post('/login', data).then(r => r.data);
export const googleAuth = (credential) => authApi.post('/google', { credential }).then(r => r.data);
export const getMe    = () => authApi.get('/me').then(r => r.data);

// Admin endpoints
export const adminGetUsers = () => adminApi.get('/users').then(r => r.data);
export const adminGetStats = () => adminApi.get('/stats').then(r => r.data);
export const adminDeleteUser = (id) => adminApi.delete(`/users/${id}`).then(r => r.data);
export const adminUpdateRole = (id, role) => adminApi.patch(`/users/${id}/role`, { role }).then(r => r.data);
