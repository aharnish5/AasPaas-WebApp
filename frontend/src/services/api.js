import axios from 'axios';

// Prefer same-origin '/api' by default so Docker/Render single-service works without extra config.
// Allow override via VITE_API_URL for local dev or split deployments.
const API_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
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

// Response interceptor - handle token refresh and auto-refresh user state after auth mutations
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        if (window.location.pathname.startsWith('/customer') || window.location.pathname.startsWith('/vendor')) {
          window.location.href = '/login/customer';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Optional: attach Redux store to auto-refresh user after successful auth mutations
let _store = null;
export const attachStore = (store) => {
  _store = store;
}

// Intercept successful responses to refresh user after profile/email/password changes
api.interceptors.response.use((response) => {
  try {
    if (!_store) return response;
    const url = response.config?.url || '';
    const method = (response.config?.method || 'get').toLowerCase();
    const isAuthMutation = method === 'patch' && (
      url.includes('/auth/profile') || url.includes('/auth/change-password') || url.includes('/auth/change-email')
    );
    if (isAuthMutation) {
      const { getMe } = require('../store/slices/authSlice');
      _store.dispatch(getMe());
    }
  } catch (_) { /* noop */ }
  return response;
});

export default api;

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// Shop API
export const shopAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/shops/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getOcrResult: (uploadId) => api.get(`/shops/ocr-result?uploadId=${uploadId}`),
  createShop: (data) => api.post('/shops', data),
  inferFromImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/shops/infer-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getShops: (params) => api.get('/shops', { params }),
  getShopById: (shopId, params) => api.get(`/shops/${shopId}`, { params }),
  updateShop: (shopId, data) => api.patch(`/shops/${shopId}`, data),
  deleteShop: (shopId) => api.delete(`/shops/${shopId}`),
  addShopImage: (shopId, file, caption) => {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    return api.post(`/shops/${shopId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  trackView: (shopId) => api.post(`/shops/${shopId}/track-view`),
  geocode: (address) => api.get('/shops/geocode', { params: { address } }),
  reverseGeocode: (lat, lon) => api.get('/shops/reverse-geocode', { params: { lat, lon } }),
  suggestPlaces: (q, limit = 5, sessionToken, lat, lon) => api.get('/shops/places', { params: { q, limit, sessionToken, lat, lon } }),
  placeDetails: (placeId, sessionToken) => api.get('/shops/places/details', { params: { placeId, sessionToken } }),
  // Advanced authoritative city + radius search
  // Advanced granular tokenized search with radius
  searchAdvanced: (body) => api.post('/shops/search', body),
};

// Review API
export const reviewAPI = {
  createReview: (shopId, data, images) => {
    const formData = new FormData();
    formData.append('rating', data.rating);
    if (data.text) formData.append('text', data.text);
    if (images) {
      images.forEach((img) => formData.append('images', img));
    }
    return api.post(`/shops/${shopId}/reviews`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getShopReviews: (shopId, params) => api.get(`/shops/${shopId}/reviews`, { params }),
  updateReview: (shopId, reviewId, data) => api.patch(`/shops/${shopId}/reviews/${reviewId}`, data),
  deleteReview: (shopId, reviewId) => api.delete(`/shops/${shopId}/reviews/${reviewId}`),
  markHelpful: (shopId, reviewId) => api.post(`/shops/${shopId}/reviews/${reviewId}/helpful`),
  vendorShopReviews: (shopId, vendorId, params) => api.get(`/shops/${shopId}/vendor/${vendorId}/reviews`, { params }),
  vendorShopAnalytics: (shopId, vendorId) => api.get(`/shops/${shopId}/vendor/${vendorId}/reviews/analytics`),
};

// Analytics API
export const analyticsAPI = {
  getVendorAnalytics: (vendorId, params) => api.get(`/vendors/${vendorId}/analytics`, { params }),
};

// Favorites API
export const favoritesAPI = {
  add: (shopId) => api.post(`/shops/${shopId}/favorite`),
  remove: (shopId) => api.delete(`/shops/${shopId}/favorite`),
  isFavorited: (shopId) => api.get(`/shops/${shopId}/favorite`),
  myFavorites: () => api.get(`/favorites`),
};

// Categories API
export const categoriesAPI = {
  list: (params) => api.get('/categories', { params }),
  tree: (includeCounts = true) => api.get('/categories', { params: { grouped: true, includeCounts } }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

