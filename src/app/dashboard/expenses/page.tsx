'use client'

import { useState } from 'react'
import { DocumentTextIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import CreateTransaction from './components/CreateTransaction'
import ViewExpenses from './components/ViewExpenses'
import Reports from './components/Reports'

type TabType = 'create' | 'view' | 'reports'

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('create')

  const tabs = [
    { id: 'create' as TabType, name: 'Create Transaction', icon: DocumentTextIcon },
    { id: 'view' as TabType, name: 'View Expenses', icon: EyeIcon },
    { id: 'reports' as TabType, name: 'Reports', icon: ChartBarIcon },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses Tracker</h1>
        <p className="mt-2 text-sm text-gray-600">Manage and track all business expenses</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        {/* Mobile Dropdown */}
        <div className="sm:hidden px-4 pt-4">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'create' && <CreateTransaction />}
          {activeTab === 'view' && <ViewExpenses />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </div>
    </div>
  )
}

