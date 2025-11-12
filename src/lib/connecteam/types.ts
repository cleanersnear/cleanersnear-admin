/**
 * Shared Connecteam types that can be used in both client and server components
 */

export interface ConnecteamCustomField {
  customFieldId: number;
  value: string | number | Array<{ id: number; value: string }>;
  type: string;
  name: string;
}

export interface ConnecteamUser {
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  kioskCode?: string;
  isArchived: boolean;
  customFields?: ConnecteamCustomField[];
  createdAt?: number;
  modifiedAt?: number;
  lastLogin?: number;
}

/**
 * Extract a custom field value by name from Connecteam user
 * This helper can be used in both client and server components
 */
export function getCustomFieldValue(user: ConnecteamUser, fieldName: string): string | null {
  if (!user.customFields) return null;
  
  const field = user.customFields.find(f => f.name === fieldName);
  if (!field) return null;
  
  // Handle different value types
  if (typeof field.value === 'string' || typeof field.value === 'number') {
    return String(field.value);
  }
  
  // Handle array values (like dropdowns)
  if (Array.isArray(field.value) && field.value.length > 0) {
    return field.value.map(v => v.value).join(', ');
  }
  
  return null;
}

