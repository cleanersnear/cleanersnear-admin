'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { newBookingService } from '@/config/newDatabase';

interface PricingData {
  totalPrice?: number;
  [key: string]: number | string | boolean | undefined;
}

interface NewBooking {
  id: number;
  booking_number: string;
  status: string;
  selected_service: string;
  created_at: string;
  schedule_date: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  postcode: string;
  total_price?: number;
  pricing?: PricingData;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'error', label: 'Error' },
];

export default function NewBookingsPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<NewBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Fetch all bookings once on mount
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await newBookingService.getAllBookings(50, 0, '');
      setAllBookings(data);
    } catch (err) {
      console.error('Error fetching new bookings:', err);
      setError('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Client-side filtering based on search query and status
  const filteredBookings = allBookings.filter((booking) => {
    // Status filter
    if (statusFilter !== 'all' && booking.status.toLowerCase() !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        booking.booking_number.toLowerCase().includes(query) ||
        booking.first_name.toLowerCase().includes(query) ||
        booking.last_name.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.phone.toLowerCase().includes(query) ||
        booking.address.toLowerCase().includes(query) ||
        booking.suburb.toLowerCase().includes(query) ||
        booking.postcode.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleStatusUpdate = async (bookingNumber: string, newStatus: string, bookingId: number) => {
    try {
      setUpdatingStatus(bookingId);
      setOpenMenuId(null);
      
      await newBookingService.updateBookingStatus(bookingNumber, newStatus);
      
      // Update local state
      setAllBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };


  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New Bookings</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Manage bookings from the new booking system
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 sm:focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-md leading-5 bg-white appearance-none focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings List - Mobile Optimized */}
        <div className="bg-white shadow overflow-hidden rounded-lg sm:rounded-md">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
              Bookings ({filteredBookings.length})
              {(searchQuery || statusFilter !== 'all') && allBookings.length !== filteredBookings.length && (
                <span className="ml-2 text-xs sm:text-sm text-gray-500">
                  (filtered from {allBookings.length})
                </span>
              )}
            </h3>
          </div>
          
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <CalendarIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'No bookings match your filter criteria.' 
                  : 'No bookings have been created yet.'
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <li key={booking.id} className="hover:bg-gray-50">
                  <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(booking.status)}
                          <div>
                            <p className="text-sm font-medium text-indigo-600">
                              {booking.booking_number}
                            </p>
                            <p className="text-sm text-gray-900">
                              {booking.first_name} {booking.last_name}
                            </p>
                          </div>
                        </div>
                        
                        {/* Actions Menu - Mobile */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Actions"
                            disabled={updatingStatus === booking.id}
                          >
                            {updatingStatus === booking.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            ) : (
                              <EllipsisVerticalIcon className="w-5 h-5" />
                            )}
                          </button>

                          {openMenuId === booking.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              
                              {/* Menu */}
                              <div className="absolute right-0 top-8 z-20 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      router.push(`/dashboard/new-bookings/${booking.booking_number}`);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <EyeIcon className="w-4 h-4 mr-3" />
                                    View Details
                                  </button>
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <div className="px-4 py-2 text-xs font-medium text-gray-500">Update Status</div>
                                  
                                  {STATUS_OPTIONS.slice(1).map((status) => (
                                    <button
                                      key={status.value}
                                      onClick={() => handleStatusUpdate(booking.booking_number, status.value, booking.id)}
                                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                                        booking.status.toLowerCase() === status.value 
                                          ? 'text-indigo-600 font-medium' 
                                          : 'text-gray-700'
                                      }`}
                                      disabled={booking.status.toLowerCase() === status.value}
                                    >
                                      {booking.status.toLowerCase() === status.value && (
                                        <CheckCircleIcon className="w-4 h-4 mr-3" />
                                      )}
                                      <span className={booking.status.toLowerCase() === status.value ? '' : 'ml-7'}>
                                        {status.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Service:</span>
                          <span className="text-sm font-medium text-gray-900">{booking.selected_service}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Price:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(booking.total_price || booking.pricing?.totalPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Date:</span>
                          <span className="text-sm text-gray-900">
                            {formatDate(booking.schedule_date || booking.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Status:</span>
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {booking.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {booking.suburb}, {booking.postcode}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {booking.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(booking.status)}
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {booking.booking_number}
                            </p>
                            <p className="text-sm text-gray-900">
                              {booking.first_name} {booking.last_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.selected_service}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.suburb}, {booking.postcode}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(booking.total_price || booking.pricing?.totalPrice)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(booking.schedule_date || booking.created_at)}
                            </p>
                          </div>
                          
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </span>
                          
                          {/* Actions Menu - Desktop */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                              className="text-gray-600 hover:text-gray-900 p-1"
                              title="Actions"
                              disabled={updatingStatus === booking.id}
                            >
                              {updatingStatus === booking.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                              ) : (
                                <EllipsisVerticalIcon className="w-5 h-5" />
                              )}
                            </button>

                            {openMenuId === booking.id && (
                              <>
                                {/* Backdrop */}
                                <div 
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                
                                {/* Menu */}
                                <div className="absolute right-0 top-8 z-20 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        router.push(`/dashboard/new-bookings/${booking.booking_number}`);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <EyeIcon className="w-4 h-4 mr-3" />
                                      View Details
                                    </button>
                                    
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <div className="px-4 py-2 text-xs font-medium text-gray-500">Update Status</div>
                                    
                                    {STATUS_OPTIONS.slice(1).map((status) => (
                                      <button
                                        key={status.value}
                                        onClick={() => handleStatusUpdate(booking.booking_number, status.value, booking.id)}
                                        className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                                          booking.status.toLowerCase() === status.value 
                                            ? 'text-indigo-600 font-medium' 
                                            : 'text-gray-700'
                                        }`}
                                        disabled={booking.status.toLowerCase() === status.value}
                                      >
                                        {booking.status.toLowerCase() === status.value && (
                                          <CheckCircleIcon className="w-4 h-4 mr-3" />
                                        )}
                                        <span className={booking.status.toLowerCase() === status.value ? '' : 'ml-7'}>
                                          {status.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.address}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
