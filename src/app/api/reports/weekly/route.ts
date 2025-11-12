import { NextResponse } from "next/server";

import { getWeeklyPayrollReport } from "@/lib/supabase/payroll";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    const report = await getWeeklyPayrollReport({ from, to });
    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("[api/reports/weekly] GET", error);
    return NextResponse.json(
      {
        error: "Failed to generate weekly report.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}



