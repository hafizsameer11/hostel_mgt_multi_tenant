/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import api from './apiClient';
import { API_ROUTES } from './api.config';
import { setToken, setUserData, clearAuthData } from './auth.storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Login user
 * @param credentials - Login credentials
 * @returns User data with token
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  console.log('🔐 [AUTH SERVICE] Starting login process...');
  console.log('📧 [AUTH SERVICE] Email:', credentials.email);
  console.log('📡 [AUTH SERVICE] API Endpoint:', API_ROUTES.AUTH.LOGIN);
  console.log('📦 [AUTH SERVICE] Request payload:', { email: credentials.email, password: '***' });
  
  try {
    // Make the actual API call
    console.log('⏳ [AUTH SERVICE] Making API POST request...');
    const response = await api.post<LoginResponse>(
      API_ROUTES.AUTH.LOGIN,
      credentials
    );

    console.log('📥 [AUTH SERVICE] Raw API Response received:', response);
    console.log('📊 [AUTH SERVICE] Response success:', response.success);
    console.log('📊 [AUTH SERVICE] Response data:', response.data ? 'Present' : 'Missing');

    // Validate response structure
    if (!response) {
      throw new Error('No response received from server');
    }

    if (!response.success) {
      throw new Error(response.message || 'Login failed. Invalid credentials.');
    }

    if (!response.data) {
      throw new Error('Invalid response: No user data received');
    }

    if (!response.data.token) {
      throw new Error('Invalid response: No authentication token received');
    }

    // Store token and user data
    console.log('💾 [AUTH SERVICE] Storing token and user data...');
    setToken(response.data.token);
    setUserData(response.data);
    
    console.log('✅ [AUTH SERVICE] Login successful! Token and user data stored.');
    return response.data;
  } catch (error: any) {
    console.error('❌ [AUTH SERVICE] Login error caught:', error);
    console.error('❌ [AUTH SERVICE] Error type:', error.constructor.name);
    console.error('❌ [AUTH SERVICE] Error message:', error.message);
    console.error('❌ [AUTH SERVICE] Error details:', {
      statusCode: error.statusCode,
      response: error.response,
      request: error.request,
    });
    
    // Re-throw the error so the Login component can handle it
    throw error;
  }
};

/**
 * Register new user
 * @param userData - Registration data
 * @returns User data with token
 */
export const register = async (userData: RegisterRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(
      API_ROUTES.AUTH.REGISTER,
      userData
    );

    if (response.success && response.data) {
      // Store token and user data
      setToken(response.data.token);
      setUserData(response.data);
      
      return response.data;
    }

    throw new Error(response.message || 'Registration failed');
  } catch (error: any) {
    throw error;
  }
};

/**
 * Logout user
 * @returns Success message
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post(API_ROUTES.AUTH.LOGOUT);
  } catch (error) {
    // Even if API call fails, clear local storage
    console.error('Logout API error:', error);
  } finally {
    // Always clear local storage
    clearAuthData();
  }
};

/**
 * Request password reset
 * @param email - User email
 * @returns Success message
 */
export const forgotPassword = async (email: ForgotPasswordRequest): Promise<string> => {
  try {
    const response = await api.post(API_ROUTES.AUTH.FORGOT_PASSWORD, email);
    return response.message || 'Password reset email sent';
  } catch (error: any) {
    throw error;
  }
};

/**
 * Reset password with token
 * @param resetData - Reset password data
 * @returns Success message
 */
export const resetPassword = async (resetData: ResetPasswordRequest): Promise<string> => {
  try {
    const response = await api.post(API_ROUTES.AUTH.RESET_PASSWORD, resetData);
    return response.message || 'Password reset successful';
  } catch (error: any) {
    throw error;
  }
};

/**
 * Refresh authentication token
 * @returns New token
 */
export const refreshToken = async (): Promise<string> => {
  try {
    const response = await api.post<{ token: string }>(API_ROUTES.AUTH.REFRESH_TOKEN);
    
    if (response.success && response.data?.token) {
      setToken(response.data.token);
      return response.data.token;
    }

    throw new Error(response.message || 'Token refresh failed');
  } catch (error: any) {
    throw error;
  }
};

/**
 * Verify email with token
 * @param token - Verification token
 * @returns Success message
 */
export const verifyEmail = async (token: string): Promise<string> => {
  try {
    const response = await api.post(API_ROUTES.AUTH.VERIFY_EMAIL, { token });
    return response.message || 'Email verified successfully';
  } catch (error: any) {
    throw error;
  }
};

