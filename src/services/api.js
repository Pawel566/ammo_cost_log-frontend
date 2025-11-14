import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ammo-cost-log-backend.onrender.com/api'
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

const GUEST_ID_KEY = "guest_id";
const GUEST_EXPIRES_KEY = "guest_id_expires_at";

function isGuestExpired() {
  const expiresAt = localStorage.getItem(GUEST_EXPIRES_KEY);
  if (!expiresAt) return true;
  const now = new Date();
  const exp = new Date(expiresAt);
  return exp < now;
}

api.interceptors.request.use((config) => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  let guestExpires = localStorage.getItem(GUEST_EXPIRES_KEY);
  if (!guestId || !guestExpires || isGuestExpired()) {
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GUEST_EXPIRES_KEY);
    guestId = null;
    guestExpires = null;
  }
  if (guestId) config.headers["X-Guest-Id"] = guestId;
  if (guestExpires) config.headers["X-Guest-Id-Expires-At"] = guestExpires;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => {
  const guestId = response.headers["x-guest-id"];
  const guestExpires = response.headers["x-guest-id-expires-at"];
  if (guestId) {
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  if (guestExpires) {
    localStorage.setItem(GUEST_EXPIRES_KEY, guestExpires);
  }
  return response;
}, (error) => Promise.reject(error));

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
