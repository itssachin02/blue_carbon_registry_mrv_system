"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ProjectTable } from "@/components/projects/project-table";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { DeleteConfirmDialog } from "@/components/projects/delete-confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) => {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.location.toLowerCase().includes(query) ||
          project.ecosystemType.toLowerCase().includes(query)
        );
      });
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

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
        
        // Map MongoDB _id to id and coordinates format
        let mappedData: Project[] = [];
        if (Array.isArray(data)) {
          mappedData = data.map((project: any) => ({
            ...project,
            id: project._id || project.id,
            coordinates: {
              lat: project.latitude || 0,
              lng: project.longitude || 0,
            },
          }));
        } else if (data?.data?.projects && Array.isArray(data.data.projects)) {
          mappedData = data.data.projects.map((project: any) => ({
            ...project,
            id: project._id || project.id,
            coordinates: {
              lat: project.latitude || 0,
              lng: project.longitude || 0,
            },
          }));
        }
        setProjects(mappedData);
        setFilteredProjects(mappedData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats with approvalStatus fallback
  const totalProjects = projects.length;
  const verifiedProjects = projects.filter(
    (p) =>
      p.approvalStatus === "approved" ||
      p.status === "verified"
  ).length;

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
  const pendingProjects = projects.filter(
    (p) =>
      p.approvalStatus === "pending" ||
      (!p.approvalStatus && p.status === "pending")
  ).length;
  const totalCredits = projects.reduce((sum, p) => sum + (p.carbonCredits || 0), 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        description="My Projects"
        onSearch={(query) => setSearchQuery(query)}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalProjects}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-green-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-500">
                    {verifiedProjects}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {pendingProjects}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalCredits.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <EditProjectModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleEditSubmit}
          project={selectedProject}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          project={selectedProject}
          loading={deleteLoading}
        />

        {/* Quick Actions */}
        {!loading && totalProjects > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <Link href="/projects" className="block">
                  <h4 className="font-semibold text-foreground mb-2">View All Projects</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage and edit all your projects
                  </p>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <Link href="/mrv" className="block">
                  <h4 className="font-semibold text-foreground mb-2">MRV System</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify measurements and reports
                  </p>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}