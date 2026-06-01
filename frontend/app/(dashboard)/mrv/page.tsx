"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { MeasurementForm } from "@/components/mrv/measurement-form";
import { MeasurementTable } from "@/components/mrv/measurement-table";
import { MRVReportTable } from "@/components/mrv/mrv-report-table";
import { FileUpload } from "@/components/mrv/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Leaf,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MRVReport } from "@/lib/types";

interface MeasurementData {
  _id: string;
  projectName: string;
  measurementDate: string;
  areaMonitored: number;
  growthRate: number;
  co2AbsorptionRate: number;
  dataSource: string;
  calculatedCO2Absorbed: number;
  carbonCreditsGenerated: number;
  status: "submitted" | "calculated" | "verified" | "rejected";
}

export default function MRVPage() {
  const [activeTab, setActiveTab] = useState("measurements");
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [reports, setReports] = useState<MRVReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [measurementsLoading, setMeasurementsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchMeasurements(), fetchReports()]);
  };

  const fetchMeasurements = async () => {
    try {
      setMeasurementsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mrv/measurement?userId=${user.id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMeasurements(data);
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
    } finally {
      setMeasurementsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mrv?userId=${user.id}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const measurementStats = {
    total: measurements.length,
    verified: measurements.filter((m) => m.status === "verified").length,
    calculating: measurements.filter((m) => m.status === "calculated").length,
    totalCO2: measurements.reduce((sum, m) => sum + (m.calculatedCO2Absorbed || 0), 0),
    totalCredits: measurements.reduce((sum, m) => sum + (m.carbonCreditsGenerated || 0), 0),
  };

  const reportStats = {
    total: reports.length,
    approved: reports.filter((r) => r.status === "approved").length,
    pending: reports.filter(
      (r) => r.status === "submitted" || r.status === "under-review"
    ).length,
    totalCarbon: reports.reduce((sum, r) => sum + (r.carbonSequestered || 0), 0),
  };

  return (
    <div className="min-h-screen">
      <Header
        title="MRV System (Measurement, Reporting & Verification)"
        description="Monitor environmental data, generate verified reports, and track carbon credits"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Measurements</p>
                  <p className="text-2xl font-bold text-foreground">
                    {measurementStats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-500">
                    {measurementStats.verified}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                  <TrendingUp className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total CO₂ (tCO₂e)
                  </p>
                  <p className="text-2xl font-bold text-teal-500">
                    {measurementStats.totalCO2.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Leaf className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carbon Credits</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {measurementStats.totalCredits.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MRV Multi-Step Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-secondary/50 rounded-lg p-1">
            <TabsList className="bg-transparent grid grid-cols-4 gap-1">
              <TabsTrigger value="measurements" className="gap-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">📊</span>
                <span>Measurement</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline">
                  {measurementStats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">📄</span>
                <span>Reports</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline">
                  {reportStats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="verification" className="gap-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">✔️</span>
                <span>Verification</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline">
                  {reportStats.pending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="credits" className="gap-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">💳</span>
                <span>Credits</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline">
                  {measurementStats.totalCredits}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 📊 Tab 1: MEASUREMENT (Data Collection) */}
          <TabsContent value="measurements" className="mt-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  🌍 Step 1: Collect Measurement Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Record CO₂ absorption, growth rates, and environmental data. System calculates carbon credits automatically.
                </p>
              </div>
              <MeasurementForm onSuccess={fetchData} />
            </div>

            {/* Measurement Statistics Card */}
            {measurements.length > 0 && (
              <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg CO₂/Measurement</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(measurementStats.totalCO2 / measurementStats.total).toFixed(2)} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Credits/Measurement</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {Math.round(measurementStats.totalCredits / measurementStats.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Efficiency</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {measurementStats.verified > 0 
                          ? ((measurementStats.verified / measurementStats.total) * 100).toFixed(0) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Measurements Table */}
            <MeasurementTable
              measurements={measurements}
              loading={measurementsLoading}
              onRefresh={fetchMeasurements}
            />
          </TabsContent>

          {/* 📄 Tab 2: REPORTING (Data Reporting) */}
          <TabsContent value="reports" className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                📄 Step 2: Generate & Submit Reports
              </h3>
              <p className="text-sm text-muted-foreground">
                Reports are auto-generated from verified measurements. Submit for third-party verification.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FileUpload
                onUpload={(data) => {
                  console.log("Upload data:", data);
                  fetchData();
                }}
              />

              {/* Guidelines Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Reporting Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Baseline Report
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Initial project conditions before intervention
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Monitoring Reports
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Regular updates on carbon sequestration
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Verification Report
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Third-party validation & approval
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports Table */}
            {loading ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading reports...</p>
                </CardContent>
              </Card>
            ) : reports.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <FileBarChart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No reports yet. Upload your first report!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <MRVReportTable
                reports={reports}
                onView={(report) => console.log("View report:", report)}
                onApprove={(report) => console.log("Approve report:", report)}
                onReject={(report) => console.log("Reject report:", report)}
              />
            )}
          </TabsContent>

          {/* ✔️ Tab 3: VERIFICATION (Data Verification) */}
          <TabsContent value="verification" className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                ✔️ Step 3: Third-Party Verification
              </h3>
              <p className="text-sm text-muted-foreground">
                Reports are reviewed and verified by approved auditors. Once verified, carbon credits are locked on blockchain.
              </p>
            </div>

            {/* Verification Status Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Reports</p>
                      <p className="text-2xl font-bold text-green-500">
                        {reportStats.approved}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Under Review</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {reportStats.pending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verified CO₂</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {reportStats.totalCarbon.toFixed(2)} t
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Verification Message */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-base">Verification Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Once your report is verified by admin authorities:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Carbon credits are locked on blockchain</li>
                  <li>Credits can be traded on the marketplace</li>
                  <li>Ownership is tracked on distributed ledger</li>
                  <li>Transaction history is immutable & transparent</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 💳 Tab 4: CARBON CREDITS */}
          <TabsContent value="credits" className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                💳 Step 4: Carbon Credits Generated
              </h3>
              <p className="text-sm text-muted-foreground">
                Track and manage verified carbon credits. 1 credit = 1 tonne CO₂e sequestered.
              </p>
            </div>

            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Generated</p>
                    <p className="text-4xl font-bold text-amber-600">
                      {measurementStats.totalCredits.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">credits</p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="text-sm text-muted-foreground mb-2">From Verified Data</p>
                    <p className="text-4xl font-bold text-green-600">
                      {measurements
                        .filter((m) => m.status === "verified")
                        .reduce((sum, m) => sum + m.carbonCreditsGenerated, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">locked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Available to Trade</p>
                    <p className="text-4xl font-bold text-teal-600">
                      {(
                        measurementStats.totalCredits -
                        measurements
                          .filter((m) => m.status === "verified")
                          .reduce((sum, m) => sum + m.carbonCreditsGenerated, 0)
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Credit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Credit Value</p>
                    <p className="text-lg text-amber-600">1 = 1 tonne CO₂e</p>
                    <p className="text-xs text-muted-foreground mt-2">One credit represents one tonne of verified carbon dioxide equivalent sequestered.</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Blockchain Storage</p>
                    <p className="text-lg text-blue-600">Polygon Network</p>
                    <p className="text-xs text-muted-foreground mt-2">Credits are stored immutably on blockchain for transparent ownership tracking.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
