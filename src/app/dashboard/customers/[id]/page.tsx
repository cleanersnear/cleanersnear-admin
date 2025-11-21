'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface WixContact {
  id: string;
  revision: number;
  createdDate: string;
  updatedDate: string;
  lastActivity?: {
    activityDate: string;
    activityType: string;
  };
  primaryInfo?: {
    email?: string;
    phone?: string;
  };
  picture?: {
    id?: string;
    url?: string;
  };
  info?: {
    name?: {
      first?: string;
      last?: string;
      prefix?: string;
      suffix?: string;
    };
    emails?: {
      items?: Array<{
        id?: string;
        email: string;
        tag?: string;
        primary?: boolean;
      }>;
    };
    phones?: {
      items?: Array<{
        id?: string;
        phone: string;
        tag?: string;
        countryCode?: string;
        primary?: boolean;
      }>;
    };
    addresses?: {
      items?: Array<{
        id?: string;
        tag?: string;
        address?: {
          addressLine?: string;
          addressLine2?: string;
          city?: string;
          subdivision?: string;
          postalCode?: string;
          country?: string;
        };
      }>;
    };
    company?: string;
    jobTitle?: string;
    birthdate?: string;
    locale?: string;
  };
  source?: {
    sourceType?: string;
    appId?: string;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<WixContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactDetails = useCallback(async () => {
    if (!contactId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wix/contacts/${contactId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.userMessage || result.error || 'Failed to fetch contact details');
      }
      
      setContact(result.contact || result);
    } catch (err) {
      console.error('Error fetching contact details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contact details');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContactDetails();
  }, [fetchContactDetails]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContactName = () => {
    const name = contact?.info?.name;
    if (name?.first && name?.last) {
      return `${name.first} ${name.last}`;
    }
    if (name?.first) return name.first;
    if (name?.last) return name.last;
    return contact?.primaryInfo?.email || 'Unknown';
  };

  const getFullName = () => {
    const name = contact?.info?.name;
    const parts = [
      name?.prefix,
      name?.first,
      name?.last,
      name?.suffix
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : getContactName();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error || 'Contact not found'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3 sm:mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Customers
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {contact.picture?.url ? (
                  <Image 
                    src={contact.picture.url} 
                    alt={getContactName()} 
                    width={64}
                    height={64}
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-indigo-600 font-medium text-lg sm:text-2xl">
                    {getContactName().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {getFullName()}
                </h1>
                {contact.info?.jobTitle && (
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{contact.info.jobTitle}</p>
                )}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Created {formatDate(contact.createdDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="space-y-3 sm:space-y-4">
                {/* Emails */}
                {contact.info?.emails?.items && contact.info.emails.items.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Email Addresses</dt>
                    <dd className="space-y-2">
                      {contact.info.emails.items.map((email, index) => (
                        <div key={email.id || index} className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="break-all">{email.email}</span>
                          {email.tag && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {email.tag}
                            </span>
                          )}
                          {email.primary && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}

                {/* Phones */}
                {contact.info?.phones?.items && contact.info.phones.items.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Phone Numbers</dt>
                    <dd className="space-y-2">
                      {contact.info.phones.items.map((phone, index) => (
                        <div key={phone.id || index} className="flex items-center text-sm text-gray-900">
                          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span>
                            {phone.countryCode && `+${phone.countryCode} `}
                            {phone.phone}
                          </span>
                          {phone.tag && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {phone.tag}
                            </span>
                          )}
                          {phone.primary && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}

                {/* Addresses */}
                {contact.info?.addresses?.items && contact.info.addresses.items.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Addresses</dt>
                    <dd className="space-y-3">
                      {contact.info.addresses.items.map((addr, index) => (
                        <div key={addr.id || index} className="flex items-start">
                          <MapPinIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 text-sm text-gray-900">
                            {addr.tag && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                {addr.tag}
                              </span>
                            )}
                            <div className="mt-1">
                              {addr.address?.addressLine && <div>{addr.address.addressLine}</div>}
                              {addr.address?.addressLine2 && <div>{addr.address.addressLine2}</div>}
                              <div>
                                {[
                                  addr.address?.city,
                                  addr.address?.subdivision,
                                  addr.address?.postalCode
                                ].filter(Boolean).join(', ')}
                              </div>
                              {addr.address?.country && <div>{addr.address.country}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Company Information */}
            {(contact.info?.company || contact.info?.jobTitle) && (
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <dl className="space-y-3">
                  {contact.info?.company && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Company</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {contact.info.company}
                      </dd>
                    </div>
                  )}
                  {contact.info?.jobTitle && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {contact.info.jobTitle}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{contact.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(contact.createdDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(contact.updatedDate)}
                  </dd>
                </div>
                {contact.lastActivity && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(contact.lastActivity.activityDate)}
                    </dd>
                  </div>
                )}
                {contact.info?.birthdate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Birthdate</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(contact.info.birthdate).toLocaleDateString('en-AU')}
                    </dd>
                  </div>
                )}
                {contact.info?.locale && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Locale</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contact.info.locale}</dd>
                  </div>
                )}
                {contact.source && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contact.source.sourceType || 'Unknown'}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

