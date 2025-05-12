import { Fragment } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'

type FulfillmentStatus =
  | 'pending'    // Initially when placed order by customer
  | 'confirmed'  // When admin confirms the booking
  | 'completed'  // When service is completed
  | 'cancelled'  // When booking is cancelled

interface FulfillmentActionsProps {
  currentStatus: FulfillmentStatus
  onStatusChange: (newStatus: FulfillmentStatus) => Promise<void>
  isLoading: boolean
}

const STATUS_OPTIONS: {
  value: FulfillmentStatus
  label: string
  icon: typeof ClockIcon
  color: string
}[] = [
  {
    value: 'pending',
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-yellow-600'
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircleIcon,
    color: 'text-blue-600'
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckBadgeIcon,
    color: 'text-green-600'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-red-600'
  }
]

export default function FulfillmentActions({
  currentStatus,
  onStatusChange,
  isLoading
}: FulfillmentActionsProps) {
  const current = STATUS_OPTIONS.find(opt => opt.value === currentStatus)

  return (
    <div>
      <div className="p-3">
        <Menu as="div" className="relative inline-block text-left w-full">
          <Menu.Button
            className="inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[180px]"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              {current && <current.icon className={`h-5 w-5 ${current.color}`} aria-hidden="true" />}
              {current?.label}
            </span>
            <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" aria-hidden="true" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {STATUS_OPTIONS.map(option => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => onStatusChange(option.value)}
                        disabled={isLoading || option.value === currentStatus}
                        className={`${
                          active ? 'bg-gray-100' : 'bg-white'
                        } w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${option.value === currentStatus ? 'text-gray-400' : 'text-gray-900'}`}
                      >
                        <option.icon className={`h-5 w-5 ${option.color}`} aria-hidden="true" />
                        {option.label}
                        {option.value === currentStatus && (
                          <span className="ml-auto text-xs text-blue-500 font-semibold">Current</span>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  )
} 