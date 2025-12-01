/**
 * Owner Service
 * API calls for owner management
 */

import { api } from '../../services/apiClient';

// Types based on API response
export interface OwnerByHostelResponse {
  success: boolean;
  data: {
    hostel: {
      id: number;
      name: string;
    };
    owner: {
      id: number;
      userId: number;
      ownerCode: string | null;
      name: string;
      alternatePhone: string | null;
      HostelName: string;
      taxId: string | null;
      registrationNumber: string | null;
      address: {
        state: string;
        city: string;
      } | null;
      bankDetails: any | null;
      documents: any | null;
      profilePhoto: string | null;
      status: string;
      emergencyContact: any | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
      user: {
        id: number;
        username: string;
        email: string;
        phone: string | null;
      };
    };
    hostels: Array<{
      id: number;
      name: string;
      status: string;
      manager: any | null;
      totalFloors: number;
      totalRooms: number;
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
      occupancyRate: number;
      createdAt: string;
    }>;
    summary: {
      totalHostels: number;
      activeHostels: number;
      inactiveHostels: number;
      maintenanceHostels: number;
      totalFloors: number;
      totalRooms: number;
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
      occupancyRate: number;
      activeAllocations: number;
      totalRevenue: number;
    };
  };
  message: string;
  statusCode: number;
}

export interface OwnerDetailResponse {
  success: boolean;
  data: {
    items: Array<{
      id: number;
      userId: number;
      ownerCode: string | null;
      name: string;
      alternatePhone: string | null;
      HostelName: string;
      taxId: string | null;
      registrationNumber: string | null;
      address: {
        state: string;
        city: string;
      } | null;
      bankDetails: any | null;
      documents: any | null;
      profilePhoto: string | null;
      status: string;
      emergencyContact: any | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
      user: {
        id: number;
        username: string;
        email: string;
        phone: string | null;
      };
      _count: {
        hostels: number;
      };
      hostelCount: number;
    }>;
    total: number;
    pagination: {
      page: number;
      limit: number;
      pages: number;
    };
  };
  message: string;
  statusCode: number;
}

// Owner list item interface (simplified for list view)
export interface OwnerListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  status: string;
  HostelName: string;
  hostelCount?: number;
  [key: string]: any;
}

/**
 * Get owners by hostel ID
 */
export const getOwnersByHostel = async (hostelId: number): Promise<OwnerListItem[]> => {
  try {
    const response = await api.get<OwnerByHostelResponse>(`/admin/owners/hostel/${hostelId}`);
    // API returns { success: true, data: { owner: {...}, ... } }
    if (response && response.success && response.data && response.data.owner) {
      const owner = response.data.owner;
      // Map to list item format
      return [{
        id: owner.id,
        name: owner.name,
        email: owner.user?.email || '',
        phone: owner.user?.phone || owner.alternatePhone || null,
        profilePhoto: owner.profilePhoto,
        status: owner.status,
        HostelName: owner.HostelName,
        hostelCount: response.data.hostels?.length || 0,
        userId: owner.userId,
        ownerCode: owner.ownerCode,
        address: owner.address,
        notes: owner.notes,
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt,
      }];
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching owners by hostel:', error);
    throw error;
  }
};

/**
 * Get owner by ID (full details)
 */
export const getOwnerById = async (ownerId: number): Promise<any> => {
  try {
    console.log('Fetching owner with ID:', ownerId);
    const response = await api.get<any>(`/admin/owners/${ownerId}`);
    console.log('Raw API response for owner:', JSON.stringify(response, null, 2));
    
    // The api.get returns ApiResponse<T>, so response is already { success, data, message, statusCode }
    if (response && response.success) {
      // Check if response.data has items array (paginated response)
      if (response.data && response.data.items && Array.isArray(response.data.items) && response.data.items.length > 0) {
        console.log('Owner found in items array:', response.data.items[0]);
        return response.data.items[0];
      }
      // If response.data is the owner object directly
      if (response.data && response.data.id) {
        console.log('Owner found directly in data:', response.data);
        return response.data;
      }
      // If response.data is nested further (check for tenant-like structure)
      if (response.data && response.data.owner && response.data.owner.id) {
        console.log('Owner found in nested owner property:', response.data.owner);
        return response.data.owner;
      }
    }
    console.warn('No owner data found in response. Response structure:', response);
    return null;
  } catch (error: any) {
    console.error('Error fetching owner by ID:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error message:', error.message);
    throw error;
  }
};

