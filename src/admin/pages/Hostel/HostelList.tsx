/**
 * HostelList page
 * View and manage hostels
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { SearchInput } from '../../components/SearchInput';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast } from '../../components/Toast';
import { AddHostelForm } from '../../components/AddHostelForm';
import type { Hostel, HostelFormData } from '../../types/hostel';
import type { ToastType } from '../../types/common';
import ROUTES from '../../routes/routePaths';
import * as hostelService from '../../services/hostel.service';

/**
 * Hostel list page
 */
const HostelList: React.FC = () => {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddHostelOpen, setIsAddHostelOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    hostel: Hostel | null;
  }>({ open: false, hostel: null });
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });

  // Load hostels
  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = () => {
    const data = hostelService.getAllHostels();
    setHostels(data);
  };

  // Search filtering
  const filteredData = searchQuery
    ? hostelService.searchHostels(searchQuery)
    : hostels;

  // Handle add hostel
  const handleAddHostel = (data: HostelFormData) => {
    try {
      const newHostel = hostelService.createHostel(data);
      setToast({
        open: true,
        type: 'success',
        message: `Hostel "${newHostel.name}" created successfully!`,
      });
      loadHostels();
      // Optionally navigate to view the new hostel
      // navigate(`/admin/hostel/${newHostel.id}`);
    } catch (error) {
      setToast({
        open: true,
        type: 'error',
        message: 'Failed to create hostel. Please try again.',
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!deleteConfirm.hostel) return;

    const success = hostelService.deleteHostel(deleteConfirm.hostel.id);
    if (success) {
      setToast({
        open: true,
        type: 'success',
        message: `Hostel "${deleteConfirm.hostel.name}" deleted successfully`,
      });
      loadHostels();
    } else {
      setToast({
        open: true,
        type: 'error',
        message: 'Failed to delete hostel',
      });
    }
    setDeleteConfirm({ open: false, hostel: null });
  };

  // Define columns
  const columns: Column<Hostel>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
    },
    {
      key: 'totalFloors',
      label: 'Floors',
    },
    {
      key: 'roomsPerFloor',
      label: 'Rooms/Floor',
    },
    {
      key: 'managerName',
      label: 'Manager',
    },
    {
      key: 'managerPhone',
      label: 'Phone',
    },
  ];

  // Actions renderer
  const actionsRender = (hostel: Hostel) => (
    <div className="flex gap-2">
      <button
        onClick={() => navigate(`/admin/hostel/${hostel.id}`)}
        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
      >
        View
      </button>
      <button
        onClick={() => navigate(ROUTES.HOSTEL_EDIT(hostel.id))}
        className="px-3 py-1 text-sm bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors font-medium"
      >
        Edit
      </button>
      <button
        onClick={() => setDeleteConfirm({ open: true, hostel })}
        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
      >
        Delete
      </button>
    </div>
  );

  // Toolbar
  const toolbar = (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search by name, city, or manager..."
    />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Hostel Management
          </h1>
          <p className="text-slate-600 mt-1">Manage hostel properties</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddHostelOpen(true)}
          icon={PlusIcon}
        >
          Add Hostel
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={filteredData}
        toolbar={toolbar}
        actionsRender={actionsRender}
        emptyMessage="No hostels found. Create your first hostel to get started."
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Hostel"
        message={`Are you sure you want to delete "${deleteConfirm.hostel?.name}"? This will remove all its rooms and related data.`}
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, hostel: null })}
      />

      {/* Toast notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />

      {/* Add Hostel Modal Form */}
      <AddHostelForm
        isOpen={isAddHostelOpen}
        onClose={() => setIsAddHostelOpen(false)}
        onSubmit={handleAddHostel}
      />
    </div>
  );
};

export default HostelList;

