/**
 * ConnectTeam API Service
 * Direct integration with ConnectTeam API for creating shifts
 */

interface ConnectTeamShift {
  date: string;
  start_time: string;
  end_time: string;
  shift_title: string;
  job: string;
  address: string;
  notes: string;
  enable_users_to_claim: boolean;
  does_not_repeat: boolean;
  users?: string[]; // User IDs for assignment
}

interface ConnectTeamScheduler {
  id: string;
  name: string;
}

interface ConnectTeamUser {
  id: string;
  name: string;
  email: string;
}

class ConnectTeamService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Always initialize with environment variables (this will be called server-side)
    this.apiKey = process.env.CONNECTTEAM_API_KEY || '';
    this.baseUrl = process.env.CONNECTTEAM_BASE_URL || 'https://api.connecteam.com';
    
    // Only throw error if we're on server-side and no API key
    if (typeof window === 'undefined' && !this.apiKey) {
      throw new Error('ConnectTeam API key is required');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('ConnectTeam API Request:', {
      url,
      method: options.method || 'GET',
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NO_KEY'
    });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConnectTeam API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NO_KEY'
      });
      throw new Error(`ConnectTeam API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get account information to verify API connection
   */
  async getAccountInfo() {
    try {
      return await this.makeRequest('/me');
    } catch (error) {
      console.error('Failed to get ConnectTeam account info:', error);
      throw error;
    }
  }

  /**
   * Get all schedulers to find the appropriate scheduler ID
   */
  async getSchedulers(): Promise<ConnectTeamScheduler[]> {
    try {
      const response = await this.makeRequest('/scheduler/v1/schedulers');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get ConnectTeam schedulers:', error);
      throw error;
    }
  }

  /**
   * Get users for shift assignment
   */
  async getUsers(): Promise<ConnectTeamUser[]> {
    try {
      const response = await this.makeRequest('/users');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get ConnectTeam users:', error);
      throw error;
    }
  }

  /**
   * Get ConnectTeam jobs
   */
  async getJobs() {
    try {
      const response = await this.makeRequest('/jobs/v1/jobs');
      return response.data?.jobs || [];
    } catch (error) {
      console.error('Failed to get ConnectTeam jobs:', error);
      throw error;
    }
  }

  /**
   * Map booking service to ConnectTeam job ID
   */
  mapServiceToJobId(selectedService: string): string | null {
    // Service mapping based on the ConnectTeam jobs data
    const serviceMapping: { [key: string]: string } = {
      // Direct matches (exact ConnectTeam job titles)
      'Airbnb Cleaning': 'a24f5f56-46b2-31f5-0762-cfd4bd7a9e09', // Airbnb-cleaning
      'Commercial Cleaning': '64dd29fd-4180-77f1-e412-f12afcb11e4d', // Commercial-cleaning
      'End of Lease Cleaning': '5e96bd16-9b3e-92f6-4fa6-40be582bca86', // End-of-lease-cleaning
      
      // Smart mappings based on service type
      'Regular Cleaning': 'ec3ae2a7-95b9-29a3-c0bb-6c2ef9d7f575', // Regular-cleaning
      'Once-Off Cleaning': '1e309de6-95cd-c3ec-7442-4e8124a4b89c', // Once-off-cleaning
      'NDIS Cleaning': 'bc294374-448c-9622-2ce5-32a1ce5fbafd', // Ndis-cleaning
    };

    const jobId = serviceMapping[selectedService];
    console.log(`Mapping service "${selectedService}" to jobId: ${jobId || 'NOT_FOUND'}`);
    
    return jobId || null;
  }

  /**
   * Create a shift in ConnectTeam
   */
  async createShift(schedulerId: string, shiftData: ConnectTeamShift) {
    try {
      // Convert date + time to Unix timestamps
      const startDateTime = new Date(`${shiftData.date}T${shiftData.start_time}:00`);
      const endDateTime = new Date(`${shiftData.date}T${shiftData.end_time}:00`);
      
      const startTimeUnix = Math.floor(startDateTime.getTime() / 1000);
      const endTimeUnix = Math.floor(endDateTime.getTime() / 1000);

      console.log('Date conversion:', {
        date: shiftData.date,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        startTimeUnix,
        endTimeUnix
      });

      // Map service to ConnectTeam job ID (or use custom job if provided)
      const jobId = (shiftData as ConnectTeamShift & { customJobId?: string }).customJobId || this.mapServiceToJobId(shiftData.job);
      
      // Format according to ConnectTeam API documentation
      const payload = [
        {
          startTime: startTimeUnix,
          endTime: endTimeUnix,
          title: shiftData.shift_title,
          jobId: jobId, // Include the mapped job ID
          isOpenShift: shiftData.enable_users_to_claim,
          openSpots: shiftData.enable_users_to_claim ? 1 : 0, // Default 1 open spot (ConnectTeam limitation)
          isRequireAdminApproval: shiftData.enable_users_to_claim, // Require admin approval by default
          isPublished: true, // Publish the shift so it's visible
          locationData: {
            isReferencedToJob: false,
            gps: {
              address: shiftData.address
            }
          },
          notes: shiftData.notes ? [
            {
              html: shiftData.notes.replace(/\n/g, '<br>')
            }
          ] : []
        }
      ];

      console.log('ConnectTeam shift payload:', JSON.stringify(payload, null, 2));

      const response = await this.makeRequest(
        `/scheduler/v1/schedulers/${schedulerId}/shifts?notifyUsers=true`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to create ConnectTeam shift:', error);
      throw error;
    }
  }

  /**
   * Calculate end time based on duration
   */
  calculateEndTime(startTime: string, duration: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMatch = duration.match(/(\d+)\s*hours?/);
    
    if (!durationMatch) {
      // Default to 2 hours if duration format is unexpected
      const endMinutes = (hours + 2) * 60 + minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    const durationHours = parseInt(durationMatch[1]);
    const endMinutes = (hours + durationHours) * 60 + minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * Format shift data from booking information
   */
  formatShiftData(booking: {
    first_name: string;
    last_name: string;
    notes?: string;
    schedule_date: string;
    selected_service: string;
    address: string;
    suburb: string;
    postcode: string;
    booking_number: string;
    email: string;
    phone: string;
    status: string;
  }, serviceDetails?: {
    duration?: string;
    special_requests?: string;
    [key: string]: string | number | boolean | undefined;
  }): ConnectTeamShift {
    const customerName = `${booking.first_name} ${booking.last_name}`;
    const startTime = "09:00"; // Default start time - can be made configurable
    
    // Get duration from service details or default to 2 hours
    let duration = "2 hours";
    if (serviceDetails?.duration) {
      duration = serviceDetails.duration;
    }

    const endTime = this.calculateEndTime(startTime, duration);
    
    // Combine notes from customer and booking
    const customerNotes = booking.notes || '';
    const bookingNotes = serviceDetails?.special_requests || '';
    let combinedNotes = [customerNotes, bookingNotes]
      .filter(note => note && note.trim())
      .join('\n\n');

    // Add booking reference details (excluding total price)
    const bookingReferenceDetails = [
      `Booking Number: ${booking.booking_number}`,
      `Customer: ${booking.first_name} ${booking.last_name}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone}`,
      `Status: ${booking.status}`
    ].join('\n');

    if (combinedNotes) {
      combinedNotes += '\n\n--- Booking Details ---\n' + bookingReferenceDetails;
    } else {
      combinedNotes = '--- Booking Details ---\n' + bookingReferenceDetails;
    }

    return {
      date: booking.schedule_date,
      start_time: startTime,
      end_time: endTime,
      shift_title: customerName,
      job: booking.selected_service,
      address: `${booking.address}, ${booking.suburb} ${booking.postcode}`,
      notes: combinedNotes || 'No additional notes',
      enable_users_to_claim: true, // Default setting as requested
      does_not_repeat: true, // Default for one-time bookings
    };
  }

  /**
   * Static method to format shift data (can be used on client-side)
   */
  static formatShiftData(booking: {
    first_name: string;
    last_name: string;
    notes?: string;
    schedule_date: string;
    selected_service: string;
    address: string;
    suburb: string;
    postcode: string;
    booking_number: string;
    email: string;
    phone: string;
    status: string;
  }, serviceDetails?: {
    duration?: string;
    special_requests?: string;
    [key: string]: string | number | boolean | undefined;
  }): ConnectTeamShift {
    const customerName = `${booking.first_name} ${booking.last_name}`;
    const startTime = "09:00";
    
    let duration = "2 hours";
    if (serviceDetails?.duration) {
      duration = serviceDetails.duration;
    }

    const endTime = ConnectTeamService.calculateEndTimeStatic(startTime, duration);
    
    const customerNotes = booking.notes || '';
    const bookingNotes = serviceDetails?.special_requests || '';
    let combinedNotes = [customerNotes, bookingNotes]
      .filter(note => note && note.trim())
      .join('\n\n');

    // Add booking reference details (excluding total price)
    const bookingReferenceDetails = [
      `Booking Number: ${booking.booking_number}`,
      `Customer: ${booking.first_name} ${booking.last_name}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone}`,
      `Status: ${booking.status}`
    ].join('\n');

    if (combinedNotes) {
      combinedNotes += '\n\n--- Booking Details ---\n' + bookingReferenceDetails;
    } else {
      combinedNotes = '--- Booking Details ---\n' + bookingReferenceDetails;
    }

    return {
      date: booking.schedule_date,
      start_time: startTime,
      end_time: endTime,
      shift_title: customerName,
      job: booking.selected_service,
      address: `${booking.address}, ${booking.suburb} ${booking.postcode}`,
      notes: combinedNotes || 'No additional notes',
      enable_users_to_claim: true,
      does_not_repeat: true,
    };
  }

  /**
   * Static method to calculate end time (can be used on client-side)
   */
  static calculateEndTimeStatic(startTime: string, duration: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMatch = duration.match(/(\d+)\s*hours?/);
    
    if (!durationMatch) {
      const endMinutes = (hours + 2) * 60 + minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    const durationHours = parseInt(durationMatch[1]);
    const endMinutes = (hours + durationHours) * 60 + minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * Static method to map service to job ID (can be used on client-side)
   */
  static mapServiceToJobIdStatic(selectedService: string): string | null {
    // Service mapping based on the ConnectTeam jobs data
    const serviceMapping: { [key: string]: string } = {
      // Direct matches (exact ConnectTeam job titles)
      'Airbnb Cleaning': 'a24f5f56-46b2-31f5-0762-cfd4bd7a9e09', // Airbnb-cleaning
      'Commercial Cleaning': '64dd29fd-4180-77f1-e412-f12afcb11e4d', // Commercial-cleaning
      'End of Lease Cleaning': '5e96bd16-9b3e-92f6-4fa6-40be582bca86', // End-of-lease-cleaning
      
      // Smart mappings based on service type
      'Regular Cleaning': 'ec3ae2a7-95b9-29a3-c0bb-6c2ef9d7f575', // Regular-cleaning
      'Once-Off Cleaning': '1e309de6-95cd-c3ec-7442-4e8124a4b89c', // Once-off-cleaning
      'NDIS Cleaning': 'bc294374-448c-9622-2ce5-32a1ce5fbafd', // Ndis-cleaning
    };

    const jobId = serviceMapping[selectedService];
    console.log(`[Static] Mapping service "${selectedService}" to jobId: ${jobId || 'NOT_FOUND'}`);
    
    return jobId || null;
  }
}

export const connectTeamService = new ConnectTeamService();
export { ConnectTeamService };
export type { ConnectTeamShift, ConnectTeamScheduler, ConnectTeamUser };
