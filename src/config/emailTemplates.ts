/**
 * SendGrid Email Template Configuration
 * 
 * Template IDs are stored in environment variables for easy management
 * and deployment across different environments.
 * 
 * To setup:
 * 1. Create templates in SendGrid dashboard
 * 2. Copy template IDs
 * 3. Add to .env.local file
 */

export const EMAIL_TEMPLATES = {
  CONFIRMATION: process.env.SENDGRID_TEMPLATE_CONFIRMATION || '',
  CANCELLATION: process.env.SENDGRID_TEMPLATE_CANCELLATION || '',
  COMPLETED: process.env.SENDGRID_TEMPLATE_COMPLETED || '',
  FEEDBACK: process.env.SENDGRID_TEMPLATE_FEEDBACK || '',
} as const;

export const EMAIL_FROM = {
  EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@cleaningprofessionals.com.au',
  NAME: process.env.SENDGRID_FROM_NAME || 'Cleaning Professionals',
} as const;

/**
 * Validate that all required template IDs are configured
 */
export function validateEmailTemplates(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!EMAIL_TEMPLATES.CONFIRMATION) missing.push('SENDGRID_TEMPLATE_CONFIRMATION');
  if (!EMAIL_TEMPLATES.CANCELLATION) missing.push('SENDGRID_TEMPLATE_CANCELLATION');
  if (!EMAIL_TEMPLATES.COMPLETED) missing.push('SENDGRID_TEMPLATE_COMPLETED');
  if (!EMAIL_TEMPLATES.FEEDBACK) missing.push('SENDGRID_TEMPLATE_FEEDBACK');
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get template ID by type
 */
export function getTemplateId(type: 'confirmation' | 'cancellation' | 'completed' | 'feedback'): string {
  switch (type) {
    case 'confirmation':
      return EMAIL_TEMPLATES.CONFIRMATION;
    case 'cancellation':
      return EMAIL_TEMPLATES.CANCELLATION;
    case 'completed':
      return EMAIL_TEMPLATES.COMPLETED;
    case 'feedback':
      return EMAIL_TEMPLATES.FEEDBACK;
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

