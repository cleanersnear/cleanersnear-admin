export interface BookingConfirmationData {
  bookingNumber: string;
  serviceType: string;
  totalPrice: number;
  customerName: string;
  serviceAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  phone: string;
}

export function bookingConfirmationTemplate(data: BookingConfirmationData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Service Confirmation - Cleaning Professionals</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 5px 0; text-align: center; background-color: #ffffff;">
                    <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header with Logo -->
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

                        <!-- Service Information -->
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
                                                    <td style="padding: 12px 0; color: #1a202c;">${data.scheduledTime}</td>
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

                        <!-- Service Preparation Section -->
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

                        <!-- Cancellation Policy -->
                        <tr>
                            <td style="padding: 10px 50px 30px; text-align: left;">
                                <h2 style="color: #1E3D8F; margin: 0 0 15px 0; font-size: 20px; text-align: left;">Cancellation Policy</h2>
                                <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                                    Need to reschedule or cancel? Please provide at least 24 hours' notice to avoid cancellation fees. You can easily manage your booking by replying to this email or calling us.
                                </p>
                            </td>
                        </tr>

                        <!-- Contact Information -->
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

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 50px; background-color: #1E3D8F; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                                <!-- Company Info -->
                                <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; text-align: center;">
                                    Cleaning Professionals | Melbourne, VIC<br>
                                    <a href="https://www.cleaningprofessionals.com.au" style="color: #ffffff; text-decoration: underline;">www.cleaningprofessionals.com.au</a>
                                </p>
                                <!-- Credentials -->
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
    </html>
  `;
} 