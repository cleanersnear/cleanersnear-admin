"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getMonday(date: Date | string): Date {
  // Parse the date string or use the date object
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  
  // Work with date parts to avoid timezone issues
  const year = d.getFullYear();
  const month = d.getMonth();
  const dateNum = d.getDate();
  
  const localDate = new Date(year, month, dateNum);
  const day = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate offset to get to Monday
  // Sunday (0) -> -6 days, Monday (1) -> 0 days, Tuesday (2) -> -1 day, etc.
  const offset = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(year, month, dateNum + offset);
  return monday;
}

function getSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

function formatDateRange(startDate: Date): string {
  const endDate = getSunday(startDate);
  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  // If same month, show: Nov 3 - 9
  if (startDate.getMonth() === endDate.getMonth()) {
    const month = formatShort(startDate).split(" ")[0];
    return `${month} ${startDate.getDate()} - ${endDate.getDate()}`;
  }
  // Different months: Oct 28 - Nov 3
  return `${formatShort(startDate)} - ${formatShort(endDate)}`;
}

export function SyncConnecteamButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Format as YYYY-MM-DD for input value
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Default to current week's Monday - use ISO date string format
  const today = new Date();
  const currentMonday = getMonday(today);
  const currentMondayStr = formatDateForInput(currentMonday);
  
  const [selectedWeek, setSelectedWeek] = useState(currentMondayStr);

  const handleSync = async (clearFirst: boolean = true) => {
    setIsSyncing(true);
    setShowDialog(false);
    try {
      const response = await fetch("/api/connectteam/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStartDate: selectedWeek,
          clearFirst,
        }),
      });

      const result = await response.json();

      if (response.ok || response.status === 207) {
        router.refresh();
        const { data } = result;
        const weekStart = new Date(selectedWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        let message = `✅ Sync completed successfully!\n\n`;
        message += `📅 Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}\n`;
        message += `👥 Employees synced: ${data.employeesSynced}\n`;
        message += `🕐 Time: ${new Date(data.syncedAt).toLocaleString()}\n`;
        
        if (data.errors && data.errors.length > 0) {
          message += `\n⚠️ Warnings:\n${data.errors.join("\n")}`;
        }
        
        alert(message);
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      alert(
        `❌ Failed to sync with Connecteam.\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }\n\nPlease check:\n- CONNECTEAM_API_KEY is set in .env.local\n- Employees have Connecteam IDs\n- Connecteam API is accessible`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedWeekDate = new Date(selectedWeek);
  const weekRange = formatDateRange(selectedWeekDate);

  return (
    <>
      {/* Sync Button */}
      <button
        onClick={() => setShowDialog(true)}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isSyncing ? (
          <>
            <span className="animate-spin">🔄</span>
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <span>Sync from Connecteam</span>
          </>
        )}
      </button>

      {/* Dialog Modal */}
      {showDialog && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDialog(false)}
          />
          
          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Sync Timesheet Data
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Select the week you want to sync from Connecteam
              </p>
            </div>

            {/* Week Selector */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Week
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
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                </div>
                
                <button
                  onClick={() => {
                    setSelectedWeek(formatDateForInput(currentMonday));
                  }}
                  className="mt-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                >
                  Jump to This Week
                </button>
              </div>

              {/* Selected Week Display */}
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Week Range
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {weekRange}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {selectedWeekDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                  {" - "}
                  {getSunday(selectedWeekDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSync(true)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sync Now
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

