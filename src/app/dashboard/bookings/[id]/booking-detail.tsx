'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ServiceDetails from '@/app/dashboard/bookings/[id]/service-details'

type Customer = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: any
}

type Booking = {
  id: number
  booking_number: string
  customer_id: number
  service_type: string
  date: string
  time: string
  is_flexible_date: boolean
  is_flexible_time: boolean
  status: string
  total_price: number
  created_at: string
  updated_at: string
  customer: Customer
}

type ServiceType = 
  | 'carpet-cleaning'
  | 'end-of-lease-cleaning'
  | 'general-cleaning'  
  | 'deep-cleaning'
  | 'move-in-cleaning'
  | 'ndis-cleaning'
  | 'commercial-cleaning'
  | 'after-renovation-cleaning'
  | 'oven-cleaning'
  | 'tile-and-floor-cleaning'
  | 'upholstery-cleaning'
  | 'window-cleaning'

type BookingDetails = {
  booking: any
  customer: any
  serviceDetails: any
}

export default function BookingDetail({ id }: { id: string }) {
  const router = useRouter()
  const [details, setDetails] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const getServiceTable = (serviceType: ServiceType) => {
    const tableMap: Record<ServiceType, string> = {
      'carpet-cleaning': 'carpet_cleaning_services',
      'end-of-lease-cleaning': 'end_of_lease_services',
      'general-cleaning': 'general_cleaning_services',
      'deep-cleaning': 'deep_cleaning_services',
      'move-in-cleaning': 'move_in_out_services',
      'ndis-cleaning': 'ndis_cleaning_services',
      'commercial-cleaning': 'commercial_cleaning_services',
      'after-renovation-cleaning': 'renovation_cleaning_services',
      'oven-cleaning': 'oven_cleaning_enquiries',
      'tile-and-floor-cleaning': 'floor_cleaning_enquiries',
      'upholstery-cleaning': 'upholstery_cleaning_services',
      'window-cleaning': 'window_cleaning_enquiries'
    }
    return tableMap[serviceType]
  }

  const fetchBookingDetails = async () => {
    try {
      // 1. Fetch booking data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (bookingError) throw bookingError

      // 2. Fetch customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('booking_id', id)
        .single()

      if (customerError) throw customerError

      // 3. Fetch service-specific details
      const serviceTable = getServiceTable(booking.service_type as ServiceType)
      const { data: serviceDetails, error: serviceError } = await supabase
        .from(serviceTable)
        .select('*')
        .eq('booking_id', id)
        .single()

      if (serviceError) throw serviceError

      setDetails({
        booking,
        customer,
        serviceDetails
      })
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateBookingStatus = async (newStatus: string) => {
    if (!details) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', details.booking.id)

      if (error) throw error

      setDetails(prev => prev ? { ...prev, booking: { ...prev.booking, status: newStatus } } : null)
      toast.success('Booking status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update booking status')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return format(date, 'MMMM d, yyyy')
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Invalid Date'
    }
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A'
    return timeString
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!details) {
    return <div>Booking not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-sm text-gray-600">#{details.booking.booking_number}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(details.booking.status)}`}>
          {details.booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Booking Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{details.booking.service_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(details.booking.date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatTime(details.booking.time)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${details.booking.total_price}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flexible Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {details.booking.is_flexible_date ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flexible Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {details.booking.is_flexible_time ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Service Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Service Details</h2>
            {details && (
              <ServiceDetails 
                bookingId={details.booking.id}
                serviceType={details.booking.service_type}
              />
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Actions Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => updateBookingStatus('confirmed')}
                disabled={details.booking.status === 'confirmed' || isUpdating}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => updateBookingStatus('completed')}
                disabled={details.booking.status === 'completed' || isUpdating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => updateBookingStatus('cancelled')}
                disabled={details.booking.status === 'cancelled' || isUpdating}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Booking
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Customer Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {`${details.customer.first_name} ${details.customer.last_name}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{details.customer.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{details.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {details.customer.address?.street}, {details.customer.address?.city}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
} 