import { useState } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  booking_number?: string
  service_type?: string
  status?: string
  total_price?: number
  created_at?: string
}

interface BookingSectionProps {
  email: string
  currentCustomerId: string
  bookings: Booking[]
  scheduling?: {
    date?: string
    time?: string
    is_flexible_date?: boolean
    is_flexible_time?: boolean
  } | null
}

export default function BookingSection({ currentCustomerId, bookings, scheduling }: BookingSectionProps) {
  const [loading] = useState(false)

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
                {booking.id === currentCustomerId && scheduling ? (
                  <p className="text-sm text-gray-500">
                    {scheduling.date} {scheduling.time}
                  </p>
                ) : null}
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