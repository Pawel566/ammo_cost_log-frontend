import axios from 'axios';

// Vite uses import.meta.env for environment variables
// VITE_API_BASE_URL should be set in .env or .env.local
// In development, use relative URL '/api' to leverage Vite proxy (configured in vite.config.js)
// In production, use full URL
// If VITE_API_BASE_URL is explicitly set, use it (allows override for testing)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://ammo-cost-log-backend.onrender.com/api'
    : '/api');

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
  // Always get fresh token from localStorage (don't rely on api.defaults.headers)
  const accessToken = localStorage.getItem('access_token');
  const hasValidToken = accessToken && accessToken.trim().length > 0;
  
  if (hasValidToken) {
    config.headers["Authorization"] = `Bearer ${accessToken.trim()}`;
    // Remove guest headers if we have a valid token
    delete config.headers["X-Guest-Id"];
    delete config.headers["X-Guest-Id-Expires-At"];
  } else {
    // No valid token - use guest mode
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    let guestExpires = localStorage.getItem(GUEST_EXPIRES_KEY);
    if (!guestId || !guestExpires || isGuestExpired()) {
      localStorage.removeItem(GUEST_ID_KEY);
      localStorage.removeItem(GUEST_EXPIRES_KEY);
      guestId = null;
      guestExpires = null;
    }
    // Remove auth header if no valid token
    delete config.headers["Authorization"];
    if (guestId) config.headers["X-Guest-Id"] = guestId;
    if (guestExpires) config.headers["X-Guest-Id-Expires-At"] = guestExpires;
  }
  
  // Debug logging (only in development)
  if (import.meta.env.MODE === 'development') {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasAuth: !!config.headers["Authorization"],
      hasGuestId: !!config.headers["X-Guest-Id"]
    });
  }
  
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    const guestId = response.headers["x-guest-id"];
    const guestExpires = response.headers["x-guest-id-expires-at"];
    if (guestId) {
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    if (guestExpires) {
      localStorage.setItem(GUEST_EXPIRES_KEY, guestExpires);
    }
  }
  return response;
}, (error) => {
  // Log errors for debugging
  if (error.response) {
    console.error('API Error Response:', {
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      method: error.config?.method?.toUpperCase(),
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    });
    
    // For 500 errors, log more details
    if (error.response.status === 500) {
      console.error('500 Internal Server Error Details:', {
        requestUrl: `${error.config?.baseURL}${error.config?.url}`,
        requestMethod: error.config?.method?.toUpperCase(),
        requestHeaders: error.config?.headers,
        responseData: error.response.data,
        errorMessage: error.message
      });
    }
  } else if (error.request) {
    console.error('API Request Error (No Response):', {
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      method: error.config?.method?.toUpperCase(),
      message: 'No response received from server',
      request: error.request
    });
  } else {
    console.error('API Error (Setup):', {
      message: error.message,
      config: error.config
    });
  }
  return Promise.reject(error);
});

// Guns API
export const gunsAPI = {
  getAll: () => api.get('/guns'),
  create: (gunData) => api.post('/guns', gunData),
  update: (id, gunData) => api.put(`/guns/${id}`, gunData),
  delete: (id) => api.delete(`/guns/${id}`),
  uploadImage: (id, formData) => api.post(`/guns/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getImage: (id) => api.get(`/guns/${id}/image`),
  deleteImage: (id) => api.delete(`/guns/${id}/image`),
};

// Ammo API
export const ammoAPI = {
  getAll: () => api.get('/ammo'),
  create: (ammoData) => api.post('/ammo', ammoData),
  update: (id, ammoData) => api.put(`/ammo/${id}`, ammoData),
  delete: (id) => api.delete(`/ammo/${id}`),
  addQuantity: (id, amount) => api.post(`/ammo/${id}/add`, { amount })
};

// Sessions API - deprecated, use shootingSessionsAPI instead
export const sessionsAPI = {
  getAll: (params) => api.get('/shooting-sessions', { params }),
  createSession: (sessionData) => api.post('/shooting-sessions', sessionData),
  getSummary: () => api.get('/shooting-sessions/summary'),
  update: (id, sessionData) => api.patch(`/shooting-sessions/${id}`, sessionData),
  delete: (id) => api.delete(`/shooting-sessions/${id}`),
  getById: (id) => api.get(`/shooting-sessions/${id}`),
};

        // Shooting Sessions API
        export const shootingSessionsAPI = {
          getAll: (params) => api.get('/shooting-sessions', { params }),
          getById: (id) => api.get(`/shooting-sessions/${id}`),
          create: (sessionData) => api.post('/shooting-sessions', sessionData),
          update: (id, sessionData) => api.patch(`/shooting-sessions/${id}`, sessionData),
          delete: (id) => api.delete(`/shooting-sessions/${id}`),
          getSummary: () => api.get('/shooting-sessions/summary'),
          generateAIComment: (id) => api.post(`/shooting-sessions/${id}/generate-ai-comment`),
          uploadTargetImage: (id, formData) => api.post(`/shooting-sessions/${id}/target-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }),
          getTargetImage: (id) => api.get(`/shooting-sessions/${id}/target-image`),
          deleteTargetImage: (id) => api.delete(`/shooting-sessions/${id}/target-image`),
        };


// Attachments API
export const attachmentsAPI = {
  getForGun: (gunId) => api.get(`/guns/${gunId}/attachments`),
  getById: (attachmentId) => api.get(`/attachments/${attachmentId}`),
  create: (gunId, data) => api.post(`/guns/${gunId}/attachments`, data),
  delete: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getForGun: (gunId) => api.get(`/maintenance/guns/${gunId}/maintenance`),
  getStatistics: () => api.get('/maintenance/statistics'),
  create: (gunId, data) => api.post(`/maintenance/guns/${gunId}/maintenance`, data),
  update: (maintenanceId, data) => api.put(`/maintenance/maintenance/${maintenanceId}`, data),
  delete: (maintenanceId) => api.delete(`/maintenance/maintenance/${maintenanceId}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Account API
export const accountAPI = {
  getSkillLevel: () => api.get('/account/skill-level'),
  updateSkillLevel: (skillLevel) => api.post('/account/skill-level', { skill_level: skillLevel }),
  changePassword: (oldPassword, newPassword) => api.post('/account/change-password', { old_password: oldPassword, new_password: newPassword }),
  changeEmail: (newEmail) => api.post('/account/change-email', { new_email: newEmail }),
  deleteAccount: (password) => api.request({
    method: 'DELETE',
    url: '/account',
    data: { password }
  }),
  getRank: () => api.get('/account/rank'),
};

// Auth API
export const authAPI = {
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { 
    token: token, 
    password 
  }),
};

// Currency Rates API
export const currencyRatesAPI = {
  getLatest: () => api.get('/currency-rates/latest'),
  getLatestByCode: (code) => api.get(`/currency-rates/latest/${code}`),
  convert: (amount, fromCurrency, toCurrency) => api.post('/currency-rates/convert', {
    amount,
    from_currency: fromCurrency,
    to_currency: toCurrency
  }),
  getRate: (currency) => api.get(`/currency-rates/rate/${currency}`),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
