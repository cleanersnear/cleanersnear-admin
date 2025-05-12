"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joining_date?: string;
  address?: {
    street?: string;
    city?: string;
    suburb?: string;
    postcode?: string;
  };
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', params.id)
        .single();
      if (!error && data) setStaff(data);
      setIsLoading(false);
    };
    if (params.id) fetchStaff();
  }, [params.id, supabase]);

  if (isLoading) {
    return <div className="p-4">Loading staff profile...</div>;
  }
  if (!staff) {
    return <div className="p-4">Staff member not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:underline">&larr; Back</button>
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{staff.first_name} {staff.last_name}</h1>
        <div className="mb-4 text-sm text-gray-500">{staff.role} &middot; <span className={staff.status === 'active' ? 'text-green-600' : 'text-gray-600'}>{staff.status}</span></div>
        <dl className="divide-y divide-gray-100">
          <div className="py-2 flex justify-between">
            <dt className="font-medium text-gray-700">Email</dt>
            <dd className="text-gray-900">{staff.email}</dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="font-medium text-gray-700">Phone</dt>
            <dd className="text-gray-900">{staff.phone || '-'}</dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="font-medium text-gray-700">Joining Date</dt>
            <dd className="text-gray-900">{staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : '-'}</dd>
          </div>
          <div className="py-2 flex flex-col">
            <dt className="font-medium text-gray-700 mb-1">Address</dt>
            <dd className="text-gray-900 text-right">{staff.address ? (
              <span>{staff.address.street || ''} {staff.address.city || ''} {staff.address.suburb || ''} {staff.address.postcode || ''}</span>
            ) : '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 