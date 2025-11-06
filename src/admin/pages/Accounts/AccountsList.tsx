/**
 * AccountsList page
 * Financial transactions and account management with Payable/Receivable tabs
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs } from '../../components/Tabs';
import type { Tab } from '../../components/Tabs';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { SearchInput } from '../../components/SearchInput';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import type { Transaction } from '../../types/accounts';
import type { Hostel } from '../../types/hostel';
import { formatDate, formatCurrency } from '../../types/common';
import accountsData from '../../mock/accounts.json';
import * as hostelService from '../../services/hostel.service';
import {
  CurrencyDollarIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type MainTab = 'Payable' | 'Receivable';
type PayableSubTab = 'Bills' | 'Vendor' | 'Laundry';

/**
 * Accounts list page with Payable/Receivable tabs
 */
const AccountsList: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('Payable');
  const [activePayableTab, setActivePayableTab] = useState<PayableSubTab>('Bills');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Load hostels on component mount
  useEffect(() => {
    const allHostels = hostelService.getAllHostels();
    setHostels(allHostels);
  }, []);

  // Base filtered data by hostel (applies to ALL calculations)
  const baseFilteredData = useMemo(() => {
    let data = accountsData as Transaction[];
    
    // Apply hostel filter first - this affects ALL data on the page
    if (hostelFilter) {
      data = data.filter((t) => String(t.hostelId) === hostelFilter);
    }
    
    return data;
  }, [hostelFilter]);

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
      if (activePayableTab === 'Bills') {
        data = data.filter((t) => 
          t.description?.toLowerCase().includes('bill') ||
          t.description?.toLowerCase().includes('utility') ||
          t.description?.toLowerCase().includes('internet')
        );
      } else if (activePayableTab === 'Vendor') {
        data = data.filter((t) => 
          t.description?.toLowerCase().includes('vendor') ||
          t.description?.toLowerCase().includes('supplier')
        );
      } else if (activePayableTab === 'Laundry') {
        data = data.filter((t) => 
          t.description?.toLowerCase().includes('laundry') ||
          t.description?.toLowerCase().includes('cleaning')
        );
      }
    } else {
      // Receivable = Rent, Deposits that are pending/overdue
      data = data.filter((t) => 
        (t.type === 'Rent' || t.type === 'Deposit') && 
        (t.status === 'Pending' || t.status === 'Overdue')
      );
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

    // Status filter
    if (statusFilter) {
      data = data.filter((t) => t.status === statusFilter);
    }

    // Note: Hostel filter is already applied in baseFilteredData

    return data;
  }, [activeMainTab, activePayableTab, searchQuery, statusFilter, baseFilteredData]);

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

  // Main tabs (counts based on hostel filter)
  const mainTabs: Tab[] = useMemo(() => [
    { 
      id: 'Payable', 
      label: 'Payable', 
      count: baseFilteredData.filter((t) => t.type === 'Expense').length 
    },
    { 
      id: 'Receivable', 
      label: 'Receivable', 
      count: baseFilteredData.filter((t) => 
        (t.type === 'Rent' || t.type === 'Deposit') && 
        (t.status === 'Pending' || t.status === 'Overdue')
      ).length 
    },
  ], [baseFilteredData]);

  // Payable sub-tabs
  const payableSubTabs: Tab[] = [
    { id: 'Bills', label: 'Bills', count: 0 },
    { id: 'Vendor', label: 'Vendor', count: 0 },
    { id: 'Laundry', label: 'Laundry', count: 0 },
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

  // Get selected hostel name for display
  const selectedHostelName = useMemo(() => {
    if (!hostelFilter) return null;
    const hostel = hostels.find((h) => String(h.id) === hostelFilter);
    return hostel?.name || null;
  }, [hostelFilter, hostels]);

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

        {/* Bad Debt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl border border-white/20 shadow-lg bg-orange-50/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-orange-600">Loss</span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Bad Debt</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(summary.badDebt)}</p>
        </motion.div>
      </div>

      {/* Main Tabs - Payable & Receivable */}
      <div className="glass rounded-2xl border border-white/20 shadow-xl">
        <div className="px-6 pt-4">
          <Tabs
            tabs={mainTabs}
            activeTab={activeMainTab}
            onChange={(id) => setActiveMainTab(id as MainTab)}
          />
        </div>

        {/* Payable Sub-Tabs */}
        {activeMainTab === 'Payable' && (
          <div className="px-6 pt-2 pb-2 border-b border-white/10">
            <div className="flex gap-2">
              {payableSubTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePayableTab(tab.id as PayableSubTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePayableTab === tab.id
                      ? 'bg-[#2176FF] text-white'
                      : 'text-gray-600 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
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
              <Badge variant={activeMainTab === 'Payable' ? 'warning' : 'info'}>
                {filteredData.length} {activeMainTab === 'Payable' ? 'Bills' : 'Invoices'}
              </Badge>
            </div>
          </div>

          {/* Data table */}
          <DataTable
            columns={columns}
            data={filteredData}
            toolbar={toolbar}
            emptyMessage={`No ${activeMainTab === 'Payable' ? activePayableTab.toLowerCase() : 'receivable'} records found. Try adjusting your search or filters.`}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountsList;

