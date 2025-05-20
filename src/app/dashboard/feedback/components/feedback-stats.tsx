'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { StarIcon } from '@heroicons/react/24/solid'



interface FeedbackStats {
  totalCount: number
  averageRating: number
  ratingCounts: Record<number, number>
  optionCounts: Record<string, number>
}

export function FeedbackStats() {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<FeedbackStats>({
    totalCount: 0,
    averageRating: 0,
    ratingCounts: {},
    optionCounts: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('feedback')
          .select('rating, feedback_option')

        if (error) throw error

        // Calculate stats
        if (data && data.length > 0) {
          const totalCount = data.length
          
          // Calculate average rating
          const totalRating = data.reduce((sum, item) => sum + (item.rating || 0), 0)
          const averageRating = totalRating / totalCount
          
          // Count by rating (1-5)
          const ratingCounts: Record<number, number> = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
          data.forEach(item => {
            if (item.rating >= 1 && item.rating <= 5) {
              ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1
            }
          })
          
          // Count by feedback option
          const optionCounts: Record<string, number> = {}
          data.forEach(item => {
            if (item.feedback_option) {
              optionCounts[item.feedback_option] = (optionCounts[item.feedback_option] || 0) + 1
            }
          })
          
          setStats({
            totalCount,
            averageRating,
            ratingCounts,
            optionCounts
          })
        }
      } catch (error) {
        console.error('Error fetching feedback stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])
  
  // Get rating distribution percentage
  const getRatingPercentage = (rating: number) => {
    if (stats.totalCount === 0) return 0
    return ((stats.ratingCounts[rating] || 0) / stats.totalCount) * 100
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Overview</h3>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
          <span className="ml-2 text-gray-500">out of 5</span>
        </div>
        
        <div className="flex items-center mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon 
              key={star}
              className={`w-5 h-5 ${star <= Math.round(stats.averageRating) 
                ? 'text-yellow-400' 
                : 'text-gray-300'}`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-500">
            Based on {stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center">
            <div className="flex items-center w-12">
              <span className="text-sm font-medium text-gray-900">{rating}</span>
              <StarIcon className="w-4 h-4 ml-1 text-gray-400" />
            </div>
            
            <div className="w-full ml-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-yellow-400 rounded-full" 
                  style={{ width: `${getRatingPercentage(rating)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="w-16 ml-4 text-right">
              <span className="text-sm text-gray-500">
                {stats.ratingCounts[rating] || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {Object.keys(stats.optionCounts).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Feedback Categories</h4>
          <div className="space-y-2">
            {Object.entries(stats.optionCounts)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([option, count]) => (
                <div key={option} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{option}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count} ({((count / stats.totalCount) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
} 