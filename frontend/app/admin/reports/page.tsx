"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader, BarChart3, Download, Calendar } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

interface ReportStats {
  totalProjects: number;
  approvedProjects: number;
  pendingProjects: number;
  rejectedProjects: number;
  totalCO2: number;
  totalUsers: number;
  activeCredits: number;
  retiredCredits: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      // Fetch projects
      const projectsRes = await fetch(`${API_BASE}/admin/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      // Fetch users
      const usersRes = await fetch(`${API_BASE}/auth/users`);
      
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
      const usersData = usersRes.ok ? await usersRes.json() : [];
      
      const projects = projectsData.projects || projectsData || [];
      const users = Array.isArray(usersData) ? usersData : [];
      
      const totalProjects = projects.length;
      const approvedProjects = projects.filter((p: any) => p.approvalStatus === "approved").length;
      const pendingProjects = projects.filter((p: any) => p.approvalStatus === "pending").length;
      const rejectedProjects = projects.filter((p: any) => p.approvalStatus === "rejected").length;
      const totalCO2 = projects.reduce((sum: number, p: any) => sum + (p.carbonCapture || 0), 0);
      const totalUsers = users.length;
      const activeCredits = projects.reduce((sum: number, p: any) => sum + (p.carbonCredits || 0), 0);
      const retiredCredits = 0;
      
      setStats({
        totalProjects,
        approvedProjects,
        pendingProjects,
        rejectedProjects,
        totalCO2,
        totalUsers,
        activeCredits,
        retiredCredits,
      });
    } catch (error) {
      console.error("Error fetching report stats:", error);
      // Set default stats
      setStats({
        totalProjects: 0,
        approvedProjects: 0,
        pendingProjects: 0,
        rejectedProjects: 0,
        totalCO2: 0,
        totalUsers: 0,
        activeCredits: 0,
        retiredCredits: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/admin/reports/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Export report failed:", response.status, errorText);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            System analytics and performance metrics
          </p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : stats ? (
        <>
          {/* Project Statistics */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Project Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold mt-1">{stats.totalProjects}</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 border">
                      All
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedProjects}</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20 border">
                      ✓
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingProjects}</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 border">
                      ⏳
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedProjects}</p>
                    </div>
                    <Badge className="bg-red-500/10 text-red-700 border-red-500/20 border">
                      ✗
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Carbon Credits Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-sm">Total CO₂ Captured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{stats.totalCO2.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">tonnes CO₂e</p>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">registered on platform</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-sm">Credits Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">{stats.activeCredits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">total issued</p>
              </CardContent>
            </Card>
          </div>

        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Unable to load report data. Please try again.</p>
            <Button onClick={fetchReportStats} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
