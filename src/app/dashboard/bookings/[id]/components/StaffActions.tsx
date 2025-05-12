import Link from 'next/link'
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface Staff {
  id?: string
  name?: string
  assigned_at?: string
}

interface StaffActionsProps {
  staffAssigned: Staff[]
  onAssign: (staffId: string, staffName: string) => Promise<void>
  onRemove: (staffId?: string) => Promise<void>
  onShowModal: () => void
  isLoading: boolean
}

export default function StaffActions({
  staffAssigned,
  onRemove,
  onShowModal,
  isLoading
}: StaffActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Assigned Staff</h3>
        <button
          onClick={onShowModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          disabled={isLoading}
        >
          <UserPlusIcon className="h-4 w-4" />
          {staffAssigned && staffAssigned.length > 0 ? 'Change' : 'Assign'}
        </button>
      </div>
      <div>
        {staffAssigned && staffAssigned.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {staffAssigned.map((staff, index) => (
              <li key={index} className="flex items-center justify-between py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{staff.name}</span>
                    {staff.id && (
                      <Link
                        href={`/dashboard/staff/${staff.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Assigned {staff.assigned_at ? new Date(staff.assigned_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(staff.id)}
                  className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
                  disabled={isLoading}
                  title="Remove Staff"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            No staff currently assigned
          </div>
        )}
      </div>
    </div>
  )
} 