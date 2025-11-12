import Link from "next/link";
import { listPayrollRecords } from "@/lib/supabase/payroll";
import { PayrollRecordWithRelations } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  let records: PayrollRecordWithRelations[] = [];
  let errorMessage: string | null = null;

  try {
    records = await listPayrollRecords();
  } catch (error) {
    console.error("Failed to load payroll records:", error);
    errorMessage = "Unable to load payroll records. Please check your database connection.";
  }

  // Calculate summary stats
  const totalPaid = records
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + Number(r.total_pay), 0);
  
  const totalPending = records
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.total_pay), 0);
  
  const totalPartial = records
    .filter((r) => r.status === "partial")
    .reduce((sum, r) => {
      const totalPay = Number(r.total_pay);
      const paidAmount = r.transactions?.reduce((s, t) => s + Number(t.amount), 0) || 0;
      return sum + (totalPay - paidAmount);
    }, 0);

  const pendingCount = records.filter((r) => r.status === "pending" || r.status === "partial").length;

  return (
    <main className="min-h-screen px-3 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Payment Management
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
              Payroll Records
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Track hours worked, payments made, and outstanding balances.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              href="/dashboard/payroll/weekly"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
            >
              📅 Weekly Payroll
            </Link>
            <Link
              href="/dashboard/payroll/timesheets"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              📋 Timesheets
            </Link>
            <Link
              href="/dashboard/payroll/new"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              + New Payroll Record
            </Link>
          </div>
        </header>

        {/* Error State */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        {!errorMessage && (
          <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                Paid
              </span>
              <p className="mt-3 sm:mt-4 text-xl sm:text-3xl font-semibold tracking-tight">
                ${totalPaid.toFixed(2)}
              </p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Completed
              </p>
            </div>

            <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-300">
                Pending
              </span>
              <p className="mt-3 sm:mt-4 text-xl sm:text-3xl font-semibold tracking-tight">
                ${totalPending.toFixed(2)}
              </p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Awaiting
              </p>
            </div>

            <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300">
                Partial
              </span>
              <p className="mt-3 sm:mt-4 text-xl sm:text-3xl font-semibold tracking-tight">
                ${totalPartial.toFixed(2)}
              </p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Remaining
              </p>
            </div>

            <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
                Action
              </span>
              <p className="mt-3 sm:mt-4 text-xl sm:text-3xl font-semibold tracking-tight">
                {pendingCount}
              </p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Records
              </p>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!errorMessage && records.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-6xl">💵</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No payroll records yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create your first payroll record to start tracking payments.
            </p>
            <Link
              href="/dashboard/payroll/new"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              + New Payroll Record
            </Link>
          </div>
        )}

        {/* Payroll Records Table */}
        {!errorMessage && records.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="flex flex-col gap-3 sm:hidden">
              <div className="px-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  All Payroll Records
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {records.length} total record{records.length !== 1 ? "s" : ""}
                </p>
              </div>
              {records.map((record) => {
                const totalPay = Number(record.total_pay);
                const paidAmount = record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                const balance = totalPay - paidAmount;

                return (
                  <Link
                    key={record.id}
                    href={`/dashboard/payroll/${record.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {record.employee.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          record.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : record.status === "partial"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Hours</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                          {Number(record.hours_worked).toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Total</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          ${totalPay.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Paid</p>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ${paidAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Balance</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                          ${balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold leading-6">
                    All Payroll Records
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {records.length} total record{records.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Hours</th>
                    <th className="px-6 py-3 text-right">Total Pay</th>
                    <th className="px-6 py-3 text-right">Paid</th>
                    <th className="px-6 py-3 text-right">Balance</th>
                    <th className="px-6 py-3 text-right">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {records.map((record) => {
                    const totalPay = Number(record.total_pay);
                    const paidAmount = record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                    const balance = totalPay - paidAmount;

                    return (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {record.employee.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700 dark:text-slate-200">
                          {Number(record.hours_worked).toFixed(1)} hrs
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ${totalPay.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">
                          ${paidAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${
                              record.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : record.status === "partial"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/payroll/${record.id}`}
                            className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>
    </main>
  );
}

