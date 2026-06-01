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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockchainVerifyProps {
  projectId: string;
  projectName: string;
  currentStatus: "pending" | "verified" | "rejected";
  ipfsHash?: string;
  transactionHash?: string;
  onVerifySuccess?: () => void;
}

const EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL ||
  "https://mumbai.polygonscan.com";

export function BlockchainVerifyComponent({
  projectId,
  projectName,
  currentStatus,
  ipfsHash,
  transactionHash,
  onVerifySuccess,
}: BlockchainVerifyProps) {
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [verifyData, setVerifyData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!ipfsHash) {
      setVerifyStatus("error");
      setMessage("Please upload project documents first (IPFS hash required)");
      return;
    }

    try {
      setLoading(true);
      setVerifyStatus("verifying");
      setMessage("Verifying project on blockchain...");

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            ipfsHash: ipfsHash,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();

      setVerifyStatus("success");
      setMessage("✅ Project successfully verified on blockchain!");
      setVerifyData(data);
      onVerifySuccess?.();

      // Show details dialog
      setTimeout(() => {
        setShowDetails(true);
      }, 500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Verification failed";
      setVerifyStatus("error");
      setMessage("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVerified = currentStatus === "verified";

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            Blockchain Verification
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Register this project on the blockchain for permanent immutable
            record
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge
                className={cn(
                  "mt-2",
                  isVerified
                    ? "bg-green-500/20 text-green-600 border-green-500/50"
                    : currentStatus === "rejected"
                      ? "bg-red-500/20 text-red-600 border-red-500/50"
                      : "bg-yellow-500/20 text-yellow-600 border-yellow-500/50"
                )}
              >
                {isVerified && <CheckCircle className="h-3 w-3 mr-1" />}
                {currentStatus === "verified" ? "Verified" : "Pending"}
              </Badge>
            </div>
            {isVerified && (
              <div className="text-right">
                <Lock className="h-5 w-5 text-green-500" />
                <p className="text-xs text-muted-foreground mt-1">
                  Immutable Record
                </p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <Zap className="h-4 w-4 text-yellow-500 mb-2" />
              <p className="text-xs font-semibold text-foreground">Permanent</p>
              <p className="text-xs text-muted-foreground mt-1">
                Immutable on blockchain
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <Lock className="h-4 w-4 text-green-500 mb-2" />
              <p className="text-xs font-semibold text-foreground">Secure</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cryptographically verified
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <ExternalLink className="h-4 w-4 text-blue-500 mb-2" />
              <p className="text-xs font-semibold text-foreground">Transparent</p>
              <p className="text-xs text-muted-foreground mt-1">
                Publicly verifiable
              </p>
            </div>
          </div>

          {/* IPFS Requirement */}
          {!ipfsHash && (
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Please upload project documents first to generate IPFS hash
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {verifyStatus === "success" && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {verifyStatus === "error" && (
            <Alert className="bg-destructive/10 border-destructive/50">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Verifying Message */}
          {verifyStatus === "verifying" && (
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-700">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* IPFS Hash Display */}
          {ipfsHash && (
            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-2">IPFS Hash</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-primary font-mono break-all flex-1">
                  {ipfsHash}
                </code>
                <button
                  onClick={() => copyToClipboard(ipfsHash)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline mt-2 inline-block"
              >
                View IPFS record
              </a>
            </div>
          )}

          {transactionHash && currentStatus === "verified" && (
            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Blockchain Transaction
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-primary font-mono break-all flex-1">
                  {transactionHash}
                </code>
                <button
                  onClick={() => copyToClipboard(transactionHash)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy transaction hash"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <a
                href={`${EXPLORER_BASE_URL}/tx/${transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline mt-2 inline-block"
              >
                View on Explorer
              </a>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={!ipfsHash || loading || isVerified}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering on Blockchain...
              </>
            ) : isVerified ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Already Verified
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Register on Blockchain
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Verification Successful
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your project has been registered on the blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Project Info */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <p className="text-sm font-semibold text-foreground mb-3">
                Project Information
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Name:</span>
                  <span className="text-foreground font-mono">{projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project ID:</span>
                  <span className="text-foreground font-mono text-xs">
                    {projectId.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            {verifyData?.blockchainTx && (
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/50">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Blockchain Transaction
                </p>
                <div className="space-y-3 text-sm">
                  {verifyData.blockchainTx.transactionHash && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Transaction Hash
                      </p>
                      <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded">
                        <code className="text-xs text-primary font-mono flex-1 break-all">
                          {verifyData.blockchainTx.transactionHash}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              verifyData.blockchainTx.transactionHash
                            )
                          }
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {verifyData.blockchainTx.blockNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Block Number:
                      </span>
                      <span className="font-mono">
                        {verifyData.blockchainTx.blockNumber}
                      </span>
                    </div>
                  )}

                  {verifyData.blockchainTx.gasUsed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas Used:</span>
                      <span className="font-mono">
                        {verifyData.blockchainTx.gasUsed}
                      </span>
                    </div>
                  )}

                  {verifyData.blockchainTx.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span className="font-mono">
                        {new Date(
                          verifyData.blockchainTx.timestamp
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {verifyData.blockchainTx.transactionHash && (
                    <div className="mt-2">
                      <a
                        href={`${EXPLORER_BASE_URL}/tx/${verifyData.blockchainTx.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        View transaction on Explorer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IPFS Details */}
            {verifyData?.project?.ipfsHash && (
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/50">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Decentralized Storage
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      IPFS Hash
                    </p>
                    <code className="text-xs text-green-600 font-mono break-all">
                      {verifyData.project.ipfsHash}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/50">
              <p className="text-sm text-green-700">
                ✅ Your project is now permanently registered on the blockchain.
                This record is immutable and can be verified by anyone.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
