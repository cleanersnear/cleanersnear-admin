import { NextRequest, NextResponse } from 'next/server';
import { newBookingService } from '@/config/newDatabase';

interface ConfirmationData {
  bookingNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  phone: string;
  totalPrice: string;
}

interface CancellationData {
  bookingNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  phone: string;
}

interface CompletedData {
  bookingNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  phone: string;
  totalPrice: string;
}

interface FeedbackData {
  bookingNumber: string;
  customerName: string;
  serviceType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { emailType, bookingNumber, confirmedTime, previewData } = await request.json();

    if (!emailType || !bookingNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing email type or booking number' },
        { status: 400 }
      );
    }

    // Fetch booking if needed
    let booking = null;
    if (!previewData) {
      booking = await newBookingService.getBookingByNumber(bookingNumber);
      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      }
    }

    // Generate HTML based on email type
    let htmlContent = '';

    // Use previewData if provided (includes edited values), otherwise generate from booking
    const finalPreviewData = previewData || {};

    switch (emailType) {
      case 'confirmation':
        const confirmationData = {
          bookingNumber: finalPreviewData.bookingNumber || booking?.booking_number || '',
          customerName: finalPreviewData.customerName || (booking ? `${booking.first_name} ${booking.last_name}` : ''),
          serviceType: finalPreviewData.serviceType || booking?.selected_service || '',
          scheduledDate: finalPreviewData.scheduledDate || (booking ? new Date(booking.schedule_date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : ''),
          scheduledTime: finalPreviewData.scheduledTime || confirmedTime || '',
          serviceAddress: finalPreviewData.serviceAddress || (booking ? `${booking.address}, ${booking.suburb} ${booking.postcode}` : ''),
          phone: finalPreviewData.phone || booking?.phone || '',
          totalPrice: finalPreviewData.totalPrice 
            ? (typeof finalPreviewData.totalPrice === 'string' ? parseFloat(finalPreviewData.totalPrice) : finalPreviewData.totalPrice).toFixed(2)
            : (booking?.total_price || booking?.pricing?.totalPrice || 0).toFixed(2),
        };
        htmlContent = generateConfirmationHTML(confirmationData);
        break;
      case 'cancellation':
        htmlContent = generateCancellationHTML(previewData || {
          bookingNumber: booking?.booking_number || '',
          customerName: booking ? `${booking.first_name} ${booking.last_name}` : '',
          serviceType: booking?.selected_service || '',
          scheduledDate: booking ? new Date(booking.schedule_date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : '',
          scheduledTime: booking?.notes?.match(/\[Confirmed Time: (.*?)\]/)?.[1] || 'To be confirmed',
          phone: booking?.phone || '',
        });
        break;
      case 'completed':
        const completedData = {
          bookingNumber: finalPreviewData.bookingNumber || booking?.booking_number || '',
          customerName: finalPreviewData.customerName || (booking ? `${booking.first_name} ${booking.last_name}` : ''),
          serviceType: finalPreviewData.serviceType || booking?.selected_service || '',
          scheduledDate: finalPreviewData.scheduledDate || (booking ? new Date(booking.schedule_date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : ''),
          scheduledTime: finalPreviewData.scheduledTime || booking?.notes?.match(/\[Confirmed Time: (.*?)\]/)?.[1] || 'N/A',
          serviceAddress: finalPreviewData.serviceAddress || (booking ? `${booking.address}, ${booking.suburb} ${booking.postcode}` : ''),
          phone: finalPreviewData.phone || booking?.phone || '',
          totalPrice: finalPreviewData.totalPrice 
            ? (typeof finalPreviewData.totalPrice === 'string' ? parseFloat(finalPreviewData.totalPrice) : finalPreviewData.totalPrice).toFixed(2)
            : (booking?.total_price || booking?.pricing?.totalPrice || 0).toFixed(2),
        };
        htmlContent = generateCompletedHTML(completedData);
        break;
      case 'feedback':
        htmlContent = generateFeedbackHTML(previewData || {
          bookingNumber: booking?.booking_number || '',
          customerName: booking ? `${booking.first_name} ${booking.last_name}` : '',
          serviceType: booking?.selected_service || '',
        });
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview'
      },
      { status: 500 }
    );
  }
}

function generateConfirmationHTML(data: ConfirmationData) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Confirmation - Cleaning Professionals</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 5px 0; text-align: center; background-color: #ffffff;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 4px 50px 2px;">
                            <img src="http://cdn.mcauto-images-production.sendgrid.net/f8644de4c4e80034/779cf146-1605-473c-a3c5-22a033ade0c2/500x500.jpg" alt="Cleaning Professionals" style="width: 200px; margin-bottom: 30px;">
                            <h1 style="color: #1E3D8F; margin: 0 0 15px 0; font-size: 28px; text-align: left;">Your Service is Confirmed!</h1>
                            <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; text-align: left; line-height: 1.6;">
                                Dear ${data.customerName},<br>
                                We're pleased to confirm your upcoming cleaning service. Our professional team is scheduled and ready to provide you with exceptional service.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px; text-align: left;">
                            <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <h2 style="color: #1E3D8F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">Service Details</h2>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; width: 40%; font-weight: 600;">Booking Reference:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.bookingNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Type:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.serviceType}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Confirmed Date:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.scheduledDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Confirmed Time:</td>
                                                <td style="padding: 12px 0; color: #1a202c; font-weight: 700; font-size: 18px;">${data.scheduledTime}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Address:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.serviceAddress}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Phone:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.phone}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Total Amount:</td>
                                                <td style="padding: 12px 0; color: #1a202c; font-weight: 700;">$${data.totalPrice}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 50px; text-align: left;">
                            <h2 style="color: #1E3D8F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">How to Prepare</h2>
                            <div style="background-color: #ffffff; border-left: 4px solid #1E3D8F; padding: 15px; margin-bottom: 15px;">
                                <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px;">Access</h3>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">Please ensure your property is accessible at the scheduled time</p>
                            </div>
                            <div style="background-color: #ffffff; border-left: 4px solid #1E3D8F; padding: 15px; margin-bottom: 15px;">
                                <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px;">Clear Work Areas</h3>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">Remove personal items from surfaces to be cleaned for best results</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 50px 30px; text-align: left;">
                            <h2 style="color: #1E3D8F; margin: 0 0 15px 0; font-size: 20px; text-align: left;">Cancellation Policy</h2>
                            <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                                Need to reschedule or cancel? Please provide at least 24 hours' notice to avoid cancellation fees. You can easily manage your booking by replying to this email or calling us.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px 30px;">
                            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                                <h3 style="color: #1E3D8F; margin: 0 0 15px 0; font-size: 18px;">Need Assistance?</h3>
                                <p style="color: #4a5568; margin: 0 0 5px 0; font-size: 14px;">
                                    Email: account@cleaningprofessionals.com.au<br>
                                    Phone: 0450 124 086<br>
                                    Operating Hours: Mon-Fri 8am–8pm, Sat 9am-7pm, Sun 9am-8pm
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 50px; background-color: #1E3D8F; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                            <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; text-align: center;">
                                Cleaning Professionals | Melbourne, VIC<br>
                                <a href="https://www.cleaningprofessionals.com.au" style="color: #ffffff; text-decoration: underline;">www.cleaningprofessionals.com.au</a>
                            </p>
                            <p style="margin: 0; color: #cbd5e0; font-size: 12px; text-align: center;">
                                Police Checked • Fully Insured • 4+ Years Experience
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateCancellationHTML(data: CancellationData) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancelled - Cleaning Professionals</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 5px 0; text-align: center; background-color: #ffffff;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 4px 50px 2px;">
                            <img src="http://cdn.mcauto-images-production.sendgrid.net/f8644de4c4e80034/779cf146-1605-473c-a3c5-22a033ade0c2/500x500.jpg" alt="Cleaning Professionals" style="width: 200px; margin-bottom: 30px;">
                            <h1 style="color: #D32F2F; margin: 0 0 15px 0; font-size: 28px; text-align: left;">Booking Cancelled</h1>
                            <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; text-align: left; line-height: 1.6;">
                                Dear ${data.customerName},<br>
                                We regret to inform you that your booking has been cancelled. Please see the details below.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px; text-align: left;">
                            <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <h2 style="color: #D32F2F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">Cancelled Booking Details</h2>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; width: 40%; font-weight: 600;">Booking Reference:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.bookingNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Type:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.serviceType}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Scheduled Date:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.scheduledDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Scheduled Time:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.scheduledTime}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Phone:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.phone}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 50px; text-align: left;">
                            <h2 style="color: #D32F2F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">Rescheduling Options</h2>
                            <div style="background-color: #ffffff; border-left: 4px solid #D32F2F; padding: 15px; margin-bottom: 15px;">
                                <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px;">Book a New Service</h3>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">We'd be happy to help you reschedule your service for a more convenient time</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px 30px;">
                            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                                <h3 style="color: #D32F2F; margin: 0 0 15px 0; font-size: 18px;">Need Assistance?</h3>
                                <p style="color: #4a5568; margin: 0 0 5px 0; font-size: 14px;">
                                    Email: account@cleaningprofessionals.com.au<br>
                                    Phone: 0450 124 086<br>
                                    Operating Hours: Mon-Fri 8am–8pm, Sat 9am-7pm, Sun 9am-8pm
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 50px; background-color: #1E3D8F; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                            <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; text-align: center;">
                                Cleaning Professionals | Melbourne, VIC<br>
                                <a href="https://www.cleaningprofessionals.com.au" style="color: #ffffff; text-decoration: underline;">www.cleaningprofessionals.com.au</a>
                            </p>
                            <p style="margin: 0; color: #cbd5e0; font-size: 12px; text-align: center;">
                                Police Checked • Fully Insured • 4+ Years Experience
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateCompletedHTML(data: CompletedData) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Completed - Cleaning Professionals</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 5px 0; text-align: center; background-color: #ffffff;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 4px 50px 2px;">
                            <img src="http://cdn.mcauto-images-production.sendgrid.net/f8644de4c4e80034/779cf146-1605-473c-a3c5-22a033ade0c2/500x500.jpg" alt="Cleaning Professionals" style="width: 200px; margin-bottom: 30px;">
                            <h1 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 28px; text-align: left;">Service Successfully Completed!</h1>
                            <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; text-align: left; line-height: 1.6;">
                                Dear ${data.customerName},<br>
                                We're pleased to inform you that your cleaning service has been successfully completed. Thank you for choosing Cleaning Professionals!
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px; text-align: left;">
                            <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <h2 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 20px; text-align: left;">Service Details</h2>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; width: 40%; font-weight: 600;">Booking Reference:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.bookingNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Type:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.serviceType}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Date:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.scheduledDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Time:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.scheduledTime}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Service Address:</td>
                                                <td style="padding: 12px 0; color: #1a202c;">${data.serviceAddress}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Total Amount:</td>
                                                <td style="padding: 12px 0; color: #1a202c; font-weight: 700;">$${data.totalPrice}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 50px; text-align: left;">
                            <h2 style="color: #2E7D32; margin: 0 0 20px 0; font-size: 20px; text-align: left;">We Value Your Feedback</h2>
                            <div style="background-color: #ffffff; border-left: 4px solid #2E7D32; padding: 15px; margin-bottom: 15px;">
                                <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px;">Share Your Experience</h3>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">Your feedback helps us improve our services. We'd love to hear about your experience!</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 50px 30px; text-align: left;">
                            <h2 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 20px; text-align: left;">Book Your Next Service</h2>
                            <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                                Ready to schedule your next cleaning? Book now and receive a special returning customer discount!
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="https://www.cleaningprofessionals.com.au/quick-book/location/" style="background-color: #2E7D32; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 16px;">BOOK NOW</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 50px 30px;">
                            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                                <h3 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 18px;">Need Assistance?</h3>
                                <p style="color: #4a5568; margin: 0 0 5px 0; font-size: 14px;">
                                    Email: account@cleaningprofessionals.com.au<br>
                                    Phone: 0450 124 086<br>
                                    Operating Hours: Mon-Fri 8am–8pm, Sat 9am-7pm, Sun 9am-8pm
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 50px; background-color: #1E3D8F; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                            <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; text-align: center;">
                                Cleaning Professionals | Melbourne, VIC<br>
                                <a href="https://www.cleaningprofessionals.com.au" style="color: #ffffff; text-decoration: underline;">www.cleaningprofessionals.com.au</a>
                            </p>
                            <p style="margin: 0; color: #cbd5e0; font-size: 12px; text-align: center;">
                                Police Checked • Fully Insured • 4+ Years Experience
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateFeedbackHTML(data: FeedbackData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Request - Cleaning Professionals</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      text-align: center;
      max-width: 600px;
      margin: 40px auto 32px auto;
    }
    h1 {
      color: #1a4294;
      font-size: 24px;
      margin: 10px 0;
      font-weight: 600;
    }
    .booking-tag {
      display: inline-block;
      background-color: #f0f4ff;
      color: #1a4294;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 14px;
      margin: 10px 0 20px;
      font-weight: 500;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 25px;
      text-align: left;
      padding: 0 10px;
    }
    .service-type {
      font-weight: 600;
    }
    .btn {
      background-color: transparent;
      color: #1a4294 !important;
      border: 2px solid #1a4294;
      border-radius: 30px;
      padding: 13px 30px;
      font-size: 16px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 18px auto 0 auto;
      font-weight: 600;
      gap: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>We value your feedback</h1>
    <span class="booking-tag">Booking #${data.bookingNumber}</span>
    <div class="greeting">Hi ${data.customerName},</div>
    <div class="message">
      <p style="margin: 0 0 12px 0;">Thank you for choosing Cleaning Professionals for your recent <span class="service-type">${data.serviceType}</span>. We hope everything met your expectations!</p>
      <p style="margin: 0;">Would you take a moment to share your experience? Your feedback helps us continue to deliver exceptional service.</p>
    </div>
    <a href="https://my.cleaningprofessionals.com.au/feedback/?booking=${data.bookingNumber}" class="btn">
      Leave Feedback
    </a>
    <div style="margin-top: 20px; color: #555; font-size: 14px;">
      The Cleaning Professionals Team
    </div>
    <div style="margin-top: 25px; font-size: 13px; color: #777; text-align: center;">
      Melbourne, VIC | <a href="https://cleaningprofessionals.com.au" style="color: #1a4294; text-decoration: none;">cleaningprofessionals.com.au</a>
    </div>
  </div>
</body>
</html>`;
}

