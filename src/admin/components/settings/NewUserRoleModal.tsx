import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  KeyIcon,
  InformationCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import type { NewUserRoleModalProps, UserRoleFormData } from '../../types/settings';

export const NewUserRoleModal: React.FC<NewUserRoleModalProps> = ({
  isOpen,
  onClose,
  roleData,
  isEdit = false,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'objects'>('general');
  const [formData, setFormData] = useState<UserRoleFormData>({
    roleName: '',
    roleDescription: '',
    permissions: {
      people: {
        prospects: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
        owners: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
        vendors: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
        tenants: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
        users: { viewList: true, viewOne: false, create: false, edit: false, delete: false },
        userRoles: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
        apiKeys: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
      },
      tasksAndMaintenance: {
        tasks: {
          viewList: 'view',
          viewOne: 'view',
          create: true,
          edit: true,
          delete: false,
        },
        workOrders: {
          viewList: 'none',
          viewOne: 'none',
          create: false,
          edit: false,
          delete: false,
        },
        tenantRequests: {
          viewList: 'none',
          viewOne: 'none',
          create: false,
          edit: false,
          delete: false,
        },
        ownerRequests: {
          viewList: 'none',
          viewOne: 'none',
          create: false,
          edit: false,
          delete: false,
        },
      },
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (roleData && isEdit) {
        setFormData(roleData);
      } else {
        setFormData({
          roleName: '',
          roleDescription: '',
          permissions: {
            people: {
              prospects: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
              owners: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
              vendors: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
              tenants: { viewList: true, viewOne: true, create: false, edit: false, delete: false },
              users: { viewList: true, viewOne: false, create: false, edit: false, delete: false },
              userRoles: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
              apiKeys: { viewList: false, viewOne: false, create: false, edit: false, delete: false },
            },
            tasksAndMaintenance: {
              tasks: {
                viewList: 'none',
                viewOne: 'none',
                create: false,
                edit: false,
                delete: false,
              },
              workOrders: {
                viewList: 'none',
                viewOne: 'none',
                create: false,
                edit: false,
                delete: false,
              },
              tenantRequests: {
                viewList: 'none',
                viewOne: 'none',
                create: false,
                edit: false,
                delete: false,
              },
              ownerRequests: {
                viewList: 'none',
                viewOne: 'none',
                create: false,
                edit: false,
                delete: false,
              },
            },
          },
        });
        setActiveTab('general');
      }
    }
  }, [isOpen, roleData, isEdit]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const errors: string[] = [];

    if (!formData.roleName.trim()) {
      errors.push('Role Name is required');
    }

    if (errors.length > 0) {
      alert('Please fill in all required fields:\n' + errors.join('\n'));
      return;
    }

    console.log('Submitting user role data:', formData);

    try {
      localStorage.setItem('userRoleData', JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    onClose();
  };

  const handleInputChange = (field: keyof UserRoleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePeoplePermissionChange = (
    entity: string,
    permission: 'viewList' | 'viewOne' | 'create' | 'edit' | 'delete',
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        people: {
          ...prev.permissions.people,
          [entity]: {
            ...prev.permissions.people[entity],
            [permission]: value,
          },
        },
      },
    }));
  };

  const handleTasksPermissionChange = (
    entity: string,
    permission: 'viewList' | 'viewOne' | 'create' | 'edit' | 'delete',
    value: boolean | 'none' | 'view' | 'edit'
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        tasksAndMaintenance: {
          ...prev.permissions.tasksAndMaintenance,
          [entity]: {
            ...prev.permissions.tasksAndMaintenance[entity],
            [permission]: value,
          },
        },
      },
    }));
  };

  const sidebarItems = [
    { id: 'general' as const, label: 'General Info', icon: InformationCircleIcon },
    { id: 'objects' as const, label: 'Objects', icon: GlobeAltIcon },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const peopleEntities = [
    { key: 'owners', label: 'Owners' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'tenants', label: 'Tenants' },
  ];

  const tasksEntities = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'workOrders', label: 'Work Orders' },
    { key: 'tenantRequests', label: 'Tenant Requests' },
    { key: 'ownerRequests', label: 'Owner Requests' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

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
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6 text-white" />
                    <h2 className="text-lg font-semibold text-white">User Role</h2>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {activeTab === 'general' && 'GENERAL INFO'}
                      {activeTab === 'objects' && 'OBJECTS'}
                    </h3>
                    <span className="block w-12 h-1 bg-pink-500 mt-1" />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-600" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            What would you like to call this Role? (For example, "Accountant Role")
                          </label>
                          <label className="block text-xs text-slate-500 mb-1">Role Name</label>
                          <input
                            type="text"
                            value={formData.roleName}
                            onChange={(e) => handleInputChange('roleName', e.target.value)}
                            placeholder="Accountants"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            How would you describe this Role? (For example, gives read access only to financial data)
                          </label>
                          <label className="block text-xs text-slate-500 mb-1">Role Description</label>
                          <textarea
                            value={formData.roleDescription}
                            onChange={(e) => handleInputChange('roleDescription', e.target.value)}
                            placeholder="Responsible for the management and reporting of financial data of your organization."
                            rows={4}
                            maxLength={1000}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          <div className="mt-1 text-xs text-slate-500 text-right">
                            {formData.roleDescription.length}/1000 characters
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'objects' && (
                      <div className="space-y-6">
                        <p className="text-sm text-slate-600">
                          You can set custom access levels for each page in DoorLoop. This will allow or block a user from viewing that page or taking any actions.
                        </p>

                        {/* People Section */}
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-4">People</h4>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Entity
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    View List
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    View One
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Create
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Edit
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Delete
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {peopleEntities.map((entity) => {
                                  const permissions = formData.permissions.people[entity.key];
                                  return (
                                    <tr key={entity.key} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {entity.label}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.viewList}
                                          onChange={(e) =>
                                            handlePeoplePermissionChange(entity.key, 'viewList', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.viewOne}
                                          onChange={(e) =>
                                            handlePeoplePermissionChange(entity.key, 'viewOne', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.create}
                                          onChange={(e) =>
                                            handlePeoplePermissionChange(entity.key, 'create', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.edit}
                                          onChange={(e) =>
                                            handlePeoplePermissionChange(entity.key, 'edit', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.delete}
                                          onChange={(e) =>
                                            handlePeoplePermissionChange(entity.key, 'delete', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Tasks & Maintenance Section */}
                        {/* <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-4">Tasks & Maintenance</h4>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                                    Entity
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    View List
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    View One
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Create
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Edit
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                                    Delete
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {tasksEntities.map((entity) => {
                                  const permissions = formData.permissions.tasksAndMaintenance[entity.key];
                                  return (
                                    <tr key={entity.key} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {entity.label}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {(['none', 'view', 'edit'] as const).map((level) => (
                                            <button
                                              key={level}
                                              type="button"
                                              onClick={() =>
                                                handleTasksPermissionChange(entity.key, 'viewList', level)
                                              }
                                              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                                permissions.viewList === level
                                                  ? 'bg-blue-600 border-blue-600'
                                                  : 'bg-white border-slate-300 hover:border-blue-400'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {(['none', 'view', 'edit'] as const).map((level) => (
                                            <button
                                              key={level}
                                              type="button"
                                              onClick={() =>
                                                handleTasksPermissionChange(entity.key, 'viewOne', level)
                                              }
                                              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                                permissions.viewOne === level
                                                  ? 'bg-blue-600 border-blue-600'
                                                  : 'bg-white border-slate-300 hover:border-blue-400'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.create}
                                          onChange={(e) =>
                                            handleTasksPermissionChange(entity.key, 'create', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.edit}
                                          onChange={(e) =>
                                            handleTasksPermissionChange(entity.key, 'edit', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={permissions.delete}
                                          onChange={(e) =>
                                            handleTasksPermissionChange(entity.key, 'delete', e.target.checked)
                                          }
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div> */}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

