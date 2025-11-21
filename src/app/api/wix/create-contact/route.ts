import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    const accessToken = process.env.WIX_API_ACCESS_TOKEN;
    const accountId = process.env.WIX_ACCOUNT_ID;
    const siteId = process.env.WIX_SITE_ID;
    const baseUrl = process.env.WIX_API_BASE_URL || 'https://www.wixapis.com';

    if (!accessToken) {
      console.error('WIX_API_ACCESS_TOKEN environment variable is not set');
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
      console.error('WIX_ACCOUNT_ID environment variable is not set');
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

    const body = await request.json();
    const { bookingNumber, customerData, allowDuplicates } = body;

    // Validate required fields
    if (!customerData) {
      return NextResponse.json(
        { 
          error: 'Missing customer data',
          details: 'Customer data is required to create a contact in Wix.',
          userMessage: 'Customer information is missing. Please ensure the booking has complete customer details.',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      phoneType = 'MOBILE',
      phoneCountryCode = 'AU',
      address, 
      addressLine2,
      suburb, 
      state,
      postcode,
      country = 'AU',
      addressType = 'HOME'
    } = customerData;

    // Validate customer data
    if (!firstName || !lastName) {
      return NextResponse.json(
        { 
          error: 'Missing required customer fields',
          details: 'First name and last name are required to create a contact in Wix.',
          userMessage: 'Customer name is required. Please ensure the booking has a valid first and last name.',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Validate that we have at least name, email, or phone (Wix API requirement)
    const hasValidEmail = email && email.trim() && email.includes('@');
    const hasValidPhone = phone && phone.trim(); // More lenient - just check if phone exists
    const hasValidName = firstName && lastName;

    if (!hasValidName && !hasValidEmail && !hasValidPhone) {
      return NextResponse.json(
        { 
          error: 'Missing contact information',
          details: 'At least one of name, email, or phone is required to create a contact in Wix.',
          userMessage: 'Customer name, valid email, or phone number is required. Please ensure the booking has complete contact information.',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    console.log('Creating Wix contact with data:', {
      bookingNumber,
      customerName: `${firstName} ${lastName}`,
      email,
      phone,
      allowDuplicates: allowDuplicates ?? false
    });

    // Build the contact info object according to Wix API v4 structure
    // Reference: https://dev.wix.com/docs/api-reference/crm/members-contacts/contacts/contacts/contact-v4/create-contact
    // Wix API requires at least one of: name, email, or phone
    const info: {
      name?: { first?: string; last?: string };
      emails?: { items: Array<{ email: string; tag?: string }> };
      phones?: { items: Array<{ phone: string; tag?: string; countryCode?: string }> };
      addresses?: { items: Array<{ tag?: string; address: { country?: string; city?: string; postalCode?: string; addressLine?: string } }> };
    } = {};

    // Add name - ensure we have valid name fields
    if (firstName && lastName) {
      info.name = {
        first: firstName.trim(),
        last: lastName.trim(),
      };
    }

    // Add email - only if valid email
    // Wix API: emails is an object with items array
    if (email && email.trim() && email.includes('@')) {
      info.emails = {
        items: [{ email: email.trim(), tag: 'MAIN' }]
      };
    }

    // Add phone - be more lenient with validation, allow any non-empty phone
    // Wix API: phones is an object with items array
    if (phone && phone.trim()) {
      const phoneTag = phoneType || 'MOBILE';
      const countryCode = phoneCountryCode || 'AU';
      info.phones = {
        items: [{ phone: phone.trim(), tag: phoneTag, countryCode: countryCode }]
      };
    }

    // Add address if provided - filter out empty values
    // Wix API: addresses is an object with items array
    const addressItems: Array<{ 
      tag?: string; 
      address: { 
        country?: string; 
        subdivision?: string;
        city?: string; 
        postalCode?: string; 
        addressLine?: string;
        addressLine2?: string;
      } 
    }> = [];
    const addressData: { 
      country?: string; 
      subdivision?: string;
      city?: string; 
      postalCode?: string; 
      addressLine?: string;
      addressLine2?: string;
    } = {};
    
    if (address && address.trim()) {
      addressData.addressLine = address.trim();
    }
    if (addressLine2 && addressLine2.trim()) {
      addressData.addressLine2 = addressLine2.trim();
    }
    if (suburb && suburb.trim()) {
      addressData.city = suburb.trim();
    }
    if (postcode && postcode.trim()) {
      addressData.postalCode = postcode.trim();
    }
    if (state && state.trim()) {
      // Format state as country-subdivision (e.g., AU-VIC)
      const countryCode = (country || 'AU').toUpperCase();
      addressData.subdivision = `${countryCode}-${state.trim()}`;
    }
    addressData.country = (country || 'AU').toUpperCase(); // Default to Australia
    
    // Only add addresses if we have at least one address field
    if (addressData.addressLine || addressData.city || addressData.postalCode) {
      addressItems.push({
        tag: addressType || 'HOME',
        address: addressData
      });
      info.addresses = { items: addressItems };
    }

    // Ensure info object is not empty (Wix requires at least name, email, or phone)
    // Check if we have at least one of the required fields
    const hasName = info.name && info.name.first && info.name.last;
    const hasEmail = info.emails && info.emails.items && info.emails.items.length > 0;
    const hasPhone = info.phones && info.phones.items && info.phones.items.length > 0;
    
    if (!hasName && !hasEmail && !hasPhone) {
      return NextResponse.json(
        { 
          error: 'Invalid contact data',
          details: 'Contact must have at least name, email, or phone with valid data.',
          userMessage: 'Unable to create contact: missing valid name, email, or phone information.',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    const requestBody = {
      info,
      allowDuplicates: allowDuplicates ?? false, // Default to false to prevent duplicates
    };

    // Remove undefined values from request body before sending and logging
    const cleanRequestBody = JSON.parse(JSON.stringify(requestBody));
    console.log('Wix API Request Body:', JSON.stringify(cleanRequestBody, null, 2));

    // Make request to Wix API
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add account ID header for account-level APIs
    if (accountId) {
      headers['wix-account-id'] = accountId;
    }

    // Add site ID header if provided (some APIs may require both)
    if (siteId) {
      headers['wix-site-id'] = siteId;
    }

    const response = await fetch(`${baseUrl}/contacts/v4/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanRequestBody),
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // If response is not JSON, return a generic error
      console.error('Failed to parse Wix API response:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid response from Wix API',
          details: 'The Wix API returned an unexpected response. Please try again or check your API configuration.',
          userMessage: 'Unable to connect to Wix. Please check your API configuration and try again.'
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Wix API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        bookingNumber,
        customerName: `${firstName} ${lastName}`,
      });

      // Handle specific error cases with user-friendly messages
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'Your Wix API access token is invalid or expired.',
            userMessage: 'Wix authentication failed. Please check your API access token in the environment variables.',
            statusCode: 401
          },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Access forbidden',
            details: 'Your API key does not have permission to create contacts.',
            userMessage: 'Your Wix API key doesn\'t have permission to create contacts. Please check your API key permissions in Wix.',
            statusCode: 403
          },
          { status: 403 }
        );
      }

      if (response.status === 400) {
        // Bad request - usually validation errors
        const wixError = responseData?.error?.message || responseData?.message || 'Invalid request data';
        return NextResponse.json(
          { 
            error: 'Invalid request',
            details: wixError,
            userMessage: `Unable to create contact: ${wixError}. Please check the customer information and try again.`,
            statusCode: 400
          },
          { status: 400 }
        );
      }

      if (response.status === 409) {
        // Contact already exists
        const contactId = responseData?.contact?.id;
        const existingContactMsg = contactId 
          ? `Contact already exists in Wix (ID: ${contactId})` 
          : 'A contact with this email or phone already exists in Wix';
        
        return NextResponse.json(
          { 
            error: 'Contact already exists',
            details: responseData?.error?.message || existingContactMsg,
            userMessage: `This customer already exists in Wix. You can proceed with creating an invoice.`,
            contactId: contactId,
            statusCode: 409
          },
          { status: 409 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            details: 'Too many requests to Wix API. Please wait before trying again.',
            userMessage: 'Too many requests to Wix. Please wait a moment and try again.',
            statusCode: 429
          },
          { status: 429 }
        );
      }

      if (response.status >= 500) {
        return NextResponse.json(
          { 
            error: 'Wix server error',
            details: responseData?.error?.message || 'Wix API is experiencing issues.',
            userMessage: 'Wix is temporarily unavailable. Please try again in a few moments.',
            statusCode: response.status
          },
          { status: response.status }
        );
      }

      // Generic error for other status codes
      const errorMessage = responseData?.error?.message || responseData?.message || 'Unknown error from Wix API';
      return NextResponse.json(
        { 
          error: 'Failed to create contact',
          details: errorMessage,
          userMessage: `Unable to create contact in Wix: ${errorMessage}. Please try again or check your Wix API configuration.`,
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      message: 'Contact created successfully in Wix',
      contactId: responseData?.contact?.id,
      contact: responseData?.contact,
      bookingNumber,
    });

  } catch (error) {
    console.error('Error creating Wix contact:', error);
    
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Network error',
          details: 'Unable to reach Wix API. Please check your internet connection.',
          userMessage: 'Unable to connect to Wix. Please check your internet connection and try again.',
          statusCode: 0
        },
        { status: 500 }
      );
    }

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'Wix API authentication failed.',
            userMessage: 'Wix authentication failed. Please check your API access token.',
            statusCode: 401
          },
          { status: 401 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { 
            error: 'Access forbidden',
            details: 'Wix API access forbidden.',
            userMessage: 'Your Wix API key doesn\'t have the required permissions.',
            statusCode: 403
          },
          { status: 403 }
        );
      }
      
      if (error.message.includes('429')) {
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
    }

    return NextResponse.json(
      { 
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
        userMessage: 'An unexpected error occurred while creating the contact. Please try again or contact support if the issue persists.',
        statusCode: 500
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check environment variables first
    const accessToken = process.env.WIX_API_ACCESS_TOKEN;
    const accountId = process.env.WIX_ACCOUNT_ID;
    const siteId = process.env.WIX_SITE_ID;
    const baseUrl = process.env.WIX_API_BASE_URL || 'https://www.wixapis.com';
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'WIX_API_ACCESS_TOKEN environment variable is not set' },
        { status: 500 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'WIX_ACCOUNT_ID environment variable is not set' },
        { status: 500 }
      );
    }

    // Test Wix API connection by making a simple request
    // We'll try to get contacts (this will verify auth)
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add account ID header for account-level APIs
    if (accountId) {
      headers['wix-account-id'] = accountId;
    }

    // Add site ID header if provided (some APIs may require both)
    if (siteId) {
      headers['wix-site-id'] = siteId;
    }

    const response = await fetch(`${baseUrl}/contacts/v4/contacts?limit=1`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Wix API returned ${response.status}: ${errorData?.error?.message || response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Wix API connection successful',
    });
  } catch (error) {
    console.error('Wix API health check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Wix API connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

