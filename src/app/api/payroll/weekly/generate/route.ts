import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyPayroll } from "@/lib/supabase/weekly-payroll";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStartDate } = body;

    if (!weekStartDate) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    // Generate payroll records (automatically pulls from timesheets table)
    const result = await generateWeeklyPayroll(weekStartDate);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error generating weekly payroll:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate weekly payroll",
      },
      { status: 500 }
    );
  }
}
