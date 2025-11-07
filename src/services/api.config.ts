/**
 * API Configuration
 * Centralized configuration for API base URL and all route endpoints
 */

// Base API URL - Change this to your backend URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Log the API base URL on module load for debugging
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment Variable VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'Not set (using default)');

/**
 * API Route Constants
 * All API endpoints are defined here for easy maintenance
 */
export const API_ROUTES = {
  // Authentication Routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    REFRESH_TOKEN: '/refresh-token',
    VERIFY_EMAIL: '/verify-email',
  },

  // User Routes
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    USERS: '/users',
    USER_BY_ID: (id: string | number) => `/users/${id}`,
  },

  // Hostel Routes
  HOSTEL: {
    LIST: '/hostels',
    CREATE: '/hostels',
    BY_ID: (id: string | number) => `/hostels/${id}`,
    UPDATE: (id: string | number) => `/hostels/${id}`,
    DELETE: (id: string | number) => `/hostels/${id}`,
    SEARCH: '/hostels/search',
    BY_CITY: '/hostels/city',
    ARCHITECTURE: (id: string | number) => `/hostels/${id}/architecture`,
  },

  // Tenant Routes
  TENANT: {
    LIST: '/tenants',
    CREATE: '/tenants',
    BY_ID: (id: string | number) => `/tenants/${id}`,
    UPDATE: (id: string | number) => `/tenants/${id}`,
    DELETE: (id: string | number) => `/tenants/${id}`,
    SEARCH: '/tenants/search',
    BY_HOSTEL: (hostelId: string | number) => `/tenants/hostel/${hostelId}`,
  },

  // Employee Routes
  EMPLOYEE: {
    LIST: '/employees',
    CREATE: '/employees',
    BY_ID: (id: string | number) => `/employees/${id}`,
    UPDATE: (id: string | number) => `/employees/${id}`,
    DELETE: (id: string | number) => `/employees/${id}`,
    SEARCH: '/employees/search',
    BY_HOSTEL: (hostelId: string | number) => `/employees/hostel/${hostelId}`,
  },

  // Account/Transaction Routes
  ACCOUNT: {
    TRANSACTIONS: '/transactions',
    CREATE: '/transactions',
    BY_ID: (id: string | number) => `/transactions/${id}`,
    UPDATE: (id: string | number) => `/transactions/${id}`,
    DELETE: (id: string | number) => `/transactions/${id}`,
    SUMMARY: '/transactions/summary',
    BY_HOSTEL: (hostelId: string | number) => `/transactions/hostel/${hostelId}`,
  },

  // Vendor Routes
  VENDOR: {
    LIST: '/vendors',
    CREATE: '/vendors',
    BY_ID: (id: string | number) => `/vendors/${id}`,
    UPDATE: (id: string | number) => `/vendors/${id}`,
    DELETE: (id: string | number) => `/vendors/${id}`,
    SEARCH: '/vendors/search',
  },

  // Alert Routes
  ALERT: {
    LIST: '/alerts',
    CREATE: '/alerts',
    BY_ID: (id: string | number) => `/alerts/${id}`,
    UPDATE: (id: string | number) => `/alerts/${id}`,
    DELETE: (id: string | number) => `/alerts/${id}`,
    MARK_READ: (id: string | number) => `/alerts/${id}/read`,
  },

  // Communication Routes
  COMMUNICATION: {
    MESSAGES: '/messages',
    SEND: '/messages/send',
    BY_ID: (id: string | number) => `/messages/${id}`,
    BY_TARGET: (target: string) => `/messages/target/${target}`,
  },

  // Finance Routes
  FINANCE: {
    MONTHLY: '/finance/monthly',
    YEARLY: '/finance/yearly',
    DASHBOARD: '/finance/dashboard',
  },

  // Settings Routes
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },
} as const;

/**
 * Helper function to build full API URL
 * @param route - API route path
 * @returns Full API URL
 */
export const buildApiUrl = (route: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${API_BASE_URL}${cleanRoute}`;
};

