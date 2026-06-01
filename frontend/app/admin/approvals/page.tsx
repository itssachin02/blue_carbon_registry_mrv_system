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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Loader } from "lucide-react";

interface ProjectReviewData {
  score: number;
  recommendation: string;
  creditDensity: number;
  expectedCredits: number;
  efficiencyRatio: number;
  isOutlier: boolean;
  flags: string[];
  algorithms: string[];
}

interface Project {
  _id: string;
  name: string;
  description: string;
  location: string;
  area: number;
  carbonCredits: number;
  ecosystemType: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  approvalStatus: string;
  reviewData?: ProjectReviewData;
}

export default function ApprovalsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchPendingProjects();
  }, []);

  const fetchPendingProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/projects/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (project: Project) => {
    if (project.reviewData && project.reviewData.score < 60) {
      const confirmOverride = window.confirm(
        "Do you still want to approve it?"
      );
      if (!confirmOverride) {
        return;
      }
    }

    try {
      setApproving(project._id);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/projects/${project._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comments: project.reviewData ? `Processed score: ${project.reviewData.score}` : undefined }),
        }
      );

      if (response.ok) {
        alert("Project approved successfully!");
        setProjects(projects.filter((p) => p._id !== project._id));
      } else {
        alert("Failed to approve project");
      }
    } catch (error) {
      console.error("Error approving project:", error);
      alert("Error approving project");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (projectId: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setRejecting(projectId);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/projects/${projectId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        alert("Project rejected successfully!");
        setProjects(projects.filter((p) => p._id !== projectId));
        setRejectionReason("");
        setSelectedProject(null);
      } else {
        alert("Failed to reject project");
      }
    } catch (error) {
      console.error("Error rejecting project:", error);
      alert("Error rejecting project");
    } finally {
      setRejecting(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Project Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve/reject projects submitted by developers
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No pending projects to review 🎉
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      By {project.user.name} ({project.user.email})
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10">
                    Pending
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">{project.description}</p>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold">{project.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area (ha)</p>
                    <p className="font-semibold">{project.area}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Carbon Credits
                    </p>
                    <p className="font-semibold">{project.carbonCredits}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ecosystem Type
                    </p>
                    <p className="font-semibold capitalize">
                      {project.ecosystemType}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Processing Score
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {project.reviewData ? project.reviewData.score : "--"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.reviewData?.recommendation || "Calculating..."}
                      </p>
                    </div>
                    {project.reviewData?.flags.length ? (
                      <div className="rounded-xl bg-slate-950 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Algorithm flags</p>
                        <ul className="list-disc list-inside space-y-1">
                          {project.reviewData.flags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-950 p-4 text-sm text-muted-foreground">
                        Project passes basic algorithm checks.
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleApprove(project)}
                    disabled={approving === project._id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {approving === project._id ? "Approving..." : "Approve"}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setSelectedProject(project)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Project</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting this project.
                          The developer will be notified.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Project: {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Developer: {project.user.name}
                          </p>
                        </div>

                        <Textarea
                          placeholder="Enter rejection reason..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectionReason("");
                              setSelectedProject(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(project._id)}
                            disabled={rejecting === project._id}
                          >
                            {rejecting === project._id ? "Rejecting..." : "Confirm Rejection"}
                          </Button>
                        </div>
                      </div>
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
