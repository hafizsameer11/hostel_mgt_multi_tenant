/**
 * CommunicationBoard page
 * Communication management with tab-based filtering - Shows biodata/profiles
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BriefcaseIcon,
  HomeIcon,
  CalendarIcon,
  StarIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import ROUTES from '../../routes/routePaths';
import { Badge } from '../../components/Badge';
import { Select } from '../../components/Select';
import type { Tenant } from '../../types/people';
import type { Employee } from '../../types/people';
import type { Vendor } from '../../types/comms';
import type { Hostel } from '../../types/hostel';
import tenantsData from '../../mock/tenants.json';
import employeesData from '../../mock/employees.json';
import vendorsData from '../../mock/vendors.json';
import accountsData from '../../mock/accounts.json';
import * as hostelService from '../../services/hostel.service';
import { formatDate, formatCurrency } from '../../types/common';

type ActiveTab = 'Tenants' | 'Employees' | 'Vendors';

/**
 * Communication board page - Shows all biodata
 */
const CommunicationBoard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from route
  const getActiveTab = (): ActiveTab => {
    if (location.pathname.includes('/communication/employees')) return 'Employees';
    if (location.pathname.includes('/communication/vendors')) return 'Vendors';
    return 'Tenants'; // Default
  };
  
  const activeTab = getActiveTab();
  
  // Redirect to /communication/tenants if just /communication
  useEffect(() => {
    if (location.pathname === ROUTES.COMM) {
      navigate(ROUTES.COMM_TENANTS, { replace: true });
    }
  }, [location.pathname, navigate]);
  const [hostelFilter, setHostelFilter] = useState('');
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isEmailCampaignOpen, setIsEmailCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    message: '',
  });
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    type: 'Tenant' | 'Employee' | 'Vendor';
    data: any;
  }>({
    isOpen: false,
    type: 'Tenant',
    data: null,
  });

  // Load hostels on component mount
  useEffect(() => {
    const allHostels = hostelService.getAllHostels();
    setHostels(allHostels);
  }, []);

  // Filter data based on hostel
  const filteredTenants = useMemo(() => {
    let data = tenantsData as Tenant[];
    if (hostelFilter) {
      data = data.filter((t) => String(t.hostelId) === hostelFilter);
    }
    return data;
  }, [hostelFilter]);

  const filteredEmployees = useMemo(() => {
    let data = employeesData as Employee[];
    if (hostelFilter) {
      data = data.filter((e) => String(e.hostelId) === hostelFilter);
    }
    return data;
  }, [hostelFilter]);

  const filteredVendors = useMemo(() => {
    let data = vendorsData as Vendor[];
    if (hostelFilter) {
      data = data.filter((v) => String(v.hostelId) === hostelFilter);
    }
    return data;
  }, [hostelFilter]);

  // Prepare hostel options for dropdown
  const hostelOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Hostels' }];
    hostels.forEach((hostel) => {
      options.push({
        value: String(hostel.id),
        label: hostel.name,
      });
    });
    return options;
  }, [hostels]);

  // Get selected hostel name for display
  const selectedHostelName = useMemo(() => {
    if (!hostelFilter) return null;
    const hostel = hostels.find((h) => String(h.id) === hostelFilter);
    return hostel?.name || null;
  }, [hostelFilter, hostels]);

  // Tab counts (for reference, not used in UI anymore - navigation handled by second sidebar)
  const tabCounts = useMemo(() => ({
    Tenants: filteredTenants.length,
    Employees: filteredEmployees.length,
    Vendors: filteredVendors.length,
  }), [filteredTenants, filteredEmployees, filteredVendors]);

  const handleEmailCampaign = () => {
    setIsEmailCampaignOpen(true);
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.subject.trim() || !campaignForm.message.trim()) {
      alert('Please fill in both subject and message fields.');
      return;
    }
    
    console.log('Email Campaign:', campaignForm);
    alert(`Email Campaign Created!\n\nSubject: ${campaignForm.subject}\n\nMessage: ${campaignForm.message}\n\nThis will be sent to all recipients.`);
    
    // Reset form and close modal
    setCampaignForm({ subject: '', message: '' });
    setIsEmailCampaignOpen(false);
  };

  const handleCampaignClose = () => {
    setCampaignForm({ subject: '', message: '' });
    setIsEmailCampaignOpen(false);
  };

  const handleView = (type: 'Tenant' | 'Employee' | 'Vendor', data: any) => {
    setViewModal({ isOpen: true, type, data });
  };

  const handleViewClose = () => {
    setViewModal({ isOpen: false, type: 'Tenant', data: null });
  };

  // Get transactions for tenant (filtered by hostel if selected)
  const getTenantTransactions = useMemo(() => {
    if (!viewModal.data || viewModal.type !== 'Tenant') return [];
    let transactions = accountsData.filter(
      (account) => account.tenantName === viewModal.data.name
    );
    // Apply hostel filter if active
    if (hostelFilter) {
      transactions = transactions.filter((t) => String(t.hostelId) === hostelFilter);
    }
    return transactions;
  }, [viewModal.data, viewModal.type, hostelFilter]);

  // Get transactions for vendor (expenses that might be related, filtered by hostel)
  const getVendorTransactions = useMemo(() => {
    if (!viewModal.data || viewModal.type !== 'Vendor') return [];
    // Match vendor name in expense descriptions
    let transactions = accountsData.filter(
      (account) =>
        account.type === 'Expense' &&
        account.description &&
        account.description.toLowerCase().includes(viewModal.data.name.toLowerCase())
    );
    // Apply hostel filter if active
    if (hostelFilter) {
      transactions = transactions.filter((t) => String(t.hostelId) === hostelFilter);
    }
    return transactions;
  }, [viewModal.data, viewModal.type, hostelFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Communication Directory</h1>
          <p className="text-slate-600 mt-1">
            View biodata and contact information for tenants, employees, and vendors
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleEmailCampaign}
          icon={PaperAirplaneIcon}
        >
          Email Campaign
        </Button>
      </div>

      {/* Hostel Filter - At the top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 border border-white/20 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              Filter by Hostel:
            </label>
            <div className="w-full sm:w-64">
              <Select
                value={hostelFilter}
                onChange={setHostelFilter}
                options={hostelOptions}
                placeholder="Select Hostel"
              />
            </div>
          </div>
          {selectedHostelName && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-100/50 rounded-lg border border-brand-200/50">
              <span className="text-xs text-brand-700 font-medium">Showing:</span>
              <span className="text-sm text-brand-900 font-semibold">{selectedHostelName}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content - No tabs, navigation handled by second sidebar */}
      <div className="glass rounded-2xl border border-white/20 shadow-xl">
        {/* Biodata Cards */}
        <div className="p-6">
          {/* Tenants */}
          {activeTab === 'Tenants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No tenants found for the selected hostel.</p>
                </div>
              ) : (
                filteredTenants.map((tenant, idx) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{tenant.name}</h3>
                      <Badge variant={tenant.status === 'Active' ? 'success' : 'default'}>
                        {tenant.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <PhoneIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">{tenant.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <HomeIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">
                        Room {tenant.room}-{tenant.bed}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CalendarIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">
                        {formatDate(tenant.leaseStart)} - {formatDate(tenant.leaseEnd)}
                      </span>
                    </div>
                  </div>
                  {/* View Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => handleView('Tenant', tenant)}
                      icon={EyeIcon}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
                ))
              )}
            </div>
          )}

          {/* Employees */}
          {activeTab === 'Employees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No employees found for the selected hostel.</p>
                </div>
              ) : (
                filteredEmployees.map((employee, idx) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {employee.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{employee.name}</h3>
                      <Badge variant={employee.status === 'Active' ? 'success' : 'default'}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <BriefcaseIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-semibold">{employee.role}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <EnvelopeIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <PhoneIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CalendarIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Joined: {formatDate(employee.joinedAt)}</span>
                    </div>
                  </div>
                  {/* View Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => handleView('Employee', employee)}
                      icon={EyeIcon}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
                ))
              )}
            </div>
          )}

          {/* Vendors */}
          {activeTab === 'Vendors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No vendors found for the selected hostel.</p>
                </div>
              ) : (
                filteredVendors.map((vendor, idx) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {vendor.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{vendor.name}</h3>
                      <Badge variant={vendor.status === 'Active' ? 'success' : 'default'}>
                        {vendor.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <BriefcaseIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-semibold">{vendor.specialty}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <PhoneIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm">{vendor.phone}</span>
                    </div>
                    {vendor.email && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <EnvelopeIcon className="w-5 h-5 text-purple-500" />
                        <span className="text-sm">{vendor.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600">
                      <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{vendor.rating}/5 Rating</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CalendarIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm">Last Invoice: {formatDate(vendor.lastInvoice)}</span>
                    </div>
                  </div>
                  {/* View Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => handleView('Vendor', vendor)}
                      icon={EyeIcon}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="glass p-6 rounded-2xl border border-white/20 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Directory Summary {selectedHostelName && `- ${selectedHostelName}`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <UserCircleIcon className="w-6 h-6 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Total Tenants</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{filteredTenants.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <BriefcaseIcon className="w-6 h-6 text-green-600" />
              <p className="text-sm font-medium text-green-900">Total Employees</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{filteredEmployees.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <UserCircleIcon className="w-6 h-6 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Total Vendors</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{filteredVendors.length}</p>
          </div>
        </div>
      </div>

      {/* Email Campaign Modal */}
      <Modal
        isOpen={isEmailCampaignOpen}
        onClose={handleCampaignClose}
        title="Create Email Campaign"
        size="lg"
      >
        <form onSubmit={handleCampaignSubmit} className="space-y-6">
          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={campaignForm.subject}
              onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
              placeholder="Enter email subject..."
              className="block w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF] transition-colors"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={campaignForm.message}
              onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
              placeholder="Enter your email message..."
              rows={8}
              className="block w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF] transition-colors resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              This message will be sent to all recipients based on the current tab selection.
            </p>
          </div>

          {/* Recipients Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Recipients:
            </p>
            <p className="text-sm text-blue-700">
              {activeTab === 'Tenants' && `All ${filteredTenants.length} Tenants${selectedHostelName ? ` from ${selectedHostelName}` : ''}`}
              {activeTab === 'Employees' && `All ${filteredEmployees.length} Employees${selectedHostelName ? ` from ${selectedHostelName}` : ''}`}
              {activeTab === 'Vendors' && `All ${filteredVendors.length} Vendors${selectedHostelName ? ` from ${selectedHostelName}` : ''}`}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCampaignClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={PaperAirplaneIcon}
            >
              Send Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={handleViewClose}
        title={`${viewModal.type} Details`}
        size="xl"
      >
        {viewModal.data && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                  viewModal.type === 'Tenant'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : viewModal.type === 'Employee'
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
                }`}
              >
                {viewModal.data.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {viewModal.data.name}
                </h3>
                <Badge
                  variant={
                    viewModal.data.status === 'Active' ? 'success' : 'default'
                  }
                >
                  {viewModal.data.status}
                </Badge>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewModal.type === 'Tenant' && (
                  <>
                    <InfoField label="Email" value={viewModal.data.email} icon={EnvelopeIcon} />
                    <InfoField label="Phone" value={viewModal.data.phone} icon={PhoneIcon} />
                    <InfoField label="Room" value={`${viewModal.data.room}-${viewModal.data.bed}`} icon={HomeIcon} />
                    <InfoField label="Lease Start" value={formatDate(viewModal.data.leaseStart)} icon={CalendarIcon} />
                    <InfoField label="Lease End" value={formatDate(viewModal.data.leaseEnd)} icon={CalendarIcon} />
                  </>
                )}
                {viewModal.type === 'Employee' && (
                  <>
                    <InfoField label="Email" value={viewModal.data.email} icon={EnvelopeIcon} />
                    <InfoField label="Phone" value={viewModal.data.phone} icon={PhoneIcon} />
                    <InfoField label="Role" value={viewModal.data.role} icon={BriefcaseIcon} />
                    <InfoField label="Joined Date" value={formatDate(viewModal.data.joinedAt)} icon={CalendarIcon} />
                  </>
                )}
                {viewModal.type === 'Vendor' && (
                  <>
                    <InfoField label="Email" value={viewModal.data.email || 'N/A'} icon={EnvelopeIcon} />
                    <InfoField label="Phone" value={viewModal.data.phone} icon={PhoneIcon} />
                    <InfoField label="Specialty" value={viewModal.data.specialty} icon={BriefcaseIcon} />
                    <InfoField label="Rating" value={`${viewModal.data.rating}/5`} icon={StarIcon} />
                    <InfoField label="Last Invoice" value={formatDate(viewModal.data.lastInvoice)} icon={CalendarIcon} />
                  </>
                )}
              </div>
            </div>

            {/* Transactions Section - Only for Tenants and Vendors */}
            {(viewModal.type === 'Tenant' || viewModal.type === 'Vendor') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5" />
                  Transactions
                  {viewModal.type === 'Tenant' && (
                    <span className="text-sm font-normal text-gray-500">
                      ({getTenantTransactions.length} transactions)
                    </span>
                  )}
                  {viewModal.type === 'Vendor' && (
                    <span className="text-sm font-normal text-gray-500">
                      ({getVendorTransactions.length} transactions)
                    </span>
                  )}
                </h4>
                {viewModal.type === 'Tenant' && getTenantTransactions.length > 0 && (
                  <div className="space-y-3">
                    {getTenantTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {transaction.type}
                              </span>
                              <Badge
                                variant={
                                  transaction.status === 'Paid'
                                    ? 'success'
                                    : transaction.status === 'Pending'
                                    ? 'warning'
                                    : 'default'
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 ml-8">
                              <p>Ref: {transaction.ref}</p>
                              <p>Date: {formatDate(transaction.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.type === 'Expense' || transaction.type === 'Refund'
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {transaction.type === 'Expense' || transaction.type === 'Refund'
                                ? '-'
                                : '+'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {viewModal.type === 'Tenant' && getTenantTransactions.length === 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500">No transactions found for this tenant.</p>
                  </div>
                )}
                {viewModal.type === 'Vendor' && getVendorTransactions.length > 0 && (
                  <div className="space-y-3">
                    {getVendorTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {transaction.type}
                              </span>
                              <Badge
                                variant={
                                  transaction.status === 'Paid'
                                    ? 'success'
                                    : transaction.status === 'Pending'
                                    ? 'warning'
                                    : 'default'
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 ml-8">
                              <p>Ref: {transaction.ref}</p>
                              <p>Date: {formatDate(transaction.date)}</p>
                              {transaction.description && (
                                <p className="mt-1">Description: {transaction.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">
                              -{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {viewModal.type === 'Vendor' && getVendorTransactions.length === 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500">No transactions found for this vendor.</p>
                  </div>
                )}
              </div>
            )}

            {/* Summary for Tenants */}
            {viewModal.type === 'Tenant' && getTenantTransactions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Total Transactions:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {getTenantTransactions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium text-blue-900">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      getTenantTransactions.reduce(
                        (sum, t) =>
                          sum +
                          (t.type === 'Expense' || t.type === 'Refund'
                            ? -t.amount
                            : t.amount),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Summary for Vendors */}
            {viewModal.type === 'Vendor' && getVendorTransactions.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-900">Total Transactions:</span>
                  <span className="text-lg font-bold text-purple-600">
                    {getVendorTransactions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium text-purple-900">Total Amount:</span>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(
                      getVendorTransactions.reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Helper component for info fields
const InfoField: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

export default CommunicationBoard;

