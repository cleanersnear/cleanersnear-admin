'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
   
  TrashIcon
} from '@heroicons/react/24/outline';
import { newBookingService } from '@/config/newDatabase';
import ServiceDetailsSection from './components/ServiceDetailsSection';
import CustomerSubDetails from './components/CustomerSubDetails';

interface PricingData {
  totalPrice?: number;
  [key: string]: number | string | boolean | undefined;
}

interface BookingDetail {
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
  notes: string;
  total_price?: number;
  pricing?: PricingData;
  service_details_id: number;
}


export default function NewBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.bookingNumber as string;
  
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bookingData = await newBookingService.getBookingByNumber(bookingNumber);
      if (!bookingData) {
        setError('Booking not found');
        return;
      }
      
      setBooking(bookingData);
      
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to fetch booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bookingNumber]);

  useEffect(() => {
    if (bookingNumber) {
      fetchBookingDetails();
    }
  }, [bookingNumber, fetchBookingDetails]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    
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
      month: 'long',
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await newBookingService.deleteBooking(bookingNumber);
      router.push('/dashboard/new-bookings');
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Failed to delete booking. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
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

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error || 'Booking not found'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Bookings
          </button>
          
          {/* Mobile Header */}
          <div className="sm:hidden">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(booking.status)}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{booking.booking_number}</h1>
                <p className="text-sm text-gray-600">{booking.selected_service}</p>
              </div>
              <span className={getStatusBadge(booking.status)}>
                {booking.status}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/dashboard/new-bookings/${booking.booking_number}/edit`)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(booking.status)}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{booking.booking_number}</h1>
                <p className="text-gray-600">{booking.selected_service}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={getStatusBadge(booking.status)}>
                {booking.status}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/new-bookings/${booking.booking_number}/edit`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-4">
          {/* Booking Summary - Mobile */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Service:</span>
                <span className="text-sm font-medium text-gray-900">{booking.selected_service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Scheduled:</span>
                <span className="text-sm text-gray-900">{formatDate(booking.schedule_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Created:</span>
                <span className="text-sm text-gray-900">{formatDate(booking.created_at)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium text-gray-500">Total Price:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(booking.total_price || booking.pricing?.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information - Mobile */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="text-sm text-gray-900">{booking.first_name} {booking.last_name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="text-sm text-gray-900">{booking.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="text-sm text-gray-900">{booking.phone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p className="text-sm text-gray-900">{booking.address}, {booking.suburb} {booking.postcode}</p>
              </div>
              {booking.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notes:</span>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md mt-1">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details - Mobile */}
          <ServiceDetailsSection 
            serviceType={booking.selected_service} 
            serviceDetailsId={booking.service_details_id} 
          />

          {/* Additional Customer Details - Mobile */}
          <CustomerSubDetails customerId={booking.id} />

          {/* Pricing Breakdown - Mobile */}
          {booking.pricing && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(booking.pricing).map(([key, value]) => {
                  if (typeof value === 'number') {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const isPrice = key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('rate');
                    const isTotal = key.toLowerCase().includes('total');
                    
                    return (
                      <div key={key} className={`flex justify-between ${isTotal ? 'border-t pt-2 font-semibold' : ''}`}>
                        <span className="text-sm text-gray-500">{label}:</span>
                        <span className="text-sm text-gray-900">
                          {isPrice ? formatCurrency(value) : value}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {booking.first_name} {booking.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {booking.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {booking.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {booking.address}, {booking.suburb} {booking.postcode}
                  </dd>
                </div>
              </div>
              
              {booking.notes && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {booking.notes}
                  </dd>
                </div>
              )}
            </div>

            {/* Service Details */}
            <ServiceDetailsSection 
              serviceType={booking.selected_service} 
              serviceDetailsId={booking.service_details_id} 
            />

            {/* Additional Customer Details */}
            <CustomerSubDetails customerId={booking.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service</dt>
                  <dd className="text-sm text-gray-900">{booking.selected_service}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                  <dd className="text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(booking.schedule_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(booking.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                  <dd className="text-lg font-semibold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-400" />
                    {formatCurrency(booking.total_price || booking.pricing?.totalPrice)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Pricing Breakdown */}
            {booking.pricing && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Breakdown</h3>
                <dl className="space-y-2">
                  {Object.entries(booking.pricing).map(([key, value]) => {
                    if (typeof value === 'number') {
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      const isPrice = key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('rate');
                      const isTotal = key.toLowerCase().includes('total');
                      
                      return (
                        <div key={key} className={`flex justify-between ${isTotal ? 'border-t pt-2 font-semibold' : ''}`}>
                          <dt className="text-sm text-gray-500">{label}</dt>
                          <dd className="text-sm text-gray-900">
                            {isPrice ? formatCurrency(value) : value}
                          </dd>
                        </div>
                      );
                    }
                    return null;
                  })}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Booking</h3>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete booking <strong>{booking?.booking_number}</strong>? 
                    This action cannot be undone and will permanently remove all booking data including customer information, service details, and notifications.
                  </p>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete Booking'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
