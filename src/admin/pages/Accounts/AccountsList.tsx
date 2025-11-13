/**
 * AccountsList page
 * Financial transactions and account management with Payable/Receivable tabs
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ROUTES from '../../routes/routePaths';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { SearchInput } from '../../components/SearchInput';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import type { Transaction } from '../../types/accounts';
import type { Hostel } from '../../types/hostel';
import { formatDate, formatCurrency } from '../../types/common';
import accountsData from '../../mock/accounts.json';
import vendorsData from '../../mock/vendors.json';
import * as hostelService from '../../services/hostel.service';
import {
  CurrencyDollarIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  PencilIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

type MainTab = 'Payable' | 'Receivable';
type PayableSubTab = 'All' | 'Bills' | 'Vendor' | 'Laundry';
type ReceivableSubTab = 'All' | 'Received';
type ReceivableCategory = 'Rent' | 'Deposit';

/**
 * Accounts list page with Payable/Receivable tabs
 */
const AccountsList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active sections from route
  const getActiveMainTab = (): MainTab => {
    if (location.pathname.includes('/accounts/receivable')) return 'Receivable';
    return 'Payable'; // Default to Payable
  };
  
  const getActivePayableTab = (): PayableSubTab => {
    if (location.pathname.includes('/accounts/payable/bills')) return 'Bills';
    if (location.pathname.includes('/accounts/payable/vendor')) return 'Vendor';
    if (location.pathname.includes('/accounts/payable/laundry')) return 'Laundry';
    if (location.pathname.includes('/accounts/payable/all')) return 'All';
    if (location.pathname === ROUTES.ACCOUNTS_PAYABLE) return 'All'; // Default to All when just /payable
    return 'All'; // Default
  };
  
  const getActiveReceivableTab = (): ReceivableSubTab => {
    if (location.pathname.includes('/accounts/receivable/received')) return 'Received';
    return 'All'; // Default
  };
  
  const activeMainTab = getActiveMainTab();
  const activePayableTab = getActivePayableTab();
  const activeReceivableTab = getActiveReceivableTab();
  
  // Redirect to /accounts/payable/all if just /accounts or /accounts/payable
  useEffect(() => {
    if (location.pathname === ROUTES.ACCOUNTS) {
      navigate(ROUTES.ACCOUNTS_PAYABLE_ALL, { replace: true });
    } else if (location.pathname === ROUTES.ACCOUNTS_PAYABLE) {
      navigate(ROUTES.ACCOUNTS_PAYABLE_ALL, { replace: true });
    }
  }, [location.pathname, navigate]);
  const [activeReceivableCategory, setActiveReceivableCategory] = useState<ReceivableCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editStatusForm, setEditStatusForm] = useState<{ status: Transaction['status'] }>({
    status: 'Pending',
  });
  // Store manually added payable entries with their category
  const [manuallyAddedPayables, setManuallyAddedPayables] = useState<(Transaction & { payableCategory?: PayableSubTab })[]>([]);
  const [payableForm, setPayableForm] = useState({
    category: '' as PayableSubTab | '',
    vendorId: '',
    hostelId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending' as Transaction['status'],
  });
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  });

  // Load hostels on component mount
  useEffect(() => {
    const allHostels = hostelService.getAllHostels();
    setHostels(allHostels);
  }, []);

  // Reset vendor filter when switching away from Vendor tab
  useEffect(() => {
    if (activeMainTab !== 'Payable' || activePayableTab !== 'Vendor') {
      setVendorFilter('');
    }
  }, [activeMainTab, activePayableTab]);

  // Base filtered data by hostel (applies to ALL calculations)
  // Includes both original accounts data and manually added payables
  const baseFilteredData = useMemo(() => {
    let data = [...(accountsData as Transaction[])];
    
    // Add manually added payables to the data
    data = [...data, ...manuallyAddedPayables];
    
    // Apply hostel filter first - this affects ALL data on the page
    if (hostelFilter) {
      data = data.filter((t) => String(t.hostelId) === hostelFilter);
    }
    
    return data;
  }, [hostelFilter, manuallyAddedPayables]);

  // Calculate summary - Income, Expense, Profit, Bad Debt (based on hostel filter)
  const summary = useMemo(() => {
    const income = baseFilteredData
      .filter((t) => (t.type === 'Rent' || t.type === 'Deposit') && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = baseFilteredData
      .filter((t) => t.type === 'Expense' && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = income - expenses;
    
    // Bad debt = Overdue payments that are unlikely to be collected
    const badDebt = baseFilteredData
      .filter((t) => t.status === 'Overdue' && (t.type === 'Rent' || t.type === 'Deposit'))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      profit,
      badDebt,
      isProfit: profit >= 0,
    };
  }, [baseFilteredData]);

  // Filter data based on active tabs (uses baseFilteredData which already has hostel filter)
  const filteredData = useMemo(() => {
    let data = [...baseFilteredData]; // Start with hostel-filtered data

    if (activeMainTab === 'Payable') {
      // Payable = Expenses, Bills, Vendor payments, Laundry
      data = data.filter((t) => t.type === 'Expense');
      
      // Further filter by payable sub-tab
      if (activePayableTab === 'All') {
        // "All" tab: Show all Expense transactions (no further filtering)
        // Don't apply any additional filters, just show all expenses
      } else if (activePayableTab === 'Bills') {
        data = data.filter((t) => {
          // Check if transaction has a stored category (manually added)
          const transactionWithCategory = t as Transaction & { payableCategory?: PayableSubTab };
          if (transactionWithCategory.payableCategory) {
            return transactionWithCategory.payableCategory === 'Bills';
          }
          // Otherwise, filter by description keywords (existing data)
          return (
            t.description?.toLowerCase().includes('bill') ||
            t.description?.toLowerCase().includes('utility') ||
            t.description?.toLowerCase().includes('internet')
          );
        });
      } else if (activePayableTab === 'Vendor') {
        data = data.filter((t) => {
          // Check if transaction has a stored category (manually added)
          const transactionWithCategory = t as Transaction & { payableCategory?: PayableSubTab };
          if (transactionWithCategory.payableCategory) {
            return transactionWithCategory.payableCategory === 'Vendor';
          }
          // Otherwise, filter by description keywords (existing data)
          return (
            t.description?.toLowerCase().includes('vendor') ||
            t.description?.toLowerCase().includes('supplier')
          );
        });
        
        // Apply vendor filter if selected
        if (vendorFilter) {
          const selectedVendor = (vendorsData as any[]).find((v) => String(v.id) === vendorFilter);
          if (selectedVendor) {
            // Filter by vendor name in description
            const vendorNameLower = selectedVendor.name.toLowerCase();
            data = data.filter((t) => 
              t.description?.toLowerCase().includes(vendorNameLower) ||
              t.description?.toLowerCase().includes(selectedVendor.specialty.toLowerCase())
            );
          }
        }
      } else if (activePayableTab === 'Laundry') {
        data = data.filter((t) => {
          // Check if transaction has a stored category (manually added)
          const transactionWithCategory = t as Transaction & { payableCategory?: PayableSubTab };
          if (transactionWithCategory.payableCategory) {
            return transactionWithCategory.payableCategory === 'Laundry';
          }
          // Otherwise, filter by description keywords (existing data)
          return (
            t.description?.toLowerCase().includes('laundry') ||
            t.description?.toLowerCase().includes('cleaning')
          );
        });
      }
    } else {
      // Receivable = Rent, Deposits
      data = data.filter((t) => 
        t.type === 'Rent' || t.type === 'Deposit'
      );
      
      // Filter by receivable sub-tab
      if (activeReceivableTab === 'Received') {
        // Show only paid/received entries
        data = data.filter((t) => t.status === 'Paid');
      } else if (activeReceivableTab === 'All') {
        // "All" tab: Show Pending and Overdue only (EXCLUDE Paid status)
        data = data.filter((t) => t.status === 'Pending' || t.status === 'Overdue');
      }
      
      // Filter by category if selected
      if (activeReceivableCategory) {
        if (activeReceivableCategory === 'Rent') {
          data = data.filter((t) => t.type === 'Rent');
        } else if (activeReceivableCategory === 'Deposit') {
          data = data.filter((t) => t.type === 'Deposit');
        }
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (t) =>
          t.ref.toLowerCase().includes(query) ||
          t.tenantName?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Status filter - Apply normally for all tabs
    // Note: "All" tab already filters to show only Pending and Overdue (excludes Paid)
    if (statusFilter) {
      data = data.filter((t) => t.status === statusFilter);
    }

    // Note: Hostel filter is already applied in baseFilteredData

    return data;
  }, [activeMainTab, activePayableTab, activeReceivableTab, activeReceivableCategory, searchQuery, statusFilter, vendorFilter, baseFilteredData]);

  // Define columns
  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: 'ref',
      label: 'Reference',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge
          variant={
            row.type === 'Rent' || row.type === 'Deposit'
              ? 'success'
              : row.type === 'Expense'
              ? 'warning'
              : 'info'
          }
        >
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'tenantName',
      label: activeMainTab === 'Payable' ? 'Description' : 'Tenant',
      render: (row) => row.tenantName || row.description || '-',
    },
    {
      key: 'hostelName',
      label: 'Hostel',
      render: (row) => (
        <span className="text-slate-700 font-medium">
          {row.hostelName || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (row) => (
        <span
          className={
            activeMainTab === 'Payable' || row.type === 'Expense'
              ? 'text-red-600 font-semibold'
              : 'text-green-600 font-semibold'
          }
        >
          {activeMainTab === 'Payable' || row.type === 'Expense' ? '-' : '+'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Paid'
              ? 'success'
              : row.status === 'Overdue'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  // Add actions column for Receivable
  const receivableColumns: Column<Transaction>[] = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setEditingTransaction(row);
            setEditStatusForm({ status: row.status });
            setIsEditStatusModalOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
          Edit Status
        </button>
      ),
    },
  ];

  // Calculate payable and receivable totals
  const payableTotal = useMemo(() => {
    if (activeMainTab === 'Payable') {
      return filteredData.reduce((sum, t) => sum + t.amount, 0);
    }
    return 0;
  }, [activeMainTab, filteredData]);

  const receivableTotal = useMemo(() => {
    if (activeMainTab === 'Receivable') {
      return filteredData.reduce((sum, t) => sum + t.amount, 0);
    }
    return 0;
  }, [activeMainTab, filteredData]);

  // Tab counts (for reference, not used in UI anymore - navigation handled by second sidebar)
  const tabCounts = useMemo(() => ({
    Payable: baseFilteredData.filter((t) => t.type === 'Expense').length,
    Receivable: baseFilteredData.filter((t) => 
      (t.type === 'Rent' || t.type === 'Deposit') && 
      (t.status === 'Pending' || t.status === 'Overdue')
    ).length,
    Bills: baseFilteredData.filter((t) => t.type === 'Expense' && (t.status === 'Pending' || t.status === 'Overdue')).length,
    Vendor: baseFilteredData.filter((t) => t.type === 'Expense' && t.ref?.includes('VENDOR')).length,
    Laundry: baseFilteredData.filter((t) => t.type === 'Expense' && t.ref?.includes('LAUNDRY')).length,
    All: baseFilteredData.filter((t) => t.type === 'Rent' && (t.status === 'Pending' || t.status === 'Overdue')).length,
    Received: baseFilteredData.filter((t) => t.type === 'Rent' && t.status === 'Paid').length,
  }), [baseFilteredData]);

  // Receivable category options
  const receivableCategoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Rent', label: 'Rent' },
    { value: 'Deposit', label: 'Deposit' },
  ];

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

  // Prepare vendor options for dropdown (only show when Vendor tab is active)
  const vendorOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Vendors' }];
    const vendors = vendorsData as any[];
    vendors.forEach((vendor) => {
      options.push({
        value: String(vendor.id),
        label: `${vendor.name} (${vendor.specialty})`,
      });
    });
    return options;
  }, []);

  // Prepare vendor options for form (only active vendors)
  const formVendorOptions = useMemo(() => {
    const options = [{ value: '', label: 'Select Vendor' }];
    const vendors = vendorsData as any[];
    vendors
      .filter((v) => v.status === 'Active')
      .forEach((vendor) => {
        options.push({
          value: String(vendor.id),
          label: `${vendor.name} (${vendor.specialty})`,
        });
      });
    return options;
  }, []);

  // Category options for payable form
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    { value: 'Bills', label: 'Bills' },
    { value: 'Vendor', label: 'Vendor' },
    { value: 'Laundry', label: 'Laundry' },
  ];

  // Get selected hostel name for display
  const selectedHostelName = useMemo(() => {
    if (!hostelFilter) return null;
    const hostel = hostels.find((h) => String(h.id) === hostelFilter);
    return hostel?.name || null;
  }, [hostelFilter, hostels]);

  // Get selected vendor name for display
  const selectedVendorName = useMemo(() => {
    if (!vendorFilter) return null;
    const vendors = vendorsData as any[];
    const vendor = vendors.find((v) => String(v.id) === vendorFilter);
    return vendor ? `${vendor.name} (${vendor.specialty})` : null;
  }, [vendorFilter]);

  // Handle add payable form submission
  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!payableForm.category) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please select a category',
      });
      return;
    }
    
    if (!payableForm.hostelId) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please select a hostel',
      });
      return;
    }
    
    if (!payableForm.amount || parseFloat(payableForm.amount) <= 0) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please enter a valid amount',
      });
      return;
    }
    
    if (!payableForm.description) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please enter a description',
      });
      return;
    }
    
    // If Vendor category is selected, vendor is required
    if (payableForm.category === 'Vendor' && !payableForm.vendorId) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please select a vendor',
      });
      return;
    }
    
    // Generate reference number
    const refPrefix = payableForm.category === 'Bills' ? 'BILL' : 
                      payableForm.category === 'Vendor' ? 'VEND' : 'LAUN';
    const refNumber = `${refPrefix}-${Date.now()}`;
    
    // Get hostel name
    const selectedHostel = hostels.find((h) => String(h.id) === payableForm.hostelId);
    const hostelName = selectedHostel?.name || '';
    
    // Build description with vendor name if applicable
    let description = payableForm.description;
    if (payableForm.category === 'Vendor' && payableForm.vendorId) {
      const selectedVendor = (vendorsData as any[]).find((v) => String(v.id) === payableForm.vendorId);
      if (selectedVendor) {
        description = `${selectedVendor.name} - ${payableForm.description}`;
      }
    }
    
    // Create new transaction with category stored
    const newTransaction: Transaction & { payableCategory?: PayableSubTab } = {
      id: Date.now(), // In real app, this would come from backend
      date: payableForm.date,
      ref: refNumber,
      type: 'Expense',
      amount: parseFloat(payableForm.amount),
      status: payableForm.status,
      description: description,
      hostelId: Number(payableForm.hostelId),
      hostelName: hostelName,
      payableCategory: payableForm.category, // Store the category for filtering
    };
    
    // Add to manually added payables
    setManuallyAddedPayables((prev) => [...prev, newTransaction]);
    
    console.log('New Payable Entry:', newTransaction);
    
    setToast({
      open: true,
      type: 'success',
      message: `${payableForm.category} payable entry added successfully! It will appear in the ${payableForm.category} tab.`,
    });
    
    // Reset form
    setPayableForm({
      category: '' as PayableSubTab | '',
      vendorId: '',
      hostelId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
    
    setIsAddModalOpen(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setPayableForm({
      category: '' as PayableSubTab | '',
      vendorId: '',
      hostelId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
  };

  // Handle edit status form submission
  const handleEditStatus = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTransaction) return;
    
    // In a real app, this would update the transaction via API
    console.log('Updating transaction status:', {
      id: editingTransaction.id,
      oldStatus: editingTransaction.status,
      newStatus: editStatusForm.status,
    });
    
    setToast({
      open: true,
      type: 'success',
      message: `Transaction status updated to ${editStatusForm.status} successfully!`,
    });
    
    setIsEditStatusModalOpen(false);
    setEditingTransaction(null);
    setEditStatusForm({ status: 'Pending' });
  };

  // Handle edit status modal close
  const handleEditStatusClose = () => {
    setIsEditStatusModalOpen(false);
    setEditingTransaction(null);
    setEditStatusForm({ status: 'Pending' });
  };

  // Toolbar with search and status filters only (hostel filter is at top)
  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by reference, tenant, or description..."
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Overdue', label: 'Overdue' },
          ]}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Accounts</h1>
        <p className="text-slate-600 mt-1">Manage payables, receivables, and financial overview</p>
      </div>

      {/* Hostel Filter - At the top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 border border-white/20 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              Filter by Hostel:
            </label>
            <div className="flex-1 sm:w-64">
              <Select
                value={hostelFilter}
                onChange={setHostelFilter}
                options={hostelOptions}
                placeholder="Select Hostel"
              />
            </div>
          </div>
          
          {/* Vendor Filter - Only show when Vendor tab is active */}
          {activeMainTab === 'Payable' && activePayableTab === 'Vendor' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Filter by Vendor:
              </label>
              <div className="flex-1 sm:w-64">
                <Select
                  value={vendorFilter}
                  onChange={setVendorFilter}
                  options={vendorOptions}
                  placeholder="Select Vendor"
                />
              </div>
            </div>
          )}
          
          {(selectedHostelName || selectedVendorName) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedHostelName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-100/50 rounded-lg border border-brand-200/50">
                  <span className="text-xs text-brand-700 font-medium">Hostel:</span>
                  <span className="text-sm text-brand-900 font-semibold">{selectedHostelName}</span>
                </div>
              )}
              {selectedVendorName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100/50 rounded-lg border border-purple-200/50">
                  <span className="text-xs text-purple-700 font-medium">Vendor:</span>
                  <span className="text-sm text-purple-900 font-semibold">{selectedVendorName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Cards - Income, Expense, Profit, Bad Debt */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass p-6 rounded-xl border border-white/20 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.income)}</p>
        </motion.div>

        {/* Expense Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 rounded-xl border border-white/20 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            </div>
            <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.expenses)}</p>
        </motion.div>

        {/* Profit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass p-6 rounded-xl border border-white/20 shadow-lg ${
            summary.isProfit ? 'bg-green-50/30' : 'bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              summary.isProfit 
                ? 'bg-gradient-to-br from-green-400 to-green-600' 
                : 'bg-gradient-to-br from-red-400 to-red-600'
            }`}>
              {summary.isProfit ? (
                <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
              ) : (
                <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <span className={`text-sm font-semibold ${summary.isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {summary.isProfit ? 'Gain' : 'Loss'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Profit / Loss</p>
          <p className={`text-2xl font-bold ${summary.isProfit ? 'text-green-900' : 'text-red-900'}`}>
            {summary.isProfit ? '+' : ''}{formatCurrency(summary.profit)}
          </p>
        </motion.div>

        {/* Capital Invested Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl border border-white/20 shadow-lg bg-orange-50/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-orange-600">Loss</span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Capital Invested</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.badDebt)}</p>
        </motion.div>
      </div>

      {/* Content - No tabs, navigation handled by second sidebar */}
      <div className="glass rounded-2xl border border-white/20 shadow-xl">
        <div className="p-6">
          {/* Category Filter for Receivable - Only show in Receivable sections */}
          {activeMainTab === 'Receivable' && (
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <Select
                value={activeReceivableCategory}
                onChange={(value) => setActiveReceivableCategory(value as ReceivableCategory | '')}
                options={receivableCategoryOptions}
              />
            </div>
          )}
          {/* Summary for current tab */}
          <div className="mb-6 p-4 bg-white/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {activeMainTab === 'Payable' 
                    ? `Total Payable - ${activePayableTab}` 
                    : 'Total Receivable'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(activeMainTab === 'Payable' ? payableTotal : receivableTotal)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={activeMainTab === 'Payable' ? 'warning' : 'info'}>
                  {filteredData.length} {activeMainTab === 'Payable' ? 'Bills' : 'Invoices'}
                </Badge>
                {/* Add Button - Show different text based on active tab */}
                {activeMainTab === 'Payable' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Pre-select the category based on active tab
                      setPayableForm((prev) => ({
                        ...prev,
                        category: activePayableTab as PayableSubTab,
                      }));
                      setIsAddModalOpen(true);
                    }}
                    icon={PlusIcon}
                  >
                    {activePayableTab === 'Vendor' 
                      ? 'Add Vendor' 
                      : activePayableTab === 'Bills'
                      ? 'Add Bill'
                      : activePayableTab === 'Laundry'
                      ? 'Add Laundry'
                      : 'Add Payable'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Data table */}
          <DataTable
            columns={activeMainTab === 'Receivable' ? receivableColumns : columns}
            data={filteredData}
            toolbar={toolbar}
            emptyMessage={`No ${activeMainTab === 'Payable' ? activePayableTab.toLowerCase() : 'receivable'} records found. Try adjusting your search or filters.`}
          />
        </div>
      </div>

      {/* Add Payable Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Add New Payable Entry"
        size="lg"
      >
        <form onSubmit={handleAddPayable} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={payableForm.category}
              onChange={(value) => {
                setPayableForm({ ...payableForm, category: value as PayableSubTab, vendorId: value !== 'Vendor' ? '' : payableForm.vendorId });
              }}
              options={categoryOptions}
            />
          </div>

          {/* Vendor Selection - Only show when Vendor category is selected */}
          {payableForm.category === 'Vendor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <Select
                value={payableForm.vendorId}
                onChange={(value) => setPayableForm({ ...payableForm, vendorId: value })}
                options={formVendorOptions}
              />
            </div>
          )}

          {/* Hostel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hostel <span className="text-red-500">*</span>
            </label>
            <Select
              value={payableForm.hostelId}
              onChange={(value) => setPayableForm({ ...payableForm, hostelId: value })}
              options={hostelOptions.filter((opt) => opt.value !== '')} // Remove "All Hostels" option
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={payableForm.amount}
              onChange={(e) => setPayableForm({ ...payableForm, amount: e.target.value })}
              placeholder="0.00"
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={payableForm.description}
              onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
              required
            />
          </div>

          {/* Date and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={payableForm.date}
                onChange={(e) => setPayableForm({ ...payableForm, date: e.target.value })}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2176FF]"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <Select
                value={payableForm.status}
                onChange={(value) => setPayableForm({ ...payableForm, status: value as Transaction['status'] })}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Overdue', label: 'Overdue' },
                ]}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add Payable Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        isOpen={isEditStatusModalOpen}
        onClose={handleEditStatusClose}
        title="Edit Transaction Status"
        size="md"
      >
        <form onSubmit={handleEditStatus} className="space-y-4">
          {editingTransaction && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium text-gray-900">{editingTransaction.ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{editingTransaction.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(editingTransaction.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <Badge
                      variant={
                        editingTransaction.status === 'Paid'
                          ? 'success'
                          : editingTransaction.status === 'Overdue'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {editingTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editStatusForm.status}
                  onChange={(value) => setEditStatusForm({ status: value as Transaction['status'] })}
                  options={[
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Overdue', label: 'Overdue' },
                  ]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleEditStatusClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Update Status
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AccountsList;

