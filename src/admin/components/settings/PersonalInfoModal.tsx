/**
 * Personal Information Modal Component
 * Extracted from SettingsForm for reusability
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  XMarkIcon,
  IdentificationIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import type { PersonalInfoModalProps, PersonalInfoFormData } from '../../types/settings';

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'address'>('personal');
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    firstName: 'Darrel',
    middleInitial: '',
    lastName: 'Wilson',
    company: 'Darrel Wilson',
    jobTitle: 'Influencer',
    joinReason: 'Other',
    goals: 'Research',
    accountingExperience: '5',
    phones: [
      { id: '1', type: 'Mobile', number: '(702) 630-0989' },
    ],
    emails: [],
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate required fields
    const errors: string[] = [];
    
    // Personal Info validation
    if (!formData.firstName.trim()) {
      errors.push('First Name is required');
    }
    if (!formData.lastName.trim()) {
      errors.push('Last Name is required');
    }
    
    // Address validation
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
    
    // Prepare unified data object for single API call
    const unifiedFormData = {
      // Personal Information
      personalInfo: {
        firstName: formData.firstName,
        middleInitial: formData.middleInitial,
        lastName: formData.lastName,
        company: formData.company,
        jobTitle: formData.jobTitle,
        profilePicture: formData.profilePicture,
      },
      // Contact Information
      contactInfo: {
        phones: formData.phones,
        emails: formData.emails,
      },
      // Address Information
      address: {
        street1: formData.street1,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
    };
    
    // Single API call to save all data
    console.log('Submitting unified form data:', unifiedFormData);
    
    // For now, save to localStorage as backup
    try {
      localStorage.setItem('personalInfoData', JSON.stringify(unifiedFormData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
    
    onClose();
  };

  const handleInputChange = (field: keyof PersonalInfoFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (id: string, field: 'type' | 'number', value: string) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.map((phone) =>
        phone.id === id ? { ...phone, [field]: value } : phone
      ),
    }));
  };

  const handleEmailChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.map((email) =>
        email.id === id ? { ...email, email: value } : email
      ),
    }));
  };

  const addPhone = () => {
    setFormData((prev) => ({
      ...prev,
      phones: [...prev.phones, { id: Date.now().toString(), type: 'Mobile', number: '' }],
    }));
  };

  const removePhone = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.filter((phone) => phone.id !== id),
    }));
  };

  const addEmail = () => {
    setFormData((prev) => ({
      ...prev,
      emails: [...prev.emails, { id: Date.now().toString(), email: '' }],
    }));
  };

  const removeEmail = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((email) => email.id !== id),
    }));
  };

  const sidebarItems = [
    { id: 'personal' as const, label: 'Personal Info', icon: UserCircleIcon },
    { id: 'contact' as const, label: 'Contact Info', icon: IdentificationIcon },
    { id: 'address' as const, label: 'Address', icon: MapPinIcon },
  ];

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
                    <UserCircleIcon className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-semibold text-white">Personal Info</h2>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-4 space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {activeTab === 'personal' && 'PERSONAL INFO'}
                      {activeTab === 'contact' && 'CONTACT INFO'}
                      {activeTab === 'address' && 'ADDRESS'}
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

                {/* Form Content - All forms are part of one unified form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {formData.profilePicture ? (
                              <img
                                src={formData.profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserCircleIcon className="w-16 h-16 text-slate-400" />
                            )}
                          </div>
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {/* company and job info */}
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        </div>
                        <div className="col-span-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contact' && (
                    <div className="space-y-8">
                      {/* Phone Section */}
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Phone</h4>
                        <div className="space-y-4">
                          {formData.phones.map((phone) => (
                            <div key={phone.id} className="flex gap-4 items-end">
                              <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1">
                                  Phone
                                </label>
                                <input
                                  type="tel"
                                  value={phone.number}
                                  onChange={(e) => handlePhoneChange(phone.id, 'number', e.target.value)}
                                  placeholder="(702) 630-0989"
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {formData.phones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePhone(phone.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'address' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-6">
                          {/* country */}
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

                          {/* City */}
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

                          {/* street 1 */}
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
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                          {/* State */}
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

                          {/* Zip Code */}
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
                  )}

                 
                  </div>

                  {/* Footer Buttons - Part of unified form */}
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

