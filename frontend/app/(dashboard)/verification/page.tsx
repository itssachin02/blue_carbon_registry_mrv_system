"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Project } from "@/lib/types";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  FileText,
} from "lucide-react";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
}

const ETHERSCAN_BASE_URL =
  process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL ||
  "https://sepolia.etherscan.io";

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      // Fetch projects
      const projectsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const normalizedProjects = projectsData.map((project: any) => ({
          ...project,
          id:
            project.id ||
            project._id ||
            `${project.name}-${project.createdAt}-${Math.random()}`,
        }));

        setProjects(normalizedProjects);

        // Generate mock transactions from verified projects
        const verifiedProjects = normalizedProjects.filter(
          (p: Project) => p.status === "verified"
        );
        const mockTxs = verifiedProjects
          .filter((p: Project) => Boolean(p.transactionHash))
          .map((p: Project) => ({
            hash: p.transactionHash!,
            from: user.address || "0x" + Math.random().toString(16).slice(2, 42),
            to: "0x" + Math.random().toString(16).slice(2, 42),
            amount: p.carbonCredits,
            timestamp: p.verifiedAt || new Date().toISOString(),
          }));
        setTransactions(mockTxs);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingProjects = projects.filter(
    (p) =>
      p.approvalStatus === "pending" ||
      (!p.approvalStatus && p.status === "pending")
  );
  const verifiedProjects = projects.filter(
    (p) =>
      p.approvalStatus === "approved" ||
      p.status === "verified"
  );

  const stats = {
    pending: pendingProjects.length,
    verified: verifiedProjects.length,
    totalTransactions: transactions.length,
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Blockchain Verification"
        description="Track project verification status on blockchain"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Verification
                  </p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {stats.pending}
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
                    {stats.verified}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    On-Chain Records
                  </p>
                  <p className="text-2xl font-bold text-blue-500">
                    {stats.totalTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary" className="ml-1">
                {stats.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="verified" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified
              <Badge variant="secondary" className="ml-1">
                {stats.verified}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <FileText className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-6 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading projects...
                </CardContent>
              </Card>
            ) : pendingProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No projects pending verification
                </CardContent>
              </Card>
            ) : (
              pendingProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.area} hectares • {project.ecosystemType}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between sm:items-end gap-2">
                    <div className="w-full text-right">
                      <p className="text-sm text-muted-foreground">
                        Carbon Credits
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {project.carbonCredits.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() =>
                        console.log("Verify project:", project.id)
                      }
                    >
                      Verify on Chain
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Verified Tab */}
          <TabsContent value="verified" className="mt-6 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading verified projects...
                </CardContent>
              </Card>
            ) : verifiedProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No verified projects yet
                </CardContent>
              </Card>
            ) : (
              verifiedProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid gap-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4 sm:grid-cols-2"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.area} hectares • {project.ecosystemType}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between sm:items-end gap-2">
                    <div className="w-full text-right">
                      <p className="text-sm text-muted-foreground">
                        Carbon Credits
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {project.carbonCredits.toLocaleString()}
                      </p>
                    </div>
                    {project.transactionHash ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2 sm:w-auto"
                        onClick={() =>
                          window.open(
                            `${ETHERSCAN_BASE_URL}/tx/${project.transactionHash}`,
                            "_blank"
                          )
                        }
                      >
                        View on Etherscan
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No blockchain transaction recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-6 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading transactions...
                </CardContent>
              </Card>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No transactions found
                </CardContent>
              </Card>
            ) : (
              transactions.map((tx, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          From
                        </p>
                        <p className="font-mono text-sm text-foreground">
                          {tx.from.slice(0, 10)}...
                          {tx.from.slice(-8)}
                        </p>
                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                          To
                        </p>
                        <p className="font-mono text-sm text-foreground">
                          {tx.to.slice(0, 10)}...
                          {tx.to.slice(-8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Amount
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {tx.amount} tCO2e
                        </p>
                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                          Timestamp
                        </p>
                        <p className="text-sm text-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
