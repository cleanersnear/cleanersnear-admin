'use client';

import { useState, useEffect } from 'react';
import { newBookingService } from '@/config/newDatabase';
import {
  isValidServiceType,
  requiresCustomerDetails,
  getCustomerDetailTableName,
} from '@/types/booking-services';

interface ServiceDetailsEditorProps {
  serviceType: string;
  serviceDetailsId: number;
  customerId: string;
  onUpdate: () => void;
}

export default function ServiceDetailsEditor({
  serviceType,
  serviceDetailsId,
  customerId,
  onUpdate,
}: ServiceDetailsEditorProps) {
  const [serviceDetails, setServiceDetails] = useState<Record<string, unknown> | null>(null);
  const [customerExtension, setCustomerExtension] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch service-specific details
        const details = await newBookingService.getServiceDetails(serviceType, serviceDetailsId);
        setServiceDetails(details);

        // Fetch customer extension details if applicable
        if (requiresCustomerDetails(serviceType)) {
          const extension = await newBookingService.getCustomerDetailExtension(
            customerId,
            serviceType
          );
          setCustomerExtension(extension);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (serviceDetailsId && isValidServiceType(serviceType)) {
      fetchDetails();
    }
  }, [serviceType, serviceDetailsId, customerId]);

  const handleServiceDetailChange = (field: string, value: unknown) => {
    setServiceDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerExtensionChange = (field: string, value: unknown) => {
    setCustomerExtension((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatePromises = [];

      // Update service details (exclude system fields)
      if (serviceDetails) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, updated_at, ...updatableFields } = serviceDetails;
        if (Object.keys(updatableFields).length > 0) {
          updatePromises.push(
            newBookingService.updateServiceDetails(
              serviceType,
              serviceDetailsId,
              updatableFields
            )
          );
        }
      }

      // Update customer extension details if applicable
      if (customerExtension && requiresCustomerDetails(serviceType)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, customer_id, created_at, updated_at, ...updatableFields } =
          customerExtension;
        if (Object.keys(updatableFields).length > 0) {
          updatePromises.push(
            newBookingService.updateCustomerDetailExtension(
              serviceType,
              customerId,
              updatableFields
            )
          );
        }
      }

      await Promise.all(updatePromises);

      setSuccessMessage('Service details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      console.error('Error updating service details:', err);
      setError('Failed to update service details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error && !serviceDetails) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Service Details'}
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Service-specific fields */}
      {serviceDetails && (
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 border-b pb-2">
            {serviceType} Details
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(serviceDetails).map(([key, value]) => {
              // Skip system fields
              if (['id', 'created_at', 'updated_at'].includes(key)) {
                return null;
              }

              // Render based on field type
              if (typeof value === 'boolean') {
                return (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => handleServiceDetailChange(key, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                  </div>
                );
              }

              if (typeof value === 'number') {
                return (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="number"
                      id={key}
                      value={value}
                      onChange={(e) => handleServiceDetailChange(key, Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                );
              }

              // Text and textarea fields
              const isLongText = key === 'special_requests' || key === 'notes';
              return (
                <div key={key} className={isLongText ? 'sm:col-span-2' : ''}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {isLongText ? (
                    <textarea
                      id={key}
                      rows={3}
                      value={String(value || '')}
                      onChange={(e) => handleServiceDetailChange(key, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      id={key}
                      value={String(value || '')}
                      onChange={(e) => handleServiceDetailChange(key, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer extension fields (NDIS, Commercial, End of Lease) */}
      {customerExtension && requiresCustomerDetails(serviceType) && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700">
            {getCustomerDetailTableName(serviceType)?.replace(/_/g, ' ').replace('customer ', '')} Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(customerExtension).map(([key, value]) => {
              // Skip system fields
              if (['id', 'customer_id', 'created_at', 'updated_at'].includes(key)) {
                return null;
              }

              return (
                <div key={key}>
                  <label htmlFor={`ext_${key}`} className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    id={`ext_${key}`}
                    value={String(value || '')}
                    onChange={(e) => handleCustomerExtensionChange(key, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

