/**
 * Role Service
 * API calls for role management
 */

import { api } from '../../services/apiClient';

// Types based on API response
export interface Role {
  id: number;
  roleName: string;
  [key: string]: any; // Allow additional properties
}

export interface RoleListResponse {
  success: boolean;
  data: {
    roles: Role[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
  statusCode?: number;
}

export interface CreateRoleRequest {
  rolename: string;
  description: string;
}

export interface CreateRoleResponse {
  success: boolean;
  data: {
    id: number;
    roleName: string;
    description: string;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
  statusCode: number;
}

export interface UpdateRolePermissionsRequest {
  permissions: number[];
}

export interface UpdateRolePermissionsResponse {
  success: boolean;
  data: {
    id: number;
    roleName: string;
    description: string;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
    permissions: Array<{
      id: number;
      roleId: number;
      permissionId: number;
      createdAt: string;
      permission: {
        id: number;
        resource: string;
        action: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
  message: string;
  statusCode: number;
}

/**
 * Get all roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const response = await api.get<RoleListResponse>('/admin/roles');
    // API returns { success: true, data: { roles: [...], pagination: {...} } }
    if (response && response.success && response.data) {
      // Handle the response structure: data.roles
      if (response.data.roles && Array.isArray(response.data.roles)) {
        return response.data.roles;
      }
      // Fallback: if data is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Create a new role
 */
export const createRole = async (data: CreateRoleRequest): Promise<CreateRoleResponse['data']> => {
  try {
    console.log('🔐 [CREATE ROLE] Calling endpoint: /admin/role');
    console.log('📦 [CREATE ROLE] Request data:', data);
    
    const response = await api.post<CreateRoleResponse>(
      '/admin/role',
      {
        rolename: data.rolename,
        description: data.description,
      }
    );
    
    console.log('✅ [CREATE ROLE] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to create role');
  } catch (error: any) {
    console.error('❌ [CREATE ROLE] Error:', error);
    throw error;
  }
};

export interface GetRoleResponse {
  success: boolean;
  data: {
    id: number;
    roleName: string;
    description: string;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: number;
      username: string;
      email: string;
    } | null;
    permissions: any[];
    _count: {
      users: number;
    };
  };
  message: string;
  statusCode: number;
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
}

export interface GetRolePermissionsResponse {
  success: boolean;
  data: Permission[];
  message: string;
  statusCode: number;
}

export interface UpdateRoleRequest {
  rolename: string;
  description: string;
}

export interface UpdateRoleResponse {
  success: boolean;
  data: {
    id: number;
    roleName: string;
    description: string;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
    permissions: any[];
  };
  message: string;
  statusCode: number;
}

export interface DeleteRoleResponse {
  success: boolean;
  data: {
    id: number;
  };
  message: string;
  statusCode: number;
}

/**
 * Get role by ID
 */
export const getRoleById = async (roleId: number): Promise<GetRoleResponse['data']> => {
  try {
    console.log(`🔐 [GET ROLE] Calling endpoint: /admin/role/${roleId}`);
    
    const response = await api.get<GetRoleResponse>(`/admin/role/${roleId}`);
    
    console.log('✅ [GET ROLE] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to get role');
  } catch (error: any) {
    console.error('❌ [GET ROLE] Error:', error);
    throw error;
  }
};

/**
 * Get role permissions
 */
export const getRolePermissions = async (roleId: number): Promise<Permission[]> => {
  try {
    console.log(`🔐 [GET PERMISSIONS] Calling endpoint: /admin/role/${roleId}/permissions`);
    
    const response = await api.get<GetRolePermissionsResponse>(`/admin/role/${roleId}/permissions`);
    
    console.log('✅ [GET PERMISSIONS] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to get role permissions');
  } catch (error: any) {
    console.error('❌ [GET PERMISSIONS] Error:', error);
    throw error;
  }
};

/**
 * Update role
 */
export const updateRole = async (
  roleId: number,
  data: UpdateRoleRequest
): Promise<UpdateRoleResponse['data']> => {
  try {
    console.log(`🔐 [UPDATE ROLE] Calling endpoint: /admin/role/${roleId}`);
    console.log('📦 [UPDATE ROLE] Request data:', data);
    
    const response = await api.put<UpdateRoleResponse>(
      `/admin/role/${roleId}`,
      {
        rolename: data.rolename,
        description: data.description,
      }
    );
    
    console.log('✅ [UPDATE ROLE] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to update role');
  } catch (error: any) {
    console.error('❌ [UPDATE ROLE] Error:', error);
    throw error;
  }
};

/**
 * Update role permissions
 */
export const updateRolePermissions = async (
  roleId: number,
  data: UpdateRolePermissionsRequest
): Promise<UpdateRolePermissionsResponse['data']> => {
  try {
    console.log(`🔐 [UPDATE PERMISSIONS] Calling endpoint: /admin/role/${roleId}/permissions`);
    console.log('📦 [UPDATE PERMISSIONS] Request data:', data);
    
    const response = await api.put<UpdateRolePermissionsResponse>(
      `/admin/role/${roleId}/permissions`,
      {
        permissions: data.permissions,
      }
    );
    
    console.log('✅ [UPDATE PERMISSIONS] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to update role permissions');
  } catch (error: any) {
    console.error('❌ [UPDATE PERMISSIONS] Error:', error);
    throw error;
  }
};

/**
 * Delete role
 */
export const deleteRole = async (roleId: number): Promise<DeleteRoleResponse['data']> => {
  try {
    console.log(`🔐 [DELETE ROLE] Calling endpoint: /admin/role/${roleId}`);
    
    const response = await api.delete<DeleteRoleResponse>(`/admin/role/${roleId}`);
    
    console.log('✅ [DELETE ROLE] Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.message || 'Failed to delete role');
  } catch (error: any) {
    console.error('❌ [DELETE ROLE] Error:', error);
    throw error;
  }
};

