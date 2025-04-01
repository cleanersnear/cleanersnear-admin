import type { NextConfig } from "next";

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
            value: "https://mxnzjvvbdmujzvhprclj.supabase.co"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Client-Info, X-Supabase-Api-Version, apikey"
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
    return [
      {
        source: '/auth/:path*',
        destination: 'https://mxnzjvvbdmujzvhprclj.supabase.co/auth/:path*'
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
