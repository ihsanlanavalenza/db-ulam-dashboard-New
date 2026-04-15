// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const normalizeHeaders = (headers) => {
  const out = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const buildUrl = (path, params) => {
  const base = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
};

const parseBody = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const createHttpError = (response, data) => {
  const message = (data && data.message) || `Request failed with status ${response.status}`;
  const error = new Error(message);
  error.response = {
    status: response.status,
    data,
    headers: normalizeHeaders(response.headers),
  };
  return error;
};

const request = async (method, path, config = {}) => {
  const { params, data, headers = {} } = config;
  const token = localStorage.getItem('accessToken');
  const requestHeaders = { ...headers };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const hasBody = data !== undefined && data !== null && method !== 'GET';
  if (hasBody && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(data) : undefined,
  });

  const parsed = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthAndRedirect();
    }
    throw createHttpError(response, parsed);
  }

  return {
    data: parsed,
    status: response.status,
    headers: normalizeHeaders(response.headers),
  };
};

const api = {
  get: (path, config = {}) => request('GET', path, config),
  post: (path, data, config = {}) => request('POST', path, { ...config, data }),
  put: (path, data, config = {}) => request('PUT', path, { ...config, data }),
  patch: (path, data, config = {}) => request('PATCH', path, { ...config, data }),
  delete: (path, config = {}) => request('DELETE', path, config),
};

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verify: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
};

// User Management APIs
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/all/read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Data APIs
export const dataAPI = {
  getFilters: () => api.get('/filters'),
  getSummary: (params) => api.get('/summary', { params }),
  getSummaryLending: (params) => api.get('/summary-lending', { params }),
  getSummaryWO: (params) => api.get('/summary-wo', { params }),
  getProductivityGrafik: (params) => api.get('/grafik-productivity', { params }),
  getTrenPortofolioGrafik: (params) => api.get('/grafik-tren-portofolio', { params }),
  getPortofolioGrafik: (params) => api.get('/grafik-portofolio', { params }),
  getTrenQualityGrafik: (params) => api.get('/grafik-tren-quality', { params }),
  getGrowthSummary: (params) => api.get('/growth-summary', { params }),
  getGrafikJam: (params) => api.get('/grafik-jam', { params }),
  getGrafikProduct: (params) => api.get('/grafik-product', { params }),
  getGrafikWriteoff: (params) => api.get('/grafik-writeoff', { params }),
  getBranchLocations: (params) => api.get('/branch-locations', { params }),
  getDataForExport: (tableName, params) => api.get(`/export/${tableName}`, { params }),
};

// Data Management APIs
export const dataManagementAPI = {
  getTransactions: (params) => api.get('/data-management/transactions', { params }),
  createTransaction: (data) => api.post('/data-management/transactions', data),
  deleteTransaction: (id) => api.delete(`/data-management/transactions/${id}`),
};

export default api;
