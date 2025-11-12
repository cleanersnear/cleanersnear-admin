import { createClient } from '@supabase/supabase-js';
import { 
  getServiceTableName, 
  
  getCustomerDetailTableName,
  requiresCustomerDetails 
} from '@/types/booking-services';

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
      // First try to get from the bookings table to get the customer_id
      const { data: bookingData, error: bookingError } = await newSupabase
        .from('bookings')
        .select('*, customers(*)')
        .eq('booking_number', bookingNumber)
        .single();

      if (bookingError) {
        if (bookingError.code === 'PGRST116') {
          return null; // No booking found
        }
        throw bookingError;
      }

      // Flatten the customer data into the booking object for compatibility
      if (bookingData && bookingData.customers) {
        const customer = Array.isArray(bookingData.customers) ? bookingData.customers[0] : bookingData.customers;
        return {
          ...bookingData,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          suburb: customer.suburb,
          postcode: customer.postcode,
          schedule_date: customer.schedule_date, // Fetch from customers table
          notes: customer.notes, // Fetch from customers table
        };
      }

      return bookingData;
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

  // Update booking schedule date
  async updateBookingSchedule(bookingNumber: string, scheduleDate: string) {
    try {
      // First get the booking to find the customer_id
      const { data: booking, error: bookingError } = await newSupabase
        .from('bookings')
        .select('customer_id')
        .eq('booking_number', bookingNumber)
        .single();

      if (bookingError) {
        console.error('Error fetching booking for schedule update:', bookingError);
        throw bookingError;
      }

      if (!booking || !booking.customer_id) {
        throw new Error('Booking or customer_id not found');
      }

      // Update the schedule_date in the customers table (it's a date field there)
      const { data, error } = await newSupabase
        .from('customers')
        .update({ schedule_date: scheduleDate })
        .eq('id', booking.customer_id)
        .select();

      if (error) {
        console.error('Error updating schedule date in customers table:', error, {
          bookingNumber,
          customerId: booking.customer_id,
          scheduleDate,
          errorDetails: JSON.stringify(error)
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update booking schedule:', error);
      throw error;
    }
  },

  // Update customer details
  async updateCustomerDetails(customerId: string | number, customerData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    suburb?: string;
    postcode?: string;
  }) {
    try {
      const { data, error } = await newSupabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
        .select();

      if (error) {
        console.error('Error updating customer details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update customer details:', error);
      throw error;
    }
  },

  // Update booking notes
  async updateBookingNotes(bookingNumber: string, notes: string) {
    try {
      // First get the booking to find the customer_id
      const { data: booking, error: bookingError } = await newSupabase
        .from('bookings')
        .select('customer_id')
        .eq('booking_number', bookingNumber)
        .single();

      if (bookingError) {
        console.error('Error fetching booking for notes update:', bookingError);
        throw bookingError;
      }

      if (!booking || !booking.customer_id) {
        throw new Error('Booking or customer_id not found');
      }

      // Update the notes in the customers table
      const { data, error } = await newSupabase
        .from('customers')
        .update({ notes })
        .eq('id', booking.customer_id)
        .select();

      if (error) {
        console.error('Error updating notes in customers table:', error, {
          bookingNumber,
          customerId: booking.customer_id,
          errorDetails: JSON.stringify(error)
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update booking notes:', error);
      throw error;
    }
  },

  // Get service-specific details
  async getServiceDetails(serviceType: string, serviceDetailsId: number) {
    try {
      const tableName = getServiceTableName(serviceType);

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

  // Get specific customer detail extension based on service type (optimized - only queries needed table)
  async getCustomerDetailExtension(customerId: string | number, serviceType: string) {
    try {
      // Check if this service type requires customer detail extension
      if (!requiresCustomerDetails(serviceType)) {
        return null;
      }

      const tableName = getCustomerDetailTableName(serviceType);
      if (!tableName) {
        return null;
      }

      const { data, error } = await newSupabase
        .from(tableName)
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        // It's okay if no record exists - some customers may not have filled out these details
        if (error.code === 'PGRST116') {
          console.log(`No ${tableName} found for customer ${customerId}`);
          return null;
        }
        console.error(`Error fetching ${tableName}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch customer detail extension:', error);
      return null;
    }
  },

  // Update service-specific details
  async updateServiceDetails(
    serviceType: string, 
    serviceDetailsId: string | number, 
    updates: Record<string, unknown>
  ) {
    try {
      const tableName = getServiceTableName(serviceType);

      const { data, error } = await newSupabase
        .from(tableName)
        .update(updates)
        .eq('id', serviceDetailsId)
        .select();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update service details:', error);
      throw error;
    }
  },

  // Update customer detail extension (NDIS, Commercial, End of Lease)
  async updateCustomerDetailExtension(
    serviceType: string,
    customerId: string | number,
    updates: Record<string, unknown>
  ) {
    try {
      // Check if this service type requires customer detail extension
      if (!requiresCustomerDetails(serviceType)) {
        console.log(`Service type ${serviceType} does not require customer detail extension`);
        return null;
      }

      const tableName = getCustomerDetailTableName(serviceType);
      if (!tableName) {
        return null;
      }

      const { data, error } = await newSupabase
        .from(tableName)
        .update(updates)
        .eq('customer_id', customerId)
        .select();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update customer detail extension:', error);
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
      try {
        const serviceTable = getServiceTableName(booking.selected_service);
        if (serviceTable && booking.service_details_id) {
          await newSupabase.from(serviceTable).delete().eq('id', booking.service_details_id);
        }
      } catch (serviceError) {
        console.warn('Could not delete service details:', serviceError);
        // Continue with deletion even if service details fail
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
