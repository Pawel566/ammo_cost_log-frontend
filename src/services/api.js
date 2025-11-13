import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ammo-cost-log-backend.onrender.com/api'  // zastąp rzeczywistym URL
  : '/api';

const GUEST_SESSION_KEY = 'guest_session_id';
const GUEST_SESSION_EXPIRES_KEY = 'guest_session_expires_at';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const guestSession = localStorage.getItem(GUEST_SESSION_KEY);
    if (guestSession && !config.headers['X-Guest-Session']) {
      config.headers['X-Guest-Session'] = guestSession;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      const guestSession = response.headers['x-guest-session'];
      const guestSessionExpires = response.headers['x-guest-session-expires-at'];
      if (guestSession) {
        localStorage.setItem(GUEST_SESSION_KEY, guestSession);
      }
      if (guestSessionExpires) {
        localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, guestSessionExpires);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && typeof window !== 'undefined') {
      const guestSession = error.response.headers?.['x-guest-session'];
      const guestSessionExpires = error.response.headers?.['x-guest-session-expires-at'];
      if (guestSession) {
        localStorage.setItem(GUEST_SESSION_KEY, guestSession);
      }
      if (guestSessionExpires) {
        localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, guestSessionExpires);
      }
    }
    return Promise.reject(error);
  }
);

// Guns API
export const gunsAPI = {
  getAll: () => api.get('/guns'),
  create: (gunData) => api.post('/guns', gunData),
  update: (id, gunData) => api.put(`/guns/${id}`, gunData),
  delete: (id) => api.delete(`/guns/${id}`),
};

// Ammo API
export const ammoAPI = {
  getAll: () => api.get('/ammo'),
  create: (ammoData) => api.post('/ammo', ammoData),
  delete: (id) => api.delete(`/ammo/${id}`),
  addQuantity: (id, amount) => api.post(`/ammo/${id}/add`, { amount })
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  createCost: (sessionData) => api.post('/sessions/cost', sessionData),
  createAccuracy: (sessionData) => api.post('/sessions/accuracy', sessionData),
  getSummary: () => api.get('/sessions/summary'),
};

export default api;
