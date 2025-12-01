/**
 * Alert service - Business logic for alert management
 */

import type { Alert, AlertSeverity } from '../types/comms';
import type { Id } from '../types/common';
import * as db from './db';
import alertsData from '../mock/alerts.json';
import { api } from '../../services/apiClient';
import { API_ROUTES } from '../../services/api.config';

const ENTITY_KEY = 'alerts';

/** Initialize alert store with seed data */
function init(): void {
  db.seedFromJson(ENTITY_KEY, alertsData);
}

/**
 * Get all alerts
 * @returns Array of alerts
 */
export function getAllAlerts(): Alert[] {
  init();
  return db.list<Alert>(ENTITY_KEY);
}

/**
 * Get an alert by ID
 * @param id - Alert ID
 * @returns Alert or undefined
 */
export function getAlertById(id: Id): Alert | undefined {
  init();
  return db.getById<Alert>(ENTITY_KEY, id);
}

/**
 * Create a new alert
 * @param data - Alert data
 * @returns Created alert
 */
export function createAlert(data: {
  title: string;
  severity: AlertSeverity;
  description?: string;
  assignedTo?: string;
  status?: 'open' | 'closed';
}): Alert {
  init();
  const newId = db.getNextId(ENTITY_KEY);
  const alert: Alert = {
    id: newId,
    title: data.title,
    severity: data.severity,
    createdAt: new Date().toISOString(),
    status: data.status || 'open',
    description: data.description,
    assignedTo: data.assignedTo,
  };
  return db.create(ENTITY_KEY, alert);
}

/**
 * Update an existing alert
 * @param id - Alert ID
 * @param data - Partial alert data to update
 * @returns Updated alert or undefined if not found
 */
export function updateAlert(
  id: Id,
  data: Partial<Omit<Alert, 'id' | 'createdAt'>>
): Alert | undefined {
  init();
  return db.update<Alert>(ENTITY_KEY, id, data);
}

/**
 * Delete an alert
 * @param id - Alert ID
 * @returns true if deleted, false if not found
 */
export function deleteAlert(id: Id): boolean {
  init();
  return db.remove(ENTITY_KEY, id);
}

/**
 * Create a maintenance alert for tenant check-in
 * @param tenantName - Name of the tenant
 * @param room - Room number
 * @param seat - Seat/bed number
 * @returns Created alert
 */
export function createCheckInAlert(
  tenantName: string,
  room: string,
  seat?: string
): Alert {
  const description = seat
    ? `${tenantName} checked in to Room ${room}, Seat ${seat}`
    : `${tenantName} checked in to Room ${room}`;
  
  return createAlert({
    title: `Tenant Check-in - ${tenantName}`,
    severity: 'info',
    description,
    status: 'open',
  });
}

/**
 * Create a maintenance alert for tenant check-out
 * @param tenantName - Name of the tenant
 * @param room - Room number
 * @param seat - Seat/bed number
 * @returns Created alert
 */
export function createCheckOutAlert(
  tenantName: string,
  room: string,
  seat?: string
): Alert {
  const description = seat
    ? `${tenantName} checked out from Room ${room}, Seat ${seat}. Room inspection required.`
    : `${tenantName} checked out from Room ${room}. Room inspection required.`;
  
  return createAlert({
    title: `Tenant Check-out - ${tenantName}`,
    severity: 'warn',
    description,
    status: 'open',
  });
}

/**
 * Create Alert API Request Interface
 */
export interface CreateAlertRequest {
  type: string;
  title: string;
  priority: string;
  description: string;
  hostelId: number;
  roomId: number;
  tenantId?: number;
  amount?: number;
  dueDate: string;
  assignedTo?: number;
  remarks?: string;
}

/**
 * Create Alert API Response Interface
 */
export interface CreateAlertResponse {
  success: boolean;
  data: {
    id: number;
    type: string;
    priority: string;
    severity: string;
    title: string;
    description: string;
    status: string;
    rawStatus: string;
    maintenanceType: string | null;
    assignedTo: string;
    created: string;
    createdAt: string;
    updatedAt: string;
    hostel: string;
    room: string;
    tenant: string;
    amount: number;
    dueDate: string;
    assignedUser: {
      id: number;
      name: string;
      username: string;
      email: string;
    };
  };
  message: string;
  statusCode: number;
}

/**
 * Room API Response Interface
 */
export interface RoomApiResponse {
  success: boolean;
  data: Array<{
    id: number;
    hostelId: number;
    floorId: number;
    roomNumber: string;
    roomType: string;
    totalBeds: number;
    occupiedBeds: number;
    pricePerBed: number;
    status: string;
    amenities: string[];
    hasAttachedBathroom: boolean;
    furnishing: string;
    maintenanceSchedule: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    floor: {
      floorNumber: number;
      floorName: string;
    };
  }>;
  message: string;
  statusCode: number;
}

/**
 * Create a new alert via API
 * @param data - Alert form data
 * @returns Created alert response
 */
export async function createAlertAPI(data: CreateAlertRequest): Promise<CreateAlertResponse> {
  try {
    console.log('🔐 [CREATE ALERT] Calling endpoint: /admin/alerts');
    console.log('📦 [CREATE ALERT] Request data:', {
      ...data,
      currentPassword: data.amount ? '***' : undefined,
    });

    const response = await api.post<CreateAlertResponse>(API_ROUTES.ALERT.CREATE, data);

    console.log('✅ [CREATE ALERT] Response received:', response);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create alert');
    }

    return response;
  } catch (error: any) {
    console.error('❌ [CREATE ALERT] Error:', error);
    throw error;
  }
}

/**
 * Get rooms by hostel ID via API
 * @param hostelId - Hostel ID
 * @returns Array of rooms
 */
export async function getRoomsByHostel(hostelId: number): Promise<RoomApiResponse['data']> {
  try {
    console.log(`🔐 [GET ROOMS BY HOSTEL] Calling endpoint: /admin/room/hostel/${hostelId}`);

    const response = await api.get<RoomApiResponse>(API_ROUTES.ROOM.BY_HOSTEL(hostelId));

    console.log('✅ [GET ROOMS BY HOSTEL] Response received:', response);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch rooms');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ [GET ROOMS BY HOSTEL] Error:', error);
    throw error;
  }
}

/**
 * Alert API Response Interface
 */
export interface AlertApiResponse {
  success: boolean;
  data: {
    alerts: Array<{
      id: number;
      severity: string;
      title: string;
      description: string;
      assignedTo: string;
      created: string;
      status: string;
      rawStatus: string;
      priority: string;
      type: string;
      maintenanceType: string | null;
      hostel: string;
      room: string | null;
      tenant: string | null;
      amount: number | null;
      dueDate: string | null;
      createdAt: string;
      updatedAt: string;
      assignedUser: {
        id: number;
        name: string;
        username: string;
        email: string;
      } | null;
      creator: {
        id: number;
        name: string;
        username: string;
      };
      resolver: {
        id: number;
        name: string;
        username: string;
      } | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  statusCode: number;
}

/**
 * Get all alerts from API with optional filters
 * @param params - Optional filter parameters (type, hostelId)
 * @returns Alert API response
 */
export async function getAlertsAPI(params?: {
  type?: 'bill' | 'maintenance';
  hostelId?: number;
}): Promise<AlertApiResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.hostelId) queryParams.append('hostelId', params.hostelId.toString());

    const url = `${API_ROUTES.ALERT.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔐 [GET ALERTS] Calling endpoint:', url);

    const response = await api.get<AlertApiResponse['data']>(url);

    console.log('✅ [GET ALERTS] Response received:', response);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch alerts');
    }

    return response as AlertApiResponse;
  } catch (error: any) {
    console.error('❌ [GET ALERTS] Error:', error);
    throw error;
  }
}

/**
 * Alert Detail API Response Interface
 */
export interface AlertDetailApiResponse {
  success: boolean;
  data: {
    id: number;
    type: string;
    priority: string;
    severity: string;
    title: string;
    description: string;
    status: string;
    rawStatus: string;
    maintenanceType: string | null;
    assignedTo: string;
    assignedUser: {
      id: number;
      name: string;
      username: string;
      email: string;
    } | null;
    created: string;
    createdAt: string;
    updatedAt: string;
    hostel: {
      id: number;
      name: string;
    } | null;
    room: {
      id: number;
      roomNumber: string;
    } | null;
    tenant: {
      id: number;
      name: string;
      email: string;
      phone: string;
    } | null;
    creator: {
      id: number;
      name: string;
      username: string;
      email: string;
    };
    resolver: {
      id: number;
      name: string;
      username: string;
    } | null;
    amount: number | null;
    dueDate: string | null;
    resolvedAt: string | null;
    remarks: string | null;
    metadata: any | null;
    attachments: any | null;
  };
  message: string;
  statusCode: number;
}

/**
 * Get alert by ID from API
 * @param alertId - Alert ID
 * @returns Alert detail response
 */
export async function getAlertByIdAPI(alertId: number): Promise<AlertDetailApiResponse> {
  try {
    console.log(`🔐 [GET ALERT BY ID] Calling endpoint: /admin/alerts/${alertId}`);

    const response = await api.get<AlertDetailApiResponse['data']>(API_ROUTES.ALERT.BY_ID(alertId));

    console.log('✅ [GET ALERT BY ID] Response received:', response);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch alert');
    }

    return response as AlertDetailApiResponse;
  } catch (error: any) {
    console.error('❌ [GET ALERT BY ID] Error:', error);
    throw error;
  }
}

