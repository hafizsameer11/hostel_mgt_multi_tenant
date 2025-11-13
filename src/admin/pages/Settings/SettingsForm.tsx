/**
 * SettingsForm page
 * General Settings page with Personal and Company sections
 * Card-based layout matching the design image
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CalculatorIcon,
  UsersIcon,
  KeyIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Toast } from '../../components/Toast';
import type { ToastType } from '../../types/common';
import { SearchInput } from '../../components/SearchInput';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PersonalInfoModal } from '../../components/settings/PersonalInfoModal';
import { HostelInfoModal } from '../../components/settings/HostelInfoModal';
import { NewUserModal } from '../../components/settings/NewUserModal';
import { UserRolesList } from '../../components/settings/UserRolesList';
import { NewUserRoleModal } from '../../components/settings/NewUserRoleModal';
import type {
  PersonalInfoModalProps,
  HostelInfoModalProps,
  NewUserModalProps,
  User,
  NewUserFormData,
  UserRole,
  UserRoleFormData,
} from '../../types/settings';

interface SettingCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface LoginPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginPasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Change Password Modal Component
 */
const LoginPasswordModal: React.FC<LoginPasswordModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<LoginPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

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

  const handleInputChange = (field: keyof LoginPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API call
    const passwordData = {
      password: formData.password,
    };

    console.log('Submitting password change:', passwordData);

    // TODO: Replace with actual API call
    // Example:
    // try {
    //   await fetch('/api/change-password', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(passwordData),
    //   });
    //   // Handle success
    // } catch (error) {
    //   // Handle error
    // }

    // For now, save to localStorage as backup
    try {
      localStorage.setItem('passwordChangeData', JSON.stringify(passwordData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    // Reset form and close
    setFormData({ password: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

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
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                  <span className="block w-12 h-1 bg-pink-500 mt-1" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6 max-w-md">
                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter new password"
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.password
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showPassword ? (
                            <LockClosedIcon className="w-5 h-5" />
                          ) : (
                            <LockClosedIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm new password"
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.confirmPassword
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showConfirmPassword ? (
                            <LockClosedIcon className="w-5 h-5" />
                          ) : (
                            <LockClosedIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Users List Component
 */
interface UsersListProps {
  onBack: () => void;
  onNewUser: () => void;
  onEditUser: (user: User) => void;
}

const UsersList: React.FC<UsersListProps> = ({ onBack, onNewUser, onEditUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock users data - in real app, this would come from API
  const [users] = useState<User[]>([
    {
      id: '1',
      firstName: 'Darrel',
      lastName: 'Wilson',
      phone: '(702) 630-0989',
      email: 'darrelporto@gmail.com',
      role: 'Full Access',
      properties: 'All Properties',
      status: 'Active',
      isAccountOwner: true,
    },
  ]);

  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Memoize search handler to prevent re-renders
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Define columns - memoized to prevent re-renders
  const columns: Column<User>[] = React.useMemo(() => [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>
                {user.status} {user.isAccountOwner && '/ Account Owner'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Information',
      render: (user) => (
        <div className="flex items-center gap-2 text-slate-700">
          <PhoneIcon className="w-4 h-4 text-slate-500" />
          <span>{user.phone}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <span className="text-slate-700">{user.role}</span>
      ),
    },
    {
      key: 'properties',
      label: 'Properties',
      render: (user) => (
        <span className="text-slate-700">{user.properties}</span>
      ),
    },
  ], []);

  // Actions render for each row - memoized to prevent re-renders
  const actionsRender = React.useCallback((user: User) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        // Handle menu click
      }}
      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
    >
      <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
    </button>
  ), []);

  // Toolbar with search and filter - memoized to prevent re-renders
  const toolbar = React.useMemo(
    () => (
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search users"
              className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>
        <button 
          type="button"
          className="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <FunnelIcon className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    ),
    [searchQuery, handleSearchChange]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        </div>
        <button
          onClick={onNewUser}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>New User</span>
        </button>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        toolbar={toolbar}
        onRowClick={onEditUser}
        actionsRender={actionsRender}
        emptyMessage="No users found"
        pageSize={10}
      />
    </div>
  );
};

/**
 * Settings form page with card-based layout
 */
const SettingsForm: React.FC = () => {
  const [toast, setToast] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
  }>({ open: false, type: 'success', message: '' });
  
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isLoginPasswordOpen, setIsLoginPasswordOpen] = useState(false);
  const [isHostelInfoOpen, setIsHostelInfoOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserRolesList, setShowUserRolesList] = useState(false);
  const [isNewUserRoleOpen, setIsNewUserRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  // Personal settings cards
  const personalSettings: SettingCard[] = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Change your name, picture, phone, email, & mailing address.',
      icon: UserCircleIcon,
      onClick: () => {
        setIsPersonalInfoOpen(true);
      },
    },
    {
      id: 'login-password',
      title: 'Change Password',
      description: 'Change your email or password, and allow technician access.',
      icon: LockClosedIcon,
      onClick: () => {
        setIsLoginPasswordOpen(true);
      },
    },
  ];

  // Company settings cards
  const companySettings: SettingCard[] = [
    {
      id: 'company-info',
      title: 'Hostel Info',
      description: 'Change your hostel name, logo, address, login URL, and account owner.',
      icon: BuildingOfficeIcon,
      onClick: () => {
        setIsHostelInfoOpen(true);
      },
    },
    // {
    //   id: 'region-currency',
    //   title: 'Region & Currency',
    //   description: 'Change your country, date formats, and currency settings.',
    //   icon: GlobeAltIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Region & Currency settings coming soon!',
    //     });
    //   },
    // },
    // {
    //   id: 'default-accounts',
    //   title: 'Default Accounts',
    //   description: 'Change your default bank accounts and chart of accounts.',
    //   icon: CalculatorIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Default Accounts settings coming soon!',
    //     });
    //   },
    // },
    {
      id: 'users',
      title: 'Users',
      description: 'Add or edit users.',
      icon: UsersIcon,
      onClick: () => {
        setShowUsersList(true);
      },
    },
    {
      id: 'user-roles',
      title: 'User Roles',
      description: 'Allow or block access to features of the system for each user.',
      icon: KeyIcon,
      onClick: () => {
        setShowUserRolesList(true);
      },
    },
    // {
    //   id: 'subscription',
    //   title: 'Subscription',
    //   description: 'Change or update your subscription plan.',
    //   icon: ClipboardDocumentCheckIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Subscription management coming soon!',
    //     });
    //   },
    // },
    // {
    //   id: 'quickbooks-sync',
    //   title: 'Quickbooks Sync',
    //   description: 'Sync the system and Quickbooks.',
    //   icon: ArrowPathIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Quickbooks Sync settings coming soon!',
    //     });
    //   },
    // },
    // {
    //   id: 'listing-syndication',
    //   title: 'Listing Syndication',
    //   description: 'List and market your vacancies',
    //   icon: DocumentTextIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Listing Syndication settings coming soon!',
    //     });
    //   },
    // },
    // {
    //   id: 'send-payments',
    //   title: 'Send Payments',
    //   description: 'Set up and configure payment integration',
    //   icon: CurrencyDollarIcon,
    //   onClick: () => {
    //     setToast({
    //       open: true,
    //       type: 'info',
    //       message: 'Send Payments settings coming soon!',
    //     });
    //   },
    // },
  ];

  // Handle new user
  const handleNewUser = () => {
    setEditingUser(null);
    setIsNewUserOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    // Convert User to NewUserFormData
    const userFormData: NewUserFormData = {
      firstName: user.firstName,
      middleInitial: '',
      lastName: user.lastName,
      company: '',
      jobTitle: '',
      loginEmail: user.email,
      userRole: user.role,
      phones: [
        { id: '1', type: 'Mobile', number: user.phone },
      ],
      emails: [
        { id: '1', type: 'Primary', email: user.email },
      ],
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    };
    setEditingUser(user);
    setIsNewUserOpen(true);
  };

  // Handle user modal close
  const handleUserModalClose = () => {
    setIsNewUserOpen(false);
    setEditingUser(null);
  };

  // Convert editingUser to form data
  const getUserFormData = (): NewUserFormData | null => {
    if (!editingUser) return null;
    return {
      firstName: editingUser.firstName,
      middleInitial: '',
      lastName: editingUser.lastName,
      company: '',
      jobTitle: '',
      loginEmail: editingUser.email,
      userRole: editingUser.role,
      phones: [
        { id: '1', type: 'Mobile', number: editingUser.phone },
      ],
      emails: [
        { id: '1', type: 'Primary', email: editingUser.email },
      ],
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    };
  };

  // Handle new user role
  const handleNewUserRole = () => {
    setEditingRole(null);
    setIsNewUserRoleOpen(true);
  };

  // Handle edit user role
  const handleEditUserRole = (role: UserRole) => {
    setEditingRole(role);
    setIsNewUserRoleOpen(true);
  };

  // Handle user role modal close
  const handleUserRoleModalClose = () => {
    setIsNewUserRoleOpen(false);
    setEditingRole(null);
  };

  // Convert editingRole to form data
  const getRoleFormData = (): UserRoleFormData | null => {
    if (!editingRole) return null;
    // In a real app, you would fetch the full role data from API
    // For now, return a basic structure
    return {
      roleName: editingRole.name,
      roleDescription: editingRole.description,
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
    };
  };

  // If showing users list, render that instead
  if (showUsersList) {
    return (
      <>
        <UsersList
          onBack={() => setShowUsersList(false)}
          onNewUser={handleNewUser}
          onEditUser={handleEditUser}
        />
        {/* New User Modal */}
        <NewUserModal
          isOpen={isNewUserOpen}
          onClose={handleUserModalClose}
          userData={getUserFormData()}
          isEdit={!!editingUser}
        />
      </>
    );
  }

  // If showing user roles list, render that instead
  if (showUserRolesList) {
    return (
      <>
        <UserRolesList
          onBack={() => setShowUserRolesList(false)}
          onNewRole={handleNewUserRole}
          onEditRole={handleEditUserRole}
        />
        {/* New User Role Modal */}
        <NewUserRoleModal
          isOpen={isNewUserRoleOpen}
          onClose={handleUserRoleModalClose}
          roleData={getRoleFormData()}
          isEdit={!!editingRole}
        />
      </>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">General Settings</h1>
      </div>

      {/* Personal Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {personalSettings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={setting.onClick}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <setting.icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {setting.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {setting.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Company Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Company</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {companySettings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 2) * 0.05 }}
              onClick={setting.onClick}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-slate-100 rounded-lg w-fit group-hover:bg-slate-200 transition-colors">
                  <setting.icon className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {setting.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {setting.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personal Information Modal */}
      <PersonalInfoModal
        isOpen={isPersonalInfoOpen}
        onClose={() => setIsPersonalInfoOpen(false)}
      />

      {/* Change Password Modal */}
      <LoginPasswordModal
        isOpen={isLoginPasswordOpen}
        onClose={() => setIsLoginPasswordOpen(false)}
      />

      {/* Hostel Info Modal */}
      <HostelInfoModal
        isOpen={isHostelInfoOpen}
        onClose={() => setIsHostelInfoOpen(false)}
      />


      {/* Toast notification */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default SettingsForm;
