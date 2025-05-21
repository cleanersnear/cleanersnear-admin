"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddCustomerPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      unit: '',
      city: '',
      suburb: '',
      state: '',
      postcode: '',
      instructions: ''
    },
    scheduling: {
      date: '',
      time: '',
      is_flexible_date: false,
      is_flexible_time: false
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (name.startsWith('address.')) {
      setForm(f => ({ ...f, address: { ...f.address, [name.replace('address.', '')]: value } }))
    } else if (name.startsWith('scheduling.')) {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked
        setForm(f => ({ ...f, scheduling: { ...f.scheduling, [name.replace('scheduling.', '')]: checked } }))
      } else {
        setForm(f => ({ ...f, scheduling: { ...f.scheduling, [name.replace('scheduling.', '')]: value } }))
      }
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.from('customers').insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      scheduling: form.scheduling
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Customer added successfully! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard/customers')
      }, 1500)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Customer</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} required className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} required className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input name="address.street" value={form.address.street} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input name="address.unit" value={form.address.unit} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input name="address.city" value={form.address.city} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Suburb</label>
              <input name="address.suburb" value={form.address.suburb} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input name="address.state" value={form.address.state} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postcode</label>
              <input name="address.postcode" value={form.address.postcode} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea name="address.instructions" value={form.address.instructions} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input name="scheduling.date" type="date" value={form.scheduling.date} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input name="scheduling.time" type="time" value={form.scheduling.time} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div className="flex items-center gap-2 md:col-span-2 mt-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input name="scheduling.is_flexible_date" type="checkbox" checked={form.scheduling.is_flexible_date} onChange={handleChange} className="mr-2" />
                Flexible Date
              </label>
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input name="scheduling.is_flexible_time" type="checkbox" checked={form.scheduling.is_flexible_time} onChange={handleChange} className="mr-2" />
                Flexible Time
              </label>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.push('/dashboard/customers')} className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  )
} 