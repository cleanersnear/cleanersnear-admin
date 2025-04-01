export type GeneralCleaningService = {
  id: string
  booking_id: string
  
  // Property details
  property_size: string
  bathrooms: string
  toilets: string
  property_type: string
  
  // Service frequency
  frequency_type: string
  regular_frequency: string
  
  // Pricing options
  pricing_type: string
  hours: number
  custom_hours: number
  
  // Additional options
  has_pets: boolean
  parking_type: string
  selected_extras: string[]
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

export default function GeneralCleaningDetails({ data }: { data: GeneralCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Property Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Property Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_size}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.bathrooms}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Toilets</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.toilets}</dd>
          </div>
        </dl>
      </div>

      {/* Service Frequency */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Schedule</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Frequency Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.frequency_type}</dd>
          </div>
          {data.regular_frequency && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Regular Frequency</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.regular_frequency}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Service Hours */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Hours</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Pricing Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.pricing_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Hours Required</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.custom_hours > 0 ? data.custom_hours : data.hours} hours
            </dd>
          </div>
        </dl>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Additional Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Pets</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.has_pets ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.has_pets ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Parking Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.parking_type}</dd>
          </div>
        </dl>
      </div>

      {/* Selected Extras */}
      {data.selected_extras.length > 0 && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Extra Services</h3>
          <ul className="list-disc pl-5 text-sm text-gray-900">
            {data.selected_extras.map((extra, index) => (
              <li key={index}>{extra}</li>
            ))}
          </ul>
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
              <div className="font-medium">Total: ${data.total_price}</div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
} 