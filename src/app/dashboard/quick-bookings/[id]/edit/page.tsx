'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
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

export default function EditQuickBookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<QuickBookingWithCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()

  // Form state
  const [formData, setFormData] = useState({
    booking_type: '',
    frequency: '',
    booking_category: '',
    service_type: '',
    min_hours: 0,
    min_amount: 0,
    base_rate: 0,
    extra_hours: 0,
    total_hours: 0,
    total_price: 0,
    address_street: '',
    address_suburb: '',
    address_state: '',
    address_postcode: '',
    address_additional_info: '',
    preferred_date: '',
    time_preference: '',
    // Customer fields
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
    additional_info: ''
  })

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

        const bookingData = bookingResponse.data
        const customerData = customerResponse.data

        setBooking({
          ...bookingData,
          customer: customerData || undefined
        })

        // Set form data
        setFormData({
          booking_type: bookingData.booking_type || '',
          frequency: bookingData.frequency || '',
          booking_category: bookingData.booking_category || '',
          service_type: bookingData.service_type || '',
          min_hours: bookingData.min_hours || 0,
          min_amount: bookingData.min_amount || 0,
          base_rate: bookingData.base_rate || 0,
          extra_hours: bookingData.extra_hours || 0,
          total_hours: bookingData.total_hours || 0,
          total_price: bookingData.total_price || 0,
          address_street: bookingData.address_street || '',
          address_suburb: bookingData.address_suburb || '',
          address_state: bookingData.address_state || '',
          address_postcode: bookingData.address_postcode || '',
          address_additional_info: bookingData.address_additional_info || '',
          preferred_date: bookingData.preferred_date ? bookingData.preferred_date.split('T')[0] : '',
          time_preference: bookingData.time_preference || '',
          // Customer fields
          first_name: customerData?.first_name || '',
          last_name: customerData?.last_name || '',
          email: customerData?.email || '',
          phone: customerData?.phone || '',
          street: customerData?.street || '',
          suburb: customerData?.suburb || '',
          state: customerData?.state || '',
          postcode: customerData?.postcode || '',
          additional_info: customerData?.additional_info || ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = parseFloat(value)
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue
    }))
  }

  const calculateTotalHours = () => {
    const minHours = formData.min_hours || 0
    const extraHours = formData.extra_hours || 0
    return minHours + extraHours
  }

  const calculateTotalPrice = () => {
    const baseRate = formData.base_rate || 0
    return baseRate * calculateTotalHours()
  }

  const handleSave = async () => {
    if (!booking) return

    try {
      setIsSaving(true)

      // Update booking
      const { error: bookingError } = await supabase
        .from('quick_bookings')
        .update({
          booking_type: formData.booking_type,
          frequency: formData.frequency,
          booking_category: formData.booking_category,
          service_type: formData.service_type,
          min_hours: formData.min_hours,
          min_amount: formData.min_amount,
          base_rate: formData.base_rate,
          extra_hours: formData.extra_hours,
          total_hours: calculateTotalHours(),
          total_price: calculateTotalPrice(),
          address_street: formData.address_street,
          address_suburb: formData.address_suburb,
          address_state: formData.address_state,
          address_postcode: formData.address_postcode,
          address_additional_info: formData.address_additional_info,
          preferred_date: formData.preferred_date || null,
          time_preference: formData.time_preference
        })
        .eq('id', bookingId)

      if (bookingError) throw bookingError

      // Update or create customer
      if (booking.customer) {
        const { error: customerError } = await supabase
          .from('quick_customers')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            suburb: formData.suburb,
            state: formData.state,
            postcode: formData.postcode,
            additional_info: formData.additional_info
          })
          .eq('id', booking.customer.id)

        if (customerError) throw customerError
      } else {
        // Create new customer
        const { error: customerError } = await supabase
          .from('quick_customers')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            suburb: formData.suburb,
            state: formData.state,
            postcode: formData.postcode,
            additional_info: formData.additional_info,
            booking_id: bookingId
          })

        if (customerError) throw customerError
      }

      toast.success('Booking updated successfully')
      router.push(`/dashboard/quick-bookings/${bookingId}`)
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    } finally {
      setIsSaving(false)
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
          <p className="mt-2 text-gray-600">The booking you&apos;re looking 
            for doesn&apos;t exist.</p>
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
          onClick={() => router.push(`/dashboard/quick-bookings/${bookingId}`)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Booking Details
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Booking {booking.booking_number}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update booking and customer information
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/quick-bookings/${bookingId}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Details */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Booking Type</label>
                <select
                  name="booking_type"
                  value={formData.booking_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select booking type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select frequency</option>
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select service type</option>
                  <option value="general_cleaning">General Cleaning</option>
                  <option value="deep_cleaning">Deep Cleaning</option>
                  <option value="end_of_lease">End of Lease</option>
                  <option value="carpet_cleaning">Carpet Cleaning</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Hours</label>
                  <input
                    type="number"
                    name="min_hours"
                    value={formData.min_hours}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Extra Hours</label>
                  <input
                    type="number"
                    name="extra_hours"
                    value={formData.extra_hours}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Base Rate ($/hour)</label>
                <input
                  type="number"
                  name="base_rate"
                  value={formData.base_rate}
                  onChange={handleNumberChange}
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Hours</label>
                                     <input
                     type="number"
                     value={calculateTotalHours().toString()}
                     readOnly
                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Total Price</label>
                   <input
                     type="number"
                     value={calculateTotalPrice().toString()}
                     readOnly
                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Suburb</label>
                  <input
                    type="text"
                    name="address_suburb"
                    value={formData.address_suburb}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="address_state"
                    value={formData.address_state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Postcode</label>
                <input
                  type="text"
                  name="address_postcode"
                  value={formData.address_postcode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                <textarea
                  name="address_additional_info"
                  value={formData.address_additional_info}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Suburb</label>
                  <input
                    type="text"
                    name="suburb"
                    value={formData.suburb}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                <input
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time Preference</label>
                <select
                  name="time_preference"
                  value={formData.time_preference}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select time preference</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="evening">Evening (4 PM - 8 PM)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
