/**
 * New User Modal Component
 * Extracted from SettingsForm for reusability
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  XMarkIcon,
  IdentificationIcon,
  MapPinIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import type { NewUserModalProps, NewUserFormData } from '../../types/settings';

export const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, userData, isEdit = false }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'address'>('personal');
  const [formData, setFormData] = useState<NewUserFormData>({
    firstName: '',
    middleInitial: '',
    lastName: '',
    company: '',
    jobTitle: '',
    loginEmail: '',
    userRole: '',
    phones: [
      { id: '1', type: 'Mobile', number: '' },
    ],
    emails: [
      { id: '1', type: 'Primary', email: '' },
    ],
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  // Load user data when editing
  useEffect(() => {
    if (isOpen) {
      if (userData && isEdit) {
        setFormData(userData);
      } else {
        // Reset form for new user
        setFormData({
          firstName: '',
          middleInitial: '',
          lastName: '',
          company: '',
          jobTitle: '',
          loginEmail: '',
          userRole: '',
          phones: [
            { id: '1', type: 'Mobile', number: '' },
          ],
          emails: [
            { id: '1', type: 'Primary', email: '' },
          ],
          street1: '',
          street2: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
        });
        setActiveTab('personal');
      }
    }
  }, [isOpen, userData, isEdit]);

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
    if (!formData.loginEmail.trim()) {
      errors.push('Login Email Address is required');
    }
    if (!formData.userRole.trim()) {
      errors.push('User Role is required');
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
        loginEmail: formData.loginEmail,
        userRole: formData.userRole,
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
        street2: formData.street2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
    };
    
    // Single API call to save all data
    console.log('Submitting new user data:', unifiedFormData);
    
    // TODO: Replace with actual API call
    // Example:
    // try {
    //   await fetch('/api/users', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(unifiedFormData),
    //   });
    //   // Handle success
    // } catch (error) {
    //   // Handle error
    // }
    
    // For now, save to localStorage as backup
    try {
      localStorage.setItem('newUserData', JSON.stringify(unifiedFormData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
    
    onClose();
  };

  const handleInputChange = (field: keyof NewUserFormData, value: string) => {
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

  const handleEmailChange = (id: string, field: 'type' | 'email', value: string) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.map((email) =>
        email.id === id ? { ...email, [field]: value } : email
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
      emails: [...prev.emails, { id: Date.now().toString(), type: 'Primary', email: '' }],
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
                    <UserPlusIcon className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit User' : 'New User'}</h2>
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
                        <div className="col-span-5">
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
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            M.I.
                          </label>
                          <input
                            type="text"
                            value={formData.middleInitial}
                            onChange={(e) => handleInputChange('middleInitial', e.target.value)}
                            maxLength={1}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-5">
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

                      {/* Company and Job Title */}
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

                      {/* Login Email Address */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Login Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.loginEmail}
                          onChange={(e) => handleInputChange('loginEmail', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <p className="mt-1 text-sm text-slate-600">
                          This is the email address they will use to login to DoorLoop.{' '}
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            Change Email
                          </button>
                        </p>
                      </div>

                      {/* User Role */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          User Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.userRole}
                          onChange={(e) => handleInputChange('userRole', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a role</option>
                          <option value="Full Access">Full Access</option>
                          <option value="General Staff">General Staff</option>
                          <option value="Maintenance Team">Maintenance Team</option>
                          <option value="Property Owners">Property Owners</option>
                        </select>
                        <p className="mt-1 text-sm text-slate-600">
                          What parts of DoorLoop they can access.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contact' && (
                    <div className="space-y-8">
                      {/* Phone Section */}
                      <div className="bg-slate-100 p-6 rounded-lg">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Phone</h4>
                        <div className="space-y-4">
                          {formData.phones.map((phone) => (
                            <div key={phone.id} className="flex gap-4 items-end">
                              <div className="w-32">
                                <select
                                  value={phone.type}
                                  onChange={(e) => handlePhoneChange(phone.id, 'type', e.target.value)}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                  <option value="Mobile">Mobile</option>
                                  <option value="Home">Home</option>
                                  <option value="Work">Work</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="flex-1">
                                <input
                                  type="tel"
                                  value={phone.number}
                                  onChange={(e) => handlePhoneChange(phone.id, 'number', e.target.value)}
                                  placeholder="Phone"
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                          <button
                            type="button"
                            onClick={addPhone}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            + Add Another
                          </button>
                        </div>
                      </div>

                      {/* Email Section */}
                      <div className="bg-slate-100 p-6 rounded-lg">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Email</h4>
                        <div className="space-y-4">
                          {formData.emails.map((email) => (
                            <div key={email.id} className="flex gap-4 items-end">
                              <div className="w-32">
                                <select
                                  value={email.type}
                                  onChange={(e) => handleEmailChange(email.id, 'type', e.target.value)}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                  <option value="Primary">Primary</option>
                                  <option value="Secondary">Secondary</option>
                                  <option value="Work">Work</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="flex-1">
                                <input
                                  type="email"
                                  value={email.email}
                                  onChange={(e) => handleEmailChange(email.id, 'email', e.target.value)}
                                  placeholder="Email"
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                              {formData.emails.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEmail(email.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addEmail}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            + Add Another
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'address' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-6">
                          {/* Street 1 */}
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

                          {/* Country */}
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
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                          {/* Street 2 */}
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

