'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type NotificationType = 'booking' | 'quick_booking' | 'subscription' | 'contact' | 'feedback' | string

interface NotificationRecord {
  id: string
  type: NotificationType
  title: string
  content: string
  status: 'read' | 'unread'
  metadata: Record<string, unknown> | null
  created_at: string
}

export default function NotificationComponent() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formattedUnreadCount = unreadCount > 9 ? '9+' : unreadCount.toString()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, content, status, metadata, created_at')
        .in('type', ['new_main_booking', 'new_quick_booking', 'subscription', 'feedback', 'contact'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      // Map database types to simplified frontend types
      const list: NotificationRecord[] = (data ?? []).map((item) => {
        let mappedType = item.type as NotificationType
        if (item.type === 'new_main_booking') mappedType = 'booking'
        if (item.type === 'new_quick_booking') mappedType = 'quick_booking'
        // feedback, contact, subscription stay as-is
        
        return {
          id: item.id,
          type: mappedType,
          title: item.title,
          content: item.content,
          status: item.status as 'read' | 'unread',
          metadata: item.metadata ?? null,
          created_at: item.created_at,
        }
      })

      setNotifications(list)
      setUnreadCount(list.filter(n => n.status === 'unread').length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const navigateForNotification = (notification: NotificationRecord) => {
    const meta = notification.metadata ?? {}

    switch (notification.type) {
      case 'booking': {
        const bookingNumber = meta.bookingNumber as string | undefined
        router.push(
          bookingNumber ? `/dashboard/new-bookings/${bookingNumber}` : '/dashboard/new-bookings'
        )
        break
      }
      case 'quick_booking': {
        const bookingNumber = meta.bookingNumber as string | undefined
        router.push(
          bookingNumber ? `/dashboard/quick-bookings/${bookingNumber}` : '/dashboard/quick-bookings'
        )
        break
      }
      case 'subscription': {
        router.push('/dashboard/subscribers')
        break
      }
      case 'contact': {
        router.push('/dashboard/messages')
        break
      }
      case 'feedback': {
        router.push('/dashboard/feedback')
        break
      }
      default: {
        router.push('/dashboard')
      }
    }
  }

  const handleNotificationClick = async (notification: NotificationRecord) => {
    if (notification.status === 'unread') {
      await markNotificationAsRead(notification.id)
    }
    navigateForNotification(notification)
    setIsOpen(false)
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev =>
        prev.map(item =>
          item.id === notificationId ? { ...item, status: 'read' } : item
        )
      )
      setUnreadCount(prev => Math.max(prev - 1, 0))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-700'
      case 'quick_booking':
        return 'bg-orange-100 text-orange-700'
      case 'subscription':
        return 'bg-purple-100 text-purple-700'
      case 'contact':
        return 'bg-green-100 text-green-700'
      case 'feedback':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const renderNotificationContent = (notification: NotificationRecord) => {
    const meta = notification.metadata ?? {}
    const serviceType = meta.serviceType as string | undefined
    const bookingNumber = meta.bookingNumber as string | undefined
    const scheduledDate = meta.scheduledDate as string | undefined
    const customerEmail = meta.customerEmail as string | undefined

    return (
      <>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">{notification.content}</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
          <div className="text-xs text-gray-500 space-y-1">
            {serviceType && <p>Service: {serviceType}</p>}
            {scheduledDate && <p>Date: {scheduledDate}</p>}
            {bookingNumber && <p>Booking #: {bookingNumber}</p>}
            {customerEmail && <p>Email: {customerEmail}</p>}
          </div>
          {notification.status === 'unread' && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                await markNotificationAsRead(notification.id)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors duration-200 w-full sm:w-auto"
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

      {isOpen && (
        <div
          className={`fixed sm:absolute top-16 sm:top-full right-0 sm:right-0 mt-0 sm:mt-2 w-full sm:w-96 bg-white rounded-none sm:rounded-lg shadow-xl z-50`}
        >
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
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-medium">
                      {notification.title}
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full capitalize ${getNotificationTypeColor(notification.type)}`}>
                        {notification.type.replace('_', ' ')}
                      </span>
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