/**
 * Overview page - Professional Dashboard
 * Comprehensive dashboard with multiple data visualizations
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatDate } from '../types/common';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  HandRaisedIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  UsersIcon,
  BellAlertIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import tenantsData from '../mock/tenants.json';
import accountsData from '../mock/accounts.json';
import alertsData from '../mock/alerts.json';
import vendorsData from '../mock/vendors.json';
import tenantRequestsData from '../mock/tenant-requests.json';
import rentalApplicationsData from '../mock/rental-applications.json';
import activityLogData from '../mock/activity-log.json';

/**
 * Professional overview dashboard page
 */
const Overview: React.FC = () => {
  // Tab state for Paid Transactions & Recent Payments
  const [activePaymentTab, setActivePaymentTab] = useState<'transactions' | 'payments'>('transactions');

  // Calculate stats for stat cards
  const stats = useMemo(() => {
    const activeTenants = tenantsData.filter((t) => t.status === 'Active').length;
    const openAlerts = alertsData.filter((a) => a.status === 'open').length;
    const activeVendors = vendorsData.filter((v) => v.status === 'Active').length;
    
    // Calculate current month revenue
    const currentMonthIncome = accountsData
      .filter((a) => a.type === 'Rent' || a.type === 'Deposit')
      .reduce((sum, a) => sum + a.amount, 0);
    
    // Calculate occupancy (assuming 100 total beds)
    const totalBeds = 100;
    const occupancyRate = Math.round((activeTenants / totalBeds) * 100);

    return {
      activeTenants,
      openAlerts,
      monthlyRevenue: currentMonthIncome,
      activeVendors,
      occupancyRate,
      pendingPayments: accountsData.filter((a) => a.status === 'Pending').length,
    };
  }, []);

  // Calculate Profit & Loss data (last 3 months)
  const profitLossData = useMemo(() => {
    const months = ['January 2023', 'February 2023', 'March 2023'];
    const revenue = [30036, 32000, 31000];
    const expenses = [5018, 5500, 5200];
    const netIncome = revenue.map((r, i) => r - expenses[i]);
    
    return months.map((month, i) => ({
      month,
      revenue: revenue[i],
      expenses: expenses[i],
      netIncome: netIncome[i],
    }));
  }, []);

  // Calculate Net Income for last 3 months
  const netIncome = useMemo(() => {
    return profitLossData.reduce((sum, item) => sum + item.netIncome, 0);
  }, [profitLossData]);

  // Paid transactions (all paid transactions including rent, deposits, expenses)
  const paidTransactions = useMemo(() => {
    return accountsData
      .filter(a => a.status === 'Paid')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(transaction => {
        const tenant = tenantsData.find(t => t.name === transaction.tenantName);
        const daysAgo = Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...transaction,
          property: tenant ? `${tenant.room}-${tenant.bed}` : 'N/A',
          daysAgo,
        };
      });
  }, []);

  // Recent payments received (only rent payments that are paid)
  const recentPaymentsReceived = useMemo(() => {
    return accountsData
      .filter(a => (a.type === 'Rent' || a.type === 'Deposit') && a.status === 'Paid')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(payment => {
        const tenant = tenantsData.find(t => t.name === payment.tenantName);
        const daysAgo = Math.floor((Date.now() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...payment,
          property: tenant ? `${tenant.room}-${tenant.bed}` : 'N/A',
          daysAgo,
        };
      });
  }, []);

  // Employee activity log
  const activityLog = useMemo(() => {
    return activityLogData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(activity => {
        const hoursAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        return {
          ...activity,
          hoursAgo,
          daysAgo,
        };
      });
  }, []);

  // Recent tenant requests
  const recentRequests = useMemo(() => {
    return tenantRequestsData.slice(0, 3).map(req => {
      const daysAgo = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...req,
        daysAgo,
      };
    });
  }, []);

  // Unpaid rent by aging
  const unpaidRentData = useMemo(() => {
    const unpaid = accountsData.filter(a => a.type === 'Rent' && (a.status === 'Pending' || a.status === 'Overdue'));
    const now = Date.now();
    
    const aging = unpaid.reduce((acc, payment) => {
      const daysOld = Math.floor((now - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24));
      let category = '91+';
      if (daysOld <= 30) category = '0-30';
      else if (daysOld <= 60) category = '31-60';
      else if (daysOld <= 90) category = '61-90';
      
      acc[category] = (acc[category] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return [
      { category: '0-30', amount: aging['0-30'] || 0 },
      { category: '31-60', amount: aging['31-60'] || 0 },
      { category: '61-90', amount: aging['61-90'] || 0 },
      { category: '91+', amount: aging['91+'] || 0 },
    ];
  }, []);

  const totalUnpaidRent = useMemo(() => {
    return unpaidRentData.reduce((sum, item) => sum + item.amount, 0);
  }, [unpaidRentData]);

  // Rental applications data
  const rentalApplicationsTotal = useMemo(() => {
    return rentalApplicationsData.reduce((sum, app) => sum + app.count, 0);
  }, [rentalApplicationsData]);

  // Occupancy rate data
  const occupancyData = useMemo(() => {
    const totalBeds = 100;
    const occupied = tenantsData.filter(t => t.status === 'Active').length;
    const vacant = totalBeds - occupied;
    const occupiedPercent = Math.round((occupied / totalBeds) * 100);
    const vacantPercent = Math.round((vacant / totalBeds) * 100);
    
    return [
      { name: 'Occupied', value: occupied, percent: occupiedPercent },
      { name: 'Vacant', value: vacant, percent: vacantPercent },
    ];
  }, []);

  const COLORS = ['#3b82f6', '#ec4899'];

  // Format time ago
  const formatTimeAgo = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Format activity time
  const formatActivityTime = (hoursAgo: number, daysAgo: number) => {
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action.includes('Payment')) return CurrencyDollarIcon;
    if (action.includes('Tenant')) return UsersIcon;
    if (action.includes('Alert')) return BellAlertIcon;
    if (action.includes('Request')) return ClipboardDocumentListIcon;
    if (action.includes('Vendor')) return UserGroupIcon;
    if (action.includes('Hostel')) return HomeIcon;
    return UserIcon;
  };

  // Get action color
  const getActionColor = (action: string) => {
    if (action.includes('Payment')) return 'bg-green-100 text-green-700';
    if (action.includes('Created')) return 'bg-blue-100 text-blue-700';
    if (action.includes('Updated')) return 'bg-yellow-100 text-yellow-700';
    if (action.includes('Resolved') || action.includes('Completed')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Not Started':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-1">Dashboard summary and key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          icon={<HomeIcon className="w-6 h-6 text-white" />}
          variant="primary"
          trend={{ value: '+5% from last month', isPositive: true }}
          delay={0}
        />
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          variant="success"
          delay={0.1}
        />
        <StatCard
          title="Open Alerts"
          value={stats.openAlerts}
          icon={<BellAlertIcon className="w-6 h-6 text-white" />}
          variant={stats.openAlerts > 5 ? 'warning' : 'default'}
          delay={0.2}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
          variant="success"
          trend={{ value: '+12% from last month', isPositive: true }}
          delay={0.3}
        />
        <StatCard
          title="Active Vendors"
          value={stats.activeVendors}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
          variant="default"
          delay={0.4}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          variant="warning"
          delay={0.5}
        />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit & Loss */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Profit & loss</h2>
            <p className="text-sm text-slate-600">
              Net Income: <span className="font-semibold text-slate-900">{formatCurrency(netIncome)}</span> (Last 3 months to date)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Line 
                type="monotone" 
                dataKey="netIncome" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Net Income"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Paid Transactions & Recent Payments Received - Combined Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Paid Transactions & Recent Payments</h2>
            <p className="text-sm text-slate-600">All paid transactions and recent payments received</p>
          </div>
          
          {/* Tabs for Paid Transactions and Recent Payments */}
          <div className="mb-4">
            <div className="flex gap-2 border-b border-gray-200">
              <button 
                onClick={() => setActivePaymentTab('transactions')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePaymentTab === 'transactions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paid Transactions ({paidTransactions.length})
              </button>
              <button 
                onClick={() => setActivePaymentTab('payments')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePaymentTab === 'payments'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Recent Payments ({recentPaymentsReceived.length})
              </button>
            </div>
          </div>

          {/* Paid Transactions Section */}
          {activePaymentTab === 'transactions' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {paidTransactions.slice(0, 5).map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'Rent' || transaction.type === 'Deposit' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {transaction.type === 'Rent' || transaction.type === 'Deposit' ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{transaction.tenantName || transaction.description || 'N/A'}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        {transaction.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {formatTimeAgo(transaction.daysAgo)} • {transaction.hostelName || 'N/A'} • {transaction.property || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'Rent' || transaction.type === 'Deposit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'Rent' || transaction.type === 'Deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{transaction.ref}</p>
                  </div>
                </motion.div>
              ))}
              {paidTransactions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No paid transactions found.
                </div>
              )}
            </motion.div>
          )}

          {/* Recent Payments Received Section */}
          {activePaymentTab === 'payments' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {recentPaymentsReceived.slice(0, 5).map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <HandRaisedIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{payment.tenantName}</p>
                    <p className="text-sm text-slate-600">
                      {formatTimeAgo(payment.daysAgo)} • {payment.hostelName || 'N/A'} • {payment.property}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{payment.ref}</p>
                  </div>
                </motion.div>
              ))}
              {recentPaymentsReceived.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No recent payments found.
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Recent Tenant Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Recent tenant requests</h2>
          </div>
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{request.description}</p>
                  <p className="text-sm text-slate-600">
                    {formatTimeAgo(request.daysAgo)} • {request.property} - {request.unit}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Unpaid Rent */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unpaid rent</h2>
            <p className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{formatCurrency(totalUnpaidRent)}</span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={unpaidRentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis dataKey="category" type="category" stroke="#64748b" style={{ fontSize: '12px' }} width={60} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {unpaidRentData.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.category} days</span>
                <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rental Applications */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Rental applications</h2>
            <p className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{rentalApplicationsTotal.toLocaleString()}</span> (Last 30 days)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rentalApplicationsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis dataKey="status" type="category" stroke="#64748b" style={{ fontSize: '12px' }} width={100} />
              <Tooltip
                formatter={(value: number) => [value, 'Count']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {rentalApplicationsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ec4899' : index === 1 ? '#a855f7' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {rentalApplicationsData.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.status}</span>
                <span className="font-medium text-slate-900">
                  {item.count} ({item.percentage.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Occupancy rate</h2>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {occupancyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} (${props.payload.percent}%)`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {occupancyData.find(d => d.name === 'Occupied')?.percent}%
                </div>
                <div className="text-sm text-slate-600">Occupied</div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {occupancyData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: COLORS[item.name === 'Occupied' ? 0 : 1] }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Employee Activity Log</h2>
            <p className="text-sm text-slate-600">Track all employee activities and actions</p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLog.map((activity, idx) => {
              const ActionIcon = getActionIcon(activity.action);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action)}`}>
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{activity.employeeName}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        {activity.employeeRole}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{activity.hostelName}</span>
                      <span>•</span>
                      <span>{formatActivityTime(activity.hoursAgo, activity.daysAgo)}</span>
                      <span>•</span>
                      <span>{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
