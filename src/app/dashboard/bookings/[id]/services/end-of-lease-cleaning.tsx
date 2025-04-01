export type EndOfLeaseService = {
  id: string
  booking_id: string
  property_details: {
    size: string
    bathrooms: number
    toilets: number
    property_type: string
    is_furnished: boolean
    has_study_room: boolean
  }
  kitchen_condition: {
    rating: number
    cleaning_level: string
  }
  carpet_cleaning: {
    required: boolean
    areas: {
      bedrooms: number
      lounge_rooms: number
      hallway: boolean
      stairs: boolean
    }
  }
  parking: {
    type: string
  }
  additional_information: {
    user_type: string
    tenancy_duration: string
    has_pets: boolean
    additional_notes: string
  }
  extras: string[]
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
  created_at: string
}

export default function EndOfLeaseDetails({ data }: { data: EndOfLeaseService }) {
  return (
    <div className="space-y-6">
      {/* Property Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Property Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_details.property_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_details.size}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_details.bathrooms}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Toilets</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.property_details.toilets}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Property Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.property_details.is_furnished ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.property_details.is_furnished ? 'Furnished' : 'Unfurnished'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Study Room</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.property_details.has_study_room ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.property_details.has_study_room ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Kitchen Condition */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Kitchen Condition</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Condition Rating</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.kitchen_condition.rating}/5</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Cleaning Level</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.kitchen_condition.cleaning_level}</dd>
          </div>
        </dl>
      </div>

      {/* Carpet Cleaning */}
      {data.carpet_cleaning.required && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Carpet Cleaning Areas</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.areas.bedrooms}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lounge Rooms</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.areas.lounge_rooms}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Hallway</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${data.carpet_cleaning.areas.hallway ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {data.carpet_cleaning.areas.hallway ? 'Yes' : 'No'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stairs</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${data.carpet_cleaning.areas.stairs ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {data.carpet_cleaning.areas.stairs ? 'Yes' : 'No'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Parking */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Parking Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Parking Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.parking.type}</dd>
          </div>
        </dl>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Additional Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">User Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.additional_information.user_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Tenancy Duration</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.additional_information.tenancy_duration}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Pets</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.additional_information.has_pets ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.additional_information.has_pets ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Extras */}
      {data.extras.length > 0 && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Extra Services</h3>
          <ul className="list-disc pl-5 text-sm text-gray-900">
            {data.extras.map((extra, index) => (
              <li key={index}>{extra}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Notes */}
      {data.additional_information.additional_notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {data.additional_information.additional_notes}
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