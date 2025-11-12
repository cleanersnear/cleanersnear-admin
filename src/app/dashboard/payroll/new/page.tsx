import Link from "next/link";
import { listEmployees } from "@/lib/supabase/employees";
import type { Employee } from "@/lib/supabase/types";
import { NewPayrollForm } from "./new-payroll-form";

export const dynamic = "force-dynamic";

export default async function NewPayrollPage() {
  let employees: Employee[] = [];
  let errorMessage: string | null = null;

  try {
    employees = await listEmployees();
  } catch (error) {
    console.error("Failed to load employees:", error);
    errorMessage = "Unable to load employees.";
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <Link
            href="/dashboard/payroll"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Payroll
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Create Payroll Record
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              New Payroll Record
            </h1>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Record hours worked and calculate payment for an employee.
            </p>
          </div>
        </header>

        {/* Error State */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* No Employees State */}
        {!errorMessage && employees.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No employees found
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              You need to add employees before creating payroll records.
            </p>
            <Link
              href="/dashboard/employees/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              + Add Employee
            </Link>
          </div>
        )}

        {/* Form Card */}
        {!errorMessage && employees.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <NewPayrollForm employees={employees} />
          </div>
        )}
      </div>
    </main>
  );
}


