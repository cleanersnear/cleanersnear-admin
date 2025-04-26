"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

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

export default function CustomerDetail({ bookingId }: { bookingId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCustomer = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('booking_id', bookingId)
      if (!error && data && data.length > 0) {
        setCustomer(data[0])
      } else {
        setCustomer(null)
        toast.error('Customer not found')
      }
      setIsLoading(false)
    }
    if (bookingId) fetchCustomer()
  }, [bookingId, supabase])

  if (isLoading) {
    return <div>Loading customer info...</div>
  }

  if (!customer) {
    return <div>No customer found for this booking.</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-bold mb-2">Customer Details</h2>
      <div>
        <span className="font-semibold">Name:</span> {customer.first_name} {customer.last_name}
      </div>
      <div>
        <span className="font-semibold">Email:</span> {customer.email}
      </div>
      <div>
        <span className="font-semibold">Phone:</span> {customer.phone}
      </div>
      <div>
        <span className="font-semibold">Address:</span>
        <div className="ml-2 text-sm">
          {customer.address ? (
            <>
              {customer.address.street && <div>Street: {customer.address.street}</div>}
              {customer.address.unit && <div>Unit: {customer.address.unit}</div>}
              {customer.address.city && <div>City: {customer.address.city}</div>}
              {customer.address.suburb && <div>Suburb: {customer.address.suburb}</div>}
              {customer.address.state && <div>State: {customer.address.state}</div>}
              {customer.address.postcode && <div>Postcode: {customer.address.postcode}</div>}
              {customer.address.instructions && <div>Instructions: {customer.address.instructions}</div>}
            </>
          ) : 'N/A'}
        </div>
      </div>
      <div>
        <span className="font-semibold">Scheduling:</span>
        <div className="ml-2 text-sm">
          {customer.scheduling ? (
            <>
              {customer.scheduling.date && <div>Date: {customer.scheduling.date}</div>}
              {customer.scheduling.time && <div>Time: {customer.scheduling.time}</div>}
              {customer.scheduling.is_flexible_date && <div>Flexible Date: Yes</div>}
              {customer.scheduling.is_flexible_time && <div>Flexible Time: Yes</div>}
            </>
          ) : 'N/A'}
        </div>
      </div>
      <div className="pt-4">
        <a
          href={`/dashboard/customers/${customer.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Full Customer Profile
        </a>
      </div>
    </div>
  )
} 