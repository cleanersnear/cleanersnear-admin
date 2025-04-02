'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Types based on your Supabase schema
interface Customer {
  id: string
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
    date: string
    time: string
    is_flexible: boolean
  }
}

interface Booking {
  id: string
  booking_number: string
  customer_id: string
  service_type: string
  status: string
  total_price: number
  location: {
    suburb?: string
    postcode?: string
    address?: string
  }
  scheduling: {
    date?: string
    time?: string
    is_flexible?: boolean
    preferred_time?: string
  }
  created_at: string
  updated_at: string
}

interface BookingAdminDetails {
  id: string
  booking_id: string
  payment_status: string
  staff_assigned: {
    id?: string
    name?: string
  }[]
  payments: {
    id: string
    amount: number
    payment_method: string
    payment_date: string
  }[]
}

interface BookingWithAdmin extends Booking {
  admin_details?: BookingAdminDetails
  customer?: Customer
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithAdmin[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const supabase = createClientComponentClient()

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const [bookingsResponse, adminDetailsResponse, customersResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('booking_admin_details')
          .select(`
            booking_id,
            payment_status,
            staff_assigned,
            payments
          `),
        supabase
          .from('customers')
          .select(`
            booking_id,
            first_name,
            last_name,
            email,
            scheduling,
            phone
          `)
      ])

      if (bookingsResponse.error) throw bookingsResponse.error
      if (adminDetailsResponse.error) throw adminDetailsResponse.error
      if (customersResponse.error) throw customersResponse.error

      const mergedData = bookingsResponse.data.map(booking => ({
        ...booking,
        admin_details: adminDetailsResponse.data?.find(ad => ad.booking_id === booking.id),
        customer: customersResponse.data?.find(c => c.booking_id === booking.id)
      }))

      setBookings(mergedData)
      setFilteredBookings(mergedData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const filterBookings = useCallback(() => {
    let filtered = [...bookings]

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(booking => booking.service_type === serviceFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, serviceFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    filterBookings()
  }, [filterBookings])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const serviceTypes = ['all', ...new Set(bookings.map(b => b.service_type))]
  const statusTypes = ['all', 'pending', 'confirmed', 'cancelled', 'completed']

  const paginateBookings = (bookings: BookingWithAdmin[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return bookings.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const paginatedBookings = paginateBookings(filteredBookings)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-600">Manage your service bookings</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                {statusTypes.filter(status => status !== 'all').map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Services</option>
                {serviceTypes.filter(service => service !== 'all').map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(statusFilter !== 'all' || serviceFilter !== 'all' || searchTerm) && (
            <div className="flex gap-2 flex-wrap">
              {statusFilter !== 'all' && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {serviceFilter !== 'all' && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Service: {serviceFilter}
                  <button onClick={() => setServiceFilter('all')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1400px]">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Number
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBookings.map((booking) => (
                    <tr 
                      key={booking.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.booking_number}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.customer ? (
                          <div className="flex flex-col">
                            <span>{`${booking.customer.first_name} ${booking.customer.last_name}`}</span>
                            <span className="text-xs text-gray-400">{booking.customer.email}</span>
                          </div>
                        ) : (
                          'No customer data'
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.service_type}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{booking.location?.suburb || 'N/A'}</span>
                          <span className="text-xs text-gray-400">
                            {booking.location?.postcode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>
                            {booking.customer?.scheduling?.date ? 
                              format(new Date(booking.customer.scheduling.date), 'MMM d, yyyy') 
                              : 'No date'
                            }
                          </span>
                          <span className="text-xs text-gray-400">
                            {booking.customer?.scheduling?.time || 'No time'}
                            {booking.customer?.scheduling?.is_flexible && ' (Flexible)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${booking.total_price}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className={`text-xs font-medium ${
                            booking.admin_details?.payment_status === 'paid' ? 'text-green-600' :
                            booking.admin_details?.payment_status === 'partially_paid' ? 'text-yellow-600' :
                            booking.admin_details?.payment_status === 'refunded' ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {booking.admin_details?.payment_status 
                              ? booking.admin_details.payment_status.charAt(0).toUpperCase() + 
                                booking.admin_details.payment_status.slice(1).replace('_', ' ')
                              : 'Unpaid'
                            }
                          </span>
                          <span className="text-xs text-gray-400">
                            {booking.admin_details?.payments?.[0] 
                              ? `${booking.admin_details.payments.length} payment(s)`
                              : 'No payments'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {booking.admin_details?.staff_assigned && 
                           booking.admin_details.staff_assigned.length > 0 ? (
                            booking.admin_details.staff_assigned.map((staff, index) => (
                              <span key={index} className="text-xs">
                                {staff.name || 'Unnamed'}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Unassigned</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 
                           text-sm font-medium text-gray-700
                           hover:bg-gray-50 disabled:opacity-50 
                           disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium
                                ${currentPage === page 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                  : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-300 
                           text-sm font-medium text-gray-700
                           hover:bg-gray-50 disabled:opacity-50 
                           disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 