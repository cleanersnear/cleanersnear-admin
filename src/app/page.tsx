'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

type TableStatus = {
  bookings: boolean
  customers: boolean
  service_details: boolean
}

export default function Home() {
  const [status, setStatus] = useState<{
    connection: boolean
    error?: string
    supabaseUrl?: string
    timestamp: string
    tableStatus?: TableStatus
  }>({
    connection: false,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClientComponentClient()
        
        // Check connection to each table
        const tables = ['bookings', 'customers', 'service_details'] as const
        const tableStatus: TableStatus = {
          bookings: false,
          customers: false,
          service_details: false
        }

        for (const table of tables) {
          try {
            const { error } = await supabase
              .from(table)
              .select('count')
              .limit(1)
              .single()
            
            tableStatus[table] = !error
          } catch (error) {
            tableStatus[table] = false
            console.error(`Error checking ${table}:`, error)
          }
        }

        // If we get here, connection is successful
        setStatus({
          connection: true,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          timestamp: new Date().toISOString(),
          tableStatus
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
      <div className="max-w-2xl w-full space-y-8 mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Database Connection Status</h2>
          
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium mb-2">Overall Connection Status:</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                status.connection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.connection ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            {/* Table Status */}
            {status.tableStatus && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-2">Table Status:</h3>
                <div className="space-y-2">
                  {Object.entries(status.tableStatus).map(([table, isConnected]) => (
                    <div key={table} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{table}:</span>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Status
          </button>
          
          {status.connection && (
            <a
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go to Dashboard
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
