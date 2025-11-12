import "server-only";

import { createSupabaseServerClient } from "./server";
import {
  PAYROLL_STATUSES,
  type PayrollRecord,
  type PayrollRecordWithRelations,
  type PayrollStatus,
  type PayrollTransaction,
  type UUID,
  type WeeklyReportItem,
} from "./types";

interface DateRange {
  from?: string;
  to?: string;
}

interface ListPayrollFilters extends DateRange {
  status?: PayrollStatus | "all";
  employeeId?: UUID;
}

interface CreatePayrollRecordInput {
  employeeId: UUID;
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  notes?: string | null;
}

interface UpdatePayrollRecordInput {
  id: UUID;
  hoursWorked?: number;
  totalPay?: number;
  notes?: string | null;
  status?: PayrollStatus;
}

interface RecordPaymentInput {
  payrollRecordId: UUID;
  amount: number;
  paidAt?: string;
  method?: string | null;
  memo?: string | null;
}

function parseNumeric(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new Error(
    `Unable to parse numeric Supabase value: ${JSON.stringify(value)}`,
  );
}

function ensureValidStatus(status: string): PayrollStatus {
  if (PAYROLL_STATUSES.includes(status as PayrollStatus)) {
    return status as PayrollStatus;
  }

  throw new Error(`Invalid payroll status received: ${status}`);
}

interface RawPayrollRecord {
  id: UUID;
  employee_id: UUID;
  date: string;
  hours_worked: number | string;
  total_pay: number | string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RawPayrollTransaction {
  id: UUID;
  payroll_record_id: UUID;
  amount: number | string;
  status: string;
  paid_at: string;
  method: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

function coerceRecord(record: RawPayrollRecord): PayrollRecord {
  return {
    ...record,
    hours_worked: parseNumeric(record.hours_worked),
    total_pay: parseNumeric(record.total_pay),
    status: ensureValidStatus(record.status),
  };
}

function coerceTransaction(transaction: RawPayrollTransaction): PayrollTransaction {
  return {
    ...transaction,
    amount: parseNumeric(transaction.amount),
    status: ensureValidStatus(transaction.status),
  };
}

export async function listPayrollRecords(
  filters: ListPayrollFilters = {},
): Promise<PayrollRecordWithRelations[]> {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("payroll_records")
    .select(
      `
        *,
        employee:employees ( id, name, hourly_rate, connecteam_id ),
        transactions:payroll_transactions (*)
      `,
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.from) {
    query = query.gte("date", filters.from);
  }

  if (filters.to) {
    query = query.lte("date", filters.to);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    ...coerceRecord(item),
    employee: {
      ...item.employee,
      hourly_rate: parseNumeric(item.employee.hourly_rate),
    },
    transactions: (item.transactions ?? []).map(coerceTransaction),
  }));
}

export async function getPayrollRecord(
  id: UUID,
): Promise<PayrollRecordWithRelations | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("payroll_records")
    .select(
      `
        *,
        employee:employees ( id, name, hourly_rate, connecteam_id ),
        transactions:payroll_transactions (*)
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...coerceRecord(data),
    employee: {
      ...data.employee,
      hourly_rate: parseNumeric(data.employee.hourly_rate),
    },
    transactions: (data.transactions ?? []).map(coerceTransaction),
  };
}

export async function createPayrollRecord(
  input: CreatePayrollRecordInput,
): Promise<PayrollRecord> {
  const supabase = createSupabaseServerClient();
  const totalPay = input.hoursWorked * input.hourlyRate;

  const { data, error } = await supabase
    .from("payroll_records")
    .insert({
      employee_id: input.employeeId,
      date: input.date,
      hours_worked: input.hoursWorked,
      total_pay: totalPay,
      status: "pending",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return coerceRecord(data);
}

export async function updatePayrollRecord(
  input: UpdatePayrollRecordInput,
): Promise<PayrollRecord> {
  const supabase = createSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (typeof input.hoursWorked === "number") {
    updates.hours_worked = input.hoursWorked;
  }

  if (typeof input.totalPay === "number") {
    updates.total_pay = input.totalPay;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes;
  }

  if (input.status) {
    updates.status = input.status;
  }

  const { data, error } = await supabase
    .from("payroll_records")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return coerceRecord(data);
}

async function refreshPayrollStatus(
  supabaseClient: ReturnType<typeof createSupabaseServerClient>,
  payrollRecordId: UUID,
): Promise<PayrollRecord> {
  const { data: recordData, error: recordError } = await supabaseClient
    .from("payroll_records")
    .select("*")
    .eq("id", payrollRecordId)
    .single();

  if (recordError) {
    throw recordError;
  }

  const record = coerceRecord(recordData);

  const { data: transactionsData, error: transactionsError } =
    await supabaseClient
      .from("payroll_transactions")
      .select("*")
      .eq("payroll_record_id", payrollRecordId);

  if (transactionsError) {
    throw transactionsError;
  }

  const transactions = (transactionsData ?? []).map(coerceTransaction);
  const totalPaid = transactions.reduce(
    (sum, current) => sum + current.amount,
    0,
  );

  let nextStatus: PayrollStatus = "pending";

  if (totalPaid <= 0) {
    nextStatus = "pending";
  } else if (totalPaid >= record.total_pay) {
    nextStatus = "paid";
  } else {
    nextStatus = "partial";
  }

  if (nextStatus !== record.status) {
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from("payroll_records")
      .update({ status: nextStatus })
      .eq("id", payrollRecordId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    return coerceRecord(updatedRecord);
  }

  return record;
}

export async function recordPayrollPayment(
  input: RecordPaymentInput,
): Promise<{ record: PayrollRecord; transaction: PayrollTransaction }> {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const supabase = createSupabaseServerClient();
  const paidAt = input.paidAt ?? new Date().toISOString();

  const { data: transaction, error } = await supabase
    .from("payroll_transactions")
    .insert({
      payroll_record_id: input.payrollRecordId,
      amount: input.amount,
      status: "partial",
      paid_at: paidAt,
      method: input.method ?? null,
      memo: input.memo ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const refreshedRecord = await refreshPayrollStatus(
    supabase,
    input.payrollRecordId,
  );

  return {
    record: refreshedRecord,
    transaction: coerceTransaction(transaction),
  };
}

export async function markPayrollStatus(
  recordId: UUID,
  status: PayrollStatus,
) {
  const supabase = createSupabaseServerClient();

  if (!PAYROLL_STATUSES.includes(status)) {
    throw new Error(`Unsupported payroll status: ${status}`);
  }

  const { data, error } = await supabase
    .from("payroll_records")
    .update({ status })
    .eq("id", recordId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return coerceRecord(data);
}

export async function getWeeklyPayrollReport(
  range: DateRange = {},
): Promise<WeeklyReportItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_weekly_payroll_report", {
    date_from: range.from,
    date_to: range.to,
  });

  if (error) {
    throw error;
  }

  interface RPCWeeklyReport {
    week_start: string;
    week_end: string;
    total_hours: number | string;
    total_pay: number | string;
    pending_pay: number | string;
    partial_pay: number | string;
    paid_pay: number | string;
  }

  return (data ?? []).map((row: RPCWeeklyReport) => ({
    week_start: row.week_start,
    week_end: row.week_end,
    total_hours: parseNumeric(row.total_hours),
    total_pay: parseNumeric(row.total_pay),
    pending_pay: parseNumeric(row.pending_pay),
    partial_pay: parseNumeric(row.partial_pay),
    paid_pay: parseNumeric(row.paid_pay),
  }));
}



