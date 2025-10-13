'use client';

import { useState, useEffect, useCallback } from 'react';
import { newBookingService } from '@/config/newDatabase';

interface CustomerSubDetailsProps {
  customerId: number;
}

interface NDISDetails {
  ndis_number?: string;
  plan_manager?: string;
}

interface CommercialDetails {
  business_name?: string;
  business_type?: string;
  abn?: string;
  contact_person?: string;
}

interface EndOfLeaseDetails {
  role?: string;
}

interface CustomerSubDetails {
  ndisDetails: NDISDetails | null;
  commercialDetails: CommercialDetails | null;
  endOfLeaseDetails: EndOfLeaseDetails | null;
}

export default function CustomerSubDetails({ customerId }: CustomerSubDetailsProps) {
  const [subDetails, setSubDetails] = useState<CustomerSubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerSubDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await newBookingService.getCustomerSubDetails(customerId);
      setSubDetails(data);
    } catch (err) {
      console.error('Error fetching customer sub-details:', err);
      setError('Failed to fetch additional details');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerSubDetails();
    }
  }, [customerId, fetchCustomerSubDetails]);

  const formatBusinessType = (businessType: string) => {
    const typeMap: { [key: string]: string } = {
      'office': 'Office',
      'retail': 'Retail',
      'agedCare': 'Aged Care',
      'educationChildCare': 'Education & Child Care',
      'government': 'Government',
      'medical': 'Medical & Healthcare',
      'gymFitness': 'Gym & Fitness',
      'restaurantHospitality': 'Restaurant & Hospitality',
      'warehouseIndustrial': 'Warehouse & Industrial',
      'other': 'Other'
    };
    return typeMap[businessType] || businessType;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading additional details</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!subDetails || (!subDetails.ndisDetails && !subDetails.commercialDetails && !subDetails.endOfLeaseDetails)) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">No additional customer details available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Additional Customer Details</h3>
      
      <div className="space-y-6">
        {/* NDIS Details */}
        {subDetails.ndisDetails && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">♿</span>
              <h4 className="text-md font-medium text-blue-900">NDIS Details</h4>
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {subDetails.ndisDetails.ndis_number && (
                <div>
                  <dt className="text-sm font-medium text-blue-700">NDIS Number</dt>
                  <dd className="text-sm text-blue-900 font-mono">{subDetails.ndisDetails.ndis_number}</dd>
                </div>
              )}
              {subDetails.ndisDetails.plan_manager && (
                <div>
                  <dt className="text-sm font-medium text-blue-700">Plan Manager</dt>
                  <dd className="text-sm text-blue-900">{subDetails.ndisDetails.plan_manager}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Commercial Details */}
        {subDetails.commercialDetails && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🏢</span>
              <h4 className="text-md font-medium text-green-900">Commercial Details</h4>
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {subDetails.commercialDetails.business_name && (
                <div>
                  <dt className="text-sm font-medium text-green-700">Business Name</dt>
                  <dd className="text-sm text-green-900 font-semibold">{subDetails.commercialDetails.business_name}</dd>
                </div>
              )}
              {subDetails.commercialDetails.business_type && (
                <div>
                  <dt className="text-sm font-medium text-green-700">Business Type</dt>
                  <dd className="text-sm text-green-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {formatBusinessType(subDetails.commercialDetails.business_type)}
                    </span>
                  </dd>
                </div>
              )}
              {subDetails.commercialDetails.abn && (
                <div>
                  <dt className="text-sm font-medium text-green-700">ABN</dt>
                  <dd className="text-sm text-green-900 font-mono">{subDetails.commercialDetails.abn}</dd>
                </div>
              )}
              {subDetails.commercialDetails.contact_person && (
                <div>
                  <dt className="text-sm font-medium text-green-700">Contact Person</dt>
                  <dd className="text-sm text-green-900">{subDetails.commercialDetails.contact_person}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* End of Lease Details */}
        {subDetails.endOfLeaseDetails && (
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🏠</span>
              <h4 className="text-md font-medium text-purple-900">End of Lease Details</h4>
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {subDetails.endOfLeaseDetails.role && (
                <div>
                  <dt className="text-sm font-medium text-purple-700">Role</dt>
                  <dd className="text-sm text-purple-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {subDetails.endOfLeaseDetails.role}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
