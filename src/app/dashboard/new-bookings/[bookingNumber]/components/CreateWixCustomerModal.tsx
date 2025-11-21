'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  } from '@heroicons/react/24/outline';

interface PricingData {
  totalPrice?: number;
  [key: string]: number | string | boolean | undefined;
}

interface ServiceDetails {
  id: number;
  duration?: string;
  special_requests?: string;
  [key: string]: string | number | boolean | undefined;
}

interface WixContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneType: string;
  phoneCountryCode: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  addressType: string;
}

interface CreateWixCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contactData: WixContactData) => Promise<void>;
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
  serviceDetails?: ServiceDetails;
}

const PHONE_TYPES = [
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'HOME', label: 'Home' },
  { value: 'WORK', label: 'Work' },
  { value: 'FAX', label: 'Fax' },
  { value: 'OTHER', label: 'Other' },
];

const ADDRESS_TYPES = [
  { value: 'HOME', label: 'Home' },
  { value: 'WORK', label: 'Work' },
  { value: 'OTHER', label: 'Other' },
];

const COUNTRY_CODES = [
  { value: 'AU', label: 'AU +61', code: '+61' },
  { value: 'US', label: 'US +1', code: '+1' },
  { value: 'GB', label: 'GB +44', code: '+44' },
  { value: 'NZ', label: 'NZ +64', code: '+64' },
];

const AUSTRALIAN_STATES = [
  'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'
];

export default function CreateWixCustomerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking  
}: CreateWixCustomerModalProps) {
  const [contactData, setContactData] = useState<WixContactData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneType: 'MOBILE',
    phoneCountryCode: 'AU',
    address: '',
    addressLine2: '',
    city: '',
    state: 'VIC',
    postcode: '',
    country: 'AU',
    addressType: 'HOME',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && booking) {
      // Initialize contact data from booking
      const fullAddress = booking.address || '';
      const addressParts = fullAddress.split(',').map(p => p.trim());
      
      setContactData({
        firstName: booking.first_name || '',
        lastName: booking.last_name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        phoneType: 'MOBILE',
        phoneCountryCode: 'AU',
        address: addressParts[0] || booking.address || '',
        addressLine2: '',
        city: booking.suburb || '',
        state: 'VIC', // Default to Victoria
        postcode: booking.postcode || '',
        country: 'AU', // Default to Australia
        addressType: 'HOME',
      });
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!contactData.firstName || !contactData.lastName) {
      setError('First name and last name are required');
      return;
    }

    if (!contactData.email && !contactData.phone) {
      setError('At least email or phone number is required');
      return;
    }

    if (contactData.email && !contactData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(contactData);
      // Parent will close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contact';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof WixContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Create a new contact
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isLoading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={contactData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="First name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                  <input
                    type="text"
                    value={contactData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Last name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                </div>
              </div>

              {/* Primary Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  Primary email
                  <span className="ml-2 text-blue-600 cursor-help" title="Required for creating customer contact">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                </label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Email"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Primary Phone */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  Primary phone
                  <span className="ml-2 text-blue-600 cursor-help" title="Required for contact">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={contactData.phoneType}
                    onChange={(e) => updateField('phoneType', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    {PHONE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <select
                    value={contactData.phoneCountryCode}
                    onChange={(e) => updateField('phoneCountryCode', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    {COUNTRY_CODES.map(code => (
                      <option key={code.value} value={code.value}>{code.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="Phone"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="space-y-3">
                  <select
                    value={contactData.addressType}
                    onChange={(e) => updateField('addressType', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    {ADDRESS_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={contactData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Street"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  <input
                    type="text"
                    value={contactData.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                    placeholder="Street line 2 (Optional)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contactData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                    <input
                      type="text"
                      value={contactData.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      placeholder="Zip/ Postal code"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={contactData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="AU">Australia</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="NZ">New Zealand</option>
                    </select>
                    {contactData.country === 'AU' && (
                      <select
                        value={contactData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      >
                        {AUSTRALIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { WixContactData };

