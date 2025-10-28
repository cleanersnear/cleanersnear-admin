import { NextRequest, NextResponse } from 'next/server';
import { ConnectTeamService } from '@/config/connectTeam';
import { oldSupabase } from '@/config/newDatabase';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CONNECTTEAM_API_KEY;
    if (!apiKey) {
      console.error('ConnectTeam not configured');
      return NextResponse.json({ error: 'ConnectTeam not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const bookingNumber = body?.bookingNumber as string | undefined;
    if (!bookingNumber) {
      return NextResponse.json({ error: 'bookingNumber is required' }, { status: 400 });
    }

    // Fetch quick booking and customer by booking number
    if (!oldSupabase) {
      console.error('Old Supabase not configured');
      return NextResponse.json({ error: 'Quick-book database not configured' }, { status: 500 });
    }

    const { data: quickBooking, error: qbErr } = await oldSupabase
      .from('quick_bookings')
      .select('*')
      .eq('booking_number', bookingNumber)
      .maybeSingle();
    if (qbErr || !quickBooking) {
      return NextResponse.json({ error: 'Quick booking not found' }, { status: 404 });
    }

    // Fetch customer using customer_id (same as listing page)
    const { data: quickCustomer } = await oldSupabase
      .from('quick_customers')
      .select('*')
      .eq('id', quickBooking.customer_id)
      .maybeSingle();

    // Adapt to formatShiftData input
    type BookingInput = {
      booking_number: string;
      selected_service: string;
      schedule_date: string;
      notes?: string;
      address: string;
      suburb: string;
      postcode: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      status: string;
    };

    const booking: BookingInput = {
      booking_number: quickBooking.booking_number,
      selected_service: quickBooking.service_type,
      schedule_date: quickBooking.preferred_date,
      notes: quickBooking.address_additional_info || '',
      address: quickBooking.address_street,
      suburb: quickBooking.address_suburb,
      postcode: quickBooking.address_postcode,
      first_name: quickCustomer?.first_name || '',
      last_name: quickCustomer?.last_name || '',
      email: quickCustomer?.email || '',
      phone: quickCustomer?.phone || '',
      status: 'pending',
    };

    const connectTeam = new ConnectTeamService();
    const shiftData = connectTeam.formatShiftData(booking, undefined);

    let schedulerId = process.env.CONNECTTEAM_SCHEDULER_ID as string | undefined;
    if (!schedulerId) {
      const schedulers = await connectTeam.getSchedulers();
      if (!schedulers || schedulers.length === 0) {
        return NextResponse.json({ error: 'No schedulers available' }, { status: 400 });
      }
      schedulerId = schedulers[0].id;
    }

    const result: unknown = await connectTeam.createShift(schedulerId!, shiftData);

    // Safely extract shiftId
    let shiftId: string | null = null;
    if (typeof result === 'object' && result !== null) {
      const maybeId = (result as { id?: unknown }).id;
      if (typeof maybeId === 'string') {
        shiftId = maybeId;
      } else {
        const data = (result as { data?: unknown }).data;
        if (typeof data === 'object' && data !== null) {
          const innerId = (data as { id?: unknown }).id;
          if (typeof innerId === 'string') {
            shiftId = innerId;
          }
        }
      }
    }

    console.log('Auto-upload (quickbook) success');
    return NextResponse.json({
      success: true,
      message: 'Auto-uploaded (quickbook) to ConnectTeam',
      shiftId,
      schedulerId,
      bookingNumber,
    });
  } catch {
    console.error('Auto-upload (quickbook) error');
    return NextResponse.json({ error: 'Failed to auto-upload' }, { status: 500 });
  }
}


