'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

// Types based on quotes schema
interface Quote {
  id: string
  created_at: string
  updated_at: string
  service_type: string
  cleaning_type: string
  frequency: string
  property_type: string
  bedrooms: string
  bathrooms: string
  rate_type: string
  preferred_date: string
  preferred_time: string
  parking_available: string
  access: string
  name: string
  company_name: string
  email: string
  phone: string
  street_address: string
  suburb: string
  state: string
  post_code: string
  notes: string
  status: string
  ip_address: string
  user_agent: string
}

export default function EditEnquiryPage() {
  const router = useRouter()
  const params = useParams()
  const enquiryId = params.id as string
  const [enquiry, setEnquiry] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()

  // Form state
  const [formData, setFormData] = useState({
    service_type: '',
    cleaning_type: '',
    frequency: '',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    rate_type: '',
    preferred_date: '',
    preferred_time: '',
    parking_available: '',
    access: '',
    name: '',
    company_name: '',
    email: '',
    phone: '',
    street_address: '',
    suburb: '',
    state: '',
    post_code: '',
    notes: '',
    status: ''
  })

  useEffect(() => {
    const fetchEnquiry = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', enquiryId)
          .single()

        if (error) throw error

        setEnquiry(data)

        // Set form data
        setFormData({
          service_type: data.service_type || '',
          cleaning_type: data.cleaning_type || '',
          frequency: data.frequency || '',
          property_type: data.property_type || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          rate_type: data.rate_type || '',
          preferred_date: data.preferred_date || '',
          preferred_time: data.preferred_time || '',
          parking_available: data.parking_available || '',
          access: data.access || '',
          name: data.name || '',
          company_name: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          street_address: data.street_address || '',
          suburb: data.suburb || '',
          state: data.state || '',
          post_code: data.post_code || '',
          notes: data.notes || '',
          status: data.status || ''
        })
      } catch (error) {
        console.error('Error fetching enquiry:', error)
        toast.error('Failed to load enquiry details')
        router.push('/dashboard/enquiries')
      } finally {
        setIsLoading(false)
      }
    }

    if (enquiryId) {
      fetchEnquiry()
    }
  }, [enquiryId, supabase, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!enquiry) return

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('quotes')
        .update({
          service_type: formData.service_type,
          cleaning_type: formData.cleaning_type,
          frequency: formData.frequency,
          property_type: formData.property_type,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          rate_type: formData.rate_type,
          preferred_date: formData.preferred_date,
          preferred_time: formData.preferred_time,
          parking_available: formData.parking_available,
          access: formData.access,
          name: formData.name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          street_address: formData.street_address,
          suburb: formData.suburb,
          state: formData.state,
          post_code: formData.post_code,
          notes: formData.notes,
          status: formData.status
        })
        .eq('id', enquiryId)

      if (error) throw error

      toast.success('Enquiry updated successfully')
      router.push(`/dashboard/enquiries/${enquiryId}`)
    } catch (error) {
      console.error('Error updating enquiry:', error)
      toast.error('Failed to update enquiry')
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

  if (!enquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Enquiry not found</h2>
          <p className="mt-2 text-gray-600">The enquiry you&apos;re 
            looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard/enquiries')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Enquiries
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
          onClick={() => router.push(`/dashboard/enquiries/${enquiryId}`)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Enquiry Details
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Enquiry from {enquiry.name || 'Unknown'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update enquiry information
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/enquiries/${enquiryId}`)}
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
        {/* Service Details */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select service type</option>
                  <option value="general cleaning">General Cleaning</option>
                  <option value="deep cleaning">Deep Cleaning</option>
                  <option value="end of lease">End of Lease</option>
                  <option value="carpet cleaning">Carpet Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cleaning Type</label>
                <input
                  type="text"
                  name="cleaning_type"
                  value={formData.cleaning_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
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
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <input
                  type="text"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rate Type</label>
                <input
                  type="text"
                  name="rate_type"
                  value={formData.rate_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
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
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Access */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Access</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Parking Available</label>
                <input
                  type="text"
                  name="parking_available"
                  value={formData.parking_available}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Access Information</label>
                <textarea
                  name="access"
                  value={formData.access}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
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
                <label className="block text-sm font-medium text-gray-700">Post Code</label>
                <input
                  type="text"
                  name="post_code"
                  value={formData.post_code}
                  onChange={handleInputChange}
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
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
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
                  type="text"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                <select
                  name="preferred_time"
                  value={formData.preferred_time}
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

          {/* Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={6}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Add any additional notes about this enquiry..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
