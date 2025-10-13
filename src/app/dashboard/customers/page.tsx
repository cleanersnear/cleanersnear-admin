'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { EllipsisVerticalIcon, UserCircleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline'
import { ChevronDownIcon as ChevronDownSolid, ChevronUpIcon as ChevronUpSolid } from '@heroicons/react/24/solid'
import Papa, { ParseResult } from 'papaparse'
import { useRouter } from 'next/navigation'
import { newBookingService } from '@/config/newDatabase'

interface Customer {
  id: string
  booking_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
  booking_number?: string
  address: {
    street?: string
    city?: string
    suburb?: string
    postcode?: string
    state?: string
    unit?: string
    instructions?: string
  } | null
  scheduling: {
    date?: string
    time?: string | null
    is_flexible_date?: boolean
    is_flexible_time?: boolean
  } | null
  duplicate_count?: number
  related_customers?: Customer[]
  source?: 'old' | 'new' // Track which database the customer comes from
}

type CustomerGroup = 'serviced' | 'subscribed' | 'thirdparty'

interface ImportedCustomer {
  'First Name': string
  'Last Name': string
  'Email': string
  'Phone': string
  'Street': string
  'Unit': string
  'City': string
  'Suburb': string
  'State': string
  'Postcode': string
  'Instructions': string
  'Scheduling Date': string
  'Scheduling Time': string
  'Flexible Date': string
  'Flexible Time': string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<(Customer & { booking_number?: string })[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<(Customer & { booking_number?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'name' | 'email' | 'booking_number'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [group, setGroup] = useState<CustomerGroup>('serviced')
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; customerId: string | null }>({ show: false, customerId: null })
  const [showOrders, setShowOrders] = useState<{ show: boolean; customer: Customer | null }>({ show: false, customer: null })
  const supabase = createClientComponentClient()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const router = useRouter()
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  const groupOptions: CustomerGroup[] = ['serviced', 'subscribed', 'thirdparty']

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      
      try {
        // Fetch from old database
        const [{ data: customersData, error: customersError }, { data: bookingsData }] = await Promise.all([
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('bookings').select('id, booking_number')
        ])
        
        let oldCustomers: Customer[] = []
        if (!customersError && customersData && bookingsData) {
          oldCustomers = customersData.map((customer: Customer) => {
            const booking = bookingsData.find((b: { id: string }) => b.id === customer.booking_id)
            return { 
              ...customer, 
              booking_number: booking ? booking.booking_number : undefined,
              source: 'old' as const
            }
          })
        }

        // Fetch from new database
        let newCustomers: Customer[] = []
        try {
          const newBookingsData = await newBookingService.getAllBookings(1000, 0) // Get all customers
          newCustomers = newBookingsData.map((booking: {
            id: number;
            booking_number: string;
            first_name: string;
            last_name: string;
            email: string;
            phone: string;
            created_at: string;
            address: string;
            suburb: string;
            postcode: string;
            notes: string;
            schedule_date: string;
          }) => ({
            id: `new_${booking.id}`,
            booking_id: booking.booking_number,
            first_name: booking.first_name,
            last_name: booking.last_name,
            email: booking.email,
            phone: booking.phone,
            created_at: booking.created_at,
            booking_number: booking.booking_number,
            address: {
              street: booking.address,
              suburb: booking.suburb,
              postcode: booking.postcode,
              instructions: booking.notes
            },
            scheduling: {
              date: booking.schedule_date,
              time: null,
              is_flexible_date: false,
              is_flexible_time: false
            },
            source: 'new' as const
          }))
        } catch (newError) {
          console.warn('Could not fetch new customers:', newError)
        }

        // Combine and sort all customers
        const allCustomers = [...oldCustomers, ...newCustomers].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setCustomers(allCustomers)
        setFilteredCustomers(allCustomers)
      } catch (error) {
        console.error('Error fetching customers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCustomers()
  }, [supabase])

  useEffect(() => {
    let filtered = [...customers]
    
    // Group by email first
    const emailGroups = new Map<string, Customer[]>()
    filtered.forEach(customer => {
      if (customer.email) {
        const existing = emailGroups.get(customer.email) || []
        emailGroups.set(customer.email, [...existing, customer])
      }
    })

    // Create new array with grouped customers
    const groupedCustomers = Array.from(emailGroups.entries()).map(([, group]) => {
      if (group.length === 1) return group[0]
      
      // If multiple entries exist, use the most recent one as primary
      const primary = group.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      )
      
      return {
        ...primary,
        duplicate_count: group.length - 1,
        related_customers: group.filter(c => c.id !== primary.id)
      }
    })

    // Apply group filtering
    if (group === 'serviced') {
      filtered = groupedCustomers.filter(c => !!c.booking_number)
    } else if (group === 'subscribed') {
      filtered = groupedCustomers.filter(c => !c.booking_number)
    } else if (group === 'thirdparty') {
      // Placeholder for future logic
      filtered = []
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(c =>
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.booking_number && c.booking_number.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aField, bField
      if (sortField === 'name') {
        aField = (a.first_name + ' ' + a.last_name).toLowerCase()
        bField = (b.first_name + ' ' + b.last_name).toLowerCase()
      } else if (sortField === 'email') {
        aField = (a.email || '').toLowerCase()
        bField = (b.email || '').toLowerCase()
      } else {
        aField = (a.booking_number || '').toLowerCase()
        bField = (b.booking_number || '').toLowerCase()
      }
      if (aField < bField) return sortOrder === 'asc' ? -1 : 1
      if (aField > bField) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredCustomers(filtered)
  }, [searchTerm, customers, sortField, sortOrder, group])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
          setOpenDropdown(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openDropdown])

  const handleExport = () => {
    const exportData = filteredCustomers.map(customer => ({
      'First Name': customer.first_name,
      'Last Name': customer.last_name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Booking Number': customer.booking_number || '',
      'Street': customer.address?.street || '',
      'Unit': customer.address?.unit || '',
      'Suburb': customer.address?.suburb || '',
      'State': customer.address?.state || '',
      'Postcode': customer.address?.postcode || '',
      'Instructions': customer.address?.instructions || '',
      'Scheduling Date': customer.scheduling?.date || '',
      'Scheduling Time': customer.scheduling?.time || '',
      'Flexible Date': customer.scheduling?.is_flexible_date ? 'Yes' : 'No',
      'Flexible Time': customer.scheduling?.is_flexible_time ? 'Yes' : 'No'
    }))

    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    try {
      if (customer.source === 'new') {
        // For new database customers, we need to delete the booking
        await newBookingService.deleteBooking(customer.booking_number || '')
      } else {
        // For old database customers, delete from customers table
        const { error } = await supabase.from('customers').delete().eq('id', customerId)
        if (error) throw error
      }
      
      setCustomers(customers.filter(c => c.id !== customerId))
      setDeleteConfirm({ show: false, customerId: null })
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer: ' + (error as Error).message)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      complete: async (results: ParseResult<ImportedCustomer>) => {
        const customers = results.data.map((row: ImportedCustomer) => ({
          first_name: row['First Name'] || '',
          last_name: row['Last Name'] || '',
          email: row['Email'] || '',
          phone: row['Phone'] || '',
          address: {
            street: row['Street'] || '',
            unit: row['Unit'] || '',
            city: row['City'] || '',
            suburb: row['Suburb'] || '',
            state: row['State'] || '',
            postcode: row['Postcode'] || '',
            instructions: row['Instructions'] || ''
          },
          scheduling: {
            date: row['Scheduling Date'] || '',
            time: row['Scheduling Time'] || '',
            is_flexible_date: (row['Flexible Date'] || '').toLowerCase() === 'yes',
            is_flexible_time: (row['Flexible Time'] || '').toLowerCase() === 'yes'
          }
        }))
        // Filter out empty rows
        const validCustomers = customers.filter(c => c.first_name || c.last_name || c.email)
        if (validCustomers.length === 0) {
          setImportSuccess(null)
          alert('No valid customers found in the file.')
          return
        }
        const { error } = await supabase.from('customers').insert(validCustomers)
        if (error) {
          setImportSuccess(null)
          alert('Error importing customers: ' + error.message)
        } else {
          setImportSuccess('Customers imported successfully! Reloading...')
          setTimeout(() => {
            setImportSuccess(null)
            window.location.reload()
          }, 1500)
        }
      },
      header: true
    })
  }

  const handleRowClick = (customer: Customer) => {
    if (customer.source === 'new') {
      // For new database customers, navigate to new booking details
      router.push(`/dashboard/new-bookings/${customer.booking_number}`)
    } else {
      // For old database customers, navigate to old customer details
      window.location.href = `/dashboard/customers/${customer.id}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white shadow flex items-center justify-between px-6 py-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Management</h1>
        <button
          onClick={() => router.push('/dashboard/customers/add')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow transition"
        >
          <PlusIcon className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex  mb-6 px-6">
        {['Serviced Once', 'Subscribed Only', '3rd Party Imports'].map((label, idx) => (
          <button
            key={label}
            className={`px-5 py-2 rounded-full text-sm font-medium mr-2 transition-all duration-150
              ${group === groupOptions[idx]
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setGroup(groupOptions[idx])}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 mb-4">
        {/* Left: Filter & Sort */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select
              className="appearance-none border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-full text-xs h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer pr-8"
              value={sortField}
              onChange={e => setSortField(e.target.value as 'name' | 'email' | 'booking_number')}
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="booking_number">Sort by Booking Number</option>
            </select>
            <ChevronDownSolid className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-400
              ${sortOrder === 'asc' ? 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
            style={{ boxShadow: 'none', border: 'none' }}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
          >
            {sortOrder === 'asc' ? (
              <ChevronUpSolid className="w-4 h-4" />
            ) : (
              <ChevronDownSolid className="w-4 h-4" />
            )}
          </button>
        </div>
        {/* Right: Search, Import, Export */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 pl-10 pr-3 py-2 rounded-full w-56 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <label className="inline-flex items-center gap-1 px-4 py-2 rounded-full border bg-gray-100 hover:bg-gray-200 text-sm font-medium cursor-pointer transition">
            <ArrowUpTrayIcon className="w-5 h-5" /> Import
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button 
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full border bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition"
          >
            <ArrowDownTrayIcon className="w-5 h-5" /> Export
          </button>
        </div>
      </div>

      {importSuccess && <div className="text-green-600 text-sm mb-2 px-6">{importSuccess}</div>}

      {isLoading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="overflow-x-auto px-6 pb-8" style={{ overflow: 'visible' }}>
          <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-visible shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Booking Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer, idx) => (
                <tr
                  key={customer.id}
                  className={`transition hover:bg-blue-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleRowClick(customer)}
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-base">
                      {customer.first_name?.charAt(0).toUpperCase()}{customer.last_name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2">
                        {customer.first_name} {customer.last_name}
                        {customer.source === 'new' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            New System
                          </span>
                        )}
                        {customer.duplicate_count ? (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOrders({ show: true, customer });
                            }}
                          >
                            +{customer.duplicate_count} more
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.email}
                    {customer.duplicate_count ? (
                      <div className="text-xs text-gray-400 mt-1">
                        {customer.related_customers?.map(c => c.booking_number).filter(Boolean).join(', ')}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">
                    {customer.booking_number ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                        {customer.booking_number}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {customer.address ? (
                      <div>
                        {customer.address.street || ''} {customer.address.unit ? `Unit: ${customer.address.unit}` : ''}<br/>
                        {customer.address.suburb || ''} {customer.address.state || ''} {customer.address.postcode || ''}<br/>
                        {customer.address.instructions && <span>Note: {customer.address.instructions}</span>}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                    <button
                      className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                      onClick={() => setOpenDropdown(openDropdown === customer.id ? null : customer.id)}
                      aria-label="Actions"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    {openDropdown === customer.id && (
                      <div
                        ref={el => void (dropdownRefs.current[customer.id] = el)}
                        className="absolute right-0 z-50 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg py-1"
                      >
                        <button
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => { handleRowClick(customer); setOpenDropdown(null); }}
                        >
                          <UserCircleIcon className="w-4 h-4" /> View
                        </button>
                        {customer.source === 'old' && (
                          <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { 
                              setOpenDropdown(null); 
                              router.push(`/dashboard/customers/${customer.id}/edit`);
                            }}
                          >
                            <PencilIcon className="w-4 h-4" /> Edit
                          </button>
                        )}
                        {customer.source === 'new' && (
                          <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => { 
                              setOpenDropdown(null); 
                              router.push(`/dashboard/new-bookings/${customer.booking_number}/edit`);
                            }}
                          >
                            <PencilIcon className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => { 
                            setOpenDropdown(null); 
                            setDeleteConfirm({ show: true, customerId: customer.id });
                          }}
                        >
                          <TrashIcon className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Modal */}
      {showOrders.show && showOrders.customer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customer Orders</h3>
              <button
                onClick={() => setShowOrders({ show: false, customer: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="font-medium">{showOrders.customer.first_name} {showOrders.customer.last_name}</p>
              <p className="text-gray-600">{showOrders.customer.email}</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Booking Number</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {showOrders.customer.related_customers?.map((related) => (
                    <tr key={related.id} className="border-t">
                      <td className="px-4 py-2">{related.booking_number || 'N/A'}</td>
                      <td className="px-4 py-2">{related.scheduling?.date || 'N/A'}</td>
                      <td className="px-4 py-2">{related.scheduling?.time || 'N/A'}</td>
                      <td className="px-4 py-2">
                        {related.booking_number ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Serviced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Subscribed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, customerId: null })}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm.customerId && handleDelete(deleteConfirm.customerId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 