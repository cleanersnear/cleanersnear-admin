import Link from "next/link";
import { listEmployees } from "@/lib/supabase/employees";
import { listPayrollRecords } from "@/lib/supabase/payroll";
import { Employee, PayrollRecordWithRelations } from "@/lib/supabase/types";
import { EmployeePaymentCard } from "./employee-payment-card";

export const dynamic = "force-dynamic";

interface EmployeePaymentSummary {
  employee: Employee;
  totalOwed: number;
  totalPaid: number;
  totalBalance: number;
  totalHours: number;
  pendingCycles: number;
  partialCycles: number;
  paidCycles: number;
  allRecords: PayrollRecordWithRelations[];
}

export default async function PaymentsPage() {
  let employees: Awaited<ReturnType<typeof listEmployees>> = [];
  let records: PayrollRecordWithRelations[] = [];
  let errorMessage: string | null = null;

  try {
    [employees, records] = await Promise.all([
      listEmployees(),
      listPayrollRecords(),
    ]);
  } catch (error) {
    console.error("Failed to load data:", error);
    errorMessage = "Unable to load payment data. Please check your database connection.";
  }

  // Group records by employee and calculate summaries
  const employeeSummaries: EmployeePaymentSummary[] = employees.map((employee) => {
    const employeeRecords = records.filter((r) => r.employee_id === employee.id);
    
    const totalOwed = employeeRecords.reduce((sum, r) => sum + Number(r.total_pay), 0);
    const totalPaid = employeeRecords.reduce((sum, r) => {
      const paidAmount = r.transactions?.reduce((s, t) => s + Number(t.amount), 0) || 0;
      return sum + paidAmount;
    }, 0);
    const totalBalance = totalOwed - totalPaid;
    const totalHours = employeeRecords.reduce((sum, r) => sum + Number(r.hours_worked), 0);
    
    const pendingCycles = employeeRecords.filter((r) => r.status === "pending").length;
    const partialCycles = employeeRecords.filter((r) => r.status === "partial").length;
    const paidCycles = employeeRecords.filter((r) => r.status === "paid").length;

    return {
      employee,
      totalOwed,
      totalPaid,
      totalBalance,
      totalHours,
      pendingCycles,
      partialCycles,
      paidCycles,
      allRecords: employeeRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  });

  // Show everyone in summary but still highlight employees with actual balances below
  const allEmployees = employeeSummaries;
  const employeesWithActivity = employeeSummaries.filter(
    (s) => s.totalBalance > 0 || s.allRecords.length > 0
  );

  const grandTotalOwed = allEmployees.reduce((sum, s) => sum + s.totalOwed, 0);
  const grandTotalPaid = allEmployees.reduce((sum, s) => sum + s.totalPaid, 0);
  const grandTotalBalance = allEmployees.reduce((sum, s) => sum + s.totalBalance, 0);
  const employeesWithBalance = allEmployees.filter((s) => s.totalBalance > 0).length;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Header */}
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Payment Tracking
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Payments & Balances
          </h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Track outstanding payments, completed pay cycles, and payment history per employee.
          </p>
        </header>

        {/* Error State */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Overall Summary Cards */}
        {!errorMessage && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                Total Outstanding
              </span>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                ${grandTotalBalance.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Across {employeesWithBalance} employee{employeesWithBalance !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                Total Paid
              </span>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                ${grandTotalPaid.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                All-time payments
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Total Owed
              </span>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                ${grandTotalOwed.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Cumulative payroll
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                Active Employees
              </span>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {allEmployees.length}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                With payroll records
              </p>
            </div>
          </section>
        )}

        {/* Employee Payment Summaries */}
        {!errorMessage && employeesWithActivity.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-6xl">💰</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No payment records yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create payroll records to start tracking payments.
            </p>
            <Link
              href="/dashboard/payroll/new"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              + New Payroll Record
            </Link>
          </div>
        )}

        {!errorMessage && employeesWithActivity.length > 0 && (
          <div className="space-y-4">
            {employeesWithActivity.map((summary) => (
              <EmployeePaymentCard
                key={summary.employee.id}
                employee={summary.employee}
                totalOwed={summary.totalOwed}
                totalPaid={summary.totalPaid}
                totalBalance={summary.totalBalance}
                totalHours={summary.totalHours}
                pendingCycles={summary.pendingCycles}
                partialCycles={summary.partialCycles}
                paidCycles={summary.paidCycles}
                allRecords={summary.allRecords}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

