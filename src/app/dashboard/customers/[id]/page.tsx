"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookingNumber, setBookingNumber] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!id) return
    const fetchCustomer = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      if (!error && data) {
        setCustomer(data)
        // Fetch booking number if booking_id exists
        if (data.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('booking_number')
            .eq('id', data.booking_id)
            .single()
          if (!bookingError && booking) {
            setBookingNumber(booking.booking_number)
          } else {
            setBookingNumber(null)
          }
        } else {
          setBookingNumber(null)
        }
      }
      setIsLoading(false)
    }
    fetchCustomer()
  }, [id, supabase])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link href="/dashboard/customers" className="text-blue-600 hover:underline text-sm">← Back to Customers</Link>
      <h1 className="text-2xl font-bold mb-4 mt-2">Customer Details</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : !customer ? (
        <div>Customer not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
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
            <span className="font-semibold">Booking Number:</span> {bookingNumber || 'N/A'}
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
        </div>
      )}
    </div>
  )
} 