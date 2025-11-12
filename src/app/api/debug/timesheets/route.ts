import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  
  // Get all timesheets
  const { data: timesheets, error } = await supabase
    .from("timesheets")
    .select("*")
    .order("week_start_date", { ascending: false })
    .limit(10);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Try to query for specific date
  const { data: nov3Data, error: nov3Error } = await supabase
    .from("timesheets")
    .select("*")
    .eq("week_start_date", "2025-11-03");
  
  return NextResponse.json({
    allTimesheets: timesheets,
    nov3Timesheets: nov3Data,
    nov3Error: nov3Error?.message || null,
    totalCount: timesheets?.length || 0,
  });
}

