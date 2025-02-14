'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: '---',
    totalRevenue: '---',
    activeCustomers: '---',
    avgBookingValue: '---',
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      // Here you'll add the actual data fetching from Supabase
      // For now, using placeholder data
      setStats({
        totalBookings: '156',
        totalRevenue: '$12,345',
        activeCustomers: '89',
        avgBookingValue: '$79',
      })
    }

    fetchStats()
  }, [])

  const statCards = [
    { name: 'Total Bookings', value: stats.totalBookings, icon: CalendarIcon },
    { name: 'Total Revenue', value: stats.totalRevenue, icon: CurrencyDollarIcon },
    { name: 'Active Customers', value: stats.activeCustomers, icon: UsersIcon },
    { name: 'Avg. Booking Value', value: stats.avgBookingValue, icon: ChartBarIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to your dashboard</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add more dashboard sections here */}
    </div>
  )
} 