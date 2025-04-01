import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://admin.cleaningprofessionals.com.au https://*.supabase.co"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://admin.cleaningprofessionals.com.au"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization"
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
  }
};

export default nextConfig;
