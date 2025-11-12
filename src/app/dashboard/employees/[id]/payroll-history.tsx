"use client";

import Link from "next/link";
import { useState } from "react";

interface PayrollRecord {
  id: string;
  date: string;
  hours_worked: number;
  total_pay: number;
  status: "pending" | "partial" | "paid";
  transactions?: Array<{
    id: string;
    amount: number;
  }>;
}

interface Props {
  employeeId: string;
  employeeName: string;
  records: PayrollRecord[];
}

export function PayrollHistory({ records }: Props) {
  const [filter, setFilter] = useState<"all" | "unpaid" | "partial">("all");

  // Calculate totals
  const totalOwed = records.reduce((sum, r) => sum + Number(r.total_pay), 0);
  const totalPaid = records.reduce((sum, r) => {
    const paid = r.transactions?.reduce((s, t) => s + Number(t.amount), 0) || 0;
    return sum + paid;
  }, 0);
  const balance = totalOwed - totalPaid;

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (filter === "unpaid") return r.status === "pending";
    if (filter === "partial") return r.status === "partial";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Total Owed
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
            ${totalOwed.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Total Paid
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            ${totalPaid.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Outstanding Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition ${
            filter === "all"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          All ({records.length})
        </button>
        <button
          onClick={() => setFilter("unpaid")}
          className={`px-4 py-2 text-sm font-medium transition ${
            filter === "unpaid"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Unpaid ({records.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("partial")}
          className={`px-4 py-2 text-sm font-medium transition ${
            filter === "partial"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Partial ({records.filter((r) => r.status === "partial").length})
        </button>
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Week</th>
                <th className="px-6 py-3 text-right">Hours</th>
                <th className="px-6 py-3 text-right">Total Pay</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3 text-right">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No payroll records found for this filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const totalPay = Number(record.total_pay);
                  const paidAmount =
                    record.transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                  const recordBalance = totalPay - paidAmount;

                  return (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-950"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                        {Number(record.hours_worked).toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                        ${totalPay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">
                        ${paidAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <span
                          className={
                            recordBalance > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-600 dark:text-slate-400"
                          }
                        >
                          ${recordBalance.toFixed(2)}
                        </span>
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
                          href={`/payroll/${record.id}`}
                          className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                        >
                          {recordBalance > 0 ? "Pay →" : "View →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

