import { NextResponse } from "next/server";

import { createPayrollRecord, listPayrollRecords } from "@/lib/supabase/payroll";
import { type UUID } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? undefined) as
    | "pending"
    | "paid"
    | "partial"
    | "all"
    | undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const employeeIdParam = searchParams.get("employeeId");
  const employeeId = employeeIdParam
    ? (employeeIdParam as UUID)
    : undefined;

  try {
    const records = await listPayrollRecords({
      status,
      from,
      to,
      employeeId,
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("[api/payroll] GET", error);
    return NextResponse.json(
      {
        error: "Failed to fetch payroll records.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (
      !payload?.employeeId ||
      !payload?.date ||
      typeof payload?.hoursWorked !== "number" ||
      typeof payload?.hourlyRate !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields for payroll record creation." },
        { status: 400 },
      );
    }

    const record = await createPayrollRecord({
      employeeId: payload.employeeId,
      date: payload.date,
      hoursWorked: payload.hoursWorked,
      hourlyRate: payload.hourlyRate,
      notes: payload.notes,
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("[api/payroll] POST", error);
    return NextResponse.json(
      {
        error: "Failed to create payroll record.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


