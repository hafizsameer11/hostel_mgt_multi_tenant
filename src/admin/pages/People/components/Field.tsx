/**
 * Field Component
 * Reusable form field component
 */

import React from 'react';

interface FieldProps {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  required = false 
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}{required ? ' *' : ''}
    </label>
    <input
      type={type}
      value={value || ''}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    />
  </div>
);

export default Field;

