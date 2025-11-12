"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UpdateHoursForm({
  employeeId,
  weekEndDate,
  currentHours,
}: {
  employeeId: string;
  weekEndDate: string;
  currentHours: number;
}) {
  const router = useRouter();
  const [hours, setHours] = useState(currentHours.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const hasChanged = Number(hours) !== currentHours;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/payroll/weekly/${weekEndDate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          hours: Number(hours),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hours");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to update hours. Please try again.");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        step="0.25"
        min="0"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {hasChanged && (
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isUpdating ? "..." : "Save"}
        </button>
      )}
    </div>
  );
}


