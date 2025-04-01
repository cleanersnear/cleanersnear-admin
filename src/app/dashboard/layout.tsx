'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  UserGroupIcon,
  InboxIcon,
  BriefcaseIcon,
  NewspaperIcon,
  RssIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftStartOnRectangleIcon as SignOutIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { 
    name: 'Bookings',
    children: [
      { name: 'All Bookings', href: '/dashboard/bookings', icon: CalendarIcon },
      { name: 'Invoices', href: '/dashboard/invoices', icon: DocumentTextIcon },
    ]
  },
  { name: 'Enquiries', href: '/dashboard/enquiries', icon: InboxIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Staff', href: '/dashboard/staff', icon: UserGroupIcon },
  { 
    name: 'Content Management',
    children: [
      { name: 'Careers', href: '/dashboard/careers', icon: BriefcaseIcon },
      { name: 'Blog Posts', href: '/dashboard/blogs', icon: NewspaperIcon },
      { name: "FAQ's", href: '/dashboard/faqs', icon: QuestionMarkCircleIcon },
    ]
  },
  {
    name: 'Communications',
    children: [
      { name: 'Subscribers', href: '/dashboard/subscribers', icon: RssIcon },
      { name: 'Contact Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    ]
  }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) {
          router.replace('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/auth/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              item.children ? (
                <div key={item.name} className="space-y-1">
                  <p className="px-2 py-2 text-sm font-medium text-gray-900">{item.name}</p>
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className="flex items-center pl-4 px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    >
                      {child.icon && <child.icon className="w-5 h-5 mr-3" />}
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href || '#'}
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                  {item.name}
                </Link>
              )
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <SignOutIcon className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="max-w mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
} 