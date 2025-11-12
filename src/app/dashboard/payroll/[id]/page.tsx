import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayrollRecord } from "@/lib/supabase/payroll";
import { RecordPaymentForm } from "./record-payment-form";
import { PayrollStatusBadge } from "./status-badge";
import { UpdateStatusForm } from "./update-status-form";

export const dynamic = "force-dynamic";

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getPayrollRecord(id as `${string}-${string}-${string}-${string}-${string}`);

  if (!record) {
    notFound();
  }

  const totalPay = Number(record.total_pay);
  const paidAmount = record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const balance = totalPay - paidAmount;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Payments
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Payroll Record
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {record.employee.name}
              </h1>
              <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                Pay period:{" "}
                {new Date(record.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <PayrollStatusBadge status={record.status} />
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Pay
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              ${totalPay.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {Number(record.hours_worked).toFixed(1)} hrs × $
              {Number(record.employee.hourly_rate).toFixed(2)}/hr
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Amount Paid
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              ${paidAmount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {record.transactions?.length || 0} transaction
              {record.transactions?.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Remaining Balance
            </p>
            <p
              className={`mt-2 text-3xl font-semibold tracking-tight ${
                balance > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              ${balance.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {balance > 0 ? "Outstanding" : "Fully paid"}
            </p>
          </div>
        </section>

        {/* Payment Transactions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Payment Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                History of all payments made for this record.
              </p>
            </div>
          </div>

          {record.transactions && record.transactions.length > 0 ? (
            <div className="mt-6 space-y-3">
              {record.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      ${Number(transaction.amount).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(transaction.paid_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {transaction.method && ` • ${transaction.method}`}
                    </p>
                    {transaction.memo && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {transaction.memo}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                    Paid
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No payments recorded yet.
              </p>
            </div>
          )}
        </div>

        {/* Record Payment Form */}
        {balance > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Record a Payment
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Record a full or partial payment for this payroll record.
            </p>
            <RecordPaymentForm recordId={record.id} maxAmount={balance} />
          </div>
        )}

        {/* Update Status */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Update Status
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manually override the payment status if needed.
          </p>
          <UpdateStatusForm recordId={record.id} currentStatus={record.status} />
        </div>

        {/* Notes */}
        {record.notes && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notes
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {record.notes}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


