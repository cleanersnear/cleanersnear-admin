'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Import service templates
import NDISCleaningDetails from './services/ndis-cleaning'
import DeepCleaningDetails from './services/deep-cleaning'

// ... import other service templates as needed

type ServiceDetailsProps = {
  bookingId: string
  serviceType: string
}

export default function ServiceDetails({ bookingId, serviceType }: ServiceDetailsProps) {
  const [serviceData, setServiceData] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchServiceData()
  }, [bookingId])

  const fetchServiceData = async () => {
    const table = getServiceTable(serviceType)
    if (!table) return

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('booking_id', bookingId)
        .single()

      if (error) throw error
      setServiceData(data)
    } catch (error) {
      console.error('Error fetching service data:', error)
    }
  }

  const getServiceTable = (type: string) => {
    // Map service types to their respective tables
    const tableMap: { [key: string]: string } = {
      'carpet-cleaning': 'carpet_cleaning_services',
      'end-of-lease-cleaning': 'end_of_lease_services',
      'general-cleaning': 'general_cleaning_services',
      'deep-cleaning': 'deep_cleaning_services',
      'move-in-cleaning': 'move_in_out_services',
      'ndis-cleaning': 'ndis_cleaning_services',
      'commercial-cleaning': 'commercial_cleaning_services',
      'after-renovation-cleaning': 'renovation_cleaning_services',
      'oven-cleaning': 'oven_cleaning_enquiries',
      'tile-and-floor-cleaning': 'floor_cleaning_enquiries',
      'upholstery-cleaning': 'upholstery_cleaning_services',
      'window-cleaning': 'window_cleaning_enquiries'
    }
    return tableMap[type]
  }

  // Return appropriate template based on service type
  const renderServiceTemplate = () => {
    if (!serviceData) return null

    switch (serviceType) {
      case 'ndis-cleaning':
        return <NDISCleaningDetails data={serviceData} />
      case 'deep-cleaning':
        return <DeepCleaningDetails data={serviceData} />
      // ... add other cases as needed
      default:
        return (
          <div className="text-sm text-gray-500">
            No template available for {serviceType}
          </div>
        )
    }
  }

  return renderServiceTemplate()
} 