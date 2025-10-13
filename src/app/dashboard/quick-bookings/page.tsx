'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Search, X, ChevronLeft, ChevronRight, Eye, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

export default function QuickBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<QuickBookingWithCustomer[]>([])
  const [filteredBookings, setFilteredBookings] = useState<QuickBookingWithCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const supabase = createClientComponentClient()

  const fetchQuickBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const [bookingsResponse, customersResponse] = await Promise.all([
        supabase
          .from('quick_bookings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('quick_customers')
          .select('*')
      ])

      if (bookingsResponse.error) throw bookingsResponse.error
      if (customersResponse.error) throw customersResponse.error

      const customersMap = new Map(
        customersResponse.data.map(customer => [customer.id, customer])
      )

      const bookingsWithCustomers = bookingsResponse.data.map(booking => ({
        ...booking,
        customer: customersMap.get(booking.customer_id)
      }))

      setBookings(bookingsWithCustomers)
      setFilteredBookings(bookingsWithCustomers)
    } catch (error) {
      console.error('Error fetching quick bookings:', error)
      toast.error('Failed to load quick bookings')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchQuickBookings()
  }, [fetchQuickBookings])

  // Filter bookings based on search term and filters
  useEffect(() => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address_suburb?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(booking => booking.service_type === serviceFilter)
    }

    setFilteredBookings(filtered)
    setCurrentPage(1)
  }, [bookings, searchTerm, serviceFilter])

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

  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)

  const handleViewBooking = (bookingId: string) => {
    router.push(`/dashboard/quick-bookings/${bookingId}`)
  }

  const handleEditBooking = (bookingId: string) => {
    router.push(`/dashboard/quick-bookings/${bookingId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Quick Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all quick booking requests from customers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Quick Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
        </div>
        <div className="flex gap-2">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Services</option>
            <option value="general_cleaning">General Cleaning</option>
            <option value="deep_cleaning">Deep Cleaning</option>
            <option value="end_of_lease">End of Lease</option>
            <option value="carpet_cleaning">Carpet Cleaning</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.booking_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.booking_type} • {booking.frequency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer?.first_name} {booking.customer?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.customer?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(booking.service_type)}`}>
                          {booking.service_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.address_suburb}, {booking.address_state}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.address_postcode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${booking.total_price}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.total_hours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.preferred_date ? format(new Date(booking.preferred_date), 'MMM dd, yyyy') : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewBooking(booking.id)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditBooking(booking.id)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Edit booking"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredBookings.length}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
