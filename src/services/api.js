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
    const expiresAt = localStorage.getItem(GUEST_ID_EXPIRES_KEY);
    const expired = !expiresAt || new Date(expiresAt) <= new Date();
    if (guestId && !expired) {
      config.headers['X-Guest-Id'] = guestId;
      config.headers['X-Guest-Id-Expires-At'] = expiresAt;
    } else {
      localStorage.removeItem(GUEST_ID_KEY);
      localStorage.removeItem(GUEST_ID_EXPIRES_KEY);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      const newId = response.headers['x-guest-id'];
      const newExp = response.headers['x-guest-id-expires-at'];
      if (newId) {
        const oldExp = localStorage.getItem(GUEST_ID_EXPIRES_KEY);
        if (!oldExp || new Date(newExp) > new Date(oldExp)) {
          localStorage.setItem(GUEST_ID_KEY, newId);
          localStorage.setItem(GUEST_ID_EXPIRES_KEY, newExp);
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response && typeof window !== 'undefined') {
      const newId = error.response.headers?.['x-guest-id'];
      const newExp = error.response.headers?.['x-guest-id-expires-at'];
      if (newId) {
        const oldExp = localStorage.getItem(GUEST_ID_EXPIRES_KEY);
        if (!oldExp || new Date(newExp) > new Date(oldExp)) {
          localStorage.setItem(GUEST_ID_KEY, newId);
          localStorage.setItem(GUEST_ID_EXPIRES_KEY, newExp);
        }
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
