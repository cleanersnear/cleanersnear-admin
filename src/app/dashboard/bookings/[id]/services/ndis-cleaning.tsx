export type NDISCleaningService = {
  id: string
  booking_id: string
  home_size: string
  bathrooms: string
  toilets: string
  property_type: string
  has_pets: boolean
  frequency_type: string
  regular_frequency: string
  hours_selected: number
  custom_hours: number
  client_number: string
  client_name: string
  case_manager: {
    name?: string
    phone?: string
    email?: string
  }
  funding_company: {
    name?: string
    contact?: string
  }
  parking_type: string
  selected_extras: string[]
  provides_equipment: boolean
  additional_notes: string
  hourly_rate: number
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
}

export default function NDISCleaningDetails({ data }: { data: NDISCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Property Details Section */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Property Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Home Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.home_size}</dd>
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
            <dt className="text-sm font-medium text-gray-500">Has Pets</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.has_pets ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Parking Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.parking_type}</dd>
          </div>
        </dl>
      </div>

      {/* Service Schedule */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Schedule</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Frequency Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.frequency_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Regular Frequency</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.regular_frequency}</dd>
          </div>
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

      {/* NDIS Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">NDIS Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Client Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.client_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Client Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.client_name}</dd>
          </div>
          {data.case_manager && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Case Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div>{data.case_manager.name}</div>
                {data.case_manager.phone && (
                  <div className="text-gray-500">{data.case_manager.phone}</div>
                )}
                {data.case_manager.email && (
                  <div className="text-gray-500">{data.case_manager.email}</div>
                )}
              </dd>
            </div>
          )}
          {data.funding_company && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Funding Company</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div>{data.funding_company.name}</div>
                {data.funding_company.contact && (
                  <div className="text-gray-500">{data.funding_company.contact}</div>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Service Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Equipment Provided</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.provides_equipment ? 'Yes' : 'No'}
            </dd>
          </div>
          {data.selected_extras.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Selected Extras</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <ul className="list-disc pl-4">
                  {data.selected_extras.map((extra, index) => (
                    <li key={index}>{extra}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Pricing */}
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