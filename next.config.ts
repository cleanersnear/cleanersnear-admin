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
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://admin.cleaningprofessionals.com.au https://*.supabase.co; connect-src 'self' https://*.supabase.co https://admin.cleaningprofessionals.com.au https://mxnzjvvbdmujzvhprclj.supabase.co"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate"
          },
          {
            key: "Pragma",
            value: "no-cache"
          },
          {
            key: "Expires",
            value: "0"
          }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: "/auth/:path*"
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
