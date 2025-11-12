import Link from "next/link";
import { listEmployees } from "@/lib/supabase/employees";
import { getTimesheetsForWeek, getAvailableTimesheetWeeks } from "@/lib/supabase/timesheets";
import { SyncConnecteamButton } from "./sync-button";
import { TimesheetRow } from "./timesheet-row";
import { WeekSelector } from "./week-selector";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    week?: string;
  }>;
}

export default async function TimesheetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  let employees: Awaited<ReturnType<typeof listEmployees>> = [];
  let timesheets: Awaited<ReturnType<typeof getTimesheetsForWeek>> = [];
  let errorMessage: string | null = null;
  let availableWeeks: Awaited<ReturnType<typeof getAvailableTimesheetWeeks>> = [];
  let selectedWeek: string | null = null;

  try {
    employees = await listEmployees();
    
    // Get available weeks from database
    try {
      availableWeeks = await getAvailableTimesheetWeeks();
      
      if (availableWeeks.length > 0) {
        // Use the week from URL params, or default to most recent
        selectedWeek = params.week || availableWeeks[0].week_start_date;
        timesheets = await getTimesheetsForWeek(selectedWeek);
      }
    } catch {
      // No timesheets available yet
    }
  } catch {
    errorMessage = "Unable to load employees.";
  }

  // Create a map of employee_id -> timesheet data
  const timesheetMap = new Map(
    timesheets.map((ts) => [ts.employee_id, ts])
  );
  
  // Get the week start date from the first timesheet (if available)
  const weekStartDate = timesheets.length > 0 ? timesheets[0].week_start_date : null;

  return (
    <main className="min-h-screen px-3 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Time Tracking
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
              Timesheets
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Sync employee hours from Connecteam for accurate payroll tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/dashboard/payroll"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              ← Back to Payroll
            </Link>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            {/* Week Filter */}
            {availableWeeks.length > 0 && (
              <WeekSelector 
                availableWeeks={availableWeeks}
                selectedWeek={selectedWeek}
              />
            )}
          </div>
          
          {/* Sync Button */}
          <SyncConnecteamButton />
        </div>

        {/* Sync Statistics */}
        {timesheets.length > 0 && (() => {
          const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.total_hours || 0), 0);
          const totalPay = timesheets.reduce((sum, ts) => {
            const employee = employees.find(e => e.id === ts.employee_id);
            const hours = Number(ts.total_hours || 0);
            const rate = employee ? Number(employee.hourly_rate) : 0;
            return sum + (hours * rate);
          }, 0);

          return (
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Employees
                </p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {timesheets.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Hours
                </p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {totalHours.toFixed(1)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] sm:text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Pay
                </p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  ${totalPay.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Employee List with Live Timesheet Data */}
        {!errorMessage && employees.length > 0 && (
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-semibold leading-6">
                {selectedWeek ? `Week of ${new Date(selectedWeek).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Current Week Hours"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {timesheets.length > 0 ? `Showing stored timesheet data (${timesheets.length} records)` : "No timesheets found for selected week"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Connecteam ID</th>
                    <th className="px-6 py-3 text-right">Weekly Hours</th>
                    <th className="px-6 py-3 text-right">Hourly Rate</th>
                    <th className="px-6 py-3 text-right">Total Pay</th>
                    <th className="px-6 py-3 text-right">Last Sync</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {employees.map((employee) => {
                    const timesheet = timesheetMap.get(employee.id);
                    const hours = employee.current_week_hours ? Number(employee.current_week_hours) : 0;
                    const hourlyRate = Number(employee.hourly_rate);
                    const totalPay = hours * hourlyRate;
                    
                    const lastSync = employee.last_sync_at
                      ? new Date(employee.last_sync_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })
                      : "Never";

                    // Get daily hours from timesheet or default to 0
                    const dailyHours = {
                      monday: timesheet ? Number(timesheet.monday_hours) : 0,
                      tuesday: timesheet ? Number(timesheet.tuesday_hours) : 0,
                      wednesday: timesheet ? Number(timesheet.wednesday_hours) : 0,
                      thursday: timesheet ? Number(timesheet.thursday_hours) : 0,
                      friday: timesheet ? Number(timesheet.friday_hours) : 0,
                      saturday: timesheet ? Number(timesheet.saturday_hours) : 0,
                      sunday: timesheet ? Number(timesheet.sunday_hours) : 0,
                    };

                    return (
                      <TimesheetRow
                        key={employee.id}
                        employee={employee}
                        dailyHours={dailyHours}
                        totalHours={hours}
                        hourlyRate={hourlyRate}
                        totalPay={totalPay}
                        lastSync={lastSync}
                        weekStartDate={weekStartDate}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!errorMessage && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-6xl">📋</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No employees found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add employees first to view their timesheets.
            </p>
            <Link
              href="/dashboard/employees/new"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              + Add Employee
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

