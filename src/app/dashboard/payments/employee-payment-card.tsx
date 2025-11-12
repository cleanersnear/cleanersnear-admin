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
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Employee Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border-b border-slate-100 bg-slate-50 px-6 py-5 text-left transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {employee.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ${Number(employee.hourly_rate).toFixed(2)}/hr • {allRecords.length} pay cycle
              {allRecords.length !== 1 ? "s" : ""}
            </p>
          </div>
          
          {/* Summary Stats - Inline */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Outstanding
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  totalBalance > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ${totalBalance.toFixed(2)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Total Paid
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                ${totalPaid.toFixed(2)}
              </p>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
              <span
                className={`text-lg transition-transform ${
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
          <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Last Pay Cycle Total
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                ${allRecords.length > 0 ? Number(allRecords[0].total_pay).toFixed(2) : "0.00"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Total Paid
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Total Hours
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                {totalHours.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Pay Cycle Status
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {pendingCycles > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 font-medium text-amber-600 dark:text-amber-300">
                    {pendingCycles} pending
                  </span>
                )}
                {partialCycles > 0 && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-1 font-medium text-blue-600 dark:text-blue-300">
                    {partialCycles} partial
                  </span>
                )}
                {paidCycles > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600 dark:text-emerald-300">
                    {paidCycles} paid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pay Cycles Table */}
          <div className="overflow-x-auto">
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

          {/* Quick Actions Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <Link
                href={`/dashboard/employees/${employee.id}`}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                View Employee Profile →
              </Link>
              {totalBalance > 0 && (
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
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

