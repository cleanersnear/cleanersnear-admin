"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { PencilIcon, TrashIcon, ArrowLeftIcon, EllipsisVerticalIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import BookingSection from './BookingSection'

interface Customer {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
  booking_number?: string
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
  related_customers?: Customer[]
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!id) return
    const fetchCustomer = async () => {
      setIsLoading(true)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*, bookings(booking_number)')
        .eq('id', id)
        .single()
      if (!customerError && customerData) {
        const { data: relatedData } = await supabase
          .from('customers')
          .select('*, bookings(booking_number)')
          .eq('email', customerData.email)
          .neq('id', id)
        setCustomer({
          ...customerData,
          booking_number: customerData.bookings?.booking_number,
          related_customers: relatedData || []
        })
      }
      setIsLoading(false)
    }
    fetchCustomer()
  }, [id, supabase])

  // Close More Actions dropdown on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (showActions && actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showActions])

  const handleDelete = async () => {
    if (!customer) return
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (!error) {
      router.push('/dashboard/customers')
    }
  }

  const isMobile = () =>
    typeof window !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  const handleSendEmail = () => {
    if (customer?.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
      if (isMobile()) {
        window.location.href = `mailto:${customer.email}`;
      } else {
        window.open(
          `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}`,
          '_blank'
        );
      }
    } else {
      alert('No valid email address found for this customer.');
    }
  }

  const formatPhoneForCall = (phone: string) => {
    if (!phone) return ''
    // If already has +, return as is
    if (phone.startsWith('+')) return phone
    // If Australian mobile (starts with 0 and 10 digits), convert to +61
    if (/^0\d{9}$/.test(phone)) {
      return '+61' + phone.slice(1)
    }
    return phone
  }

  const handleCallNow = () => {
    const formatted = formatPhoneForCall(customer?.phone || '')
    if (formatted) {
      window.location.href = `tel:${formatted}`
    } else {
      alert('No valid phone number found for this customer.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Customer not found</h2>
          <Link href="/dashboard/customers" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Customers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={() => router.push('/dashboard/customers')} className="text-gray-500 hover:text-gray-800 mr-2">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
            {customer.first_name.charAt(0).toUpperCase() + customer.last_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold truncate">{customer.first_name} {customer.last_name}</div>
            <div className="text-gray-500 truncate">{customer.email}</div>
            <div className="text-gray-500">{customer.phone}</div>
            {customer.address?.suburb || customer.address?.state ? (
              <div className="text-gray-400 text-sm">
                {customer.address?.suburb}{customer.address?.suburb && customer.address?.state ? ', ' : ''}{customer.address?.state}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit & Delete */}
          <button
            onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ml-2"
            title="Edit"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 ml-2"
            title="Delete"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          {/* More Actions Dropdown */}
          <div className="relative ml-2" ref={actionsRef}>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="More Actions"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-20">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleSendEmail}
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />Send Email
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleCallNow}
                >
                  <PhoneIcon className="w-4 h-4 mr-2" />Call Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Bookings, Transactions, History, Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Bookings Card */}
          <BookingSection email={customer.email} currentCustomerId={customer.id} />
          {/* Transactions Card (Placeholder) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Transactions</h2>
            <p className="text-gray-500">No transactions available.</p>
          </div>
          {/* History/Activity Card (Placeholder) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Activity & History</h2>
            <p className="text-gray-500">No activity or history available.</p>
          </div>
        </div>
        {/* Right column: Customer Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="font-medium">{customer.first_name} {customer.last_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{customer.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Booking Number</label>
                <p className="font-medium">{customer.booking_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Address</label>
                <div className="text-sm text-gray-700">
                  {customer.address?.street && <div>{customer.address.street}</div>}
                  {customer.address?.unit && <div>Unit: {customer.address.unit}</div>}
                  {customer.address?.suburb && <div>Suburb: {customer.address.suburb}</div>}
                  {customer.address?.city && <div>City: {customer.address.city}</div>}
                  {customer.address?.state && <div>State: {customer.address.state}</div>}
                  {customer.address?.postcode && <div>Postcode: {customer.address.postcode}</div>}
                  {customer.address?.instructions && <div>Instructions: {customer.address.instructions}</div>}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Scheduling</label>
                <div className="text-sm text-gray-700">
                  {customer.scheduling?.date && <div>Date: {customer.scheduling.date}</div>}
                  {customer.scheduling?.time && <div>Time: {customer.scheduling.time}</div>}
                  {customer.scheduling?.is_flexible_date && <div>Flexible Date: Yes</div>}
                  {customer.scheduling?.is_flexible_time && <div>Flexible Time: Yes</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 