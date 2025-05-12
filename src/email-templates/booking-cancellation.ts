export interface BookingCancellationData {
    bookingNumber: string;
    customerName: string;
    serviceType: string;
    scheduledDate: string;
    scheduledTime: string;
    phone: string;
  }
  
  export function bookingCancellationTemplate(data: BookingCancellationData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Booking Cancelled - Cleaning Professionals</title>
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
                                  <h1 style="color: #D32F2F; margin: 0 0 15px 0; font-size: 28px; text-align: left;">Booking Cancelled</h1>
                                  <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; text-align: left; line-height: 1.6;">
                                      Dear ${data.customerName},<br>
                                      We regret to inform you that your booking has been cancelled. Please see the details below.
                                  </p>
                              </td>
                          </tr>

                          <!-- Booking Information -->
                          <tr>
                              <td style="padding: 0 50px; text-align: left;">
                                  <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                                      <tr>
                                          <td style="padding: 30px;">
                                              <h2 style="color: #D32F2F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">Booking Details</h2>
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
                                                      <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Date:</td>
                                                      <td style="padding: 12px 0; color: #1a202c;">${data.scheduledDate}</td>
                                                  </tr>
                                                  <tr>
                                                      <td style="padding: 12px 0; color: #4a5568; font-weight: 600;">Time:</td>
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

                          <!-- Message -->
                          <tr>
                              <td style="padding: 20px 50px; text-align: left;">
                                  <h2 style="color: #D32F2F; margin: 0 0 20px 0; font-size: 20px; text-align: left;">We're Here to Help</h2>
                                  <p style="color: #4a5568; font-size: 14px;">If you have any questions or would like to reschedule, please contact us at <b>${data.phone}</b> or reply to this email.</p>
                                  <p style="color: #4a5568; font-size: 14px;">We hope to serve you in the future.</p>
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