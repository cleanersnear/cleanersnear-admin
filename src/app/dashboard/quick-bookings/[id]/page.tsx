'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Phone, Mail, User, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

// Types based on quick_bookings schema
interface QuickBooking {
  id: string
  customer_id: string
  booking_type: string
  frequency: string
  booking_category: string
  service_type: string
  min_hours: number
  min_amount: number
  base_rate: number
  extra_hours: number
  total_hours: number
  total_price: number
  address_street: string
  address_suburb: string
  address_state: string
  address_postcode: string
  address_additional_info?: string
  preferred_date?: string
  time_preference?: string
  created_at: string
  booking_number: string
}

interface QuickCustomer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  street: string
  suburb: string
  state: string
  postcode: string
  additional_info?: string
  created_at: string
  booking_id: string
}

interface QuickBookingWithCustomer extends QuickBooking {
  customer?: QuickCustomer
}

export default function QuickBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<QuickBookingWithCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true)
        const [bookingResponse, customerResponse] = await Promise.all([
          supabase
            .from('quick_bookings')
            .select('*')
            .eq('id', bookingId)
            .single(),
          supabase
            .from('quick_customers')
            .select('*')
            .eq('booking_id', bookingId)
            .single()
        ])

        if (bookingResponse.error) throw bookingResponse.error

        setBooking({
          ...bookingResponse.data,
          customer: customerResponse.data || undefined
        })
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast.error('Failed to load booking details')
        router.push('/dashboard/quick-bookings')
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId, supabase, router])

  const handleDelete = async () => {
    if (!booking) return

    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      // Delete customer first (if exists)
      if (booking.customer) {
        const { error: customerError } = await supabase
          .from('quick_customers')
          .delete()
          .eq('id', booking.customer.id)
        
        if (customerError) throw customerError
      }

      // Delete booking
      const { error: bookingError } = await supabase
        .from('quick_bookings')
        .delete()
        .eq('id', bookingId)

      if (bookingError) throw bookingError

      toast.success('Booking deleted successfully')
      router.push('/dashboard/quick-bookings')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Failed to delete booking')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/quick-bookings/${bookingId}/edit`)
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'general_cleaning':
        return 'bg-blue-100 text-blue-800'
      case 'deep_cleaning':
        return 'bg-purple-100 text-purple-800'
      case 'end_of_lease':
        return 'bg-orange-100 text-orange-800'
      case 'carpet_cleaning':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBookingTypeColor = (bookingType: string) => {
    switch (bookingType) {
      case 'residential':
        return 'bg-green-100 text-green-800'
      case 'commercial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Booking not found</h2>
          <p className="mt-2 text-gray-600">The booking you&apos;re 
            looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard/quick-bookings')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Quick Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/quick-bookings')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quick Bookings
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Booking {booking.booking_number}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Created on {format(new Date(booking.created_at), 'MMMM dd, yyyy')}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Booking Type</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getBookingTypeColor(booking.booking_type)}`}>
                  {booking.booking_type}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Frequency</label>
                <p className="mt-1 text-sm text-gray-900">{booking.frequency}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Service Type</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getServiceTypeColor(booking.service_type)}`}>
                  {booking.service_type.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Booking Category</label>
                <p className="mt-1 text-sm text-gray-900">{booking.booking_category}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Minimum Hours</label>
                <p className="mt-1 text-sm text-gray-900">{booking.min_hours} hours</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Extra Hours</label>
                <p className="mt-1 text-sm text-gray-900">{booking.extra_hours} hours</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Hours</label>
                <p className="mt-1 text-sm text-gray-900">{booking.total_hours} hours</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Base Rate</label>
                <p className="mt-1 text-sm text-gray-900">${booking.base_rate}/hour</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Minimum Amount</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">${booking.min_amount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Price</label>
                <p className="mt-1 text-2xl font-bold text-indigo-600">${booking.total_price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Rate per Hour</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">${booking.base_rate}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Service Address
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Street Address</label>
                <p className="mt-1 text-sm text-gray-900">{booking.address_street}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Suburb</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.address_suburb}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">State</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.address_state}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Postcode</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.address_postcode}</p>
                </div>
              </div>
              {booking.address_additional_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Additional Information</label>
                  <p className="mt-1 text-sm text-gray-900">{booking.address_additional_info}</p>
                </div>
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Scheduling
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Preferred Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {booking.preferred_date ? format(new Date(booking.preferred_date), 'MMMM dd, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Time Preference</label>
                <p className="mt-1 text-sm text-gray-900">{booking.time_preference || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          {booking.customer && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {booking.customer.first_name} {booking.customer.last_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{booking.customer.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{booking.customer.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {booking.customer.street}<br />
                    {booking.customer.suburb}, {booking.customer.state} {booking.customer.postcode}
                  </p>
                </div>
                
                {booking.customer.additional_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Additional Info</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.customer.additional_info}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleEdit}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Booking
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
