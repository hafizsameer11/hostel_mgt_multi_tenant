/**
 * TenantForm Component
 * Sidebar-based form for adding/editing tenants
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/Select';
import { 
  UserIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../../../services/api.config';
import * as tenantService from '../../../services/tenant.service';

interface TenantFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  cnicNumber: string;
  profilePhoto: File | null;
  previousProfilePhoto: string | null;
  previousDocuments: any[] | null;
  profession: string;
  professionDetails: string;
  professionDocuments: File | null;
  previousProfessionDocuments: any[] | null;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  hostelId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: string;
  securityDeposit: string;
  documents: File | null;
}

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TenantFormData) => Promise<void>;
  editingId: number | null;
  initialData?: Partial<TenantFormData>;
  hostelOptions: Array<{ value: string; label: string }>;
  hostelsLoading: boolean;
}

type ActiveTab = 'personal' | 'professional' | 'emergency' | 'hostel';

const TenantForm: React.FC<TenantFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  initialData,
  hostelOptions,
  hostelsLoading,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [availableFloors, setAvailableFloors] = useState<Array<{ value: string; label: string }>>([]);
  const [availableRooms, setAvailableRooms] = useState<Array<{ value: string; label: string }>>([]);
  const [availableBeds, setAvailableBeds] = useState<Array<{ value: string; label: string }>>([]);
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);

  const [formData, setFormData] = useState<TenantFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    cnicNumber: '',
    profilePhoto: null,
    previousProfilePhoto: null,
    previousDocuments: null,
    profession: '',
    professionDetails: '',
    professionDocuments: null,
    previousProfessionDocuments: null,
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
    hostelId: '',
    floorId: '',
    roomId: '',
    bedId: '',
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    documents: null,
  });

  // Load initial data when editing, reset when adding
  useEffect(() => {
    if (!isOpen) return;
    
    if (initialData && editingId) {
      // Editing mode: load initial data
      setFormData(prev => ({ ...prev, ...initialData }));
      setActiveTab('personal');
    } else if (!editingId) {
      // Adding mode: reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        cnicNumber: '',
        profilePhoto: null,
        previousProfilePhoto: null,
        previousDocuments: null,
        profession: '',
        professionDetails: '',
        professionDocuments: null,
        previousProfessionDocuments: null,
        emergencyContactName: '',
        emergencyContactNumber: '',
        emergencyContactRelation: '',
        hostelId: '',
        floorId: '',
        roomId: '',
        bedId: '',
        leaseStartDate: '',
        leaseEndDate: '',
        monthlyRent: '',
        securityDeposit: '',
        documents: null,
      });
      setActiveTab('personal');
      setAvailableFloors([]);
      setAvailableRooms([]);
      setAvailableBeds([]);
    }
  }, [initialData, editingId, isOpen]);

  // Load floors when hostel is selected
  useEffect(() => {
    const fetchFloors = async () => {
      if (formData.hostelId) {
        try {
          setFloorsLoading(true);
          const floors = await tenantService.getFloors();
          const floorOptions = floors.map(floor => ({
            value: String(floor.id),
            label: floor.floorName || `Floor ${floor.number}`,
          }));
          setAvailableFloors(floorOptions);
        } catch (error) {
          console.error('Error loading floors:', error);
          setAvailableFloors([]);
        } finally {
          setFloorsLoading(false);
        }
      } else {
        setAvailableFloors([]);
        setAvailableRooms([]);
        setAvailableBeds([]);
      }
    };
    fetchFloors();
  }, [formData.hostelId]);

  // Update rooms when floor is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (formData.floorId) {
        try {
          setRoomsLoading(true);
          const rooms = await tenantService.getRoomsByFloor(Number(formData.floorId));
          const roomOptions = rooms.map(room => ({
            value: String(room.id),
            label: `Room ${room.roomNumber}`,
          }));
          setAvailableRooms(roomOptions);
        } catch (error) {
          console.error('Error loading rooms:', error);
          setAvailableRooms([]);
        } finally {
          setRoomsLoading(false);
        }
      } else {
        setAvailableRooms([]);
        setAvailableBeds([]);
      }
      setFormData(prev => ({ ...prev, roomId: '', bedId: '' }));
    };
    fetchRooms();
  }, [formData.floorId]);

  // Update beds when room is selected
  useEffect(() => {
    const fetchBeds = async () => {
      if (formData.roomId) {
        try {
          setBedsLoading(true);
          const beds = await tenantService.getBedsByRoom(Number(formData.roomId));
          const unoccupiedBeds = beds
            .filter(bed => !bed.isOccupied)
            .map(bed => ({
              value: String(bed.id),
              label: `Bed ${bed.bedNumber} (Available)`,
            }));
          setAvailableBeds(unoccupiedBeds);
        } catch (error) {
          console.error('Error loading beds:', error);
          setAvailableBeds([]);
        } finally {
          setBedsLoading(false);
        }
      } else {
        setAvailableBeds([]);
      }
      setFormData(prev => ({ ...prev, bedId: '' }));
    };
    fetchBeds();
  }, [formData.roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />
      
      {/* Modal with Sidebar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 bg-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-white" />
                <h2 className="text-lg font-semibold text-white">Tenant Info</h2>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="font-medium">Personal Information</span>
              </button>
              <button
                onClick={() => setActiveTab('professional')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'professional'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <BriefcaseIcon className="w-5 h-5" />
                <span className="font-medium">Professional</span>
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'emergency'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Emergency</span>
              </button>
              <button
                onClick={() => setActiveTab('hostel')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'hostel'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <span className="font-medium">Hostel Info</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeTab === 'personal' && 'PERSONAL INFORMATION'}
                  {activeTab === 'professional' && 'PROFESSIONAL'}
                  {activeTab === 'emergency' && 'EMERGENCY'}
                  {activeTab === 'hostel' && 'HOSTEL INFO'}
                </h3>
                <span className="block w-12 h-1 bg-pink-500 mt-1" />
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {/* Tab Content - Personal */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.gender}
                          onChange={(value) => setFormData({ ...formData, gender: value })}
                          options={[
                            { value: '', label: 'Select Gender' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CNIC Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cnicNumber}
                          onChange={(e) => setFormData({ ...formData, cnicNumber: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12345-1234567-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Profile Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData({ ...formData, profilePhoto: file });
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.profilePhoto && (
                          <p className="text-sm text-gray-600 mt-1">
                            Selected: {formData.profilePhoto.name}
                          </p>
                        )}
                        {editingId && formData.previousProfilePhoto && !formData.profilePhoto && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">Current Profile Photo:</p>
                            <img
                              src={`${API_BASE_URL.replace('/api', '')}${formData.previousProfilePhoto}`}
                              alt="Current profile"
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content - Professional */}
                {activeTab === 'professional' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Engineer, Doctor, Teacher"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Profession Details
                        </label>
                        <textarea
                          value={formData.professionDetails}
                          onChange={(e) => setFormData({ ...formData, professionDetails: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter details about the profession..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Professional Documents
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData({ ...formData, professionDocuments: file });
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.professionDocuments && (
                          <p className="text-sm text-gray-600 mt-1">
                            Selected: {formData.professionDocuments.name}
                          </p>
                        )}
                        {editingId && formData.previousProfessionDocuments && formData.previousProfessionDocuments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Current Professional Documents:</p>
                            <div className="space-y-2">
                              {formData.previousProfessionDocuments.map((doc: any, idx: number) => (
                                <a
                                  key={doc.id || idx}
                                  href={`${API_BASE_URL.replace('/api', '')}${doc.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                  <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 flex-1 truncate" title={doc.originalName || doc.filename}>
                                    {doc.originalName || doc.filename}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content - Emergency */}
                {activeTab === 'emergency' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Emergency Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter emergency contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Emergency Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.emergencyContactNumber}
                          onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Relation <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.emergencyContactRelation}
                          onChange={(value) => setFormData({ ...formData, emergencyContactRelation: value })}
                          options={[
                            { value: '', label: 'Select Relation' },
                            { value: 'father', label: 'Father' },
                            { value: 'mother', label: 'Mother' },
                            { value: 'brother', label: 'Brother' },
                            { value: 'sister', label: 'Sister' },
                            { value: 'spouse', label: 'Spouse' },
                            { value: 'son', label: 'Son' },
                            { value: 'daughter', label: 'Daughter' },
                            { value: 'friend', label: 'Friend' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content - Hostel Info */}
                {activeTab === 'hostel' && (
                  <div className="space-y-6">
                    {/* Lease Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Lease Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.leaseStartDate}
                          onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Lease End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.leaseEndDate}
                          onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Rent
                        </label>
                        <input
                          type="number"
                          value={formData.monthlyRent}
                          onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="20000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Security Deposit
                        </label>
                        <input
                          type="number"
                          value={formData.securityDeposit}
                          onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    {/* Room Allocation */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Hostel <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.hostelId}
                          onChange={(value) => {
                            setFormData({
                              ...formData,
                              hostelId: value,
                              floorId: '',
                              roomId: '',
                              bedId: '',
                            });
                          }}
                          options={hostelOptions.filter(opt => opt.value !== '')}
                          placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                          disabled={hostelsLoading}
                        />
                      </div>
                      {formData.hostelId && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Floor <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={formData.floorId}
                              onChange={(value) => {
                                setFormData({
                                  ...formData,
                                  floorId: value,
                                  roomId: '',
                                  bedId: '',
                                });
                              }}
                              options={availableFloors}
                              placeholder={floorsLoading ? "Loading floors..." : "Select Floor"}
                              disabled={floorsLoading}
                            />
                          </div>
                          {formData.floorId && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Room <span className="text-red-500">*</span>
                              </label>
                              <Select
                                value={formData.roomId}
                                onChange={(value) => {
                                  setFormData({
                                    ...formData,
                                    roomId: value,
                                    bedId: '',
                                  });
                                }}
                                options={availableRooms}
                                placeholder={roomsLoading ? "Loading rooms..." : "Select Room"}
                                disabled={roomsLoading}
                              />
                            </div>
                          )}
                          {formData.roomId && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Bed <span className="text-red-500">*</span>
                              </label>
                              <Select
                                value={formData.bedId}
                                onChange={(value) => {
                                  setFormData({
                                    ...formData,
                                    bedId: value,
                                  });
                                }}
                                options={availableBeds}
                                placeholder={bedsLoading ? "Loading beds..." : "Select Available Bed"}
                                disabled={bedsLoading}
                              />
                              {!bedsLoading && availableBeds.length === 0 && (
                                <p className="text-sm text-red-600 mt-2">No available beds in this room.</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Documents */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Documents
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData({ ...formData, documents: file });
                        }}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.documents && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {formData.documents.name}
                        </p>
                      )}
                      {editingId && formData.previousDocuments && formData.previousDocuments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Current Documents:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {formData.previousDocuments.map((doc: any, idx: number) => {
                              const isImage = doc.mimetype?.startsWith('image/') || 
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '');
                              const docUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                              const docName = doc.originalName || doc.filename || 'Document';
                              
                              return (
                                <div
                                  key={doc.id || idx}
                                  className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                                >
                                  {isImage ? (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                        <img
                                          src={docUrl}
                                          alt={docName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                      <div className="p-2 bg-white border-t border-gray-200">
                                        <p className="text-xs text-gray-700 font-medium truncate" title={docName}>
                                          {docName}
                                        </p>
                                      </div>
                                    </a>
                                  ) : (
                                    <a
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-3"
                                    >
                                      <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                      <span className="text-xs text-gray-700 truncate" title={docName}>
                                        {docName}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingId ? 'Update Tenant' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TenantForm;
export type { TenantFormData };

