'use client';

import { useState, useEffect, useCallback } from 'react';
import { newBookingService } from '@/config/newDatabase';

interface ServiceDetailsSectionProps {
  serviceType: string;
  serviceDetailsId: number;
}

interface ServiceDetails {
  id?: string | number;
  special_requests?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export default function ServiceDetailsSection({ serviceType, serviceDetailsId }: ServiceDetailsSectionProps) {
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await newBookingService.getServiceDetails(serviceType, serviceDetailsId);
      setServiceDetails(data);
    } catch (err) {
      console.error('Error fetching service details:', err);
      setError('Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  }, [serviceType, serviceDetailsId]);

  useEffect(() => {
    if (serviceDetailsId) {
      fetchServiceDetails();
    }
  }, [serviceDetailsId, fetchServiceDetails]);

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  const formatFieldValue = (key: string, value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle special field formatting
    if (key === 'duration' && typeof value === 'string') {
      return value.replace('hours', 'hours');
    }
    
    if (key === 'frequency' && typeof value === 'string') {
      return value.replace(/([A-Z])/g, ' $1').trim();
    }
    
    if (key === 'business_type' && typeof value === 'string') {
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
      return typeMap[value] || value;
    }
    
    if (key === 'home_size' && typeof value === 'string') {
      return value.replace(/([0-9]+)/g, '$1 Bedroom').replace('Studio', 'Studio');
    }
    
    return String(value);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Regular Cleaning':
        return '🧹';
      case 'Once-Off Cleaning':
        return '✨';
      case 'NDIS Cleaning':
        return '♿';
      case 'End of Lease Cleaning':
        return '🏠';
      case 'Airbnb Cleaning':
        return '🏨';
      case 'Commercial Cleaning':
        return '🏢';
      default:
        return '🔧';
    }
  };

  const getServiceDescription = (serviceType: string) => {
    switch (serviceType) {
      case 'Regular Cleaning':
        return 'Regular house cleaning service with scheduled frequency';
      case 'Once-Off Cleaning':
        return 'One-time deep cleaning service';
      case 'NDIS Cleaning':
        return 'Specialized cleaning service for NDIS participants';
      case 'End of Lease Cleaning':
        return 'Comprehensive end of lease cleaning service';
      case 'Airbnb Cleaning':
        return 'Professional Airbnb property cleaning service';
      case 'Commercial Cleaning':
        return 'Business and commercial cleaning service';
      default:
        return 'Professional cleaning service';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
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
            <h3 className="text-sm font-medium text-red-800">Error loading service details</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceDetails) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">No service details available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">{getServiceIcon(serviceType)}</span>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{serviceType}</h3>
          <p className="text-sm text-gray-500">{getServiceDescription(serviceType)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Object.entries(serviceDetails).map(([key, value]) => {
          if (key === 'id' || value === null || value === undefined) return null;
          
          const formattedKey = formatFieldName(key);
          const formattedValue = formatFieldValue(key, value);
          
          return (
            <div key={key}>
              <dt className="text-sm font-medium text-gray-500">{formattedKey}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {typeof value === 'boolean' ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formattedValue}
                  </span>
                ) : (
                  formattedValue
                )}
              </dd>
            </div>
          );
        })}
      </div>

      {serviceDetails.special_requests && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <dt className="text-sm font-medium text-gray-500 mb-2">Special Requests</dt>
          <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
            {serviceDetails.special_requests}
          </dd>
        </div>
      )}
    </div>
  );
}
