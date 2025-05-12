import { NextResponse } from 'next/server'

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, templateId, dynamicTemplateData, from, cc, bcc } = body

    const data = {
      personalizations: [{
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        cc: cc ? (Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }]) : undefined,
        dynamic_template_data: dynamicTemplateData
      }],
      from: {
        email: (from && from.email) || from || process.env.SENDGRID_FROM_EMAIL!,
        name: (from && from.name) || process.env.SENDGRID_FROM_NAME || 'Cleaning Professionals'
      },
      template_id: templateId
    }

    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.message || 'Failed to send email')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SendGrid Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    )
  }
} 