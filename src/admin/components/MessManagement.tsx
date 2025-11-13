/**
 * Mess Management component
 * Manages day-by-day mess entries with breakfast, lunch, and dinner
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, CurrencyDollarIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { Tabs } from './Tabs';
import { DataTable } from './DataTable';
import type { Column } from './DataTable';
import type { MessEntry, MessFormData, MealType } from '../types/hostel';
import type { ToastType } from '../types/common';
import type { Id } from '../types/common';
import * as messService from '../services/mess.service';
import { formatDate } from '../types/common';

interface MessManagementProps {
  hostelId: Id;
}

export const MessManagement: React.FC<MessManagementProps> = ({ hostelId }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'management'>('list');
  const [messEntries, setMessEntries] = useState<MessEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MessEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    entry: MessEntry | null;
  }>({ open: false, entry: null });
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });

  const [formData, setFormData] = useState<MessFormData>({
    date: new Date().toISOString().split('T')[0],
    breakfast: { items: [{ id: `breakfast-${Date.now()}`, name: '', quantity: '', unit: '' }] },
    lunch: { items: [{ id: `lunch-${Date.now() + 1}`, name: '', quantity: '', unit: '' }] },
    dinner: { items: [{ id: `dinner-${Date.now() + 2}`, name: '', quantity: '', unit: '' }] },
  });

  useEffect(() => {
    loadMessEntries();
  }, [hostelId]);

  const loadMessEntries = () => {
    const entries = messService.getMessEntriesByHostel(hostelId);
    // Sort by date descending (newest first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMessEntries(entries);
  };

  const handleAddItem = useCallback((mealType: MealType) => {
    setFormData((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        items: [...prev[mealType].items, { id: `${mealType}-${Date.now()}-${Math.random()}`, name: '', quantity: '', unit: '' }],
      },
    }));
  }, []);

  const handleRemoveItem = useCallback((mealType: MealType, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        items: prev[mealType].items.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const handleItemChange = useCallback((
    mealType: MealType,
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        items: prev[mealType].items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  }, []);

  const handleNotesChange = useCallback((mealType: MealType, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        notes,
      },
    }));
  }, []);

  // Stable callback wrappers for each meal type
  const breakfastCallbacks = React.useMemo(() => ({
    onAddItem: () => handleAddItem('breakfast'),
    onRemoveItem: (index: number) => handleRemoveItem('breakfast', index),
    onItemChange: (index: number, field: 'name' | 'quantity' | 'unit', value: string) => 
      handleItemChange('breakfast', index, field, value),
    onNotesChange: (notes: string) => handleNotesChange('breakfast', notes),
  }), [handleAddItem, handleRemoveItem, handleItemChange, handleNotesChange]);

  const lunchCallbacks = React.useMemo(() => ({
    onAddItem: () => handleAddItem('lunch'),
    onRemoveItem: (index: number) => handleRemoveItem('lunch', index),
    onItemChange: (index: number, field: 'name' | 'quantity' | 'unit', value: string) => 
      handleItemChange('lunch', index, field, value),
    onNotesChange: (notes: string) => handleNotesChange('lunch', notes),
  }), [handleAddItem, handleRemoveItem, handleItemChange, handleNotesChange]);

  const dinnerCallbacks = React.useMemo(() => ({
    onAddItem: () => handleAddItem('dinner'),
    onRemoveItem: (index: number) => handleRemoveItem('dinner', index),
    onItemChange: (index: number, field: 'name' | 'quantity' | 'unit', value: string) => 
      handleItemChange('dinner', index, field, value),
    onNotesChange: (notes: string) => handleNotesChange('dinner', notes),
  }), [handleAddItem, handleRemoveItem, handleItemChange, handleNotesChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one item exists in each meal
    const hasBreakfastItems = formData.breakfast.items.some(
      (item) => item.name.trim() && item.quantity.trim()
    );
    const hasLunchItems = formData.lunch.items.some(
      (item) => item.name.trim() && item.quantity.trim()
    );
    const hasDinnerItems = formData.dinner.items.some(
      (item) => item.name.trim() && item.quantity.trim()
    );

    if (!hasBreakfastItems && !hasLunchItems && !hasDinnerItems) {
      setToast({
        open: true,
        type: 'warning',
        message: 'Please add at least one item to any meal',
      });
      return;
    }

    try {
      // Filter out empty items before submitting
      const cleanedData: MessFormData = {
        date: formData.date,
        breakfast: {
          items: formData.breakfast.items.filter(
            (item) => item.name.trim() && item.quantity.trim()
          ),
          notes: formData.breakfast.notes,
        },
        lunch: {
          items: formData.lunch.items.filter(
            (item) => item.name.trim() && item.quantity.trim()
          ),
          notes: formData.lunch.notes,
        },
        dinner: {
          items: formData.dinner.items.filter(
            (item) => item.name.trim() && item.quantity.trim()
          ),
          notes: formData.dinner.notes,
        },
      };

      if (editingEntry) {
        messService.updateMessEntry(editingEntry.id, cleanedData);
        setToast({
          open: true,
          type: 'success',
          message: 'Mess entry updated successfully!',
        });
      } else {
        messService.createMessEntry(hostelId, cleanedData);
        setToast({
          open: true,
          type: 'success',
          message: 'Mess entry created successfully!',
        });
      }

      resetForm();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingEntry(null);
      loadMessEntries();
    } catch (error: any) {
      setToast({
        open: true,
        type: 'error',
        message: error.message || 'Failed to save mess entry. Please try again.',
      });
    }
  };

  const handleEdit = (entry: MessEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      breakfast: {
        items:
          entry.breakfast.items.length > 0
            ? entry.breakfast.items.map((item, idx) => ({
                id: `breakfast-${entry.id}-${idx}`,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit || '',
              }))
            : [{ id: `breakfast-${Date.now()}`, name: '', quantity: '', unit: '' }],
        notes: entry.breakfast.notes,
      },
      lunch: {
        items:
          entry.lunch.items.length > 0
            ? entry.lunch.items.map((item, idx) => ({
                id: `lunch-${entry.id}-${idx}`,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit || '',
              }))
            : [{ id: `lunch-${Date.now()}`, name: '', quantity: '', unit: '' }],
        notes: entry.lunch.notes,
      },
      dinner: {
        items:
          entry.dinner.items.length > 0
            ? entry.dinner.items.map((item, idx) => ({
                id: `dinner-${entry.id}-${idx}`,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit || '',
              }))
            : [{ id: `dinner-${Date.now()}`, name: '', quantity: '', unit: '' }],
        notes: entry.dinner.notes,
      },
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteConfirm.entry) return;

    const success = messService.deleteMessEntry(deleteConfirm.entry.id);
    if (success) {
      setToast({
        open: true,
        type: 'success',
        message: 'Mess entry deleted successfully',
      });
      loadMessEntries();
    } else {
      setToast({
        open: true,
        type: 'error',
        message: 'Failed to delete mess entry',
      });
    }
    setDeleteConfirm({ open: false, entry: null });
  };

  const resetForm = () => {
    const now = Date.now();
    setFormData({
      date: new Date().toISOString().split('T')[0],
      breakfast: { items: [{ id: `breakfast-${now}`, name: '', quantity: '', unit: '' }] },
      lunch: { items: [{ id: `lunch-${now + 1}`, name: '', quantity: '', unit: '' }] },
      dinner: { items: [{ id: `dinner-${now + 2}`, name: '', quantity: '', unit: '' }] },
    });
  };

  // Helper function to get day name from date string
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Calculate mess statistics for management tab
  const messStats = useMemo(() => {
    const allItems: Array<{ name: string; quantity: string; unit?: string; mealType: string; date: string }> = [];
    let totalEntries = messEntries.length;
    let totalMeals = 0;

    messEntries.forEach((entry) => {
      ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
        const meal = entry[mealType as MealType];
        if (meal.items.length > 0) {
          totalMeals++;
        }
        meal.items.forEach((item) => {
          allItems.push({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
            date: entry.date,
          });
        });
      });
    });

    // Group items by name to calculate totals
    const itemMap = new Map<string, { totalQuantity: number; unit: string; occurrences: number; dates: string[] }>();
    
    allItems.forEach((item) => {
      const existing = itemMap.get(item.name);
      const quantity = parseFloat(item.quantity) || 0;
      
      if (existing) {
        existing.totalQuantity += quantity;
        existing.occurrences += 1;
        if (!existing.dates.includes(item.date)) {
          existing.dates.push(item.date);
        }
      } else {
        itemMap.set(item.name, {
          totalQuantity: quantity,
          unit: item.unit || '',
          occurrences: 1,
          dates: [item.date],
        });
      }
    });

    // Convert to array and sort by total quantity
    const materialUsage = Array.from(itemMap.entries())
      .map(([name, data], index) => ({
        id: `material-${index}-${name}`,
        name,
        totalQuantity: data.totalQuantity,
        unit: data.unit,
        occurrences: data.occurrences,
        datesUsed: data.dates.length,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return {
      totalEntries,
      totalMeals,
      totalItems: allItems.length,
      uniqueMaterials: itemMap.size,
      materialUsage,
    };
  }, [messEntries]);

  // Define tabs
  const tabs = [
    {
      id: 'list',
      label: 'Mess List',
      count: messEntries.length,
    },
    {
      id: 'management',
      label: 'Mess Management',
    },
  ];

  // Columns for material usage table
  const materialColumns: Column<typeof messStats.materialUsage[0]>[] = [
    {
      key: 'name',
      label: 'Material Name',
      sortable: true,
    },
    {
      key: 'totalQuantity',
      label: 'Total Quantity',
      render: (row) => `${row.totalQuantity} ${row.unit || ''}`,
      sortable: true,
    },
    {
      key: 'occurrences',
      label: 'Times Used',
      sortable: true,
    },
    {
      key: 'datesUsed',
      label: 'Days Used',
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mess Management</h2>
        <p className="text-slate-600 mt-1">Manage daily meals, ingredients, and costs</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'list' | 'management')}
      />

      {/* Tab Content */}
      {activeTab === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Mess Entries</h3>
              <p className="text-sm text-slate-600">View and manage daily mess entries</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              icon={PlusIcon}
            >
              Add Mess Entry
            </Button>
          </div>

          {/* Mess Entries List */}
          {messEntries.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <CalendarIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">No mess entries yet</p>
          <p className="text-slate-500 mt-1">Click "Add Mess Entry" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {getDayName(entry.date)} - {formatDate(entry.date)}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Created: {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ open: true, entry })}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Breakfast */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Breakfast</h4>
                  {entry.breakfast.items.length > 0 ? (
                    <ul className="space-y-1">
                      {entry.breakfast.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          • {item.name} - {item.quantity} {item.unit || ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No items</p>
                  )}
                  {entry.breakfast.notes && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      {entry.breakfast.notes}
                    </p>
                  )}
                </div>

                {/* Lunch */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Lunch</h4>
                  {entry.lunch.items.length > 0 ? (
                    <ul className="space-y-1">
                      {entry.lunch.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          • {item.name} - {item.quantity} {item.unit || ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No items</p>
                  )}
                  {entry.lunch.notes && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      {entry.lunch.notes}
                    </p>
                  )}
                </div>

                {/* Dinner */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Dinner</h4>
                  {entry.dinner.items.length > 0 ? (
                    <ul className="space-y-1">
                      {entry.dinner.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          • {item.name} - {item.quantity} {item.unit || ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No items</p>
                  )}
                  {entry.dinner.notes && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      {entry.dinner.notes}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
          )}
        </motion.div>
      )}

      {/* Mess Management Tab */}
      {activeTab === 'management' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Entries</p>
                  <p className="text-2xl font-bold text-blue-900">{messStats.totalEntries}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CubeIcon className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Meals</p>
                  <p className="text-2xl font-bold text-green-900">{messStats.totalMeals}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CubeIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-purple-900">{messStats.totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CurrencyDollarIcon className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-amber-600 font-medium">Unique Materials</p>
                  <p className="text-2xl font-bold text-amber-900">{messStats.uniqueMaterials}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Material Usage Table */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Material Usage Summary</h3>
              <p className="text-sm text-slate-600 mt-1">
                All materials and ingredients used in the mess system
              </p>
            </div>

            {messStats.materialUsage.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <CubeIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">No materials recorded yet</p>
                <p className="text-slate-500 mt-1">Add mess entries to track material usage</p>
              </div>
            ) : (
              <DataTable
                columns={materialColumns}
                data={messStats.materialUsage}
                emptyMessage="No materials found"
              />
            )}
          </div>

          {/* Cost Summary (Placeholder for future cost tracking) */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Cost Summary</h3>
              <p className="text-sm text-slate-600 mt-1">
                Track costs and expenses for mess operations
              </p>
            </div>
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <CurrencyDollarIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">Cost tracking coming soon</p>
              <p className="text-slate-500 mt-1">This feature will track material costs and expenses</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingEntry(null);
          resetForm();
        }}
        title={editingEntry ? 'Edit Mess Entry' : 'Add Mess Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.date && (
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    {getDayName(formData.date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Breakfast Section */}
          <MealSectionComponent
            mealType="breakfast"
            mealData={formData.breakfast}
            {...breakfastCallbacks}
          />
          {/* Lunch Section */}
          <MealSectionComponent
            mealType="lunch"
            mealData={formData.lunch}
            {...lunchCallbacks}
          />
          {/* Dinner Section */}
          <MealSectionComponent
            mealType="dinner"
            mealData={formData.dinner}
            {...dinnerCallbacks}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingEntry(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Mess Entry"
        message={`Are you sure you want to delete the mess entry for ${deleteConfirm.entry ? formatDate(deleteConfirm.entry.date) : ''}?`}
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, entry: null })}
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

// MealSection component defined outside to prevent recreation on each render
interface MealSectionProps {
  mealType: MealType;
  mealData: { items: Array<{ id?: string; name: string; quantity: string; unit?: string }>; notes?: string };
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: 'name' | 'quantity' | 'unit', value: string) => void;
  onNotesChange: (notes: string) => void;
}

const MealSectionComponent: React.FC<MealSectionProps> = React.memo(({
  mealType,
  mealData,
  onAddItem,
  onRemoveItem,
  onItemChange,
  onNotesChange,
}) => {
  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const mealColor =
    mealType === 'breakfast'
      ? 'bg-yellow-50 border-yellow-200'
      : mealType === 'lunch'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-purple-50 border-purple-200';

  return (
    <div className={`border-2 rounded-lg p-4 ${mealColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900">{mealLabel}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddItem}
          icon={PlusIcon}
        >
          Add Item
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        {mealData.items.map((item, index) => (
          <div key={item.id || `item-${mealType}-${index}`} className="flex gap-2 items-start">
            <input
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => onItemChange(index, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Quantity"
              value={item.quantity}
              onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Unit (kg, pcs)"
              value={item.unit || ''}
              onChange={(e) => onItemChange(index, 'unit', e.target.value)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {mealData.items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveItem(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <textarea
        placeholder={`${mealLabel} notes (optional)`}
        value={mealData.notes || ''}
        onChange={(e) => onNotesChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
    </div>
  );
});

