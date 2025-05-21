'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

// Import service templates
import NDISCleaningDetails from './services/ndis-cleaning'
import DeepCleaningDetails from './services/deep-cleaning'
import CarpetCleaningDetails from './services/carpet-cleaning'
import CommercialCleaningDetails from './services/commercial-cleaning'
import EndOfLeaseDetails from './services/end-of-lease-cleaning'
import GeneralCleaningDetails from './services/general-cleaning'
import MoveInOutDetails from './services/move-in-cleaning'
import UpholsteryCleaningDetails from './services/upholstery-cleaning'

// Import service types
import type { NDISCleaningService } from './services/ndis-cleaning'
import type { DeepCleaningService } from './services/deep-cleaning'
import type { CarpetCleaningService } from './services/carpet-cleaning'
import type { CommercialCleaningService } from './services/commercial-cleaning'
import type { EndOfLeaseService } from './services/end-of-lease-cleaning'
import type { GeneralCleaningService } from './services/general-cleaning'
import type { MoveInOutService } from './services/move-in-cleaning'
import type { UpholsteryCleaningService } from './services/upholstery-cleaning'

interface ServiceDetailsProps {
  bookingId: string
  serviceType: string
  disabled?: boolean
}

// Create a union type for all service types
type ServiceData = 
  | NDISCleaningService 
  | DeepCleaningService 
  | CarpetCleaningService 
  | CommercialCleaningService 
  | EndOfLeaseService 
  | GeneralCleaningService 
  | MoveInOutService 
  | UpholsteryCleaningService

export default function ServiceDetails({ bookingId, serviceType, disabled = false }: ServiceDetailsProps) {
  const [serviceData, setServiceData] = useState<ServiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const getServiceTable = useCallback((type: string): string => {
    const tableMap: Record<string, string> = {
      'carpet-cleaning': 'carpet_cleaning_services',
      'end-of-lease-cleaning': 'end_of_lease_services',
      'general-cleaning': 'general_cleaning_services',
      'deep-cleaning': 'deep_cleaning_services',
      'move-in-cleaning': 'move_in_out_services',
      'ndis-cleaning': 'ndis_cleaning_services',
      'commercial-cleaning': 'commercial_cleaning_services',
      'upholstery-cleaning': 'upholstery_cleaning_services',
      'window-cleaning': 'window_cleaning_enquiries'
    }
    return tableMap[type] || ''
  }, [])

  const fetchServiceData = useCallback(async () => {
    if (disabled) return;
    const table = getServiceTable(serviceType)
    if (!table) {
      console.error('Invalid service type:', serviceType)
      return
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('booking_id', bookingId)
        .single()

      if (error) throw error
      setServiceData(data as ServiceData)
    } catch (error) {
      console.error('Error fetching service data:', error)
      toast.error('Failed to load service details')
    } finally {
      setIsLoading(false)
    }
  }, [bookingId, serviceType, getServiceTable, supabase, disabled])

  useEffect(() => {
    fetchServiceData()
  }, [fetchServiceData])

  if (disabled) return null;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!serviceData) {
    return (
      <div className="text-sm text-gray-500 p-4">
        No service details available
      </div>
    )
  }

  // Return appropriate template based on service type
  const renderServiceTemplate = () => {
    switch (serviceType) {
      case 'ndis-cleaning':
        return <NDISCleaningDetails data={serviceData as NDISCleaningService} />
      case 'deep-cleaning':
        return <DeepCleaningDetails data={serviceData as DeepCleaningService} />
      case 'carpet-cleaning':
        return <CarpetCleaningDetails data={serviceData as CarpetCleaningService} />
      case 'commercial-cleaning':
        return <CommercialCleaningDetails data={serviceData as CommercialCleaningService} />
      case 'end-of-lease-cleaning':
        return <EndOfLeaseDetails data={serviceData as EndOfLeaseService} />
      case 'general-cleaning':
        return <GeneralCleaningDetails data={serviceData as GeneralCleaningService} />
      case 'move-in-cleaning':
        return <MoveInOutDetails data={serviceData as MoveInOutService} />
      case 'upholstery-cleaning':
        return <UpholsteryCleaningDetails data={serviceData as UpholsteryCleaningService} />
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