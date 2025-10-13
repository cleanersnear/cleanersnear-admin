'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isYesterday, isTomorrow, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import { newBookingService } from '@/config/newDatabase'

interface CalendarBooking {
  id: string
  title: string
  date: string
  time?: string
  customer: string
  service: string
  price?: number
  bookingNumber: string
  source: 'new' | 'quick'
  status: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const supabase = createClientComponentClient()

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch from new database
      let newBookings: CalendarBooking[] = []
      try {
        const newBookingsData = await newBookingService.getAllBookings(1000, 0)
        newBookings = newBookingsData.map((booking: {
          id: number;
          booking_number: string;
          selected_service: string;
          first_name: string;
          last_name: string;
          created_at: string;
          schedule_date: string;
          total_price?: number;
          pricing?: { totalPrice?: number };
          status: string;
        }) => ({
          id: `new_${booking.id}`,
          title: `${booking.selected_service}`,
          date: booking.schedule_date || booking.created_at,
          customer: `${booking.first_name} ${booking.last_name}`,
          service: booking.selected_service,
          price: booking.total_price || booking.pricing?.totalPrice,
          bookingNumber: booking.booking_number,
          source: 'new' as const,
          status: booking.status
        }))
      } catch (newError) {
        console.warn('Could not fetch new bookings:', newError)
      }

      // Fetch from quick bookings
      let quickBookings: CalendarBooking[] = []
      try {
        const { data: quickBookingsData, error } = await supabase
          .from('quick_bookings')
          .select(`
            id,
            booking_number,
            service_type,
            total_price,
            preferred_date,
            created_at,
            quick_customers (
              first_name,
              last_name
            )
          `)
          .order('created_at', { ascending: false })

        if (!error && quickBookingsData) {
          quickBookings = quickBookingsData.map((booking: {
            id: string;
            booking_number: string;
            service_type: string;
            total_price?: number;
            preferred_date?: string;
            created_at: string;
            quick_customers?: Array<{
              first_name?: string;
              last_name?: string;
            }> | null;
          }) => {
            const customer = booking.quick_customers?.[0];
            return {
              id: `quick_${booking.id}`,
              title: `${booking.service_type.replace('_', ' ')}`,
              date: booking.preferred_date || booking.created_at,
              customer: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
              service: booking.service_type.replace('_', ' '),
              price: booking.total_price,
              bookingNumber: booking.booking_number,
              source: 'quick' as const,
              status: 'pending'
            };
          })
        }
      } catch (quickError) {
        console.warn('Could not fetch quick bookings:', quickError)
      }

      // Combine and sort by date
      const allBookings = [...newBookings, ...quickBookings].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      setBookings(allBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Reset to current week when switching to list view
  useEffect(() => {
    if (viewMode === 'list') {
      setCurrentWeek(new Date())
    }
  }, [viewMode])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.date), date)
    )
  }

  // Get bookings for selected date
  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  // Group bookings by date for list view
  const groupBookingsByDate = () => {
    const grouped = new Map<string, CalendarBooking[]>()
    
    // Filter bookings for the current week if in list view
    const bookingsToShow = viewMode === 'list' 
      ? bookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          return isSameWeek(bookingDate, currentWeek, { weekStartsOn: 1 }) // Monday start
        })
      : bookings
    
    bookingsToShow.forEach(booking => {
      const dateKey = format(new Date(booking.date), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(booking)
    })
    
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))
  }

  const getStatusColor = (status: string, source: string) => {
    if (source === 'quick') return 'bg-orange-100 text-orange-800'
    
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceColor = (source: string) => {
    return source === 'new' ? 'bg-blue-500' : 'bg-orange-500'
  }

  const getCardColor = (source: string, status: string) => {
    if (source === 'quick') return 'bg-orange-50 border-orange-200'
    
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-50 border-green-200'
      case 'completed': return 'bg-blue-50 border-blue-200'
      case 'pending': return 'bg-yellow-50 border-yellow-200'
      case 'cancelled': return 'bg-red-50 border-red-200'
      default: return 'bg-white border-gray-200'
    }
  }

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  // Get week range for display
  const getWeekRange = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday start
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // Sunday end
    
    const startMonth = format(weekStart, 'MMM')
    const endMonth = format(weekEnd, 'MMM')
    
    if (startMonth === endMonth) {
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`
    } else {
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    }
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1))
  }

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1))
  }

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Calendar View</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              View all bookings from new system and quick bookings
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Calendar Navigation */}
          <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-md touch-manipulation"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-md touch-manipulation"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 sm:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const dayBookings = getBookingsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 touch-manipulation
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                        ${isSelected ? 'bg-indigo-50 border-indigo-200' : ''}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`
                        text-xs sm:text-sm font-medium mb-1
                        ${isToday ? 'text-blue-600' : ''}
                        ${isSelected ? 'text-indigo-600' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* Booking indicators - Mobile optimized */}
                      <div className="space-y-0.5 sm:space-y-1">
                        {dayBookings.slice(0, 2).map((booking, idx) => (
                          <div
                            key={idx}
                            className={`
                              text-xs p-0.5 sm:p-1 rounded truncate
                              ${getStatusColor(booking.status, booking.source)}
                            `}
                            title={`${booking.customer} - ${booking.service}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getSourceColor(booking.source)}`}></div>
                              <span className="hidden sm:inline">{booking.customer.split(' ')[0]}</span>
                              <span className="sm:hidden">{booking.customer.split(' ')[0].charAt(0)}</span>
                            </div>
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayBookings.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Details - Mobile optimized */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Bookings for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                
                {selectedDateBookings.length === 0 ? (
                  <p className="text-gray-500 text-sm sm:text-base">No bookings scheduled for this date.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50"
                      >
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getSourceColor(booking.source)}`}></div>
                            <h4 className="font-medium text-gray-900 text-sm">{booking.customer}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status, booking.source)}`}>
                              {booking.source === 'quick' ? 'Quick' : booking.status}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-medium">Service:</span> {booking.service}</p>
                            <p><span className="font-medium">Booking:</span> {booking.bookingNumber}</p>
                            {booking.price && (
                              <p><span className="font-medium">Price:</span> ${booking.price}</p>
                            )}
                            <p><span className="font-medium">Time:</span> {format(new Date(booking.date), 'h:mm a')}</p>
                            <p><span className="font-medium">Source:</span> {booking.source === 'new' ? 'New System' : 'Quick Booking'}</p>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getSourceColor(booking.source)}`}></div>
                                <h4 className="font-medium text-gray-900">{booking.customer}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status, booking.source)}`}>
                                  {booking.source === 'quick' ? 'Quick Booking' : booking.status}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Service:</span> {booking.service}</p>
                                <p><span className="font-medium">Booking:</span> {booking.bookingNumber}</p>
                                {booking.price && (
                                  <p><span className="font-medium">Price:</span> ${booking.price}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {format(new Date(booking.date), 'h:mm a')}
                              </p>
                              <p className="text-xs text-gray-400">
                                {booking.source === 'new' ? 'New System' : 'Quick Booking'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-md touch-manipulation"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <div className="flex flex-col items-center">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                  {getWeekRange()}
                </h2>
                <button
                  onClick={goToCurrentWeek}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Go to Current Week
                </button>
              </div>
              
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-md touch-manipulation"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {groupBookingsByDate().length > 0 ? (
            groupBookingsByDate().map(([dateKey, dateBookings]) => (
              <div key={dateKey} className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6">
                  {/* Date Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {format(new Date(dateKey), 'd')}
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase">
                        {format(new Date(dateKey), 'EEE')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getDateLabel(dateKey)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dateBookings.length} {dateBookings.length === 1 ? 'booking' : 'bookings'}
                      </p>
                    </div>
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-3">
                    {dateBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`border rounded-lg p-4 ${getCardColor(booking.source, booking.status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getSourceColor(booking.source)}`}></div>
                              <h4 className="font-semibold text-gray-900">{booking.customer}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status, booking.source)}`}>
                                {booking.source === 'quick' ? 'Quick Booking' : booking.status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Service:</span> {booking.service}</p>
                              <p><span className="font-medium">Booking:</span> {booking.bookingNumber}</p>
                              {booking.price && (
                                <p><span className="font-medium">Price:</span> ${booking.price}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {format(new Date(booking.date), 'h:mm a')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.source === 'new' ? 'New System' : 'Quick Booking'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings this week</h3>
                <p className="text-gray-500 text-sm">
                  No bookings are scheduled for {getWeekRange()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
