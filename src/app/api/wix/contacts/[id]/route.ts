import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is always a Promise
    const params = await context.params;
    const contactId = params.id;

    // Check environment variables first
    const accessToken = process.env.WIX_API_ACCESS_TOKEN;
    const accountId = process.env.WIX_ACCOUNT_ID;
    const siteId = process.env.WIX_SITE_ID;
    const baseUrl = process.env.WIX_API_BASE_URL || 'https://www.wixapis.com';

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Wix API configuration missing',
          details: 'WIX_API_ACCESS_TOKEN environment variable is not set',
          userMessage: 'Wix API is not configured. Please add WIX_API_ACCESS_TOKEN to your environment variables.',
          statusCode: 500
        },
        { status: 500 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { 
          error: 'Wix Account ID missing',
          details: 'WIX_ACCOUNT_ID environment variable is not set',
          userMessage: 'Wix Account ID is not configured. Please add WIX_ACCOUNT_ID to your environment variables.',
          statusCode: 500
        },
        { status: 500 }
      );
    }

    if (!contactId) {
      return NextResponse.json(
        { 
          error: 'Missing contact ID',
          details: 'Contact ID is required.',
          userMessage: 'Contact ID is required.',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add account ID header for account-level APIs
    if (accountId) {
      headers['wix-account-id'] = accountId;
    }

    // Add site ID header if provided
    if (siteId) {
      headers['wix-site-id'] = siteId;
    }

    // Get contact by ID
    // Reference: https://dev.wix.com/docs/api-reference/crm/members-contacts/contacts/contacts/contact-v4/get-contact
    const response = await fetch(`${baseUrl}/contacts/v4/contacts/${contactId}`, {
      method: 'GET',
      headers,
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse Wix API response:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid response from Wix API',
          details: 'The Wix API returned an unexpected response.',
          userMessage: 'Unable to fetch contact details from Wix. Please try again or check your API configuration.',
          statusCode: 500
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Wix API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        contactId,
      });

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'Your Wix API access token is invalid or expired.',
            userMessage: 'Wix authentication failed. Please check your API access token.',
            statusCode: 401
          },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Access forbidden',
            details: 'Your API key does not have permission to read contacts.',
            userMessage: 'Your Wix API key doesn\'t have permission to read contacts. Please enable "Manage Contacts" permission in your Wix API key settings.',
            statusCode: 403
          },
          { status: 403 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Contact not found',
            details: 'The requested contact was not found.',
            userMessage: 'Contact not found. It may have been deleted or the ID is incorrect.',
            statusCode: 404
          },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            details: 'Too many requests to Wix API.',
            userMessage: 'Too many requests to Wix. Please wait a moment and try again.',
            statusCode: 429
          },
          { status: 429 }
        );
      }

      const errorMessage = responseData?.error?.message || responseData?.message || 'Failed to fetch contact from Wix';
      return NextResponse.json(
        { 
          error: 'Failed to fetch contact',
          details: errorMessage,
          userMessage: `Unable to fetch contact from Wix: ${errorMessage}`,
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    // Success - return the contact
    return NextResponse.json({
      success: true,
      contact: responseData?.contact || responseData,
    });

  } catch (error) {
    console.error('Error fetching Wix contact:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Network error',
          details: 'Unable to reach Wix API.',
          userMessage: 'Unable to connect to Wix. Please check your internet connection and try again.',
          statusCode: 0
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
        userMessage: 'An unexpected error occurred while fetching contact details. Please try again.',
        statusCode: 500
      },
      { status: 500 }
    );
  }
}

