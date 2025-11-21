'use client';

import { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import CreateWixCustomerModal, { WixContactData } from './CreateWixCustomerModal';

interface PricingData {
  totalPrice?: number;
  [key: string]: number | string | boolean | undefined;
}

interface CreateWixCustomerButtonProps {
  booking: {
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
  };
}

export default function CreateWixCustomerButton({ booking }: CreateWixCustomerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleCreateContact = async (contactData: WixContactData) => {
    setIsCreating(true);
    setStatus('idle');
    setMessage('');

    try {
      // Format phone - clean up the number
      // Remove leading 0 for Australian numbers, remove + prefix
      // Wix will use the countryCode field we send separately
      let formattedPhone = contactData.phone.trim();
      if (formattedPhone) {
        // Remove + prefix if present
        formattedPhone = formattedPhone.replace(/^\+/, '');
        // Remove leading 0 for Australian numbers
        if (contactData.phoneCountryCode === 'AU' && formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        // Remove country code if already included (e.g., 61...)
        if (contactData.phoneCountryCode === 'AU' && formattedPhone.startsWith('61') && formattedPhone.length > 10) {
          formattedPhone = formattedPhone.substring(2);
        }
      }

      const response = await fetch('/api/wix/create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingNumber: booking.booking_number,
          customerData: {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: formattedPhone,
            phoneType: contactData.phoneType,
            phoneCountryCode: contactData.phoneCountryCode,
            address: contactData.address,
            addressLine2: contactData.addressLine2,
            suburb: contactData.city,
            state: contactData.state,
            postcode: contactData.postcode,
            country: contactData.country,
            addressType: contactData.addressType,
          },
          allowDuplicates: false, // Don't allow duplicates by default
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        // If response is not JSON
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        // Use user-friendly message if available, otherwise fall back to error or details
        const userMessage = result.userMessage || result.error || result.details || 'Failed to create contact in Wix';
        
        // Handle specific error cases with appropriate styling
        let errorMessage = userMessage;
        if (response.status === 409) {
          // Contact already exists - this is informational, not really an error
          setStatus('error');
          errorMessage = `ℹ️ ${userMessage}${result.contactId ? ` (Contact ID: ${result.contactId})` : ''}`;
        } else if (response.status === 401 || response.status === 403) {
          // Authentication/permission errors
          setStatus('error');
          errorMessage = `🔐 ${userMessage}`;
        } else if (response.status === 429) {
          // Rate limit
          setStatus('error');
          errorMessage = `⏱️ ${userMessage}`;
        } else if (response.status >= 500) {
          // Server errors
          setStatus('error');
          errorMessage = `🔧 ${userMessage}`;
        } else {
          // Other errors
          setStatus('error');
          errorMessage = `❌ ${userMessage}`;
        }
        
        setMessage(errorMessage);
        
        // Clear error message after 12 seconds (longer for important errors)
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 12000);
        
        // Throw error so modal can catch it
        throw new Error(userMessage);
      } else {
        // Success
        setStatus('success');
        const successMessage = result.message || 'Customer contact created successfully in Wix!';
        setMessage(`✅ ${successMessage}${result.contactId ? ` (Contact ID: ${result.contactId})` : ''}`);
        
        // Close modal on success
        setIsModalOpen(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      }

    } catch (error) {
      console.error('Error creating Wix contact:', error);
      setStatus('error');
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create contact in Wix';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      setMessage(`❌ ${errorMessage}`);
      
      // Clear error message after 12 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 12000);
    } finally {
      setIsCreating(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    
    switch (status) {
      case 'success':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'error':
        // Check if message is about existing contact (409) - use amber instead of red
        const isInfoMessage = message && message.includes('already exists');
        return `${baseClasses} text-white ${isInfoMessage ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`;
      default:
        return `${baseClasses} text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed`;
    }
  };

  const getButtonText = () => {
    if (isCreating) return 'Creating...';
    if (status === 'success') return 'Created!';
    if (status === 'error') return 'Failed';
    return 'Create Customer in Wix';
  };

  const getButtonIcon = () => {
    if (isCreating) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      );
    }
    return <UserPlusIcon className="w-4 h-4 mr-2" />;
  };

  // Don't show button if essential customer data is missing
  const hasRequiredData = booking.first_name && booking.last_name && (booking.email || booking.phone);

  if (!hasRequiredData) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isCreating || booking.status === 'cancelled'}
          className={getButtonClasses()}
          title={
            booking.status === 'cancelled' 
              ? 'Cannot create contact for cancelled bookings' 
              : 'Create customer contact in Wix for invoicing'
          }
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
        
        {message && (
          <div className={`text-sm rounded-md p-2 ${
            status === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : status === 'error' 
                ? message.includes('already exists')
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
          <div className="flex items-start">
            <span className="flex-shrink-0">{message}</span>
          </div>
        </div>
        )}
        
        {booking.status === 'cancelled' && (
          <p className="text-xs text-gray-500">
            Cancelled bookings cannot create contacts in Wix
          </p>
        )}
      </div>

      <CreateWixCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreateContact}
        booking={booking}
        serviceDetails={undefined}
      />
    </>
  );
}

