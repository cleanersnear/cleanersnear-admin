'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { newBookingService } from '@/config/newDatabase'

interface Notification {
    id: string
    type: string
    title: string
    content: string
    status: 'read' | 'unread'
    booking_id?: string
    booking_number?: string
    feedback_id?: string
    metadata: {
        customerName?: string
        bookingNumber?: string
        serviceType?: string
        scheduledDate?: string
        scheduledTime?: string
        customerEmail?: string
        customerPhone?: string
        totalPrice?: number
        rating?: number
        feedbackOption?: string
    }
    created_at: string
    source?: 'old' | 'new' // Track which database the notification comes from
}

export default function NotificationComponent() {
    const supabase = createClientComponentClient()
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Format unread count
    const formattedUnreadCount = unreadCount > 9 ? '9+' : unreadCount.toString()

  // Fetch notifications from both databases
  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch from old database
      const { data: oldNotifications, error: oldError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (oldError) throw oldError

      // Fetch from new database
      let newNotifications: Notification[] = []
      try {
        const newData = await newBookingService.getAllBookings(10, 0)
        
        // Get read status from localStorage for new bookings
        const readBookings = JSON.parse(localStorage.getItem('readNewBookings') || '[]')
        
        newNotifications = newData.map((booking: {
          id: number;
          booking_number: string;
          selected_service: string;
          first_name: string;
          last_name: string;
          created_at: string;
          schedule_date: string;
          email: string;
          phone: string;
          total_price?: number;
          pricing?: { totalPrice?: number };
        }) => ({
          id: `new_${booking.id}`,
          type: 'booking',
          title: 'New Booking Received',
          content: `New ${booking.selected_service} booking from ${booking.first_name} ${booking.last_name}`,
          status: readBookings.includes(booking.booking_number) ? 'read' : 'unread',
          booking_number: booking.booking_number,
          metadata: {
            customerName: `${booking.first_name} ${booking.last_name}`,
            bookingNumber: booking.booking_number,
            serviceType: booking.selected_service,
            scheduledDate: booking.schedule_date,
            customerEmail: booking.email,
            customerPhone: booking.phone,
            totalPrice: booking.total_price || booking.pricing?.totalPrice
          },
          created_at: booking.created_at,
          source: 'new'
        }))
      } catch (newError) {
        console.warn('Could not fetch new booking notifications:', newError)
      }

      // Combine and sort notifications
      const allNotifications = [
        ...(oldNotifications || []).map(n => ({ ...n, source: 'old' })),
        ...newNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotifications(allNotifications.slice(0, 10))
      setUnreadCount(allNotifications.filter(n => n.status === 'unread').length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [supabase])

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        // Route based on notification type and source
        if (notification.type === 'feedback' && notification.feedback_id) {
            router.push(`/dashboard/feedback/${notification.feedback_id}`)
        } else if (notification.source === 'new' && notification.booking_number) {
            router.push(`/dashboard/new-bookings/${notification.booking_number}`)
        } else if (notification.booking_id) {
            router.push(`/dashboard/bookings/${notification.booking_id}`)
        }
        
        setIsOpen(false)
    }

  // Handle mark as read
  const handleMarkAsRead = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation() // Prevent triggering the parent click
    try {
      // Update old database notifications
      if (notification.source === 'old') {
        const { error } = await supabase
          .from('notifications')
          .update({ status: 'read' })
          .eq('id', notification.id)

        if (error) throw error
      } else if (notification.source === 'new' && notification.booking_number) {
        // Store read status in localStorage for new booking notifications
        const readBookings = JSON.parse(localStorage.getItem('readNewBookings') || '[]')
        if (!readBookings.includes(notification.booking_number)) {
          readBookings.push(notification.booking_number)
          localStorage.setItem('readNewBookings', JSON.stringify(readBookings))
        }
      }

      // Update local state for both types
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, status: 'read' } : n)
      )
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

    // Subscribe to new notifications
    useEffect(() => {
        fetchNotifications()

        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', 
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchNotifications, supabase])

    // Render notification content based on type
    const renderNotificationContent = (notification: Notification) => {
        if (notification.type === 'feedback') {
            return (
                <>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {notification.content}
                    </p>
                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <div className="text-xs text-gray-500">
                            {notification.metadata.rating && (
                                <p>Rating: {notification.metadata.rating}/5</p>
                            )}
                            {notification.metadata.feedbackOption && (
                                <p>Opinion: {notification.metadata.feedbackOption}</p>
                            )}
                            {notification.metadata.customerEmail && (
                                <p>Email: {notification.metadata.customerEmail}</p>
                            )}
                        </div>
                        {notification.status === 'unread' && (
                            <button
                                onClick={(e) => handleMarkAsRead(e, notification)}
                                className="text-xs text-blue-600 hover:text-blue-800 
                                    bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded
                                    transition-colors duration-200 w-full sm:w-auto"
                            >
                                Mark as read
                            </button>
                        )}
                    </div>
                </>
            )
        }
        
        // Default booking notification content
        return (
            <>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {notification.content}
                </p>
                <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                    <div className="text-xs text-gray-500">
                        {notification.metadata.serviceType && (
                            <p>Service: {notification.metadata.serviceType}</p>
                        )}
                        {notification.metadata.scheduledDate && (
                            <p>Date: {notification.metadata.scheduledDate}</p>
                        )}
                        {notification.metadata.scheduledTime && (
                            <p>Time: {notification.metadata.scheduledTime}</p>
                        )}
                    </div>
                    {notification.status === 'unread' && (
                        <button
                            onClick={(e) => handleMarkAsRead(e, notification)}
                            className="text-xs text-blue-600 hover:text-blue-800 
                                bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded
                                transition-colors duration-200 w-full sm:w-auto"
                        >
                            Mark as read
                        </button>
                    )}
                </div>
            </>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-4 sm:min-w-[20px] sm:h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {formattedUnreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className={`
                    fixed sm:absolute top-16 sm:top-full right-0 sm:right-0 mt-0 sm:mt-2 
                    w-full sm:w-96 bg-white rounded-none sm:rounded-lg shadow-xl z-50
                    ${isOpen ? 'block' : 'hidden'}
                `}>
                    <div className="p-3 sm:p-4 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base sm:text-lg font-semibold">Notifications</h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="sm:hidden text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[calc(100vh-16rem)] sm:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div 
                                    key={notification.id}
                                    className={`p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer
                                        ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-medium">
                                            {notification.title}
                                            {notification.type === 'feedback' && (
                                                <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                                    Feedback
                                                </span>
                                            )}
                                            {notification.source === 'new' && (
                                                <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                                    New Booking
                                                </span>
                                            )}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    
                                    {renderNotificationContent(notification)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}








