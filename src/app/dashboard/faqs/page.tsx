'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchFaqs = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true })
      if (!error && data) {
        setFaqs(data)
        setFilteredFaqs(data)
      }
      setIsLoading(false)
    }
    fetchFaqs()
  }, [supabase])

  useEffect(() => {
    let filtered = [...faqs]
    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') return a.order_index - b.order_index
      return b.order_index - a.order_index
    })
    setFilteredFaqs(filtered)
    setCurrentPage(1) // Reset to first page on filter
  }, [searchTerm, faqs, sortOrder])

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (!error) {
      setFaqs(prev => prev.filter(faq => faq.id !== id))
    } else {
      alert('Failed to delete FAQ: ' + error.message)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage)
  const paginatedFaqs = filteredFaqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">FAQ Management</h1>
            <p className="text-gray-500 text-sm">Manage your frequently asked questions below.</p>
          </div>
          <Link href="/dashboard/faqs/add" className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 text-sm font-semibold transition">+ Add New FAQ</Link>
        </div>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-md w-full sm:w-80 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No FAQs found.</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Question</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Answer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={handleSort}>
                      Order {sortOrder === 'asc' ? '▲' : '▼'}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedFaqs.map(faq => (
                    <tr key={faq.id} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-3 max-w-xs whitespace-pre-wrap break-words text-sm text-gray-900">{faq.question}</td>
                      <td className="px-4 py-3 max-w-xs whitespace-pre-wrap break-words text-sm text-gray-700">{faq.answer}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{faq.category}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {faq.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{faq.order_index}</td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <Link href={`/dashboard/faqs/edit?id=${faq.id}`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-xs font-medium transition">Edit</Link>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFaqs.length)} of {filteredFaqs.length} FAQs
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50 bg-white hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border text-sm ${currentPage === page ? 'bg-blue-100 border-blue-400 font-bold' : 'bg-white hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50 bg-white hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 