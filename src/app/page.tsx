'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { siteConfig } from '@/config/site'

interface OrganizationButtonProps {
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}

const OrganizationButton = ({ title, description, onClick, disabled = false }: OrganizationButtonProps) => (
  <button
    className={`p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-all 
               border-2 border-gray-100 hover:border-gray-200
               flex flex-col items-center justify-center
               ${disabled ? 'opacity-50 cursor-not-allowed' : 'group'}`}
    onClick={onClick}
    disabled={disabled}
    aria-disabled={disabled}
  >
    <h2 className={`text-xl font-semibold text-gray-900 mb-2 ${!disabled && 'group-hover:text-blue-600'}`}>
      {title}
    </h2>
    <p className="text-gray-500 text-sm">
      {description}
    </p>
  </button>
)

export default function Home() {
  const router = useRouter()

  const handleOrganizationSelect = useCallback((path: string) => {
    router.push(path)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Organization
        </h1>
        <p className="text-gray-600">
          Select the organization you want to manage
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-2xl">
        <OrganizationButton
          title={siteConfig.organization.name}
          description={siteConfig.organization.description}
          onClick={() => handleOrganizationSelect('/dashboard')}
        />

        <OrganizationButton
          title={siteConfig.comingSoon.name}
          description={siteConfig.comingSoon.description}
          onClick={() => {}}
          disabled
        />
      </div>

      <div className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </div>
  )
}
