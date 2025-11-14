import { NextResponse } from 'next/server';
import { EMAIL_FROM } from '@/config/emailTemplates';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      fromEmail: EMAIL_FROM.EMAIL,
      fromName: EMAIL_FROM.NAME,
    });
  } catch (error) {
    console.error('Error getting email config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email config'
      },
      { status: 500 }
    );
  }
}

