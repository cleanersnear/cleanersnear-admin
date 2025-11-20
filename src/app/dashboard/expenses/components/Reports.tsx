'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO, isWithinInterval } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  expense_date: string
  recurrence_type: string
  notes: string
  receipt_urls: string[] | null
  created_at: string
}

type ReportTab = 'recurring' | 'oneoff'

export default function Reports() {
  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState<ReportTab>('recurring')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })

      if (error) throw error

      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Calculate monthly amount for recurring expenses
  const calculateMonthlyAmount = (expense: Expense): number => {
    const amount = expense.amount
    
    switch (expense.recurrence_type) {
      case 'daily':
        return amount * 30 // Approximate 30 days per month
      case 'weekly':
        return amount * 4.33 // Approximate 4.33 weeks per month
      case 'monthly':
        return amount
      case 'yearly':
        return amount / 12
      default:
        return 0
    }
  }

  // Filter recurring expenses (not 'once')
  const recurringExpenses = expenses.filter(
    (expense) => expense.recurrence_type !== 'once'
  )

  // Filter one-off expenses for current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  const oneOffExpenses = expenses.filter((expense) => {
    if (expense.recurrence_type !== 'once') return false
    const expenseDate = parseISO(expense.expense_date)
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })
  })

  // Calculate totals
  const recurringTotal = recurringExpenses.reduce(
    (sum, expense) => sum + calculateMonthlyAmount(expense),
    0
  )

  const oneOffTotal = oneOffExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Group recurring by category
  const recurringByCategory = recurringExpenses.reduce((acc, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = {
        expenses: [],
        total: 0,
      }
    }
    acc[category].expenses.push(expense)
    acc[category].total += calculateMonthlyAmount(expense)
    return acc
  }, {} as Record<string, { expenses: Expense[]; total: number }>)

  // Group one-off by category
  const oneOffByCategory = oneOffExpenses.reduce((acc, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = {
        expenses: [],
        total: 0,
      }
    }
    acc[category].expenses.push(expense)
    acc[category].total += expense.amount
    return acc
  }, {} as Record<string, { expenses: Expense[]; total: number }>)

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const getRecurrenceLabel = (type: string): string => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    }
    return labels[type] || type
  }

  const getRecurrenceBadge = (recurrence: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800',
      yearly: 'bg-yellow-100 text-yellow-800',
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          colors[recurrence] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {getRecurrenceLabel(recurrence)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Expense Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            View monthly projections and actual expenses
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="text-center min-w-[140px]">
            <div className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={goToCurrentMonth}
            className="ml-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            Today
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('recurring')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              ${
                activeTab === 'recurring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Regular Expenses
          </button>
          <button
            onClick={() => setActiveTab('oneoff')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              ${
                activeTab === 'oneoff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            One-off Expenses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'recurring' ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <p className="text-blue-100 text-sm font-medium">Monthly Projected Expenses</p>
                <p className="text-4xl font-bold mt-2">${recurringTotal.toFixed(2)}</p>
                <p className="text-blue-100 text-sm mt-2">
                  Based on {recurringExpenses.length} recurring expense{recurringExpenses.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Annual Projection</p>
                <p className="text-2xl font-semibold">${(recurringTotal * 12).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Expenses by Category */}
          {Object.keys(recurringByCategory).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>No recurring expenses found</p>
              <p className="text-sm mt-2">Add expenses with daily, weekly, monthly, or yearly recurrence</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(recurringByCategory)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([category, data]) => (
                  <div key={category} className="bg-white rounded-lg shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${data.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">per month</p>
                        </div>
                      </div>

                      {/* Expense Items */}
                      <div className="space-y-3">
                        {data.expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-md gap-2"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{expense.description}</p>
                                {getRecurrenceBadge(expense.recurrence_type)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ${expense.amount.toFixed(2)} {getRecurrenceLabel(expense.recurrence_type).toLowerCase()}
                              </div>
                              {expense.notes && (
                                <p className="text-xs text-gray-600 mt-1">{expense.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${calculateMonthlyAmount(expense).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">monthly</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  One-off Expenses for {format(currentMonth, 'MMMM yyyy')}
                </p>
                <p className="text-4xl font-bold mt-2">${oneOffTotal.toFixed(2)}</p>
                <p className="text-purple-100 text-sm mt-2">
                  {oneOffExpenses.length} expense{oneOffExpenses.length !== 1 ? 's' : ''} this month
                </p>
              </div>
            </div>
          </div>

          {/* Expenses by Category */}
          {Object.keys(oneOffByCategory).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>No one-off expenses for {format(currentMonth, 'MMMM yyyy')}</p>
              <p className="text-sm mt-2">One-off expenses will appear here when added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(oneOffByCategory)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([category, data]) => (
                  <div key={category} className="bg-white rounded-lg shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${data.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Expense Items */}
                      <div className="space-y-3">
                        {data.expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-md gap-2"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{expense.description}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(parseISO(expense.expense_date), 'MMM dd, yyyy')}
                              </div>
                              {expense.notes && (
                                <p className="text-xs text-gray-600 mt-1">{expense.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${expense.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Combined Monthly Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Total Expected for {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Regular Expenses</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              ${recurringTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">One-off Expenses</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              ${oneOffTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-white">
            <p className="text-sm text-gray-300 font-medium">Total Expected</p>
            <p className="text-2xl font-bold mt-1">
              ${(recurringTotal + oneOffTotal).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
