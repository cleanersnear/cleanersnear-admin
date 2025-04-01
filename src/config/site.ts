import env from '@/utils/env'

export const siteConfig = {
  name: 'Cleaning Professionals Admin',
  description: 'Admin dashboard for managing Cleaning Professionals services',
  url: env.adminUrl,
  frontendUrl: env.frontendUrl,
  supabaseUrl: env.supabaseUrl,
  supabaseAnonKey: env.supabaseAnonKey,
  links: {
    frontend: env.frontendUrl,
    admin: env.adminUrl,
  },
  organization: {
    name: 'Cleaning Professionals',
    description: 'Manage bookings and services for Cleaning Professionals',
  },
  comingSoon: {
    name: 'Cleaner Near',
    description: 'Coming Soon',
  },
} as const 