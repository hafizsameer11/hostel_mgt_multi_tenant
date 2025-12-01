/**
 * EmployeeCard Component
 * Reusable card component for displaying employee information
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../../components/Badge';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  BriefcaseIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../../../services/api.config';

interface EmployeeCardProps {
  employee: any;
  index: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  index,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      key={employee.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
        {employee.profilePhoto ? (
          <img 
            src={`${API_BASE_URL.replace('/api', '')}${employee.profilePhoto}`} 
            alt={employee.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-lg';
                const nameParts = employee.name?.split(' ') || [];
                const firstName = nameParts[0] || '';
                const lastName = nameParts[1] || '';
                fallback.textContent = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || employee.name.charAt(0).toUpperCase();
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-lg">
            {(() => {
              const nameParts = employee.name?.split(' ') || [];
              const firstName = nameParts[0] || '';
              const lastName = nameParts[1] || '';
              return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || employee.name.charAt(0).toUpperCase();
            })()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{employee.name}</h3>
          <Badge variant={employee.status === 'Active' || employee.status === 'active' ? 'success' : 'default'}>
            {employee.status}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-700 mb-4">
        <div className="flex items-center gap-2"><BriefcaseIcon className="w-4 h-4 text-green-500" />{employee.role}</div>
        <div className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-green-500" />{employee.email}</div>
        <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-green-500" />{employee.phone}</div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onView(employee.id)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(employee.id)}
          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Edit"
        >
          <PencilIcon className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(employee.id, employee.name)}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Delete"
        >
          <TrashIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

