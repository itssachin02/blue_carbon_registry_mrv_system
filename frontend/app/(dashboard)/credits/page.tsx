"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  RefreshCw,
  Send,
  TrendingUp,
  BadgeCheckIcon,
  Lock,
  Zap,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CarbonCredit {
  _id: string;
  projectName: string;
  creditAmount: number;
  status: "verified" | "pending" | "retired";
  verificationStatus: "verified" | "pending";
  issuedDate: string;
  expiryDate: string;
  blockchainHash?: string;
}

interface MeasurementData {
  _id: string;
  projectName: string;
  carbonCreditsGenerated: number;
  calculatedCO2Absorbed: number;
  status: string;
  verifiedAt?: string;
}

export default function CarbonCreditsPage() {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      // Fetch measurements which contain credit data
      const measurementsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mrv/measurement?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (measurementsRes.ok) {
        const measurementsData = await measurementsRes.json();
        setMeasurements(measurementsData);
      }

      // Fetch projects for reference
      const projectsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate credit statistics
  const verifiedMeasurements = measurements.filter((m) => m.status === "verified");
  const totalVerifiedCredits = verifiedMeasurements.reduce(
    (sum, m) => sum + (m.carbonCreditsGenerated || 0),
    0
  );
  const totalCO2Absorbed = verifiedMeasurements.reduce(
    (sum, m) => sum + (m.calculatedCO2Absorbed || 0),
    0
  );
  const pendingCredits = measurements
    .filter((m) => m.status === "calculated")
    .reduce((sum, m) => sum + (m.carbonCreditsGenerated || 0), 0);

  const handleTransfer = async () => {
    alert("Transfer feature will be available when connected to marketplace!");
    setTransferModalOpen(false);
  };

  const handleRetire = async () => {
    alert("Retire feature will be available in the next update!");
    setRetireModalOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Carbon Credits Registry"
        description="Track and manage your verified carbon credit portfolio"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified Credits</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {totalVerifiedCredits.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <BadgeCheckIcon className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500">Locked on blockchain</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {pendingCredits.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-yellow-500">Under review</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {(totalVerifiedCredits + pendingCredits).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500">Portfolio</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Captured</p>
                  <p className="text-3xl font-bold text-teal-600 mt-1">
                    {totalCO2Absorbed.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Leaf className="h-4 w-4 text-teal-500" />
                    <span className="text-xs text-teal-500">tCO₂e</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-teal-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-base">How Carbon Credits Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                <p className="text-sm font-medium">Measure & Report</p>
                <p className="text-xs text-muted-foreground">Record CO₂ absorption data</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                <p className="text-sm font-medium">Calculate Credits</p>
                <p className="text-xs text-muted-foreground">1 credit = 1 tonne CO₂e</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                <p className="text-sm font-medium">Verify & Lock</p>
                <p className="text-xs text-muted-foreground">Admin approval & blockchain storage</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">4</div>
                <p className="text-sm font-medium">Trade & Retire</p>
                <p className="text-xs text-muted-foreground">Sell or retire credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits Details Table */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">
              Credit Transactions
            </CardTitle>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (selectedCredit) setRetireModalOpen(true);
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Retire Credits
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (selectedCredit) setTransferModalOpen(true);
                }}
              >
                <Send className="h-4 w-4" />
                Transfer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading credits...
              </div>
            ) : measurements.length === 0 ? (
              <div className="py-12 text-center">
                <Leaf className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  No measurements recorded yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Record measurements in the MRV System to generate carbon credits
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-muted-foreground">Project</TableHead>
                      <TableHead className="text-muted-foreground">CO₂ Absorbed</TableHead>
                      <TableHead className="text-muted-foreground text-right">Credits</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Verified</TableHead>
                      <TableHead className="text-muted-foreground text-right">Date</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements.map((measurement) => (
                      <TableRow
                        key={measurement._id}
                        className="border-border hover:bg-secondary/50"
                        onClick={() => setSelectedCredit(measurement._id)}
                      >
                        <TableCell className="font-medium text-foreground">
                          {measurement.projectName}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {measurement.calculatedCO2Absorbed.toFixed(2)} tCO₂e
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {measurement.carbonCreditsGenerated}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              measurement.status === "verified" &&
                                "bg-green-500/20 text-green-600 border-green-500/50",
                              measurement.status === "calculated" &&
                                "bg-yellow-500/20 text-yellow-600 border-yellow-500/50",
                              measurement.status === "rejected" &&
                                "bg-red-500/20 text-red-600 border-red-500/50"
                            )}
                          >
                            {measurement.status.charAt(0).toUpperCase() +
                              measurement.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {measurement.status === "verified" ? (
                            <div className="flex items-center gap-1">
                              <BadgeCheckIcon className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">Locked</span>
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-600">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {measurement.verifiedAt
                            ? new Date(measurement.verifiedAt).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCredit(measurement._id);
                              setTransferModalOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Information Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Credits Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Card Value</p>
              <p className="text-2xl font-bold text-green-600">1 = 1 tCO₂e</p>
              <p className="text-xs text-muted-foreground mt-2">One credit equals one tonne of verified carbon dioxide equivalent removed from atmosphere.</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Blockchain</p>
              <p className="text-2xl font-bold text-blue-600">Polygon</p>
              <p className="text-xs text-muted-foreground mt-2">Credits stored on Polygon network for transparent ownership and immutable tracking.</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Tradeable</p>
              <p className="text-2xl font-bold text-teal-600">Yes</p>
              <p className="text-xs text-muted-foreground mt-2">Verified credits can be traded on marketplace or retired for environmental impact.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Transfer Carbon Credits</DialogTitle>
            <DialogDescription>
              Transfer your verified carbon credits to another user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient" className="text-foreground">
                Recipient Wallet Address
              </Label>
              <Input
                id="recipient"
                placeholder="0x..."
                className="mt-2 bg-secondary border-border"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-foreground">
                Credits to Transfer
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className="mt-2 bg-secondary border-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Transfer will be recorded on blockchain and cannot be reversed.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Dialog */}
      <Dialog open={retireModalOpen} onOpenChange={setRetireModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Retire Carbon Credits</DialogTitle>
            <DialogDescription>
              Retire credits to remove them from circulation and claim environmental impact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="retire-amount" className="text-foreground">
                Credits to Retire
              </Label>
              <Input
                id="retire-amount"
                type="number"
                placeholder="0"
                className="mt-2 bg-secondary border-border"
              />
            </div>
            <div>
              <Label htmlFor="retire-reason" className="text-foreground">
                Reason for Retirement
              </Label>
              <Input
                id="retire-reason"
                placeholder="e.g., Corporate carbon offset commitment"
                className="mt-2 bg-secondary border-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Retired credits cannot be traded and are permanently recorded on blockchain.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRetireModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRetire}>
              Retire Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
