'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Organization
        </h1>
        <p className="text-gray-600">
          Select the organization you want to manage
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-2xl">
        <button
          className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-all 
                     border-2 border-gray-100 hover:border-gray-200
                     flex flex-col items-center justify-center
                     group"
          onClick={() => router.push('/dashboard')}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
            Cleaning Professionals
          </h2>
          <p className="text-gray-500 text-sm">
            Manage bookings and services for Cleaning Professionals
          </p>
        </button>

        <button
          className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-all 
                     border-2 border-gray-100 hover:border-gray-200
                     flex flex-col items-center justify-center
                     opacity-50 cursor-not-allowed"
          disabled
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cleaner Near
          </h2>
          <p className="text-gray-500 text-sm">
            Coming Soon
          </p>
        </button>
      </div>

      <div className="mt-12 text-sm text-gray-500">
        © 2024 Admin Dashboard
      </div>
    </div>
  )
}
