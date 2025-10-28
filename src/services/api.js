import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ammo-cost-log-backend.onrender.com/api'  // zastąp rzeczywistym URL
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
