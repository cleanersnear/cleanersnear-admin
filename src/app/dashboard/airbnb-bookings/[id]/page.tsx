'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Calendar, Phone, Mail, User, Clock, DollarSign, Home, Bed, Bath, Toilet } from 'lucide-react'
import toast from 'react-hot-toast'

// Types based on AirbnbCleaningBooking schema
interface ExtraService {
  name: string
  price: number
}

interface AirbnbCleaningBooking {
  id: number
  bookingNumber: string
  propertyAddress: string
  serviceType: string
  hours: number
  name: string
  email: string
  phone: string
  bedrooms: string
  bathrooms: string
  toilets: string
  date?: string
  time?: string
  basePrice: number
  discount: number
  finalPrice: number
  extras: ExtraService[]
  status: string
  createdAt: string
  completedAt?: string
}

export default function AirbnbBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<AirbnbCleaningBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('AirbnbCleaningBooking')
          .select('*')
          .eq('id', bookingId)
          .single()

        if (error) throw error

        setBooking(data)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast.error('Failed to load booking details')
        router.push('/dashboard/airbnb-bookings')
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
      
      const { error } = await supabase
        .from('AirbnbCleaningBooking')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking deleted successfully')
      router.push('/dashboard/airbnb-bookings')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Failed to delete booking')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/airbnb-bookings/${bookingId}/edit`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING_EXTRAS':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'one-time':
        return 'bg-blue-100 text-blue-800'
      case 'weekly':
        return 'bg-purple-100 text-purple-800'
      case 'fortnightly':
        return 'bg-orange-100 text-orange-800'
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
          <p className="mt-2 text-gray-600">The booking you&apos;re looking for 
            doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard/airbnb-bookings')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Airbnb Bookings
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
          onClick={() => router.push('/dashboard/airbnb-bookings')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Airbnb Bookings
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Booking {booking.bookingNumber}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Created on {format(new Date(booking.createdAt), 'MMMM dd, yyyy')}
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
                <label className="block text-sm font-medium text-gray-500">Service Type</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getServiceTypeColor(booking.serviceType)}`}>
                  {booking.serviceType}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Hours Required</label>
                <p className="mt-1 text-sm text-gray-900">{booking.hours} hours</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Base Price</label>
                <p className="mt-1 text-sm text-gray-900">${booking.basePrice}</p>
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
                <label className="block text-sm font-medium text-gray-500">Base Price</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">${booking.basePrice}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Discount</label>
                <p className="mt-1 text-lg font-semibold text-green-600">-${booking.discount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Final Price</label>
                <p className="mt-1 text-2xl font-bold text-indigo-600">${booking.finalPrice}</p>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Property Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Property Address</label>
                <p className="mt-1 text-sm text-gray-900">{booking.propertyAddress}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Bed className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{booking.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{booking.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center">
                  <Toilet className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{booking.toilets} Toilets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extras */}
          {booking.extras && booking.extras.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Services</h2>
              <div className="space-y-2">
                {booking.extras.map((extra: ExtraService, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm text-gray-900">{extra.name}</span>
                    <span className="text-sm font-medium text-gray-900">${extra.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  {booking.date ? format(new Date(booking.date), 'MMMM dd, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Preferred Time</label>
                <p className="mt-1 text-sm text-gray-900">{booking.time || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Completion */}
          {booking.completedAt && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Booking Submission Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                    Bookeing completed on: </label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(booking.completedAt), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{booking.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{booking.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone
                </label>
                <p className="mt-1 text-sm text-gray-900">{booking.phone}</p>
              </div>
            </div>
          </div>

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

          {/* Booking Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Booking Number:</span>
                <span className="text-sm font-medium text-gray-900">{booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Service Type:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(booking.serviceType)}`}>
                  {booking.serviceType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Hours:</span>
                <span className="text-sm font-medium text-gray-900">{booking.hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Price:</span>
                <span className="text-sm font-bold text-indigo-600">${booking.finalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
