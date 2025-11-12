import "server-only";

import { createSupabaseServerClient } from "./server";
import { type Employee, type UUID } from "./types";

export async function listEmployees(): Promise<Employee[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((employee) => ({
    ...employee,
    hourly_rate:
      typeof employee.hourly_rate === "string"
        ? Number(employee.hourly_rate)
        : employee.hourly_rate,
  }));
}

export async function getEmployee(id: UUID): Promise<Employee | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    hourly_rate:
      typeof data.hourly_rate === "string" ? Number(data.hourly_rate) : data.hourly_rate,
  };
}

export const getEmployeeById = getEmployee;

export type CreateEmployeeInput = Omit<
  Employee,
  "id" | "created_at" | "updated_at"
>;

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<Employee> {
  const supabase = createSupabaseServerClient();

  const payload = {
    name: input.name,
    email: input.email?.trim() || null,
    phone_number: input.phone_number?.trim() || null,
    kiosk_code: input.kiosk_code?.trim() || null,
    connecteam_id: input.connecteam_id?.trim() || null,
    employee_number: input.employee_number?.trim() || null,
    job_title: input.job_title?.trim() || null,
    employment_start_date: input.employment_start_date || null,
    hourly_rate: Number(input.hourly_rate ?? 0),
    current_week_hours:
      input.current_week_hours !== undefined && input.current_week_hours !== null
        ? Number(input.current_week_hours)
        : 0,
    is_active: input.is_active ?? true,
    last_sync_at: input.last_sync_at || null,
  };

  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    hourly_rate:
      typeof data.hourly_rate === "string"
        ? Number(data.hourly_rate)
        : data.hourly_rate,
    current_week_hours:
      data.current_week_hours !== null && data.current_week_hours !== undefined
        ? Number(data.current_week_hours)
        : null,
  };
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

type EmployeeUpdatePayload = Partial<
  Pick<
    Employee,
    | "name"
    | "email"
    | "hourly_rate"
    | "connecteam_id"
    | "phone_number"
    | "kiosk_code"
    | "employee_number"
    | "job_title"
    | "employment_start_date"
    | "current_week_hours"
    | "is_active"
    | "last_sync_at"
  >
>;

export async function updateEmployee(
  id: UUID,
  input: UpdateEmployeeInput
): Promise<Employee> {
  const supabase = createSupabaseServerClient();

  // Build update object with only provided fields
  const updateData: EmployeeUpdatePayload = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.hourly_rate !== undefined)
    updateData.hourly_rate = Number(input.hourly_rate);
  if (input.connecteam_id !== undefined)
    updateData.connecteam_id = input.connecteam_id;
  if (input.phone_number !== undefined)
    updateData.phone_number = input.phone_number;
  if (input.kiosk_code !== undefined) updateData.kiosk_code = input.kiosk_code;
  if (input.employee_number !== undefined)
    updateData.employee_number = input.employee_number;
  if (input.job_title !== undefined) updateData.job_title = input.job_title;
  if (input.employment_start_date !== undefined)
    updateData.employment_start_date = input.employment_start_date;
  if (input.current_week_hours !== undefined && input.current_week_hours !== null)
    updateData.current_week_hours = Number(input.current_week_hours);
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from("employees")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    hourly_rate:
      typeof data.hourly_rate === "string"
        ? Number(data.hourly_rate)
        : data.hourly_rate,
    current_week_hours:
      data.current_week_hours !== null && data.current_week_hours !== undefined
        ? Number(data.current_week_hours)
        : null,
  };
}

export async function deleteEmployee(id: UUID): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) {
    throw error;
  }
}


