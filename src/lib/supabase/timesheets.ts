import "server-only";

import { createSupabaseServerClient } from "./server";
import {
  Timesheet,
  TimesheetWithEmployee,
  TimesheetWeekSummary,
  UUID,
} from "./types";

/**
 * Get all available weeks with timesheet data
 */
export async function getAvailableTimesheetWeeks(): Promise<
  TimesheetWeekSummary[]
> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_available_timesheet_weeks");

  if (error) {
    console.warn(
      "[timesheets] RPC get_available_timesheet_weeks failed, falling back to direct query.",
      error,
    );

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("timesheets")
      .select(
        "week_start_date, week_end_date, total_hours, synced_at",
      )
      .order("week_start_date", { ascending: false });

    if (fallbackError) {
      console.error("Error fetching timesheet weeks:", fallbackError);
      throw fallbackError;
    }

    const grouped = new Map<string, TimesheetWeekSummary>();
    for (const row of fallbackData ?? []) {
      const key = row.week_start_date;
      const summary = grouped.get(key) ?? {
        week_start_date: row.week_start_date,
        week_end_date: row.week_end_date,
        employee_count: 0,
        total_hours: 0,
        last_synced_at: row.synced_at,
      };

      summary.employee_count += 1;
      summary.total_hours += Number(row.total_hours) || 0;
      summary.last_synced_at = summary.last_synced_at ?? row.synced_at;
      grouped.set(key, summary);
    }

    return Array.from(grouped.values());
  }

  interface RPCWeekSummary {
    week_start_date: string;
    week_end_date: string;
    employee_count: number;
    total_hours: number;
    last_synced_at: string;
  }

  return (data || []).map((row: RPCWeekSummary) => ({
    week_start_date: row.week_start_date,
    week_end_date: row.week_end_date,
    employee_count: Number(row.employee_count),
    total_hours: Number(row.total_hours),
    last_synced_at: row.last_synced_at,
  }));
}

/**
 * Get timesheets for a specific week
 */
export async function getTimesheetsForWeek(
  weekStartDate: string
): Promise<TimesheetWithEmployee[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_timesheets_for_week", {
    p_week_start_date: weekStartDate,
  });

  if (error) {
    console.warn(
      "[timesheets] RPC get_timesheets_for_week failed, falling back to direct query.",
      error,
    );

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("timesheets")
      .select(
        `
          id,
          employee_id,
          week_start_date,
          week_end_date,
          total_hours,
          monday_hours,
          tuesday_hours,
          wednesday_hours,
          thursday_hours,
          friday_hours,
          saturday_hours,
          sunday_hours,
          synced_from_connecteam,
          synced_at,
          created_at,
          updated_at,
          employees!inner(id, name, email, hourly_rate, job_title)
        `,
      )
      .eq("week_start_date", weekStartDate)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      console.error("Error fetching timesheets for week:", fallbackError);
      throw fallbackError;
    }

    interface FallbackTimesheetRow {
      id: UUID;
      employee_id: UUID;
      week_start_date: string;
      week_end_date: string;
      total_hours: number;
      monday_hours: number;
      tuesday_hours: number;
      wednesday_hours: number;
      thursday_hours: number;
      friday_hours: number;
      saturday_hours: number;
      sunday_hours: number;
      synced_from_connecteam: boolean;
      synced_at: string;
      created_at: string;
      updated_at: string;
      employees: Array<{
        id: UUID;
        name: string;
        email: string | null;
        hourly_rate: number;
        job_title: string | null;
      }>;
    }

    return (fallbackData || []).map((row: FallbackTimesheetRow): TimesheetWithEmployee => {
      const employee = row.employees[0]; // Get first employee from the array
      return {
        id: row.id,
        employee_id: row.employee_id,
        week_start_date: row.week_start_date,
        week_end_date: row.week_end_date,
        total_hours: Number(row.total_hours),
        monday_hours: Number(row.monday_hours),
        tuesday_hours: Number(row.tuesday_hours),
        wednesday_hours: Number(row.wednesday_hours),
        thursday_hours: Number(row.thursday_hours),
        friday_hours: Number(row.friday_hours),
        saturday_hours: Number(row.saturday_hours),
        sunday_hours: Number(row.sunday_hours),
        synced_from_connecteam: row.synced_from_connecteam,
        synced_at: row.synced_at,
        created_at: row.created_at || row.synced_at,
        updated_at: row.updated_at || row.synced_at,
        employee_name: employee.name,
        employee_email: employee.email,
        employee_hourly_rate: Number(employee.hourly_rate),
        employee_job_title: employee.job_title,
      };
    });
  }

  interface RPCTimesheetWithEmployee {
    id: string;
    employee_id: string;
    week_start_date: string;
    week_end_date: string;
    total_hours: number;
    monday_hours: number;
    tuesday_hours: number;
    wednesday_hours: number;
    thursday_hours: number;
    friday_hours: number;
    saturday_hours: number;
    sunday_hours: number;
    synced_from_connecteam: boolean;
    synced_at: string;
    created_at?: string;
    updated_at?: string;
    employee_name: string;
    employee_email: string | null;
    employee_hourly_rate: number;
    employee_job_title: string | null;
  }

  return (data || []).map((row: RPCTimesheetWithEmployee) => ({
    id: row.id,
    employee_id: row.employee_id,
    week_start_date: row.week_start_date,
    week_end_date: row.week_end_date,
    total_hours: Number(row.total_hours),
    monday_hours: Number(row.monday_hours),
    tuesday_hours: Number(row.tuesday_hours),
    wednesday_hours: Number(row.wednesday_hours),
    thursday_hours: Number(row.thursday_hours),
    friday_hours: Number(row.friday_hours),
    saturday_hours: Number(row.saturday_hours),
    sunday_hours: Number(row.sunday_hours),
    synced_from_connecteam: row.synced_from_connecteam,
    synced_at: row.synced_at,
    created_at: row.created_at || row.synced_at,
    updated_at: row.updated_at || row.synced_at,
    employee_name: row.employee_name,
    employee_email: row.employee_email,
    employee_hourly_rate: Number(row.employee_hourly_rate),
    employee_job_title: row.employee_job_title,
  }));
}

/**
 * Upsert (insert or update) a timesheet record
 */
export async function upsertTimesheet(
  employeeId: UUID,
  weekStartDate: string,
  weekEndDate: string,
  totalHours: number,
  dailyHours?: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  }
): Promise<Timesheet> {
  const supabase = createSupabaseServerClient();

  const timesheetData = {
    employee_id: employeeId,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    total_hours: totalHours,
    monday_hours: dailyHours?.monday || 0,
    tuesday_hours: dailyHours?.tuesday || 0,
    wednesday_hours: dailyHours?.wednesday || 0,
    thursday_hours: dailyHours?.thursday || 0,
    friday_hours: dailyHours?.friday || 0,
    saturday_hours: dailyHours?.saturday || 0,
    sunday_hours: dailyHours?.sunday || 0,
    synced_from_connecteam: true,
    synced_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("timesheets")
    .upsert(timesheetData, {
      onConflict: "employee_id,week_start_date",
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting timesheet:", error);
    throw error;
  }

  return {
    ...data,
    total_hours: Number(data.total_hours),
    monday_hours: Number(data.monday_hours),
    tuesday_hours: Number(data.tuesday_hours),
    wednesday_hours: Number(data.wednesday_hours),
    thursday_hours: Number(data.thursday_hours),
    friday_hours: Number(data.friday_hours),
    saturday_hours: Number(data.saturday_hours),
    sunday_hours: Number(data.sunday_hours),
  };
}

/**
 * Bulk upsert timesheets for multiple employees
 */
export async function bulkUpsertTimesheets(
  timesheets: Array<{
    employeeId: UUID;
    weekStartDate: string;
    weekEndDate: string;
    totalHours: number;
    dailyHours?: {
      monday?: number;
      tuesday?: number;
      wednesday?: number;
      thursday?: number;
      friday?: number;
      saturday?: number;
      sunday?: number;
    };
  }>
): Promise<{ success: number; errors: string[] }> {
  const supabase = createSupabaseServerClient();
  let success = 0;
  const errors: string[] = [];

  const timesheetData = timesheets.map((ts) => ({
    employee_id: ts.employeeId,
    week_start_date: ts.weekStartDate,
    week_end_date: ts.weekEndDate,
    total_hours: ts.totalHours,
    monday_hours: ts.dailyHours?.monday || 0,
    tuesday_hours: ts.dailyHours?.tuesday || 0,
    wednesday_hours: ts.dailyHours?.wednesday || 0,
    thursday_hours: ts.dailyHours?.thursday || 0,
    friday_hours: ts.dailyHours?.friday || 0,
    saturday_hours: ts.dailyHours?.saturday || 0,
    sunday_hours: ts.dailyHours?.sunday || 0,
    synced_from_connecteam: true,
    synced_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("timesheets")
    .upsert(timesheetData, {
      onConflict: "employee_id,week_start_date",
    })
    .select();

  if (error) {
    console.error("Error bulk upserting timesheets:", error);
    errors.push(error.message);
  } else {
    success = data?.length || 0;
  }

  return { success, errors };
}

/**
 * Delete timesheets for a specific week (if needed)
 */
export async function deleteTimesheetsForWeek(
  weekStartDate: string
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("timesheets")
    .delete()
    .eq("week_start_date", weekStartDate);

  if (error) {
    console.error("Error deleting timesheets:", error);
    throw error;
  }
}

