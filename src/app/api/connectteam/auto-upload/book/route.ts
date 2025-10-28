import { NextRequest, NextResponse } from 'next/server';
import { ConnectTeamService } from '@/config/connectTeam';
import { newBookingService } from '@/config/newDatabase';

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

    // Fetch normalized booking by number (CH_*)
    const booking = await newBookingService.getBookingByNumber(bookingNumber);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Optional service details
    type ServiceDetails = { duration?: string; special_requests?: string } | undefined;
    let serviceDetails: ServiceDetails = undefined;
    try {
      if (booking.service_details_id && booking.selected_service) {
        serviceDetails = await newBookingService.getServiceDetails(
          booking.selected_service,
          booking.service_details_id
        );
      }
    } catch {
      console.warn('Service details fetch failed (book)');
    }

    const connectTeam = new ConnectTeamService();
    const shiftData = connectTeam.formatShiftData(booking, serviceDetails);

    let schedulerId = process.env.CONNECTTEAM_SCHEDULER_ID as string | undefined;
    if (!schedulerId) {
      const schedulers = await connectTeam.getSchedulers();
      if (!schedulers || schedulers.length === 0) {
        return NextResponse.json({ error: 'No schedulers available' }, { status: 400 });
      }
      schedulerId = schedulers[0].id;
    }

    const result: unknown = await connectTeam.createShift(schedulerId!, shiftData);

    // Safely extract shiftId without using 'any'
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

    console.log('Auto-upload (book) success');
    return NextResponse.json({
      success: true,
      message: 'Auto-uploaded (book) to ConnectTeam',
      shiftId,
      schedulerId,
      bookingNumber,
    });
  } catch {
    console.error('Auto-upload (book) error');
    return NextResponse.json({ error: 'Failed to auto-upload' }, { status: 500 });
  }
}


