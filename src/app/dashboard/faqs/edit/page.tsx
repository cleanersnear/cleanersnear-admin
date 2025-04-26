'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function EditFAQPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const supabase = createClientComponentClient()
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: '',
    is_active: true,
    order_index: 1
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchFAQ = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single()
      if (!error && data) {
        setForm({
          question: data.question,
          answer: data.answer,
          category: data.category,
          is_active: data.is_active,
          order_index: data.order_index
        })
      } else {
        setError('FAQ not found.')
      }
      setIsLoading(false)
    }
    fetchFAQ()
  }, [id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.question.trim() || !form.answer.trim() || !form.category.trim()) {
      setError('All fields except order are required.')
      return
    }
    setIsLoading(true)
    const { error } = await supabase.from('faqs').update({
      question: form.question,
      answer: form.answer,
      category: form.category,
      is_active: form.is_active,
      order_index: Number(form.order_index)
    }).eq('id', id)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit FAQ</h1>
          <p className="text-gray-500 text-sm">Update the details of this frequently asked question.</p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-sm p-8 text-center">{error}</div>
        ) : (
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function EditFAQPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditFAQPageInner />
    </Suspense>
  )
}
