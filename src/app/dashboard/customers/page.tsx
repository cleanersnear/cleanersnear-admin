'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Customer {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: {
    street?: string
    city?: string
    suburb?: string
    postcode?: string
    state?: string
    unit?: string
    instructions?: string
  } | null
  scheduling: {
    date?: string
    time?: string
    is_flexible_date?: boolean
    is_flexible_time?: boolean
  } | null
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<(Customer & { booking_number?: string })[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<(Customer & { booking_number?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'name' | 'email' | 'booking_number'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      const [{ data: customersData, error: customersError }, { data: bookingsData }] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('id, booking_number')
      ])
      if (!customersError && customersData && bookingsData) {
        const merged = customersData.map((customer: Customer) => {
          const booking = bookingsData.find((b: { id: string }) => b.id === customer.booking_id)
          return { ...customer, booking_number: booking ? booking.booking_number : undefined }
        })
        setCustomers(merged)
        setFilteredCustomers(merged)
      }
      setIsLoading(false)
    }
    fetchCustomers()
  }, [supabase])

  useEffect(() => {
    let filtered = [...customers]
    if (searchTerm) {
      filtered = filtered.filter(c =>
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.booking_number && c.booking_number.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    // Sorting
    filtered.sort((a, b) => {
      let aField, bField
      if (sortField === 'name') {
        aField = (a.first_name + ' ' + a.last_name).toLowerCase()
        bField = (b.first_name + ' ' + b.last_name).toLowerCase()
      } else if (sortField === 'email') {
        aField = (a.email || '').toLowerCase()
        bField = (b.email || '').toLowerCase()
      } else {
        aField = (a.booking_number || '').toLowerCase()
        bField = (b.booking_number || '').toLowerCase()
      }
      if (aField < bField) return sortOrder === 'asc' ? -1 : 1
      if (aField > bField) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    setFilteredCustomers(filtered)
  }, [searchTerm, customers, sortField, sortOrder])

  const handleSort = (field: 'name' | 'email' | 'booking_number') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-md w-full sm:w-64"
        />
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('email')}>
                  Email {sortField === 'email' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-2 border-b">Phone</th>
                <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('booking_number')}>
                  Booking Number {sortField === 'booking_number' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-2 border-b">Address</th>
                <th className="px-4 py-2 border-b">Scheduling</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{customer.first_name} {customer.last_name}</td>
                  <td className="px-4 py-2 border-b">{customer.email}</td>
                  <td className="px-4 py-2 border-b">{customer.phone}</td>
                  <td className="px-4 py-2 border-b">{customer.booking_number || 'N/A'}</td>
                  <td className="px-4 py-2 border-b text-xs">
                    {customer.address ? (
                      <div>
                        {customer.address.street || ''} {customer.address.unit ? `Unit: ${customer.address.unit}` : ''}<br/>
                        {customer.address.suburb || ''} {customer.address.state || ''} {customer.address.postcode || ''}<br/>
                        {customer.address.instructions && <span>Note: {customer.address.instructions}</span>}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border-b text-xs">
                    {customer.scheduling ? (
                      <div>
                        {customer.scheduling.date || ''} {customer.scheduling.time || ''}<br/>
                        {customer.scheduling.is_flexible_date && 'Flexible Date'} {customer.scheduling.is_flexible_time && 'Flexible Time'}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border-b">
                    <Link href={`/dashboard/customers/${customer.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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