import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MRVReport from "@/models/MRVReport";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
});

// POST review MRV report (verifier/admin only)
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

    // Only verifiers and admins can review
    if (!["verifier", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
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

    // Only review submitted or under_review reports
    if (!["submitted", "under_review"].includes(report.status)) {
      return NextResponse.json(
        { success: false, error: "Report is not available for review" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { action, notes } = validationResult.data;

    report.status = action === "approve" ? "approved" : "rejected";
    report.reviewedBy = session.userId;
    report.reviewNotes = notes;

    if (action === "approve") {
      report.verifiedAt = new Date();

      // Update project carbon credits if approved
      const project = await Project.findById(report.project);
      if (project) {
        project.carbonCredits += report.carbonSequestered;
        await project.save();
      }
    }

    await report.save();

    return NextResponse.json({
      success: true,
      message: `Report ${action}d successfully`,
      data: report,
    });
  } catch (error) {
    console.error("Review MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
