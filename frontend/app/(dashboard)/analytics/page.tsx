"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Leaf,
  Globe,
  Activity,
  Target,
} from "lucide-react";
import type { Project } from "@/lib/types";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("year");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from live data
  const totalCredits = projects.reduce((sum, p) => sum + p.carbonCredits, 0);
  const totalArea = projects.reduce((sum, p) => sum + (p.area || 0), 0);
  const avgCreditPrice = 28.5;
  const activeProjects = projects.filter((p) => p.status === "verified").length;
  const verifiedCredits = projects
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.carbonCredits, 0);

  // Group by ecosystem type
  const ecosystemData = projects.reduce(
    (acc: any, p) => {
      const existing = acc.find((e: any) => e.name === p.ecosystemType);
      if (existing) {
        existing.credits += p.carbonCredits;
        existing.projects += 1;
        existing.area += p.area || 0;
      } else {
        acc.push({
          name: p.ecosystemType,
          credits: p.carbonCredits,
          projects: 1,
          area: p.area || 0,
        });
      }
      return acc;
    },
    []
  );

  // Mock monthly data for trend
  const monthlyVerifications = [
    { month: "Jan", verifications: 1, credits: 45000 },
    { month: "Feb", verifications: 0, credits: 0 },
    { month: "Mar", verifications: 1, credits: 52000 },
    { month: "Apr", verifications: 0, credits: 0 },
    { month: "May", verifications: 1, credits: 64000 },
    { month: "Jun", verifications: 0, credits: 0 },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Analytics & Reports"
        description="Comprehensive insights into your blue carbon portfolio"
      />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-secondary">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Carbon Credits</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {totalCredits.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Live Data</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Protected Area</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {totalArea.toLocaleString()} ha
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Live Data</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {activeProjects}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Verified</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    ₹{(totalCredits * avgCreditPrice / 1000000).toFixed(2)}M
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Calculated</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ecosystem Breakdown */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Carbon Credits by Ecosystem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : ecosystemData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="space-y-4">
                  {ecosystemData.map((ecosystem: any) => (
                    <div key={ecosystem.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {ecosystem.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {ecosystem.credits.toLocaleString()} tCO2e
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              (ecosystem.credits / totalCredits) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Verifications */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Monthly Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyVerifications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f9fafb",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="verifications"
                      fill="#2dd4bf"
                      name="Verifications"
                    />
                    <Bar
                      dataKey="credits"
                      fill="#38bdf8"
                      name="Credits"
                      yAxisId="right"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ecosystem Breakdown Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Ecosystem Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Ecosystem
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Projects
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Total Area (ha)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Carbon Credits
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      % of Portfolio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ecosystemData.map((ecosystem) => (
                    <tr
                      key={ecosystem.name}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <span className="font-medium text-foreground">
                            {ecosystem.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        {ecosystem.projects}
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        {ecosystem.area.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-primary">
                          {ecosystem.credits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${(ecosystem.credits / totalCredits) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {((ecosystem.credits / totalCredits) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
