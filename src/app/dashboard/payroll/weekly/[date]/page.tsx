import Link from "next/link";
import { notFound } from "next/navigation";
import { getWeekStart, getWeekEnd, getWeekId, formatDate } from "@/lib/supabase/weekly-payroll";
import { listPayrollRecords } from "@/lib/supabase/payroll";
import type { PayrollRecordWithRelations } from "@/lib/supabase/types";
import { UpdateHoursForm } from "./update-hours-form";

export const dynamic = "force-dynamic";

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const weekStartDate = new Date(date);
  
  let records: PayrollRecordWithRelations[] = [];
  let errorMessage: string | null = null;

  try {
    records = await listPayrollRecords({
      from: formatDate(weekStartDate),
      to: formatDate(weekStartDate),
    });
  } catch (error) {
    console.error("Failed to load weekly payroll:", error);
    errorMessage = "Unable to load weekly payroll data.";
  }

  if (!errorMessage && (!records || records.length === 0)) {
    notFound();
  }

  const weekStart = getWeekStart(weekStartDate);
  const weekEnd = getWeekEnd(weekStartDate);
  const weekId = getWeekId(weekStart);
  const weekEndStr = formatDate(weekEnd);

  // Calculate totals
  const totalHours = records.reduce((sum: number, r: PayrollRecordWithRelations) => sum + Number(r.hours_worked), 0);
  const totalPay = records.reduce((sum: number, r: PayrollRecordWithRelations) => sum + Number(r.total_pay), 0);
  const totalPaid = records.reduce((sum: number, r: PayrollRecordWithRelations) => {
    const paidAmount = r.transactions?.reduce((s: number, t) => s + Number(t.amount), 0) || 0;
    return sum + paidAmount;
  }, 0);
  const totalBalance = totalPay - totalPaid;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Header */}
        <header>
          <Link
            href="/dashboard/payroll/weekly"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Weekly Payroll
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {weekId}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {weekStart.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}{" "}
            -{" "}
            {weekEnd.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Pay Period: Monday to Sunday
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Hours
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {totalHours.toFixed(1)}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Pay
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              ${totalPay.toFixed(2)}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Paid
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              ${totalPaid.toFixed(2)}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Balance
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
              ${totalBalance.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Error State */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Employee Hours Table */}
        {!errorMessage && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h2 className="text-lg font-semibold leading-6">
                Employee Hours
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update hours worked for each employee this week
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3 text-right">Hourly Rate</th>
                    <th className="px-6 py-3 text-right">Hours Worked</th>
                    <th className="px-6 py-3 text-right">Total Pay</th>
                    <th className="px-6 py-3 text-right">Paid</th>
                    <th className="px-6 py-3 text-right">Balance</th>
                    <th className="px-6 py-3 text-right">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {records.map((record: PayrollRecordWithRelations) => {
                    const totalPay = Number(record.total_pay);
                    const paidAmount = record.transactions?.reduce((sum: number, t) => sum + Number(t.amount), 0) || 0;
                    const balance = totalPay - paidAmount;

                    return (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {record.employee.name}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                          ${Number(record.employee.hourly_rate).toFixed(2)}/hr
                        </td>
                        <td className="px-6 py-4 text-right">
                          <UpdateHoursForm
                            employeeId={record.employee_id}
                            weekEndDate={weekEndStr}
                            currentHours={Number(record.hours_worked)}
                          />
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
        )}
      </div>
    </main>
  );
}

