/**
 * OwnerCard Component
 * Reusable card component for displaying owner information
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../../components/Badge';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  HomeIcon,
  BriefcaseIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../../../services/api.config';

interface OwnerCardProps {
  owner: any;
  index: number;
  onView: (id: number) => void;
}

export const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  index,
  onView,
}) => {
  return (
    <motion.div
      key={owner.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
        {owner.profilePhoto ? (
          <img 
            src={`${API_BASE_URL.replace('/api', '')}${owner.profilePhoto}`} 
            alt={owner.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-lg';
                fallback.textContent = owner.name.charAt(0).toUpperCase();
                parent.insertBefore(fallback, target);
              }
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
            {owner.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{owner.name}</h3>
          <Badge variant={owner.status === 'active' || owner.status === 'Active' ? 'success' : owner.status === 'pending' || owner.status === 'Pending' ? 'warning' : 'default'}>
            {owner.status}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-700 mb-4">
        {owner.email && <div className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-purple-500" />{owner.email}</div>}
        {owner.phone && <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-purple-500" />{owner.phone}</div>}
        {owner.HostelName && <div className="flex items-center gap-2"><HomeIcon className="w-4 h-4 text-purple-500" />{owner.HostelName}</div>}
        {owner.hostelCount !== undefined && <div className="flex items-center gap-2"><BriefcaseIcon className="w-4 h-4 text-purple-500" />{owner.hostelCount} Hostel{owner.hostelCount !== 1 ? 's' : ''}</div>}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('View button clicked for owner ID:', owner.id);
            onView(owner.id);
          }}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

