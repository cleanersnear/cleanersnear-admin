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
      customer:customers(*)
    `)
    .eq('id', id)
    .single()

  if (bookingError) {
    console.error('Error fetching booking:', bookingError)
    return <div>Error loading booking details</div>
  }

  if (!booking) {
    return <div>Booking not found</div>
  }

  // Fetch admin details
  const { data: adminDetails, error: adminError } = await supabase
    .from('booking_admin_details')
    .select('*')
    .eq('booking_id', id)
    .single()

  if (adminError && adminError.code !== 'PGRST116') {
    console.error('Error fetching admin details:', adminError)
    return <div>Error loading admin details</div>
  }

  return (
    <div className="space-y-6">
      <BookingDetail id={id} initialData={{ booking, adminDetails }} />
    </div>
  )
} 