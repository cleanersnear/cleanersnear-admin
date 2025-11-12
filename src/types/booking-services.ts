/**
 * DATABASE TABLE STRUCTURE DOCUMENTATION
 * =======================================
 * 
 * This file defines TypeScript interfaces for all booking service tables and customer detail tables.
 * 
 * SERVICE DETAIL TABLES (6 total):
 * ---------------------------------
 * 1. regular_cleaning_details - Standard recurring cleaning services
 * 2. once_off_cleaning_details - One-time cleaning services
 * 3. ndis_cleaning_details - NDIS-funded cleaning services
 * 4. end_of_lease_cleaning_details - Move-out/bond cleaning services
 * 5. airbnb_cleaning_details - Short-term rental cleaning services
 * 6. commercial_cleaning_details - Business/office cleaning services
 * 
 * CUSTOMER DETAIL EXTENSION TABLES (3 total):
 * --------------------------------------------
 * 1. customer_ndis_details - NDIS-specific customer information (ndis_number, plan_manager)
 * 2. customer_end_of_lease_details - End of lease customer role (tenant/landlord/agent)
 * 3. customer_commercial_details - Business customer information (business_name, abn, etc.)
 * 
 * USAGE:
 * ------
 * - Use getServiceTableName(serviceType) to get the table name for a service
 * - Use getCustomerDetailTableName(serviceType) to get customer detail table (or null)
 * - Use requiresCustomerDetails(serviceType) to check if customer details are needed
 * - Use isValidServiceType(serviceType) to validate a service type string
 */

// Service-specific detail interfaces based on database schema

export interface RegularCleaningDetails {
  id: string;
  frequency: string;
  duration: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface OnceOffCleaningDetails {
  id: string;
  duration: string;
  two_cleaners: boolean;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface NDISCleaningDetails {
  id: string;
  frequency: string;
  duration: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface EndOfLeaseCleaningDetails {
  id: string;
  home_size: string;
  base_bathrooms: number;
  base_toilets: number;
  extra_bathrooms: number;
  extra_toilets: number;
  furnished: boolean;
  study_room: boolean;
  pets: boolean;
  steam_carpet: boolean;
  steam_bedrooms: number;
  steam_living_rooms: number;
  steam_hallway: boolean;
  steam_stairs: boolean;
  balcony: boolean;
  garage: boolean;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface AirbnbCleaningDetails {
  id: string;
  service_type: string;
  frequency: string;
  duration: string;
  linen_change: boolean;
  restock_amenities: boolean;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialCleaningDetails {
  id: string;
  service_type: string;
  frequency: string;
  hours_per_visit: number;
  staff_count: number;
  preferred_time: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

// Customer-specific detail tables (additional information)
export interface CustomerNDISDetails {
  id: string;
  customer_id: string;
  ndis_number: string;
  plan_manager: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerEndOfLeaseDetails {
  id: string;
  customer_id: string;
  role: string; // e.g., "tenant", "landlord", "agent"
  created_at: string;
  updated_at: string;
}

export interface CustomerCommercialDetails {
  id: string;
  customer_id: string;
  business_name: string;
  business_type: string;
  abn: string;
  contact_person: string;
  created_at: string;
  updated_at: string;
}

// Union type for all service details
export type ServiceDetails = 
  | RegularCleaningDetails 
  | OnceOffCleaningDetails 
  | NDISCleaningDetails 
  | EndOfLeaseCleaningDetails 
  | AirbnbCleaningDetails 
  | CommercialCleaningDetails;

// Union type for all customer detail extensions
export type CustomerDetailExtension =
  | CustomerNDISDetails
  | CustomerEndOfLeaseDetails
  | CustomerCommercialDetails;

// Service type mapping
export const SERVICE_TYPES = {
  REGULAR: 'Regular Cleaning',
  ONCE_OFF: 'Once-Off Cleaning',
  NDIS: 'NDIS Cleaning',
  END_OF_LEASE: 'End of Lease Cleaning',
  AIRBNB: 'Airbnb Cleaning',
  COMMERCIAL: 'Commercial Cleaning',
} as const;

// Table name mapping
export const SERVICE_TABLE_MAP: Record<string, string> = {
  'Regular Cleaning': 'regular_cleaning_details',
  'Once-Off Cleaning': 'once_off_cleaning_details',
  'NDIS Cleaning': 'ndis_cleaning_details',
  'End of Lease Cleaning': 'end_of_lease_cleaning_details',
  'Airbnb Cleaning': 'airbnb_cleaning_details',
  'Commercial Cleaning': 'commercial_cleaning_details',
};

// Get table name from service type
export function getServiceTableName(serviceType: string): string {
  const tableName = SERVICE_TABLE_MAP[serviceType];
  if (!tableName) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }
  return tableName;
}

// Customer detail table name mapping (for service-specific customer info)
export const CUSTOMER_DETAIL_TABLE_MAP: Record<string, string | null> = {
  'Regular Cleaning': null,
  'Once-Off Cleaning': null,
  'NDIS Cleaning': 'customer_ndis_details',
  'End of Lease Cleaning': 'customer_end_of_lease_details',
  'Airbnb Cleaning': null,
  'Commercial Cleaning': 'customer_commercial_details',
};

// Get customer detail table name from service type (returns null if not needed)
export function getCustomerDetailTableName(serviceType: string): string | null {
  if (!CUSTOMER_DETAIL_TABLE_MAP.hasOwnProperty(serviceType)) {
    console.warn(`Unknown service type for customer details: ${serviceType}`);
    return null;
  }
  return CUSTOMER_DETAIL_TABLE_MAP[serviceType];
}

// Check if a service type requires additional customer details
export function requiresCustomerDetails(serviceType: string): boolean {
  return getCustomerDetailTableName(serviceType) !== null;
}

// Validation helper - get all valid service types
export function getAllServiceTypes(): string[] {
  return Object.values(SERVICE_TYPES);
}

// Type guard to check if a string is a valid service type
export function isValidServiceType(serviceType: string): boolean {
  return SERVICE_TABLE_MAP.hasOwnProperty(serviceType);
}

