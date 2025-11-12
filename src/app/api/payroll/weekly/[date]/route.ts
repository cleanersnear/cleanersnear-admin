import { NextResponse } from "next/server";
import { getWeeklyPayroll, updatePayrollHours } from "@/lib/supabase/weekly-payroll";
import { type UUID } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const weekStartDate = new Date(date);
    
    const records = await getWeeklyPayroll(weekStartDate);
    
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("[api/payroll/weekly/:date] GET", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weekly payroll.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: { params: Promise<{ date: string }> }
) {
  try {
    const payload = await request.json();

    if (!payload?.employeeId || typeof payload?.hours !== "number") {
      return NextResponse.json(
        { error: "Missing employeeId or hours" },
        { status: 400 }
      );
    }

    await updatePayrollHours(
      payload.employeeId as UUID,
      payload.hours
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/payroll/weekly/:date] PATCH", error);
    return NextResponse.json(
      {
        error: "Failed to update weekly hours.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


