import Link from "next/link";
import { getAllPayrollWeeks } from "@/lib/supabase/weekly-payroll";
import { GenerateWeekButton } from "./generate-week-button";

export const dynamic = "force-dynamic";

export default async function WeeklyPayrollPage() {
  let weeks: Awaited<ReturnType<typeof getAllPayrollWeeks>> = [];
  let errorMessage: string | null = null;

  try {
    weeks = await getAllPayrollWeeks();
  } catch (error) {
    console.error("Failed to load weekly payroll:", error);
    errorMessage = "Unable to load weekly payroll data.";
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Weekly Management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Weekly Payroll
            </h1>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Manage weekly payroll cycles (Monday to Sunday). Generate new weeks and update hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/payroll"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              ← Back to Payroll
            </Link>
            <GenerateWeekButton />
          </div>
        </header>

        {/* Info Card */}
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                How Weekly Payroll Works
              </h3>
              <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                Every week runs from <strong>Monday to Sunday</strong>. First sync timesheets from Connecteam, 
                then generate weekly payroll to create records with hours from your database.
              </p>
              <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li><strong>Step 1:</strong> Go to Timesheets page and sync from Connecteam</li>
                <li><strong>Step 2:</strong> Generate weekly payroll (pulls hours from timesheets database)</li>
                <li><strong>Step 3:</strong> Review/edit hours if needed (regenerate to update from timesheets)</li>
                <li><strong>Step 4:</strong> Record payments (auto-updates status: pending → partial → paid)</li>
              </ul>
              <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> You can regenerate the same week to update hours from timesheets without losing payment data.
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!errorMessage && weeks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-6xl">📅</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No weekly payroll yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Generate your first weekly payroll to get started.
            </p>
            <GenerateWeekButton className="mt-6" />
          </div>
        )}

        {/* Weeks List */}
        {!errorMessage && weeks.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h2 className="text-lg font-semibold leading-6">
                All Payroll Weeks
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {weeks.length} week{weeks.length !== 1 ? "s" : ""} on record
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weeks.map((week) => (
                <Link
                  key={week.weekId}
                  href={`/dashboard/payroll/weekly/${week.weekStart}`}
                  className="block px-6 py-5 transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {week.weekId}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(week.weekStart).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        to{" "}
                        {new Date(week.weekEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {week.recordCount} employee{week.recordCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


