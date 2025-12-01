/**
 * Custom API Client
 * Modular API client using axios with interceptors for authentication and error handling
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from './api.config';
import { getToken, clearAuthData } from './auth.storage';

/**
 * API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Custom API Error
 */
export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Create axios instance with default config
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor - Add auth token to requests
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request for debugging
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        data: config.data,
        headers: config.headers,
      });
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Handle errors globally
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
      return response;
    },
    (error: AxiosError) => {
      // Log error for debugging
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
      // Handle 401 Unauthorized - Clear auth and redirect to login
      // But exclude login/register endpoints (they may return 401 for invalid credentials)
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url || '';
        const isAuthEndpoint = requestUrl.includes('/login') || 
                              requestUrl.includes('/register') || 
                              requestUrl.includes('/forgot-password') ||
                              requestUrl.includes('/reset-password');
        
        // Only clear auth and redirect if it's not an auth endpoint
        // Auth endpoints handle their own 401 errors
        if (!isAuthEndpoint) {
          clearAuthData();
          // Redirect to login page only if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }

      // Handle network errors
      if (!error.response) {
        throw new ApiError(
          'Network error. Please check your internet connection.',
          0
        );
      }

      // Handle API errors
      const apiError = error.response.data as ApiResponse;
      throw new ApiError(
        apiError?.message || error.message || 'An error occurred',
        error.response.status,
        apiError
      );
    }
  );

  return client;
};

// Create the API client instance
const apiClient = createApiClient();

/**
 * Custom API Methods
 */
export const api = {
  /**
   * GET request
   * @param url - API endpoint
   * @param config - Axios request config
   * @returns Promise with API response
   */
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST request
   * @param url - API endpoint
   * @param data - Request body data
   * @param config - Axios request config
   * @returns Promise with API response
   */
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      
      const response = await apiClient.post<ApiResponse<T>>(url, data, config);
      
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [API CLIENT] POST request failed');
      throw error;
    }
  },

  /**
   * PUT request
   * @param url - API endpoint
   * @param data - Request body data
   * @param config - Axios request config
   * @returns Promise with API response
   */
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - Request body data
   * @param config - Axios request config
   * @returns Promise with API response
   */
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE request
   * @param url - API endpoint
   * @param config - Axios request config
   * @returns Promise with API response
   */
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;

