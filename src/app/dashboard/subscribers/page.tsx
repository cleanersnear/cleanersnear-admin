"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Subscriber {
  id: string;
  created_at: string;
  email: string;
  status: string;
  updated_at: string;
  ip_address: string;
  user_agent: string;
  last_email_sent: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setSubscribers(data);
      setLoading(false);
    };
    fetchSubscribers();
  }, [supabase]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subscriber Management</h1>
      {loading ? (
        <div>Loading subscribers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated At</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Email Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">No subscribers found.</td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.created_at ? new Date(subscriber.created_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.updated_at ? new Date(subscriber.updated_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.ip_address}</td>
                    <td className="px-4 py-2 whitespace-nowrap max-w-xs truncate" title={subscriber.user_agent}>{subscriber.user_agent}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{subscriber.last_email_sent ? new Date(subscriber.last_email_sent).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 