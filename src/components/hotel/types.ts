export type HostelGender = 'coed' | 'boys' | 'girls';

export type SeatStatus = 'available' | 'occupied';

export interface Seat {
    id: string;
    number: string;
    status: SeatStatus;
    occupantName?: string;
}

export interface FloorRoom {
    id: string;
    number: string;
    seats: Seat[];
}

export interface Floor {
    id: string;
    number: string;
    rooms: FloorRoom[];
}

export type HostelPriceRange = 'all' | 'low' | 'mid' | 'high' | 'premium';

export interface Hostel {
    id: string;
    name: string;
    manager: string;
    phone: string;
    address: string;
    description: string;
    amenities: string[];
    image: string;
    totalFloors: number;
    totalRooms: number;
    totalSeats: number;
    availableSeats: number;
    pricePerMonth: number;
    gender: HostelGender;
}

export interface HostelFilters {
    city: string;
    amenities: string[];
    availability: boolean;
    priceRange: HostelPriceRange;
    gender: 'all' | HostelGender;
}

export type HostelSortOption = 'name' | 'rooms' | 'seats' | 'manager' | 'price';

export interface RoomFiltersState {
    selectedFloor: string;
    searchQuery: string;
    showOnlyAvailable: boolean;
}

