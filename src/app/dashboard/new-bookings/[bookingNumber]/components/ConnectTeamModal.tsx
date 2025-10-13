'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ConnectTeamService, ConnectTeamShift } from '@/config/connectTeam';

// ConnectTeam jobs data (ACTIVE jobs only, excluding Admin)
const CONNECTTEAM_JOBS = [
  { jobId: 'a24f5f56-46b2-31f5-0762-cfd4bd7a9e09', title: 'Airbnb-cleaning', code: '004' },
  { jobId: '64dd29fd-4180-77f1-e412-f12afcb11e4d', title: 'Commercial-cleaning', code: '006' },
  { jobId: '5e96bd16-9b3e-92f6-4fa6-40be582bca86', title: 'End-of-lease-cleaning', code: '005' },
  { jobId: 'bc294374-448c-9622-2ce5-32a1ce5fbafd', title: 'Ndis-cleaning', code: '003' },
  { jobId: '1e309de6-95cd-c3ec-7442-4e8124a4b89c', title: 'Once-off-cleaning', code: '002' },
  { jobId: 'ec3ae2a7-95b9-29a3-c0bb-6c2ef9d7f575', title: 'Regular-cleaning', code: '001' },
];

// Helper function to get job title from ID
const getJobTitleFromId = (jobId: string): string => {
  const job = CONNECTTEAM_JOBS.find(j => j.jobId === jobId);
  return job ? job.title : '';
};

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

interface ConnectTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shiftData: ConnectTeamShift) => Promise<void>;
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

export default function ConnectTeamModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking, 
  serviceDetails 
}: ConnectTeamModalProps) {
  const [shiftData, setShiftData] = useState<ConnectTeamShift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedStartTime, setEditedStartTime] = useState<string>('');
  const [editedEndTime, setEditedEndTime] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  useEffect(() => {
    if (isOpen && booking) {
      try {
        const formattedShiftData = ConnectTeamService.formatShiftData(booking, serviceDetails);
        setShiftData(formattedShiftData);
        setEditedStartTime(formattedShiftData.start_time);
        setEditedEndTime(formattedShiftData.end_time);
        setEditedNotes(formattedShiftData.notes);
        setSelectedJobId(ConnectTeamService.mapServiceToJobIdStatic(booking.selected_service) || '');
        setError(null);
      } catch (err) {
        setError('Failed to format shift data');
        console.error('Error formatting shift data:', err);
      }
    }
  }, [isOpen, booking, serviceDetails]);

  const handleConfirm = async () => {
    if (!shiftData) return;
    
    // Validate times
    if (!editedStartTime || !editedEndTime) {
      setError('Please provide both start and end times');
      return;
    }

    // Create updated shift data with edited times, notes, and job
    const updatedShiftData = {
      ...shiftData,
      start_time: editedStartTime,
      end_time: editedEndTime,
      notes: editedNotes,
      job: selectedJobId ? getJobTitleFromId(selectedJobId) : shiftData.job,
      customJobId: selectedJobId || undefined
    };
    
    setIsLoading(true);
    try {
      await onConfirm(updatedShiftData);
    } catch (err) {
      console.error('Error confirming shift creation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                Upload to ConnectTeam
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Review shift details before creating in ConnectTeam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 flex-shrink-0 ml-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {shiftData ? (
            <div className="space-y-6">
              {/* Shift Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Shift Preview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(shiftData.date)}
                      </span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <ClockIcon className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-600 block mb-2">Time:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={editedStartTime}
                              onChange={(e) => setEditedStartTime(e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Time</label>
                            <input
                              type="time"
                              value={editedEndTime}
                              onChange={(e) => setEditedEndTime(e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Shift Title:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {shiftData.shift_title}
                      </span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <BriefcaseIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-600 block mb-2">Job Category:</span>
                        <select
                          value={selectedJobId}
                          onChange={(e) => setSelectedJobId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Auto-select based on service</option>
                          {CONNECTTEAM_JOBS.map((job) => (
                            <option key={job.jobId} value={job.jobId}>
                              {job.title}{job.code ? ` (${job.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-600">Address:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {shiftData.address}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-600">Users can claim:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {shiftData.enable_users_to_claim ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {shiftData.enable_users_to_claim && (
                        <>
                          <div className="flex items-center space-x-2 ml-6">
                            <CheckCircleIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-600">Open spots:</span>
                            <span className="text-sm font-medium text-gray-900">3</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-6">
                            <CheckCircleIcon className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-gray-600">Admin approval required:</span>
                            <span className="text-sm font-medium text-gray-900">Yes</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-600">Does not repeat:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {shiftData.does_not_repeat ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-start space-x-2">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600 block mb-2">Notes:</span>
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
                        placeholder="Enter shift notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Reference */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Booking Reference</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Booking Number:</span>
                    <span className="font-medium text-blue-900 ml-2">{booking.booking_number}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Customer:</span>
                    <span className="font-medium text-blue-900 ml-2">
                      {booking.first_name} {booking.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Email:</span>
                    <span className="font-medium text-blue-900 ml-2">{booking.email}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Phone:</span>
                    <span className="font-medium text-blue-900 ml-2">{booking.phone}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Price:</span>
                    <span className="font-medium text-blue-900 ml-2">
                      {formatCurrency(booking.total_price || booking.pricing?.totalPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Status:</span>
                    <span className="font-medium text-blue-900 ml-2 capitalize">{booking.status}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This will create a new shift in ConnectTeam with the details shown above. 
                      Users will be notified and can claim this shift if enabled.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="order-2 sm:order-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!shiftData || isLoading}
            className="order-1 sm:order-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Shift...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Create Shift in ConnectTeam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
