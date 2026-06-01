import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST submit project for verification
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (
      project.owner.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only allow submission of draft projects
    if (project.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Project has already been submitted" },
        { status: 400 }
      );
    }

    project.status = "pending";
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Project submitted for verification",
      data: project,
    });
  } catch (error) {
    console.error("Submit project error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
