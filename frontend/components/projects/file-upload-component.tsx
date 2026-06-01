"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Cloud,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  File,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  projectId: string;
  projectName: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function FileUploadComponent({
  projectId,
  projectName,
  onSuccess,
  onError,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [uploadData, setUploadData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setUploadStatus("error");
        setMessage("File size must be less than 50MB");
        onError?.("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      setUploadStatus("idle");
      setMessage("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 50 * 1024 * 1024) {
        setUploadStatus("error");
        setMessage("File size must be less than 50MB");
        onError?.("File size must be less than 50MB");
        return;
      }

      setFile(droppedFile);
      setUploadStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("error");
      setMessage("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setUploadStatus("uploading");
      setMessage("Uploading to IPFS and blockchain...");

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/upload`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      setUploadStatus("success");
      setMessage(
        `✅ Successfully uploaded! IPFS Hash: ${data.ipfsHash.slice(0, 20)}...`
      );
      setUploadData(data);
      onSuccess?.(data);

      // Reset after 3 seconds
      setTimeout(() => {
        setFile(null);
        setUploadStatus("idle");
      }, 3000);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Upload failed";
      setUploadStatus("error");
      setMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus("idle");
    setMessage("");
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Cloud className="h-5 w-5 text-primary" />
          Upload Project Documents
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload project reports or documents to IPFS and register on
          blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Info */}
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Decentralized Storage
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Files are stored on IPFS (Pinata) and blockchain hash is
                recorded
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Max Size</p>
              <p className="text-sm font-semibold text-primary">50 MB</p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all",
            file
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          )}
        >
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png,.zip"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            {!file ? (
              <>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, DOC, XLS, TXT, JPG, PNG, ZIP
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-secondary/50 rounded-lg p-3 border border-border flex items-center justify-between">
            <span className="text-sm text-foreground">{file.name}</span>
            <button
              onClick={clearFile}
              disabled={loading}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <Alert
            className={cn(
              uploadStatus === "error"
                ? "bg-destructive/10 border-destructive/50"
                : uploadStatus === "success"
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-blue-500/10 border-blue-500/50"
            )}
          >
            <div className="flex items-center gap-2">
              {uploadStatus === "error" && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {uploadStatus === "success" && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {uploadStatus === "uploading" && (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>
            <AlertDescription
              className={cn(
                uploadStatus === "error"
                  ? "text-destructive"
                  : uploadStatus === "success"
                    ? "text-green-700"
                    : "text-blue-700"
              )}
            >
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* IPFS Hash Display */}
        {uploadData?.ipfsHash && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              IPFS Hash
            </p>
            <p className="font-mono text-xs text-green-600 break-all">
              {uploadData.ipfsHash}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              🔗 View on IPFS:{" "}
              <a
                href={uploadData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open File
              </a>
            </p>
          </div>
        )}

        {/* Transaction Hash Display */}
        {uploadData?.transactionHash && (
          <div className="bg-primary/10 border border-primary/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground mb-2">
              Blockchain Transaction
            </p>
            <p className="font-mono text-xs text-primary break-all">
              {uploadData.transactionHash}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          size="lg"
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading to Blockchain...
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              Upload to IPFS & Blockchain
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
