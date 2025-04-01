export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL,
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
} as const;

// Validate required environment variables
const requiredEnvVars = ['supabaseUrl', 'supabaseAnonKey', 'frontendUrl', 'adminUrl'] as const;

requiredEnvVars.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export default env; 