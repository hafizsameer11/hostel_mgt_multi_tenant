/**
 * Info Component
 * Small info row component for displaying label-value pairs
 */

import React from 'react';

interface InfoProps {
  label: string;
  value: string;
}

const Info: React.FC<InfoProps> = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg p-3">
    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
    <p className="text-slate-900 font-medium break-words">{value || '-'}</p>
  </div>
);

export default Info;

