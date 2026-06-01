"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ProjectTable } from "@/components/projects/project-table";
import { AddProjectModal } from "@/components/projects/add-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { DeleteConfirmDialog } from "@/components/projects/delete-confirm-dialog";
import { BulkDatasetUploadModal } from "@/components/projects/bulk-dataset-upload-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ecosystemFilter, setEcosystemFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects?userId=${user.id}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Map MongoDB _id to id, normalize location, and build coordinates for frontend compatibility
        let mappedData: Project[] = [];
        if (Array.isArray(data)) {
          mappedData = data.map((project: any) => {
            const locationValue = project.location;
            const locationString = typeof locationValue === "string"
              ? locationValue
              : locationValue
              ? `${locationValue.region || ""}${locationValue.country ? `, ${locationValue.country}` : ""}`.trim()
              : "";

            return {
              ...project,
              id: project._id || project.id,
              location: locationString || "Not specified",
              coordinates: {
                lat: project.latitude ?? project.coordinates?.lat ?? 0,
                lng: project.longitude ?? project.coordinates?.lng ?? 0,
              },
            } as Project;
          });
        }
        setProjects(mappedData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const currentStatus = project.approvalStatus || project.status;
    const matchesStatus =
      statusFilter === "all" || currentStatus === statusFilter;
    const matchesEcosystem =
      ecosystemFilter === "all" || project.ecosystemType === ecosystemFilter;

    return matchesSearch && matchesStatus && matchesEcosystem;
  });

  const handleAddProject = async (formData: any, file?: File) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please login again.");
        return;
      }

      const createUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/projects`;
      let projectResponse;
      let projectData;

      if (file) {
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("description", formData.description);
        payload.append("location", formData.location);
        payload.append("area", String(formData.area));
        payload.append("carbonCredits", String(formData.carbonCredits));
        payload.append("ecosystemType", formData.ecosystemType);
        payload.append("latitude", String(formData.latitude));
        payload.append("longitude", String(formData.longitude));
        payload.append("file", file);

        projectResponse = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: payload,
        });
      } else {
        projectResponse = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      projectData = await projectResponse.json();

      if (!projectResponse.ok) {
        alert(`Error: ${projectData.error || projectData.msg || "Failed to create project"}`);
        console.error("Project creation error:", projectData);
        return;
      }

      const proofUploadResult = projectData.proofUploadResult;
      if (file && proofUploadResult) {
        if (proofUploadResult.error) {
          alert(`✅ Project created, but proof upload failed: ${proofUploadResult.error}`);
        } else {
          alert(`✅ Project created! Proof file pinned to Pinata.\nIPFS Hash: ${proofUploadResult.ipfsHash}`);
        }
      } else {
        alert("✅ Project created successfully!");
      }

      setAddModalOpen(false);
      fetchProjects();
    } catch (error) {
      alert("Error creating project. Check console for details.");
      console.error("Error creating project:", error);
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Authentication required");
        return;
      }

      if (!selectedProject) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${selectedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("✅ Project updated successfully!");
        setEditModalOpen(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        alert(`❌ Error: ${data.error || data.msg || "Failed to update project"}`);
      }
    } catch (error) {
      alert("❌ Error updating project");
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Authentication required");
        setDeleteDialogOpen(false);
        setSelectedProject(null);
        return;
      }

      if (!selectedProject) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${selectedProject.id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("✅ Project deleted successfully!");
        setDeleteDialogOpen(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error || data.msg || "Failed to delete project"}`);
      }
    } catch (error) {
      alert("❌ Error deleting project. Check console for details.");
      console.error("Error deleting project:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportProjectsToWord = () => {
    if (exporting || projects.length === 0) {
      if (projects.length === 0) {
        alert("No project data available to export.");
      }
      return;
    }

    setExporting(true);

    try {
      const docTitle = `BlueCarbon_Projects_${new Date().toISOString().slice(0, 10)}`;
      const htmlRows = projects.map((project, index) => {
        const status = project.approvalStatus || project.status || "Unknown";
        const location = project.location || "Not specified";
        const ecosystem = project.ecosystemType || "Not specified";
        const credits = project.carbonCredits ?? 0;
        const area = project.area ?? project.areaHa ?? "N/A";
        const blockchain = project.transactionHash || project.blockchain || "Not registered";

        return `
          <h2 style="margin-bottom: 0.25rem;">${index + 1}. ${project.name || "Unnamed Project"}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
            <tbody>
              <tr><td style="padding: 4px; font-weight: bold; width: 30%;">Project ID</td><td style="padding: 4px;">${project.id || "N/A"}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Location</td><td style="padding: 4px;">${location}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Ecosystem</td><td style="padding: 4px;">${ecosystem}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Area (ha)</td><td style="padding: 4px;">${area}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Carbon Credits</td><td style="padding: 4px;">${credits.toLocaleString()}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Status</td><td style="padding: 4px;">${status}</td></tr>
              <tr><td style="padding: 4px; font-weight: bold;">Blockchain</td><td style="padding: 4px;">${blockchain}</td></tr>
            </tbody>
          </table>
        `;
      }).join("\n");

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title></head><body><h1>BlueCarbon Project Export</h1><p>Export date: ${new Date().toLocaleString()}</p>${htmlRows}</body></html>`;
      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docTitle}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export project data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Project Management"
        description="Manage your blue carbon projects"
        onSearch={(query) => setSearchQuery(query)}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground">
                    {projects.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {projects.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-500">
                    {projects.filter(
                      (p) =>
                        p.approvalStatus === "approved" ||
                        p.status === "verified"
                    ).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-500">
                    {projects.filter(
                      (p) =>
                        p.approvalStatus === "approved" ||
                        p.status === "verified"
                    ).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {projects.filter(
                      (p) =>
                        p.approvalStatus === "pending" ||
                        (!p.approvalStatus && p.status === "pending")
                    ).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-500">
                    {projects.filter(
                      (p) =>
                        p.approvalStatus === "pending" ||
                        (!p.approvalStatus && p.status === "pending")
                    ).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold text-primary">
                    {projects
                      .reduce((sum, p) => sum + (p.carbonCredits || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">tCO2e</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9 bg-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-secondary">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ecosystemFilter} onValueChange={setEcosystemFilter}>
                <SelectTrigger className="w-[150px] bg-secondary">
                  <SelectValue placeholder="Ecosystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ecosystems</SelectItem>
                  <SelectItem value="mangrove">Mangrove</SelectItem>
                  <SelectItem value="seagrass">Seagrass</SelectItem>
                  <SelectItem value="saltmarsh">Saltmarsh</SelectItem>
                  <SelectItem value="kelp">Kelp Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={exportProjectsToWord} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Bulk Upload Dataset
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Projects Table */}
        {loading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading projects...</p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No projects found. Create your first project!</p>
            </CardContent>
          </Card>
        ) : (
          <ProjectTable
            projects={filteredProjects}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}

        <BulkDatasetUploadModal
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          availableProjects={projects.map(p => ({ id: p.id, name: p.name }))}
          onSuccess={fetchProjects}
        />

        {/* Add Project Modal */}
        <AddProjectModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onSubmit={handleAddProject}
        />

        {/* Edit Project Modal */}
        <EditProjectModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleEditSubmit}
          project={selectedProject}
        />

        {/* Delete Confirm Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          project={selectedProject}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
}