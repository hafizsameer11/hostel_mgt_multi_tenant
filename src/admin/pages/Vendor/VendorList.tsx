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
  MapPinIcon,
  UserCircleIcon,
  XMarkIcon
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
import * as hostelService from '../../services/hostel.service';
import { api } from '../../../services/apiClient';
import { API_ROUTES } from '../../../services/api.config';

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
  const [hostels, setHostels] = useState<Array<{ id: number; name: string; city: string }>>([]);
  const [hostelsLoading, setHostelsLoading] = useState<boolean>(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    serviceId: '',
    vendorId: '',
    hostelId: '',
  });
  const [activeTab, setActiveTab] = useState<'vendorInfo' | 'vendorService'>('vendorInfo');
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    country: '',
    city: '',
    street: '',
    category: '',
    specialties: [{ id: '1', name: '' }],
    rating: '4.5',
    hostelId: '',
    paymentTerms: 'prepaid',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });

  // Fetch hostels from API on component mount
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setHostelsLoading(true);
        const hostelsData = await hostelService.getAllHostelsFromAPI();
        setHostels(hostelsData);
      } catch (err: any) {
        console.error('Error fetching hostels:', err);
        setHostels([]);
      } finally {
        setHostelsLoading(false);
      }
    };

    fetchHostels();
  }, []);

  // Get hostel options
  const hostelOptions = useMemo(() => {
    if (hostelsLoading) {
      return [{ value: '', label: 'Loading hostels...' }];
    }
    return [
      { value: '', label: 'Select Hostel' },
      ...hostels.map((h) => ({
        value: String(h.id),
        label: `${h.name} - ${h.city}`,
      })),
    ];
  }, [hostels, hostelsLoading]);

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
  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: string[] = [];
    if (!vendorForm.name.trim()) errors.push('Vendor name is required');
    if (!vendorForm.email.trim()) errors.push('Email is required');
    if (!vendorForm.phone.trim()) errors.push('Phone is required');
    if (!vendorForm.companyName.trim()) errors.push('Company name is required');
    if (!vendorForm.country.trim()) errors.push('Country is required');
    if (!vendorForm.city.trim()) errors.push('City is required');
    if (!vendorForm.category.trim()) errors.push('Category is required');
    if (vendorForm.specialties.length === 0 || vendorForm.specialties.some(s => !s.name.trim())) {
      errors.push('At least one specialty service name is required');
    }
    if (!vendorForm.hostelId) errors.push('Hostel is required');
    
    if (errors.length > 0) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please fill in all required fields:\n' + errors.join('\n'),
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare request payload according to API specification
      const requestPayload: any = {
        name: vendorForm.name.trim(),
        companyName: vendorForm.companyName.trim(),
        email: vendorForm.email.trim(),
        phone: vendorForm.phone.trim(),
        specialty: vendorForm.category.trim(), // Using category as specialty
        services: vendorForm.specialties.map(s => s.name.trim()).filter(Boolean),
        address: {
          country: vendorForm.country.trim(),
          city: vendorForm.city.trim(),
        },
        paymentTerms: vendorForm.paymentTerms,
        hostelId: Number(vendorForm.hostelId),
      };

      // Add optional fields only if they have values
      if (vendorForm.rating && vendorForm.rating.trim()) {
        const ratingValue = parseFloat(vendorForm.rating);
        if (!isNaN(ratingValue)) {
          requestPayload.rating = ratingValue;
        }
      }

      console.log('📡 Sending vendor creation request:', requestPayload);
      
      // Make API call
      const response = await api.post(API_ROUTES.VENDOR.CREATE, requestPayload);
      
      console.log('✅ Vendor created successfully:', response);
      
      if (response.success && response.data) {
        setToast({
          open: true,
          type: 'success',
          message: response.message || `Vendor "${vendorForm.name}" created successfully!`,
        });
        
        // Reset form
        setVendorForm({
          name: '',
          email: '',
          phone: '',
          companyName: '',
          country: '',
          city: '',
          street: '',
          category: '',
          specialties: [{ id: '1', name: '' }],
          rating: '4.5',
          hostelId: '',
          paymentTerms: 'prepaid',
        });
        setActiveTab('vendorInfo');
        
        setIsAddVendorModalOpen(false);
        
        // Optionally refresh the vendor list here if needed
        // You might want to refetch vendors or update the local state
      } else {
        throw new Error(response.message || 'Failed to create vendor');
      }
    } catch (error: any) {
      console.error('❌ Error creating vendor:', error);
      setToast({
        open: true,
        type: 'error',
        message: error.message || 'Failed to create vendor. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add vendor modal close
  const handleAddVendorClose = () => {
    setIsAddVendorModalOpen(false);
    setVendorForm({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      country: '',
      city: '',
      street: '',
      category: '',
      specialties: [{ id: '1', name: '' }],
      rating: '4.5',
      hostelId: '',
      paymentTerms: 'prepaid',
    });
    setActiveTab('vendorInfo');
  };

  // Handle specialty service changes
  const handleSpecialtyChange = (id: string, value: string) => {
    setVendorForm((prev) => ({
      ...prev,
      specialties: prev.specialties.map((s) =>
        s.id === id ? { ...s, name: value } : s
      ),
    }));
  };

  const addSpecialty = () => {
    setVendorForm((prev) => ({
      ...prev,
      specialties: [...prev.specialties, { id: Date.now().toString(), name: '' }],
    }));
  };

  const removeSpecialty = (id: string) => {
    setVendorForm((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s.id !== id),
    }));
  };

  // Get category options from services
  const categoryOptions = useMemo(() => {
    const services = servicesData as Service[];
    const categories = [...new Set(services.map((s) => s.category))];
    return [
      { value: '', label: 'Select Category' },
      ...categories.map((cat) => ({ value: cat, label: cat })),
    ];
  }, []);

  // Effect to handle body overflow when modal is open
  useEffect(() => {
    if (isAddVendorModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddVendorModalOpen]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-1">Manage vendors and service assignments</p>
          </div>
          <div className="flex items-center gap-3 sm:mt-0 mt-2">
            {/* Hostel Filter - Right side of heading (only for Vendor List section) */}
            {activeSection === 'list' && (
              <>
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Filter by Hostel:
                </label>
                <div className="w-64">
                  <Select
                    value={selectedHostelId}
                    onChange={setSelectedHostelId}
                    options={hostelOptions}
                    disabled={hostelsLoading}
                  />
                </div>
              </>
            )}
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
              {/* Warning message if no hostel selected */}
              {!selectedHostelId && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please select a hostel to view its vendors.
                  </p>
                </div>
              )}

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
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Service Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage which vendors perform which services</p>
                  </div>
                  <div className="flex items-center gap-3 sm:mt-0 mt-2">
                    {/* Hostel Filter - Right side of heading */}
                    <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                      Filter by Hostel:
                    </label>
                    <div className="w-64">
                      <Select
                        value={selectedHostelIdForManagement}
                        onChange={(value) => setSelectedHostelIdForManagement(value)}
                        options={hostelOptions}
                        disabled={hostelsLoading}
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
                    <Button
                      variant="primary"
                      onClick={() => setIsAssignModalOpen(true)}
                      icon={PlusIcon}
                    >
                      Assign Vendor to Service
                    </Button>
                  </div>
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
              disabled={hostelsLoading}
              placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
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

      {/* Add Vendor Modal - Tabbed Interface */}
      <AnimatePresence>
        {isAddVendorModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAddVendorClose}
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
                      <h2 className="text-lg font-semibold text-white">Vendor Info</h2>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 p-4 space-y-2">
                    <button
                      onClick={() => setActiveTab('vendorInfo')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'vendorInfo'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Vendor Info</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('vendorService')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'vendorService'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <WrenchScrewdriverIcon className="w-5 h-5" />
                      <span className="font-medium">Vendor Service</span>
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {activeTab === 'vendorInfo' && 'VENDOR INFO'}
                        {activeTab === 'vendorService' && 'VENDOR SERVICE'}
                      </h3>
                      <span className="block w-12 h-1 bg-pink-500 mt-1" />
                    </div>
                    <button
                      onClick={handleAddVendorClose}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-slate-600" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <form onSubmit={handleAddVendor} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                      {activeTab === 'vendorInfo' && (
                        <div className="space-y-6">
                          {/* Vendor Name */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Vendor Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={vendorForm.name}
                              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                              placeholder="Enter vendor name"
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>

                          {/* Email and Phone Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={vendorForm.email}
                                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                                placeholder="vendor@example.com"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Phone <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                value={vendorForm.phone}
                                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                                placeholder="03001234567"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>

                          {/* Company Name */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={vendorForm.companyName}
                              onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                              placeholder="Enter company name"
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>

                          {/* Address Fields */}
                          <div className="space-y-6">
                            {/* Country and City Row */}
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Country <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={vendorForm.country}
                                  onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })}
                                  placeholder="Enter country"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  City <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={vendorForm.city}
                                  onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                                  placeholder="Enter city"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                              </div>
                            </div>

                            {/* Street and Hostel Row */}
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Street <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={vendorForm.street}
                                  onChange={(e) => setVendorForm({ ...vendorForm, street: e.target.value })}
                                  placeholder="Enter street address"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Hostel <span className="text-red-500">*</span>
                                </label>
                                <Select
                                  value={vendorForm.hostelId}
                                  onChange={(value) => setVendorForm({ ...vendorForm, hostelId: value })}
                                  options={hostelOptions.filter((opt) => opt.value !== '')}
                                  disabled={hostelsLoading}
                                  placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Rating and Payment Terms Row */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Rating
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="1"
                                max="5"
                                value={vendorForm.rating}
                                onChange={(e) => setVendorForm({ ...vendorForm, rating: e.target.value })}
                                placeholder="4.5"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Payment Terms
                              </label>
                              <Select
                                value={vendorForm.paymentTerms}
                                onChange={(value) => setVendorForm({ ...vendorForm, paymentTerms: value })}
                                options={[
                                  { value: 'prepaid', label: 'Prepaid' },
                                  { value: 'cod', label: 'Cash on Delivery (COD)' },
                                  { value: 'net15', label: 'Net 15' },
                                  { value: 'net30', label: 'Net 30' },
                                  { value: 'net45', label: 'Net 45' },
                                  { value: 'net60', label: 'Net 60' },
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'vendorService' && (
                        <div className="space-y-6">
                          {/* Category */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={vendorForm.category}
                              onChange={(value) => setVendorForm({ ...vendorForm, category: value })}
                              options={categoryOptions}
                            />
                          </div>

                          {/* Specialty Services */}
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-4">Specialty Services</h4>
                            <div className="space-y-4">
                              {vendorForm.specialties.map((specialty) => (
                                <div key={specialty.id} className="flex gap-4 items-end">
                                  <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">
                                      Service Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={specialty.name}
                                      onChange={(e) => handleSpecialtyChange(specialty.id, e.target.value)}
                                      placeholder="e.g., Plumbing, Cleaning, IT Services"
                                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                  {vendorForm.specialties.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeSpecialty(specialty.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={addSpecialty}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Add New Service
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleAddVendorClose}
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
