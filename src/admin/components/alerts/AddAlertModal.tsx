/**
 * Add Alert Modal Component
 * Professional form for creating alerts with same UI pattern as PersonalInfoModal
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellAlertIcon,
  XMarkIcon,
  PaperClipIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Select } from '../Select';
import * as hostelService from '../../services/hostel.service';
import * as alertService from '../../services/alert.service';

export type AlertType = 'bill' | 'rent' | 'payable' | 'receivable' | 'maintenance';
export type MaintenanceType = 'room_cleaning' | 'repairs' | 'purchase_demand';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AlertFormData) => void;
}

export interface AlertFormData {
  title: string;
  description: string;
  priority: Priority;
  type: AlertType;
  maintenanceType?: MaintenanceType;
  hostelId: string;
  roomId: string;
  tenantId?: string;
  amount?: string;
  dueDate: string;
  assignedTo?: string;
  remarks?: string;
  attachment: File | null;
}

export const AddAlertModal: React.FC<AddAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<'alertInfo'>('alertInfo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    description: '',
    priority: 'medium',
    type: 'bill',
    maintenanceType: undefined,
    hostelId: '',
    roomId: '',
    tenantId: '',
    amount: '',
    dueDate: '',
    assignedTo: '',
    remarks: '',
    attachment: null,
  });

  // Hostel and room data
  const [hostelsLoading, setHostelsLoading] = useState(false);
  const [hostelOptions, setHostelOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomOptions, setRoomOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  const [usersLoading, setUsersLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  // Alert type options
  const alertTypeOptions = [
    { value: 'bill', label: 'Bill' },
    { value: 'rent', label: 'Rent' },
    { value: 'payable', label: 'Payable' },
    { value: 'receivable', label: 'Receivable' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  // Maintenance type options
  const maintenanceTypeOptions = [
    { value: 'room_cleaning', label: 'Room Cleaning' },
    { value: 'repairs', label: 'Repairs' },
    { value: 'purchase_demand', label: 'Purchase Demand' },
  ];

  // Load hostels when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHostels();
    } else {
      // Reset form when modal closes
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: 'bill',
        maintenanceType: undefined,
        hostelId: '',
        roomId: '',
        dueDate: '',
        attachment: null,
      });
      setError(null);
      setRoomOptions([]);
      setTenantOptions([]);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: 'bill',
        maintenanceType: undefined,
        hostelId: '',
        roomId: '',
        tenantId: '',
        amount: '',
        dueDate: '',
        assignedTo: '',
        remarks: '',
        attachment: null,
      });
    }
  }, [isOpen]);

  // Load rooms when hostel is selected
  useEffect(() => {
    if (formData.hostelId) {
      loadRoomsByHostel(Number(formData.hostelId));
    } else {
      setRoomOptions([]);
      setFormData(prev => ({ ...prev, roomId: '', tenantId: '' }));
    }
  }, [formData.hostelId]);

  const loadHostels = async () => {
    try {
      setHostelsLoading(true);
      const hostelsData = await hostelService.getAllHostelsFromAPI();
      setHostelOptions(
        hostelsData.map(h => ({
          value: String(h.id),
          label: h.name,
        }))
      );
    } catch (error) {
      console.error('Error loading hostels:', error);
      setHostelOptions([]);
    } finally {
      setHostelsLoading(false);
    }
  };

  const loadRoomsByHostel = async (hostelId: number) => {
    try {
      setRoomsLoading(true);
      const roomsData = await alertService.getRoomsByHostel(hostelId);
      
      setRoomOptions(
        roomsData.map(r => ({
          value: String(r.id),
          label: `Room ${r.roomNumber}`,
        }))
      );
    } catch (error) {
      console.error('Error loading rooms by hostel:', error);
      setRoomOptions([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AlertFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Reset maintenanceType if type is not maintenance
      if (field === 'type' && value !== 'maintenance') {
        updated.maintenanceType = undefined;
      }
      
      // Reset roomId and tenantId if hostelId changes
      if (field === 'hostelId') {
        updated.roomId = '';
        updated.tenantId = '';
      }
      
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate required fields
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    if (!formData.priority) {
      errors.push('Priority is required');
    }
    if (!formData.type) {
      errors.push('Type is required');
    }
    if (formData.type === 'maintenance' && !formData.maintenanceType) {
      errors.push('Maintenance Type is required when Type is Maintenance');
    }
    if (!formData.hostelId) {
      errors.push('Hostel is required');
    }
    if (!formData.roomId) {
      errors.push('Room is required');
    }
    if (!formData.dueDate) {
      errors.push('Due Date is required');
    }

    if (errors.length > 0) {
      setError('Please fill in all required fields:\n' + errors.join('\n'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      onSubmit(formData);
      // Form will be reset by useEffect when modal closes
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
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
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <BellAlertIcon className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-semibold text-white">Add Alert</h2>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('alertInfo')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'alertInfo'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <BellAlertIcon className="w-5 h-5" />
                    <span className="font-medium">Alert Info</span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                {/* Header with Close Button and Add Alert Button */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">ALERT INFO</h3>
                    <span className="block w-12 h-1 bg-pink-500 mt-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Alert'}
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  {/* Error Message */}
                  {error && (
                    <div className="px-6 pt-4">
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="text-sm whitespace-pre-line">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'alertInfo' && (
                      <div className="space-y-6">
                        {/* Title and Priority - Two per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => handleInputChange('title', e.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter alert title"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Priority <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={formData.priority}
                              onChange={(value) => handleInputChange('priority', value as Priority)}
                              options={priorityOptions}
                              placeholder="Select Priority"
                            />
                          </div>
                        </div>

                        {/* Description - Full width textarea */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Enter alert description"
                          />
                        </div>

                        {/* Type and Maintenance Type - Two per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={formData.type}
                              onChange={(value) => handleInputChange('type', value as AlertType)}
                              options={alertTypeOptions}
                              placeholder="Select Type"
                            />
                          </div>
                          {formData.type === 'maintenance' && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Maintenance Type <span className="text-red-500">*</span>
                              </label>
                              <Select
                                value={formData.maintenanceType || ''}
                                onChange={(value) => handleInputChange('maintenanceType', value as MaintenanceType)}
                                options={maintenanceTypeOptions}
                                placeholder="Select Maintenance Type"
                              />
                            </div>
                          )}
                        </div>

                        {/* Hostel and Room - Two per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Hostel <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={formData.hostelId}
                              onChange={(value) => handleInputChange('hostelId', value)}
                              options={hostelOptions}
                              placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                              disabled={hostelsLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Room <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={formData.roomId}
                              onChange={(value) => handleInputChange('roomId', value)}
                              options={roomOptions}
                              placeholder={roomsLoading ? "Loading rooms..." : formData.hostelId ? "Select Room" : "Select Hostel first"}
                              disabled={roomsLoading || !formData.hostelId}
                            />
                          </div>
                        </div>

                        {/* Tenant and Amount - Two per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Tenant
                            </label>
                            <Select
                              value={formData.tenantId || ''}
                              onChange={(value) => handleInputChange('tenantId', value)}
                              options={tenantOptions}
                              placeholder={tenantsLoading ? "Loading tenants..." : "Select Tenant (Optional)"}
                              disabled={tenantsLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={formData.amount || ''}
                              onChange={(e) => handleInputChange('amount', e.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter amount (Optional)"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Due Date and Assigned To - Two per row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Due Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Assigned To
                            </label>
                            <Select
                              value={formData.assignedTo || ''}
                              onChange={(value) => handleInputChange('assignedTo', value)}
                              options={userOptions}
                              placeholder={usersLoading ? "Loading users..." : "Select User (Optional)"}
                              disabled={usersLoading}
                            />
                          </div>
                        </div>

                        {/* Remarks - Full width */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Remarks
                          </label>
                          <textarea
                            value={formData.remarks || ''}
                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Enter remarks (Optional)"
                          />
                        </div>

                        {/* Attachment - Full width */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Attachment
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={handleFileClick}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                              <PaperClipIcon className="w-5 h-5 text-slate-400" />
                              <span className="text-slate-600">
                                {formData.attachment ? formData.attachment.name : 'Choose file'}
                              </span>
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileChange}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          {formData.attachment && (
                            <p className="text-xs text-slate-500 mt-1">
                              Selected: {formData.attachment.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
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
                      disabled={loading}
                      className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

