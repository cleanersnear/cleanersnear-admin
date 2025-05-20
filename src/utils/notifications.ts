import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type NotificationType = 'booking' | 'feedback'

interface NotificationMetadata {
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

/**
 * Create a new notification in the database
 */
export async function createNotification({
  type,
  title,
  content,
  metadata,
  booking_id,
  feedback_id
}: {
  type: NotificationType
  title: string
  content: string
  metadata: NotificationMetadata
  booking_id?: string
  feedback_id?: string
}) {
  const supabase = createClientComponentClient()
  
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        type,
        title,
        content,
        status: 'unread',
        metadata,
        booking_id,
        feedback_id,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

/**
 * Create a notification for new feedback submission
 */
export async function createFeedbackNotification({
  name,
  email,
  feedback_option,
  rating,
  feedback_id
}: {
  name: string
  email: string
  feedback_option: string
  rating: number
  feedback_id: string
}) {
  const title = `New Feedback from ${name}`
  const content = `${name} submitted a feedback with rating ${rating}/5`
  
  return createNotification({
    type: 'feedback',
    title,
    content,
    metadata: {
      customerName: name,
      customerEmail: email,
      feedbackOption: feedback_option,
      rating
    },
    feedback_id
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClientComponentClient()
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const supabase = createClientComponentClient()
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('status', 'unread')
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error }
  }
}  