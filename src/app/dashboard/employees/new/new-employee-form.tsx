"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  name: string;
  email: string;
  phone_number: string;
  connecteam_id: string;
  kiosk_code: string;
  employee_number: string;
  job_title: string;
  employment_start_date: string;
  hourly_rate: string;
  current_week_hours: string;
  is_active: boolean;
}

export function NewEmployeeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone_number: "",
    connecteam_id: "",
    kiosk_code: "",
    employee_number: "",
    job_title: "",
    employment_start_date: "",
    hourly_rate: "30",
    current_week_hours: "",
    is_active: true,
  });

  const handleChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        connecteam_id: formData.connecteam_id.trim() || null,
        kiosk_code: formData.kiosk_code.trim() || null,
        employee_number: formData.employee_number.trim() || null,
        job_title: formData.job_title.trim() || null,
        employment_start_date: formData.employment_start_date || null,
        hourly_rate: Number(formData.hourly_rate || 0),
        current_week_hours: formData.current_week_hours
          ? Number(formData.current_week_hours)
          : 0,
        is_active: formData.is_active,
      };

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || "Failed to create employee");
      }

      const newEmployee = await response.json();
      router.push(`/dashboard/employees/${newEmployee.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="e.g. Maria Lopez"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => handleChange("phone_number", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="hourly_rate"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Hourly Rate ($) *
          </label>
          <input
            type="number"
            id="hourly_rate"
            required
            step="0.01"
            min="0"
            value={formData.hourly_rate}
            onChange={(e) => handleChange("hourly_rate", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="connecteam_id"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Connecteam ID
          </label>
          <input
            type="text"
            id="connecteam_id"
            value={formData.connecteam_id}
            onChange={(e) => handleChange("connecteam_id", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="employee_number"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Employee Number
          </label>
          <input
            type="text"
            id="employee_number"
            value={formData.employee_number}
            onChange={(e) => handleChange("employee_number", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="job_title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Job Title
          </label>
          <input
            type="text"
            id="job_title"
            value={formData.job_title}
            onChange={(e) => handleChange("job_title", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="employment_start_date"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Employment Start Date
          </label>
          <input
            type="date"
            id="employment_start_date"
            value={formData.employment_start_date}
            onChange={(e) =>
              handleChange("employment_start_date", e.target.value)
            }
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="kiosk_code"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Kiosk Code
          </label>
          <input
            type="text"
            id="kiosk_code"
            value={formData.kiosk_code}
            onChange={(e) => handleChange("kiosk_code", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="optional"
          />
        </div>

        <div>
          <label
            htmlFor="current_week_hours"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Current Week Hours
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            id="current_week_hours"
            value={formData.current_week_hours}
            onChange={(e) => handleChange("current_week_hours", e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="defaults to 0"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
            Mark as active
          </label>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Active employees appear in payroll, timesheets, and sync actions.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {isSubmitting ? "Creating..." : "Create Employee"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/employees")}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

