'use client';

import { useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import ConnectTeamModal from './ConnectTeamModal';
import { ConnectTeamShift } from '@/config/connectTeam';

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

interface ConnectTeamButtonProps {
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

export default function ConnectTeamButton({ booking, serviceDetails }: ConnectTeamButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleUpload = async (shiftData: ConnectTeamShift) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      const response = await fetch('/api/connectteam/create-shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          shiftData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create shift in ConnectTeam');
      }

      setUploadStatus('success');
      setUploadMessage(`✅ Shift created successfully in ConnectTeam! Shift ID: ${result.shiftId || 'N/A'}`);
      setIsModalOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);

    } catch (error) {
      console.error('Error uploading to ConnectTeam:', error);
      setUploadStatus('error');
      setUploadMessage(`❌ Failed to create shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear error message after 10 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 10000);
    } finally {
      setIsUploading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    
    switch (uploadStatus) {
      case 'success':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'error':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`;
    }
  };

  const getButtonText = () => {
    if (isUploading) return 'Uploading...';
    if (uploadStatus === 'success') return 'Uploaded!';
    if (uploadStatus === 'error') return 'Upload Failed';
    return 'Upload to ConnectTeam';
  };

  const getButtonIcon = () => {
    if (isUploading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      );
    }
    return <CloudArrowUpIcon className="w-4 h-4 mr-2" />;
  };

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isUploading || booking.status === 'cancelled'}
          className={getButtonClasses()}
          title={
            booking.status === 'cancelled' 
              ? 'Cannot upload cancelled bookings' 
              : 'Upload booking to ConnectTeam calendar'
          }
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
        
        {uploadMessage && (
          <div className={`text-sm ${
            uploadStatus === 'success' 
              ? 'text-green-600' 
              : uploadStatus === 'error' 
                ? 'text-red-600' 
                : 'text-gray-600'
          }`}>
            {uploadMessage}
          </div>
        )}
        
        {booking.status === 'cancelled' && (
          <p className="text-xs text-gray-500">
            Cancelled bookings cannot be uploaded to ConnectTeam
          </p>
        )}
      </div>

      <ConnectTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleUpload}
        booking={booking}
        serviceDetails={serviceDetails}
      />
    </>
  );
}
