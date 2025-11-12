import "server-only";
import { createSupabaseServerClient } from "./server";
import { UUID } from "./types";

/**
 * Get week start (Monday) from any date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get week end (Sunday) from week start
 */
export function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get week ID string
 */
export function getWeekId(weekStart: Date): string {
  return `Week of ${weekStart.toLocaleDateString()}`;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate payroll records for all employees for a specific week
 * Uses timesheets data if available, otherwise creates with 0 hours
 */
export async function generateWeeklyPayroll(weekStartDate: string) {
  const supabase = createSupabaseServerClient();
  
  // Calculate week end date (Sunday)
  const startDate = new Date(weekStartDate + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const weekEndDate = endDate.toISOString().split('T')[0];
  
  // Get all active employees
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, name, hourly_rate")
    .eq("is_active", true);
    
  if (employeesError) {
    throw new Error(`Failed to fetch employees: ${employeesError.message}`);
  }
  
  if (!employees || employees.length === 0) {
    throw new Error("No active employees found");
  }
  
  // Get timesheets for this week (from database)
  // Check nearby dates (±2 days) for date mismatches
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  const startDateObj = parseDate(weekStartDate);
  
  const twoDaysBefore = new Date(startDateObj);
  twoDaysBefore.setDate(startDateObj.getDate() - 2);
  const oneDayBefore = new Date(startDateObj);
  oneDayBefore.setDate(startDateObj.getDate() - 1);
  const oneDayAfter = new Date(startDateObj);
  oneDayAfter.setDate(startDateObj.getDate() + 1);
  const twoDaysAfter = new Date(startDateObj);
  twoDaysAfter.setDate(startDateObj.getDate() + 2);
  
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const datesToCheck = [
    formatLocalDate(twoDaysBefore),
    formatLocalDate(oneDayBefore),
    weekStartDate,
    formatLocalDate(oneDayAfter),
    formatLocalDate(twoDaysAfter),
  ];
  
  const { data: timesheets, error: timesheetsError } = await supabase
    .from("timesheets")
    .select("employee_id, total_hours, week_start_date")
    .in("week_start_date", datesToCheck);
    
  if (timesheetsError) {
    throw new Error(`Failed to fetch timesheets: ${timesheetsError.message}`);
  }
    
  // Create a map of employee_id -> hours
  const hoursMap = new Map<string, number>();
  if (timesheets && timesheets.length > 0) {
    for (const ts of timesheets) {
      const hours = Number(ts.total_hours) || 0;
      const existing = hoursMap.get(ts.employee_id) || 0;
      if (hours > existing || !existing) {
        hoursMap.set(ts.employee_id, hours);
      }
    }
  }
  
  // Check if records already exist for this week
  const { data: existingRecords } = await supabase
    .from("payroll_records")
    .select("id, employee_id, status")
    .eq("date", weekStartDate);
  
  const existingMap = new Map(
    (existingRecords || []).map((r) => [r.employee_id, r])
  );
  
  let created = 0;
  let updated = 0;
  const allResults = [];
  
  // Process each employee - update if exists, create if new
  for (const emp of employees) {
    const hours = hoursMap.get(emp.id) || 0;
    const totalPay = hours * Number(emp.hourly_rate);
    const existing = existingMap.get(emp.id);
    
    // If total pay is $0, set status to "paid" (no payment needed)
    // Otherwise set to "pending" (awaiting payment)
    const initialStatus = totalPay === 0 ? "paid" : "pending";
    
    if (existing) {
      // Update existing record (preserve status if already paid/partial)
      const { data, error } = await supabase
        .from("payroll_records")
        .update({
          hours_worked: hours,
          total_pay: totalPay,
          notes: `Week of ${weekStartDate} - ${weekEndDate}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to update record for ${emp.name}: ${error.message}`);
      }
      updated++;
      allResults.push(data);
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("payroll_records")
        .insert({
          employee_id: emp.id,
          date: weekStartDate,
          hours_worked: hours,
          total_pay: totalPay,
          status: initialStatus,
          notes: `Week of ${weekStartDate} - ${weekEndDate}`,
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to create record for ${emp.name}: ${error.message}`);
      }
      created++;
      allResults.push(data);
    }
  }
  
  return {
    weekStartDate,
    weekEndDate,
    recordsCreated: created,
    recordsUpdated: updated,
    totalRecords: allResults.length,
    hoursFromTimesheets: timesheets?.length || 0,
    records: allResults,
  };
}

/**
 * Get all unique payroll weeks
 */
export async function getAllPayrollWeeks() {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("payroll_records")
    .select("date")
    .order("date", { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch payroll weeks: ${error.message}`);
  }
  
  if (!data) return [];
  
  // Group by week (date field represents week start)
  const weekMap = new Map<string, { count: number; weekStart: string; weekEnd: string }>();
  
  for (const record of data) {
    const weekStart = record.date;
    if (!weekMap.has(weekStart)) {
      const startDate = new Date(weekStart + 'T00:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      const weekEnd = endDate.toISOString().split('T')[0];
      
      weekMap.set(weekStart, { count: 0, weekStart, weekEnd });
    }
    weekMap.get(weekStart)!.count++;
  }
  
  // Convert to array
  return Array.from(weekMap.entries()).map(([weekStart, data]) => ({
    weekId: `Week of ${weekStart}`,
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    recordCount: data.count,
  }));
}

/**
 * Get payroll records for a specific week
 */
export async function getWeeklyPayrollRecords(weekStartDate: string) {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("payroll_records")
    .select(`
      id,
      employee_id,
      date,
      hours_worked,
      total_pay,
      status,
      notes,
      created_at,
      updated_at,
      employee:employees(id, name, hourly_rate, email, job_title),
      transactions:payroll_transactions(id, amount, paid_at, status, method, memo)
    `)
    .eq("date", weekStartDate)
    .order("employee(name)");
    
  if (error) {
    throw new Error(`Failed to fetch weekly payroll: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get payroll records for a specific week (accepts Date object)
 */
export async function getWeeklyPayroll(weekStart: Date) {
  const weekStartDate = formatDate(weekStart);
  return getWeeklyPayrollRecords(weekStartDate);
}

/**
 * Update hours for a specific payroll record
 * Recalculates total_pay based on employee's hourly_rate
 */
export async function updatePayrollHours(
  recordId: UUID,
  hours: number
) {
  const supabase = createSupabaseServerClient();
  
  // First get the employee's hourly rate
  const { data: record, error: fetchError } = await supabase
    .from("payroll_records")
    .select("employee:employees!inner(hourly_rate)")
    .eq("id", recordId)
    .single();
    
  if (fetchError || !record) {
    throw new Error("Payroll record not found");
  }
  
  interface EmployeeRate {
    employee: {
      hourly_rate: number;
    };
  }
  
  const typedRecord = record as unknown as EmployeeRate;
  const hourlyRate = Number(typedRecord.employee.hourly_rate);
  const totalPay = hours * hourlyRate;
  
  // Update the record
  const { data, error } = await supabase
    .from("payroll_records")
    .update({
      hours_worked: hours,
      total_pay: totalPay,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update hours: ${error.message}`);
  }
  
  return data;
}

/**
 * Sync hours from timesheets for a specific week
 * Updates existing payroll records with timesheet data
 */
export async function syncPayrollFromTimesheets(weekStartDate: string) {
  const supabase = createSupabaseServerClient();
  
  // Get timesheets for this week
  const { data: timesheets, error: timesheetsError } = await supabase
    .from("timesheets")
    .select("employee_id, total_hours")
    .eq("week_start_date", weekStartDate);
    
  if (timesheetsError) {
    throw new Error(`Failed to fetch timesheets: ${timesheetsError.message}`);
  }
  
  if (!timesheets || timesheets.length === 0) {
    throw new Error("No timesheet data found for this week");
  }
  
  // Get payroll records for this week
  const { data: payrollRecords, error: payrollError } = await supabase
    .from("payroll_records")
    .select("id, employee_id, employee:employees!inner(hourly_rate)")
    .eq("date", weekStartDate);
    
  if (payrollError) {
    throw new Error(`Failed to fetch payroll records: ${payrollError.message}`);
  }
  
  if (!payrollRecords || payrollRecords.length === 0) {
    throw new Error("No payroll records found for this week. Generate the week first.");
  }
  
  interface PayrollRecordWithRate {
    id: string;
    employee_id: string;
    employee: {
      hourly_rate: number;
    };
  }
  
  // Create a map of employee_id -> payroll_record
  const typedPayrollRecords = payrollRecords as unknown as PayrollRecordWithRate[];
  const payrollMap = new Map(
    typedPayrollRecords.map((pr) => [pr.employee_id, pr])
  );
  
  // Update each payroll record with timesheet hours
  let updated = 0;
  for (const ts of timesheets) {
    const payrollRecord = payrollMap.get(ts.employee_id);
    if (payrollRecord) {
      const hours = Number(ts.total_hours);
      const hourlyRate = Number(payrollRecord.employee.hourly_rate);
      const totalPay = hours * hourlyRate;
      
      const { error: updateError } = await supabase
        .from("payroll_records")
        .update({
          hours_worked: hours,
          total_pay: totalPay,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payrollRecord.id);
        
      if (!updateError) {
        updated++;
      }
    }
  }
  
  return {
    updated,
    total: timesheets.length,
  };
}
