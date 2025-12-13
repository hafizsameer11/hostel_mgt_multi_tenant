/**
 * AlertsList page
 * View and manage system alerts
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, CalendarIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { AddAlertModal, type AlertFormData } from '../../components/alerts/AddAlertModal';
import { ViewAlertModal } from '../../components/alerts/ViewAlertModal';
import { EyeIcon } from '@heroicons/react/24/outline';
import type { Alert } from '../../types/comms';
import type { ToastType } from '../../types/common';
import { formatDate } from '../../types/common';
import * as alertService from '../../services/alert.service';
import * as hostelService from '../../services/hostel.service';
import ROUTES from '../../routes/routePaths';

/**
 * Alerts list page
 */
const AlertsList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active section from route
  const getActiveSection = (): 'bills' | 'maintenance' => {
    if (location.pathname.includes('/alerts/maintenance')) return 'maintenance';
    if (location.pathname.includes('/alerts/bills')) return 'bills';
    // Default to bills if on /alerts
    return 'bills';
  };
  
  const activeSection = getActiveSection();
  
  // Redirect to /alerts/bills if just /alerts
  useEffect(() => {
    if (location.pathname === ROUTES.ALERTS) {
      navigate(ROUTES.ALERTS_BILLS, { replace: true });
    }
  }, [location.pathname, navigate]);
  
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Report Period filters
  const [reportPeriod, setReportPeriod] = useState<string>('Last 7 days');
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [isViewAlertOpen, setIsViewAlertOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });
  
  // Hostel data
  const [hostelsLoading, setHostelsLoading] = useState(false);
  const [hostelOptions, setHostelOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Load hostels
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setHostelsLoading(true);
        const hostelsData = await hostelService.getAllHostelsFromAPI();
        setHostelOptions([
          { value: '', label: 'All Hostels' },
          ...hostelsData.map(h => ({
            value: String(h.id),
            label: h.name,
          }))
        ]);
      } catch (error) {
        console.error('Error loading hostels:', error);
        setHostelOptions([{ value: '', label: 'All Hostels' }]);
      } finally {
        setHostelsLoading(false);
      }
    };
    fetchHostels();
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load alerts from API
  useEffect(() => {
    loadAlerts();
  }, [activeSection, hostelFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine type based on active section
      const type = activeSection === 'bills' ? 'bill' : 'maintenance';
      
      // Build filter params
      const params: {
        type: 'bill' | 'maintenance';
        hostelId?: number;
      } = {
        type,
      };

      // Add hostel filter if selected
      if (hostelFilter) {
        params.hostelId = Number(hostelFilter);
      }

      const response = await alertService.getAlertsAPI(params);
      
      // Map API response to Alert type
      const mappedAlerts: Alert[] = response.data.alerts.map((alert) => {
        // Map severity: API returns "WARN", "INFO", "DANGER" but we need lowercase
        const severityMap: Record<string, 'info' | 'warn' | 'danger'> = {
          'INFO': 'info',
          'WARN': 'warn',
          'WARNING': 'warn',
          'DANGER': 'danger',
          'info': 'info',
          'warn': 'warn',
          'danger': 'danger',
        };
        const severity = severityMap[alert.severity.toUpperCase()] || 'info';

        return {
          id: alert.id,
          title: alert.title,
          severity,
          createdAt: alert.createdAt,
          status: alert.status.toLowerCase() as 'open' | 'closed',
          description: alert.description || undefined,
          assignedTo: alert.assignedTo || undefined,
          // Additional fields from API
          type: alert.type,
          priority: alert.priority,
          hostel: alert.hostel,
          room: alert.room,
          tenant: alert.tenant,
          amount: alert.amount,
          dueDate: alert.dueDate,
        };
      });

      setAlerts(mappedAlerts);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      setError(err?.message || 'Failed to load alerts. Please try again.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date as MM/DD/YYYY for display
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Filter data by severity, status, and date range (type and hostel are already filtered by API)
  const filteredData = useMemo(() => {
    let data = alerts;

    // Filter by severity
    if (severityFilter) {
      data = data.filter((a) => a.severity === severityFilter);
    }

    // Filter by status
    if (statusFilter) {
      data = data.filter((a) => a.status === statusFilter);
    }

    // Date range filter
    if (dateFrom && dateTo) {
      data = data.filter((a) => {
        const alertDate = new Date(a.createdAt);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        return alertDate >= fromDate && alertDate <= toDate;
      });
    }

    return data;
  }, [alerts, severityFilter, statusFilter, dateFrom, dateTo]);

  // Calculate stats for current section
  const currentSectionData = filteredData;
  const dangerCount = currentSectionData.filter((a) => a.severity === 'danger').length;
  const warningCount = currentSectionData.filter((a) => a.severity === 'warn').length;
  const infoCount = currentSectionData.filter((a) => a.severity === 'info').length;

  // Handle PDF export
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      doc.setFontSize(18);
      doc.text(`${activeSection === 'bills' ? 'Bills' : 'Maintenance'} Alerts Report`, 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      if (filteredData.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Alerts List', 20, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        filteredData.slice(0, 30).forEach((alert, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${index + 1}. ${alert.title || 'N/A'} - ${alert.severity.toUpperCase()} - ${alert.status}`, 20, yPos);
          yPos += 6;
        });
      } else {
        doc.setFontSize(12);
        doc.text('No alerts available', 20, yPos);
      }
      
      doc.save(`alerts-${activeSection}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      setToast({
        open: true,
        type: 'error',
        message: 'Failed to export PDF. Please try again.',
      });
    }
  };

  // Handle add alert
  const handleAddAlert = async (formData: AlertFormData) => {
    try {
      // Prepare API request data
      const requestData: alertService.CreateAlertRequest = {
        type: formData.type,
        title: formData.title,
        priority: formData.priority,
        description: formData.description || '',
        hostelId: Number(formData.hostelId),
        roomId: Number(formData.roomId),
        dueDate: formData.dueDate,
        tenantId: formData.tenantId ? Number(formData.tenantId) : undefined,
        amount: formData.amount ? Number(formData.amount) : undefined,
        assignedTo: formData.assignedTo ? Number(formData.assignedTo) : undefined,
        remarks: formData.remarks || undefined,
      };

      // Create alert via API
      await alertService.createAlertAPI(requestData);

      setToast({
        open: true,
        type: 'success',
        message: 'Alert created successfully!',
      });

      setIsAddAlertOpen(false);
      await loadAlerts();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create alert. Please try again.';
      setToast({
        open: true,
        type: 'error',
        message: errorMessage,
      });
      throw error; // Re-throw to let modal handle it
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

  // Handle view alert
  const handleViewAlert = (alertId: number) => {
    setSelectedAlertId(alertId);
    setIsViewAlertOpen(true);
  };

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

  // Actions renderer
  const actionsRender = (alert: Alert) => (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          handleViewAlert(Number(alert.id));
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="View Alert Details"
      >
        <EyeIcon className="w-4 h-4" />
        <span>View</span>
      </motion.button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Hostel Filter and Add Alert Button */}
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-1">System alerts and notifications</p>
        </div>
        <div className="flex items-center gap-3 sm:mt-0 mt-2">
          {/* Hostel Filter */}
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            Filter by Hostel:
          </label>
          <div className="w-64">
            <Select
              value={hostelFilter}
              onChange={setHostelFilter}
              options={hostelOptions}
              placeholder={hostelsLoading ? "Loading hostels..." : "All Hostels"}
              disabled={hostelsLoading}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            icon={ArrowDownTrayIcon}
          >
            Export PDF
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddAlertOpen(true)}
            icon={PlusIcon}
          >
            Add Alert
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading alerts...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadAlerts}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
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
      )}

      {/* Report Period Filter Section */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-white/20 shadow-lg mb-6"
        >
          <div className="space-y-4">
            {/* Report Period Heading */}
            <h3 className="text-sm font-bold text-slate-900">Report Period</h3>
            
            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Period Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Period:</label>
                <Select
                  value={reportPeriod}
                  onChange={(value) => {
                    setReportPeriod(value);
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0];
                    
                    if (value === 'Today') {
                      setDateFrom(todayStr);
                      setDateTo(todayStr);
                    } else if (value === 'Last 7 days') {
                      const last7Days = new Date(today);
                      last7Days.setDate(last7Days.getDate() - 7);
                      setDateFrom(last7Days.toISOString().split('T')[0]);
                      setDateTo(todayStr);
                    } else if (value === 'Last 30 days') {
                      const last30Days = new Date(today);
                      last30Days.setDate(last30Days.getDate() - 30);
                      setDateFrom(last30Days.toISOString().split('T')[0]);
                      setDateTo(todayStr);
                    } else if (value === 'This Month') {
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      setDateFrom(firstDay.toISOString().split('T')[0]);
                      setDateTo(todayStr);
                    } else if (value === 'This Year') {
                      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                      setDateFrom(firstDayOfYear.toISOString().split('T')[0]);
                      setDateTo(todayStr);
                    } else if (value === 'Custom Range') {
                      // Keep current dates for custom range
                    }
                  }}
                  options={[
                    { value: 'Today', label: 'Today' },
                    { value: 'Last 7 days', label: 'Last 7 days' },
                    { value: 'Last 30 days', label: 'Last 30 days' },
                    { value: 'This Month', label: 'This Month' },
                    { value: 'This Year', label: 'This Year' },
                    { value: 'Custom Range', label: 'Custom Range' },
                  ]}
                />
              </div>
              
              {/* From Date Input */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">From:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setReportPeriod('Custom Range');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              {/* To Date Input */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">To:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setReportPeriod('Custom Range');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            {/* Selected Report Period Display */}
            <div className="mt-3">
              <button
                type="button"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors text-sm font-medium text-slate-700"
              >
                Report Period: {formatDateDisplay(dateFrom)} - {formatDateDisplay(dateTo)}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data table */}
      {!loading && !error && (
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DataTable
            columns={columns}
            data={filteredData}
            toolbar={toolbar}
            actionsRender={actionsRender}
            emptyMessage={`No ${activeSection} alerts found.`}
          />
        </motion.div>
      )}

      {/* Add Alert Modal */}
      <AddAlertModal
        isOpen={isAddAlertOpen}
        onClose={() => setIsAddAlertOpen(false)}
        onSubmit={handleAddAlert}
      />

      {/* View Alert Modal */}
      <ViewAlertModal
        isOpen={isViewAlertOpen}
        onClose={() => {
          setIsViewAlertOpen(false);
          setSelectedAlertId(null);
        }}
        alertId={selectedAlertId}
      />

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

