import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  location: z
    .union([
      z.string().min(1),
      z.object({
        country: z.string().min(1),
        region: z.string().min(1),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      }),
    ])
    .optional(),
  ecosystemType: z
    .enum(["mangrove", "seagrass", "saltmarsh", "kelp", "coral_reef"])
    .optional(),
  area: z.number().min(0.1).optional(),
  estimatedSequestration: z.number().min(0).optional(),
  methodology: z.string().min(1).optional(),
  status: z.enum(["draft", "pending", "under_review"]).optional(),
});

// GET single project
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
    const project = await Project.findById(id)
      .populate("owner", "name email organization")
      .populate("verifier", "name email");

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update project
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
    if (
      project.owner.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

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

    const normalizeLocation = (location: string | Record<string, any>) => {
      if (typeof location === "string") {
        const parts = location
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
        const country = parts.length > 1 ? parts.pop()! : parts[0] || "";
        const region = parts.length > 0 ? parts.join(", ") : country;
        return { country, region };
      }

      return location;
    };

    const updateData = validationResult.data;
    const normalizedData = {
      ...updateData,
      ...(updateData.location
        ? { location: normalizeLocation(updateData.location) }
        : {}),
    };

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      normalizedData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE project
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
    if (
      project.owner.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Only allow deletion of draft projects
    if (project.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Cannot delete non-draft projects" },
        { status: 400 }
      );
    }

    await Project.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
