import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import hostelsData from '../../mock/hostels.json';
import tenantsData from '../../mock/tenants.json';
import { Tabs } from '../../components/Tabs';
import { ArchitectureDiagram } from '../../components/ArchitectureDiagram';
import { AddRoomForm } from '../../components/AddRoomForm';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { Hostel, ArchitectureData, RoomFormData } from '../../types/hostel';
import type { ToastType } from '../../types/common';
import ROUTES from '../../routes/routePaths';

/**
 * Hostel View page with Details and Architecture tabs
 */
const HostelView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [architectureData, setArchitectureData] =
    useState<ArchitectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'architecture'>(
    'details'
  );
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });

  useEffect(() => {
    if (!id) {
      // Use dummy data if no ID
      loadDummyData();
      return;
    }
    
    // Load dummy data directly
    loadDummyData(Number(id));
    
    // Check if we should open Add Room modal
    if (location.state && (location.state as { showAddRoom?: boolean }).showAddRoom) {
      setActiveTab('architecture');
      setIsAddRoomOpen(true);
    }
  }, [id, location.state]);

  const loadDummyData = (hostelId?: number) => {
    // Use dummy data - get first hostel if no ID provided
    const selectedId = hostelId || (hostelsData as Hostel[])[0]?.id || 1;
    
    // Find hostel or use first one
    const hostelData = (hostelsData as Hostel[]).find((h: Hostel) => Number(h.id) === Number(selectedId)) || (hostelsData as Hostel[])[0];
    
    if (hostelData) {
      setHostel(hostelData);
      
      // Generate architecture data directly
      const archData = generateArchitectureData(hostelData);
      setArchitectureData(archData);
    }
    
    setLoading(false);
  };

  const generateArchitectureData = (hostel: Hostel): ArchitectureData => {
    
    const floors: import('../../types/hostel').Floor[] = [];
    let totalRooms = 0;
    let totalSeats = 0;
    let occupiedSeats = 0;

    // Create floors
    for (let floorNum = 1; floorNum <= hostel.totalFloors; floorNum++) {
      const rooms: import('../../types/hostel').Room[] = [];

      // Create rooms for this floor
      for (let roomIndex = 1; roomIndex <= hostel.roomsPerFloor; roomIndex++) {
        const roomNumber = `${floorNum}${String(roomIndex).padStart(2, '0')}`;
        const totalSeatsPerRoom = 4; // Default 4 seats per room
        const seats: import('../../types/hostel').Seat[] = [];

        // Create seats (A, B, C, D)
        const seatLetters = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < totalSeatsPerRoom; i++) {
          const seatId = `${floorNum}-${String(roomIndex).padStart(2, '0')}-${seatLetters[i]}`;
          
          // Find tenant assigned to this room and seat
          const tenant = (tenantsData as any[]).find(
            (t: any) => t.room === roomNumber && t.bed === seatLetters[i]
          );

          seats.push({
            id: seatId,
            seatNumber: seatLetters[i],
            isOccupied: !!tenant && tenant.status === 'Active',
            tenantName: tenant?.name,
            tenantId: tenant?.id,
          });

          if (tenant && tenant.status === 'Active') {
            occupiedSeats++;
          }
          totalSeats++;
        }

        rooms.push({
          id: `${floorNum}-${String(roomIndex).padStart(2, '0')}`,
          floorNumber: floorNum,
          roomNumber: String(roomIndex).padStart(2, '0'),
          totalSeats: totalSeatsPerRoom,
          seats,
        });
        totalRooms++;
      }

      floors.push({
        floorNumber: floorNum,
        rooms,
      });
    }

    return {
      hostelId: Number(hostel.id),
      floors,
      totalRooms,
      totalSeats,
      occupiedSeats,
      availableSeats: totalSeats - occupiedSeats,
    };
  };

  const handleAddRoom = (roomData: RoomFormData) => {
    if (!hostel) return;
    
    // Just show success message - in real app this would call API
    console.log('Adding room:', roomData);
    setToast({
      open: true,
      type: 'success',
      message: 'Room added successfully!',
    });
    
    // Reload architecture data
    const archData = generateArchitectureData(hostel);
    setArchitectureData(archData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-[#2176FF] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading hostel...</p>
        </div>
      </div>
    );
  }

  if (!hostel || !architectureData) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600">Hostel not found</p>
      </div>
    );
  }

  const tabs = [
    {
      id: 'details',
      label: 'Details',
    },
    {
      id: 'architecture',
      label: 'Architecture',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(ROUTES.HOSTEL)}
            className="text-[#2176FF] hover:text-[#1966E6] mb-4 inline-flex items-center gap-2"
          >
            ← Back to Hostels
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{hostel.name}</h1>
          <p className="text-slate-600 mt-1">Hostel Details & Architecture</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => setIsAddRoomOpen(true)}
            icon={PlusIcon}
          >
            Add Room
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.HOSTEL_EDIT(hostel.id))}
          >
            Edit Hostel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'details' | 'architecture')}
      />

      {/* Tab Content */}
      {activeTab === 'details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-[#2176FF]" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Hostel Name</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.name}
                </p>
              </div>
            </div>

            {/* City */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPinIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">City</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.city}
                </p>
              </div>
            </div>

            {/* Manager Name */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Manager</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.managerName}
                </p>
              </div>
            </div>

            {/* Manager Phone */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <PhoneIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Manager Phone
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.managerPhone}
                </p>
              </div>
            </div>

            {/* Total Floors */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Floors</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.totalFloors}
                </p>
              </div>
            </div>

            {/* Rooms per Floor */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Rooms per Floor
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {hostel.roomsPerFloor}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {architectureData.totalRooms}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  Available Seats
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {architectureData.availableSeats}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-sm text-red-600 font-medium">
                  Occupied Seats
                </p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {architectureData.occupiedSeats}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-600 font-medium">Total Seats</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {architectureData.totalSeats}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {hostel.notes && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Notes
              </h3>
              <p className="text-slate-700 leading-relaxed">{hostel.notes}</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'architecture' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ArchitectureDiagram data={architectureData} />
        </motion.div>
      )}

      {/* Add Room Modal */}
      <AddRoomForm
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        hostelId={Number(hostel.id)}
        maxFloors={hostel.totalFloors}
        onSubmit={handleAddRoom}
      />

      {/* Toast */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default HostelView;

