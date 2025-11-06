/**
 * Type definitions for hostel management
 */

import type { Id } from './common';

/**
 * Hostel entity
 * Represents a hostel property in the system
 */
export interface Hostel {
  id: Id;
  name: string;
  city: string;
  totalFloors: number;
  roomsPerFloor: number;
  managerName: string;
  managerPhone: string;
  notes?: string;
}

/**
 * Form data for creating/editing hostels
 */
export interface HostelFormData {
  name: string;
  city: string;
  totalFloors: number;
  roomsPerFloor: number;
  managerName: string;
  managerPhone: string;
  notes?: string;
}

/**
 * Hostel statistics for dashboard
 */
export interface HostelStats {
  totalHostels: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

/**
 * Seat entity - represents an individual bed/seat in a room
 */
export interface Seat {
  id: string; // Format: "{floorNumber}-{roomNumber}-{seatLetter}" e.g., "2-01-A"
  seatNumber: string; // A, B, C, D, etc.
  isOccupied: boolean;
  tenantName?: string; // Name of tenant occupying this seat
  tenantId?: number; // ID of tenant occupying this seat
}

/**
 * Room entity - represents a room in a hostel
 */
export interface Room {
  id: string; // Format: "{floorNumber}-{roomNumber}" e.g., "2-01"
  floorNumber: number;
  roomNumber: string; // "01", "02", etc.
  totalSeats: number;
  seats: Seat[];
  pricePerSeat?: number;
}

/**
 * Floor entity - represents a floor in a hostel
 */
export interface Floor {
  floorNumber: number;
  rooms: Room[];
}

/**
 * Architecture data - complete structure of a hostel
 */
export interface ArchitectureData {
  hostelId: number;
  floors: Floor[];
  totalRooms: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
}

/**
 * Room form data for adding rooms
 */
export interface RoomFormData {
  floorNumber: number;
  roomNumber: string;
  totalSeats: number;
  pricePerSeat?: number;
}

