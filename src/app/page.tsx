'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { siteConfig } from '@/config/site'

export default function Home() {
  const router = useRouter()
  const supportEmail = 'support@cleaningprofessionals.com'

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="flex w-full flex-col gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="https://www.cleaningprofessionals.com.au/logo.png"
                alt="Cleaning Professionals logo"
                width={120}
                height={48}
                className="h-12 w-auto object-contain"
              />
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.35em] text-slate-500">
                Admin Portal
              </span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Shape every booking with confident oversight.
            </h1>
            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
              Cleaning Professionals Dashboard gives your operations team a streamlined view of bookings, crew schedules, and customer touchpoints—so the work keeps moving.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Enter Dashboard
              </button>
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <span>Need assistance? Contact {supportEmail}</span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <div className="relative h-60 w-60 rounded-[2.5rem] bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 shadow-lg shadow-blue-100/70 sm:h-72 sm:w-72">
              <div className="absolute -left-6 top-6 h-12 w-12 rounded-full border border-blue-200 bg-white shadow-sm" />
              <div className="absolute -right-4 bottom-10 h-16 w-16 rounded-3xl border border-slate-200 bg-white shadow-sm" />
              <svg
                viewBox="0 0 220 220"
                className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] text-blue-500/40"
              >
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path
                  d="M40 60C40 40 65 30 90 35C115 40 140 60 165 65C190 70 210 60 210 85C210 110 180 140 145 150C110 160 90 195 65 190C40 185 20 150 20 120C20 90 40 80 40 60Z"
                  fill="url(#grad1)"
                />
                <path
                  d="M85 115C83 100 95 89 110 91C125 93 135 104 137 119C139 134 129 149 114 151C99 153 87 130 85 115Z"
                  fill="#2563eb"
                  opacity="0.6"
                />
                <path
                  d="M70 160C80 150 110 150 130 160C150 170 180 180 170 195C160 210 120 205 95 200C70 195 55 170 70 160Z"
                  fill="#38bdf8"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-10 grid w-full gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Bookings</p>
            <p className="mt-2 font-medium text-slate-900">Daily pipeline at a glance.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team</p>
            <p className="mt-2 font-medium text-slate-900">Payroll & scheduling in sync.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Feedback</p>
            <p className="mt-2 font-medium text-slate-900">Customer sentiment resolved fast.</p>
          </div>
        </div>
      </div>
      <footer className="pb-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </footer>
    </main>
  )
}
