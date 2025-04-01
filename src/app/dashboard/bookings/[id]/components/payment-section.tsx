'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  CalculatorIcon,
  
} from '@heroicons/react/24/outline'

const PAYMENT_METHODS = ['cash', 'card', 'online', 'bank_transfer', 'refund'] as const
type PaymentMethod = 'cash' | 'card' | 'online' | 'bank_transfer' | 'refund'

type Payment = {
  id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  added_by: string
  notes?: string
}

export type PaymentSchedule = 'upfront' | 'on_cleaning_day' | 'after_cleaning'
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded'

type PaymentSectionProps = {
  bookingId: string
  originalPrice: number
  adjustedPrice: number | null | undefined
  paymentSchedule: PaymentSchedule
  paymentStatus: PaymentStatus
  payments: Payment[]
  onUpdate: (updates: {
    payments?: Payment[]
    payment_status?: PaymentStatus
    payment_schedule?: PaymentSchedule
    adjusted_total_price?: number | null
  }) => void
  updateBookingStatus?: (status: 'refunded') => void
}

export default function PaymentSection({
  bookingId,
  originalPrice,
  adjustedPrice,
  paymentSchedule,
  paymentStatus,
  payments,
  onUpdate,
  updateBookingStatus
}: PaymentSectionProps) {
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState<{
    amount: number
    payment_method: PaymentMethod
    notes: string
  }>({
    amount: 0,
    payment_method: 'cash',
    notes: ''
  })
  const [isAdjustingPrice, setIsAdjustingPrice] = useState(false)
  const [newAdjustedPrice, setNewAdjustedPrice] = useState(
    adjustedPrice !== undefined ? adjustedPrice || originalPrice : originalPrice
  )
  const [isRefunding, setIsRefunding] = useState(false)
  const [refundAmount, setRefundAmount] = useState<{
    amount: number
    notes: string
  }>({
    amount: 0,
    notes: ''
  })
  const supabase = createClientComponentClient()

  const totalPaid = payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0)
  const remainingBalance = (adjustedPrice || originalPrice) - totalPaid

  const calculatePaymentStatus = (totalPaid: number, totalPrice: number): PaymentStatus => {
    if (totalPaid === 0) return 'unpaid'
    if (totalPaid === totalPrice) return 'paid'
    if (totalPaid < totalPrice) return 'partially_paid'
    return 'paid' // If overpaid, still mark as paid
  }

  const handleScheduleChange = async (newSchedule: PaymentSchedule) => {
    try {
      const { error } = await supabase
        .from('booking_admin_details')
        .update({ payment_schedule: newSchedule })
        .eq('booking_id', bookingId)

      if (error) throw error

      onUpdate({ payment_schedule: newSchedule })
      toast.success('Payment schedule updated')
    } catch (error) {
      console.error('Error updating payment schedule:', error)
      toast.error('Failed to update payment schedule')
    }
  }

  const handleAddPayment = async () => {
    try {
      const payment = {
        id: crypto.randomUUID(),
        amount: newPayment.amount,
        payment_method: newPayment.payment_method,
        payment_date: new Date().toISOString(),
        added_by: 'Admin',
        notes: newPayment.notes
      }

      const updatedPayments = [...payments, payment]
      const newTotalPaid = updatedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
      const totalPrice = adjustedPrice || originalPrice
      const newStatus = calculatePaymentStatus(newTotalPaid, totalPrice)

      const { error } = await supabase
        .from('booking_admin_details')
        .update({ 
          payments: updatedPayments,
          payment_status: newStatus
        })
        .eq('booking_id', bookingId)

      if (error) throw error

      onUpdate({ 
        payments: updatedPayments,
        payment_status: newStatus
      })
      setIsAddingPayment(false)
      setNewPayment({ amount: 0, payment_method: 'cash', notes: '' })
      toast.success('Payment added successfully')
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    }
  }

  const handleAdjustPrice = async () => {
    try {
      const { error } = await supabase
        .from('booking_admin_details')
        .update({ adjusted_total_price: newAdjustedPrice })
        .eq('booking_id', bookingId)

      if (error) throw error

      onUpdate({ adjusted_total_price: newAdjustedPrice })
      setIsAdjustingPrice(false)
      toast.success('Price adjusted successfully')
    } catch (error) {
      console.error('Error adjusting price:', error)
      toast.error('Failed to adjust price')
    }
  }

  const handleRefund = async () => {
    try {
      if (!refundAmount.amount || !refundAmount.notes) {
        toast.error('Please enter refund amount and notes')
        return
      }

      const currentTotal = adjustedPrice || originalPrice
      const newAdjustedTotal = currentTotal - refundAmount.amount

      // Create a payment record for the price adjustment
      const payment: Payment = {
        id: crypto.randomUUID(),
        amount: -refundAmount.amount, // Show as negative amount
        payment_method: 'refund',
        payment_date: new Date().toISOString(),
        added_by: 'Admin',
        notes: `Refund: ${refundAmount.notes} (Adjusted price from $${currentTotal} to $${newAdjustedTotal})`
      }

      const updatedPayments = [...payments, payment]

      // Update both adjusted price and add payment record
      const { error } = await supabase
        .from('booking_admin_details')
        .update({ 
          payments: updatedPayments,
          adjusted_total_price: newAdjustedTotal,
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)

      if (error) throw error

      // Update local state
      onUpdate({ 
        payments: updatedPayments,
        adjusted_total_price: newAdjustedTotal,
        payment_status: 'refunded'
      })

      // Update booking status
      updateBookingStatus?.('refunded')
      
      setIsRefunding(false)
      setRefundAmount({ amount: 0, notes: '' })
      toast.success('Refund processed and price adjusted successfully')
    } catch (error) {
      console.error('Error processing refund:', error)
      toast.error('Failed to process refund')
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Header with Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded-full ${
              paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
              paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
              paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1).replace('_', ' ') || 'Unpaid'}
            </span>
            <span className="text-gray-500">
              Schedule: {paymentSchedule?.split('_').map(word => 
                word?.charAt(0).toUpperCase() + word?.slice(1)
              ).join(' ') || 'After Cleaning'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Original Price</p>
            <p className="text-lg font-medium">${originalPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Adjusted Price</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-medium">
                ${(adjustedPrice || originalPrice).toFixed(2)}
              </p>
              <button
                onClick={() => setIsAdjustingPrice(true)}
                className="text-blue-600 hover:text-blue-800"
                title="Adjust Price"
              >
                <CalculatorIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-lg font-medium text-green-600">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining Balance</p>
            <p className="text-lg font-medium text-red-600">
              ${remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Status and Schedule */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Payment Schedule</label>
          <select
            value={paymentSchedule}
            onChange={(e) => handleScheduleChange(e.target.value as PaymentSchedule)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="upfront">Pay Upfront</option>
            <option value="on_cleaning_day">Pay on Cleaning Day</option>
            <option value="after_cleaning">Pay After Cleaning</option>
          </select>
        </div>
      </div>

      {/* Payment History */}
      <div>
        {/* Buttons aligned left */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setIsAddingPayment(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Payment
          </button>
          <button
            onClick={() => setIsRefunding(true)}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={totalPaid <= 0}
          >
            Process Refund
          </button>
        </div>

        {/* Title after buttons */}
        <h4 className="text-sm font-medium text-gray-900 mb-3">Payment History</h4>

        {/* Payment history list */}
        <div className="space-y-2">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <div key={payment.id} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      {payment.payment_method === 'cash' && (
                        <BanknotesIcon className="h-4 w-4 text-green-500" />
                      )}
                      {payment.payment_method === 'card' && (
                        <CreditCardIcon className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-medium">${payment.amount.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">via {payment.payment_method}</span>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</p>
                    <p>Added by {payment.added_by}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No payments recorded yet
            </p>
          )}
        </div>
      </div>

      {/* Add Payment and Adjust Price Modals */}
      {isAddingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={0}
                    max={remainingBalance}
                    step={0.01}
                  />
                  <button
                    onClick={() => setNewPayment(prev => ({ ...prev, amount: remainingBalance }))}
                    className="w-full px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    Fill Remaining Balance (${remainingBalance.toFixed(2)})
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={newPayment.payment_method}
                  onChange={(e) => setNewPayment(prev => ({
                    ...prev,
                    payment_method: e.target.value as PaymentMethod
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingPayment(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!newPayment.amount}
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdjustingPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Adjust Price</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Price
                </label>
                <input
                  type="number"
                  value={newAdjustedPrice}
                  onChange={(e) => setNewAdjustedPrice(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAdjustingPrice(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustPrice}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={newAdjustedPrice === adjustedPrice}
                >
                  Update Price
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Refund Modal */}
      {isRefunding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Process Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={refundAmount.amount || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : 0
                      setRefundAmount(prev => ({ ...prev, amount: value }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={0}
                    max={totalPaid}
                    step={0.01}
                  />
                  <button
                    type="button"
                    onClick={() => setRefundAmount(prev => ({ ...prev, amount: totalPaid }))}
                    className="w-full px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Full Refund (${totalPaid.toFixed(2)})
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Notes
                </label>
                <textarea
                  value={refundAmount.notes}
                  onChange={(e) => setRefundAmount(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Reason for refund..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRefunding(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!refundAmount.amount || !refundAmount.notes) {
                      toast.error('Please enter refund amount and notes')
                      return
                    }
                    handleRefund()
                  }}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={!refundAmount.amount || !refundAmount.notes}
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 