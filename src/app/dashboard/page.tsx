'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, isToday, isYesterday, isTomorrow, parseISO } from 'date-fns'
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

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [adminDetails, setAdminDetails] = useState<AdminDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    try {
      const [customersResponse, bookingsResponse, adminResponse] = await Promise.all([
        supabase
          .from('customers')
          .select('id, scheduling')
          .order('scheduling->date', { ascending: false }),
        supabase
          .from('bookings')
          .select('*')
          .order('scheduling->date', { ascending: false }),
        supabase
          .from('booking_admin_details')
          .select('booking_id, payment_status, payments')
      ])

      if (customersResponse.error) throw customersResponse.error
      if (bookingsResponse.error) throw bookingsResponse.error
      if (adminResponse.error) throw adminResponse.error

      setCustomers(customersResponse.data || [])
      setBookings(bookingsResponse.data || [])
      setAdminDetails(adminResponse.data || [])

    } catch (error) {
      console.error('Error fetching data:', error)
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
    if (adminDetail?.payment_status === 'unpaid' || adminDetail?.payment_status === 'partially_paid') {
      return count + 1
    }
    return count
  }, 0)

  const unfulfilledBookings = bookings.filter(booking => 
    !['completed', 'cancelled', 'refunded'].includes(booking.status)
  ).length

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