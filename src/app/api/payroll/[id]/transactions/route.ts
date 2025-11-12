import { NextResponse } from "next/server";

import { recordPayrollPayment } from "@/lib/supabase/payroll";
import { type UUID } from "@/lib/supabase/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();

    if (typeof payload?.amount !== "number" || payload.amount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than zero." },
        { status: 400 },
      );
    }

    const result = await recordPayrollPayment({
      payrollRecordId: id as UUID,
      amount: payload.amount,
      paidAt: payload?.paidAt,
      method: payload?.method ?? null,
      memo: payload?.memo ?? null,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("[api/payroll/:id/transactions] POST", error);
    return NextResponse.json(
      {
        error: "Failed to record payroll payment.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


