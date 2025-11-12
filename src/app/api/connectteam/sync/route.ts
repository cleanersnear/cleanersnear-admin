import { NextResponse } from "next/server";
import { syncCurrentWeekHours } from "@/lib/connecteam/sync";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const weekStartDate = body.weekStartDate ? new Date(body.weekStartDate) : undefined;
    const clearFirst = body.clearFirst !== false; // Default to true
    
    const result = await syncCurrentWeekHours(weekStartDate, clearFirst);

    if (result.success) {
      return NextResponse.json(
        {
          message: "Sync completed successfully",
          data: result,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: "Sync completed with errors",
          data: result,
        },
        { status: 207 } // Multi-status
      );
    }
  } catch (error) {
    console.error("[api/connecteam/sync] POST", error);
    return NextResponse.json(
      {
        error: "Failed to sync with Connecteam",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

