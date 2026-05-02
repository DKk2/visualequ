/**
 * API client configuration
 * Sets up Axios instances for Node.js (auth/graphs) and Django (math) backends
 * Handles JWT token injection and error responses
 */

import axios from 'axios';

const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';

// Node.js API client (Auth & Graphs)
const nodeApi = axios.create({
  baseURL: `${NODE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Django API client (Math Engine)
const djangoApi = axios.create({
  baseURL: `${DJANGO_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

nodeApi.interceptors.request.use(addAuthToken);
djangoApi.interceptors.request.use(addAuthToken);

// Response interceptor for error handling
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

nodeApi.interceptors.response.use(response => response, handleResponseError);
djangoApi.interceptors.response.use(response => response, handleResponseError);

export const authAPI = {
  register: (data) => nodeApi.post('/auth/register', data),
  login: (data) => nodeApi.post('/auth/login', data),
};

export const graphAPI = {
  save: (data) => nodeApi.post('/graphs', data),
  getAll: () => nodeApi.get('/graphs'),
  getOne: (id) => nodeApi.get(`/graphs/${id}`),
  delete: (id) => nodeApi.delete(`/graphs/${id}`),
};

export const mathAPI = {
  evaluate: (data) => djangoApi.post('/math/evaluate/', data),
};
