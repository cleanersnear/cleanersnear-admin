import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface Customer {
  id: string
  name: string
}

interface Staff {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
}

interface Booking {
  id: string
  customer: Customer
  staff: Staff
  service: Service
  booking_date: string
  booking_time: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TEMPLATE_PREVIEWS: Record<string, (booking: Booking) => { subject: string; body: string }> = {
  booking_confirmed: (booking) => ({
    subject: `Booking Confirmation - ${booking?.service?.name || 'Service'}`,
    body: `Hi ${booking?.customer?.name || 'Customer'},\n\nYour booking for ${booking?.service?.name || 'the service'} on ${booking?.booking_date} at ${booking?.booking_time} has been confirmed.\n\nThank you!\n${process.env.NEXT_PUBLIC_COMPANY_NAME}`
  }),
  staff_allocation: (booking) => ({
    subject: `New Booking Assignment - ${booking?.service?.name || 'Service'}`,
    body: `Hi ${booking?.staff?.name || 'Staff'},\n\nYou have been assigned to a new booking for ${booking?.service?.name || 'the service'} on ${booking?.booking_date} at ${booking?.booking_time}.\n\nPlease check your schedule.\n${process.env.NEXT_PUBLIC_COMPANY_NAME}`
  }),
  // Add more templates as needed
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('bookingId')
  const emailType = searchParams.get('emailType')

  if (!bookingId || !emailType) {
    return NextResponse.json({ error: 'Missing bookingId or emailType' }, { status: 400 })
  }

  // Fetch booking data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`*, customer:customers(*), staff:staff(*), service:services(*)`)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Build preview
  const previewBuilder = TEMPLATE_PREVIEWS[emailType]
  if (!previewBuilder) {
    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
  }
  const { subject, body } = previewBuilder(booking)

  return NextResponse.json({
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@company.com',
    subject,
    body
  })
} 