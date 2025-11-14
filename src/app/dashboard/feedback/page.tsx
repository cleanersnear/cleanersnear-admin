'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ArrowPathIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { FeedbackStats } from './components/feedback-stats'

interface Feedback {
  id: string
  booking_number: string
  feedback_option: string
  rating: number
  feedback: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setFeedbacks(data || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setError('Failed to load feedback data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const renderRatingStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        i < rating ? (
          <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="w-5 h-5 text-gray-300" />
        )
      ))
  }

  const getBadgeColor = (option: string) => {
    switch(option?.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'average':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewFeedback = (id: string) => {
    router.push(`/dashboard/feedback/${id}`)
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Customer Feedback</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700">
            Review customer feedback and ratings for your services
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchFeedbacks}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 
                      text-sm font-medium rounded-md shadow-sm text-gray-700 
                      bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 sm:mt-6 bg-red-50 border-l-4 border-red-400 p-3 sm:p-4">
          <div className="flex">
            <div className="ml-0 sm:ml-3">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-8">
        <div className="lg:col-span-1">
          <FeedbackStats />
        </div>
        
        <div className="lg:col-span-3">
          {/* Mobile: Card View */}
          <div className="block sm:hidden space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : feedbacks.length > 0 ? (
              feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  onClick={() => handleViewFeedback(feedback.id)}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900 mb-1">
                        {feedback.booking_number || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(feedback.feedback_option)}`}>
                      {feedback.feedback_option || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="font-medium text-sm text-gray-900">{feedback.name}</div>
                    <div className="text-xs text-gray-500">{feedback.email}</div>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    {renderRatingStars(feedback.rating)}
                    <span className="ml-2 text-xs text-gray-500">{feedback.rating}/5</span>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {feedback.feedback || 'No comments provided'}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-500">No feedback data available</p>
              </div>
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden sm:flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    </div>
                  ) : feedbacks.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Booking
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Customer
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Rating
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Feedback
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {feedbacks.map((feedback) => (
                          <tr key={feedback.id} 
                              onClick={() => handleViewFeedback(feedback.id)}
                              className="hover:bg-gray-50 cursor-pointer">
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {feedback.booking_number || 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900">
                              <div className="font-medium">{feedback.name}</div>
                              <div className="text-gray-500">{feedback.email}</div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900">
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(feedback.feedback_option)}`}>
                                  {feedback.feedback_option || 'N/A'}
                                </span>
                              </div>
                              <div className="flex mt-1">
                                {renderRatingStars(feedback.rating)}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 max-w-md">
                              <div className="line-clamp-2">
                                {feedback.feedback || 'No comments provided'}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {feedback.created_at ? (
                                <time dateTime={feedback.created_at}>
                                  {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                                </time>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex justify-center items-center h-64 bg-white">
                      <p className="text-gray-500">No feedback data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 