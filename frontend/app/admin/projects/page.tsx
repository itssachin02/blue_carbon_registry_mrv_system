"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

interface Project {
  _id: string;
  name: string;
  description: string;
  location: string;
  area: number;
  carbonCredits: number;
  ecosystemType: string;
  status: string;
  approvalStatus: string;
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  transactionHash?: string;
  verifiedAt?: string;
  proofIpfsHash?: string;
  proofUrl?: string;
  proofFileName?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  approved: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
};

const projectStatusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-700",
  verified: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const url =
        filterStatus === "all"
          ? `${API_BASE}/admin/projects`
          : `${API_BASE}/admin/projects?status=${filterStatus}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        setTotalProjects(data.totalProjects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Projects</h1>
        <p className="text-muted-foreground">
          View and manage all projects submitted by developers
        </p>
      </div>

      {/* Total Projects Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Projects</p>
              <p className="text-3xl font-bold text-blue-900">{totalProjects}</p>
              <p className="text-xs text-blue-600 mt-1">
                Projects added by all users
              </p>
            </div>
            <div className="text-blue-500">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by approval status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} of {totalProjects} project{totalProjects !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No projects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <Badge className={statusColors[project.approvalStatus]}>
                        {project.approvalStatus.charAt(0).toUpperCase() +
                          project.approvalStatus.slice(1)}
                      </Badge>
                      <Badge className={projectStatusColors[project.status]}>
                        {project.status === "verified" ? "Verified" : project.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6 text-xs">
                      <div>
                        <p className="text-muted-foreground">Developer</p>
                        <p className="font-medium">{project.user.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{project.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area (ha)</p>
                        <p className="font-medium">{project.area}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carbon Credits</p>
                        <p className="font-medium">{project.carbonCredits}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">
                          {project.ecosystemType}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Document</p>
                        {project.proofUrl ? (
                          <a
                            href={project.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 underline"
                          >
                            {project.proofFileName || "View Document"}
                          </a>
                        ) : (
                          <p className="font-medium text-muted-foreground">
                            No document
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <p>
                        Submitted:{" "}
                        <span className="font-medium">
                          {formatDate(project.createdAt)}
                        </span>
                      </p>
                      {project.approvedAt && (
                        <p>
                          Approved:{" "}
                          <span className="font-medium">
                            {formatDate(project.approvedAt)}
                          </span>
                          {project.approvedBy && (
                            <span className="text-muted-foreground">
                              {" "}
                              by {project.approvedBy.name}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedProject?.name}</DialogTitle>
                        <DialogDescription>
                          Project details and approval history
                        </DialogDescription>
                      </DialogHeader>

                      {selectedProject && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedProject.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Developer
                              </p>
                              <p className="font-medium">
                                {selectedProject.user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {selectedProject.user.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Location
                              </p>
                              <p className="font-medium">
                                {selectedProject.location}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Area (hectares)
                              </p>
                              <p className="font-medium">{selectedProject.area}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Carbon Credits
                              </p>
                              <p className="font-medium">
                                {selectedProject.carbonCredits}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Ecosystem Type
                              </p>
                              <p className="font-medium capitalize">
                                {selectedProject.ecosystemType}
                              </p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs text-muted-foreground">
                                Document / Dataset
                              </p>
                              {selectedProject.proofUrl ? (
                                <a
                                  href={selectedProject.proofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block max-w-full break-words font-medium text-blue-600 underline"
                                >
                                  {selectedProject.proofFileName || "View File"}
                                </a>
                              ) : (
                                <p className="font-medium text-muted-foreground">
                                  No document uploaded
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Project Status
                              </p>
                              <Badge
                                className={
                                  projectStatusColors[selectedProject.status]
                                }
                              >
                                {selectedProject.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3">
                              Approval Status
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">
                                    Approval Status
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(selectedProject.createdAt)}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    statusColors[selectedProject.approvalStatus]
                                  }
                                >
                                  {selectedProject.approvalStatus}
                                </Badge>
                              </div>

                              {selectedProject.rejectionReason && (
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-200">
                                  <p className="text-sm font-medium mb-1 text-red-700">
                                    Rejection Reason
                                  </p>
                                  <p className="text-sm text-red-600">
                                    {selectedProject.rejectionReason}
                                  </p>
                                </div>
                              )}

                              {selectedProject.transactionHash && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Blockchain Transaction
                                  </p>
                                  <p className="text-xs font-mono break-all bg-muted p-2 rounded">
                                    {selectedProject.transactionHash}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
