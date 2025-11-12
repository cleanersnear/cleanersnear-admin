"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getMonday(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  
  const year = d.getFullYear();
  const month = d.getMonth();
  const dateNum = d.getDate();
  
  const localDate = new Date(year, month, dateNum);
  const day = localDate.getDay();
  
  const offset = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(year, month, dateNum + offset);
  return monday;
}

function getSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Props {
  className?: string;
}

export function GenerateWeekButton({ className = "" }: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const today = new Date();
  const currentMonday = getMonday(today);
  const currentMondayStr = formatDateForInput(currentMonday);
  
  const [selectedWeek, setSelectedWeek] = useState(currentMondayStr);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/payroll/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStartDate: selectedWeek,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        router.refresh();
        const { data } = result;
        const weekStart = new Date(selectedWeek);
        const weekEnd = getSunday(weekStart);
        
        let message = `✅ Weekly payroll ${data.recordsUpdated > 0 ? 'updated' : 'generated'} successfully!\n\n`;
        message += `📅 Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}\n`;
        
        if (data.recordsCreated > 0) {
          message += `➕ New records: ${data.recordsCreated}\n`;
        }
        if (data.recordsUpdated > 0) {
          message += `🔄 Updated records: ${data.recordsUpdated}\n`;
        }
        message += `📊 Total records: ${data.totalRecords}\n`;
        
        if (data.hoursFromTimesheets > 0) {
          message += `⏱️ Hours loaded from timesheets: ${data.hoursFromTimesheets} employees\n`;
        } else {
          message += `\n⚠️ No timesheet data found - all records set to 0 hours\n`;
          message += `💡 Sync timesheets from Connecteam first for accurate hours\n`;
        }
        
        alert(message);
        setShowCalendar(false);
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error) {
      alert(
        `❌ Failed to generate weekly payroll.\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedWeekDate = getMonday(selectedWeek);
  
  return (
    <>
      <button
        onClick={() => setShowCalendar(true)}
        disabled={isGenerating}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 ${className}`}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">🔄</span>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span>📅</span>
            <span>Generate Week</span>
          </>
        )}
      </button>

      {/* Calendar Modal */}
      {showCalendar && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowCalendar(false)}
          />
          
          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Generate Weekly Payroll
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Select a week to create payroll records for all employees
                </p>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Week Selector */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Week (Monday - Sunday)
                </label>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const current = getMonday(selectedWeek);
                      current.setDate(current.getDate() - 7);
                      setSelectedWeek(formatDateForInput(current));
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    ‹
                  </button>
                  
                  <input
                    type="date"
                    value={selectedWeek}
                    onChange={(e) => {
                      if (e.target.value) {
                        const monday = getMonday(e.target.value);
                        setSelectedWeek(formatDateForInput(monday));
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  
                  <button
                    onClick={() => {
                      const current = getMonday(selectedWeek);
                      current.setDate(current.getDate() + 7);
                      setSelectedWeek(formatDateForInput(current));
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    ›
                  </button>
                  
                  <button
                    onClick={() => setSelectedWeek(formatDateForInput(currentMonday))}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    This Week
                  </button>
                </div>
                
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selected Range
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedWeekDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {getSunday(selectedWeekDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Info Note */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Hours from Timesheets Database
                    </p>
                    <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                      Payroll records will use hours from your timesheets database. 
                      If records already exist for this week, they will be <strong>updated</strong> with new hours while preserving payment data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCalendar(false)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Payroll"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
