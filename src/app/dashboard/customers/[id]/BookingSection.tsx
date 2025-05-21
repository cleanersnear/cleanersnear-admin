import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Booking {
  id: string
  booking_number?: string
  service_type?: string
  status?: string
  total_price?: number
  scheduling?: {
    date?: string
    time?: string
  }
  created_at?: string
}

export default function BookingSection({ email, currentCustomerId }: { email: string, currentCustomerId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      // 1. Find all customers with the same email
      const { data: customers } = await supabase
        .from('customers')
        .select('id, booking_id')
        .eq('email', email)
      if (!customers) {
        setBookings([])
        setLoading(false)
        return
      }
      // 2. Collect all booking_ids (filter out null/undefined)
      const bookingIds = customers
        .map((c: { booking_id?: string }) => c.booking_id)
        .filter((id: string | undefined) => !!id)
      if (bookingIds.length === 0) {
        setBookings([])
        setLoading(false)
        return
      }
      // 3. Fetch all bookings with those IDs
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .in('id', bookingIds)
      setBookings(bookingsData || [])
      setLoading(false)
    }
    if (email) fetchBookings()
  }, [email, supabase])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Bookings</h2>
      {loading ? (
        <div>Loading bookings...</div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className={`border-b pb-4 last:border-b-0 last:pb-0 flex justify-between items-center transition-colors
                ${booking.id === currentCustomerId ? 'bg-blue-50 rounded-lg p-3' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Booking #{booking.booking_number || 'N/A'}</p>
                  {booking.id === currentCustomerId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {booking.scheduling?.date} {booking.scheduling?.time}
                </p>
                <p className="text-xs text-gray-400">{booking.status} | {booking.service_type}</p>
              </div>
              <Link
                href={`/dashboard/bookings/${booking.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No bookings found for this customer.</p>
      )}
    </div>
  )
} 