/**
 * VendorList page with two tabs:
 * 1. Vendor List - Shows vendors filtered by hostel (must select hostel first)
 * 2. Vendor Management - Shows all services and vendor assignments
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  CurrencyDollarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import ROUTES from '../../routes/routePaths';
import { formatCurrency } from '../../types/common';
import vendorsData from '../../mock/vendors.json';
import servicesData from '../../mock/services.json';
import vendorServicesData from '../../mock/vendor-services.json';
import hostelsData from '../../mock/hostels.json';

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
  price?: number; // Optional price field
  unit?: string; // Price unit (per hour, per service, etc.)
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active section from route
  const getActiveSection = (): 'list' | 'management' => {
    if (location.pathname.includes('/vendor/management')) return 'management';
    return 'list'; // Default to list
  };
  
  const activeSection = getActiveSection();
  
  // Redirect to /vendor/list if just /vendor
  useEffect(() => {
    if (location.pathname === ROUTES.VENDOR) {
      navigate(ROUTES.VENDOR_LIST, { replace: true });
    }
  }, [location.pathname, navigate]);
  
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [selectedHostelIdForManagement, setSelectedHostelIdForManagement] = useState<string>('');
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
    
    // Generate dummy prices if not present (for demo purposes)
    const priceMap: Record<string, { price: number; unit: string }> = {
      'Plumbing': { price: 150, unit: 'per hour' },
      'Cleaning Supplies': { price: 500, unit: 'per month' },
      'IT Services': { price: 200, unit: 'per hour' },
      'Landscaping': { price: 300, unit: 'per service' },
      'Security': { price: 2000, unit: 'per month' },
      'HVAC Maintenance': { price: 250, unit: 'per hour' },
      'Linen Supply': { price: 800, unit: 'per month' },
      'Electrical': { price: 175, unit: 'per hour' },
      'Furniture': { price: 5000, unit: 'per order' },
      'General Maintenance': { price: 120, unit: 'per hour' },
      'Pest Control': { price: 400, unit: 'per service' },
      'Web Services': { price: 1000, unit: 'per month' },
    };
    
    return services.map((service) => {
      // Filter assignments by selected hostel if filter is applied
      let serviceAssignments = assignments.filter((a) => a.serviceId === service.id);
      
      // Apply hostel filter if selected
      if (selectedHostelIdForManagement) {
        serviceAssignments = serviceAssignments.filter(
          (a) => String(a.hostelId) === selectedHostelIdForManagement
        );
      }
      
      const priceInfo = priceMap[service.name] || { price: 0, unit: 'per service' };
      return {
        ...service,
        price: service.price || priceInfo.price,
        unit: service.unit || priceInfo.unit,
        assignments: serviceAssignments,
        assignedVendorsCount: serviceAssignments.length,
        assignedVendors: serviceAssignments.map(a => a.vendorName).join(', '),
        hostels: [...new Set(serviceAssignments.map(a => a.hostelName))].join(', '),
      };
    }).filter((service) => {
      // If hostel filter is applied, only show services that have assignments for that hostel
      if (selectedHostelIdForManagement) {
        return service.assignments.length > 0;
      }
      // If no filter, show all services
      return true;
    });
  }, [selectedHostelIdForManagement]);

  // Table columns for Vendor Management
  const vendorManagementColumns: Column<typeof servicesWithVendors[0]>[] = [
    {
      key: 'name',
      label: 'Service Name',
      sortable: true,
      width: '200px',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      width: '250px',
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => (
        <Badge variant="default">{row.category}</Badge>
      ),
      width: '120px',
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">{formatCurrency(row.price || 0)}</span>
          <span className="text-xs text-gray-500 ml-1">({row.unit || 'per service'})</span>
        </div>
      ),
      width: '150px',
    },
    {
      key: 'assignedVendorsCount',
      label: 'Vendors',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{row.assignedVendorsCount}</span>
          <Badge variant={row.assignedVendorsCount > 0 ? 'success' : 'default'}>
            {row.assignedVendorsCount > 0 ? 'Assigned' : 'None'}
          </Badge>
        </div>
      ),
      width: '120px',
    },
    {
      key: 'assignedVendors',
      label: 'Vendor Names',
      sortable: false,
      render: (row) => (
        <div className="max-w-xs">
          {row.assignments.length > 0 ? (
            <div className="space-y-1">
              {row.assignments.slice(0, 2).map((assignment) => (
                <div key={assignment.id} className="text-sm text-gray-700">
                  • {assignment.vendorName}
                </div>
              ))}
              {row.assignments.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{row.assignments.length - 2} more
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No vendors</span>
          )}
        </div>
      ),
      width: '200px',
    },
    {
      key: 'hostels',
      label: 'Hostels',
      sortable: false,
      render: (row) => (
        <div className="max-w-xs">
          {row.assignments.length > 0 ? (
            <div className="space-y-1">
              {[...new Set(row.assignments.map(a => a.hostelName))].slice(0, 2).map((hostel, idx) => (
                <div key={idx} className="flex items-center gap-1 text-sm text-gray-700">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{hostel}</span>
                </div>
              ))}
              {[...new Set(row.assignments.map(a => a.hostelName))].length > 2 && (
                <div className="text-xs text-gray-500">
                  +{[...new Set(row.assignments.map(a => a.hostelName))].length - 2} more
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">-</span>
          )}
        </div>
      ),
      width: '180px',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssignForm({ ...assignForm, serviceId: String(row.id) });
              setIsAssignModalOpen(true);
            }}
            icon={PlusIcon}
          >
            Assign
          </Button>
        </div>
      ),
      width: '120px',
    },
  ];

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
          {/* Add Vendor Button - Only show in Vendor List section */}
          {activeSection === 'list' && (
            <Button
              variant="primary"
              onClick={() => setIsAddVendorModalOpen(true)}
              icon={PlusIcon}
            >
              Add Vendor
            </Button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeSection === 'list' ? (
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
              {/* Header with Filter and Add Button */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
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
                
                {/* Hostel Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Filter by Hostel:
                  </label>
                  <div className="w-64">
                    <Select
                      value={selectedHostelIdForManagement}
                      onChange={(value) => setSelectedHostelIdForManagement(value)}
                      options={hostelOptions}
                    />
                  </div>
                  {selectedHostelIdForManagement && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedHostelIdForManagement('')}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </div>

              {/* Services Table - Table format with all details */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <DataTable
                  columns={vendorManagementColumns}
                  data={servicesWithVendors.map((service) => ({
                    ...service,
                    id: service.id,
                  }))}
                  emptyMessage="No services found. Please add services to get started."
                />
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
