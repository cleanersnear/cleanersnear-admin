import { NextRequest, NextResponse } from 'next/server';
import { newBookingService } from '@/config/newDatabase';
import { EMAIL_TEMPLATES, EMAIL_FROM } from '@/config/emailTemplates';

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

export async function POST(request: NextRequest) {
  try {
    const { bookingNumber, to, from, subject, customMessage, editedData } = await request.json();

    if (!bookingNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing booking number' },
        { status: 400 }
      );
    }

    const booking = await newBookingService.getBookingByNumber(bookingNumber);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const scheduledDate = new Date(booking.schedule_date).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeMatch = booking.notes?.match(/\[Confirmed Time: (.*?)\]/);
    const scheduledTime = timeMatch ? timeMatch[1] : 'N/A';
    const customerName = `${booking.first_name} ${booking.last_name}`;
    const serviceAddress = `${booking.address}, ${booking.suburb} ${booking.postcode}`;

    const templateData = {
      bookingNumber: booking.booking_number,
      customerName,
      serviceType: booking.selected_service,
      scheduledDate,
      scheduledTime,
      serviceAddress,
      customMessage: customMessage || '',
    };

    // Merge edited data with template data
    const finalTemplateData = {
      ...templateData,
      ...(editedData || {}),
    };

    if (!EMAIL_TEMPLATES.FEEDBACK) {
      return NextResponse.json(
        { success: false, error: 'Email template not configured. Please set SENDGRID_TEMPLATE_FEEDBACK.' },
        { status: 500 }
      );
    }

    const emailData = {
      personalizations: [{
        to: [{ email: to || booking.email }],
        subject: subject || `We'd Love Your Feedback - ${booking.booking_number}`,
        dynamic_template_data: finalTemplateData
      }],
      from: {
        email: from || EMAIL_FROM.EMAIL,
        name: EMAIL_FROM.NAME
      },
      template_id: EMAIL_TEMPLATES.FEEDBACK,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send feedback email'
      },
      { status: 500 }
    );
  }
}
