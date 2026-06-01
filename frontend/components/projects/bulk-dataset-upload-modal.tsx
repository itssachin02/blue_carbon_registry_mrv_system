"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Cloud, 
  Upload, 
  Check, 
  AlertCircle, 
  X,
  TrendingUp,
  Leaf,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkDatasetUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess?: () => void;
  availableProjects?: Array<{ id: string; name: string }>;
}

type ProcessingStep = 
  | "idle" 
  | "parsing" 
  | "cleaning" 
  | "python_processing" 
  | "ipfs_upload" 
  | "blockchain" 
  | "success" 
  | "error";

const STEP_MESSAGES: Record<ProcessingStep, string> = {
  idle: "",
  parsing: "📂 Parsing dataset file...",
  cleaning: "🧹 Cleaning and validating data...",
  python_processing: "🐍 Running MRV calculations with Python...",
  ipfs_upload: "☁️ Uploading results to IPFS...",
  blockchain: "⛓️ Recording on blockchain...",
  success: "✅ Dataset processed successfully!",
  error: "❌ Processing failed",
};

export function BulkDatasetUploadModal({ 
  open, 
  onOpenChange, 
  projectId: initialProjectId,
  onSuccess,
  availableProjects = []
}: BulkDatasetUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB.");
      return;
    }
    setFile(selectedFile);
    setProcessingStep("idle");
    setMessage("");
    setError("");
  };

  const clearFile = () => {
    setFile(null);
    setProcessingStep("idle");
    setMessage("");
    setResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a dataset file.");
      return;
    }

    if (!selectedProjectId) {
      setError("Please select a project to process the dataset for.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", selectedProjectId);

      // Update UI to show we're starting
      setProcessingStep("parsing");
      setMessage(STEP_MESSAGES.parsing);

      // Simulate step progression
      setTimeout(() => {
        setProcessingStep("cleaning");
        setMessage(STEP_MESSAGES.cleaning);
      }, 800);

      setTimeout(() => {
        setProcessingStep("python_processing");
        setMessage(STEP_MESSAGES.python_processing);
      }, 1600);

      setTimeout(() => {
        setProcessingStep("ipfs_upload");
        setMessage(STEP_MESSAGES.ipfs_upload);
      }, 2400);

      setTimeout(() => {
        setProcessingStep("blockchain");
        setMessage(STEP_MESSAGES.blockchain);
      }, 3200);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/process-mrv`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || "MRV processing failed.");
      }

      setProcessingStep("success");
      setMessage(STEP_MESSAGES.success);
      setResult(data);
      onSuccess?.();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Processing failed.";
      setProcessingStep("error");
      setMessage(STEP_MESSAGES.error);
      setError(errorText);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Cloud className="h-5 w-5 text-primary" />
            Dataset Upload & MRV Processing
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload your dataset and we'll validate, process with MRV calculations, and store results on IPFS & blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Processing Steps - Visible during processing */}
          {loading && (
            <div className="space-y-3 bg-secondary/50 rounded-lg p-4 border border-border">
              <div className="text-sm font-semibold text-foreground mb-3">Processing Steps:</div>
              {(["parsing", "cleaning", "python_processing", "ipfs_upload", "blockchain"] as const).map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      processingStep === step || (
                        ["parsing", "cleaning", "python_processing", "ipfs_upload", "blockchain"].indexOf(processingStep) > 
                        ["parsing", "cleaning", "python_processing", "ipfs_upload", "blockchain"].indexOf(step)
                      ) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {processingStep === step ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "✓"
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    processingStep === step 
                      ? "font-semibold text-primary" 
                      : "text-muted-foreground"
                  )}>
                    {STEP_MESSAGES[step]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* File Input */}
          {!loading && (
            <>
              <div className="space-y-2">
                <Label htmlFor="project-select" className="text-foreground">
                  Select Project
                </Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger id="project-select" disabled={loading || availableProjects.length === 0}>
                    <SelectValue placeholder="Choose a project for this dataset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.length > 0 ? (
                      availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No projects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The dataset will be processed and associated with this project.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataset-file" className="text-foreground">
                  Dataset File (CSV, JSON, TXT, DOCX, XLS, XLSX)
                </Label>
                <Input
                  id="dataset-file"
                  type="file"
                  accept=".csv,.json,.txt,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Upload your blue carbon habitat dataset. It will be parsed, cleaned, validated, and processed using scientific MRV calculations.
                </p>
              </div>

              {file && (
                <div className="bg-secondary/50 rounded-lg p-4 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Status Messages */}
          {message && !result && (
            <Alert
              className={cn(
                "flex items-center gap-2",
                processingStep === "error"
                  ? "bg-destructive/10 border-destructive/50"
                  : processingStep === "success"
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-blue-500/10 border-blue-500/50"
              )}
            >
              {processingStep === "error" && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
              {processingStep === "success" && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
              {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />}
              <AlertDescription
                className={cn(
                  processingStep === "error"
                    ? "text-destructive"
                    : processingStep === "success"
                    ? "text-green-700"
                    : "text-blue-700"
                )}
              >
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-destructive/10 border-destructive/50">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-5">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                MRV Processing Results
              </div>

              {/* Dataset Statistics */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-card rounded p-3 border border-border">
                  <p className="text-muted-foreground text-xs">Original Records</p>
                  <p className="font-semibold text-foreground">
                    {result.processing.totalRecords}
                  </p>
                </div>
                <div className="bg-card rounded p-3 border border-border">
                  <p className="text-muted-foreground text-xs">Cleaned Records</p>
                  <p className="font-semibold text-foreground">
                    {result.processing.cleanedRecords}
                  </p>
                </div>
                <div className="bg-card rounded p-3 border border-border">
                  <p className="text-muted-foreground text-xs">Processed Records</p>
                  <p className="font-semibold text-foreground">
                    {result.processing.recordsProcessed}
                  </p>
                </div>
              </div>

              {/* Dataset Validation Summary */}
              {result.validation && (
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Dataset Accuracy Summary
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This checks whether the dataset values fall within the habitat-specific threshold range.
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "capitalize",
                        result.validation.overallStatus === "Accurate"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      )}
                    >
                      {result.validation.overallStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Cleaned Records</p>
                      <p className="font-semibold text-foreground">
                        {result.validation.totalCleaned}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Accurate Rows</p>
                      <p className="font-semibold text-foreground">
                        {result.validation.accurateCount}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Inaccurate Rows</p>
                      <p className="font-semibold text-foreground">
                        {result.validation.inaccurateCount}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Flagged Rows</p>
                      <p className="font-semibold text-foreground">
                        {result.validation.flaggedRows.length}
                      </p>
                    </div>
                  </div>

                  {result.validation.flaggedRows.length > 0 && (
                    <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">
                        Flagged dataset rows
                      </p>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        {result.validation.flaggedRows.map((row: any, index: number) => (
                          <div key={index} className="rounded-lg bg-card p-3 border border-border">
                            <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                              <p className="font-semibold text-foreground">Row {row.index}: {row.name}</p>
                              <Badge className="bg-destructive/20 text-destructive">
                                Inaccurate
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Habitat: {row.ecosystemType} • Carbon/ha: {row.carbonPerHectare} tCO2/ha
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expected range: {row.thresholdRange.min} - {row.thresholdRange.max} tCO2/ha
                            </p>
                            <ul className="mt-2 list-disc list-inside text-xs text-destructive">
                              {row.issues.map((issue: string, issueIndex: number) => (
                                <li key={issueIndex}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MRV Results */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-card rounded p-3 border border-primary/30">
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Total Sequestration
                  </p>
                  <p className="font-bold text-primary text-lg">
                    {result.mrvResults.sequestrationTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">tonnes CO2</p>
                </div>
                <div className="bg-card rounded p-3 border border-yellow-500/30">
                  <p className="text-muted-foreground text-xs">Uncertainty Range</p>
                  <p className="font-semibold text-yellow-600">
                    ±{result.mrvResults.uncertaintyRange.upper_bound.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">tonnes CO2</p>
                </div>
              </div>

              {/* Habitat Breakdown */}
              {result.mrvResults.habitatBreakdown && (
                <div className="bg-card rounded p-3 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">Habitat Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(result.mrvResults.habitatBreakdown).map(([habitat, data]: any) => (
                      <div key={habitat} className="flex justify-between text-xs">
                        <span className="capitalize text-muted-foreground">{habitat}:</span>
                        <span className="font-semibold text-foreground">
                          {data.sequestration.toFixed(2)} tonnes CO2
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IPFS & Blockchain Info */}
              <div className="border-t border-border pt-3 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Cloud className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground">IPFS Hash</p>
                    <p className="font-mono break-all text-primary">{result.ipfsHash}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground">Blockchain Tx</p>
                    <p className="font-mono break-all text-primary">{result.transactionHash}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              clearFile();
              onOpenChange(false);
            }} 
            disabled={loading}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button 
              onClick={handleUpload} 
              disabled={!file || loading || !selectedProjectId} 
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
