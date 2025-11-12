"use client";

import { useState } from "react";
import Link from "next/link";
import { PayrollRecordWithRelations, Employee } from "@/lib/supabase/types";

interface EmployeePaymentCardProps {
  employee: Employee;
  totalOwed: number;
  totalPaid: number;
  totalBalance: number;
  totalHours: number;
  pendingCycles: number;
  partialCycles: number;
  paidCycles: number;
  allRecords: PayrollRecordWithRelations[];
}

export function EmployeePaymentCard({
  employee,
  totalPaid,
  totalBalance,
  totalHours,
  pendingCycles,
  partialCycles,
  paidCycles,
  allRecords,
}: EmployeePaymentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Employee Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 text-left transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {employee.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              ${Number(employee.hourly_rate).toFixed(2)}/hr • {allRecords.length} cycle
              {allRecords.length !== 1 ? "s" : ""}
            </p>
          </div>
          
          {/* Summary Stats - Inline */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-left sm:text-right flex-1 sm:flex-none">
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Outstanding
              </p>
              <p
                className={`mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold ${
                  totalBalance > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ${totalBalance.toFixed(2)}
              </p>
            </div>
            
            <div className="text-left sm:text-right flex-1 sm:flex-none">
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Paid
              </p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                ${totalPaid.toFixed(2)}
              </p>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0">
              <span
                className={`text-base sm:text-lg transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <>
          {/* Summary Stats Grid */}
          <div className="grid gap-3 sm:gap-4 border-b border-slate-100 p-4 sm:p-6 grid-cols-2 sm:grid-cols-4 dark:border-slate-800">
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Last Cycle
              </p>
              <p className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                ${allRecords.length > 0 ? Number(allRecords[0].total_pay).toFixed(2) : "0.00"}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Total Paid
              </p>
              <p className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Total Hours
              </p>
              <p className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {totalHours.toFixed(1)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Status
              </p>
              <div className="mt-1 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                {pendingCycles > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 sm:py-1 font-medium text-amber-600 dark:text-amber-300">
                    {pendingCycles} pending
                  </span>
                )}
                {partialCycles > 0 && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 sm:py-1 font-medium text-blue-600 dark:text-blue-300">
                    {partialCycles} partial
                  </span>
                )}
                {paidCycles > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 sm:py-1 font-medium text-emerald-600 dark:text-emerald-300">
                    {paidCycles} paid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pay Cycles Table - Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Pay Date</th>
                  <th className="px-6 py-3 text-right">Hours</th>
                  <th className="px-6 py-3 text-right">Total Pay</th>
                  <th className="px-6 py-3 text-right">Paid</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 text-right">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {allRecords.map((record) => {
                  const totalPay = Number(record.total_pay);
                  const paidAmount =
                    record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                  const balance = totalPay - paidAmount;

                  return (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-950"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">
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

          {/* Pay Cycles Cards - Mobile */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {allRecords.map((record) => {
              const totalPay = Number(record.total_pay);
              const paidAmount =
                record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
              const balance = totalPay - paidAmount;

              return (
                <div
                  key={record.id}
                  className="p-4 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {Number(record.hours_worked).toFixed(1)} hrs
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
                  <div className="grid grid-cols-3 gap-2 text-xs">
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
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        ${balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/payroll/${record.id}`}
                    className="mt-3 block text-center text-xs font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    View Details →
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <Link
                href={`/dashboard/employees/${employee.id}`}
                className="text-xs sm:text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                View Employee Profile →
              </Link>
              {totalBalance > 0 && (
                <span className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
                  Payment needed: ${totalBalance.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

