'use client'

import { useState, useEffect, useRef } from 'react'
import { bookingConfirmationTemplate } from '@/email-templates/booking-confirmation'
import { bookingCancellationTemplate } from '@/email-templates/booking-cancellation'
import { bookingCompletedTemplate } from '@/email-templates/booking-completed'
import { feedbackReviewTemplate } from '@/email-templates/feedback-review'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const EMAIL_TEMPLATES = {
  booking_confirmed: {
    label: 'Booking Confirmation',
    template: bookingConfirmationTemplate,
  },
  cancellation: {
    label: 'Cancellation',
    template: bookingCancellationTemplate,
  },
  completed: {
    label: 'Service Completed',
    template: bookingCompletedTemplate,
  },
  feedback_review: {
    label: 'Feedback & Review',
    template: feedbackReviewTemplate,
  }
} as const

type EmailType = keyof typeof EMAIL_TEMPLATES


interface Customer {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: {
    street?: string
    city?: string
    suburb?: string
    postcode?: string
    state?: string
    unit?: string
    instructions?: string
  } | null
  scheduling: {
    date?: string
    time?: string
    is_flexible_date?: boolean
    is_flexible_time?: boolean
  } | null
}



const SERVICE_TYPE_DISPLAY_NAMES = {
  'carpet-cleaning': 'Carpet Cleaning',
  'end-of-lease-cleaning': 'End of Lease Cleaning',
  'general-cleaning': 'General Cleaning',
  'deep-cleaning': 'Deep Cleaning',
  'move-in-cleaning': 'Move In/Out Cleaning',
  'ndis-cleaning': 'NDIS Cleaning',
  'commercial-cleaning': 'Commercial Cleaning',
  'after-renovation-cleaning': 'After Renovation Cleaning',
  'oven-cleaning': 'Oven Cleaning',
  'tile-and-floor-cleaning': 'Tile And Floor Cleaning',
  'upholstery-cleaning': 'Upholstery Cleaning',
  'window-cleaning': 'Window Cleaning'
} as const;

const formatServiceType = (serviceType: string): string => {
  return SERVICE_TYPE_DISPLAY_NAMES[serviceType as keyof typeof SERVICE_TYPE_DISPLAY_NAMES] || serviceType;
};

const TEMPLATE_IDS = {
  booking_confirmed: process.env.NEXT_PUBLIC_BOOKING_CONFIRMED_ADMIN_ID,
  cancellation: process.env.NEXT_PUBLIC_BOOKING_CANCELLED_ADMIN_ID,
  completed: process.env.NEXT_PUBLIC_BOOKING_COMPLETED_ADMIN_ID,
  feedback_review: process.env.NEXT_PUBLIC_FEEDBACK_REVIEW_TEMPLATE_ID,
};

export default function EmailClientWrapper({ bookingId }: { bookingId: string }) {
  const [selectedType, setSelectedType] = useState<EmailType | ''>('')
  const [showPreview, setShowPreview] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [sendLoading, setSendLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get booking data for preview and sending
  const getBookingData = async () => {
    // First, get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('booking_number, service_type, total_price')
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError
    if (!booking) throw new Error('Booking not found')

    // Then, get the customer details including email
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        first_name,
        last_name,
        email,
        phone,
        address,
        scheduling
      `)
      .eq('booking_id', bookingId)
      .single()

    if (customerError) throw customerError
    if (!customers) throw new Error('Customer not found')

    // Format address
    const formattedAddress = customers.address ? 
      [
        customers.address.unit ? `Unit ${customers.address.unit}` : '',
        customers.address.street,
        customers.address.suburb,
        customers.address.state,
        customers.address.postcode,
        customers.address.instructions ? `Instructions: ${customers.address.instructions}` : ''
      ].filter(Boolean).join(', ') : ''

    return {
      bookingNumber: booking.booking_number,
      serviceType: formatServiceType(booking.service_type),
      totalPrice: booking.total_price,
      customerName: `${customers.first_name} ${customers.last_name}`,
      serviceAddress: formattedAddress,
      scheduledDate: customers.scheduling?.date || '',
      scheduledTime: customers.scheduling?.time || '',
      phone: customers.phone || '',
      to: customers.email,
    }
  }

  // Send email and update booking status if needed
  const handleSend = async () => {
    if (!selectedType) return

    setSendLoading(true)
    try {
      // First check the current booking status
      const { data: booking, error: statusError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single()

      if (statusError) throw new Error('Failed to check booking status')
      if (!booking) throw new Error('Booking not found')

      const data = await getBookingData()
      
      // Validate email before sending
      if (!data.to) {
        throw new Error('Customer email is required')
      }

      // Send the email
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.to,
          templateId: TEMPLATE_IDS[selectedType],
          dynamicTemplateData: {
            bookingNumber: data.bookingNumber,
            serviceType: data.serviceType,
            totalPrice: data.totalPrice,
            customerName: data.customerName,
            serviceAddress: data.serviceAddress,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
            phone: data.phone
          }
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send email')
      }

      // Show email success message
      setNotificationType('success')
      setNotificationMessage('Email sent successfully!')
      setShowNotification(true)

      // Update status based on email type
      const newStatus = selectedType === 'booking_confirmed' 
        ? 'confirmed' 
        : selectedType === 'cancellation'
        ? 'cancelled'
        : 'completed'

      if (booking.status !== newStatus) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId)

        if (updateError) {
          console.error('Failed to update booking status:', updateError)
        } else {
          // Wait for 2 seconds before showing the status update message
          setTimeout(() => {
            setNotificationMessage(`Booking status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`)
            // Reset the timer for this message
            setTimeout(() => setShowNotification(false), 5000)
          }, 2000)
        }
      }

      setShowPreview(false)
      // First message will be hidden after 2 seconds if there's a status update
      // Otherwise, it will be hidden after 5 seconds
      if (booking.status === newStatus) {
        setTimeout(() => setShowNotification(false), 5000)
      }
    } catch (error: Error | unknown) {
      setNotificationType('error')
      setNotificationMessage(error instanceof Error ? error.message : 'Failed to send email')
      setShowNotification(true)
      // Error message stays until user dismisses it
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-end relative">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all flex items-center
            ${selectedType 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          disabled={sendLoading}
        >
          {sendLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="mr-2">{selectedType ? EMAIL_TEMPLATES[selectedType].label : 'Send Email'}</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {showDropdown && !sendLoading && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            {!selectedType ? (
              // Template Selection
              <div className="py-1" role="menu">
                {Object.entries(EMAIL_TEMPLATES).map(([value, { label }]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedType(value as EmailType)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-center"
                    role="menuitem"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              // Action Buttons
              <div className="py-1" role="menu">
                <button
                  onClick={() => {
                    handleSend()
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-center"
                  role="menuitem"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Now
                </button>
                <button
                  onClick={() => {
                    setShowPreview(true)
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors flex items-center"
                  role="menuitem"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    setSelectedType('')
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-colors flex items-center"
                  role="menuitem"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Dialog */}
      {showNotification && (
        <div className="fixed left-1/2 top-4 -translate-x-1/2 z-50 min-w-[400px] max-w-md">
          <div className={`p-4 rounded-lg shadow-lg ${
            notificationType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notificationType === 'success' ? (
                  <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-base font-medium ${
                  notificationType === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notificationMessage}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setShowNotification(false)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notificationType === 'success' 
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' 
                      : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] p-0 relative animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-3">
              <h3 className="text-lg font-medium">Email Preview</h3>
              <button
                className="text-gray-400 hover:text-gray-700 text-lg"
                onClick={() => setShowPreview(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {selectedType && (
                <div className="prose prose-sm max-w-none">
                  <PreviewContent 
                    templateType={selectedType} 
                    bookingId={bookingId} 
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-3 bg-gray-50 rounded-b-xl">
              <button
                className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                onClick={() => setShowPreview(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white shadow disabled:opacity-50"
                onClick={handleSend}
                disabled={sendLoading}
              >
                {sendLoading ? 'Sending...' : 'Send now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewContent({ templateType, bookingId }: { templateType: EmailType, bookingId: string }) {
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadPreview = async () => {
      try {
        // First, get the booking details
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('booking_number, service_type, total_price')
          .eq('id', bookingId)
          .single()

        if (bookingError) throw bookingError
        if (!booking) throw new Error('Booking not found')

        // Then, get the customer details
        const { data: customers, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('booking_id', bookingId)

        if (customerError) throw customerError
        if (!customers || customers.length === 0) throw new Error('Customer not found')

        const customer = customers[0] as Customer

        // Format address
        const formattedAddress = customer.address ? 
          [
            customer.address.unit ? `Unit ${customer.address.unit}` : '',
            customer.address.street,
            customer.address.suburb,
            customer.address.state,
            customer.address.postcode,
            customer.address.instructions ? `Instructions: ${customer.address.instructions}` : ''
          ].filter(Boolean).join(', ') : ''

        const templateData = {
          bookingNumber: booking.booking_number,
          serviceType: formatServiceType(booking.service_type),
          totalPrice: booking.total_price,
          customerName: `${customer.first_name} ${customer.last_name}`,
          serviceAddress: formattedAddress,
          scheduledDate: customer.scheduling?.date || '',
          scheduledTime: customer.scheduling?.time || '',
          phone: customer.phone || '',
        }

        const html = EMAIL_TEMPLATES[templateType].template(templateData)
        setPreviewHtml(html)
      } catch (error: Error | unknown) {
        console.error('Failed to load preview:', error)
      }
    }

    loadPreview()
  }, [templateType, bookingId, supabase])

  return <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
} 