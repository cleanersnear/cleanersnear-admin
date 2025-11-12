import Link from "next/link";
import { NewEmployeeForm } from "./new-employee-form";

export default function NewEmployeePage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Employees
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Add New Team Member
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              New Employee
            </h1>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Fill in the details below to add a new employee to your team.
            </p>
          </div>
        </header>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <NewEmployeeForm />
        </div>
      </div>
    </main>
  );
}


