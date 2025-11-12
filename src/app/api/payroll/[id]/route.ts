import { NextResponse } from "next/server";

import {
  getPayrollRecord,
  markPayrollStatus,
  updatePayrollRecord,
} from "@/lib/supabase/payroll";
import { PAYROLL_STATUSES } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await getPayrollRecord(id as `${string}-${string}-${string}-${string}-${string}`);

    if (!record) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("[api/payroll/:id] GET", error);
    return NextResponse.json(
      {
        error: "Failed to fetch payroll record.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();

    if (payload?.status && !PAYROLL_STATUSES.includes(payload.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${payload.status}` },
        { status: 400 },
      );
    }

    let record;

    if (payload?.status) {
      record = await markPayrollStatus(id as `${string}-${string}-${string}-${string}-${string}`, payload.status);
    } else {
      record = await updatePayrollRecord({
        id: id as `${string}-${string}-${string}-${string}-${string}`,
        hoursWorked: payload?.hoursWorked,
        totalPay: payload?.totalPay,
        notes: payload?.notes,
      });
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("[api/payroll/:id] PATCH", error);
    return NextResponse.json(
      {
        error: "Failed to update payroll record.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


