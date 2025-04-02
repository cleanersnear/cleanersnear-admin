'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Notification {
    id: string
    type: string
    title: string
    content: string
    status: 'read' | 'unread'
    booking_id: string
    metadata: {
        customerName: string
        bookingNumber: string
        serviceType: string
        scheduledDate: string
        scheduledTime: string
        customerEmail: string
        customerPhone: string
        totalPrice: number
    }
    created_at: string
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

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            setNotifications(data)
            setUnreadCount(data.filter(n => n.status === 'unread').length)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }, [supabase])

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        router.push(`/dashboard/bookings/${notification.booking_id}`)
        setIsOpen(false)
    }

    // Handle mark as read
    const handleMarkAsRead = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation() // Prevent triggering the parent click
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ status: 'read' })
                .eq('id', notification.id)

            if (error) throw error

            // Update local state
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
                                        <h4 className="text-sm sm:text-base font-medium">{notification.title}</h4>
                                        <span className="text-xs text-gray-500">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {notification.content}
                                    </p>
                                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                                        <div className="text-xs text-gray-500">
                                            <p>Service: {notification.metadata.serviceType}</p>
                                            <p>Date: {notification.metadata.scheduledDate}</p>
                                            <p>Time: {notification.metadata.scheduledTime}</p>
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
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}








