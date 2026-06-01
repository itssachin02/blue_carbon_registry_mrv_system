"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card as ProcessCard,
  CardContent as ProcessCardContent,
} from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader,
  Zap,
  TrendingUp,
  AlertTriangle,
  Brain,
  Beaker,
  BarChart3,
  CheckCheck,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : "http://localhost:5000/api";

interface VerificationStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  icon: React.ReactNode;
}

export default function MRVVerificationComponent({ onVerificationComplete }: { onVerificationComplete?: (data: any) => void }) {
  const [formData, setFormData] = useState({
    location: "",
    ecosystemType: "mangrove",
    area: "",
    biomass: "",
    reportedCarbon: "",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [acceptingData, setAcceptingData] = useState(false);
  const [verifiedRecords, setVerifiedRecords] = useState<any[]>([]);
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: "validate",
      label: "Validate Input Data",
      status: "pending",
      icon: <Beaker className="w-4 h-4" />,
    },
    {
      id: "calculate",
      label: "Calculate Expected Carbon",
      status: "pending",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "ml-analysis",
      label: "ML Analysis & Regression",
      status: "pending",
      icon: <Brain className="w-4 h-4" />,
    },
    {
      id: "ecosystem",
      label: "Ecosystem-Specific Validation",
      status: "pending",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "decision",
      label: "Generate Decision",
      status: "pending",
      icon: <CheckCheck className="w-4 h-4" />,
    },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setDocumentFile(file);
    } else {
      setDocumentFile(null);
    }
  };

  const removeDocumentFile = () => {
    setDocumentFile(null);
  };

  const updateStepStatus = (
    stepId: string,
    status: "pending" | "processing" | "completed" | "error"
  ) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleVerify = async () => {
    const hasDocument = !!documentFile;
    if (!formData.location.trim() && !hasDocument) {
      toast.error("Please enter location or upload a document");
      return;
    }
    if (!hasDocument) {
      if (!formData.area || parseFloat(formData.area) <= 0) {
        toast.error("Please enter area (hectares)");
        return;
      }
      if (!formData.biomass || parseFloat(formData.biomass) <= 0) {
        toast.error("Please enter biomass (tons/ha)");
        return;
      }
      if (formData.reportedCarbon === "" || parseFloat(formData.reportedCarbon) < 0) {
        toast.error("Please enter reported carbon (tons)");
        return;
      }
    }

    setProcessing(true);
    setResult(null);
    // Reset steps
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );

    try {
      // Simulate step processing
      const stepDelay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Step 1: Validate
      updateStepStatus("validate", "processing");
      await stepDelay(800);
      updateStepStatus("validate", "completed");

      // Step 2: Calculate
      updateStepStatus("calculate", "processing");
      await stepDelay(1000);
      updateStepStatus("calculate", "completed");

      // Step 3: ML Analysis
      updateStepStatus("ml-analysis", "processing");
      await stepDelay(1200);
      updateStepStatus("ml-analysis", "completed");

      // Step 4: Ecosystem
      updateStepStatus("ecosystem", "processing");
      await stepDelay(800);
      updateStepStatus("ecosystem", "completed");

      // Step 5: Decision
      updateStepStatus("decision", "processing");

      // Make API call
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const hasDocument = !!documentFile;
      const requestHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      let body: BodyInit;

      if (hasDocument) {
        const formPayload = new FormData();
        formPayload.append("location", formData.location);
        formPayload.append("ecosystemType", formData.ecosystemType);
        formPayload.append("area", formData.area);
        formPayload.append("biomass", formData.biomass);
        formPayload.append("reportedCarbon", formData.reportedCarbon);
        formPayload.append("document", documentFile as Blob);
        body = formPayload;
      } else {
        requestHeaders["Content-Type"] = "application/json";
        body = JSON.stringify({
          location: formData.location,
          ecosystemType: formData.ecosystemType,
          area: parseFloat(formData.area),
          biomass: parseFloat(formData.biomass),
          reportedCarbon: parseFloat(formData.reportedCarbon),
        });
      }

      const response = await fetch(`${API_BASE}/mrv/verify-data`, {
        method: "POST",
        headers: requestHeaders,
        body,
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText };
      }

      if (!response.ok) {
        const message = data?.error || data?.message || response.statusText || "Verification failed";
        throw new Error(message);
      }

      updateStepStatus("decision", "completed");
      setResult(data);

      // Show success toast
      if (data.status === "Verified") {
        toast.success(`✅ Data Verified! Confidence Score: ${data.confidenceScore}%`);
      } else if (data.status === "Suspicious") {
        toast.warning(`⚠️ Data is Suspicious - Review Required`);
      } else {
        toast.error(`❌ Data Rejected - ${data.reason.substring(0, 50)}...`);
      }
    } catch (error: any) {
      updateStepStatus("decision", "error");
      console.error("Verification error:", error);
      toast.error("Verification failed: " + (error.message || "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFormData({
      location: "",
      ecosystemType: "mangrove",
      area: "",
      biomass: "",
      reportedCarbon: "",
    });
    setDocumentFile(null);
    setResult(null);
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );
  };

  const handleExportSummary = () => {
    if (!result) return;

    const summary = `
=== MRV VERIFICATION REPORT ===
Generated: ${new Date().toLocaleString()}

PROJECT DETAILS
Location: ${formData.location}
Ecosystem Type: ${formData.ecosystemType}
Area: ${formData.area} hectares
Biomass: ${formData.biomass} tons/hectare

VERIFICATION RESULTS
Status: ${result.status}
Data Validity: ${result.status === 'Verified' ? '✓ Valid' : result.status === 'Suspicious' ? '⚠ Needs Review' : '✗ Invalid'}

ACCURACY & EFFICIENCY
Accuracy Score: ${result.differencePercentage !== undefined && result.differencePercentage !== null ? `${(100 - result.differencePercentage).toFixed(1)}%` : "—"}
AI Confidence: ${result.confidenceScore !== undefined && result.confidenceScore !== null ? `${result.confidenceScore}%` : "—"}

CARBON METRICS
Reported Carbon: ${result.reportedCarbon?.toFixed(2)} tons
Expected Carbon: ${result.expectedCarbon?.toFixed(2)} tons
Difference: ${result.differencePercentage?.toFixed(2)}%

SUMMARY MESSAGE
${result.reason}

VERIFICATION METHOD
${result.metadata?.verificationMethod}
Verified At: ${new Date(result.metadata?.verifiedAt).toLocaleString()}

=============================
`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(summary));
    element.setAttribute('download', `MRV-Verification-${formData.location}-${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("✅ Report downloaded successfully!");
  };

  const handleAccept = async () => {
    if (!result) return;

    try {
      setAcceptingData(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      // Create MRV report
      const response = await fetch(`${API_BASE}/mrv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName: formData.location,
          reportType: "verification",
          methodology: "AI-MRV Verification Service v1.0",
          carbonSequestered: result.reportedCarbon,
          notes: result.reason,
          status: "approved",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create MRV report");
      }

      const mrvReport = await response.json();

      // Add to verified records
      const newRecord = {
        id: mrvReport._id || Date.now(),
        location: formData.location,
        ecosystemType: formData.ecosystemType,
        area: parseFloat(formData.area),
        biomass: parseFloat(formData.biomass),
        reportedCarbon: result.reportedCarbon,
        expectedCarbon: result.expectedCarbon,
        differencePercentage: result.differencePercentage,
        status: result.status,
        confidenceScore: result.confidenceScore,
        createdAt: new Date().toLocaleString(),
        mrvReportId: mrvReport._id,
      };

      setVerifiedRecords((prev) => [newRecord, ...prev]);
      toast.success(`✅ Data Accepted & MRV Report Created!`);

      // Reset form
      handleReset();

      if (onVerificationComplete) {
        onVerificationComplete(newRecord);
      }
    } catch (error: any) {
      console.error("Error accepting verification:", error);
      toast.error("Failed to accept verification: " + error.message);
    } finally {
      setAcceptingData(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/50";
      case "Suspicious":
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/50";
      case "Rejected":
        return "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Verified":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "Suspicious":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">
            AI-Powered MRV Verification
          </h2>
        </div>
        <p className="text-slate-400">
          Verify blue carbon ecosystem data using machine learning & scientific validation
        </p>
      </div>

      {/* Main Grid */}
      <div className={`grid gap-6 ${result ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Input Form */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beaker className="w-5 h-5 text-cyan-400" />
                Data Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Location *
                </label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Southeast Asia, Coastal Area"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={processing}
                />
              </div>

              {/* Ecosystem Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Ecosystem Type *
                </label>
                <Select
                  value={formData.ecosystemType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, ecosystemType: value }))
                  }
                  disabled={processing}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="mangrove">🌿 Mangrove</SelectItem>
                    <SelectItem value="seagrass">🌊 Seagrass</SelectItem>
                    <SelectItem value="saltmarsh">🏜️ Saltmarsh</SelectItem>
                    <SelectItem value="kelp">🐚 Kelp</SelectItem>
                    <SelectItem value="other">📍 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Area (hectares) *
                </label>
                <Input
                  name="area"
                  type="number"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  step="0.01"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={processing}
                />
              </div>

              {/* Biomass */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Biomass (tons/hectare) *
                </label>
                <Input
                  name="biomass"
                  type="number"
                  value={formData.biomass}
                  onChange={handleInputChange}
                  placeholder="e.g., 150"
                  step="0.01"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={processing}
                />
              </div>

              {/* Reported Carbon */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Reported Carbon (tons) *
                </label>
                <Input
                  name="reportedCarbon"
                  type="number"
                  value={formData.reportedCarbon}
                  onChange={handleInputChange}
                  placeholder="e.g., 35000"
                  step="0.01"
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={processing}
                />
              </div>

              {/* Upload Document / Dataset */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Upload Document / Dataset
                </label>
                <input
                  type="file"
                  accept=".txt,.csv,.xlsx,.xls,.docx"
                  onChange={handleDocumentChange}
                  disabled={processing}
                  className="w-full text-sm text-slate-200 file:bg-slate-800 file:border-slate-700 file:text-white file:p-2 file:rounded-md"
                />
                {documentFile && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-slate-200">
                    <span className="truncate">{documentFile.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeDocumentFile}
                      disabled={processing}
                      className="border-slate-700 text-slate-200 hover:bg-slate-900"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Optional: upload a dataset or document and the AI will attempt to read values from it.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleVerify}
                  disabled={processing}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Verify Data
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={processing}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Steps & Results */}
        <div className={`space-y-6 ${result ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* Processing Steps */}
          {(processing || result) && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Verification Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex-shrink-0">
                        {step.status === "completed" ? (
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          </div>
                        ) : step.status === "processing" ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 animate-pulse">
                            <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                          </div>
                        ) : step.status === "error" ? (
                          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                            <XCircle className="w-4 h-4 text-red-400" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600/50">
                            <Clock className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <p
                          className={`text-sm font-medium ${
                            step.status === "completed"
                              ? "text-green-400"
                              : step.status === "processing"
                              ? "text-cyan-400"
                              : step.status === "error"
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>

                      <div className="text-slate-500">
                        {step.status === "processing" && (
                          <span className="text-xs">Analyzing...</span>
                        )}
                        {step.status === "completed" && (
                          <span className="text-xs text-green-400">Done</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-400" />
                    Verification Result
                  </CardTitle>
                  <Badge
                    className={`px-3 py-1 rounded-full border font-semibold flex items-center gap-2 ${getStatusBadgeStyle(
                      result.status
                    )}`}
                  >
                    {getStatusIcon(result.status)}
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Message */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-sm text-slate-300">{result.reason}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Reported Carbon */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Reported Carbon</p>
                    <p className="text-2xl font-bold text-white">
                      {result.reportedCarbon?.toFixed(2) || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">tons</p>
                  </div>

                  {/* Expected Carbon */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Expected Carbon</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {result.expectedCarbon?.toFixed(2) || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">tons</p>
                  </div>

                  {/* Difference */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Difference</p>
                    <p
                      className={`text-2xl font-bold ${
                        result.differencePercentage > result.toleranceThreshold
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {result.differencePercentage?.toFixed(2) || "—"}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Threshold: {result.toleranceThreshold}%
                    </p>
                  </div>

                  {/* Confidence Score */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {result.confidenceScore || "—"}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">AI Score</p>
                  </div>

                  {/* Carbon per Hectare */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Carbon/Hectare</p>
                    <p className="text-2xl font-bold text-teal-400">
                      {result.carbonPerHectare?.toFixed(2) || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">tons/ha</p>
                  </div>

                  {/* Ecosystem Type */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Ecosystem Range</p>
                    <p className="text-lg font-bold text-white">
                      {result.ecosystemReference?.minRange || "—"}
                      {" - "}
                      {result.ecosystemReference?.maxRange || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">tons/ha</p>
                  </div>
                </div>

                {/* Comprehensive Summary Section */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Overall Summary Card */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-2 border-slate-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        Verification Summary
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.status === 'Verified' ? 'bg-green-500/20 text-green-300' : result.status === 'Suspicious' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                        {result.status}
                      </span>
                    </div>

                    {/* Summary Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* Validity */}
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                        <p className="text-xs text-slate-400 mb-2">Data Validity</p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {result.status === 'Verified' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : result.status === 'Suspicious' ? (
                            <AlertCircle className="w-6 h-6 text-yellow-400" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-white">
                          {result.status === 'Verified' ? '✓ Valid' : result.status === 'Suspicious' ? '⚠ Needs Review' : '✗ Invalid'}
                        </p>
                      </div>

                      {/* Accuracy Score */}
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                        <p className="text-xs text-slate-400 mb-2">Accuracy Score</p>
                        <div className="mb-2">
                          <p className="text-3xl font-bold text-blue-400">{(100 - (result.differencePercentage || 0)).toFixed(1)}%</p>
                        </div>
                        <p className="text-xs text-slate-500">Reported vs Expected</p>
                      </div>

                      {/* Confidence Level */}
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 text-center">
                        <p className="text-xs text-slate-400 mb-2">AI Confidence</p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{result.confidenceScore}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">Trust Level</p>
                      </div>
                    </div>

                    {/* Efficiency Metrics */}
                    <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                      <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Efficiency Metrics
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Carbon Sequestration Efficiency</p>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${result.differencePercentage < 10 ? 'bg-green-500' : result.differencePercentage < 20 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                              style={{ width: `${Math.min(100, 100 - (result.differencePercentage || 0))}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{(100 - (result.differencePercentage || 0)).toFixed(1)}% aligned</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Data Quality Score</p>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${result.confidenceScore >= 80 ? 'bg-green-500' : result.confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                              style={{ width: `${result.confidenceScore}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{result.confidenceScore}% quality</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Findings */}
                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-cyan-400" />
                        Key Findings
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 font-bold mt-0.5">✓</span>
                          <span className="text-slate-300">
                            Carbon difference of <span className="font-semibold text-cyan-400">{result.differencePercentage?.toFixed(2)}%</span> is {result.differencePercentage <= result.toleranceThreshold ? 'within acceptable tolerance' : 'exceeds threshold'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold mt-0.5">•</span>
                          <span className="text-slate-300">
                            Project captures <span className="font-semibold text-teal-400">{result.carbonPerHectare?.toFixed(2)} tons/ha</span> of carbon
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 font-bold mt-0.5">•</span>
                          <span className="text-slate-300">
                            Expected carbon sequestration: <span className="font-semibold text-cyan-400">{result.expectedCarbon?.toFixed(0)} tons</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {result.insights && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-sm font-semibold text-white mb-3">Detailed Insights</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {result.insights.biomassRealistic ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-slate-300">
                          Biomass is {result.insights.biomassRealistic ? "" : "not"}{" "}
                          realistic for this ecosystem
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.insights.areaRealistic ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-slate-300">
                          Area is within realistic bounds
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.insights.carbonRangeGood ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-slate-300">
                          Carbon value within sanity checks
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provenance & Metadata */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 space-y-1">
                    <p>
                      <span className="text-slate-300">Method:</span> {result.metadata?.verificationMethod}
                    </p>
                    <p>
                      <span className="text-slate-300">Verified At:</span>{" "}
                      {new Date(result.metadata?.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 space-y-1">
                    <p>
                      <span className="text-slate-300">Model Version:</span> {result.modelVersion || "local-heuristic-v1"}
                    </p>
                    <p>
                      <span className="text-slate-300">Inference Source:</span> {result.inferenceSource || "local-heuristic"}
                    </p>
                    {result.satelliteEvidence && (
                      <p>
                        <span className="text-slate-300">Satellite Data:</span> {result.satelliteEvidence.source || "external"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Accept/Reject */}
                {(result.status === "Verified" || result.status === "Suspicious") && (
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <Button
                      onClick={handleAccept}
                      disabled={acceptingData}
                      className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {acceptingData ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Creating Report...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accept & Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleExportSummary}
                      className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {result.status === "Suspicious" && (
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => {
                        if (onVerificationComplete) {
                          onVerificationComplete({
                            ...formData,
                            verificationResult: result,
                            status: "suspicious",
                            timestamp: new Date(),
                          });
                          handleReset();
                          toast.warning("⚠️ Suspicious data added for manual review!");
                        }
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Accept for Review
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {result.status === "Rejected" && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800 mt-6"
                  >
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {result && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Project Output Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Location</p>
                    <p className="text-lg font-semibold text-white">
                      {formData.location || result.verificationInputs?.location || result.location || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Ecosystem</p>
                    <p className="text-lg font-semibold text-white">
                      {formData.ecosystemType || result.verificationInputs?.ecosystemType || result.ecosystemType || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Area</p>
                    <p className="text-lg font-semibold text-white">
                      {(formData.area || result.verificationInputs?.area || result.area)
                        ? `${parseFloat(formData.area || result.verificationInputs?.area || result.area).toFixed(2)} ha`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Biomass</p>
                    <p className="text-lg font-semibold text-white">
                      {(formData.biomass || result.verificationInputs?.biomass || result.biomass)
                        ? `${parseFloat(formData.biomass || result.verificationInputs?.biomass || result.biomass).toFixed(2)} tons/ha`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Reported Carbon</p>
                    <p className="text-lg font-semibold text-white">
                      {(result.reportedCarbon || result.verificationInputs?.reportedCarbon || result.reportedCarbon === 0)
                        ? `${(result.reportedCarbon || result.verificationInputs?.reportedCarbon).toFixed(2)} tons`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-400 mb-2">Expected Carbon</p>
                    <p className="text-lg font-semibold text-white">
                      {result.expectedCarbon !== undefined && result.expectedCarbon !== null
                        ? `${result.expectedCarbon.toFixed(2)} tons`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-900/80 border border-slate-700/60 p-4">
                    <p className="text-xs text-slate-400 mb-2">Accuracy</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {result.differencePercentage !== undefined && result.differencePercentage !== null
                        ? `${(100 - result.differencePercentage).toFixed(1)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Reported vs expected</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-700/60 p-4">
                    <p className="text-xs text-slate-400 mb-2">Efficiency</p>
                    <p className="text-3xl font-bold text-teal-400">
                      {result.differencePercentage !== undefined && result.differencePercentage !== null
                        ? `${Math.max(0, Math.min(100, 100 - result.differencePercentage)).toFixed(1)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Sequestration efficiency</p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                  <p className="text-xs text-slate-400 mb-2">Data Validity</p>
                  <p className="text-lg font-semibold text-white">{result.status === 'Verified' ? 'Valid' : result.status === 'Suspicious' ? 'Needs review' : 'Invalid'}</p>
                  <p className="text-xs text-slate-500 mt-2">{result.status === 'Verified' ? 'Data meets expected thresholds' : result.status === 'Suspicious' ? 'Review for anomalies' : 'Rejected as invalid'}</p>
                </div>

                <div className="rounded-lg bg-slate-900/80 border border-slate-700/60 p-4">
                  <p className="text-xs text-slate-400 mb-2">Key Metrics</p>
                  <div className="grid gap-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Carbon/Hectare</span>
                      <span>{result.carbonPerHectare?.toFixed(2) || '—'} tons/ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Range</span>
                      <span>{result.ecosystemReference?.minRange || '—'} - {result.ecosystemReference?.maxRange || '—'} tons/ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Confidence</span>
                      <span>{result.confidenceScore || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Threshold</span>
                      <span>{result.toleranceThreshold}%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 text-slate-300 text-sm">
                  <p className="font-semibold text-white mb-2">Project verification details</p>
                  <p>{result.reason}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          {/* Empty State */}
          {!processing && !result && (
            <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
              <CardContent className="py-12 text-center">
                <div className="text-slate-400 space-y-2">
                  <Zap className="w-12 h-12 mx-auto opacity-50 mb-4" />
                  <p className="text-sm">Input your ecosystem data and click "Verify Data"</p>
                  <p className="text-xs text-slate-500">
                    The system will analyze your data using ML & scientific validation
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified Records Table */}
          {verifiedRecords.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Accepted Verification Records ({verifiedRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Ecosystem</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Carbon (t)</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Expected (t)</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Diff %</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Confidence</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedRecords.map((record, index) => (
                        <tr key={index} className="border-b border-slate-700 hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-slate-300">{record.location}</td>
                          <td className="px-4 py-3 text-slate-300 capitalize">{record.ecosystemType}</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">{record.reportedCarbon.toFixed(2)}</td>
                          <td className="px-4 py-3 text-cyan-400">{record.expectedCarbon.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={record.differencePercentage > 20 ? "text-yellow-400" : "text-green-400"}>
                              {record.differencePercentage.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={record.confidenceScore >= 80 ? "text-green-400" : record.confidenceScore >= 50 ? "text-yellow-400" : "text-orange-400"}>
                              {record.confidenceScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadgeStyle(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{record.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
