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
  const [activeTab, setActiveTab] = useState<'details' | 'arrangement' | 'architecture'>(
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
      id: 'arrangement',
      label: 'Arrangement',
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
        onChange={(tab) => setActiveTab(tab as 'details' | 'arrangement' | 'architecture')}
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

      {activeTab === 'arrangement' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Block, Room & Seat Arrangement</h2>
            <p className="text-slate-600">Manage blocks (floors), rooms, and seat allocations</p>
          </div>

          {/* Blocks (renamed from Floors) */}
          <div className="space-y-6">
            {architectureData.floors.map((floor) => (
              <div
                key={floor.floorNumber}
                className="border border-slate-200 rounded-xl p-6 bg-slate-50"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold">
                      {floor.floorNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Block {floor.floorNumber}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {floor.rooms.length} Rooms • {floor.rooms.reduce((sum, r) => sum + r.totalSeats, 0)} Seats
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      Occupied: {floor.rooms.reduce((sum, r) => sum + r.seats.filter(s => s.isOccupied).length, 0)} / {floor.rooms.reduce((sum, r) => sum + r.totalSeats, 0)}
                    </span>
                  </div>
                </div>

                {/* Rooms in this Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {floor.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">
                          Room {room.roomNumber}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {room.seats.filter(s => s.isOccupied).length}/{room.totalSeats} occupied
                        </span>
                      </div>

                      {/* Seats in this Room */}
                      <div className="grid grid-cols-2 gap-2">
                        {room.seats.map((seat) => (
                          <div
                            key={seat.id}
                            className={`p-2 rounded border text-sm ${
                              seat.isOccupied
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-green-50 border-green-200 text-green-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Seat {seat.seatNumber}</span>
                              {seat.isOccupied ? (
                                <span className="text-xs">Occupied</span>
                              ) : (
                                <span className="text-xs">Available</span>
                              )}
                            </div>
                            {seat.isOccupied && seat.tenantName && (
                              <p className="text-xs mt-1 truncate" title={seat.tenantName}>
                                {seat.tenantName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Arrangement Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Total Blocks</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {architectureData.floors.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-sm text-purple-600 font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {architectureData.totalRooms}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-green-600 font-medium">Available Seats</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {architectureData.availableSeats}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-sm text-red-600 font-medium">Occupied Seats</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {architectureData.occupiedSeats}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'architecture' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Tree Diagram - Vertical Layout */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Structure Tree Diagram</h2>
            
            {/* Tree Container - Vertical Layout */}
            <div className="relative py-6 overflow-y-auto max-h-[800px]">
              {/* Root Node - Hostel (Level 0) - Dark Gray */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-3 border-white">
                    {hostel.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {hostel.name}
                  </div>
                </div>
              </div>

              {/* Vertical Line from Root */}
              <div className="flex justify-center mb-2">
                <div className="w-0.5 h-6 bg-slate-400"></div>
              </div>

              {/* Level 1: Blocks (Teal) - Vertical Stack */}
              <div className="space-y-8">
                {architectureData.floors.map((floor) => (
                  <div key={floor.floorNumber} className="flex flex-col items-center">
                    {/* Block Node (Teal) */}
                    <div className="relative mb-3">
                      <div className="w-16 h-16 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                        B{floor.floorNumber}
                      </div>
                      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-slate-700 whitespace-nowrap">
                        Block {floor.floorNumber}
                      </div>
                    </div>

                    {/* Vertical Line from Block */}
                    <div className="w-0.5 h-4 bg-slate-400 mb-2"></div>

                    {/* Level 2: Rooms (Purple) - Compact Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                      {floor.rooms.map((room) => (
                        <div key={room.id} className="flex flex-col items-center">
                          {/* Vertical Line from Block to Room */}
                          <div className="w-0.5 h-3 bg-slate-400 mb-1"></div>
                          
                          {/* Room Node (Purple) */}
                          <div className="relative mb-2">
                            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-[10px] shadow-sm border-2 border-white">
                              R{room.roomNumber}
                            </div>
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] font-medium text-slate-700 whitespace-nowrap">
                              {room.totalSeats}
                            </div>
                          </div>

                          {/* Vertical Line from Room */}
                          <div className="w-0.5 h-2 bg-slate-400 mb-1"></div>

                          {/* Level 3: Seats (Light Green) - Horizontal Compact */}
                          <div className="flex gap-1">
                            {room.seats.map((seat) => (
                              <div key={seat.id} className="relative">
                                {/* Seat Node (Light Green) */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[9px] shadow-sm border border-white ${
                                  seat.isOccupied
                                    ? 'bg-red-400 text-white'
                                    : 'bg-green-300 text-green-800'
                                }`}>
                                  {seat.seatNumber}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Separator between blocks */}
                    {floor.floorNumber < architectureData.floors.length && (
                      <div className="w-full h-0.5 bg-slate-200 my-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tree Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{architectureData.floors.length}</p>
                  <p className="text-sm text-slate-600">Blocks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{architectureData.totalRooms}</p>
                  <p className="text-sm text-slate-600">Rooms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{architectureData.availableSeats}</p>
                  <p className="text-sm text-slate-600">Available Seats</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{architectureData.occupiedSeats}</p>
                  <p className="text-sm text-slate-600">Occupied Seats</p>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Architecture Diagram */}
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

