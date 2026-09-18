'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'kitchen' | 'delivery' | 'cashier';
  joinDate: string;
  status: 'active' | 'inactive';
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('staff');

  const [staff] = useState<StaffMember[]>([
    { id: 1, name: 'Admin User', email: 'admin@pizzacity.gh', role: 'admin', joinDate: '2023-06-01', status: 'active' },
    { id: 2, name: 'Chef Kofi', email: 'chef@pizzacity.gh', role: 'kitchen', joinDate: '2023-08-15', status: 'active' },
    { id: 3, name: 'Manager Ama', email: 'manager@pizzacity.gh', role: 'manager', joinDate: '2023-09-01', status: 'active' },
  ]);

  const [roles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Admin',
      permissions: ['View all', 'Edit all', 'Manage staff', 'View reports'],
      color: 'purple',
    },
    {
      id: 'manager',
      name: 'Manager',
      permissions: ['View orders', 'Manage menu', 'View reports'],
      color: 'blue',
    },
    {
      id: 'kitchen',
      name: 'Kitchen Staff',
      permissions: ['View orders', 'Update order status'],
      color: 'orange',
    },
  ]);

  const roleColors = {
    admin: 'bg-white text-black',
    manager: 'bg-white text-black',
    kitchen: 'bg-white text-black',
    delivery: 'bg-white text-black',
    cashier: 'bg-white text-black',
  };

  const statusColors = {
    active: 'bg-white text-black',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Staff & Roles</h1>
          <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
            <FiPlus /> Add Staff
          </button>
        </div>

        <div className="flex gap-0 border-b border-gray-200">
          {[
            { id: 'staff', label: 'Staff Members' },
            { id: 'roles', label: 'Roles & Permissions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'staff' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Join Date</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[member.role]}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.joinDate}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[member.status]}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button className="text-black hover:text-black"><FiEdit2 /></button>
                      <button className="text-black hover:text-black"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{role.name}</h3>
                <div className="space-y-2">
                  {role.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      {perm}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
