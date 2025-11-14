"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  name: string;
  email: string;
  rating: number;
  feedback_option: string;
  feedback: string;
  booking_number: string;
  created_at: string;
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingIdLoading, setBookingIdLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (!error && data) setFeedback(data);
      setIsLoading(false);
    };
    
    if (params.id) fetchFeedback();
  }, [params.id, supabase]);

  // Look up booking ID when feedback data is loaded
  useEffect(() => {
    const fetchBookingId = async () => {
      if (!feedback?.booking_number) return;
      
      setBookingIdLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_number', feedback.booking_number)
        .single();
      
      if (!error && data) {
        setBookingId(data.id);
      }
      setBookingIdLoading(false);
    };
    
    if (feedback?.booking_number) {
      fetchBookingId();
    }
  }, [feedback, supabase]);

  // Helper function to determine badge color
  const getBadgeColor = (option: string) => {
    switch(option?.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to render rating stars
  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < rating ? (
        <StarIconSolid key={i} className="w-6 h-6 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="w-6 h-6 text-gray-300" />
      )
    ));
  };

  // Helper function to render booking number with conditional linking
  const renderBookingNumber = () => {
    if (!feedback?.booking_number) return 'N/A';
    
    if (bookingIdLoading) {
      return (
        <div className="flex items-center">
          <span>{feedback.booking_number}</span>
          <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></span>
        </div>
      );
    }
    
    if (bookingId) {
      return (
        <Link 
          href={`/dashboard/bookings/${bookingId}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {feedback.booking_number}
        </Link>
      );
    }
    
    return feedback.booking_number;
  };

  if (isLoading) {
    return <div className="p-4">Loading feedback details...</div>;
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Feedback not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The feedback you&apos;re looking for does not exist or has been removed.
        </p>
        <Link 
          href="/dashboard/feedback"
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 
                  text-sm font-medium rounded-md text-gray-700 bg-white 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Back to Feedback List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 
                  text-sm font-medium rounded-md text-gray-700 bg-white 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-1 h-5 w-5" aria-hidden="true" />
          Back to Feedback List
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Feedback Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Detailed view of customer feedback
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Booking Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{renderBookingNumber()}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Date Submitted</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {feedback.created_at 
                  ? format(new Date(feedback.created_at), 'PPpp')
                  : 'N/A'
                }
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{feedback.name}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{feedback.email}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 flex">
                <div className="flex">
                  {renderRatingStars(feedback.rating)}
                </div>
                <span className="ml-2 font-medium">{feedback.rating}/5</span>
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Feedback Option</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(feedback.feedback_option)}`}>
                  {feedback.feedback_option || 'N/A'}
                </span>
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Feedback Comments</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                {feedback.feedback || 'No comments provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}  