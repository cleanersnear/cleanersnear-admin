'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ServiceDetails from '@/app/dashboard/bookings/[id]/service-details'
import Link from 'next/link'
import StaffAssignmentModal from './components/staff-assignment-modal'
import NotesSection from './components/notes-section'
import PaymentSection, { PaymentSchedule, PaymentStatus } from './components/payment-section'


interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: {
    street?: string
    city?: string
    suburb?: string
    postcode?: string
  }
  scheduling: {
    date?: string
    time?: string
    is_flexible_date?: boolean
    is_flexible_time?: boolean
  }
}

interface Booking {
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
  location: {
    suburb?: string
    state?: string
  }
}

interface ServiceDetails {
  id: string
  booking_id: string
  service_type: string
  service_details: Record<string, unknown>
  created_at: string
  updated_at: string
}

type BookingStatus =
  | 'new'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'invoiced'
  | 'paid'
  | 'refunded'

type PaymentMethod = 'cash' | 'card' | 'online' | 'bank_transfer' | 'refund'

interface Payment {
  id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  added_by: string
  notes?: string
}

interface AdminDetails {
  id: string
  booking_id: string
  staff_assigned: {
    id?: string
    name?: string
    assigned_at?: string
  }[]
  payment_status: string
  payment_method: string
  payment_schedule: string
  payments: Payment[]
  adjusted_total_price: number | null
  payment_notes: string
  note_text: string
  note_added_by: string
  note_created_at: string
  created_at: string
  updated_at: string
}

interface BookingDetailProps {
  id: string
  initialData?: {
    booking: Booking
    adminDetails: AdminDetails | null
  }
}

export default function BookingDetail({ id, initialData }: BookingDetailProps) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(initialData?.booking || null)
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(initialData?.adminDetails || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const supabase = createClientComponentClient()

  const fetchBookingDetails = useCallback(async () => {
    // If we have initial data, don't fetch again
    if (initialData?.booking) {
      setBooking(initialData.booking)
      return
    }

    try {
      setIsLoading(true)
      
      // First fetch booking data
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (bookingError) {
        console.error('Booking fetch error:', bookingError)
        throw bookingError
      }

      if (!bookingData) {
        throw new Error('Booking not found')
      }

      // Then fetch customer data using the booking's customer_id
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', bookingData.customer_id)
        .single()

      if (customerError) {
        console.error('Customer fetch error:', customerError)
        throw customerError
      }

      if (!customerData) {
        throw new Error('Customer not found')
      }

      // Fetch service details
      const { error: serviceError } = await supabase
        .from('service_details')
        .select('*')
        .eq('booking_id', id)
        .single()

      if (serviceError && serviceError.code !== 'PGRST116') {
        console.error('Service details error:', serviceError)
        throw serviceError
      }

      // Update state with the fetched data
      setBooking(bookingData)
      setAdminDetails({
        id: bookingData.id.toString(),
        booking_id: bookingData.id.toString(),
        staff_assigned: [],
        payment_status: 'unpaid',
        payment_method: '',
        payment_schedule: 'after_cleaning',
        payments: [],
        adjusted_total_price: bookingData.total_price || null,
        payment_notes: '',
        note_text: '',
        note_added_by: '',
        note_created_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Failed to load booking details')
    } finally {
      setIsLoading(false)
    }
  }, [id, supabase, initialData])

  useEffect(() => {
    if (!initialData) {
      fetchBookingDetails()
    }
  }, [id, initialData, fetchBookingDetails])

  const fetchAdminDetails = useCallback(async () => {
    if (!booking) return;
    
    try {
      const { data, error } = await supabase
        .from('booking_admin_details')
        .select('*')
        .eq('booking_id', id)
        .single()

      let adminData = data

      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('booking_admin_details')
          .insert({
            booking_id: id,
            staff_assigned: [],
            payment_status: 'unpaid',
            payment_method: '',
            payment_schedule: 'after_cleaning',
            payments: [],
            adjusted_total_price: booking.total_price || null,
            payment_notes: '',
            note_text: '',
            note_added_by: '',
            note_created_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) throw insertError
        adminData = newData
      } else if (error) {
        throw error
      }

      if (adminData) {
        adminData.payments = Array.isArray(adminData.payments) ? adminData.payments : []
        if (!['unpaid', 'partially_paid', 'paid', 'refunded'].includes(adminData.payment_status)) {
          adminData.payment_status = 'unpaid'
        }
        if (!['upfront', 'on_cleaning_day', 'after_cleaning'].includes(adminData.payment_schedule)) {
          adminData.payment_schedule = 'after_cleaning'
        }

        const { error: updateError } = await supabase
          .from('booking_admin_details')
          .update({
            payments: adminData.payments,
            payment_status: adminData.payment_status,
            payment_schedule: adminData.payment_schedule,
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', id)

        if (updateError) {
          console.error('Error updating normalized data:', updateError)
          toast.error('Failed to normalize admin details')
        }

        setAdminDetails(adminData)
      }
    } catch (err) {
      const error = err as Error
      console.error('Error with admin details:', error)
      toast.error('Failed to load admin details')
    }
  }, [id, supabase, booking])

  useEffect(() => {
    fetchBookingDetails()
    fetchAdminDetails()
  }, [fetchBookingDetails, fetchAdminDetails])

  const updateBookingStatus = async (newStatus: BookingStatus) => {
    if (!booking) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id)

      if (error) throw error

      setBooking(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success('Booking status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update booking status')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      new: {
        color: 'bg-purple-100 text-purple-800',
        icon: 'SparklesIcon',
        label: 'New Booking'
      },
      confirmed: {
        color: 'bg-blue-100 text-blue-800',
        icon: 'CheckCircleIcon',
        label: 'Confirmed'
      },
      in_progress: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'ClockIcon',
        label: 'In Progress'
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        icon: 'CheckBadgeIcon',
        label: 'Completed'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: 'XCircleIcon',
        label: 'Cancelled'
      },
      invoiced: {
        color: 'bg-indigo-100 text-indigo-800',
        icon: 'ReceiptIcon',
        label: 'Invoiced'
      },
      paid: {
        color: 'bg-emerald-100 text-emerald-800',
        icon: 'BanknotesIcon',
        label: 'Paid'
      },
      refunded: {
        color: 'bg-orange-100 text-orange-800',
        icon: 'ArrowPathIcon',
        label: 'Refunded'
      }
    }
    return configs[status] || configs.new
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

  const handleStaffAssignment = async (staffId: string, staffName: string) => {
    try {
      // Create new staff assignment
      const newStaffAssignment = {
        id: staffId,
        name: staffName,
        assigned_at: new Date().toISOString()
      }

      // Create updated staff array - replace existing staff instead of adding
      const updatedStaffAssigned = adminDetails?.staff_assigned
        ? [newStaffAssignment] // Replace with new staff
        : [newStaffAssignment]

      const { error } = await supabase
        .from('booking_admin_details')
        .update({
          staff_assigned: updatedStaffAssigned
        })
        .eq('booking_id', id)

      if (error) throw error

      // Update local state immediately
      setAdminDetails(prev => prev ? {
        ...prev,
        staff_assigned: updatedStaffAssigned
      } : null)

      setShowStaffModal(false)
      toast.success('Staff assigned successfully')
    } catch (error) {
      console.error('Error assigning staff:', error)
      toast.error('Failed to assign staff')
    }
  }

  const handleRemoveStaff = async (staffId?: string) => {
    if (!staffId) return

    try {
      const updatedStaff = adminDetails?.staff_assigned.filter(staff => staff.id !== staffId)

      const { error } = await supabase
        .from('booking_admin_details')
        .update({ staff_assigned: updatedStaff })
        .eq('booking_id', id)

      if (error) throw error

      fetchAdminDetails()
      toast.success('Staff removed successfully')
    } catch (error) {
      console.error('Error removing staff:', error)
      toast.error('Failed to remove staff')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!booking) {
    return <div>Booking not found</div>
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Booking Details</h1>
            <p className="text-sm text-gray-600">#{booking.booking_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(booking.status as BookingStatus).color}`}>
            {getStatusConfig(booking.status as BookingStatus).label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Full width on mobile, 2/3 on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4">Booking Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.service_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(booking.customer.scheduling?.date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatTime(booking.customer.scheduling?.time)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${booking.total_price}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flexible Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.customer.scheduling?.is_flexible_date ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Flexible Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {booking.customer.scheduling?.is_flexible_time ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Service Details Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4">Service Details</h2>
            {booking && (
              <ServiceDetails
                bookingId={booking.id.toString()}
                serviceType={booking.service_type}
              />
            )}
          </div>
        </div>

        {/* Right Column (Full width on mobile, 1/3 on desktop) */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {`${booking.customer.first_name} ${booking.customer.last_name}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{booking.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{booking.customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {booking.customer.address?.street}, {booking.customer.address?.city}
                  </dd>
                </div>
                <div className="pt-4">
                  <Link
                    href={`/dashboard/customers/${booking.customer.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Customer Profile →
                  </Link>
                </div>
              </dl>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment</h3>
              <PaymentSection
                bookingId={id}
                originalPrice={booking.total_price}
                adjustedPrice={adminDetails?.adjusted_total_price}
                paymentSchedule={adminDetails?.payment_schedule as PaymentSchedule}
                paymentStatus={adminDetails?.payment_status as PaymentStatus}
                payments={adminDetails?.payments || []}
                onUpdate={async (updates) => {
                  try {
                    // If it's a payment update, recalculate the status
                    if (updates.payments) {
                      const totalPaid = updates.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
                      const totalPrice = adminDetails?.adjusted_total_price || booking.total_price

                      // Don't override refunded status
                      if (adminDetails?.payment_status !== 'refunded') {
                        updates.payment_status = totalPaid === 0 ? 'unpaid'
                          : totalPaid === totalPrice ? 'paid'
                            : 'partially_paid'
                      }
                    }

                    const { error } = await supabase
                      .from('booking_admin_details')
                      .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                      })
                      .eq('booking_id', id)

                    if (error) throw error

                    // Update local state
                    setAdminDetails(prev => prev ? {
                      ...prev,
                      ...updates,
                      updated_at: new Date().toISOString()
                    } : null)

                    toast.success('Payment details updated successfully')
                  } catch (error) {
                    console.error('Error updating payment details:', error)
                    toast.error('Failed to update payment details')
                  }
                }}
              />
            </div>
          </div>

          {/* Fulfillment Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900">Fulfillment</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(booking.status as BookingStatus).color}`}>
                  {getStatusConfig(booking.status as BookingStatus).label}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {booking.status !== 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus('confirmed')}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Confirm Booking
                    </button>
                  )}
                  {booking.status !== 'in_progress' && (
                    <button
                      onClick={() => updateBookingStatus('in_progress')}
                      className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Mark In Progress
                    </button>
                  )}
                  {booking.status !== 'completed' && (
                    <button
                      onClick={() => updateBookingStatus('completed')}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Mark Complete
                    </button>
                  )}
                  {booking.status !== 'invoiced' && (
                    <button
                      onClick={() => updateBookingStatus('invoiced')}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Mark Invoiced
                    </button>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t">
                  <select
                    value={booking.status}
                    onChange={(e) => updateBookingStatus(e.target.value as BookingStatus)}
                    className="flex-1 w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="new">New Booking</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  {booking.status !== 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus('cancelled')}
                      className="w-full sm:w-auto px-3 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Status History</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-4 h-4 rounded-full bg-gray-200 mr-2"></span>
                      Current: {getStatusConfig(booking.status as BookingStatus).label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Staff</h3>
              <div className="space-y-4">
                {/* Current Assignments */}
                {adminDetails?.staff_assigned && adminDetails.staff_assigned.length > 0 ? (
                  <div className="space-y-3">
                    {adminDetails.staff_assigned.map((staff, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                            <Link
                              href={`/dashboard/staff/${staff.id}`}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              target="_blank"
                            >
                              View Profile
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500">
                            Assigned {format(new Date(staff.assigned_at || ''), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No staff currently assigned
                  </div>
                )}

                {/* Staff Assignment Actions */}
                <div className="space-y-2">
                  {adminDetails?.staff_assigned && adminDetails.staff_assigned.length > 0 ? (
                    <>
                      <button
                        onClick={() => setShowStaffModal(true)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Change Staff
                      </button>
                      <button
                        onClick={() => handleRemoveStaff(adminDetails.staff_assigned[0].id)}
                        className="w-full border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50"
                      >
                        Remove Staff
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowStaffModal(true)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Assign Staff
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <NotesSection
                bookingId={id}
                notes={{
                  note_text: adminDetails?.note_text || '',
                  note_added_by: adminDetails?.note_added_by || '',
                  note_created_at: adminDetails?.note_created_at || ''
                }}
                onNotesUpdate={(updatedNote) =>
                  setAdminDetails(prev => prev ? {
                    ...prev,
                    ...updatedNote
                  } : null)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Assignment Modal */}
      {showStaffModal && (
        <StaffAssignmentModal
          onClose={() => setShowStaffModal(false)}
          onAssign={handleStaffAssignment}
          currentAssignments={adminDetails?.staff_assigned || []}
        />
      )}
    </div>
  )
} 