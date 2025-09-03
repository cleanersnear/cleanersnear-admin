'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, isToday, isYesterday, isTomorrow, parseISO, subDays } from 'date-fns'
import NotificationComponent from './notification/notification'

interface Booking {
  id: string
  status: string
  scheduling: {
    date: string
    is_flexible_date: boolean
  }
}

interface Customer {
  id: string
  scheduling: {
    date: string
    is_flexible_date: boolean
  }
}

interface Payment {
  amount: number
  payment_method: string
  payment_date: string
  added_by: string
  notes?: string
}

interface AdminDetail {
  booking_id: string
  payment_status: string
  payments: Payment[]
}

interface BookingCounts {
  yesterday: number
  today: number
  tomorrow: number
}

interface QuickBooking {
  id: string
  created_at: string
}

interface AirbnbCleaningBooking {
  id: number
  createdAt: string
}

interface Quote {
  id: string
  created_at: string
  status: string
}

interface ContactMessage {
  id: string
  created_at: string
  status: string
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [adminDetails, setAdminDetails] = useState<AdminDetail[]>([])
  const [quickBookings, setQuickBookings] = useState<QuickBooking[]>([])
  const [airbnbBookings, setAirbnbBookings] = useState<AirbnbCleaningBooking[]>([])
  const [enquiries, setEnquiries] = useState<Quote[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    try {
      const [
        customersResponse, 
        bookingsResponse, 
        adminResponse,
        quickBookingsResponse,
        airbnbBookingsResponse,
        enquiriesResponse,
        contactMessagesResponse
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('id, scheduling')
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('booking_admin_details')
          .select('booking_id, payment_status, payments'),
        supabase
          .from('quick_bookings')
          .select('id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('AirbnbCleaningBooking')
          .select('id, createdAt')
          .order('createdAt', { ascending: false }),
        supabase
          .from('quotes')
          .select('id, created_at, status')
          .order('created_at', { ascending: false }),
        supabase
          .from('contact_messages')
          .select('id, created_at, status')
          .order('created_at', { ascending: false })
      ])

      if (customersResponse.error) {
        console.error('Error fetching customers:', customersResponse.error)
        throw new Error(`Failed to fetch customers: ${customersResponse.error.message}`)
      }
      if (bookingsResponse.error) {
        console.error('Error fetching bookings:', bookingsResponse.error)
        throw new Error(`Failed to fetch bookings: ${bookingsResponse.error.message}`)
      }
      if (adminResponse.error) {
        console.error('Error fetching admin details:', adminResponse.error)
        throw new Error(`Failed to fetch admin details: ${adminResponse.error.message}`)
      }
      if (quickBookingsResponse.error) {
        console.error('Error fetching quick bookings:', quickBookingsResponse.error)
        throw new Error(`Failed to fetch quick bookings: ${quickBookingsResponse.error.message}`)
      }
      if (airbnbBookingsResponse.error) {
        console.error('Error fetching airbnb bookings:', airbnbBookingsResponse.error)
        throw new Error(`Failed to fetch airbnb bookings: ${airbnbBookingsResponse.error.message}`)
      }
      if (enquiriesResponse.error) {
        console.error('Error fetching enquiries:', enquiriesResponse.error)
        throw new Error(`Failed to fetch enquiries: ${enquiriesResponse.error.message}`)
      }
      if (contactMessagesResponse.error) {
        console.error('Error fetching contact messages:', contactMessagesResponse.error)
        throw new Error(`Failed to fetch contact messages: ${contactMessagesResponse.error.message}`)
      }

      setCustomers(customersResponse.data || [])
      setBookings(bookingsResponse.data || [])
      setAdminDetails(adminResponse.data || [])
      setQuickBookings(quickBookingsResponse.data || [])
      setAirbnbBookings(airbnbBookingsResponse.data || [])
      setEnquiries(enquiriesResponse.data || [])
      setContactMessages(contactMessagesResponse.data || [])

    } catch (error) {
      console.error('Error fetching data:', error instanceof Error ? error.message : 'Unknown error occurred')
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [fetchData])

  const getBookingsByDate = (): BookingCounts => {
    return customers.reduce((acc, customer) => {
      const schedulingData = customer.scheduling
      if (schedulingData?.date && !schedulingData.is_flexible_date) {
        const scheduledDate = parseISO(schedulingData.date)
        if (isYesterday(scheduledDate)) acc.yesterday++
        if (isToday(scheduledDate)) acc.today++
        if (isTomorrow(scheduledDate)) acc.tomorrow++
      }
      return acc
    }, { yesterday: 0, today: 0, tomorrow: 0 })
  }

  const bookingCounts = getBookingsByDate()

  const unpaidBookings = bookings.reduce((count, booking) => {
    const adminDetail = adminDetails.find(ad => ad.booking_id === booking.id)
    if ((adminDetail?.payment_status === 'unpaid' || adminDetail?.payment_status === 'partially_paid') && 
        booking.status !== 'cancelled') {
      return count + 1
    }
    return count
  }, 0)

  const unfulfilledBookings = bookings.filter(booking => 
    !['completed', 'cancelled', 'refunded'].includes(booking.status)
  ).length

  // New statistics for the past 7 days
  const getRecentCount = (items: (QuickBooking | AirbnbCleaningBooking)[], days: number = 7) => {
    const cutoffDate = subDays(new Date(), days)
    return items.filter(item => {
      const dateField = 'created_at' in item ? item.created_at : item.createdAt
      return new Date(dateField) >= cutoffDate
    }).length
  }

  const getNewCount = (items: (Quote | ContactMessage)[]) => {
    return items.filter(item => item.status === 'new' || !item.status).length
  }

  const recentQuickBookings = getRecentCount(quickBookings)
  const recentAirbnbBookings = getRecentCount(airbnbBookings)
  const newEnquiries = getNewCount(enquiries)
  const newContactMessages = getNewCount(contactMessages)

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Current Date/Time and Notifications Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="hidden lg:block">
              <NotificationComponent />
            </div>
          </div>
          <div className="text-right">
            <div className="text-base sm:text-lg font-medium text-gray-900">
              {format(currentDateTime, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="text-sm text-gray-500">
              {format(currentDateTime, 'h:mm a')}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Numbers Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Yesterday</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{bookingCounts.yesterday}</span>
            <span className="ml-2 text-sm text-gray-500">bookings</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Today</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">{bookingCounts.today}</span>
            <span className="ml-2 text-sm text-gray-500">bookings</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Tomorrow</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{bookingCounts.tomorrow}</span>
            <span className="ml-2 text-sm text-gray-500">bookings</span>
          </div>
        </div>
      </div>

      {/* New Bookings Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Quick Bookings</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-green-600">{recentQuickBookings}</span>
            <span className="ml-2 text-sm text-gray-500">past 7 days</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Airbnb Bookings</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-purple-600">{recentAirbnbBookings}</span>
            <span className="ml-2 text-sm text-gray-500">past 7 days</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">New Enquiries</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-orange-600">{newEnquiries}</span>
            <span className="ml-2 text-sm text-gray-500">unread</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">New Messages</h3>
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600">{newContactMessages}</span>
            <span className="ml-2 text-sm text-gray-500">unread</span>
          </div>
        </div>
      </div>

      {/* Actions Needed Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Actions Needed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Unfulfilled Bookings</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-xl sm:text-2xl font-bold text-orange-600">{unfulfilledBookings}</span>
                <span className="ml-2 text-sm text-gray-500">need attention</span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Unpaid/Partial Payments</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-xl sm:text-2xl font-bold text-red-600">{unpaidBookings}</span>
                <span className="ml-2 text-sm text-gray-500">need collection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 