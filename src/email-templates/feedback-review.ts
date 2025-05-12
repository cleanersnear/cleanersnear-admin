export interface FeedbackReviewData {
  bookingNumber: string;
  serviceType: string;
  customerName: string;
  serviceAddress: string;
  scheduledDate: string;
  scheduledTime: string;
}

export function feedbackReviewTemplate(data: FeedbackReviewData) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Feedback Request</title>
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
    .logo {
        margin-bottom: 15px;
    }
    .logo svg {
        width: 60px;
        height: 60px;
        fill: #1a4294;
        display: block;
        margin: 0 auto;
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
        background-color: #1a4294;
        color: white;
        border: none;
        padding: 13px 30px;
        border-radius: 30px;
        
        cursor: pointer;
        transition: background-color 0.3s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 18px auto 0 auto;
        font-weight: 500;
        gap: 10px;
        line-height: 1;
    }
    .btn:hover {
        background-color: #0d2b6d;
    }
    .icon {
        margin-right: 8px;
        display: inline-block;
        width: 18px;
        height: 18px;
    }
    .team {
        margin-top: 20px;
        color: #555;
        font-size: 14px;
    }
    .divider {
        display: inline-block;
        margin: 0 10px;
        color: #ccc;
    }
    .footer {
        margin-top: 25px;
        font-size: 13px;
        color: #777;
        text-align: center;
    }
    .company-link {
        color: #1a4294;
        text-decoration: none;
    }
    .company-link:hover {
        text-decoration: underline;
    }
</style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/>
          </svg>
        </div>
        <h1>We value your feedback</h1>
        <div class="booking-tag">Booking #${data.bookingNumber}</div>
        <div class="greeting">Hi ${data.customerName},</div>
        <div class="message">
          <p style="margin:0 0 12px 0;">
            Thank you for choosing Cleaning Professionals for your recent <span class="service-type">${data.serviceType}</span>. We hope everything met your expectations!
          </p>
          <p style="margin:0;">
            Would you take a moment to share your experience? Your feedback helps us continue to deliver exceptional service.
          </p>
        </div>
        <a href="https://www.cleaningprofessionals.com.au/feedback/?booking=${data.bookingNumber}" class="btn">
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Leave Feedback
        </a>
        <div class="team">
          The Cleaning Professionals Team
        </div>
        <div class="footer">
          Melbourne, VIC <span class="divider">|</span>
          <a href="https://cleaningprofessionals.com.au" class="company-link">cleaningprofessionals.com.au</a>
        </div>
      </div>
    </body>
    </html>
  `;
} 