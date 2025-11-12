import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/supabase/employees";
import { listPayrollRecords } from "@/lib/supabase/payroll";
import { EmployeeEditForm } from "./employee-edit-form";
import { DeleteEmployeeButton } from "./delete-employee-button";
import { PayrollHistory } from "./payroll-history";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeById(id as `${string}-${string}-${string}-${string}-${string}`);
  
  // Fetch employee's payroll records
  let payrollRecords: Awaited<ReturnType<typeof listPayrollRecords>> = [];
  try {
    payrollRecords = await listPayrollRecords({ 
      employeeId: id as `${string}-${string}-${string}-${string}-${string}` 
    });
  } catch (error) {
    console.error("Failed to load payroll records:", error);
  }

  if (!employee) {
    notFound();
  }

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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Employee Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {employee.name}
              </h1>
              <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                {employee.email || "No email on file"}
              </p>
            </div>
            <DeleteEmployeeButton employeeId={employee.id} />
          </div>
        </header>

        {/* Employee Details Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Basic Information
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Hourly Rate
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                ${Number(employee.hourly_rate).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Connecteam ID
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {employee.connecteam_id || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Added On
              </p>
              <p className="mt-1 text-base text-slate-700 dark:text-slate-200">
                {new Date(employee.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Last Updated
              </p>
              <p className="mt-1 text-base text-slate-700 dark:text-slate-200">
                {new Date(employee.updated_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Payroll History */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payroll History
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            All payroll records for {employee.name}. View, filter, and record payments.
          </p>
          <div className="mt-6">
            <PayrollHistory
              employeeId={employee.id}
              employeeName={employee.name}
              records={payrollRecords}
            />
          </div>
        </div>

        {/* Edit Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Edit Employee
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update employee details and save changes.
          </p>
          <EmployeeEditForm employee={employee} />
        </div>
      </div>
    </main>
  );
}

