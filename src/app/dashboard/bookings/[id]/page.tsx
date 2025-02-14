import BookingDetail from './booking-detail'

export default async function BookingPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await params
  return <BookingDetail id={resolvedParams.id} />
} 