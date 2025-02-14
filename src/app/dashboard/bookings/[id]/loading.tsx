export default function BookingDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, j) => (
                  <div key={j}>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded mt-2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 