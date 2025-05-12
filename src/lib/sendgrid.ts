interface SendGridTemplateData {
  bookingNumber?: string;
  serviceType?: string;
  totalPrice?: number;
  customerName?: string;
  serviceAddress?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  phone?: string;
  [key: string]: string | number | undefined; // For any additional dynamic fields
}

interface SendEmailParams {
  to: string | string[];
  templateId: string;
  dynamicTemplateData: SendGridTemplateData;
  from?: string;
  cc?: string[];
  bcc?: string[];
}

export async function sendEmail({
  to,
  templateId,
  dynamicTemplateData,
  from,
  cc,
  bcc
}: SendEmailParams) {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        templateId,
        dynamicTemplateData,
        from,
        cc,
        bcc
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send email')
    }

    return { success: true }
  } catch (error) {
    console.error('Email Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
} 