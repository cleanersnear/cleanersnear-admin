"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecordPaymentForm({
  recordId,
  maxAmount,
}: {
  recordId: string;
  maxAmount: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [memo, setMemo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0 || paymentAmount > maxAmount) {
      setError(`Payment must be between $0.01 and $${maxAmount.toFixed(2)}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${recordId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          method: method || null,
          memo: memo || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      router.refresh();
      setAmount("");
      setMethod("");
      setMemo("");
      alert("Payment recorded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Payment Amount ($) *
          </label>
          <input
            type="number"
            id="amount"
            required
            step="0.01"
            min="0.01"
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max: ${maxAmount.toFixed(2)}`}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setAmount(maxAmount.toString())}
              className="text-xs text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Pay full balance
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Payment Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Select method...</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Venmo">Venmo</option>
            <option value="Zelle">Zelle</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="memo"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Memo / Notes
          </label>
          <textarea
            id="memo"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Optional notes about this payment..."
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {isSubmitting ? "Recording..." : "Record Payment"}
      </button>
    </form>
  );
}


