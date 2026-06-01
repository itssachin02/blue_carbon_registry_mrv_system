import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MRVReport from "@/models/MRVReport";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST submit MRV report for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { id } = await params;
    const report = await MRVReport.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (
      report.submittedBy.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only allow submission of draft reports
    if (report.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Report has already been submitted" },
        { status: 400 }
      );
    }

    report.status = "submitted";
    await report.save();

    return NextResponse.json({
      success: true,
      message: "Report submitted for review",
      data: report,
    });
  } catch (error) {
    console.error("Submit MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
