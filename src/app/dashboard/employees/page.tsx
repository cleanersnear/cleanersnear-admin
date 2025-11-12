import Link from "next/link";
import { listEmployees } from "@/lib/supabase/employees";
import { Employee } from "@/lib/supabase/types";
import { SyncUsersButton } from "./sync-users-button";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  let employees: Employee[] = [];
  let errorMessage: string | null = null;

  try {
    employees = await listEmployees();
  } catch (error) {
    console.error("Failed to load employees:", error);
    errorMessage = "Unable to load employees. Please check your database connection.";
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Team Directory
              </p>
              {!errorMessage && employees.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {employees.length} Active
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Employees
            </h1>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Manage your cleaning crew members and their hourly rates.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SyncUsersButton employees={employees} />
            <Link
              href="/dashboard/employees/new"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              + Add Employee
            </Link>
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

        {/* Empty State */}
        {!errorMessage && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-6xl">👥</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No employees yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Get started by adding your first team member.
            </p>
            <Link
              href="/dashboard/employees/new"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              + Add Employee
            </Link>
          </div>
        )}

        {/* Employee List */}
        {!errorMessage && employees.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Hourly Rate</th>
                    <th className="px-6 py-4">Connecteam ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-950"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.job_title ? (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {employee.job_title}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        ${Number(employee.hourly_rate).toFixed(2)}/hr
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {employee.connecteam_id || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

