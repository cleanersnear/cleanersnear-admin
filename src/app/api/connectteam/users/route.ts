import { NextResponse } from "next/server";
import { getConnecteamUsers } from "@/lib/connecteam/client";

/**
 * GET /api/connecteam/users
 * Fetch all users from Connecteam
 */
export async function GET() {
  try {
    const users = await getConnecteamUsers();

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("[api/connecteam/users] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users from Connecteam",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

