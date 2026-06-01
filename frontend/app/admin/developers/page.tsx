"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Developer {
  _id: string;
  name: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
}

interface DeveloperDetails extends Developer {
  projects?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  projectList?: Array<{
    _id: string;
    name: string;
    approvalStatus: string;
    createdAt: string;
  }>;
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] =
    useState<DeveloperDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get all users and filter for developers/non-admins
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out admins - only show developers
        const devs = Array.isArray(data)
          ? data.filter((u: any) => u.role !== "admin")
          : data.users?.filter((u: any) => u.role !== "admin") || [];
        setDevelopers(devs);
      } else {
        // Fallback: Show message if endpoint doesn't exist
        console.log("Users endpoint may not exist yet");
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeveloperDetails = async (developerId: string) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/developers/${developerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedDeveloper(data.developer);
      }
    } catch (error) {
      console.error("Error fetching developer details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getApprovalRate = (projects?: { total: number; approved: number }) => {
    if (!projects || projects.total === 0) return 0;
    return Math.round((projects.approved / projects.total) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Developers</h1>
        <p className="text-muted-foreground">
          View all developers and their project statistics
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin" />
        </div>
      ) : developers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No developers found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {developers.map((dev) => (
            <Card key={dev._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{dev.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {dev.email}
                    </p>

                    {dev.walletAddress && (
                      <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded mb-3 break-all">
                        Wallet: {dev.walletAddress}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Joined: {formatDate(dev.createdAt)}
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => fetchDeveloperDetails(dev._id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      {detailsLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader className="animate-spin" />
                        </div>
                      ) : selectedDeveloper ? (
                        <>
                          <DialogHeader>
                            <DialogTitle>{selectedDeveloper.name}</DialogTitle>
                            <DialogDescription>
                              {selectedDeveloper.email}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            <div>
                              <h4 className="font-semibold mb-3">
                                Project Statistics
                              </h4>
                              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="text-xs text-muted-foreground">
                                    Total Projects
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {selectedDeveloper.projects?.total || 0}
                                  </p>
                                </div>
                                <div className="p-4 bg-green-500/10 rounded-lg border border-green-200">
                                  <p className="text-xs text-muted-foreground">
                                    Approved
                                  </p>
                                  <p className="text-2xl font-bold text-green-700">
                                    {selectedDeveloper.projects?.approved || 0}
                                  </p>
                                </div>
                                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-200">
                                  <p className="text-xs text-muted-foreground">
                                    Pending
                                  </p>
                                  <p className="text-2xl font-bold text-yellow-700">
                                    {selectedDeveloper.projects?.pending || 0}
                                  </p>
                                </div>
                                <div className="p-4 bg-red-500/10 rounded-lg border border-red-200">
                                  <p className="text-xs text-muted-foreground">
                                    Rejected
                                  </p>
                                  <p className="text-2xl font-bold text-red-700">
                                    {selectedDeveloper.projects?.rejected || 0}
                                  </p>
                                </div>
                              </div>

                              {selectedDeveloper.projects &&
                                selectedDeveloper.projects.total > 0 && (
                                  <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <p className="text-sm font-medium">
                                        Approval Rate
                                      </p>
                                      <span className="text-sm font-semibold">
                                        {getApprovalRate(
                                          selectedDeveloper.projects
                                        )}
                                        %
                                      </span>
                                    </div>
                                    <Progress
                                      value={getApprovalRate(
                                        selectedDeveloper.projects
                                      )}
                                      className="h-2"
                                    />
                                  </div>
                                )}
                            </div>

                            {selectedDeveloper.projectList &&
                              selectedDeveloper.projectList.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Projects
                                  </h4>
                                  <div className="space-y-2">
                                    {selectedDeveloper.projectList.map(
                                      (project) => (
                                        <div
                                          key={project._id}
                                          className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {project.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatDate(project.createdAt)}
                                            </p>
                                          </div>
                                          <Badge
                                            variant={
                                              project.approvalStatus ===
                                              "approved"
                                                ? "default"
                                                : project.approvalStatus ===
                                                    "rejected"
                                                ? "destructive"
                                                : "secondary"
                                            }
                                          >
                                            {project.approvalStatus}
                                          </Badge>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {selectedDeveloper.walletAddress && (
                              <div className="border-t pt-4">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Wallet Address
                                </p>
                                <p className="text-xs font-mono break-all bg-muted p-3 rounded">
                                  {selectedDeveloper.walletAddress}
                                </p>
                              </div>
                            )}

                            <div className="border-t pt-4">
                              <p className="text-xs text-muted-foreground mb-2">
                                Developer ID
                              </p>
                              <p className="text-xs font-mono break-all bg-muted p-3 rounded">
                                {selectedDeveloper._id}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
