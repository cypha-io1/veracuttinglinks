'use client';

import React, { useState } from 'react';
import { FiMessageSquare, FiAlertCircle, FiCheckCircle, FiClock, FiStar } from 'react-icons/fi';

interface Rating {
  id: string;
  orderNumber: string;
  customerName: string;
  rating: number;
  comment: string;
  date: Date;
  items: string[];
}

interface Complaint {
  id: string;
  orderNumber: string;
  customerName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  reportedDate: Date;
  resolvedDate?: Date;
  resolution?: string;
}

export default function CustomerFeedback() {
  const [ratings] = useState<Rating[]>([
    {
      id: '1',
      orderNumber: '#1001',
      customerName: 'Kofi Mensah',
      rating: 5,
      comment: 'Excellent pizza, arrived hot and fresh!',
      date: new Date(Date.now() - 3600000),
      items: ['Pepperoni Pizza Large'],
    },
    {
      id: '2',
      orderNumber: '#1002',
      customerName: 'Ama Osei',
      rating: 4,
      comment: 'Good quality but took longer than expected',
      date: new Date(Date.now() - 7200000),
      items: ['Margherita Medium', 'Coke 2L'],
    },
    {
      id: '3',
      orderNumber: '#1003',
      customerName: 'Yaw Asante',
      rating: 5,
      comment: 'Best pizza in Accra!',
      date: new Date(Date.now() - 10800000),
      items: ['BBQ Chicken Large'],
    },
    {
      id: '4',
      orderNumber: '#1004',
      customerName: 'Abena Owusu',
      rating: 3,
      comment: 'Toppings were sparse, need more cheese',
      date: new Date(Date.now() - 14400000),
      items: ['Veggie Deluxe Large'],
    },
  ]);

  const [complaints] = useState<Complaint[]>([
    {
      id: '1',
      orderNumber: '#0998',
      customerName: 'Benjamin Joe',
      issue: 'Order arrived cold',
      severity: 'high',
      status: 'resolved',
      reportedDate: new Date(Date.now() - 86400000),
      resolvedDate: new Date(Date.now() - 82800000),
      resolution: 'Full refund issued + replacement order sent',
    },
    {
      id: '2',
      orderNumber: '#1000',
      customerName: 'Grace Mensah',
      issue: 'Missing items in order',
      severity: 'high',
      status: 'in-progress',
      reportedDate: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      orderNumber: '#0995',
      customerName: 'Samuel Adu',
      issue: 'Delivery took 2 hours',
      severity: 'medium',
      status: 'resolved',
      reportedDate: new Date(Date.now() - 172800000),
      resolvedDate: new Date(Date.now() - 168400000),
      resolution: 'Driver retraining scheduled, customer compensated',
    },
    {
      id: '4',
      orderNumber: '#0992',
      customerName: 'Jennifer Boateng',
      issue: 'Wrong order delivered',
      severity: 'high',
      status: 'open',
      reportedDate: new Date(Date.now() - 259200000),
    },
  ]);

  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ratings.filter(r => r.rating === rating).length);
  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor ratings and manage complaints</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Average Rating', value: `${avgRating}/5`, icon: <FiStar className="text-black" size={24} />, color: 'bg-white border-black' },
          { label: 'Total Reviews', value: ratings.length, icon: <FiMessageSquare className="text-black" size={24} />, color: 'bg-white border-black' },
          { label: 'Open Complaints', value: openComplaints, icon: <FiAlertCircle className="text-black" size={24} />, color: 'bg-white border-black' },
          { label: 'Resolved', value: resolvedComplaints, icon: <FiCheckCircle className="text-black" size={24} />, color: 'bg-white border-black' },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${metric.color}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-gray-600 font-medium">{metric.label}</p>
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Open Complaints Alert */}
      {openComplaints > 0 && (
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <FiAlertCircle className="text-black flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black">{openComplaints} Open Complaint(s)</h3>
              <p className="text-black text-sm mt-1">
                Please review and take action on unresolved customer issues immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ratings Overview */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiStar size={24} className="text-black" />
          Ratings Distribution
        </h2>

        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((rating, idx) => {
            const count = ratingCounts[idx];
            const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

            return (
              <div key={rating}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-semibold">{rating} Star</span>
                    <span className="text-black">{'★'.repeat(rating)}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{count} reviews</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-white"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Customer Ratings</h2>

        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="p-4 bg-gray-50 rounded-xl border-l-4 border-black">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{rating.customerName}</p>
                  <p className="text-sm text-gray-600">{rating.orderNumber}</p>
                </div>
                <span className="text-black">{'★'.repeat(rating.rating)}</span>
              </div>

              <p className="text-gray-700 text-sm my-2">{rating.comment}</p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Items: {rating.items.join(', ')}
                </p>
                <p className="text-xs text-gray-600">
                  {rating.date.toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complaints Management */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiAlertCircle size={24} className="text-black" />
          Complaints Dashboard
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Issue</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Severity</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Reported</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    complaint.status === 'open' ? 'bg-white' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{complaint.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{complaint.customerName}</td>
                  <td className="py-3 px-4 text-gray-700">{complaint.issue}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        complaint.severity === 'high'
                          ? 'bg-white text-black border-black'
                          : complaint.severity === 'medium'
                          ? 'bg-white text-black border-black'
                          : 'bg-white text-black border-black'
                      }`}
                    >
                      {complaint.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        complaint.status === 'resolved'
                          ? 'bg-white text-black border-black'
                          : complaint.status === 'in-progress'
                          ? 'bg-white text-black border-black'
                          : 'bg-white text-black border-black'
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 text-sm">
                    {complaint.reportedDate.toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Complaint Details */}
        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Issue Resolution History</h3>
          {complaints
            .filter(c => c.status !== 'open')
            .map((complaint) => (
              <div key={complaint.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{complaint.orderNumber} - {complaint.customerName}</p>
                    <p className="text-sm text-gray-600">{complaint.issue}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    complaint.status === 'resolved'
                      ? 'bg-white text-black border-black'
                      : 'bg-white text-black border-black'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
                {complaint.resolution && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Resolution:</strong> {complaint.resolution}
                  </p>
                )}
                {complaint.resolvedDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Resolved on {complaint.resolvedDate.toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
