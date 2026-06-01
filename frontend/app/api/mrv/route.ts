import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MRVReport from "@/models/MRVReport";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const mrvReportSchema = z.object({
  project: z.string().min(1),
  reportType: z.enum(["baseline", "monitoring", "verification", "annual"]),
  reportingPeriod: z.object({
    startDate: z.string().transform((s) => new Date(s)),
    endDate: z.string().transform((s) => new Date(s)),
  }),
  methodology: z.string().min(1),
  carbonSequestered: z.number().min(0),
  emissionsReduced: z.number().min(0).default(0),
  dataSource: z.string().min(1),
  accuracy: z.number().min(0).max(100),
});

// GET all MRV reports
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
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const reportType = searchParams.get("reportType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = {};

    if (projectId) {
      query.project = projectId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (reportType && reportType !== "all") {
      query.reportType = reportType;
    }

    // Role-based filtering
    if (session.role === "project_owner") {
      // Get projects owned by user
      const ownedProjects = await Project.find({ owner: session.userId }).select(
        "_id"
      );
      const projectIds = ownedProjects.map((p) => p._id);
      query.project = { $in: projectIds };
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      MRVReport.find(query)
        .populate("project", "name ecosystemType")
        .populate("submittedBy", "name email")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MRVReport.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get MRV reports error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new MRV report
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    const validationResult = mrvReportSchema.safeParse(body);
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

    // Verify project exists and user has access
    const project = await Project.findById(validationResult.data.project);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      project.owner.toString() !== session.userId &&
      session.role !== "admin" &&
      session.role !== "verifier"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const report = new MRVReport({
      ...validationResult.data,
      submittedBy: session.userId,
      status: "draft",
    });

    await report.save();

    return NextResponse.json(
      {
        success: true,
        message: "MRV report created successfully",
        data: report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create MRV report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
