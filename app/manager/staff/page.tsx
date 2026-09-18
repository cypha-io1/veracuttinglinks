'use client';

import React, { useState } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiClock, FiTrendingUp } from 'react-icons/fi';

interface StaffMember {
  id: string;
  name: string;
  role: 'kitchen' | 'cashier' | 'supervisor';
  status: 'online' | 'offline' | 'break';
  joinDate: Date;
  ordersHandled: number;
  avgHandlingTime: number;
  rating: number;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: Date;
  startTime: string;
  endTime: string;
  role: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'John Mensah', role: 'supervisor', status: 'online', joinDate: new Date('2023-01-15'), ordersHandled: 234, avgHandlingTime: 4.2, rating: 4.8 },
    { id: '2', name: 'Amma Osei', role: 'kitchen', status: 'online', joinDate: new Date('2023-03-20'), ordersHandled: 189, avgHandlingTime: 3.8, rating: 4.5 },
    { id: '3', name: 'Kwesi Boateng', role: 'kitchen', status: 'online', joinDate: new Date('2023-05-10'), ordersHandled: 156, avgHandlingTime: 4.1, rating: 4.3 },
    { id: '4', name: 'Abena Asante', role: 'cashier', status: 'break', joinDate: new Date('2023-02-08'), ordersHandled: 198, avgHandlingTime: 2.5, rating: 4.6 },
    { id: '5', name: 'Yaa Addo', role: 'cashier', status: 'online', joinDate: new Date('2023-04-12'), ordersHandled: 167, avgHandlingTime: 2.7, rating: 4.4 },
  ]);

  const [shifts] = useState<Shift[]>([
    { id: '1', staffId: '1', staffName: 'John Mensah', date: new Date(), startTime: '09:00', endTime: '17:00', role: 'Supervisor' },
    { id: '2', staffId: '2', staffName: 'Amma Osei', date: new Date(), startTime: '10:00', endTime: '18:00', role: 'Kitchen' },
    { id: '3', staffId: '3', staffName: 'Kwesi Boateng', date: new Date(), startTime: '11:00', endTime: '19:00', role: 'Kitchen' },
    { id: '4', staffId: '4', staffName: 'Abena Asante', date: new Date(), startTime: '12:00', endTime: '20:00', role: 'Cashier' },
    { id: '5', staffId: '5', staffName: 'Yaa Addo', date: new Date(), startTime: '13:00', endTime: '21:00', role: 'Cashier' },
  ]);

  const [showModal, setShowModal] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'kitchen':
        return 'bg-white text-black border-black';
      case 'cashier':
        return 'bg-white text-black border-black';
      case 'supervisor':
        return 'bg-white text-black border-black';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage staff, schedules, and performance metrics</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
          <FiPlus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Staff', value: staff.length, color: 'bg-white border-black' },
          { label: 'Online Now', value: staff.filter(s => s.status === 'online').length, color: 'bg-white border-black' },
          { label: 'On Break', value: staff.filter(s => s.status === 'break').length, color: 'bg-white border-black' },
        ].map((stat, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${stat.color}`}>
            <p className="text-gray-600 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Staff List & Performance */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Staff Members</h2>
        <div className="space-y-4">
          {staff.map((member) => (
            <div key={member.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        member.status === 'online'
                          ? 'bg-white text-black'
                          : member.status === 'break'
                          ? 'bg-white text-black'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Since</p>
                      <p className="font-semibold text-gray-900">
                        {member.joinDate.toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Orders Handled</p>
                      <p className="font-semibold text-gray-900">{member.ordersHandled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Handle Time</p>
                      <p className="font-semibold text-gray-900">{member.avgHandlingTime}m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="font-semibold text-black">★ {member.rating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 bg-white text-black rounded-lg hover:bg-white transition-colors">
                    <FiEdit2 size={18} />
                  </button>
                  <button className="p-2 bg-white text-black rounded-lg hover:bg-white transition-colors">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiClock size={24} className="text-black" />
          Today's Schedule
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Staff Member</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Start Time</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">End Time</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Duration</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{shift.staffName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getRoleColor(
                        shift.role.toLowerCase()
                      )}`}
                    >
                      {shift.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">{shift.startTime}</td>
                  <td className="py-3 px-4 text-gray-700 font-medium">{shift.endTime}</td>
                  <td className="py-3 px-4 text-gray-700 font-medium">8h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Ranking */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiTrendingUp size={24} className="text-black" />
          Performance Ranking
        </h2>

        <div className="space-y-3">
          {[...staff]
            .sort((a, b) => b.rating - a.rating)
            .map((member, idx) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`w-8 h-8 rounded-full font-bold text-white flex items-center justify-center ${
                    idx === 0 ? 'bg-white' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-white' : 'bg-gray-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">★ {member.rating.toFixed(1)}/5.0</p>
                  <p className="text-xs text-gray-600">{member.ordersHandled} orders</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
