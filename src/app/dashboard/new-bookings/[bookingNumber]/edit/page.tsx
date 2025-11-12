'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { newBookingService } from '@/config/newDatabase';
import ServiceDetailsEditor from './ServiceDetailsEditor';

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
  customer_id: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon, color: 'green' },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'blue' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon, color: 'red' },
  { value: 'error', label: 'Error', icon: ExclamationTriangleIcon, color: 'red' },
];

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.bookingNumber as string;
  
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    status: 'pending',
    schedule_date: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    postcode: '',
    notes: '',
  });

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
      setFormData({
        status: bookingData.status,
        schedule_date: bookingData.schedule_date ? bookingData.schedule_date.split('T')[0] : '',
        first_name: bookingData.first_name,
        last_name: bookingData.last_name,
        email: bookingData.email,
        phone: bookingData.phone,
        address: bookingData.address,
        suburb: bookingData.suburb || '',
        postcode: bookingData.postcode || '',
        notes: bookingData.notes || '',
      });
      
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);
      
      if (!booking) {
        setError('Booking data not available');
        return;
      }

      // Update all booking fields in parallel
      const updatePromises = [];

      // 1. Update booking status
      updatePromises.push(
        newBookingService.updateBookingStatus(bookingNumber, formData.status)
      );

      // 2. Update schedule date if changed
      const currentScheduleDate = booking.schedule_date ? booking.schedule_date.split('T')[0] : '';
      if (formData.schedule_date && formData.schedule_date !== currentScheduleDate) {
        console.log('Updating schedule date:', {
          old: booking.schedule_date,
          new: formData.schedule_date,
          bookingNumber
        });
        updatePromises.push(
          newBookingService.updateBookingSchedule(bookingNumber, formData.schedule_date)
        );
      }

      // 3. Update customer details (using the booking's customer_id)
      const customerUpdates: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        suburb?: string;
        postcode?: string;
      } = {};

      if (formData.first_name !== booking.first_name) customerUpdates.first_name = formData.first_name;
      if (formData.last_name !== booking.last_name) customerUpdates.last_name = formData.last_name;
      if (formData.email !== booking.email) customerUpdates.email = formData.email;
      if (formData.phone !== booking.phone) customerUpdates.phone = formData.phone;
      if (formData.address !== booking.address) customerUpdates.address = formData.address;
      if (formData.suburb !== (booking.suburb || '')) customerUpdates.suburb = formData.suburb;
      if (formData.postcode !== (booking.postcode || '')) customerUpdates.postcode = formData.postcode;

      if (Object.keys(customerUpdates).length > 0 && booking.customer_id) {
        updatePromises.push(
          newBookingService.updateCustomerDetails(booking.customer_id, customerUpdates)
        );
      }

      // 4. Update notes if changed
      if (formData.notes !== (booking.notes || '')) {
        console.log('Updating notes:', {
          old: booking.notes,
          new: formData.notes,
          bookingNumber
        });
        updatePromises.push(
          newBookingService.updateBookingNotes(bookingNumber, formData.notes)
        );
      }

      // Execute all updates
      await Promise.all(updatePromises);
      
      setSaveMessage('Booking updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Refresh the booking data
      await fetchBookingDetails();
      
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!statusOption) return <ClockIcon className="w-5 h-5 text-gray-500" />;
    
    const IconComponent = statusOption.icon;
    const colorClasses = {
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      blue: 'text-blue-500',
      red: 'text-red-500',
    };
    
    return <IconComponent className={`w-5 h-5 ${colorClasses[statusOption.color as keyof typeof colorClasses]}`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Booking Details
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(booking.status)}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
                <p className="text-gray-600">{booking.booking_number} - {booking.selected_service}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{saveMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Booking Information</h3>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Date */}
            <div>
              <label htmlFor="schedule_date" className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date
              </label>
              <input
                type="date"
                id="schedule_date"
                name="schedule_date"
                value={formData.schedule_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-2">
                  Suburb
                </label>
                <input
                  type="text"
                  id="suburb"
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or special instructions..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Service Information (Read-only summary) */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Service Information</h3>
          </div>
          
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.selected_service}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const totalPrice = booking.total_price || booking.pricing?.totalPrice;
                    return totalPrice 
                      ? new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD'
                        }).format(totalPrice)
                      : 'N/A';
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(booking.created_at).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Service Details Editor - Editable service-specific fields */}
        {booking.service_details_id && booking.customer_id && (
          <div className="mt-6">
            <ServiceDetailsEditor
              serviceType={booking.selected_service}
              serviceDetailsId={booking.service_details_id}
              customerId={booking.customer_id}
              onUpdate={fetchBookingDetails}
            />
          </div>
        )}
      </div>
    </div>
  );
}
