"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteEmployeeButton({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete this employee? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      router.push("/dashboard/employees");
      router.refresh();
    } catch {
      alert("Failed to delete employee. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {isDeleting ? "Deleting..." : "Delete Employee"}
    </button>
  );
}

