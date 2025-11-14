import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ammo-cost-log-backend.onrender.com/api'
  : '/api';

const GUEST_ID_KEY = 'guest_id';
const GUEST_ID_EXPIRES_KEY = 'guest_id_expires_at';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const guestId = localStorage.getItem(GUEST_ID_KEY);
    const guestIdExpiresAt = localStorage.getItem(GUEST_ID_EXPIRES_KEY);
    if (guestId && !config.headers['X-Guest-Id']) {
      config.headers['X-Guest-Id'] = guestId;
    }
    if (guestIdExpiresAt && !config.headers['X-Guest-Id-Expires-At']) {
      config.headers['X-Guest-Id-Expires-At'] = guestIdExpiresAt;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      const guestId = response.headers['x-guest-id'];
      const guestIdExpiresAt = response.headers['x-guest-id-expires-at'];
      if (guestId) {
        localStorage.setItem(GUEST_ID_KEY, guestId);
      }
      if (guestIdExpiresAt) {
        localStorage.setItem(GUEST_ID_EXPIRES_KEY, guestIdExpiresAt);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && typeof window !== 'undefined') {
      const guestId = error.response.headers?.['x-guest-id'];
      const guestIdExpiresAt = error.response.headers?.['x-guest-id-expires-at'];
      if (guestId) {
        localStorage.setItem(GUEST_ID_KEY, guestId);
      }
      if (guestIdExpiresAt) {
        localStorage.setItem(GUEST_ID_EXPIRES_KEY, guestIdExpiresAt);
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
