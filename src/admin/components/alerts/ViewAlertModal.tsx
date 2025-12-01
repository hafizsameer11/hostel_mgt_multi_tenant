/**
 * View Alert Modal Component
 * Professional modal to display alert details
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../Badge';
import { formatDate } from '../../types/common';
import * as alertService from '../../services/alert.service';

interface ViewAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: number | null;
}

export const ViewAlertModal: React.FC<ViewAlertModalProps> = ({
  isOpen,
  onClose,
  alertId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<alertService.AlertDetailApiResponse['data'] | null>(null);

  // Fetch alert details when modal opens
  useEffect(() => {
    if (isOpen && alertId) {
      fetchAlertDetails();
    } else {
      setAlertData(null);
      setError(null);
    }
  }, [isOpen, alertId]);

  const fetchAlertDetails = async () => {
    if (!alertId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await alertService.getAlertByIdAPI(alertId);
      setAlertData(response.data);
    } catch (err: any) {
      console.error('Error fetching alert details:', err);
      setError(err?.message || 'Failed to load alert details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get severity icon and color
  const getSeverityConfig = (severity: string) => {
    const severityUpper = severity.toUpperCase();
    if (severityUpper === 'DANGER' || severityUpper === 'WARN') {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }
    if (severityUpper === 'INFO') {
      return {
        icon: InformationCircleIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }
    return {
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    };
  };

  if (!isOpen) return null;

  const severityConfig = alertData ? getSeverityConfig(alertData.severity) : null;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <InformationCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Alert Details</h2>
                    <p className="text-blue-100 text-sm">View complete alert information</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={fetchAlertDetails}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!loading && !error && alertData && (
                  <div className="space-y-6">
                    {/* Alert Header Info */}
                    <div className={`${severityConfig?.bgColor} ${severityConfig?.borderColor} border-2 rounded-xl p-6`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {severityConfig && (
                            <severityConfig.icon className={`w-8 h-8 ${severityConfig.color} flex-shrink-0 mt-1`} />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-slate-900">{alertData.title}</h3>
                              <Badge
                                variant={
                                  alertData.severity.toUpperCase() === 'DANGER'
                                    ? 'danger'
                                    : alertData.severity.toUpperCase() === 'WARN'
                                    ? 'warning'
                                    : 'info'
                                }
                              >
                                {alertData.severity}
                              </Badge>
                              <Badge variant={alertData.status === 'open' ? 'warning' : 'success'}>
                                {alertData.status}
                              </Badge>
                            </div>
                            {alertData.description && (
                              <p className="text-slate-700 text-base leading-relaxed">{alertData.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Alert Type & Priority */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Alert Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Type</span>
                              <Badge variant="info">{alertData.type}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Priority</span>
                              <Badge
                                variant={
                                  alertData.priority === 'high' || alertData.priority === 'urgent'
                                    ? 'danger'
                                    : alertData.priority === 'medium'
                                    ? 'warning'
                                    : 'info'
                                }
                              >
                                {alertData.priority}
                              </Badge>
                            </div>
                            {alertData.maintenanceType && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">Maintenance Type</span>
                                <span className="font-medium text-slate-900 capitalize">
                                  {alertData.maintenanceType.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Location Information */}
                        {(alertData.hostel || alertData.room) && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <BuildingOfficeIcon className="w-4 h-4" />
                              Location
                            </h4>
                            <div className="space-y-3">
                              {alertData.hostel && (
                                <div className="flex items-center gap-3">
                                  <HomeIcon className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-xs text-slate-500">Hostel</p>
                                    <p className="font-medium text-slate-900">{alertData.hostel.name}</p>
                                  </div>
                                </div>
                              )}
                              {alertData.room && (
                                <div className="flex items-center gap-3">
                                  <HomeIcon className="w-5 h-5 text-purple-600" />
                                  <div>
                                    <p className="text-xs text-slate-500">Room</p>
                                    <p className="font-medium text-slate-900">Room {alertData.room.roomNumber}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Financial Information */}
                        {(alertData.amount || alertData.dueDate) && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <CurrencyDollarIcon className="w-4 h-4" />
                              Financial Details
                            </h4>
                            <div className="space-y-3">
                              {alertData.amount && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Amount</span>
                                  <span className="font-bold text-slate-900 text-lg">
                                    ₹{alertData.amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {alertData.dueDate && (
                                <div className="flex items-center gap-3">
                                  <CalendarIcon className="w-5 h-5 text-amber-600" />
                                  <div>
                                    <p className="text-xs text-slate-500">Due Date</p>
                                    <p className="font-medium text-slate-900">{alertData.dueDate}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Assigned User */}
                        {alertData.assignedUser && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <UserIcon className="w-4 h-4" />
                              Assigned To
                            </h4>
                            <div className="space-y-2">
                              <p className="font-medium text-slate-900">{alertData.assignedUser.name}</p>
                              <p className="text-sm text-slate-600">@{alertData.assignedUser.username}</p>
                              <p className="text-sm text-slate-500">{alertData.assignedUser.email}</p>
                            </div>
                          </div>
                        )}

                        {/* Tenant Information */}
                        {alertData.tenant && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <UserIcon className="w-4 h-4" />
                              Tenant
                            </h4>
                            <div className="space-y-2">
                              <p className="font-medium text-slate-900">{alertData.tenant.name}</p>
                              <p className="text-sm text-slate-500">{alertData.tenant.email}</p>
                              <p className="text-sm text-slate-500">{alertData.tenant.phone}</p>
                            </div>
                          </div>
                        )}

                        {/* Creator Information */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Created By
                          </h4>
                          <div className="space-y-2">
                            <p className="font-medium text-slate-900">{alertData.creator.name}</p>
                            <p className="text-sm text-slate-600">@{alertData.creator.username}</p>
                            {alertData.creator.email && (
                              <p className="text-sm text-slate-500">{alertData.creator.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Timeline
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-slate-500">Created</p>
                              <p className="font-medium text-slate-900">{formatDate(alertData.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Last Updated</p>
                              <p className="font-medium text-slate-900">{formatDate(alertData.updatedAt)}</p>
                            </div>
                            {alertData.resolvedAt && (
                              <div>
                                <p className="text-xs text-slate-500">Resolved</p>
                                <p className="font-medium text-green-600">{formatDate(alertData.resolvedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remarks */}
                    {alertData.remarks && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <h4 className="text-sm font-semibold text-amber-900 mb-2">Remarks</h4>
                        <p className="text-amber-800">{alertData.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

