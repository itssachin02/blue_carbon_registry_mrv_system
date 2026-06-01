import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MRVReport from "@/models/MRVReport";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET single MRV report
export async function GET(
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
    const report = await MRVReport.findById(id)
      .populate("project", "name ecosystemType location owner")
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name email");

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update MRV report
export async function PUT(
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
    const report = await MRVReport.findById(id).populate("project");

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Check access
    const project = await Project.findById(report.project);
    if (
      !project ||
      (project.owner.toString() !== session.userId &&
        report.submittedBy.toString() !== session.userId &&
        session.role !== "admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only allow editing draft reports
    if (report.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Cannot edit submitted reports" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedReport = await MRVReport.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Update MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE MRV report
export async function DELETE(
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

    // Only allow deletion of draft reports
    if (report.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Cannot delete non-draft reports" },
        { status: 400 }
      );
    }

    await MRVReport.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
