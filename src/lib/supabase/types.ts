export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export const PAYROLL_STATUSES = ["pending", "partial", "paid"] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

export interface Employee {
  id: UUID;
  name: string;
  email: string | null;
  hourly_rate: number;
  connecteam_id: string | null;
  current_week_hours?: number | null;
  last_sync_at?: string | null;
  // Additional Connecteam fields
  phone_number?: string | null;
  kiosk_code?: string | null;
  employee_number?: string | null;
  job_title?: string | null;
  employment_start_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: UUID;
  employee_id: UUID;
  date: string;
  hours_worked: number;
  total_pay: number;
  status: PayrollStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollTransaction {
  id: UUID;
  payroll_record_id: UUID;
  amount: number;
  status: PayrollStatus;
  paid_at: string;
  method: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecordWithRelations extends PayrollRecord {
  employee: Pick<Employee, "id" | "name" | "hourly_rate" | "connecteam_id">;
  transactions: PayrollTransaction[];
}

export interface WeeklyReportItem {
  week_start: string;
  week_end: string;
  total_hours: number;
  total_pay: number;
  pending_pay: number;
  partial_pay: number;
  paid_pay: number;
}

export interface Timesheet {
  id: UUID;
  employee_id: UUID;
  week_start_date: string; // ISO date string YYYY-MM-DD
  week_end_date: string;   // ISO date string YYYY-MM-DD
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
}

export interface TimesheetWithEmployee extends Timesheet {
  employee_name: string;
  employee_email: string | null;
  employee_hourly_rate: number;
  employee_job_title: string | null;
}

export interface TimesheetWeekSummary {
  week_start_date: string;
  week_end_date: string;
  employee_count: number;
  total_hours: number;
  last_synced_at: string;
}


