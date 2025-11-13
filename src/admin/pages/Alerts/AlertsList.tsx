/**
 * AlertsList page
 * View and manage system alerts
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { Tabs } from '../../components/Tabs';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import type { Alert, AlertSeverity } from '../../types/comms';
import type { ToastType } from '../../types/common';
import { formatDate } from '../../types/common';
import * as alertService from '../../services/alert.service';

/**
 * Alerts list page
 */
const AlertsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bills' | 'maintenance'>('bills');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });
  
  // Form state for new maintenance alert
  const [alertForm, setAlertForm] = useState({
    title: '',
    description: '',
    severity: 'warn' as AlertSeverity,
    assignedTo: '',
  });

  // Load alerts
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    const data = alertService.getAllAlerts();
    setAlerts(data);
  };

  // Helper function to determine alert category
  const getAlertCategory = (alert: Alert): 'bills' | 'maintenance' => {
    const title = alert.title.toLowerCase();
    const description = (alert.description || '').toLowerCase();
    
    // Bills-related keywords
    if (
      title.includes('payment') ||
      title.includes('overdue') ||
      title.includes('bill') ||
      title.includes('invoice') ||
      title.includes('rent') ||
      description.includes('payment') ||
      description.includes('overdue') ||
      description.includes('bill') ||
      description.includes('rent')
    ) {
      return 'bills';
    }
    
    // Default to maintenance for everything else
    return 'maintenance';
  };

  // Filter data by tab and filters
  const filteredData = useMemo(() => {
    let data = alerts;

    // Filter by tab (Bills or Maintenance)
    data = data.filter((a) => getAlertCategory(a) === activeTab);

    // Filter by severity
    if (severityFilter) {
      data = data.filter((a) => a.severity === severityFilter);
    }

    // Filter by status
    if (statusFilter) {
      data = data.filter((a) => a.status === statusFilter);
    }

    return data;
  }, [alerts, activeTab, severityFilter, statusFilter]);

  // Calculate counts for tabs
  const billsCount = alerts.filter((a) => getAlertCategory(a) === 'bills').length;
  const maintenanceCount = alerts.filter((a) => getAlertCategory(a) === 'maintenance').length;

  // Define tabs
  const tabs = [
    {
      id: 'bills',
      label: 'Bills',
      count: billsCount,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      count: maintenanceCount,
    },
  ];

  // Calculate stats for current tab
  const currentTabData = alerts.filter((a) => getAlertCategory(a) === activeTab);
  const dangerCount = currentTabData.filter((a) => a.severity === 'danger').length;
  const warningCount = currentTabData.filter((a) => a.severity === 'warn').length;
  const infoCount = currentTabData.filter((a) => a.severity === 'info').length;

  // Handle add maintenance alert
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!alertForm.title.trim()) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please enter an alert title',
      });
      return;
    }

    try {
      alertService.createAlert({
        title: alertForm.title,
        description: alertForm.description || undefined,
        severity: alertForm.severity,
        assignedTo: alertForm.assignedTo || undefined,
        status: 'open',
      });

      setToast({
        open: true,
        type: 'success',
        message: 'Maintenance alert created successfully!',
      });

      // Reset form and close modal
      setAlertForm({
        title: '',
        description: '',
        severity: 'warn',
        assignedTo: '',
      });
      setIsAddAlertOpen(false);
      loadAlerts();
    } catch (error) {
      setToast({
        open: true,
        type: 'error',
        message: 'Failed to create alert. Please try again.',
      });
    }
  };

  // Define columns
  const columns: Column<Alert>[] = [
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => (
        <Badge
          variant={
            row.severity === 'danger'
              ? 'danger'
              : row.severity === 'warn'
              ? 'warning'
              : 'info'
          }
        >
          {row.severity.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => row.description || '-',
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => row.assignedTo || 'Unassigned',
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'open' ? 'warning' : 'success'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  // Toolbar
  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-48">
        <Select
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { value: '', label: 'All Severities' },
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warning' },
            { value: 'danger', label: 'Danger' },
          ]}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-1">System alerts and notifications</p>
        </div>
        {activeTab === 'maintenance' && (
          <Button
            variant="primary"
            onClick={() => setIsAddAlertOpen(true)}
            icon={PlusIcon}
          >
            Add Maintenance Alert
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'bills' | 'maintenance')}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
          <p className="text-sm font-medium text-red-700 mb-1">Danger</p>
          <p className="text-3xl font-bold text-red-900">
            {dangerCount}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
          <p className="text-sm font-medium text-amber-700 mb-1">Warning</p>
          <p className="text-3xl font-bold text-amber-900">
            {warningCount}
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-200 p-6 rounded-2xl">
          <p className="text-sm font-medium text-brand-700 mb-1">Info</p>
          <p className="text-3xl font-bold text-brand-900">
            {infoCount}
          </p>
        </div>
      </div>

      {/* Data table */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DataTable
          columns={columns}
          data={filteredData}
          toolbar={toolbar}
          emptyMessage={`No ${activeTab} alerts found.`}
        />
      </motion.div>

      {/* Add Maintenance Alert Modal */}
      <Modal
        isOpen={isAddAlertOpen}
        onClose={() => {
          setIsAddAlertOpen(false);
          setAlertForm({
            title: '',
            description: '',
            severity: 'warn',
            assignedTo: '',
          });
        }}
        title="Create Maintenance Alert"
      >
        <form onSubmit={handleAddAlert} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={alertForm.title}
              onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Maintenance Request - Room 305"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={alertForm.description}
              onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the maintenance issue or requirement..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Severity
            </label>
            <Select
              value={alertForm.severity}
              onChange={(value) => setAlertForm({ ...alertForm, severity: value as AlertSeverity })}
              options={[
                { value: 'info', label: 'Info' },
                { value: 'warn', label: 'Warning' },
                { value: 'danger', label: 'Danger' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Assign To
            </label>
            <input
              type="text"
              value={alertForm.assignedTo}
              onChange={(e) => setAlertForm({ ...alertForm, assignedTo: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., David Kim (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Create Alert
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddAlertOpen(false);
                setAlertForm({
                  title: '',
                  description: '',
                  severity: 'warn',
                  assignedTo: '',
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AlertsList;

