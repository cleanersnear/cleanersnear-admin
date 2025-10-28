import { createClient } from '@supabase/supabase-js';

// New booking system database configuration
// Uses NEW_* environment variables for the normalized booking database
const newSupabaseUrl = process.env.NEXT_PUBLIC_NEW_SUPABASE_URL;
const newSupabaseAnonKey = process.env.NEXT_PUBLIC_NEW_SUPABASE_ANON_KEY;

if (!newSupabaseUrl || !newSupabaseAnonKey) {
  throw new Error(
    'Missing NEW booking system environment variables. Please set NEXT_PUBLIC_NEW_SUPABASE_URL and NEXT_PUBLIC_NEW_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client for new booking system
export const newSupabase = createClient(newSupabaseUrl, newSupabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Legacy/Quick-book database client (old supabase)
const oldSupabaseUrl = process.env.OLD_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const oldSupabaseAnonKey = process.env.OLD_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const oldSupabase = (oldSupabaseUrl && oldSupabaseAnonKey)
  ? createClient(oldSupabaseUrl, oldSupabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Database functions for new booking system
export const newBookingService = {
  // Get all bookings from normalized structure
  async getAllBookings(limit = 50, offset = 0, searchQuery?: string) {
    try {
      let query = newSupabase
        .from('complete_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        const searchPattern = `%${searchQuery.toLowerCase()}%`;
        query = query.or(
          `booking_number.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},address.ilike.${searchPattern}`
        );
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching new bookings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch new bookings:', error);
      throw error;
    }
  },

  // Get booking by booking number
  async getBookingByNumber(bookingNumber: string) {
    try {
      const { data, error } = await newSupabase
        .from('complete_bookings')
        .select('*')
        .eq('booking_number', bookingNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No booking found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch booking by number:', error);
      throw error;
    }
  },

  // Get today's bookings
  async getTodaysBookings() {
    try {
      const { data, error } = await newSupabase
        .from('todays_bookings')
        .select('*');

      if (error) {
        console.error('Error fetching today\'s bookings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch today\'s bookings:', error);
      throw error;
    }
  },

  // Get pending bookings
  async getPendingBookings() {
    try {
      const { data, error } = await newSupabase
        .from('pending_bookings')
        .select('*');

      if (error) {
        console.error('Error fetching pending bookings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending bookings:', error);
      throw error;
    }
  },

  // Update booking status
  async updateBookingStatus(bookingNumber: string, status: string) {
    try {
      const { data, error } = await newSupabase
        .from('bookings')
        .update({ status })
        .eq('booking_number', bookingNumber)
        .select();

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  },

  // Get service-specific details
  async getServiceDetails(serviceType: string, serviceDetailsId: number) {
    try {
      let tableName;
      
      switch (serviceType) {
        case 'Regular Cleaning':
          tableName = 'regular_cleaning_details';
          break;
        case 'Once-Off Cleaning':
          tableName = 'once_off_cleaning_details';
          break;
        case 'NDIS Cleaning':
          tableName = 'ndis_cleaning_details';
          break;
        case 'End of Lease Cleaning':
          tableName = 'end_of_lease_cleaning_details';
          break;
        case 'Airbnb Cleaning':
          tableName = 'airbnb_cleaning_details';
          break;
        case 'Commercial Cleaning':
          tableName = 'commercial_cleaning_details';
          break;
        default:
          throw new Error(`Unknown service type: ${serviceType}`);
      }

      const { data, error } = await newSupabase
        .from(tableName)
        .select('*')
        .eq('id', serviceDetailsId)
        .single();

      if (error) {
        console.error(`Error fetching ${tableName} details:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch service details:', error);
      throw error;
    }
  },

  // Get customer sub-details (NDIS, Commercial, End of Lease)
  async getCustomerSubDetails(customerId: number) {
    try {
      const [ndisDetails, commercialDetails, endOfLeaseDetails] = await Promise.all([
        newSupabase.from('customer_ndis_details').select('*').eq('customer_id', customerId).single(),
        newSupabase.from('customer_commercial_details').select('*').eq('customer_id', customerId).single(),
        newSupabase.from('customer_end_of_lease_details').select('*').eq('customer_id', customerId).single(),
      ]);

      return {
        ndisDetails: ndisDetails.data,
        commercialDetails: commercialDetails.data,
        endOfLeaseDetails: endOfLeaseDetails.data,
      };
    } catch (error) {
      console.error('Failed to fetch customer sub-details:', error);
      throw error;
    }
  },

  // Get notifications for a booking
  async getBookingNotifications(bookingNumber: string) {
    try {
      const { data, error } = await newSupabase
        .from('notifications')
        .select('*')
        .eq('booking_number', bookingNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching booking notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch booking notifications:', error);
      throw error;
    }
  },

  // Create a new notification
  async createNotification(notificationData: {
    booking_id: string;
    booking_number: string;
    notification_type: string;
    title: string;
    message: string;
    delivery_method: string;
    recipient_email?: string;
    recipient_phone?: string;
  }) {
    try {
      const { data, error } = await newSupabase
        .from('notifications')
        .insert([{
          ...notificationData,
          status: 'pending',
          retry_count: 0,
          max_retries: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  },

  // Update notification status
  async updateNotificationStatus(notificationId: string, updateData: {
    status?: string;
    external_id?: string;
    external_status?: string;
    error_message?: string;
    retry_count?: number;
    sent_at?: string;
    delivered_at?: string;
  }) {
    try {
      const { data, error } = await newSupabase
        .from('notifications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update notification status:', error);
      throw error;
    }
  },

  // Delete booking and related records
  async deleteBooking(bookingNumber: string) {
    try {
      // First get the booking to find related IDs
      const { data: booking, error: fetchError } = await newSupabase
        .from('bookings')
        .select('id, customer_id, service_details_id, selected_service')
        .eq('booking_number', bookingNumber)
        .single();

      if (fetchError) throw fetchError;
      if (!booking) throw new Error('Booking not found');

      // Delete in order (child records first, then parent)
      
      // 1. Delete notifications
      await newSupabase.from('notifications').delete().eq('booking_number', bookingNumber);

      // 2. Delete customer sub-details
      await newSupabase.from('customer_ndis_details').delete().eq('customer_id', booking.customer_id);
      await newSupabase.from('customer_commercial_details').delete().eq('customer_id', booking.customer_id);
      await newSupabase.from('customer_end_of_lease_details').delete().eq('customer_id', booking.customer_id);

      // 3. Delete service-specific details
      const serviceTableMap: { [key: string]: string } = {
        'Regular Cleaning': 'regular_cleaning_details',
        'Once-Off Cleaning': 'once_off_cleaning_details',
        'NDIS Cleaning': 'ndis_cleaning_details',
        'End of Lease Cleaning': 'end_of_lease_cleaning_details',
        'Airbnb Cleaning': 'airbnb_cleaning_details',
        'Commercial Cleaning': 'commercial_cleaning_details',
      };
      
      const serviceTable = serviceTableMap[booking.selected_service];
      if (serviceTable && booking.service_details_id) {
        await newSupabase.from(serviceTable).delete().eq('id', booking.service_details_id);
      }

      // 4. Delete the main booking
      await newSupabase.from('bookings').delete().eq('booking_number', bookingNumber);

      // 5. Delete the customer (if no other bookings reference it)
      const { data: otherBookings } = await newSupabase
        .from('bookings')
        .select('id')
        .eq('customer_id', booking.customer_id);

      if (!otherBookings || otherBookings.length === 0) {
        await newSupabase.from('customers').delete().eq('id', booking.customer_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete booking:', error);
      throw error;
    }
  }
};

export default newSupabase;
