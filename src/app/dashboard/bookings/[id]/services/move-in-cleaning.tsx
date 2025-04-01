export type MoveInOutService = {
  id: number
  booking_id: string
  move_type: string
  
  // Property Details
  home_size_id: string
  home_size_label: string
  bathrooms: string
  toilets: string
  property_type: string
  is_furnished: boolean
  
  // Carpet Cleaning
  needs_carpet_cleaning: boolean
  carpet_bedrooms: number
  carpet_lounge_rooms: number
  carpet_has_hallway: boolean
  carpet_has_stairs: boolean
  carpet_parking_type: string
  carpet_cleaning_cost: number
  
  // Kitchen Details
  kitchen_condition: number
  kitchen_surcharge: number
  
  // Hours and Pricing
  service_hours: string
  custom_hours: number
  hourly_rate: number
  base_total: number
  extras_total: number
  final_total: number
  created_at: string
}

export default function MoveInOutDetails({ data }: { data: MoveInOutService }) {
  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Type</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Move Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.move_type}</dd>
          </div>
        </dl>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Property Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.home_size_label}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.bathrooms}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Toilets</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.toilets}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Furnished</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.is_furnished ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.is_furnished ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Carpet Cleaning */}
      {data.needs_carpet_cleaning && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Carpet Cleaning</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.carpet_bedrooms}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lounge Rooms</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.carpet_lounge_rooms}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Hallway</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${data.carpet_has_hallway ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {data.carpet_has_hallway ? 'Yes' : 'No'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stairs</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${data.carpet_has_stairs ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {data.carpet_has_stairs ? 'Yes' : 'No'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Parking Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.carpet_parking_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Carpet Cleaning Cost</dt>
              <dd className="mt-1 text-sm text-gray-900">${data.carpet_cleaning_cost}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Kitchen Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Kitchen Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Kitchen Condition</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.kitchen_condition}/5</dd>
          </div>
          {data.kitchen_surcharge > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Kitchen Surcharge</dt>
              <dd className="mt-1 text-sm text-gray-900">${data.kitchen_surcharge}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Service Hours */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Hours</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Hours Selected</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.service_hours === 'custom' ? data.custom_hours : data.service_hours} hours
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
            <dd className="mt-1 text-sm text-gray-900">${data.hourly_rate}/hour</dd>
          </div>
        </dl>
      </div>

      {/* Price Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Price Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Price Breakdown</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div>Base Total: ${data.base_total}</div>
              <div>Extras Total: ${data.extras_total}</div>
              {data.carpet_cleaning_cost > 0 && (
                <div>Carpet Cleaning: ${data.carpet_cleaning_cost}</div>
              )}
              {data.kitchen_surcharge > 0 && (
                <div>Kitchen Surcharge: ${data.kitchen_surcharge}</div>
              )}
              <div className="font-medium mt-2 pt-2 border-t">
                Final Total: ${data.final_total}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
} 