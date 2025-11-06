import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { HostelFormData } from '../types/hostel';

interface AddHostelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HostelFormData) => void;
}

export const AddHostelForm: React.FC<AddHostelFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<HostelFormData>({
    name: '',
    city: '',
    totalFloors: 1,
    roomsPerFloor: 1,
    managerName: '',
    managerPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof HostelFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HostelFormData, string>> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City is required';
    }

    if (formData.totalFloors < 1 || formData.totalFloors > 50) {
      newErrors.totalFloors = 'Must have between 1 and 50 floors';
    }

    if (formData.roomsPerFloor < 1 || formData.roomsPerFloor > 100) {
      newErrors.roomsPerFloor = 'Must have between 1 and 100 rooms per floor';
    }

    if (!formData.managerName || formData.managerName.trim().length < 2) {
      newErrors.managerName = 'Manager name is required';
    }

    if (!formData.managerPhone || !/^\+?[1-9]\d{1,14}$/.test(formData.managerPhone)) {
      newErrors.managerPhone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        city: '',
        totalFloors: 1,
        roomsPerFloor: 1,
        managerName: '',
        managerPhone: '',
        notes: '',
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: '',
      city: '',
      totalFloors: 1,
      roomsPerFloor: 1,
      managerName: '',
      managerPhone: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Hostel"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hostel Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Downtown Hub Hostel"
            className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="New York"
            className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        {/* Floors and Rooms */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Floors <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.totalFloors}
              onChange={(e) =>
                setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 1 })
              }
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
              placeholder="5"
            />
            {errors.totalFloors && (
              <p className="mt-1 text-sm text-red-600">{errors.totalFloors}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rooms per Floor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.roomsPerFloor}
              onChange={(e) =>
                setFormData({ ...formData, roomsPerFloor: parseInt(e.target.value) || 1 })
              }
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
              placeholder="12"
            />
            {errors.roomsPerFloor && (
              <p className="mt-1 text-sm text-red-600">{errors.roomsPerFloor}</p>
            )}
          </div>
        </div>

        {/* Manager Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Manager Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) =>
                setFormData({ ...formData, managerName: e.target.value })
              }
              placeholder="John Doe"
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
            />
            {errors.managerName && (
              <p className="mt-1 text-sm text-red-600">{errors.managerName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Manager Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.managerPhone}
              onChange={(e) =>
                setFormData({ ...formData, managerPhone: e.target.value })
              }
              placeholder="+1-555-0100"
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
            />
            {errors.managerPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.managerPhone}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
            placeholder="Additional information about the hostel..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Create Hostel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

