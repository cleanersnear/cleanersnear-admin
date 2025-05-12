'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, status')
        .order('first_name')
      if (!error && data) setStaff(data)
      setIsLoading(false)
    }
    fetchStaff()
  }, [supabase])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Staff Management</h1>
      {isLoading ? (
        <p>Loading staff...</p>
      ) : staff.length === 0 ? (
        <p>No staff found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">{s.role}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/dashboard/staff/${s.id}`} className="text-blue-600 hover:underline text-sm font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 