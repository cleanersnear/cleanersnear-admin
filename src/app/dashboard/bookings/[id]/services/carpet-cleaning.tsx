export type CarpetCleaningService = {
  id: string
  booking_id: string
  carpet_cleaning: {
    enabled: boolean
    bedrooms: number
    livingRooms: number
    studyRooms: number
    hallways: number
    stairs: number
    customRooms: number
  }
  rug_cleaning: {
    enabled: boolean
    large: number
    medium: number
    small: number
  }
  upholstery_cleaning: {
    enabled: boolean
    sofa: number
    chair: number
    mattress: number
  }
  additional_notes: string
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
  created_at: string
}

export default function CarpetCleaningDetails({ data }: { data: CarpetCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Carpet Cleaning Section */}
      {data.carpet_cleaning.enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Carpet Cleaning Areas</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.carpet_cleaning.bedrooms > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.bedrooms}</dd>
              </div>
            )}
            {data.carpet_cleaning.livingRooms > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Living Rooms</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.livingRooms}</dd>
              </div>
            )}
            {data.carpet_cleaning.studyRooms > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Study Rooms</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.studyRooms}</dd>
              </div>
            )}
            {data.carpet_cleaning.hallways > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Hallways</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.hallways}</dd>
              </div>
            )}
            {data.carpet_cleaning.stairs > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Stairs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.stairs}</dd>
              </div>
            )}
            {data.carpet_cleaning.customRooms > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Custom Rooms</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.carpet_cleaning.customRooms}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Rug Cleaning Section */}
      {data.rug_cleaning.enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Rug Cleaning Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.rug_cleaning.large > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Large Rugs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.rug_cleaning.large}</dd>
              </div>
            )}
            {data.rug_cleaning.medium > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Medium Rugs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.rug_cleaning.medium}</dd>
              </div>
            )}
            {data.rug_cleaning.small > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Small Rugs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.rug_cleaning.small}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Upholstery Cleaning Section */}
      {data.upholstery_cleaning.enabled && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Upholstery Cleaning Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            {data.upholstery_cleaning.sofa > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sofas</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.upholstery_cleaning.sofa}</dd>
              </div>
            )}
            {data.upholstery_cleaning.chair > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Chairs</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.upholstery_cleaning.chair}</dd>
              </div>
            )}
            {data.upholstery_cleaning.mattress > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Mattresses</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.upholstery_cleaning.mattress}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Additional Notes */}
      {data.additional_notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-900">{data.additional_notes}</p>
        </div>
      )}

      {/* Price Breakdown */}
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