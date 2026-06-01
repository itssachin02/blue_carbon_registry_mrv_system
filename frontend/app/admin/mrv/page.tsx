"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader,
  Search,
  Filter,
  AlertTriangle,
  Copy,
  Download,
  MapPin,
  Calendar,
  FileText,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  User,
  Globe,
  Zap,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import MRVVerificationComponent from "@/components/admin/mrv-verification";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

interface MRVItem {
  _id: string;
  type: "measurement" | "report";
  projectId?: string;
  projectName?: string;
  project?: {
    _id: string;
    name: string;
    location: string;
    ecosystemType: string;
    area: number;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  // Measurement fields
  measurementDate?: string;
  areaMonitored?: number;
  growthRate?: number;
  co2AbsorptionRate?: number;
  dataSource?: string;
  calculatedCO2Absorbed?: number;
  carbonCreditsGenerated?: number;
  sensorData?: any;
  satelliteImagery?: any;
  manualData?: any;
  // Report fields
  reportType?: string;
  status: "submitted" | "under-review" | "approved" | "verified" | "rejected" | "calculated";
  methodology?: string;
  carbonSequestered?: number;
  notes?: string;
  ipfsHash?: string;
  fileName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ValidationFlags {
  suspicious: boolean;
  duplicate: boolean;
  incomplete: boolean;
  reasons: string[];
}

export default function AdminMRVPage() {
  const [mrvItems, setMRVItems] = useState<MRVItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MRVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MRVItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai-verify">("ai-verify");
  const [pendingProjectApprovals, setPendingProjectApprovals] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchMRVData();
    fetchAdminStats();
  }, []);

  useEffect(() => {
    filterItems();
  }, [mrvItems, searchTerm, statusFilter, typeFilter]);

  const fetchMRVData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      console.log("🔄 Fetching MRV data from API...");
      console.log("🔑 Token available:", token ? "✓" : "✗");

      // Fetch both measurements and reports
      const [measurementsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/mrv/measurement`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((e) => {
          console.error("❌ Measurements fetch error:", e.message);
          return { ok: false };
        }),
        fetch(`${API_BASE}/mrv`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((e) => {
          console.error("❌ Reports fetch error:", e.message);
          return { ok: false };
        }),
      ]);

      let measurements = [];
      let reports = [];

      if (measurementsRes.ok) {
        measurements = await measurementsRes.json();
        console.log("📦 Measurements loaded:", measurements.length);
      } else {
        console.warn("⚠️ Measurements endpoint returned error");
      }

      if (reportsRes.ok) {
        reports = await reportsRes.json();
        console.log("📦 Reports loaded:", reports.length);
      } else {
        console.warn("⚠️ Reports endpoint returned error");
      }

      // Combine and mark types
      const combinedData: MRVItem[] = [
        ...measurements.map((m: any) => ({ ...m, type: "measurement" as const })),
        ...reports.map((r: any) => ({ ...r, type: "report" as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log("✅ Combined MRV data:", combinedData.length, combinedData);
      setMRVItems(combinedData);
    } catch (error) {
      console.error("❌ Error fetching MRV data:", error);
      toast.error("Failed to load MRV data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingProjectApprovals(data.stats?.pendingProjects || 0);
      } else {
        console.warn("⚠️ Admin stats endpoint returned error");
      }
    } catch (error) {
      console.error("❌ Error fetching admin stats:", error);
    }
  };

  const filterItems = () => {
    let filtered = mrvItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const validateMRVData = (item: MRVItem): ValidationFlags => {
    const flags: ValidationFlags = {
      suspicious: false,
      duplicate: false,
      incomplete: false,
      reasons: [],
    };

    const area = item.areaMonitored || item.project?.area || 0;
    const co2 = item.calculatedCO2Absorbed || item.carbonSequestered || 0;

    // Suspicious data check
    if (co2 > area * 10) {
      flags.suspicious = true;
      flags.reasons.push(`CO₂ (${co2}t) seems too high for area (${area}ha)`);
    }

    // Incomplete data check
    if (!area || !co2) {
      flags.incomplete = true;
      flags.reasons.push("Missing area or CO₂ data");
    }

    // Duplicate check (simplified - check for same project and similar CO2 values)
    const similarItems = mrvItems.filter(
      (other) =>
        other._id !== item._id &&
        other.projectId === item.projectId &&
        Math.abs((other.calculatedCO2Absorbed || other.carbonSequestered || 0) - co2) < 1
    );
    if (similarItems.length > 0) {
      flags.duplicate = true;
      flags.reasons.push("Similar data already exists for this project");
    }

    return flags;
  };

  const handleApprove = async (item: MRVItem) => {
    try {
      setActionLoading(true);
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");

      let response;
      if (item.type === "measurement") {
        response = await fetch(`${API_BASE}/mrv/measurement/${item._id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "verified",
            notes: item.notes || "",
          }),
        });
      } else {
        response = await fetch(`${API_BASE}/mrv/${item._id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "approved", notes: item.notes || "" }),
        });
      }

      if (response.ok) {
        const updatedItem = await response.json();
        setMRVItems(mrvItems.map((i) => (i._id === item._id ? updatedItem : i)));
        setShowDetailDialog(false);
        toast.success("MRV data approved and credits issued!");
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve MRV data");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      if (!rejectionReason.trim()) {
        toast.error("Please enter a rejection reason.");
      }
      return;
    };

    try {
      setActionLoading(true);
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");

      const url =
        selectedItem.type === "measurement"
          ? `${API_BASE}/mrv/measurement/${selectedItem._id}`
          : `${API_BASE}/mrv/${selectedItem._id}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          notes: rejectionReason,
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setMRVItems(mrvItems.map((i) => (i._id === selectedItem._id ? updatedItem : i)));
        setShowDetailDialog(false);
        setShowRejectDialog(false);
        setRejectionReason("");
        toast.success("MRV data rejected");
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Rejection failed response:", response.status, errorData);
        throw new Error(errorData?.error || "Rejection failed");
      }
    } catch (error: any) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject MRV data: " + (error.message || "Unknown error"));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      submitted: "bg-blue-500/10 text-blue-700 border-blue-200",
      "under-review": "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      approved: "bg-green-500/10 text-green-700 border-green-200",
      verified: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      rejected: "bg-red-500/10 text-red-700 border-red-200",
      calculated: "bg-purple-500/10 text-purple-700 border-purple-200",
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.submitted}>
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => (
    <Badge variant="outline" className="text-xs">
      {type === "measurement" ? "📊 Measurement" : "📋 Report"}
    </Badge>
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const totalSubmissions = mrvItems.length;
  const pendingReviewCount =
    mrvItems.filter((item) =>
      ["submitted", "calculating", "calculated", "under-review"].includes(item.status)
    ).length + pendingProjectApprovals;
  const approvedCount = mrvItems.filter((item) =>
    ["approved", "verified"].includes(item.status)
  ).length;
  const rejectedCount = mrvItems.filter((item) => item.status === "rejected").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500" />
              <span>MRV Verification Dashboard</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Review and verify Measurement, Reporting & Verification data
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("ai-verify")}
            className={`px-4 py-3 font-medium border-b-2 transition-all relative ${
              activeTab === "ai-verify"
                ? "text-cyan-400 border-cyan-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>AI Verification</span>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-semibold">
                NEW
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-3 font-medium border-b-2 transition-all relative ${
              activeTab === "dashboard"
                ? "text-blue-400 border-blue-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "ai-verify" ? (
        <MRVVerificationComponent />
      ) : (
        <>
          {/* Existing Dashboard */}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Submissions</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalSubmissions}</p>
              </div>
              <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-yellow-600 truncate">Pending Review</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-900">
                  {pendingReviewCount}
                </p>
              </div>
              <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-yellow-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Approved</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">
                  {approvedCount}
                </p>
              </div>
              <CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-600 truncate">Rejected</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-900">
                  {rejectedCount}
                </p>
              </div>
              <XCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by project name or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="measurement">Measurements</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="space-y-4 text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-muted-foreground">Loading MRV data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* MRV Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                MRV Submissions ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full px-6 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Project</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Owner</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Location</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Area (ha)</TableHead>
                        <TableHead className="text-xs sm:text-sm">CO₂ (t)</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                          No MRV data found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedItems.map((item) => {
                        const validation = validateMRVData(item);
                        return (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div>
                                <p className="font-semibold truncate">{item.projectName || item.project?.name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground capitalize hidden sm:block">
                                  {item.project?.ecosystemType || "Unknown"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              <div className="flex items-center gap-1 flex-col sm:flex-row">
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-xs sm:text-sm">{item.user?.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground hidden sm:block truncate">{item.user?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{item.project?.location || "N/A"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden lg:table-cell font-medium">
                              {item.areaMonitored || item.project?.area || "N/A"}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <span className="font-semibold text-green-600">
                                  {item.calculatedCO2Absorbed || item.carbonSequestered || 0}
                                </span>
                                {(validation.suspicious || validation.duplicate || validation.incomplete) && (
                                  <span title={validation.reasons.join(", ")} className="flex-shrink-0">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs">
                                  {item.measurementDate
                                    ? new Date(item.measurementDate).toLocaleDateString()
                                    : new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                <span className="hidden sm:inline">Review</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              MRV Data Review
            </DialogTitle>
            <DialogDescription>
              Verify the Measurement, Reporting & Verification data before issuing carbon credits
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Validation Flags */}
              {(() => {
                const validation = validateMRVData(selectedItem);
                return (validation.suspicious || validation.duplicate || validation.incomplete) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-900">Validation Issues Detected</p>
                        <ul className="text-sm text-orange-800 mt-2 space-y-1">
                          {validation.reasons.map((reason, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Project Info */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Project Name</p>
                      <p className="font-semibold">{selectedItem.projectName || selectedItem.project?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project Owner</p>
                      <p className="font-semibold">{selectedItem.user?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{selectedItem.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ecosystem Type</p>
                      <p className="font-semibold capitalize">{selectedItem.project?.ecosystemType || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{selectedItem.project?.location || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Area</p>
                      <p className="font-semibold">{selectedItem.project?.area || selectedItem.areaMonitored || "N/A"} hectares</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submission Date</p>
                      <p className="font-semibold">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MRV Data */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  MRV Data & Calculations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {selectedItem.type === "measurement" && (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Measurement Date</p>
                          <p className="font-semibold">
                            {selectedItem.measurementDate
                              ? new Date(selectedItem.measurementDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Data Source</p>
                          <p className="font-semibold capitalize">{selectedItem.dataSource || "N/A"}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Growth Rate</p>
                          <p className="font-semibold">{selectedItem.growthRate || 0}% per year</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">CO₂ Absorption Rate</p>
                          <p className="font-semibold">{selectedItem.co2AbsorptionRate || 0} tCO₂/ha/year</p>
                        </div>
                      </>
                    )}

                    {selectedItem.type === "report" && (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Report Type</p>
                          <p className="font-semibold capitalize">{selectedItem.reportType || "N/A"}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Methodology</p>
                          <p className="font-semibold">{selectedItem.methodology || "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">CO₂ Captured</p>
                      <p className="text-3xl font-bold text-green-600">
                        {selectedItem.calculatedCO2Absorbed || selectedItem.carbonSequestered || 0} tCO₂e
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Carbon credits to be issued: {Math.floor(selectedItem.calculatedCO2Absorbed || selectedItem.carbonSequestered || 0)}
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-2">{getStatusBadge(selectedItem.status)}</div>
                    </div>

                    {selectedItem.notes && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm mt-1">{selectedItem.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Evidence/Proof Section */}
              {(selectedItem.manualData?.verificationPhotos?.length > 0 ||
                selectedItem.satelliteImagery ||
                selectedItem.ipfsHash) && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Evidence & Supporting Data
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedItem.manualData?.verificationPhotos?.map((photo: string, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Verification Photo {index + 1}</span>
                        </div>
                        <img
                          src={photo}
                          alt={`Verification ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      </div>
                    ))}

                    {selectedItem.satelliteImagery && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Satellite Imagery</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><strong>Source:</strong> {selectedItem.satelliteImagery.source || "N/A"}</p>
                          <p><strong>Resolution:</strong> {selectedItem.satelliteImagery.resolution || "N/A"}</p>
                          <p><strong>Capture Date:</strong> {selectedItem.satelliteImagery.captureDate
                            ? new Date(selectedItem.satelliteImagery.captureDate).toLocaleDateString()
                            : "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.ipfsHash && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">IPFS Document</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded border flex-1">
                            {selectedItem.ipfsHash}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(selectedItem.ipfsHash!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {(selectedItem.status === "submitted" ||
                selectedItem.status === "calculated" ||
                selectedItem.status === "under-review") && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
                    onClick={() => handleApprove(selectedItem)}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {actionLoading ? "Processing..." : "Approve & Issue Credits"}
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-red-500 hover:bg-red-600"
                    onClick={() => {
                      setRejectionReason("");
                      setShowRejectDialog(true);
                    }}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}

              {(selectedItem.status === "approved" || selectedItem.status === "verified") && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Approved & Credits Issued</p>
                      <p className="text-sm text-green-800">
                        Carbon credits have been issued to the project owner
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Rejected</p>
                      <p className="text-sm text-red-800">
                        This submission has been rejected. The owner has been notified.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject MRV Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this MRV submission. This will be sent to the project owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <textarea
                className="w-full mt-2 p-3 border rounded-md resize-none"
                rows={4}
                placeholder="Please explain why this submission is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1"
              >
                {actionLoading ? "Rejecting..." : "Reject Submission"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}