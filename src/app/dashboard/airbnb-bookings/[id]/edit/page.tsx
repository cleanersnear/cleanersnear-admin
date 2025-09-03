'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
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

interface ExtraService {
  name: string
  price: number
}

export default function EditAirbnbBookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<AirbnbCleaningBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()

  // Form state
  const [formData, setFormData] = useState({
    propertyAddress: '',
    serviceType: '',
    hours: 0,
    name: '',
    email: '',
    phone: '',
    bedrooms: '',
    bathrooms: '',
    toilets: '',
    date: '',
    time: '',
    basePrice: 0,
    discount: 0,
    status: '',
    extras: [] as ExtraService[]
  })

  // New extra service form
  const [newExtra, setNewExtra] = useState({ name: '', price: 0 })

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

        // Set form data
        setFormData({
          propertyAddress: data.propertyAddress || '',
          serviceType: data.serviceType || '',
          hours: data.hours || 0,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          toilets: data.toilets || '',
          date: data.date ? data.date.split('T')[0] : '',
          time: data.time || '',
          basePrice: data.basePrice || 0,
          discount: data.discount || 0,
          status: data.status || '',
          extras: data.extras || []
        })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const calculateFinalPrice = () => {
    const basePrice = formData.basePrice || 0
    const discount = formData.discount || 0
    const extrasTotal = formData.extras.reduce((sum, extra) => sum + (extra.price || 0), 0)
    return basePrice + extrasTotal - discount
  }

  const addExtra = () => {
    if (newExtra.name && newExtra.price > 0) {
      setFormData(prev => ({
        ...prev,
        extras: [...prev.extras, { name: newExtra.name, price: newExtra.price }]
      }))
      setNewExtra({ name: '', price: 0 })
    }
  }

  const removeExtra = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!booking) return

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('AirbnbCleaningBooking')
        .update({
          propertyAddress: formData.propertyAddress,
          serviceType: formData.serviceType,
          hours: formData.hours,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          toilets: formData.toilets,
          date: formData.date || null,
          time: formData.time,
          basePrice: formData.basePrice,
          discount: formData.discount,
          finalPrice: calculateFinalPrice(),
          extras: formData.extras,
          status: formData.status
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking updated successfully')
      router.push(`/dashboard/airbnb-bookings/${bookingId}`)
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
          <p className="mt-2 text-gray-600">The booking you&apos;re 
            looking for doesn&apos;t exist.</p>
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
          onClick={() => router.push(`/dashboard/airbnb-bookings/${bookingId}`)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Booking Details
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Booking {booking.bookingNumber}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update Airbnb cleaning booking information
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/airbnb-bookings/${bookingId}`)}
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
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select service type</option>
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select status</option>
                  <option value="PENDING_EXTRAS">Pending Extras</option>
                  <option value="CONFIRMED">Confirmed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hours Required</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleNumberChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Base Price</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleNumberChange}
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleNumberChange}
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Final Price</label>
                                 <input
                   type="number"
                   value={calculateFinalPrice().toString()}
                   readOnly
                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                 />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Address</label>
                <input
                  type="text"
                  name="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                  <input
                    type="text"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <input
                    type="text"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toilets</label>
                  <input
                    type="text"
                    name="toilets"
                    value={formData.toilets}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Services</h2>
            <div className="space-y-4">
              {formData.extras.map((extra, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{extra.name}</span>
                  </div>
                  <div className="text-sm text-gray-900">${extra.price}</div>
                  <button
                    onClick={() => removeExtra(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Name</label>
                    <input
                      type="text"
                      value={newExtra.name}
                      onChange={(e) => setNewExtra(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., Deep cleaning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                                         <input
                       type="number"
                       value={newExtra.price.toString()}
                       onChange={(e) => {
                         const numValue = parseFloat(e.target.value)
                         setNewExtra(prev => ({ ...prev, price: isNaN(numValue) ? 0 : numValue }))
                       }}
                       step="0.01"
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                       placeholder="0.00"
                     />
                  </div>
                </div>
                <button
                  onClick={addExtra}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
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
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                <select
                  name="time"
                  value={formData.time}
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

          {/* Pricing Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h2>
            <div className="space-y-3">
                             <div className="flex justify-between">
                 <span className="text-sm text-gray-500">Base Price:</span>
                 <span className="text-sm font-medium text-gray-900">${(formData.basePrice || 0).toFixed(2)}</span>
               </div>
              {formData.extras.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Additional Services:</span>
                                   <span className="text-sm font-medium text-gray-900">
                   ${formData.extras.reduce((sum, extra) => sum + (extra.price || 0), 0).toFixed(2)}
                 </span>
                </div>
              )}
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Discount:</span>
                  <span className="text-sm font-medium text-green-600">-${(formData.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Final Price:</span>
                  <span className="text-base font-bold text-indigo-600">${calculateFinalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
