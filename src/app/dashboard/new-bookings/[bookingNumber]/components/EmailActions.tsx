'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  EnvelopeIcon, 
  XCircleIcon, 
  CheckCircleIcon, 
  ChatBubbleLeftRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import EmailPreviewModal from './EmailPreviewModal';

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
  pricing?: {
    totalPrice?: number;
    [key: string]: string | number | boolean | undefined;
  };
  service_details_id: number;
}

interface EmailActionsProps {
  booking: BookingDetail;
  serviceDetails?: Record<string, string | number | boolean>;
  onEmailSent?: () => void;
}

// Generate time slots from 7 AM to 6 PM in 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 18; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 18 && minute === 30) break; // Stop at 6:00 PM
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      const timeString = time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      slots.push(timeString);
    }
  }
  return slots;
};

export default function EmailActions({ booking, onEmailSent }: EmailActionsProps) {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [cancellationNotes, setCancellationNotes] = useState('');
  const [completedNotes, setCompletedNotes] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [currentEmailType, setCurrentEmailType] = useState<'confirmation' | 'cancellation' | 'completed' | 'feedback'>('confirmation');
  const [previewData, setPreviewData] = useState<{
    to: string;
    from: string;
    subject: string;
    bookingNumber: string;
    confirmedTime?: string;
    previewData: Record<string, string | number | boolean>;
    editedData?: Record<string, string | number | boolean>;
    cancellationNotes?: string;
    completedNotes?: string;
  } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeSlots = generateTimeSlots();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = () => {
    return `${booking.address}, ${booking.suburb} ${booking.postcode}`;
  };

  const getCustomerName = () => {
    return `${booking.first_name} ${booking.last_name}`;
  };

  const getTotalPrice = () => {
    return booking.total_price || booking.pricing?.totalPrice || 0;
  };

  const openConfirmationPreview = async () => {
    if (!selectedTime) {
      setEmailStatus({ type: 'error', message: 'Please select a time' });
      return;
    }
    if (!toEmail) {
      setEmailStatus({ type: 'error', message: 'Please enter recipient email' });
      return;
    }

    // Fetch from email from API
    let fromEmail = 'account@cleaningprofessionals.com.au';
    try {
      const response = await fetch('/api/bookings/get-email-config');
      if (response.ok) {
        const data = await response.json();
        fromEmail = data.fromEmail || fromEmail;
      }
    } catch {
      console.warn('Could not fetch email config, using default');
    }

    const priceValue = totalPrice || getTotalPrice();

    setCurrentEmailType('confirmation');
    setPreviewData({
      to: toEmail,
      from: fromEmail,
      subject: `Service Confirmed - ${booking.booking_number}`,
      bookingNumber: booking.booking_number,
      confirmedTime: selectedTime,
      previewData: {
        bookingNumber: booking.booking_number,
        customerName: getCustomerName(),
        serviceType: booking.selected_service,
        scheduledDate: formatDate(booking.schedule_date),
        scheduledTime: selectedTime,
        serviceAddress: formatAddress(),
        phone: booking.phone,
        totalPrice: priceValue,
      },
      editedData: {
        totalPrice: priceValue,
      }
    });
    setShowTimeModal(false);
    setShowPreviewModal(true);
  };

  const handleSendConfirmation = async (emailData: {
    to: string;
    from: string;
    subject: string;
    editedData?: Record<string, string | number | boolean>;
  }) => {
    setSending(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/bookings/send-confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingNumber: booking.booking_number,
          confirmedTime: selectedTime,
          confirmationNotes: confirmationNotes, // Save notes but don't send in email
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          editedData: emailData.editedData || {}, // Include edited template data (e.g., price)
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send confirmation email');
      }

      setEmailStatus({ 
        type: 'success', 
        message: 'Confirmation email sent successfully!' 
      });
      setShowPreviewModal(false);
      setSelectedTime('');
      onEmailSent?.();
      
      setTimeout(() => {
        setEmailStatus({ type: null, message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      setEmailStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send email' 
      });
    } finally {
      setSending(false);
    }
  };

  const openCancellationPreview = async () => {
    if (!toEmail) {
      setEmailStatus({ type: 'error', message: 'Please enter recipient email' });
      return;
    }

    const timeMatch = booking.notes?.match(/\[Confirmed Time: (.*?)\]/);
    const scheduledTime = timeMatch ? timeMatch[1] : 'To be confirmed';

    // Fetch from email from API
    let fromEmail = 'account@cleaningprofessionals.com.au';
    try {
      const response = await fetch('/api/bookings/get-email-config');
      if (response.ok) {
        const data = await response.json();
        fromEmail = data.fromEmail || fromEmail;
      }
    } catch {
      console.warn('Could not fetch email config, using default');
    }

    const priceValue = totalPrice || getTotalPrice();

    setCurrentEmailType('cancellation');
    setPreviewData({
      to: toEmail,
      from: fromEmail,
      subject: `Booking Cancelled - ${booking.booking_number}`,
      bookingNumber: booking.booking_number,
      previewData: {
        bookingNumber: booking.booking_number,
        customerName: getCustomerName(),
        serviceType: booking.selected_service,
        scheduledDate: formatDate(booking.schedule_date),
        scheduledTime: scheduledTime,
        phone: booking.phone,
        totalPrice: priceValue,
      },
      editedData: {
        totalPrice: priceValue,
      },
      cancellationNotes: cancellationNotes,
    });
    setShowCancellationModal(false);
    setShowPreviewModal(true);
  };

  const handleSendCancellation = async (emailData: {
    to: string;
    from: string;
    subject: string;
    customMessage?: string;
    editedData?: Record<string, string | number | boolean>;
  }) => {
    setSending(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/bookings/send-cancellation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingNumber: booking.booking_number,
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          customMessage: emailData.customMessage,
          editedData: emailData.editedData || {}, // Include edited template data (e.g., price)
          cancellationNotes: previewData?.cancellationNotes || cancellationNotes, // Save notes but don't send in email
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send cancellation email');
      }

      setEmailStatus({ 
        type: 'success', 
        message: 'Cancellation email sent successfully!' 
      });
      setShowPreviewModal(false);
      onEmailSent?.();
      
      setTimeout(() => {
        setEmailStatus({ type: null, message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      setEmailStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send email' 
      });
    } finally {
      setSending(false);
    }
  };

  const openCompletedPreview = async () => {
    if (!toEmail) {
      setEmailStatus({ type: 'error', message: 'Please enter recipient email' });
      return;
    }

    const timeMatch = booking.notes?.match(/\[Confirmed Time: (.*?)\]/);
    const scheduledTime = timeMatch ? timeMatch[1] : 'N/A';

    // Fetch from email from API
    let fromEmail = 'account@cleaningprofessionals.com.au';
    try {
      const response = await fetch('/api/bookings/get-email-config');
      if (response.ok) {
        const data = await response.json();
        fromEmail = data.fromEmail || fromEmail;
      }
    } catch {
      console.warn('Could not fetch email config, using default');
    }

    const priceValue = totalPrice || getTotalPrice();

    setCurrentEmailType('completed');
    setPreviewData({
      to: toEmail,
      from: fromEmail,
      subject: `Service Completed - ${booking.booking_number}`,
      bookingNumber: booking.booking_number,
      previewData: {
        bookingNumber: booking.booking_number,
        customerName: getCustomerName(),
        serviceType: booking.selected_service,
        scheduledDate: formatDate(booking.schedule_date),
        scheduledTime: scheduledTime,
        serviceAddress: formatAddress(),
        phone: booking.phone,
        totalPrice: priceValue,
      },
      editedData: {
        totalPrice: priceValue,
      },
      completedNotes: completedNotes,
    });
    setShowCompletedModal(false);
    setShowPreviewModal(true);
  };

  const handleSendCompleted = async (emailData: {
    to: string;
    from: string;
    subject: string;
    customMessage?: string;
    editedData?: Record<string, string | number | boolean>;
  }) => {
    setSending(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/bookings/send-completed-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingNumber: booking.booking_number,
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          customMessage: emailData.customMessage,
          editedData: emailData.editedData || {}, // Include edited template data (e.g., price)
          completedNotes: previewData?.completedNotes || completedNotes, // Save notes but don't send in email
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send completion email');
      }

      setEmailStatus({ 
        type: 'success', 
        message: 'Completion email sent successfully!' 
      });
      setShowPreviewModal(false);
      onEmailSent?.();
      
      setTimeout(() => {
        setEmailStatus({ type: null, message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error sending completion email:', error);
      setEmailStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send email' 
      });
    } finally {
      setSending(false);
    }
  };

  const openFeedbackPreview = async () => {
    // Reset and set default values
    setToEmail(booking.email);
    setTotalPrice(String(getTotalPrice()));

    // Fetch from email from API
    let fromEmail = 'account@cleaningprofessionals.com.au';
    try {
      const response = await fetch('/api/bookings/get-email-config');
      if (response.ok) {
        const data = await response.json();
        fromEmail = data.fromEmail || fromEmail;
      }
    } catch {
      console.warn('Could not fetch email config, using default');
    }

    setCurrentEmailType('feedback');
    setPreviewData({
      to: toEmail || booking.email,
      from: fromEmail,
      subject: `We'd Love Your Feedback - ${booking.booking_number}`,
      bookingNumber: booking.booking_number,
      previewData: {
        bookingNumber: booking.booking_number,
        customerName: getCustomerName(),
        serviceType: booking.selected_service,
      },
      editedData: {}
    });
    setShowPreviewModal(true);
  };

  const handleSendFeedback = async (emailData: {
    to: string;
    from: string;
    subject: string;
    customMessage?: string;
    editedData?: Record<string, string | number | boolean>;
  }) => {
    setSending(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/bookings/send-feedback-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingNumber: booking.booking_number,
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          customMessage: emailData.customMessage,
          editedData: emailData.editedData || {}, // Include edited template data (e.g., price)
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send feedback email');
      }

      setEmailStatus({ 
        type: 'success', 
        message: 'Feedback request email sent successfully!' 
      });
      setShowPreviewModal(false);
      onEmailSent?.();
      
      setTimeout(() => {
        setEmailStatus({ type: null, message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error sending feedback email:', error);
      setEmailStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send email' 
      });
    } finally {
      setSending(false);
    }
  };

  const handleEmailSend = (emailData: {
    to: string;
    from: string;
    subject: string;
    customMessage?: string;
    editedData?: Record<string, string | number | boolean>;
  }) => {
    switch (currentEmailType) {
      case 'confirmation':
        handleSendConfirmation(emailData);
        break;
      case 'cancellation':
        handleSendCancellation(emailData);
        break;
      case 'completed':
        handleSendCompleted(emailData);
        break;
      case 'feedback':
        handleSendFeedback(emailData);
        break;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Email Actions</h3>
      
      {/* Status Messages */}
      {emailStatus.type && (
        <div className={`mb-4 p-4 rounded-md ${
          emailStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {emailStatus.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm ${
                emailStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {emailStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Action Buttons - Mobile Dropdown / Desktop Buttons */}
      <div className="relative" ref={dropdownRef}>
        {/* Mobile: Dropdown Menu */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={sending}
            className="w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span className="flex items-center">
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Email Actions
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowTimeModal(true);
                  }}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2 text-indigo-600" />
                  Send Confirmation
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setToEmail(booking.email);
                    setTotalPrice(String(getTotalPrice()));
                    setCancellationNotes('');
                    setShowCancellationModal(true);
                  }}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4 mr-2 text-red-600" />
                  Send Cancellation
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setToEmail(booking.email);
                    setTotalPrice(String(getTotalPrice()));
                    setCompletedNotes('');
                    setShowCompletedModal(true);
                  }}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-600" />
                  Mark Complete
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    openFeedbackPreview();
                  }}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Send Feedback
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Full Buttons */}
        <div className="hidden sm:block space-y-3">
          <button
            onClick={() => {
              setToEmail(booking.email);
              setTotalPrice(String(getTotalPrice()));
              setShowTimeModal(true);
            }}
            disabled={sending}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            Send Confirmation Email
          </button>

          <button
            onClick={() => {
              setToEmail(booking.email);
              setTotalPrice(String(getTotalPrice()));
              setCancellationNotes('');
              setShowCancellationModal(true);
            }}
            disabled={sending}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircleIcon className="w-5 h-5 mr-2" />
            Send Cancellation Email
          </button>

          <button
            onClick={() => {
              setToEmail(booking.email);
              setTotalPrice(String(getTotalPrice()));
              setCompletedNotes('');
              setShowCompletedModal(true);
            }}
            disabled={sending}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Mark Complete & Send Email
          </button>

          <button
            onClick={openFeedbackPreview}
            disabled={sending}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Send Feedback Request
          </button>
        </div>
      </div>

      {/* Time Selection Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Confirmation Time
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose the confirmed appointment time for this booking:
              </p>
              
              {/* Time Slot Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Time *
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a time...</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Email *
                </label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Total Price */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price
                </label>
                <input
                  type="text"
                  value={totalPrice}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Allow numbers and decimal point
                    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                      setTotalPrice(newValue);
                    }
                  }}
                  placeholder={String(getTotalPrice())}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Confirmation Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Notes (Optional)
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for the customer..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes will be saved to booking notes (not sent in email)
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTimeModal(false);
                    setSelectedTime('');
                    setToEmail(booking.email);
                    setTotalPrice(String(getTotalPrice()));
                    setConfirmationNotes('');
                  }}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openConfirmationPreview}
                  disabled={!selectedTime || !toEmail}
                  className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Cancellation Email
              </h3>
              
              {/* To Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Email *
                </label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Total Price */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price
                </label>
                <input
                  type="text"
                  value={totalPrice}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                      setTotalPrice(newValue);
                    }
                  }}
                  placeholder={String(getTotalPrice())}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Cancellation Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Notes (Optional)
                </label>
                <textarea
                  value={cancellationNotes}
                  onChange={(e) => setCancellationNotes(e.target.value)}
                  placeholder="Add any notes about the cancellation..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes will be saved to booking notes (not sent in email)
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancellationModal(false);
                    setToEmail(booking.email);
                    setTotalPrice(String(getTotalPrice()));
                    setCancellationNotes('');
                  }}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openCancellationPreview}
                  disabled={!toEmail}
                  className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mark Complete & Send Email
              </h3>
              
              {/* To Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Email *
                </label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Total Price */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price
                </label>
                <input
                  type="text"
                  value={totalPrice}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                      setTotalPrice(newValue);
                    }
                  }}
                  placeholder={String(getTotalPrice())}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Completed Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completedNotes}
                  onChange={(e) => setCompletedNotes(e.target.value)}
                  placeholder="Add any notes about the completion..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes will be saved to booking notes (not sent in email)
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompletedModal(false);
                    setToEmail(booking.email);
                    setTotalPrice(String(getTotalPrice()));
                    setCompletedNotes('');
                  }}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openCompletedPreview}
                  disabled={!toEmail}
                  className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewData && (
        <EmailPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewData(null);
          }}
          onSend={handleEmailSend}
          emailType={currentEmailType}
          defaultData={previewData}
          sending={sending}
        />
      )}
    </div>
  );
}

