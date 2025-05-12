'use client'

import { useState } from 'react'
import { bookingConfirmationTemplate, BookingConfirmationData } from '@/email-templates/booking-confirmation'

interface BookingEmailProps extends BookingConfirmationData {
  to: string
  onSuccess?: () => void
  onError?: (error: string) => void
  previewMode?: boolean
}

export default function BookingEmail({
  to,
  bookingNumber,
  serviceType,
  totalPrice,
  customerName,
  serviceAddress,
  scheduledDate,
  scheduledTime,
  phone,
  onSuccess,
  onError,
  previewMode = false,
}: BookingEmailProps) {
  const [isLoading, setIsLoading] = useState(false)

  const html = bookingConfirmationTemplate({
    bookingNumber,
    serviceType,
    totalPrice,
    customerName,
    serviceAddress,
    scheduledDate,
    scheduledTime,
    phone,
  })

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          templateId: 'd-d42f6f2818d64cb8aa3b6224d78fdb52', // Your SendGrid template ID
          dynamicTemplateData: {
            bookingNumber,
            serviceType,
            totalPrice,
            customerName,
            serviceAddress,
            scheduledDate,
            scheduledTime,
            phone,
          }
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send email')
      }

      onSuccess?.()
    } catch (err: Error | unknown) {
      onError?.(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  if (previewMode) {
    return (
      <div className="border p-4 rounded bg-white">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={isLoading}
      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
    >
      {isLoading ? 'Sending...' : 'Send Email'}
    </button>
  )
} 