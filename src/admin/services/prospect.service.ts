/**
 * Prospect Service
 * API calls for prospect management
 */

import { api } from '../../services/apiClient';
import { API_ROUTES } from '../../services/api.config';

// Types based on API response
export interface ProspectResponse {
  success: boolean;
  data: {
    prospect: {
      id: number;
      firstName: string;
      lastName: string;
      name: string;
      email: string;
      phone: string;
      gender: string;
      dateOfBirth: string;
      cnicNumber: string;
      status: string;
      profilePhoto: string | null;
      documents: Array<{
        field: string;
        url: string;
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        uploadedAt: string;
      }>;
      profession: string;
      professionDetails: string;
      professionDocuments: any[];
      createdAt: string;
      updatedAt: string;
    };
  };
  message: string;
  statusCode: number;
}

export interface ProspectListItem {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  cnicNumber: string;
  status: string;
  profilePhoto: string | null;
  profession: string;
  occupation?: string;
  createdAt: string;
}

/**
 * Get all prospects
 */
export const getAllProspects = async (): Promise<ProspectListItem[]> => {
  try {
    // For now, using a placeholder endpoint - update when backend is ready
    const response = await api.get<{
      success: boolean;
      data: {
        prospects: ProspectListItem[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      };
    }>('/admin/prospects');
    
    if (response && response.success && response.data && response.data.prospects) {
      return response.data.prospects;
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching prospects:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

/**
 * Get prospects by hostel ID (if prospects are linked to hostels)
 */
export const getProspectsByHostel = async (hostelId: number): Promise<ProspectListItem[]> => {
  try {
    const response = await api.get<{ 
      hostel: { id: number; name: string };
      prospects: ProspectListItem[];
      count: number;
    }>(`/admin/prospects/hostel/${hostelId}`);
    
    if (response && response.data && (response.data as any).prospects && Array.isArray((response.data as any).prospects)) {
      return (response.data as any).prospects;
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching prospects by hostel:', error);
    return [];
  }
};

/**
 * Create a new prospect
 */
export const createProspect = async (formData: FormData): Promise<ProspectResponse> => {
  try {
    const response = await api.post<ProspectResponse>('/admin/prospects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Error creating prospect:', error);
    throw error;
  }
};

/**
 * Update a prospect
 */
export const updateProspect = async (prospectId: number, formData: FormData): Promise<ProspectResponse> => {
  try {
    const response = await api.put<ProspectResponse>(`/admin/prospects/${prospectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Error updating prospect:', error);
    throw error;
  }
};

/**
 * Get prospect by ID (full details)
 */
export const getProspectById = async (prospectId: number): Promise<any> => {
  try {
    const response = await api.get<{ 
      success: boolean; 
      data: any;
      message: string;
      statusCode: number;
    }>(`/admin/prospects/${prospectId}`);
    
    if (response && response.data) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching prospect by ID:', error);
    throw error;
  }
};

/**
 * Get prospect for editing (formatted for form)
 */
export const getProspectForEdit = async (prospectId: number): Promise<any> => {
  try {
    const prospectData = await getProspectById(prospectId);
    
    if (!prospectData || !prospectData.prospect) {
      return null;
    }
    
    return prospectData;
  } catch (error: any) {
    console.error('Error fetching prospect for edit:', error);
    throw error;
  }
};

/**
 * Delete a prospect
 */
export const deleteProspect = async (prospectId: number): Promise<{ success: boolean; message: string; statusCode: number }> => {
  try {
    const response = await api.delete<{ 
      success: boolean; 
      message: string; 
      statusCode: number 
    }>(`/admin/prospects/${prospectId}`);
    return {
      success: true,
      message: 'Prospect deleted successfully',
      statusCode: 200,
    };
  } catch (error: any) {
    console.error('Error deleting prospect:', error);
    throw error;
  }
};

