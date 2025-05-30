import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import BookingDetail from './booking-detail'

export default async function BookingPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Fetch initial booking data on the server
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      customers!bookings_customer_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (bookingError) {
    console.error('Error fetching booking:', bookingError)
    return <div className="p-4 text-gray-600">Booking not found or has been deleted.</div>
  }

  if (!booking) {
    return <div className="p-4 text-gray-600">Booking not found or has been deleted.</div>
  }

  // Fetch admin details
  const { data: adminDetails, error: adminError } = await supabase
    .from('booking_admin_details')
    .select('*')
    .eq('booking_id', id)
    .single()

  if (adminError && adminError.code !== 'PGRST116') {
    // Don't show a toast, just render a neutral message
    return <div className="p-4 text-gray-600">This booking no longer exists or admin details are missing.</div>
  }

  return (
    <div className="space-y-6">
      <BookingDetail id={id} initialData={{ booking, adminDetails }} />
    </div>
  )
} 