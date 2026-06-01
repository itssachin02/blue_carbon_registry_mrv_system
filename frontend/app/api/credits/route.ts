import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import CarbonCredit from "@/models/CarbonCredit";
import { getSession } from "@/lib/auth";

// GET all carbon credits
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (!["admin", "verifier"].includes(session.role)) {
      query.owner = session.userId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [credits, total] = await Promise.all([
      CarbonCredit.find(query)
        .populate("project", "name ecosystemType location")
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CarbonCredit.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        credits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get credits error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
