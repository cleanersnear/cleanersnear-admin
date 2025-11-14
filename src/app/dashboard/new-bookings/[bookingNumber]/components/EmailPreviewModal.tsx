'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => void;
  emailType: 'confirmation' | 'cancellation' | 'completed' | 'feedback';
  defaultData: {
    to: string;
    from: string;
    subject: string;
    previewData: Record<string, string | number | boolean>;
    bookingNumber?: string;
    confirmedTime?: string;
    editedData?: Record<string, string | number | boolean>;
  };
  sending: boolean;
}

interface EmailData {
  to: string;
  from: string;
  subject: string;
  editedData?: Record<string, string | number | boolean>; // For edited template data like price
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  onSend,
  emailType,
  defaultData,
  sending
}: EmailPreviewModalProps) {
  const [emailData] = useState<EmailData>({
    to: defaultData.to,
    from: defaultData.from,
    subject: defaultData.subject,
    editedData: defaultData.editedData || {},
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchPreview = useCallback(async () => {
    if (!defaultData.bookingNumber) return;
    
    setLoadingPreview(true);
    try {
      // Use previewData with editedData merged
      const previewDataWithEdits = {
        ...defaultData.previewData,
        ...(defaultData.editedData || {}),
      };

      const response = await fetch('/api/bookings/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          bookingNumber: defaultData.bookingNumber,
          confirmedTime: defaultData.confirmedTime,
          previewData: previewDataWithEdits,
        }),
      });

      const data = await response.json();
      if (data.success && data.html) {
        setPreviewHtml(data.html);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  }, [emailType, defaultData.bookingNumber, defaultData.confirmedTime, defaultData.previewData, defaultData.editedData]);

  // Fetch preview HTML when modal opens
  useEffect(() => {
    if (isOpen && defaultData.bookingNumber) {
      fetchPreview();
    }
  }, [isOpen, defaultData.bookingNumber, fetchPreview]);

  if (!isOpen) return null;

  const handleSend = () => {
    onSend(emailData);
  };

  const getEmailTypeInfo = () => {
    switch (emailType) {
      case 'confirmation':
        return {
          title: 'Confirmation Email Preview',
          color: 'indigo',
          icon: '✅',
        };
      case 'cancellation':
        return {
          title: 'Cancellation Email Preview',
          color: 'red',
          icon: '❌',
        };
      case 'completed':
        return {
          title: 'Completion Email Preview',
          color: 'green',
          icon: '✔️',
        };
      case 'feedback':
        return {
          title: 'Feedback Request Preview',
          color: 'blue',
          icon: '💬',
        };
    }
  };

  const typeInfo = getEmailTypeInfo();

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xl sm:text-2xl">{typeInfo.icon}</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {typeInfo.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={sending}
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Email Preview */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700">
                Email Preview (How it will appear to the customer)
              </h4>
              <button
                onClick={fetchPreview}
                disabled={loadingPreview}
                className="text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50 self-start sm:self-auto"
              >
                {loadingPreview ? 'Refreshing...' : 'Refresh Preview'}
              </button>
            </div>
            
            {loadingPreview ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-xs sm:text-sm text-gray-600">Loading preview...</p>
              </div>
            ) : previewHtml ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full min-w-[320px] h-[400px] sm:h-[600px]"
                    style={{ border: 'none' }}
                    title="Email Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
                <p className="text-xs sm:text-sm text-gray-600">Click &quot;Refresh Preview&quot; to load email preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 gap-3">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            {emailType === 'confirmation' && '⏰ Time will be confirmed upon sending'}
            {emailType === 'completed' && '✅ Booking will be marked as completed'}
            {emailType === 'cancellation' && '❌ Booking will be marked as cancelled'}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={sending}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: sending ? '#9CA3AF' : 
                  typeInfo.color === 'indigo' ? '#4F46E5' :
                  typeInfo.color === 'red' ? '#DC2626' :
                  typeInfo.color === 'green' ? '#059669' : '#2563EB'
              }}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Sending...
                </>
              ) : (
                <>Send Email</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
