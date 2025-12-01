import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { UserRole } from '../../types/settings';
import { getAllRoles } from '../../services/role.service';

interface UserRolesListProps {
  onBack: () => void;
  onNewRole: () => void;
  onEditRole: (role: UserRole) => void;
  onViewRole: (role: UserRole) => void;
  onDeleteRole: (role: UserRole) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export const UserRolesList: React.FC<UserRolesListProps> = ({ 
  onBack, 
  onNewRole, 
  onEditRole,
  onViewRole,
  onDeleteRole,
  refreshTrigger = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        setError(null);
        const rolesData = await getAllRoles();
        
        // Map API response to UserRole format
        const mappedRoles: UserRole[] = rolesData.map((role: any) => ({
          id: String(role.id),
          name: role.roleName || role.name || 'Unknown',
          description: role.description || '',
        }));
        
        setRoles(mappedRoles);
      } catch (err: any) {
        console.error('Error fetching roles:', err);
        setError(err?.message || 'Failed to load user roles');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleMenuToggle = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === roleId ? null : roleId);
  };

  const handleView = (role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onViewRole(role);
  };

  const handleEdit = (role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onEditRole(role);
  };

  const handleDelete = (role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onDeleteRole(role);
  };

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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading user roles...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Roles List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div 
                className="flex items-start gap-4 flex-1 cursor-pointer"
                onClick={() => onEditRole(role)}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <KeyIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">{role.name}</h3>
                  <p className="text-sm text-slate-600">{role.description}</p>
                </div>
              </div>
              <div className="relative shrink-0" ref={(el) => (menuRefs.current[role.id] = el)}>
                <button
                  onClick={(e) => handleMenuToggle(role.id, e)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <EllipsisVerticalIcon className="w-5 h-5 text-slate-600" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === role.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button
                      onClick={(e) => handleView(role, e)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => handleEdit(role, e)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(role, e)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredRoles.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No user roles found
        </div>
      )}
    </div>
  );
};

