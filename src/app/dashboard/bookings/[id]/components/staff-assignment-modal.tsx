'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

type Staff = {
  id: string
  first_name: string
  last_name: string
  role: string
  status: string
  email?: string
  phone?: string
}

type StaffAssignmentModalProps = {
  onClose: () => void
  onAssign: (staffId: string, staffName: string) => void
  currentAssignments: {
    id?: string
    name?: string
  }[]
}

export default function StaffAssignmentModal({
  onClose,
  onAssign,
  currentAssignments
}: StaffAssignmentModalProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchStaff = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          role,
          status
        `)
        .eq('status', 'active')
        .order('first_name')

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff members')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleAssign = () => {
    if (!selectedStaff) return
    const staffMember = staff.find(s => s.id === selectedStaff)
    if (staffMember) {
      onAssign(
        staffMember.id, 
        `${staffMember.first_name} ${staffMember.last_name}`
      )
      onClose()
    }
  }

  // Filter out already assigned staff, but include currently assigned staff when changing
  const availableStaff = staff.filter(s => {
    if (currentAssignments.length === 0) return true
    return !currentAssignments.some(a => a.id === s.id) || s.id === selectedStaff
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p>Loading staff...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {currentAssignments.length > 0 ? 'Change Staff' : 'Assign Staff'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {availableStaff.length === 0 ? (
          <p className="text-sm text-gray-500">No available staff members</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Staff Member
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-2"
              >
                <option value="">Select a staff member</option>
                {availableStaff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {`${staffMember.first_name} ${staffMember.last_name}`} - {staffMember.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedStaff}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {currentAssignments.length > 0 ? 'Change Staff' : 'Assign Staff'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 