'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ServiceDetails from '@/app/dashboard/bookings/[id]/service-details'

import StaffAssignmentModal from './components/staff-assignment-modal'
import NotesSection from './components/notes-section'
import PaymentSection, { PaymentSchedule, PaymentStatus } from './components/payment-section'
import CustomerDetail from './customer-detail'
import EmailClientWrapper from './components/EmailClientWrapper'
import FulfillmentActions from './components/FulfillmentActions'
import Cookies from 'js-cookie'
import StaffActions from './components/StaffActions'


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

type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

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
  const [isDeleted, setIsDeleted] = useState(false)
  const supabase = createClientComponentClient()

  // Restore scroll position on mount (with delay for notification)
  useEffect(() => {
    const scroll = Cookies.get('booking_scroll')
    if (scroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scroll, 10))
        Cookies.remove('booking_scroll')
      }, 500) // Delay to allow notification to render
    }
  }, [])

  const fetchBookingDetails = useCallback(async () => {
    // If we have initial data, don't fetch again
    if (initialData?.booking) {
      setBooking(initialData.booking)
      return
    }

    try {
      setIsLoading(true)

      // First fetch booking data with customer
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers!bookings_customer_id_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (bookingError) {
        console.error('Booking fetch error:', bookingError)
        throw bookingError
      }

      if (!bookingData) {
        throw new Error('Booking not found')
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
    if (!booking || isDeleted) return;

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
      if (!isDeleted) {
        toast.error('Failed to load admin details')
      }
    }
  }, [id, supabase, booking, isDeleted])

  useEffect(() => {
    if (!isDeleted) {
      fetchAdminDetails()
    }
  }, [fetchAdminDetails, isDeleted])

  const updateBookingStatus = async (newStatus: FulfillmentStatus) => {
    if (!booking) return;

    setIsLoading(true);
    try {
      // Save scroll position before updating
      Cookies.set('booking_scroll', String(window.scrollY));

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      setBooking(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success('Booking status updated');

      // Reload the page (client-side, preserves scroll restoration)
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: FulfillmentStatus) => {
    const configs = {
      pending: {
        color: 'bg-purple-100 text-purple-800',
        icon: 'SparklesIcon',
        label: 'New Booking'
      },
      confirmed: {
        color: 'bg-blue-100 text-blue-800',
        icon: 'CheckCircleIcon',
        label: 'Confirmed'
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
      }
    }
    return configs[status] || configs.pending
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

  const getServiceTable = (type: string): string => {
    const tableMap: Record<string, string> = {
      'carpet-cleaning': 'carpet_cleaning_services',
      'end-of-lease-cleaning': 'end_of_lease_services',
      'general-cleaning': 'general_cleaning_services',
      'deep-cleaning': 'deep_cleaning_services',
      'move-in-cleaning': 'move_in_out_services',
      'ndis-cleaning': 'ndis_cleaning_services',
      'commercial-cleaning': 'commercial_cleaning_services',
      'upholstery-cleaning': 'upholstery_cleaning_services',
      'window-cleaning': 'window_cleaning_enquiries'
    }
    return tableMap[type] || ''
  }

  const handleDeleteBooking = async () => {
    if (!booking) return;
    
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete related records first
      const { error: adminError } = await supabase
        .from('booking_admin_details')
        .delete()
        .eq('booking_id', id);

      if (adminError) {
        console.error('Error deleting admin details:', adminError);
        throw new Error(`Failed to delete admin details: ${adminError.message}`);
      }

      // Delete service-specific details if they exist
      const serviceTable = getServiceTable(booking.service_type);
      if (serviceTable) {
        const { error: serviceError } = await supabase
          .from(serviceTable)
          .delete()
          .eq('booking_id', id);

        if (serviceError && serviceError.code !== 'PGRST116') {
          console.error('Error deleting service details:', serviceError);
          throw new Error(`Failed to delete service details: ${serviceError.message}`);
        }
      }

      // Delete customer record first (due to foreign key constraint)
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('booking_id', id);

      if (customerError) {
        console.error('Error deleting customer:', customerError);
        throw new Error(`Failed to delete customer: ${customerError.message}`);
      }

      // Finally delete the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (bookingError) {
        console.error('Error deleting booking:', bookingError);
        throw new Error(`Failed to delete booking: ${bookingError.message}`);
      }

      // Clear local state before navigation
      setBooking(null);
      setAdminDetails(null);
      setIsDeleted(true);
      
      // Show success message
      toast.success('Booking deleted successfully');
      
      // Use replace instead of push to prevent back navigation
      router.replace('/dashboard/bookings');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error deleting booking:', errorMessage);
      toast.error(`Failed to delete booking: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDeleted) return null;

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
            <p
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusConfig(booking.status as FulfillmentStatus).color}`}
            >
              {getStatusConfig(booking.status as FulfillmentStatus).label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteBooking}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Booking"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <EmailClientWrapper bookingId={booking.id.toString()} />
          <FulfillmentActions
            currentStatus={booking.status as FulfillmentStatus}
            onStatusChange={updateBookingStatus}
            isLoading={isLoading}
          />
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
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${booking.total_price}</dd>
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
                disabled={isDeleted}
              />
            )}
          </div>
        </div>

        {/* Right Column (Full width on mobile, 1/3 on desktop) */}
        <div className="space-y-6">
          {/* Customer Information */}
          <CustomerDetail bookingId={booking.id.toString()} disabled={isDeleted} />

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              
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

          {/* Staff Assignment */}
          <StaffActions
            staffAssigned={adminDetails?.staff_assigned || []}
            onAssign={handleStaffAssignment}
            onRemove={handleRemoveStaff}
            onShowModal={() => setShowStaffModal(true)}
            isLoading={isLoading}
          />

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