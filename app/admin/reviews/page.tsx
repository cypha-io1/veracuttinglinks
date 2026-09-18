'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiStar, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

interface Review {
  id: number;
  customer: string;
  orderId: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
}

interface Complaint {
  id: string;
  orderId: string;
  customer: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  date: string;
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('reviews');

  const [reviews] = useState<Review[]>([
    { id: 1, customer: 'Kwesi Boateng', orderId: '#1001', rating: 5, comment: 'Excellent pizza! Fresh ingredients and great taste.', date: '2024-01-15' },
    { id: 2, customer: 'Abena Osei', orderId: '#1002', rating: 4, comment: 'Good, but took a bit longer than expected.', date: '2024-01-14', response: 'Thank you for feedback. We will improve delivery times.' },
    { id: 3, customer: 'Yaw Mensah', orderId: '#1000', rating: 3, comment: 'Pizza was cold when delivered.', date: '2024-01-13' },
  ]);

  const [complaints] = useState<Complaint[]>([
    { id: 'COMP001', orderId: '#1003', customer: 'Nadia Sarfo', issue: 'Wrong item delivered', severity: 'high', status: 'in-progress', date: '2024-01-16' },
    { id: 'COMP002', orderId: '#1002', customer: 'Ekua Adjei', issue: 'Delayed delivery by 30 minutes', severity: 'medium', status: 'resolved', date: '2024-01-15' },
  ]);

  const severityColors = {
    low: 'bg-white text-black',
    medium: 'bg-white text-black',
    high: 'bg-white text-black',
  };

  const statusColors = {
    open: 'bg-white text-black',
    'in-progress': 'bg-white text-black',
    resolved: 'bg-white text-black',
  };

  return (
    <AdminLayout>
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Reviews & Feedback</h1>

        <div className="flex gap-0 overflow-x-auto border-b border-gray-200">
          {[
            { id: 'reviews', label: 'Customer Reviews' },
            { id: 'complaints', label: 'Complaints & Support' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition sm:px-6 ${
                activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{review.customer}</p>
                      <span className="text-[11px] text-gray-600 sm:text-xs">{review.orderId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`text-sm ${i < review.rating ? 'fill-black text-black' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-600 sm:text-sm">{review.date}</span>
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-sm text-gray-700 sm:text-base">{review.comment}</p>
                {review.response && (
                  <div className="mb-3 rounded-lg border-l-4 border-black bg-white p-3">
                    <p className="text-sm font-medium text-black">Admin Response:</p>
                    <p className="text-sm text-black">{review.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.map(complaint => (
              <div key={complaint.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className={`text-xl mt-1 ${
                      complaint.severity === 'high' ? 'text-black' :
                      complaint.severity === 'medium' ? 'text-black' :
                      'text-black'
                    }`} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{complaint.customer}</p>
                      <p className="text-xs text-gray-600 sm:text-sm">{complaint.orderId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${severityColors[complaint.severity]}`}>
                      {complaint.severity}
                    </span>
                  </div>
                </div>
                <p className="mb-3 text-sm text-gray-700 sm:text-base">{complaint.issue}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-600 sm:text-xs">{complaint.date}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${statusColors[complaint.status]}`}>
                    {complaint.status.replace('-', ' ').charAt(0).toUpperCase() + complaint.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
