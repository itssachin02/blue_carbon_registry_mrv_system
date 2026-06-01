"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FolderKanban,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Lock,
  Loader,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingApprovals: 0,
    creditsIssued: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    // Fetch immediately on component mount
    const loadData = async () => {
      await fetchDashboardData();
    };

    loadData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      if (!token) {
        console.error("❌ No admin token found in localStorage");
        setLoading(false);
        return;
      }

      // Fetch projects from admin API
      let projectsData = [];
      try {
        const projectsRes = await fetch(`${API_BASE}/admin/projects`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          projectsData = Array.isArray(data) ? data : (data.projects || []);
          console.log("✅ Projects loaded:", projectsData.length);
        } else {
          console.error("❌ Projects API error:", projectsRes.status);
        }
      } catch (err) {
        console.error("❌ Projects fetch error:", err);
      }

      // Fetch users
      let usersData = [];
      try {
        const usersRes = await fetch(`${API_BASE}/auth/users`);
        if (usersRes.ok) {
          usersData = await usersRes.json();
          console.log("✅ Users loaded:", usersData.length);
        } else {
          console.error("❌ Users API error:", usersRes.status);
        }
      } catch (err) {
        console.error("❌ Users fetch error:", err);
      }

      // Calculate stats from REAL data
      const total = projectsData.length;
      const pending = projectsData.filter((p: any) => p.approvalStatus === "pending").length;
      const credits = projectsData.reduce((sum: number, p: any) => sum + (p.carbonCredits || 0), 0);
      const devCount = usersData.filter((u: any) => u.role === "developer").length;

      console.log("📊 Dashboard Stats:", { total, pending, credits, devCount });

      setStats({
        totalProjects: total,
        pendingApprovals: pending,
        creditsIssued: credits,
        activeUsers: devCount,
      });

      setProjects(projectsData);
      setUsers(usersData);
      await fetchAnalysisData(token);
    } catch (error) {
      console.error("❌ Critical error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async (token?: string) => {
    if (!token) return;
    try {
      setAnalysisLoading(true);
      const response = await fetch(`${API_BASE}/admin/analysis`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        console.error("❌ Analysis API error:", response.status);
      }
    } catch (error) {
      console.error("❌ Analysis fetch error:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const statusData = [
    {
      name: "Approved",
      value: projects.filter((p: any) => p.approvalStatus === "approved").length,
      color: "#10b981"
    },
    {
      name: "Pending",
      value: projects.filter((p: any) => p.approvalStatus === "pending").length,
      color: "#f59e0b"
    },
    {
      name: "Rejected",
      value: projects.filter((p: any) => p.approvalStatus === "rejected").length,
      color: "#ef4444"
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-6 sm:h-8 w-6 sm:w-8 text-red-500" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            System overview and management controls
          </p>
        </div>
        <div className="w-full sm:w-auto" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Projects */}
            <Card className="bg-card border-border hover:border-blue-500/50 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Projects</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 sm:mt-2">
                      {stats.totalProjects}
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 ml-3">
                    <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="bg-card border-border hover:border-yellow-500/50 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Approvals</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-500 mt-1 sm:mt-2">
                      {stats.pendingApprovals}
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 ml-3">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credits Issued - Enhanced Responsive Design */}
            <Card className="bg-card border-border hover:border-green-500/50 transition-colors relative overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Carbon Credits</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-500 mt-1 sm:mt-2">
                      {stats.creditsIssued.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      Credits Issued
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 ml-3">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Active Credits</span>
                    <span>{stats.creditsIssued.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="bg-card border-border hover:border-purple-500/50 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Active Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-500 mt-1 sm:mt-2">
                      {stats.activeUsers}
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 ml-3">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Project Status Distribution */}
            <Card className="bg-card border-border lg:col-span-3">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing & Algorithm Analysis */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Processing & Algorithm Analysis
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  The system analyzes project submissions using rule-based and statistical algorithms, then validates which records are anchored on blockchain.
                </p>
              </div>
              <div className="rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground">
                {analysisLoading ? "Updating analysis..." : "Data processing complete"}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="bg-card border-border">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid gap-3">
                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Blockchain Coverage
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {analysis ? `${analysis.summary.blockchainCoveragePercent}%` : "--"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {analysis ? `${analysis.summary.projectsOnBlockchain}/${analysis.summary.totalProjects} projects anchored` : "Loading..."}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Anomaly Detection
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {analysis ? analysis.summary.anomalyCount : "--"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Projects flagged by credits/area deviation
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Avg Credit Density
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {analysis ? `${analysis.summary.averageCreditDensity} t/ha` : "--"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Carbon credits per hectare across projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Algorithms Used</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">1. Credit Efficiency</p>
                    <p>
                      Compares project carbon credits against expected ecosystem absorption rates per hectare.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">2. Outlier Detection</p>
                    <p>
                      Identifies abnormal credit density values using statistical deviation from average project density.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">3. Blockchain Coverage</p>
                    <p>
                      Verifies which approved projects are recorded on blockchain for immutable transparency.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Review Focus</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {analysis ? (
                    analysis.riskProjects.length ? (
                      <div className="space-y-3">
                        {analysis.riskProjects.map((project: any) => (
                          <div key={project.id} className="rounded-xl bg-slate-950 p-4">
                            <p className="font-semibold text-foreground">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Score: {project.reviewScore} • {project.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No high-risk projects found.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading risk analysis…</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <Link href="/admin/projects" className="block">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
                    Verify Projects
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Review and approve new projects
                  </p>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <Link href="/admin/mrv" className="block">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
                    MRV Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Verify measurements and issue credits
                  </p>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <Link href="/admin/credits" className="block">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Carbon Credits
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Monitor credit issuance and trading
                  </p>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
