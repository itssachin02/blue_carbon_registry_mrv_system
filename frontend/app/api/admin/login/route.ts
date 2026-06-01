import { NextRequest, NextResponse } from "next/server";

// Hardcoded admin credentials
const ADMIN_EMAIL = "oceanledgermrv@gmail.com";
const ADMIN_PASSWORD = "adminaccessmrv@1234";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create admin response
      return NextResponse.json(
        {
          success: true,
          message: "Admin login successful",
          admin: {
            id: "admin_001",
            email: ADMIN_EMAIL,
            name: "Ocean Ledger MRV Admin",
            role: "admin",
          },
          token: "admin_token_" + Date.now(), // Simple token
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin credentials",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
