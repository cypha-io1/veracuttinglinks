import React from 'react';
import SupportAdmin from '../../../components/admin/SupportAdmin';

export const metadata = {
  title: 'Admin - Support',
};

export default function AdminSupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8">
        <SupportAdmin />
      </div>
    </div>
  );
}
