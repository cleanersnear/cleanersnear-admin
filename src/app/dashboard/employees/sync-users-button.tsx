"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnecteamUser, getCustomFieldValue } from "@/lib/connecteam/types";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  connecteam_id: string | null;
  hourly_rate: number;
}

interface Props {
  employees: Employee[];
}

export function SyncUsersButton({ employees }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connecteamUsers, setConnecteamUsers] = useState<ConnecteamUser[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const fetchConnecteamUsers = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/connectteam/users");
      const result = await response.json();

      if (result.success) {
        setConnecteamUsers(result.data);
        
        // Auto-match by name similarity
        const autoMatches: Record<string, string> = {};
        employees.forEach((emp) => {
           const match = result.data.find((user: ConnecteamUser) => {
             const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
             return fullName.includes(emp.name.toLowerCase()) || 
                    emp.name.toLowerCase().includes(fullName);
           });
           if (match) {
             autoMatches[emp.id] = match.userId.toString();
           }
        });
        setMatches(autoMatches);
        setIsOpen(true);
      } else {
        alert(`Failed to fetch users: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveMatches = async () => {
    setIsSyncing(true);
    try {
      let updated = 0;
      
      for (const [employeeId, connecteamId] of Object.entries(matches)) {
        if (!connecteamId) continue;
        
        // Find the Connecteam user
        const connecteamUser = connecteamUsers.find(u => u.userId.toString() === connecteamId);
        if (!connecteamUser) continue;
        
        // Build update payload with all Connecteam fields
        interface EmployeeUpdateData {
          name: string;
          email: string | null;
          connecteam_id: string;
          phone_number?: string | null;
          kiosk_code?: string | null;
          is_active: boolean;
          employee_number?: string;
          job_title?: string;
          employment_start_date?: string;
        }
        
        const updateData: EmployeeUpdateData = {
          // Core Connecteam fields
          name: `${connecteamUser.firstName} ${connecteamUser.lastName}`.trim(),
          email: connecteamUser.email || null,
          connecteam_id: connecteamId,
          phone_number: connecteamUser.phoneNumber || null,
          kiosk_code: connecteamUser.kioskCode || null,
          is_active: !connecteamUser.isArchived,
        };
        
        // Extract custom fields
        if (connecteamUser.customFields) {
          const employeeId = getCustomFieldValue(connecteamUser, "Employee ID");
          const title = getCustomFieldValue(connecteamUser, "Title");
          const startDate = getCustomFieldValue(connecteamUser, "Employment Start Date");
          
          if (employeeId) updateData.employee_number = employeeId;
          if (title) updateData.job_title = title;
          if (startDate) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = startDate.split('/');
            if (day && month && year) {
              updateData.employment_start_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }
        
        const response = await fetch(`/api/employees/${employeeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          updated++;
        }
      }

      alert(`✅ Successfully synced ${updated} employee(s) with full Connecteam data!`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      alert(`Error saving: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <button
        onClick={fetchConnecteamUsers}
        disabled={isSyncing}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
      >
        {isSyncing ? (
          <>
            <span className="animate-spin">🔄</span>
            <span>Fetching...</span>
          </>
        ) : (
          
            <span>Sync from Connecteam</span>
          
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Match Employees
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Found {connecteamUsers.length} users. Match them to your employees.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                      {employee.email || "No email"}
                      {employee.connecteam_id && (
                        <span className="ml-2 text-xs text-blue-600">
                          (ID: {employee.connecteam_id})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 hidden sm:inline">→</span>
                    <select
                      value={matches[employee.id] || ""}
                      onChange={(e) =>
                        setMatches({ ...matches, [employee.id]: e.target.value })
                      }
                      className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                     <option value="">Select Connecteam user...</option>
                     {connecteamUsers.map((user) => (
                       <option key={user.userId} value={user.userId}>
                         {user.firstName} {user.lastName} (ID: {user.userId})
                       </option>
                     ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatches}
                disabled={isSyncing || Object.keys(matches).length === 0}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSyncing ? "Saving..." : `Save ${Object.keys(matches).length} Matches`}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

