"use client";

import { useState } from "react";
import Link from "next/link";
import { Employee } from "@/lib/supabase/types";

interface Props {
  employee: Employee;
  dailyHours: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
  lastSync: string;
  weekStartDate: string | null;
}

export function TimesheetRow({ employee, dailyHours, totalHours, hourlyRate, totalPay, lastSync, weekStartDate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDailyData = Object.values(dailyHours).some((h) => h > 0);
  
  // Calculate actual dates for each day of the week
  const getDayDate = (dayOffset: number) => {
    if (!weekStartDate) return "";
    const date = new Date(weekStartDate + 'T00:00:00');
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      {/* Main Row */}
      <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-950">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Show arrow for all employees with total hours > 0 */}
            {totalHours > 0 ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex h-5 w-5 items-center justify-center text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                title={hasDailyData ? "Show daily breakdown" : "No daily data"}
              >
                <svg
                  className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-5" />
            )}
            <div
              className={`h-2 w-2 rounded-full ${
                totalHours > 0
                  ? "bg-green-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
              title={totalHours > 0 ? "Has hours" : "No hours"}
            />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {employee.name}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
          {employee.connecteam_id ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <span>🔗</span>
              {employee.connecteam_id}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="px-6 py-4 text-right">
          <span
            className={`text-sm font-bold ${
              totalHours > 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-600"
            }`}
          >
            {totalHours.toFixed(1)}h
          </span>
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
          ${hourlyRate.toFixed(2)}/hr
        </td>
        <td className="px-6 py-4 text-right">
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            ${totalPay.toFixed(2)}
          </span>
        </td>
        <td className="px-6 py-4 text-right text-sm text-slate-500 dark:text-slate-400">
          {lastSync}
        </td>
        <td className="px-6 py-4 text-right">
          <Link
            href={`/dashboard/payroll/new?employee=${employee.id}&hours=${totalHours}`}
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
          >
            Create Record →
          </Link>
        </td>
      </tr>

      {/* Expanded Daily Breakdown Row */}
      {isExpanded && hasDailyData && (
        <tr className="bg-slate-50 dark:bg-slate-950">
          <td colSpan={7} className="px-6 py-4">
            <div className="ml-8 grid grid-cols-7 gap-3">
              {[
                { day: 'Monday', hours: dailyHours.monday, offset: 0 },
                { day: 'Tuesday', hours: dailyHours.tuesday, offset: 1 },
                { day: 'Wednesday', hours: dailyHours.wednesday, offset: 2 },
                { day: 'Thursday', hours: dailyHours.thursday, offset: 3 },
                { day: 'Friday', hours: dailyHours.friday, offset: 4 },
                { day: 'Saturday', hours: dailyHours.saturday, offset: 5 },
                { day: 'Sunday', hours: dailyHours.sunday, offset: 6 },
              ].map(({ day, hours, offset }) => (
                <div
                  key={day}
                  className={`rounded-lg border p-3 text-center transition ${
                    hours > 0
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    {day.slice(0, 3)}
                  </div>
                  {weekStartDate && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {getDayDate(offset)}
                    </div>
                  )}
                  <div
                    className={`mt-1 text-lg font-bold ${
                      hours > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {hours.toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

