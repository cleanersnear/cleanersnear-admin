'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Phone, Mail, User, Building, Key } from 'lucide-react'
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

export default function EnquiryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const enquiryId = params.id as string
  const [enquiry, setEnquiry] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

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

  const handleDelete = async () => {
    if (!enquiry) return

    if (!confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', enquiryId)

      if (error) throw error

      toast.success('Enquiry deleted successfully')
      router.push('/dashboard/enquiries')
    } catch (error) {
      console.error('Error deleting enquiry:', error)
      toast.error('Failed to delete enquiry')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/enquiries/${enquiryId}/edit`)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'quoted':
        return 'bg-purple-100 text-purple-800'
      case 'converted':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType?.toLowerCase()) {
      case 'general cleaning':
        return 'bg-blue-100 text-blue-800'
      case 'deep cleaning':
        return 'bg-purple-100 text-purple-800'
      case 'end of lease':
        return 'bg-orange-100 text-orange-800'
      case 'carpet cleaning':
        return 'bg-indigo-100 text-indigo-800'
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

  if (!enquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Enquiry not found</h2>
          <p className="mt-2 text-gray-600">The enquiry you&apos;re looking for doesn&apos;t exist.</p>
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
          onClick={() => router.push('/dashboard/enquiries')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Enquiries
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Enquiry from {enquiry.name || 'Unknown'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Submitted on {format(new Date(enquiry.created_at), 'MMMM dd, yyyy')}
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
          {/* Service Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Service Type</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getServiceTypeColor(enquiry.service_type)}`}>
                  {enquiry.service_type || 'Not specified'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Cleaning Type</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.cleaning_type || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Frequency</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.frequency || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Property Type</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.property_type || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Bedrooms</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.bedrooms || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Bathrooms</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.bathrooms || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Rate Type</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.rate_type || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full mt-1 ${getStatusColor(enquiry.status)}`}>
                  {enquiry.status || 'New'}
                </span>
              </div>
            </div>
          </div>

          {/* Property Access */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Property Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Parking Available</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.parking_available || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Access Information</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.access || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Property Address
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Street Address</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.street_address || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Suburb</label>
                  <p className="mt-1 text-sm text-gray-900">{enquiry.suburb || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">State</label>
                  <p className="mt-1 text-sm text-gray-900">{enquiry.state || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Post Code</label>
                  <p className="mt-1 text-sm text-gray-900">{enquiry.post_code || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Scheduling Preferences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Preferred Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {enquiry.preferred_date || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Preferred Time</label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.preferred_time || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {enquiry.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{enquiry.notes}</p>
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
                <p className="mt-1 text-sm font-medium text-gray-900">{enquiry.name || 'Not provided'}</p>
              </div>
              
              {enquiry.company_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    Company
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{enquiry.company_name}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone
                </label>
                <p className="mt-1 text-sm text-gray-900">{enquiry.phone || 'Not provided'}</p>
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
                Edit Enquiry
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Enquiry'}
              </button>
            </div>
          </div>

          {/* Technical Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">IP Address</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{enquiry.ip_address || 'Not available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">User Agent</label>
                <p className="mt-1 text-sm text-gray-900 text-xs break-all">{enquiry.user_agent || 'Not available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {enquiry.updated_at ? format(new Date(enquiry.updated_at), 'MMM dd, yyyy HH:mm') : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
