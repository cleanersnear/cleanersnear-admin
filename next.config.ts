import type { NextConfig } from "next";

// Log environment variables during build (ONLY public ones!)
console.log('Building with environment:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
  NODE_ENV: process.env.NODE_ENV
});

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: '.next',
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SUPABASE_URL || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Client-Info, X-Supabase-Api-Version, apikey"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          }
        ]
      }
    ];
  },
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return [
      {
        source: '/auth/:path*',
        destination: `${supabaseUrl}/auth/:path*`
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/auth/signout',
        destination: '/auth/login',
        permanent: false
      }
    ];
  }
};

export default nextConfig;
