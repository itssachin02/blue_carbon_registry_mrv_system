"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  AlertTriangle,
  Leaf,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  project: Project;
  onVerify?: (project: Project) => void;
}

type VerificationStep = "connecting" | "signing" | "confirming" | "complete";

export function VerificationCard({ project, onVerify }: VerificationCardProps) {
  const [verifying, setVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState<VerificationStep | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(
    project.transactionHash || null
  );
  const [copied, setCopied] = useState(false);

  const steps: { key: VerificationStep; label: string; progress: number }[] = [
    { key: "connecting", label: "Connecting to wallet...", progress: 25 },
    { key: "signing", label: "Signing transaction...", progress: 50 },
    { key: "confirming", label: "Confirming on blockchain...", progress: 75 },
    { key: "complete", label: "Verification complete!", progress: 100 },
  ];

  const handleVerify = async () => {
    setVerifying(true);
    
    // Simulate blockchain verification process
    for (const step of steps) {
      setCurrentStep(step.key);
      await new Promise((resolve) =>
        setTimeout(resolve, step.key === "confirming" ? 3000 : 1500)
      );
    }

    // Generate mock transaction hash
    const mockHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    
    setTransactionHash(mockHash);
    setVerifying(false);
    onVerify?.(project);
  };

  const copyToClipboard = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentProgress =
    steps.find((s) => s.key === currentStep)?.progress || 0;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{project.location}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              project.status === "verified"
                ? "bg-green-500/20 text-green-500 border-green-500/50"
                : "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
            )}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Carbon Credits</p>
            <p className="text-lg font-semibold text-primary">
              {project.carbonCredits.toLocaleString()} tCO2e
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Area</p>
            <p className="text-lg font-semibold text-foreground">
              {project.area.toLocaleString()} ha
            </p>
          </div>
        </div>

        {/* Transaction Hash (if verified) */}
        {transactionHash && !verifying && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                Verified on Blockchain
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground truncate">
                {transactionHash}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                asChild
              >
                <a
                  href={`https://polygonscan.com/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Verification Progress */}
        {verifying && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {steps.find((s) => s.key === currentStep)?.label}
              </span>
              <span className="text-primary">{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Please do not close this window
            </div>
          </div>
        )}

        {/* Verify Button */}
        {project.status === "pending" && !transactionHash && (
          <Button
            className="w-full gap-2"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Verify on Blockchain
              </>
            )}
          </Button>
        )}

        {/* Already Verified */}
        {project.status === "verified" && transactionHash && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a
              href={`https://polygonscan.com/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
