import { NextRequest, NextResponse } from 'next/server';
import { newBookingService } from '@/config/newDatabase';
import { EMAIL_TEMPLATES, EMAIL_FROM } from '@/config/emailTemplates';

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

export async function POST(request: NextRequest) {
  try {
    const { bookingNumber, confirmedTime, confirmationNotes, to, from, subject, editedData } = await request.json();

    if (!bookingNumber || !confirmedTime) {
      return NextResponse.json(
        { success: false, error: 'Missing booking number or confirmed time' },
        { status: 400 }
      );
    }

    // Fetch booking details
    const booking = await newBookingService.getBookingByNumber(bookingNumber);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Format the scheduled date
    const scheduledDate = new Date(booking.schedule_date).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare email data
    const customerName = `${booking.first_name} ${booking.last_name}`;
    const serviceAddress = `${booking.address}, ${booking.suburb} ${booking.postcode}`;
    const totalPrice = booking.total_price || booking.pricing?.totalPrice || 0;

    // Prepare dynamic template data for SendGrid
    // Note: confirmationNotes are saved to booking but NOT sent in email
    const templateData = {
      bookingNumber: booking.booking_number,
      customerName,
      serviceType: booking.selected_service,
      scheduledDate,
      scheduledTime: confirmedTime,
      serviceAddress,
      phone: booking.phone,
      totalPrice: totalPrice.toFixed(2),
    };

    // Merge edited data (e.g., edited price) with template data
    // editedData takes precedence over default values
    const finalTemplateData = {
      ...templateData,
      ...(editedData || {}),
      // Ensure price is formatted if it was edited
      ...(editedData?.totalPrice && { totalPrice: parseFloat(editedData.totalPrice).toFixed(2) }),
    };

    // Check if template ID is configured
    if (!EMAIL_TEMPLATES.CONFIRMATION) {
      return NextResponse.json(
        { success: false, error: 'Email template not configured. Please set SENDGRID_TEMPLATE_CONFIRMATION in environment variables.' },
        { status: 500 }
      );
    }

    // Send email via SendGrid using template
    const emailData = {
      personalizations: [{
        to: [{ email: to || booking.email }],
        subject: subject || `Service Confirmed - ${booking.booking_number}`,
        dynamic_template_data: finalTemplateData
      }],
      from: {
        email: from || EMAIL_FROM.EMAIL,
        name: EMAIL_FROM.NAME
      },
      template_id: EMAIL_TEMPLATES.CONFIRMATION,
    };

    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SendGrid error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to send email');
    }

    // Update booking status to confirmed
    try {
      await newBookingService.updateBookingStatus(bookingNumber, 'confirmed');
    } catch (statusError) {
      console.warn('Failed to update booking status:', statusError);
    }

    // Update booking with confirmed time and notes
    // Store in booking notes: [Confirmed Time: XX:XX AM/PM] and confirmation notes if provided
    try {
      const timeNote = `[Confirmed Time: ${confirmedTime}]`;
      const notesToAdd = confirmationNotes 
        ? `${timeNote}\n[Confirmation Notes: ${confirmationNotes}]`
        : timeNote;
      
      const updatedNotes = booking.notes 
        ? `${booking.notes}\n${notesToAdd}`
        : notesToAdd;
      
      await newBookingService.updateBookingNotes(bookingNumber, updatedNotes.trim());
    } catch (updateError) {
      console.warn('Failed to update booking notes with confirmed time:', updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send confirmation email'
      },
      { status: 500 }
    );
  }
}

