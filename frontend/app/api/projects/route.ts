import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  location: z.union([
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
  ]),
  ecosystemType: z.enum([
    "mangrove",
    "seagrass",
    "saltmarsh",
    "kelp",
    "coral_reef",
  ]),
  area: z.number().min(0.1),
  carbonCredits: z.number().min(0),
  estimatedSequestration: z.number().min(0).optional(),
  methodology: z.string().min(1).optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
});

// GET all projects (with filters)
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
    const ecosystemType = searchParams.get("ecosystemType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");

    // Build query
    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (session.role === "project_owner") {
      query.owner = session.userId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (ecosystemType && ecosystemType !== "all") {
      query.ecosystemType = ecosystemType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "location.country": { $regex: search, $options: "i" } },
        { "location.region": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate("owner", "name email")
        .populate("verifier", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only project_owner and admin can create projects
    if (!["project_owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    const validationResult = projectSchema.safeParse(body);
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

    const projectData = validationResult.data;
    const project = new Project({
      ...projectData,
      location: normalizeLocation(projectData.location),
      owner: session.userId,
      status: "draft",
    });

    await project.save();

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
