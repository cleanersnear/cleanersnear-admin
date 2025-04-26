'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddFAQPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: '',
    is_active: true,
    order_index: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaxOrderIndex = async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
      if (!error && data && data.length > 0) {
        setForm(prev => ({ ...prev, order_index: data[0].order_index + 1 }))
      } else {
        setForm(prev => ({ ...prev, order_index: 1 }))
      }
    }
    fetchMaxOrderIndex()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.question.trim() || !form.answer.trim() || !form.category.trim()) {
      setError('All fields except order are required.')
      return
    }
    setIsLoading(true)
    const { error } = await supabase.from('faqs').insert([
      {
        question: form.question,
        answer: form.answer,
        category: form.category,
        is_active: form.is_active,
        order_index: Number(form.order_index)
      }
    ])
    setIsLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/faqs')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Add New FAQ</h1>
          <p className="text-gray-500 text-sm">Create a new frequently asked question for your users.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-lg p-8">
          <div>
            <label className="block font-medium mb-1">Question</label>
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-2 rounded-md w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              rows={2}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Answer</label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-2 rounded-md w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-2 rounded-md w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Order Index</label>
            <input
              name="order_index"
              type="number"
              value={form.order_index}
              onChange={handleChange}
              className="border border-gray-300 px-4 py-2 rounded-md w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              min={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active">Active</label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add FAQ'}
          </button>
        </form>
      </div>
    </div>
  )
} 