"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TimesheetWeekSummary } from "@/lib/supabase/types";

interface WeekSelectorProps {
  availableWeeks: TimesheetWeekSummary[];
  selectedWeek: string | null;
}

function formatDateRange(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  // If same month, show: Nov 3 - 9
  if (start.getMonth() === end.getMonth()) {
    const month = formatShort(start).split(" ")[0];
    return `${month} ${start.getDate()} - ${end.getDate()}`;
  }
  // Different months: Oct 28 - Nov 3
  return `${formatShort(start)} - ${formatShort(end)}`;
}

export function WeekSelector({ availableWeeks, selectedWeek }: WeekSelectorProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleWeekChange = (week: string) => {
    router.push(`/dashboard/payroll/timesheets?week=${week}`);
    setShowDropdown(false);
  };

  const currentWeekRange = selectedWeek ? formatDateRange(selectedWeek) : "Select a week";

  return (
    <div className="relative flex items-center gap-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        View Week:
      </label>
      
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
      >
        <span>📅</span>
        <span>{currentWeekRange}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Select Week
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {availableWeeks.length} week{availableWeeks.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {availableWeeks.map((week) => {
                const isSelected = week.week_start_date === selectedWeek;
                const weekRange = formatDateRange(week.week_start_date);
                const startDate = new Date(week.week_start_date + 'T00:00:00');
                
                return (
                  <button
                    key={week.week_start_date}
                    onClick={() => handleWeekChange(week.week_start_date)}
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950 ${
                      isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${
                          isSelected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-900 dark:text-slate-100"
                        }`}>
                          {weekRange}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {startDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {week.total_hours.toFixed(1)}h
                        </span>
                        {isSelected && (
                          <span className="text-blue-600 dark:text-blue-400">✓</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

