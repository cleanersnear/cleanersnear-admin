'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  GlobeAltIcon, 
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface WixContact {
  id: string;
  revision: number;
  createdDate: string;
  updatedDate: string;
  primaryInfo?: {
    email?: string;
    phone?: string;
  };
  info?: {
    name?: {
      first?: string;
      last?: string;
    };
    emails?: {
      items?: Array<{
        email: string;
        tag?: string;
        primary?: boolean;
      }>;
    };
    phones?: {
      items?: Array<{
        phone: string;
        tag?: string;
        countryCode?: string;
        primary?: boolean;
      }>;
    };
    addresses?: {
      items?: Array<{
        address?: {
          city?: string;
          country?: string;
          postalCode?: string;
          addressLine?: string;
        };
      }>;
    };
    company?: string;
    jobTitle?: string;
  };
}

type TabType = 'website' | 'wix';

export default function CustomersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('website');
  const [wixContacts, setWixContacts] = useState<WixContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchWixContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/wix/list-contacts?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.userMessage || result.error || 'Failed to fetch Wix contacts');
      }

      setWixContacts(result.contacts || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error('Error fetching Wix contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Wix contacts');
      setWixContacts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'wix') {
      fetchWixContacts();
    }
  }, [activeTab, fetchWixContacts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'wix') {
      fetchWixContacts();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getContactName = (contact: WixContact) => {
    const name = contact.info?.name;
    if (name?.first && name?.last) {
      return `${name.first} ${name.last}`;
    }
    if (name?.first) return name.first;
    if (name?.last) return name.last;
    return contact.primaryInfo?.email || 'Unknown';
  };

  const getPrimaryEmail = (contact: WixContact) => {
    return contact.primaryInfo?.email || 
           contact.info?.emails?.items?.find(e => e.primary)?.email ||
           contact.info?.emails?.items?.[0]?.email ||
           'No email';
  };

  const getPrimaryPhone = (contact: WixContact) => {
    return contact.primaryInfo?.phone ||
           contact.info?.phones?.items?.find(p => p.primary)?.phone ||
           contact.info?.phones?.items?.[0]?.phone ||
           'No phone';
  };

  const getAddress = (contact: WixContact) => {
    const address = contact.info?.addresses?.items?.[0]?.address;
    if (!address) return 'No address';
    
    const parts = [
      address.addressLine,
      address.city,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-indigo-600" />
            Customer Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your website customers and Wix contacts
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('website')}
                className={`
                  group inline-flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                  ${activeTab === 'website'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Website </span>Customers
                <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-900 py-0.5 px-1.5 sm:px-2.5 rounded-full text-xs font-medium">
                  Soon
                </span>
              </button>
              <button
                onClick={() => setActiveTab('wix')}
                className={`
                  group inline-flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                  ${activeTab === 'wix'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <BuildingStorefrontIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Wix </span>Clients
                {totalCount > 0 && (
                  <span className="ml-1 sm:ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-1.5 sm:px-2.5 rounded-full text-xs font-medium">
                    {totalCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'website' && (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
                <span className="text-5xl">👥</span>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Website Customer Management
                </h2>
                <p className="max-w-md text-sm text-slate-600">
                  We&apos;re rebuilding customer insights and tooling. Check back soon for streamlined management of your client list.
                </p>
              </div>
            )}

            {activeTab === 'wix' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Wix contacts..."
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 sm:px-4 py-2 border"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        fetchWixContacts();
                      }}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <span className="sm:hidden">Clear</span>
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                    <button
                      type="button"
                      onClick={fetchWixContacts}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      title="Refresh"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </form>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                )}

                {/* Contacts List */}
                {!loading && !error && (
                  <>
                    {wixContacts.length === 0 ? (
                      <div className="text-center py-12">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchQuery 
                            ? 'Try adjusting your search criteria.'
                            : 'No Wix contacts found. Create contacts from your bookings to get started.'
                          }
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-3">
                          {wixContacts.map((contact) => (
                            <div 
                              key={contact.id} 
                              onClick={() => router.push(`/dashboard/customers/${contact.id}`)}
                              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-indigo-600 font-medium text-sm">
                                    {getContactName(contact).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {getContactName(contact)}
                                  </div>
                                  {contact.info?.jobTitle && (
                                    <div className="text-xs text-gray-500 truncate">{contact.info.jobTitle}</div>
                                  )}
                                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center truncate">
                                      <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{getPrimaryEmail(contact)}</span>
                                    </div>
                                    <div className="flex items-center truncate">
                                      <PhoneIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{getPrimaryPhone(contact)}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                      <span className="line-clamp-2">{getAddress(contact)}</span>
                                    </div>
                                  </div>
                                  {contact.info?.company && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      {contact.info.company}
                                    </div>
                                  )}
                                  <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <ClockIcon className="w-3 h-3 mr-1" />
                                    {formatDate(contact.createdDate)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                  Name
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Email
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Phone
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Address
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Company
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Created
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {wixContacts.map((contact) => (
                                <tr 
                                  key={contact.id} 
                                  onClick={() => router.push(`/dashboard/customers/${contact.id}`)}
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                        <span className="text-indigo-600 font-medium text-xs">
                                          {getContactName(contact).charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium">{getContactName(contact)}</div>
                                        {contact.info?.jobTitle && (
                                          <div className="text-xs text-gray-500">{contact.info.jobTitle}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                                      {getPrimaryEmail(contact)}
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                                      {getPrimaryPhone(contact)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-500">
                                    <div className="flex items-center max-w-xs">
                                      <MapPinIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{getAddress(contact)}</span>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {contact.info?.company || '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                                      {formatDate(contact.createdDate)}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
