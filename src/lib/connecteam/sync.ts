import "server-only";

import { createSupabaseServerClient } from "../supabase/server";
import { bulkUpsertTimesheets } from "../supabase/timesheets";
import { UUID } from "../supabase/types";
import {
  getTimeClocks,
  getTimesheetTotalsWithDaily,
  getCurrentWeekRange,
} from "./client";

interface SyncResult {
  success: boolean;
  employeesSynced: number;
  errors: string[];
  syncedAt: string;
}

/**
 * Sync week hours from Connecteam to database
 * Matches employees by connecteam_id and updates current_week_hours
 * @param weekStartDate - Optional start date of the week to sync (defaults to current week)
 * @param clearFirst - If true, sets all employees to 0 hours before syncing
 */
export async function syncCurrentWeekHours(
  weekStartDate?: Date,
  clearFirst: boolean = true
): Promise<SyncResult> {
  const supabase = createSupabaseServerClient();
  const errors: string[] = [];
  let employeesSynced = 0;

  try {
    // Step 1: Get all employees (not just with connecteam_id)
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, connecteam_id");

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      return {
        success: true,
        employeesSynced: 0,
        errors: ["No employees found"],
        syncedAt: new Date().toISOString(),
      };
    }

    // Step 1b: Clear all employees' hours first if requested (Connecteam = source of truth)
    if (clearFirst) {
      const { error: clearError } = await supabase
        .from("employees")
        .update({ current_week_hours: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      if (clearError) {
        errors.push(`Warning: Failed to clear existing hours: ${clearError.message}`);
      }
    }

    // Step 2: Get time clocks from Connecteam
    const timeClocks = await getTimeClocks();
    
    if (!timeClocks || timeClocks.length === 0) {
      throw new Error("No time clocks found in Connecteam");
    }

    // Use the first active time clock
    const activeClock = timeClocks.find((clock) => !clock.isArchived);
    if (!activeClock) {
      throw new Error("No active time clock found");
    }

    // Step 3: Get week date range (use provided date or current week)
    let startDate: string;
    let endDate: string;
    
    // Helper to format date as YYYY-MM-DD using local date components
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    
    if (weekStartDate) {
      // Parse the provided date using date components to avoid timezone issues
      const year = weekStartDate.getFullYear();
      const month = weekStartDate.getMonth();
      const dateNum = weekStartDate.getDate();
      
      const localDate = new Date(year, month, dateNum);
      const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate offset to Monday
      // Sunday (0) -> -6 days, Monday (1) -> 0 days, Tuesday (2) -> -1 day, etc.
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const monday = new Date(year, month, dateNum + daysToMonday);
      const sunday = new Date(year, month, dateNum + daysToMonday + 6);
      
      startDate = formatDate(monday);
      endDate = formatDate(sunday);
    } else {
      // Use current week
      const range = getCurrentWeekRange();
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Step 4: Fetch timesheet totals with daily breakdown
    const hoursMapWithDaily = await getTimesheetTotalsWithDaily(
      activeClock.id,
      startDate,
      endDate
    );


    // Helper function to get day of week from date
    const getDayOfWeek = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      return days[dayIndex];
    };

    // Step 5.5: Delete existing timesheets for this week (and nearby dates) to avoid duplicates
    // Delete timesheets within ±2 days of the target week to handle date mismatches
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const startDateObj = parseDate(startDate);
    const twoDaysBefore = new Date(startDateObj);
    twoDaysBefore.setDate(startDateObj.getDate() - 2);
    const twoDaysAfter = new Date(startDateObj);
    twoDaysAfter.setDate(startDateObj.getDate() + 2);
    
    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dateRangeStart = formatLocalDate(twoDaysBefore);
    const dateRangeEnd = formatLocalDate(twoDaysAfter);
    
    // Delete all timesheets in the date range
    await supabase
      .from("timesheets")
      .delete()
      .gte("week_start_date", dateRangeStart)
      .lte("week_start_date", dateRangeEnd);
    
    // Step 6: Update each employee's current_week_hours AND save to timesheets table with daily breakdown
    const syncTime = new Date().toISOString();
    const timesheetsToSave: Array<{
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
    }> = [];

    for (const employee of employees) {
      // If employee has no Connecteam ID, set hours to 0 (or skip update if clearFirst already did it)
      if (!employee.connecteam_id) {
        if (!clearFirst) {
          const { error: updateError } = await supabase
            .from("employees")
            .update({
              current_week_hours: 0,
              last_sync_at: syncTime,
            })
            .eq("id", employee.id);

          if (!updateError) {
            employeesSynced++;
          }
        }
        // Still save to timesheets table with 0 hours
        timesheetsToSave.push({
          employeeId: employee.id as UUID,
          weekStartDate: startDate,
          weekEndDate: endDate,
          totalHours: 0,
        });
        continue;
      }

      // Get hours breakdown from Connecteam (0 if not found)
      const breakdown = hoursMapWithDaily.get(employee.connecteam_id) || { totalHours: 0, dailyHours: new Map() };
      const hours = breakdown.totalHours;
      
      // Extract daily hours
      const dailyHours: {
        monday?: number;
        tuesday?: number;
        wednesday?: number;
        thursday?: number;
        friday?: number;
        saturday?: number;
        sunday?: number;
      } = {};
      
      for (const [dateStr, dayHours] of breakdown.dailyHours.entries()) {
        const dayOfWeek = getDayOfWeek(dateStr);
        dailyHours[dayOfWeek] = dayHours;
      }
      

      // Update current_week_hours in employees table
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          current_week_hours: hours,
          last_sync_at: syncTime,
        })
        .eq("id", employee.id);

      if (updateError) {
        errors.push(
          `Failed to update ${employee.name}: ${updateError.message}`
        );
      } else {
        employeesSynced++;
      }

      // Add to timesheets batch with daily breakdown
      timesheetsToSave.push({
        employeeId: employee.id as UUID,
        weekStartDate: startDate,
        weekEndDate: endDate,
        totalHours: hours,
        dailyHours,
      });
    }

    // Step 7: Bulk save to timesheets table for historical tracking
    if (timesheetsToSave.length > 0) {
      const timesheetResult = await bulkUpsertTimesheets(timesheetsToSave);
      if (timesheetResult.errors.length > 0) {
        errors.push(...timesheetResult.errors.map(e => `Timesheet save error: ${e}`));
      }
    }

    return {
      success: errors.length === 0,
      employeesSynced,
      errors,
      syncedAt: syncTime,
    };
  } catch (error) {
    return {
      success: false,
      employeesSynced,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
      syncedAt: new Date().toISOString(),
    };
  }
}

