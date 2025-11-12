import { NextResponse } from "next/server";
import {
  listEmployees,
  createEmployee,
  type CreateEmployeeInput,
} from "@/lib/supabase/employees";

export async function GET() {
  try {
    const employees = await listEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload: CreateEmployeeInput = await request.json();
    const employee = await createEmployee(payload);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}


