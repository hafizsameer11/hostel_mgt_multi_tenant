/**
 * Mess service - Business logic for mess management
 */

import type { MessEntry, MessFormData } from '../types/hostel';
import type { Id } from '../types/common';
import * as db from './db';

const ENTITY_KEY = 'mess';

/** Initialize mess store */
function init(): void {
  if (!db.list<MessEntry>(ENTITY_KEY).length) {
    // Initialize empty if no data exists
  }
}

/**
 * Get all mess entries for a hostel
 * @param hostelId - Hostel ID
 * @returns Array of mess entries
 */
export function getMessEntriesByHostel(hostelId: Id): MessEntry[] {
  init();
  const allEntries = db.list<MessEntry>(ENTITY_KEY);
  return allEntries.filter((entry) => entry.hostelId === hostelId);
}

/**
 * Get a mess entry by ID
 * @param id - Mess entry ID
 * @returns Mess entry or undefined
 */
export function getMessEntryById(id: Id): MessEntry | undefined {
  init();
  return db.getById<MessEntry>(ENTITY_KEY, id);
}

/**
 * Get mess entry by date and hostel
 * @param hostelId - Hostel ID
 * @param date - Date string (YYYY-MM-DD)
 * @returns Mess entry or undefined
 */
export function getMessEntryByDate(hostelId: Id, date: string): MessEntry | undefined {
  init();
  const entries = getMessEntriesByHostel(hostelId);
  return entries.find((entry) => entry.date === date);
}

/**
 * Create a new mess entry
 * @param hostelId - Hostel ID
 * @param data - Mess form data
 * @returns Created mess entry
 */
export function createMessEntry(hostelId: Id, data: MessFormData): MessEntry {
  init();
  
  // Check if entry already exists for this date
  const existing = getMessEntryByDate(hostelId, data.date);
  if (existing) {
    throw new Error('Mess entry already exists for this date');
  }

  const newId = db.getNextId(ENTITY_KEY);
  const now = new Date().toISOString();
  
  // Convert form data to MessEntry format
  const messEntry: MessEntry = {
    id: newId,
    hostelId,
    date: data.date,
    breakfast: {
      type: 'breakfast',
      items: data.breakfast.items.map((item, index) => ({
        id: `${newId}-breakfast-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.breakfast.notes,
    },
    lunch: {
      type: 'lunch',
      items: data.lunch.items.map((item, index) => ({
        id: `${newId}-lunch-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.lunch.notes,
    },
    dinner: {
      type: 'dinner',
      items: data.dinner.items.map((item, index) => ({
        id: `${newId}-dinner-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.dinner.notes,
    },
    createdAt: now,
    updatedAt: now,
  };

  return db.create(ENTITY_KEY, messEntry);
}

/**
 * Update an existing mess entry
 * @param id - Mess entry ID
 * @param data - Partial mess form data to update
 * @returns Updated mess entry or undefined if not found
 */
export function updateMessEntry(
  id: Id,
  data: Partial<MessFormData>
): MessEntry | undefined {
  init();
  const existing = getMessEntryById(id);
  if (!existing) {
    return undefined;
  }

  const updatedData: Partial<MessEntry> = {
    updatedAt: new Date().toISOString(),
  };

  // Update breakfast if provided
  if (data.breakfast) {
    updatedData.breakfast = {
      type: 'breakfast',
      items: data.breakfast.items.map((item, index) => ({
        id: `${id}-breakfast-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.breakfast.notes,
    };
  }

  // Update lunch if provided
  if (data.lunch) {
    updatedData.lunch = {
      type: 'lunch',
      items: data.lunch.items.map((item, index) => ({
        id: `${id}-lunch-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.lunch.notes,
    };
  }

  // Update dinner if provided
  if (data.dinner) {
    updatedData.dinner = {
      type: 'dinner',
      items: data.dinner.items.map((item, index) => ({
        id: `${id}-dinner-${index}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      notes: data.dinner.notes,
    };
  }

  // Update date if provided
  if (data.date && data.date !== existing.date) {
    // Check if entry already exists for new date
    const existingForNewDate = getMessEntryByDate(existing.hostelId, data.date);
    if (existingForNewDate && existingForNewDate.id !== id) {
      throw new Error('Mess entry already exists for this date');
    }
    updatedData.date = data.date;
  }

  return db.update<MessEntry>(ENTITY_KEY, id, updatedData);
}

/**
 * Delete a mess entry
 * @param id - Mess entry ID
 * @returns true if deleted, false if not found
 */
export function deleteMessEntry(id: Id): boolean {
  init();
  return db.remove(ENTITY_KEY, id);
}

