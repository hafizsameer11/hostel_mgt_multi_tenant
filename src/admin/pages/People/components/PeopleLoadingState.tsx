/**
 * PeopleLoadingState Component
 * Loading state display for different sections
 */

import React from 'react';

type PeopleSection = 'Tenants' | 'Employees' | 'Vendors' | 'Prospects';

interface PeopleLoadingStateProps {
  section: PeopleSection;
}

export const PeopleLoadingState: React.FC<PeopleLoadingStateProps> = React.memo(({ section }) => {
  const getLoadingConfig = () => {
    switch (section) {
      case 'Tenants':
        return {
          color: 'border-[#2176FF]',
          title: 'Loading Tenants...',
          message: 'Please wait while we fetch the tenants.',
        };
      case 'Employees':
        return {
          color: 'border-green-600',
          title: 'Loading Employees...',
          message: 'Loading employees...',
        };
      case 'Prospects':
        return {
          color: 'border-blue-600',
          title: 'Loading Prospects...',
          message: 'Please wait while we fetch the prospects.',
        };
      case 'Vendors':
        return {
          color: 'border-purple-600',
          title: 'Loading Vendors...',
          message: 'Loading vendors...',
        };
      default:
        return {
          color: 'border-blue-600',
          title: 'Loading...',
          message: 'Please wait...',
        };
    }
  };

  const config = getLoadingConfig();

  return (
    <div className="text-center py-16">
      <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${config.color} ${section === 'Employees' ? 'mx-auto mb-4' : ''}`}></div>
      {section !== 'Employees' && (
        <>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">{config.title}</h3>
          <p className="text-gray-600">{config.message}</p>
        </>
      )}
      {section === 'Employees' && (
        <p className="text-gray-500 mt-4">{config.message}</p>
      )}
    </div>
  );
});

PeopleLoadingState.displayName = 'PeopleLoadingState';

