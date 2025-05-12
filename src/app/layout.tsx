import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Inter } from 'next/font/google'
import env from '@/utils/env'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Cleaning Professionals - Admin Dashboard",
  description: "Admin dashboard for managing Cleaning Professionals services",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      {
        url: '/favicon.png',
        href: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  
  metadataBase: new URL(env.adminUrl as string),
  alternates: {
    canonical: env.adminUrl as string,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
