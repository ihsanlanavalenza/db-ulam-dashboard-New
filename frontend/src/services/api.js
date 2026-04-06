// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
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
