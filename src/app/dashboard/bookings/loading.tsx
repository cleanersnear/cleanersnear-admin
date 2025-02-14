export default function BookingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="h-12 bg-gray-50"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-t border-gray-200"></div>
        ))}
      </div>
    </div>
  )
} 