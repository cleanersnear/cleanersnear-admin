/**
 * Wix API Service
 * Integration with Wix Contacts API for creating customer contacts
 */

interface WixContactInfo {
  name?: {
    first?: string;
    last?: string;
  };
  emails?: {
    items: Array<{ email: string; tag?: string }>;
  };
  phones?: {
    items: Array<{ phone: string; tag?: string; countryCode?: string }>;
  };
  addresses?: {
    items: Array<{
      tag?: string;
      address: {
        country?: string;
        city?: string;
        postalCode?: string;
        addressLine?: string;
        addressLine2?: string;
        subdivision?: string;
        streetAddress?: {
          number?: string;
          name?: string;
        };
      };
    }>;
  };
  company?: string;
  jobTitle?: string;
  birthdate?: string;
  locale?: string;
}

interface WixCreateContactRequest {
  info: WixContactInfo;
  allowDuplicates?: boolean;
}

interface WixContactResponse {
  contact?: {
    id?: string;
    info?: WixContactInfo;
    createdDate?: string;
    modifiedDate?: string;
  };
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

class WixService {
  private accessToken: string;
  private accountId: string;
  private siteId: string;
  private baseUrl: string;

  constructor() {
    // Initialize with environment variables (server-side only)
    this.accessToken = process.env.WIX_API_ACCESS_TOKEN || '';
    this.accountId = process.env.WIX_ACCOUNT_ID || '';
    this.siteId = process.env.WIX_SITE_ID || '';
    this.baseUrl = process.env.WIX_API_BASE_URL || 'https://www.wixapis.com';
    
    // Only throw error if we're on server-side and no access token
    if (typeof window === 'undefined' && !this.accessToken) {
      throw new Error('Wix API access token is required');
    }
    
    if (typeof window === 'undefined' && !this.accountId) {
      throw new Error('Wix Account ID is required');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('Wix API Request:', {
      url,
      method: options.method || 'GET',
      hasAccessToken: !!this.accessToken,
      accessTokenPrefix: this.accessToken ? this.accessToken.substring(0, 8) + '...' : 'NO_TOKEN'
    });
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add account ID header for account-level APIs
    if (this.accountId) {
      headers['wix-account-id'] = this.accountId;
    }

    // Add site ID header for site-level APIs
    if (this.siteId) {
      headers['wix-site-id'] = this.siteId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Wix API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        url,
        accessTokenPrefix: this.accessToken ? this.accessToken.substring(0, 8) + '...' : 'NO_TOKEN'
      });
      
      const errorMessage = responseData?.error?.message || responseData?.message || `${response.status} ${response.statusText}`;
      throw new Error(`Wix API Error: ${response.status} ${response.statusText} - ${errorMessage}`);
    }

    return responseData;
  }

  /**
   * Create a contact in Wix
   */
  async createContact(contactData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    suburb?: string;
    postcode?: string;
    allowDuplicates?: boolean;
  }): Promise<WixContactResponse> {
    try {
      const fullName = `${contactData.firstName} ${contactData.lastName}`.trim();
      
      // Build the contact info object according to Wix API v4 structure
      const info: WixContactInfo = {
        name: {
          first: contactData.firstName,
          last: contactData.lastName,
        },
      };

      // Add email if provided
      if (contactData.email && contactData.email.trim() && contactData.email.includes('@')) {
        info.emails = {
          items: [{ email: contactData.email.trim(), tag: 'MAIN' }]
        };
      }

      // Add phone if provided and valid
      if (contactData.phone && contactData.phone.trim() && contactData.phone.trim().length >= 3 && /\d/.test(contactData.phone)) {
        info.phones = {
          items: [{ phone: contactData.phone.trim(), tag: 'MOBILE', countryCode: 'AU' }]
        };
      }

      // Add address if provided
      const addressItems: Array<{
        tag?: string;
        address: {
          country?: string;
          city?: string;
          postalCode?: string;
          addressLine?: string;
        };
      }> = [];
      
      if (contactData.address || contactData.suburb || contactData.postcode) {
        const addressData: {
          country?: string;
          city?: string;
          postalCode?: string;
          addressLine?: string;
        } = {
          country: 'AU', // Default to Australia
        };
        
        if (contactData.address) addressData.addressLine = contactData.address;
        if (contactData.suburb) addressData.city = contactData.suburb;
        if (contactData.postcode) addressData.postalCode = contactData.postcode;
        
        addressItems.push({
          tag: 'HOME',
          address: addressData
        });
        
        info.addresses = { items: addressItems };
      }

      const requestBody: WixCreateContactRequest = {
        info,
        allowDuplicates: contactData.allowDuplicates ?? false, // Default to false to prevent duplicates
      };

      console.log('Creating Wix contact with data:', {
        name: fullName,
        email: contactData.email,
        phone: contactData.phone,
        allowDuplicates: requestBody.allowDuplicates
      });

      const response = await this.makeRequest('/contacts/v4/contacts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return response;
    } catch (error) {
      console.error('Failed to create Wix contact:', error);
      throw error;
    }
  }

  /**
   * Check if a contact exists by email (by querying contacts)
   * Note: Wix API doesn't have a direct search by email endpoint,
   * so we'll query contacts and filter client-side
   */
  async findContactByEmail(email: string): Promise<WixContactResponse | null> {
    try {
      // Query contacts with email filter
      const response = await this.makeRequest(`/contacts/v4/contacts?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      });

      // Check if any contacts match
      if (response.contacts && response.contacts.length > 0) {
        // Find exact email match
        const matchingContact = response.contacts.find((contact: { info?: { emails?: Array<{ email: string }> } }) => 
          contact.info?.emails?.some((e: { email: string }) => e.email.toLowerCase() === email.toLowerCase())
        );
        
        if (matchingContact) {
          return { contact: matchingContact };
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to find Wix contact by email:', error);
      // Don't throw - just return null if search fails
      return null;
    }
  }
}

export const wixService = new WixService();
export { WixService };
export type { WixContactInfo, WixCreateContactRequest, WixContactResponse };

