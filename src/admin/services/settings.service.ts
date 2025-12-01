/**
 * Settings Service
 * API calls for settings management
 */

import { api } from '../../services/apiClient';

// Types based on API response
export interface PersonalInfoResponse {
  success: boolean;
  data: {
    id: number;
    username: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    jobTitle: string | null;
  };
  message: string;
  statusCode: number;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data: {
    id: number;
    username: string;
    email: string;
    phone: string;
    status: string;
    isAdmin: boolean;
    userRoleId: number;
    createdAt: string;
    updatedAt: string;
    userRole: {
      id: number;
      roleName: string;
      description: string;
    };
    profile: {
      type: string;
      name: string;
      profilePhoto: string;
      address: {
        state: string;
        city: string;
      };
    };
  };
  message: string;
  statusCode: number;
}

export interface ProfileUpdateRequest {
  username?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  profilePhoto?: File | string;
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  data: null;
  message: string;
  statusCode: number;
}

/**
 * Get personal information of logged-in user
 */
export const getPersonalInfo = async (): Promise<PersonalInfoResponse['data']> => {
  try {
    const response = await api.get<PersonalInfoResponse>('/admin/settings/profile/personal-info');
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to fetch personal information');
  } catch (error: any) {
    console.error('Error fetching personal info:', error);
    throw error;
  }
};

/**
 * Update personal information of logged-in user
 */
export const updateProfileInfo = async (
  data: ProfileUpdateRequest
): Promise<ProfileUpdateResponse['data']> => {
  try {
    // If profilePhoto is a File, we need to use FormData
    const formData = new FormData();
    
    // Add text fields
    if (data.username) formData.append('username', data.username);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.firstName) formData.append('firstName', data.firstName);
    if (data.lastName) formData.append('lastName', data.lastName);
    if (data.company) formData.append('company', data.company);
    if (data.jobTitle) formData.append('jobTitle', data.jobTitle);
    
    // Handle profile photo
    if (data.profilePhoto) {
      if (data.profilePhoto instanceof File) {
        formData.append('profilePhoto', data.profilePhoto);
      } else if (typeof data.profilePhoto === 'string') {
        formData.append('profilePhoto', data.profilePhoto);
      }
    }
    
    // Handle address
    if (data.address) {
      if (data.address.street1) formData.append('address[street1]', data.address.street1);
      if (data.address.street2) formData.append('address[street2]', data.address.street2);
      if (data.address.city) formData.append('address[city]', data.address.city);
      if (data.address.state) formData.append('address[state]', data.address.state);
      if (data.address.zipCode) formData.append('address[zipCode]', data.address.zipCode);
      if (data.address.country) formData.append('address[country]', data.address.country);
    }
    
    // Use PUT request with FormData
    const response = await api.put<ProfileUpdateResponse>(
      '/admin/settings/profile-info',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to update profile information');
  } catch (error: any) {
    console.error('Error updating profile info:', error);
    throw error;
  }
};

/**
 * Change password of logged-in user
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  try {
    console.log('🔐 [CHANGE PASSWORD] Calling endpoint: /admin/settings/profile/password');
    console.log('🔐 [CHANGE PASSWORD] Using method: PUT');
    console.log('📦 [CHANGE PASSWORD] Request data:', {
      currentPassword: '***',
      newPassword: '***',
      confirmPassword: '***',
    });
    
    const response = await api.put<ChangePasswordResponse>(
      '/admin/settings/profile/password',
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }
    );
    
    console.log('✅ [CHANGE PASSWORD] Response received:', response);
    
    if (response && response.success) {
      return response;
    }
    throw new Error(response?.message || 'Failed to change password');
  } catch (error: any) {
    console.error('❌ [CHANGE PASSWORD] Error:', error);
    console.error('❌ [CHANGE PASSWORD] Error status:', error?.statusCode || error?.response?.status);
    console.error('❌ [CHANGE PASSWORD] Error message:', error?.message);
    console.error('❌ [CHANGE PASSWORD] Full error:', error);
    
    // Provide more user-friendly error messages
    if (error?.statusCode === 404 || error?.response?.status === 404) {
      throw new Error('Password change endpoint not found. Please contact support.');
    } else if (error?.statusCode === 400 || error?.response?.status === 400) {
      throw new Error(error?.message || 'Invalid password. Please check your current password and try again.');
    } else if (error?.statusCode === 401 || error?.response?.status === 401) {
      throw new Error('Current password is incorrect. Please try again.');
    } else {
      throw new Error(error?.message || 'Failed to change password. Please try again.');
    }
  }
};

