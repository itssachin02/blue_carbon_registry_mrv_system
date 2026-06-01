"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/lib/mock-data";

interface FileUploadProps {
  onUpload?: (data: UploadData) => void;
}

interface UploadData {
  projectId: string;
  reportType: string;
  methodology: string;
  carbonSequestered: number;
  notes: string;
  file: File | null;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    reportType: "",
    methodology: "",
    carbonSequestered: 0,
    notes: "",
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !formData.projectId || !formData.reportType) return;

    setUploading(true);
    
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setUploading(false);
    setUploadComplete(true);
    
    onUpload?.({ ...formData, file });
    
    // Reset after 3 seconds
    setTimeout(() => {
      setUploadComplete(false);
      setFile(null);
      setFormData({
        projectId: "",
        reportType: "",
        methodology: "",
        carbonSequestered: 0,
        notes: "",
      });
    }, 3000);
  };

  const removeFile = () => {
    setFile(null);
    setUploadComplete(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Upload className="h-5 w-5 text-primary" />
          Upload MRV Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            uploadComplete && "border-green-500 bg-green-500/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadComplete ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-green-500">Upload Successful!</p>
              <p className="text-sm text-muted-foreground">
                Your report has been submitted for review.
              </p>
            </div>
          ) : file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <CloudUpload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  Drop your file here, or{" "}
                  <label className="cursor-pointer text-primary hover:underline">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xlsx,.csv"
                      onChange={handleFileChange}
                    />
                  </label>
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, XLSX, CSV (Max 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">Project *</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) =>
                setFormData({ ...formData, projectId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {mockProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Report Type *</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) =>
                setFormData({ ...formData, reportType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baseline">Baseline Assessment</SelectItem>
                <SelectItem value="monitoring">Monitoring Report</SelectItem>
                <SelectItem value="verification">Verification Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Methodology</Label>
            <Select
              value={formData.methodology}
              onValueChange={(value) =>
                setFormData({ ...formData, methodology: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select methodology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VM0033">VM0033 - Tidal Wetland</SelectItem>
                <SelectItem value="VM0007">VM0007 - REDD+</SelectItem>
                <SelectItem value="AR-ACM0003">AR-ACM0003</SelectItem>
                <SelectItem value="AMS-III.D">AMS-III.D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Carbon Sequestered (tCO2e)</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.carbonSequestered || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  carbonSequestered: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Notes</Label>
          <Textarea
            placeholder="Add any additional notes or comments..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <Button
          className="w-full"
          disabled={!file || !formData.projectId || !formData.reportType || uploading}
          onClick={handleSubmit}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Submit Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
