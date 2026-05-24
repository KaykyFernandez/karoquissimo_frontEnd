import axios from 'axios';

// Retrieve API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory token storage for maximum security and compliance with the plan
let activeToken: string | null = null;

/**
 * Updates the active API token in-memory to be automatically injected
 * in the Authorization header of all subsequent requests.
 */
export const setApiToken = (token: string | null) => {
  activeToken = token;
};

// Interceptor to inject Authorization header on all requests
api.interceptors.request.use(
  (config) => {
    if (activeToken) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
