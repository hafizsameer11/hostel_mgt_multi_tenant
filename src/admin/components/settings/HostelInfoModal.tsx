/**
 * Hostel Info Modal Component
 * Extracted from SettingsForm for reusability
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { HostelInfoModalProps, HostelInfoFormData } from '../../types/settings';

export const HostelInfoModal: React.FC<HostelInfoModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<HostelInfoFormData>({
    companyName: 'Darrel Wilson',
    primaryEmail: 'pchoarder@gmail.com',
    primaryPhone: '(702) 630-0989',
    street1: '4350 S Hualapai Way',
    street2: '',
    city: 'Las Vegas',
    state: 'NV',
    country: 'United States',
    zipCode: '89147',
    companyWebsite: '',
  });

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

  const handleInputChange = (field: keyof HostelInfoFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: string[] = [];
    
    if (!formData.companyName.trim()) {
      errors.push('Company Name is required');
    }
    if (!formData.street1.trim()) {
      errors.push('Street 1 is required');
    }
    if (!formData.city.trim()) {
      errors.push('City is required');
    }
    if (!formData.country.trim()) {
      errors.push('Country is required');
    }
    if (!formData.zipCode.trim()) {
      errors.push('Zip code is required');
    }

    if (errors.length > 0) {
      alert('Please fill in all required fields:\n' + errors.join('\n'));
      return;
    }

    // Prepare data for API call
    const hostelInfoData = {
      companyName: formData.companyName,
      primaryEmail: formData.primaryEmail,
      primaryPhone: formData.primaryPhone,
      address: {
        street1: formData.street1,
        street2: formData.street2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
      },
      companyWebsite: formData.companyWebsite,
      logo: formData.logo,
    };

    console.log('Submitting hostel info:', hostelInfoData);

    // TODO: Replace with actual API call
    // try {
    //   await fetch('/api/hostel-info', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(hostelInfoData),
    //   });
    // } catch (error) {
    //   console.error('Failed to save hostel info:', error);
    // }

    // Save to localStorage as backup
    try {
      localStorage.setItem('hostelInfoData', JSON.stringify(hostelInfoData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    onClose();
  };

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
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-semibold text-white">Hostel Info</h2>
                  </div>
                </div>

                {/* Navigation - Single Item */}
                <div className="flex-1 p-4">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span className="font-medium">Hostel Info</span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">GENERAL INFO</h3>
                    <span className="block w-12 h-1 bg-pink-500 mt-1" />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-600" />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      {/* Company Logo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Company Logo
                        </label>
                        <div className="relative w-48 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-100">
                          {formData.logo ? (
                            <>
                              <img
                                src={formData.logo}
                                alt="Company Logo"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleInputChange('logo', '')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center">
                              <BuildingOfficeIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                              <p className="text-xs text-slate-500">Upload Logo</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Company Name and Primary Email Address - One Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Primary Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.primaryEmail}
                            onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Primary Phone Number and Company Website - One Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Primary Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.primaryPhone}
                            onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Company Website
                          </label>
                          <input
                            type="url"
                            value={formData.companyWebsite}
                            onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Address Fields - Two Column Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Street 1 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.street1}
                            onChange={(e) => handleInputChange('street1', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        {/* Column 2 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Street 2
                          </label>
                          <input
                            type="text"
                            value={formData.street2}
                            onChange={(e) => handleInputChange('street2', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* City and State - Two Column Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        {/* Column 2 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Country and Zip Code - Two Column Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        {/* Column 2 */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Zip code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.zipCode}
                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                    </div>
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
                      Save
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

