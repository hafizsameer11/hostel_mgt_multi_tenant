/**
 * EditForm Component
 * Edit form for Tenant and Employee in modal view
 */

import React, { useState } from 'react';
import Field from './Field';
import * as alertService from '../../../services/alert.service';

interface EditFormProps {
  modal: { 
    mode: 'view' | 'edit'; 
    type: 'Tenant' | 'Employee'; 
    data: any 
  };
  onClose: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ modal, onClose }) => {
  const [form, setForm] = useState<any>({ ...modal.data });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If tenant status changed, create appropriate alert
    if (modal.type === 'Tenant' && modal.data.status !== form.status) {
      const tenantName = form.name || modal.data.name;
      const room = form.room || modal.data.room;
      const seat = form.bed || modal.data.bed;
      
      try {
        if (form.status === 'Active' && modal.data.status !== 'Active') {
          // Check-in: Status changed to Active
          alertService.createCheckInAlert(tenantName, room, seat);
        } else if (form.status === 'Inactive' && modal.data.status === 'Active') {
          // Check-out: Status changed from Active to Inactive
          alertService.createCheckOutAlert(tenantName, room, seat);
        }
      } catch (error) {
        console.error('Failed to create alert:', error);
      }
    }
    
    console.log('Update', modal.type, form);
    onClose();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        {modal.type === 'Employee' ? (
          <>
            <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
            <Field label="Joined" value={form.joinedAt} onChange={(v) => setForm({ ...form, joinedAt: v })} type="date" />
          </>
        ) : (
          <>
            <Field label="Room" value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
            <Field label="Bed" value={form.bed} onChange={(v) => setForm({ ...form, bed: v })} />
            <Field label="Lease Start" value={form.leaseStart} onChange={(v) => setForm({ ...form, leaseStart: v })} type="date" />
            <Field label="Lease End" value={form.leaseEnd} onChange={(v) => setForm({ ...form, leaseEnd: v })} type="date" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={form.status || 'Pending'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md hover:shadow-lg">Save Changes</button>
      </div>
    </form>
  );
};

export default EditForm;

