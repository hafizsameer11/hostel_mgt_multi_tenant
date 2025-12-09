/**
 * EmployeeForm Component
 * Sidebar-based form for adding/editing employees
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/Select';
import { 
  UserIcon,
  BriefcaseIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../../../services/api.config';

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  profilePhoto: File | null;
  previousProfilePhoto: string | null;
  previousDocuments: any[] | null;
  address: {
    street: string;
    city: string;
    country: string;
  };
  roleId: string;
  hostelId: string;
  joinDate: string;
  salary: string;
  salaryType: string;
  workingHours: string;
  document: File | null;
  notes: string;
}

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EmployeeFormData) => Promise<void>;
  editingId: number | null;
  initialData?: Partial<EmployeeFormData>;
  hostelOptions: Array<{ value: string; label: string }>;
  hostelsLoading: boolean;
  roleOptions: Array<{ value: string; label: string }>;
  rolesLoading: boolean;
}

type ActiveTab = 'personal' | 'employment';

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  initialData,
  hostelOptions,
  hostelsLoading,
  roleOptions,
  rolesLoading,
}) => {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('personal');
  const [formData, setFormData] = React.useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    profilePhoto: null,
    previousProfilePhoto: null,
    previousDocuments: null,
    address: {
      street: '',
      city: '',
      country: '',
    },
    roleId: '',
    hostelId: '',
    joinDate: '',
    salary: '',
    salaryType: 'monthly',
    workingHours: '',
    document: null,
    notes: '',
  });

  // Load initial data when editing, reset when adding
  React.useEffect(() => {
    if (!isOpen) return;
    
    if (initialData && editingId) {
      // Editing mode: load initial data
      setFormData(prev => ({ ...prev, ...initialData }));
      setActiveTab('personal');
    } else if (!editingId) {
      // Adding mode: reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        profilePhoto: null,
        previousProfilePhoto: null,
        previousDocuments: null,
        address: {
          street: '',
          city: '',
          country: '',
        },
        roleId: '',
        hostelId: '',
        joinDate: '',
        salary: '',
        salaryType: 'monthly',
        workingHours: '',
        document: null,
        notes: '',
      });
      setActiveTab('personal');
    }
  }, [initialData, editingId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="employee-form-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />
      
      {/* Modal with Sidebar */}
      <motion.div
        key="employee-form-modal"
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
                <BriefcaseIcon className="w-6 h-6 text-white" />
                <h2 className="text-lg font-semibold text-white">Employee Info</h2>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="font-medium">Personal Information</span>
              </button>
              <button
                onClick={() => setActiveTab('employment')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'employment'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <BriefcaseIcon className="w-5 h-5" />
                <span className="font-medium">Employment Details</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeTab === 'personal' && 'PERSONAL INFORMATION'}
                  {activeTab === 'employment' && 'EMPLOYMENT DETAILS'}
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
                {/* Tab Content - Personal */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="johndoe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Profile Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData({ ...formData, profilePhoto: file });
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.profilePhoto && (
                          <p className="text-sm text-gray-600 mt-1">
                            Selected: {formData.profilePhoto.name}
                          </p>
                        )}
                        {editingId && formData.previousProfilePhoto && !formData.profilePhoto && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">Current Profile Photo:</p>
                            <img
                              src={`${API_BASE_URL.replace('/api', '')}${formData.previousProfilePhoto}`}
                              alt="Current profile"
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.address.street}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, street: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, city: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.address.country}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, country: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content - Employment */}
                {activeTab === 'employment' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Role/Position <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.roleId}
                          onChange={(value) => setFormData({ ...formData, roleId: value })}
                          options={[
                            { value: '', label: rolesLoading ? 'Loading roles...' : 'Select Role' },
                            ...roleOptions,
                          ]}
                          placeholder={rolesLoading ? "Loading roles..." : "Select Role"}
                          disabled={rolesLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Hostel <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.hostelId}
                          onChange={(value) => setFormData({ ...formData, hostelId: value })}
                          options={hostelOptions.filter(opt => opt.value !== '')}
                          placeholder={hostelsLoading ? "Loading hostels..." : "Select Hostel"}
                          disabled={hostelsLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Join Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.joinDate}
                          onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Working Hours
                        </label>
                        <input
                          type="text"
                          value={formData.workingHours}
                          onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="9:00 AM - 5:00 PM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="3000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Document
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData({ ...formData, document: file });
                          }}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.document && (
                          <p className="text-sm text-gray-600 mt-1">
                            Selected: {formData.document.name}
                          </p>
                        )}
                        {editingId && formData.previousDocuments && formData.previousDocuments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Current Documents:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {formData.previousDocuments.map((doc: any, idx: number) => {
                                const isImage = doc.mimetype?.startsWith('image/') || 
                                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(doc.originalName || doc.filename || '');
                                const docUrl = `${API_BASE_URL.replace('/api', '')}${doc.url}`;
                                const docName = doc.originalName || doc.filename || 'Document';
                                
                                return (
                                  <div
                                    key={doc.id || doc.url || `employee-doc-${idx}`}
                                    className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                                  >
                                    {isImage ? (
                                      <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                                          <img
                                            src={docUrl}
                                            alt={docName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                        <div className="p-2 bg-white border-t border-gray-200">
                                          <p className="text-xs text-gray-700 font-medium truncate" title={docName}>
                                            {docName}
                                          </p>
                                        </div>
                                      </a>
                                    ) : (
                                      <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3"
                                      >
                                        <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <span className="text-xs text-gray-700 truncate" title={docName}>
                                          {docName}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add any additional notes or comments..."
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  {editingId ? 'Update Employee' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmployeeForm;
export type { EmployeeFormData };


