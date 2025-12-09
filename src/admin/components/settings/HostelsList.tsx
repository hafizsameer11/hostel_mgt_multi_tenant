/**
 * Hostels List Component
 * Displays list of hostels with add/edit/delete functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeftIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { Hostel } from '../../types/hostel';
import * as hostelService from '../../services/hostel.service';

interface HostelsListProps {
  onBack: () => void;
  onNewHostel: () => void;
  onEditHostel: (hostel: Hostel) => void;
  onDeleteHostel: (hostel: Hostel) => void;
  refreshTrigger?: number;
}

export const HostelsList: React.FC<HostelsListProps> = ({
  onBack,
  onNewHostel,
  onEditHostel,
  onDeleteHostel,
  refreshTrigger = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hostels from API
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setLoading(true);
        setError(null);
        const hostelsData = await hostelService.getAllHostelsFromAPI();
        setHostels(hostelsData);
      } catch (err: any) {
        console.error('Error fetching hostels:', err);
        setError(err?.message || 'Failed to load hostels');
        setHostels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHostels();
  }, [refreshTrigger]);

  // Filter hostels based on search
  const filteredHostels = React.useMemo(() => {
    if (!searchQuery.trim()) return hostels;
    const query = searchQuery.toLowerCase();
    return hostels.filter(
      (hostel) =>
        hostel.name.toLowerCase().includes(query) ||
        hostel.city.toLowerCase().includes(query) ||
        hostel.managerName?.toLowerCase().includes(query) ||
        hostel.managerPhone?.toLowerCase().includes(query)
    );
  }, [hostels, searchQuery]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleMenuToggle = (hostelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === hostelId ? null : hostelId);
  };

  const handleEdit = (hostel: Hostel, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onEditHostel(hostel);
  };

  const handleDelete = (hostel: Hostel, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onDeleteHostel(hostel);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Hostels</h1>
        </div>
        <button
          onClick={onNewHostel}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Hostel</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hostels by name, city, or manager..."
          className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading hostels...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Hostels List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredHostels.map((hostel) => (
            <div
              key={hostel.id}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex items-start gap-4 flex-1 cursor-pointer"
                  onClick={() => onEditHostel(hostel)}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-2 text-lg">
                      {hostel.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{hostel.city}</span>
                      </div>
                      {hostel.managerName && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{hostel.managerName}</span>
                        </div>
                      )}
                      {hostel.managerPhone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{hostel.managerPhone}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        {hostel.totalFloors} floors • {hostel.roomsPerFloor} rooms per floor
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0" ref={(el) => (menuRefs.current[hostel.id] = el)}>
                  <button
                    onClick={(e) => handleMenuToggle(hostel.id, e)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === hostel.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <button
                        onClick={(e) => handleEdit(hostel, e)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(hostel, e)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredHostels.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {searchQuery ? 'No hostels found matching your search' : 'No hostels found. Add your first hostel to get started.'}
        </div>
      )}
    </div>
  );
};



