import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HotelFilters from '../components/hotel/HotelFilters';
import HotelList from '../components/hotel/HotelList';
import HotelDetailView from '../components/hotel/HotelDetailView';
import type {
    Floor,
    Hostel,
    HostelFilters as HostelFilterState,
    HostelPriceRange,
    HostelSortOption,
    RoomFiltersState,
    Seat,
    SeatStatus,
} from '../components/hotel/types';

type DetailTab = 'overview' | 'rooms' | 'gallery' | 'location';

const createSeat = (
    id: string,
    number: string,
    status: SeatStatus,
    occupantName?: string,
): Seat => ({
    id,
    number,
    status,
    ...(occupantName ? { occupantName } : {}),
});

const mockFloors: Floor[] = [
    {
        id: 'floor-1',
        number: '1',
        rooms: [
            {
                id: 'room-101',
                number: '101',
                seats: [
                    createSeat('s1', '1', 'available'),
                    createSeat('s2', '2', 'occupied', 'John Doe'),
                    createSeat('s3', '3', 'available'),
                    createSeat('s4', '4', 'occupied', 'Jane Smith'),
                ],
            },
            {
                id: 'room-102',
                number: '102',
                seats: [
                    createSeat('s5', '1', 'available'),
                    createSeat('s6', '2', 'available'),
                    createSeat('s7', '3', 'occupied', 'Bob Wilson'),
                    createSeat('s8', '4', 'available'),
                ],
            },
        ],
    },
    {
        id: 'floor-2',
        number: '2',
        rooms: [
            {
                id: 'room-201',
                number: '201',
                seats: [
                    createSeat('s9', '1', 'occupied', 'Alice Brown'),
                    createSeat('s10', '2', 'available'),
                    createSeat('s11', '3', 'available'),
                    createSeat('s12', '4', 'occupied', 'Charlie Green'),
                ],
            },
        ],
    },
];

const mockHostels: Hostel[] = [
  {
    id: '1',
    name: 'City Center Hostel',
    manager: 'John Smith',
    phone: '+1 234-567-8900',
    address: '123 Main Street, Downtown',
    description: 'Modern hostel in the heart of the city with excellent amenities and easy access to public transport.',
    amenities: ['WiFi', 'AC', 'Laundry', 'Kitchen'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    totalFloors: 3,
    totalRooms: 24,
    totalSeats: 96,
    availableSeats: 42,
    pricePerMonth: 22000,
    gender: 'coed',
  },
  {
    id: '2',
    name: 'University Hostel',
    manager: 'Sarah Johnson',
    phone: '+1 234-567-8901',
    address: '456 College Ave, University District',
    description: 'Student-friendly hostel near the university campus with study areas and quiet zones.',
    amenities: ['WiFi', 'Study Room', 'Gym', 'Cafeteria'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    totalFloors: 4,
    totalRooms: 32,
    totalSeats: 128,
    availableSeats: 67,
    pricePerMonth: 25000,
    gender: 'boys',
  },
  {
    id: '3',
    name: 'Green Valley Hostel',
    manager: 'Mike Davis',
    phone: '+1 234-567-8902',
    address: '789 Park Road, Green Valley',
    description: 'Eco-friendly hostel with garden spaces and sustainable practices.',
    amenities: ['WiFi', 'Garden', 'Recycling', 'Bike Storage'],
    image: 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800',
    totalFloors: 2,
    totalRooms: 16,
    totalSeats: 64,
    availableSeats: 28,
    pricePerMonth: 18000,
    gender: 'girls',
  },
];

const initialFilters: HostelFilterState = {
    city: '',
    amenities: [],
    availability: false,
    priceRange: 'all',
    gender: 'all',
};

const initialRoomFilters: RoomFiltersState = {
    selectedFloor: '',
    searchQuery: '',
    showOnlyAvailable: false,
};

const Hostels = () => {
    const [hostels] = useState<Hostel[]>(mockHostels);
    const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [filters, setFilters] = useState<HostelFilterState>(initialFilters);
    const [sortBy, setSortBy] = useState<HostelSortOption>('name');
    const [roomFilters, setRoomFilters] = useState<RoomFiltersState>(initialRoomFilters);

    const toggleAmenity = (amenity: string) => {
        setFilters((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((value) => value !== amenity)
                : [...prev.amenities, amenity],
        }));
    };

    const filtersByPrice = (hostel: Hostel, priceRange: HostelPriceRange) => {
        switch (priceRange) {
            case 'low':
                return hostel.pricePerMonth <= 20000;
            case 'mid':
                return hostel.pricePerMonth > 20000 && hostel.pricePerMonth <= 26000;
            case 'high':
                return hostel.pricePerMonth > 26000 && hostel.pricePerMonth <= 32000;
            case 'premium':
                return hostel.pricePerMonth > 32000;
            default:
                return true;
        }
    };

    const filteredHostels = useMemo(() => {
        const result = hostels.filter((hostel) => {
            if (filters.city && !hostel.address.toLowerCase().includes(filters.city.toLowerCase())) {
                return false;
            }

            if (filters.amenities.length > 0) {
                const hasAllAmenities = filters.amenities.every((amenity) => hostel.amenities.includes(amenity));
                if (!hasAllAmenities) {
                    return false;
                }
            }

            if (filters.availability && hostel.availableSeats === 0) {
                return false;
            }

            if (filters.gender !== 'all' && hostel.gender !== filters.gender) {
                return false;
            }

            if (!filtersByPrice(hostel, filters.priceRange)) {
                return false;
            }

            return true;
        });

        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rooms':
                    return b.totalRooms - a.totalRooms;
                case 'seats':
                    return b.totalSeats - a.totalSeats;
                case 'manager':
                    return a.manager.localeCompare(b.manager);
                case 'price':
                    return a.pricePerMonth - b.pricePerMonth;
                default:
                    return 0;
            }
        });
    }, [filters, hostels, sortBy]);

    const allAmenities = useMemo(
        () => Array.from(new Set(hostels.flatMap((hostel) => hostel.amenities))).sort(),
        [hostels],
    );

    const handleRoomFiltersChange = (next: RoomFiltersState) => {
        setRoomFilters(next);
    };

    const handleBackToList = () => {
        setSelectedHostel(null);
        setActiveTab('overview');
        setRoomFilters(initialRoomFilters);
    };

    if (selectedHostel) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <HotelDetailView
                    hostel={selectedHostel}
                    onBack={handleBackToList}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    floors={mockFloors}
                    roomFilters={roomFilters}
                    onRoomFiltersChange={handleRoomFiltersChange}
                />
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="bg-white border-b border-gray-200 py-4">
                <div className="container mx-auto px-6">
                    <nav className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">Home</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-medium">Hostels</span>
                    </nav>
                </div>
            </div>

            <section className="py-12 bg-white">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Hostels</h1>
                    <p className="text-lg text-gray-600 max-w-3xl">
                        Browse our carefully curated selection of hostels. Each property is managed with attention to detail and
                        commitment to quality.
                    </p>
                </div>
            </section>

            <HotelFilters
                filters={filters}
                amenities={allAmenities}
                sortBy={sortBy}
                onCityChange={(value) => setFilters((prev) => ({ ...prev, city: value }))}
                onToggleAmenity={toggleAmenity}
                onAvailabilityChange={(checked) => setFilters((prev) => ({ ...prev, availability: checked }))}
                onPriceRangeChange={(range) => setFilters((prev) => ({ ...prev, priceRange: range }))}
                onGenderChange={(gender) => setFilters((prev) => ({ ...prev, gender }))}
                onSortChange={setSortBy}
            />

            <section className="flex-1 py-12">
                <div className="container mx-auto px-6">
                    <HotelList
                        hostels={filteredHostels}
                        onSelectHostel={(hostel) => {
                            setSelectedHostel(hostel);
                            setActiveTab('overview');
                            setRoomFilters(initialRoomFilters);
                        }}
                    />
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Hostels;

