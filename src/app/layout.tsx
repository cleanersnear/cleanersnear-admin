import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Cleaning Professionals - Admin Dashboard",
  description: "Admin dashboard for managing Cleaning Professionals services",
  icons: {
    icon: [
      {
        url: '/favicon.png', // Your CP logo
        href: '/favicon.png',
      },
    ],
    // Add different sizes if needed
    apple: [
      {
        url: '/favicon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
