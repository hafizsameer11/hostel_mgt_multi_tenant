import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import type { UserRole } from '../../types/settings';

interface UserRolesListProps {
  onBack: () => void;
  onNewRole: () => void;
  onEditRole: (role: UserRole) => void;
}

export const UserRolesList: React.FC<UserRolesListProps> = ({ onBack, onNewRole, onEditRole }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user roles data - in real app, this would come from API
  const [roles] = useState<UserRole[]>([
    {
      id: '1',
      name: 'Accountants',
      description: 'Responsible for the management and reporting of financial data of your organization.',
    },
    {
      id: '2',
      name: 'Full Access',
      description: 'This user role has full access to the entire software',
    },
    {
      id: '3',
      name: 'Maintenance Team',
      description: 'Responsible for keeping your properties well equipped and running smoothly.',
    },
    {
      id: '4',
      name: 'Property Owners',
      description: 'Owners of the properties you manage.',
    },
  ]);

  // Filter roles based on search
  const filteredRoles = React.useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

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
          <h1 className="text-3xl font-bold text-slate-900">User Roles</h1>
        </div>
        <button
          onClick={onNewRole}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>New User Role</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users"
          className="block w-full pr-11 pl-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm"
        />
      </div>

      {/* Roles List */}
      <div className="space-y-3">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            onClick={() => onEditRole(role)}
            className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <KeyIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">{role.name}</h3>
                  <p className="text-sm text-slate-600">{role.description}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle menu click
                }}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No user roles found
        </div>
      )}
    </div>
  );
};

