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
    <main className="min-h-screen px-3 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Team Directory
              </p>
              {!errorMessage && employees.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {employees.length} Active
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
              Employees
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Manage your cleaning crew members and their hourly rates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
          <>
            {/* Mobile Card View */}
            <div className="flex flex-col gap-3 sm:hidden">
              {employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`/dashboard/employees/${employee.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {employee.name}
                      </h3>
                      {employee.job_title && (
                        <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {employee.job_title}
                        </span>
                      )}
                      {employee.email && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 truncate">
                          {employee.email}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          ${Number(employee.hourly_rate).toFixed(2)}/hr
                        </span>
                        {employee.connecteam_id && (
                          <span>ID: {employee.connecteam_id}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 text-lg">→</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
          </>
        )}
      </div>
    </main>
  );
}

