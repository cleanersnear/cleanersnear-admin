import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createFeedbackNotification } from '@/utils/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClientComponentClient()
    
    // Validate request
    const body = await req.json()
    
    if (!body.feedback_id) {
      return NextResponse.json(
        { error: 'Missing feedback_id in request body' }, 
        { status: 400 }
      )
    }

    // Get feedback data
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', body.feedback_id)
      .single()
      
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' }, 
        { status: 404 }
      )
    }
    
    // Create notification
    const result = await createFeedbackNotification({
      name: feedback.name,
      email: feedback.email,
      feedback_option: feedback.feedback_option,
      rating: feedback.rating,
      
      feedback_id: feedback.id
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create notification' }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating feedback notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Also allow GET for testing
export async function GET(req: NextRequest) {
  const feedbackId = req.nextUrl.searchParams.get('feedback_id')
  
  if (!feedbackId) {
    return NextResponse.json(
      { error: 'Missing feedback_id query parameter' }, 
      { status: 400 }
    )
  }
  
  // Forward to the POST handler logic
  const mockRequest = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ feedback_id: feedbackId })
  })
  
  return POST(mockRequest as NextRequest)
} 