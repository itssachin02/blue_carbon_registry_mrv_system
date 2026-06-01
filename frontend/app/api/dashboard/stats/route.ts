import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import MRVReport from "@/models/MRVReport";
import CarbonCredit from "@/models/CarbonCredit";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Build query based on role
    const projectQuery: Record<string, unknown> = {};
    const creditQuery: Record<string, unknown> = {};

    if (session.role === "project_owner") {
      projectQuery.owner = session.userId;
      creditQuery.owner = session.userId;
    }

    // Get statistics
    const [
      totalProjects,
      verifiedProjects,
      pendingProjects,
      totalCredits,
      activeCredits,
      retiredCredits,
      totalReports,
      approvedReports,
      totalArea,
    ] = await Promise.all([
      Project.countDocuments(projectQuery),
      Project.countDocuments({ ...projectQuery, status: "verified" }),
      Project.countDocuments({
        ...projectQuery,
        status: { $in: ["pending", "under_review"] },
      }),
      CarbonCredit.aggregate([
        { $match: creditQuery },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      CarbonCredit.aggregate([
        { $match: { ...creditQuery, status: "active" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      CarbonCredit.aggregate([
        { $match: { ...creditQuery, status: "retired" } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      MRVReport.countDocuments(),
      MRVReport.countDocuments({ status: "approved" }),
      Project.aggregate([
        { $match: projectQuery },
        { $group: { _id: null, total: { $sum: "$area" } } },
      ]),
    ]);

    // Get ecosystem distribution
    const ecosystemDistribution = await Project.aggregate([
      { $match: projectQuery },
      {
        $group: {
          _id: "$ecosystemType",
          count: { $sum: 1 },
          totalArea: { $sum: "$area" },
          totalCredits: { $sum: "$carbonCredits" },
        },
      },
    ]);

    // Get recent projects
    const recentProjects = await Project.find(projectQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name status ecosystemType carbonCredits createdAt");

    // Get monthly carbon data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCarbonData = await MRVReport.aggregate([
      {
        $match: {
          status: "approved",
          verifiedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$verifiedAt" },
            month: { $month: "$verifiedAt" },
          },
          totalCarbon: { $sum: "$carbonSequestered" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          verifiedProjects,
          pendingProjects,
          totalCredits: totalCredits[0]?.total || 0,
          activeCredits: activeCredits[0]?.total || 0,
          retiredCredits: retiredCredits[0]?.total || 0,
          totalReports,
          approvedReports,
          totalArea: totalArea[0]?.total || 0,
        },
        ecosystemDistribution,
        recentProjects,
        monthlyCarbonData,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
