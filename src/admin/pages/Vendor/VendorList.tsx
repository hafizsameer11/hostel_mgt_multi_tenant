/**
 * VendorList page with two tabs:
 * 1. Vendor List - Shows vendors filtered by hostel (must select hostel first)
 * 2. Vendor Management - Shows all services and vendor assignments
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import vendorsData from '../../mock/vendors.json';
import servicesData from '../../mock/services.json';
import vendorServicesData from '../../mock/vendor-services.json';
import hostelsData from '../../mock/hostels.json';

type TabType = 'list' | 'management';

interface Vendor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  rating: number;
  status: string;
  hostelId?: number;
  hostelName?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface VendorService {
  id: number;
  serviceId: number;
  serviceName: string;
  vendorId: number;
  vendorName: string;
  hostelId: number;
  hostelName: string;
  status: string;
  assignedDate: string;
}

const VendorList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    serviceId: '',
    vendorId: '',
    hostelId: '',
  });
  const [vendorForm, setVendorForm] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    rating: '5',
    status: 'Active',
    hostelId: '',
  });
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });

  // Get hostel options
  const hostelOptions = useMemo(() => [
    { value: '', label: 'Select Hostel' },
    ...(hostelsData as any[]).map((h) => ({
      value: String(h.id),
      label: `${h.name} - ${h.city}`,
    })),
  ], []);

  // Filter vendors by selected hostel (for Vendor List tab)
  const filteredVendors = useMemo(() => {
    if (!selectedHostelId) return [];
    const vendors = vendorsData as Vendor[];
    return vendors.filter((v) => String(v.hostelId) === selectedHostelId);
  }, [selectedHostelId]);

  // Get all services with their assigned vendors (for Vendor Management tab)
  const servicesWithVendors = useMemo(() => {
    const services = servicesData as Service[];
    const assignments = vendorServicesData as VendorService[];
    
    return services.map((service) => {
      const serviceAssignments = assignments.filter((a) => a.serviceId === service.id);
      return {
        ...service,
        assignments: serviceAssignments,
      };
    });
  }, []);

  // Get vendor options for assignment
  const vendorOptions = useMemo(() => {
    const vendors = vendorsData as Vendor[];
    return vendors
      .filter((v) => v.status === 'Active')
      .map((v) => ({
        value: String(v.id),
        label: `${v.name} (${v.specialty})`,
      }));
  }, []);

  // Get service options for assignment
  const serviceOptions = useMemo(() => {
    const services = servicesData as Service[];
    return services.map((s) => ({
      value: String(s.id),
      label: s.name,
    }));
  }, []);

  // Handle vendor assignment
  const handleAssignVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.serviceId || !assignForm.vendorId || !assignForm.hostelId) {
      setToast({
        open: true,
        type: 'error',
        message: 'Please fill in all fields',
      });
      return;
    }

    // In a real app, this would make an API call
    console.log('Assigning vendor:', assignForm);
    
    setToast({
      open: true,
      type: 'success',
      message: 'Vendor assigned to service successfully!',
    });

    setIsAssignModalOpen(false);
    setAssignForm({
      serviceId: '',
      vendorId: '',
      hostelId: '',
    });
  };

  // Handle add vendor form submission
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!vendorForm.name || !vendorForm.specialty || !vendorForm.phone || !vendorForm.email || !vendorForm.hostelId) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please fill in all required fields',
      });
      return;
    }
    
    // Get hostel name
    const selectedHostel = (hostelsData as any[]).find((h) => String(h.id) === vendorForm.hostelId);
    const hostelName = selectedHostel ? `${selectedHostel.name} - ${selectedHostel.city}` : '';
    
    // Create new vendor
    const newVendor: Vendor = {
      id: Date.now(), // In real app, this would come from backend
      name: vendorForm.name,
      specialty: vendorForm.specialty,
      phone: vendorForm.phone,
      email: vendorForm.email,
      rating: parseFloat(vendorForm.rating),
      status: vendorForm.status,
      hostelId: Number(vendorForm.hostelId),
      hostelName: hostelName,
    };
    
    console.log('New Vendor:', newVendor);
    
    setToast({
      open: true,
      type: 'success',
      message: `Vendor "${vendorForm.name}" added successfully!`,
    });
    
    // Reset form
    setVendorForm({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      rating: '5',
      status: 'Active',
      hostelId: '',
    });
    
    setIsAddVendorModalOpen(false);
  };

  // Handle add vendor modal close
  const handleAddVendorClose = () => {
    setIsAddVendorModalOpen(false);
    setVendorForm({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      rating: '5',
      status: 'Active',
      hostelId: '',
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-1">Manage vendors and service assignments</p>
          </div>
          {/* Add Vendor Button - Only show in Vendor List tab */}
          {activeTab === 'list' && (
            <Button
              variant="primary"
              onClick={() => setIsAddVendorModalOpen(true)}
              icon={PlusIcon}
            >
              Add Vendor
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'list'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Vendor List
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'management'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Vendor Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hostel Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-full sm:w-80">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hostel <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={selectedHostelId}
                      onChange={setSelectedHostelId}
                      options={hostelOptions}
                    />
                  </div>
                </div>
                {!selectedHostelId && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please select a hostel to view its vendors.
                    </p>
                  </div>
                )}
              </div>

              {/* Vendor List */}
              {selectedHostelId ? (
                filteredVendors.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vendors Found</h3>
                    <p className="text-gray-600">No vendors are assigned to this hostel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors.map((vendor, idx) => (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                            {vendor.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                            <Badge variant={vendor.status === 'Active' ? 'success' : vendor.status === 'Pending' ? 'warning' : 'default'}>
                              {vendor.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700 mb-4">
                          <div className="flex items-center gap-2">
                            <WrenchScrewdriverIcon className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Specialty:</span> {vendor.specialty}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Phone:</span> {vendor.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Email:</span> {vendor.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Rating:</span> 
                            <span className="font-semibold text-purple-600">{vendor.rating}/5</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="management"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with Add Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Service Management</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage which vendors perform which services</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setIsAssignModalOpen(true)}
                  icon={PlusIcon}
                >
                  Assign Vendor to Service
                </Button>
              </div>

              {/* Services List - Two services per row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servicesWithVendors.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="mt-2">
                          <Badge variant="default">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Vendors */}
                    {service.assignments.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Assigned Vendors:</h4>
                        <div className="space-y-2">
                          {service.assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{assignment.vendorName}</p>
                                <p className="text-xs text-gray-600 truncate">{assignment.hostelName}</p>
                              </div>
                              <div className="ml-2 shrink-0">
                                <Badge variant={assignment.status === 'Active' ? 'success' : 'default'}>
                                  {assignment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                        <p className="text-sm text-gray-500 italic">No vendors assigned to this service</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Assign Vendor Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignForm({ serviceId: '', vendorId: '', hostelId: '' });
        }}
        title="Assign Vendor to Service"
        size="lg"
      >
        <form onSubmit={handleAssignVendor} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <Select
              value={assignForm.serviceId}
              onChange={(value) => setAssignForm({ ...assignForm, serviceId: value })}
              options={serviceOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor <span className="text-red-500">*</span>
            </label>
            <Select
              value={assignForm.vendorId}
              onChange={(value) => setAssignForm({ ...assignForm, vendorId: value })}
              options={vendorOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hostel <span className="text-red-500">*</span>
            </label>
            <Select
              value={assignForm.hostelId}
              onChange={(value) => setAssignForm({ ...assignForm, hostelId: value })}
              options={hostelOptions.filter((opt) => opt.value !== '')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false);
                setAssignForm({ serviceId: '', vendorId: '', hostelId: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={PlusIcon}>
              Assign Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddVendorModalOpen}
        onClose={handleAddVendorClose}
        title="Add New Vendor"
        size="lg"
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vendorForm.name}
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              placeholder="Enter vendor name"
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vendorForm.specialty}
              onChange={(e) => setVendorForm({ ...vendorForm, specialty: e.target.value })}
              placeholder="e.g., Plumbing, Cleaning, IT Services"
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Phone and Email Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                placeholder="+1-555-0000"
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                placeholder="vendor@example.com"
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          {/* Hostel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hostel <span className="text-red-500">*</span>
            </label>
            <Select
              value={vendorForm.hostelId}
              onChange={(value) => setVendorForm({ ...vendorForm, hostelId: value })}
              options={hostelOptions.filter((opt) => opt.value !== '')} // Remove "Select Hostel" option
            />
          </div>

          {/* Rating and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <Select
                value={vendorForm.rating}
                onChange={(value) => setVendorForm({ ...vendorForm, rating: value })}
                options={[
                  { value: '1', label: '1 Star' },
                  { value: '2', label: '2 Stars' },
                  { value: '3', label: '3 Stars' },
                  { value: '4', label: '4 Stars' },
                  { value: '5', label: '5 Stars' },
                ]}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={vendorForm.status}
                onChange={(value) => setVendorForm({ ...vendorForm, status: value })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddVendorClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );
};

export default VendorList;
