/**
 * PeopleEmptyState Component
 * Empty state display for different sections
 */

import React from 'react';
import { Button } from '../../../components/Button';
import { UserPlusIcon, HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

type PeopleSection = 'Tenants' | 'Employees' | 'Vendors' | 'Prospects';

interface PeopleEmptyStateProps {
  section: PeopleSection | null;
  selectedHostelId: string;
  onAddClick: () => void;
}

export const PeopleEmptyState: React.FC<PeopleEmptyStateProps> = React.memo(({
  section,
  selectedHostelId,
  onAddClick,
}) => {
  // No hostel selected state
  if (!selectedHostelId && section !== 'Prospects') {
    return (
      <div className="text-center py-16">
        <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Hostel</h3>
        <p className="text-gray-600 mb-6">
          Please select a hostel from the dropdown above to view {section?.toLowerCase()}.
        </p>
      </div>
    );
  }

  // Empty data states
  const getEmptyConfig = () => {
    switch (section) {
      case 'Tenants':
        return {
          icon: UserPlusIcon,
          title: 'No Tenants Found',
          message: 'No tenants found for the selected hostel.',
          buttonLabel: 'Add Tenant',
        };
      case 'Employees':
        return {
          icon: BriefcaseIcon,
          title: 'No Employees Found',
          message: 'No employees found for the selected hostel.',
          buttonLabel: 'Add Employee',
        };
      case 'Prospects':
        return {
          icon: UserPlusIcon,
          title: 'No Prospects Found',
          message: 'No prospects found. Start by adding your first prospect.',
          buttonLabel: 'Add Prospect',
        };
      default:
        return {
          icon: UserPlusIcon,
          title: 'No Data Found',
          message: 'No data available.',
          buttonLabel: 'Add',
        };
    }
  };

  const config = getEmptyConfig();
  const Icon = config.icon;

  return (
    <div className="text-center py-16">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 mb-6">{config.message}</p>
      <Button variant="primary" onClick={onAddClick} icon={UserPlusIcon}>
        {config.buttonLabel}
      </Button>
    </div>
  );
});

PeopleEmptyState.displayName = 'PeopleEmptyState';

