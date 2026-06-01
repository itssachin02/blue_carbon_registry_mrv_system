"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, TrendingUp, Lock, Zap, Loader } from "lucide-react";

interface CreditData {
  _id: string;
  projectName: string;
  ownerName: string;
  creditsIssued: number;
  creditsRetired: number;
  creditsActive: number;
  issuedDate: string;
  status: "active" | "frozen" | "retired";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIssued: 0,
    totalRetired: 0,
    totalActive: 0,
  });

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/admin/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const creditsList = Array.isArray(data) ? data : data.credits || [];
        setCredits(creditsList);

        // Calculate stats
        const totalIssued = creditsList.reduce((sum, c) => sum + (c.creditsIssued || 0), 0);
        const totalRetired = creditsList.reduce((sum, c) => sum + (c.creditsRetired || 0), 0);
        const totalActive = creditsList.reduce((sum, c) => sum + (c.creditsActive || 0), 0);

        setStats({
          totalIssued,
          totalRetired,
          totalActive,
        });
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (creditId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/admin/credits/${creditId}/freeze`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setCredits(
          credits.map((c) =>
            c._id === creditId ? { ...c, status: "frozen" } : c
          )
        );
        alert("✅ Credits frozen successfully");
      }
    } catch (error) {
      console.error("Error freezing credits:", error);
      alert("❌ Error freezing credits");
    }
  };

  const handleRetire = async (creditId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/admin/credits/${creditId}/retire`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setCredits(
          credits.map((c) =>
            c._id === creditId ? { ...c, status: "retired" } : c
          )
        );
        alert("✅ Credits retired successfully");
      }
    } catch (error) {
      console.error("Error retiring credits:", error);
      alert("❌ Error retiring credits");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            Carbon Credits Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage carbon credit issuance and retirement
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
            <Coins className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalIssued.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">tCO₂e equivalent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalActive.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available for trading</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retired</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalRetired.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Offset in transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Credits by Project */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credits by Project</CardTitle>
            <Badge variant="outline">{credits.length} projects</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Retired</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.length > 0 ? (
                    credits.map((credit) => (
                      <TableRow key={credit._id}>
                        <TableCell className="font-medium">
                          {credit.projectName}
                        </TableCell>
                        <TableCell>{credit.ownerName}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {credit.creditsIssued.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-purple-600">
                            {credit.creditsRetired.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {credit.creditsActive.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border ${
                              credit.status === "active"
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : credit.status === "frozen"
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                : "bg-red-500/10 text-red-700 border-red-500/20"
                            }`}
                          >
                            {credit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {credit.status === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleFreeze(credit._id)}
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                  Freeze
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleRetire(credit._id)}
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  Retire
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No credits found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-base">Credit Management Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-blue-700">✅ Active Credits</p>
            <p className="text-muted-foreground">
              Credits that are currently available for trading on the blockchain
            </p>
          </div>
          <div>
            <p className="font-semibold text-yellow-700">🔒 Freeze</p>
            <p className="text-muted-foreground">
              Prevent credits from being traded. Useful if issues are detected.
            </p>
          </div>
          <div>
            <p className="font-semibold text-red-700">♻️ Retire</p>
            <p className="text-muted-foreground">
              Remove credits from active circulation permanently.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
