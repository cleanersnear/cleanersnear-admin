export type CommercialCleaningService = {
  id: string
  booking_id: string
  
  // Industry and company details
  industry: string
  other_industry_type: string
  company_name: string
  company_abn: string
  
  // Service frequency
  frequency_type: string
  regular_frequency: string
  
  // Service requirements
  hours_per_visit: number
  staff_count: number
  staff_hours_each: number
  total_hours: number
  requires_after_hours: boolean
  
  // Operating hours
  preferred_cleaning_time: string
  start_time: string
  
  // Contact information
  contact_phone: string
  contact_email: string
  additional_notes: string
  
  // Pricing
  hourly_rate: number
  total_price: number
  price_breakdown: {
    base_rate?: number
    extras?: number
    total?: number
  }
  created_at: string
}

export default function CommercialCleaningDetails({ data }: { data: CommercialCleaningService }) {
  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Company Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Company Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.company_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ABN</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.company_abn}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Industry</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.industry}
              {data.other_industry_type && ` - ${data.other_industry_type}`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Service Schedule */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Schedule</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Frequency Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.frequency_type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Regular Frequency</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.regular_frequency}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Preferred Time</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.preferred_cleaning_time}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Start Time</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.start_time}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">After Hours Required</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${data.requires_after_hours ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {data.requires_after_hours ? 'Yes' : 'No'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Service Requirements */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Service Requirements</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Hours per Visit</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.hours_per_visit} hours</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Staff Required</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.staff_count} people</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Hours per Staff</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.staff_hours_each} hours each</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Hours</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.total_hours} hours</dd>
          </div>
        </dl>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.contact_phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.contact_email}</dd>
          </div>
        </dl>
      </div>

      {/* Additional Notes */}
      {data.additional_notes && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.additional_notes}</p>
        </div>
      )}

      {/* Price Details */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Price Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
            <dd className="mt-1 text-sm text-gray-900">${data.hourly_rate}/hour</dd>
          </div>
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