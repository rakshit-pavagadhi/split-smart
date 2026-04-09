import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Groups API
export const groupsAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  join: (data) => api.post('/groups/join', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  getMembers: (id) => api.get(`/groups/${id}/members`),
};

// Expenses API
export const expensesAPI = {
  add: (groupId, data) => api.post(`/groups/${groupId}/expenses`, data),
  getAll: (groupId, params) => api.get(`/groups/${groupId}/expenses`, { params }),
  update: (groupId, eid, data) => api.put(`/groups/${groupId}/expenses/${eid}`, data),
  delete: (groupId, eid) => api.delete(`/groups/${groupId}/expenses/${eid}`),
};

// Balances API
export const balancesAPI = {
  getSummary: (groupId) => api.get(`/groups/${groupId}/balances/summary`),
  getPairwise: (groupId) => api.get(`/groups/${groupId}/balances/pairwise`),
  getGraph: (groupId) => api.get(`/groups/${groupId}/balances/graph`),
};

// Settlements API
export const settlementsAPI = {
  getSuggestions: (groupId) => api.get(`/groups/${groupId}/settlements/suggestions`),
  create: (groupId, data) => api.post(`/groups/${groupId}/settlements`, data),
  getAll: (groupId) => api.get(`/groups/${groupId}/settlements`),
  updateStatus: (groupId, sid, data) => api.put(`/groups/${groupId}/settlements/${sid}`, data),
};

// Analytics API
export const analyticsAPI = {
  getCategory: (groupId) => api.get(`/groups/${groupId}/analytics/category`),
  getMonthly: (groupId) => api.get(`/groups/${groupId}/analytics/monthly`),
  getMembers: (groupId) => api.get(`/groups/${groupId}/analytics/members`),
  exportCSV: (groupId) => api.get(`/groups/${groupId}/export/csv`, { responseType: 'blob' }),
};

// Payments API
export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

// Receipt API
export const receiptAPI = {
  scan: (formData) => api.post('/receipts/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;
