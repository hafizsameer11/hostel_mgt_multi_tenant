/**
 * HostelCreate page
 * Create new hostel with form validation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Toast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import type { ToastType } from '../../types/common';
import ROUTES from '../../routes/routePaths';
import { api } from '../../../services/apiClient';
import { API_ROUTES } from '../../../services/api.config';

// Zod validation schema for the new API format
const hostelSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  contactInfo: z.object({
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Invalid email address'),
  }),
  address: z.object({
    country: z.string().min(2, 'Country is required'),
    state: z.string().min(2, 'State is required'),
    city: z.string().min(2, 'City is required'),
    street: z.string().min(1, 'Street is required'),
  }),
  description: z.string().optional(),
  category: z.enum(['luxury', 'back_pack', 'home2']),
  type: z.enum(['boy', 'girl', 'family', 'mixed']),
  operatingHours: z.object({
    checkIn: z.string().min(1, 'Check-in time is required'),
    checkOut: z.string().min(1, 'Check-out time is required'),
  }),
});

type HostelFormData = z.infer<typeof hostelSchema>;

/**
 * Hostel create page
 */
const HostelCreate: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });
  const [showAddRoomsPrompt, setShowAddRoomsPrompt] = useState(false);
  const [createdHostelId, setCreatedHostelId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HostelFormData>({
    resolver: zodResolver(hostelSchema),
    defaultValues: {
      contactInfo: {
        phone: '',
        email: '',
      },
      address: {
        country: '',
        state: '',
        city: '',
        street: '',
      },
      operatingHours: {
        checkIn: '9:00AM',
        checkOut: '6:00PM',
      },
    },
  });

  const onSubmit = async (data: HostelFormData) => {
    try {
      console.log('📡 Sending hostel creation request:', data);
      
      // Make API call
      const response = await api.post(API_ROUTES.HOSTEL.CREATE, data);
      
      console.log('✅ Hostel created successfully:', response);
      
      if (response.success && response.data) {
        const hostelId = response.data.id;
        setCreatedHostelId(hostelId);
        setToast({
          open: true,
          type: 'success',
          message: response.message || 'Hostel created successfully!',
        });
        // Show prompt to add rooms
        setShowAddRoomsPrompt(true);
      } else {
        throw new Error(response.message || 'Failed to create hostel');
      }
    } catch (error: any) {
      console.error('❌ Error creating hostel:', error);
      setToast({
        open: true,
        type: 'error',
        message: error.message || 'Failed to create hostel. Please try again.',
      });
    }
  };

  const handleAddRooms = () => {
    if (createdHostelId) {
      navigate(`/admin/hostel/${createdHostelId}`, {
        state: { showAddRoom: true },
      });
    }
    setShowAddRoomsPrompt(false);
  };

  const handleSkipRooms = () => {
    setShowAddRoomsPrompt(false);
    setTimeout(() => navigate(ROUTES.HOSTEL), 300);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(ROUTES.HOSTEL)}
          className="text-brand-600 hover:text-brand-700 mb-4 inline-flex items-center gap-2"
        >
          ← Back to Hostels
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Create New Hostel</h1>
        <p className="text-slate-600 mt-1">Add a new hostel property</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hostel Name *
          </label>
          <input
            {...register('name')}
            type="text"
            className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Star Hostel"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone *
              </label>
              <input
                {...register('contactInfo.phone')}
                type="tel"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="3243534"
              />
              {errors.contactInfo?.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactInfo.phone.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                {...register('contactInfo.email')}
                type="email"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="info@gmail.com"
              />
              {errors.contactInfo?.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactInfo.email.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Address</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country *
              </label>
              <input
                {...register('address.country')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Pakistan"
              />
              {errors.address?.country && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.country.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                State *
              </label>
              <input
                {...register('address.state')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Punjab"
              />
              {errors.address?.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.state.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                City *
              </label>
              <input
                {...register('address.city')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Faisalabad"
              />
              {errors.address?.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.city.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Street *
              </label>
              <input
                {...register('address.street')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Street no 1"
              />
              {errors.address?.street && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.street.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Add new hostel"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Category and Type */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <select
              {...register('category')}
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select Category</option>
              <option value="luxury">Luxury</option>
              <option value="back_pack">Back Pack</option>
              <option value="home2">Home2</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type *
            </label>
            <select
              {...register('type')}
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select Type</option>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
              <option value="family">Family</option>
              <option value="mixed">Mixed</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Operating Hours</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Check-In Time *
              </label>
              <input
                {...register('operatingHours.checkIn')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="9:00AM"
              />
              {errors.operatingHours?.checkIn && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.operatingHours.checkIn.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Check-Out Time *
              </label>
              <input
                {...register('operatingHours.checkOut')}
                type="text"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="6:00PM"
              />
              {errors.operatingHours?.checkOut && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.operatingHours.checkOut.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Hostel'}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOSTEL)}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Toast notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      {/* Add Rooms Prompt Modal */}
      <Modal
        isOpen={showAddRoomsPrompt}
        onClose={handleSkipRooms}
        title="Hostel Created Successfully!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Do you want to add rooms for this hostel now?
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              onClick={handleAddRooms}
              className="flex-1"
            >
              Yes, Add Rooms
            </Button>
            <Button
              variant="outline"
              onClick={handleSkipRooms}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HostelCreate;
