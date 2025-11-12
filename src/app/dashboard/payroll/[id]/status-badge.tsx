import { PayrollStatus } from "@/lib/supabase/types";

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const styles = {
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    partial: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


