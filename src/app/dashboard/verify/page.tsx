'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export default function VerifyConnection() {
  const [status, setStatus] = useState<{
    connection: boolean
    error?: string
    supabaseUrl?: string
    timestamp: string
  }>({
    connection: false,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClientComponentClient()
        
        // Try to make a simple query
        const { error } = await supabase
          .from('bookings')
          .select('count')
          .limit(1)
          .single()

        if (error) throw error

        // If we get here, connection is successful
        setStatus({
          connection: true,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Connection error:', error)
        setStatus({
          connection: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          timestamp: new Date().toISOString()
        })
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Supabase Connection Status</h2>
          
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-2">Connection Status:</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                status.connection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.connection ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            {/* Supabase URL */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-2">Supabase URL:</h3>
              <p className="text-sm text-gray-600 break-all">
                {status.supabaseUrl || 'Not available'}
              </p>
            </div>

            {/* Last Check */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-2">Last Check:</h3>
              <p className="text-sm text-gray-600">
                {new Date(status.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Error Message */}
            {status.error && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2 text-red-600">Error:</h3>
                <p className="text-sm text-red-600 break-all">
                  {status.error}
                </p>
              </div>
            )}

            {/* Environment Check */}
            <div>
              <h3 className="text-lg font-medium mb-2">Environment:</h3>
              <p className="text-sm text-gray-600">
                {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )
} 
