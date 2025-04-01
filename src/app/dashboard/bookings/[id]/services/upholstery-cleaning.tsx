export type UpholsteryCleaningService = {
  id: string
  booking_id: string
  
  // Sofa details
  sofa_enabled: boolean
  sofa_large_count: number
  sofa_medium_count: number
  sofa_small_count: number
  
  // Chair details
  chair_enabled: boolean
  chair_recliner_count: number
  chair_day_count: number
  chair_arm_count: number
  chair_ottoman_count: number
  
  // Mattress details
  mattress_enabled: boolean
  mattress_large_count: number
  mattress_medium_count: number
  mattress_small_count: number
  
  // Additional details
  additional_notes: string
  
  // Pricing
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
  created_at: string
}

export default function UpholsteryCleaningDetails({ data }: { data: UpholsteryCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Sofa Cleaning */}
      {data.sofa_enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Sofa Cleaning</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.sofa_large_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Large Sofas</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.sofa_large_count}</dd>
              </div>
            )}
            {data.sofa_medium_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Medium Sofas</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.sofa_medium_count}</dd>
              </div>
            )}
            {data.sofa_small_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Small Sofas</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.sofa_small_count}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Chair Cleaning */}
      {data.chair_enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Chair Cleaning</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.chair_recliner_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Recliner Chairs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.chair_recliner_count}</dd>
              </div>
            )}
            {data.chair_day_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Day Chairs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.chair_day_count}</dd>
              </div>
            )}
            {data.chair_arm_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Arm Chairs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.chair_arm_count}</dd>
              </div>
            )}
            {data.chair_ottoman_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Ottomans</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.chair_ottoman_count}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Mattress Cleaning */}
      {data.mattress_enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Mattress Cleaning</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.mattress_large_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Large Mattresses</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.mattress_large_count}</dd>
              </div>
            )}
            {data.mattress_medium_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Medium Mattresses</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.mattress_medium_count}</dd>
              </div>
            )}
            {data.mattress_small_count > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Small Mattresses</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.mattress_small_count}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Additional Notes */}
      {data.additional_notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {data.additional_notes}
          </p>
        </div>
      )}

      {/* Price Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Price Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Price Breakdown</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div>Base Rate: ${data.price_breakdown?.base_rate || 0}</div>
              <div>Extras: ${data.price_breakdown?.extras || 0}</div>
              <div className="font-medium mt-2 pt-2 border-t">
                Total: ${data.total_price}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
} 