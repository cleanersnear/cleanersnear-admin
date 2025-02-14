type DeepCleaningService = {
  id: string
  booking_id: string
  home_size: string
  kitchen_clean: boolean
  oven_clean: boolean
  bathroom_clean: boolean
  bedroom_clean: boolean
  toilet_clean: boolean
  lounge_clean: boolean
  hallway_clean: boolean
  stairs_clean: boolean
  custom_area_enabled: boolean
  custom_area_description: string
  hours_selected: string
  custom_hours: number
  hourly_rate: number
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
  additional_notes: string
  created_at: string
  updated_at: string
}

export default function DeepCleaningDetails({ data }: { data: DeepCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Property Information */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Property Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Home Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.home_size}</dd>
          </div>
        </dl>
      </div>

      {/* Cleaning Areas */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Areas to Clean</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Kitchen</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.kitchen_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Oven</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.oven_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Bathroom</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.bathroom_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Bedroom</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.bedroom_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Toilet</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.toilet_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lounge</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.lounge_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Hallway</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.hallway_clean ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stairs</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.stairs_clean ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>

      {/* Custom Area */}
      {data.custom_area_enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Custom Area Details</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.custom_area_description}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Service Hours */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Hours</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Hours Selected</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.hours_selected}</dd>
          </div>
          {data.custom_hours > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Custom Hours</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.custom_hours}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Pricing Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Pricing Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
            <dd className="mt-1 text-sm text-gray-900">${data.hourly_rate}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Price</dt>
            <dd className="mt-1 text-sm text-gray-900">${data.total_price}</dd>
          </div>
          {data.price_breakdown && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Price Breakdown</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div>Base Rate: ${data.price_breakdown.base_rate || 0}</div>
                <div>Extras: ${data.price_breakdown.extras || 0}</div>
                <div className="font-medium">Total: ${data.price_breakdown.total || 0}</div>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Additional Notes */}
      {data.additional_notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {data.additional_notes}
          </p>
        </div>
      )}
    </div>
  )
} 