/**
 * Alert service - Business logic for alert management
 */

import type { Alert, AlertSeverity } from '../types/comms';
import type { Id } from '../types/common';
import * as db from './db';
import alertsData from '../mock/alerts.json';

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

