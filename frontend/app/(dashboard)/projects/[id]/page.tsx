"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploadComponent } from "@/components/projects/file-upload-component";
import { BulkDatasetUploadModal } from "@/components/projects/bulk-dataset-upload-modal";
import { BlockchainVerifyComponent } from "@/components/projects/blockchain-verify-component";
import { Loader2, ArrowLeft, MapPin, Leaf, FileText, Waves, Upload } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const ecosystemIcons: Record<string, any> = {
  mangrove: Leaf,
  seagrass: Waves,
  saltmarsh: Leaf,
  kelp: Leaf,
};

const ecosystemColors: Record<string, string> = {
  mangrove: "bg-teal-500/20 text-teal-400 border-teal-500/50",
  seagrass: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  saltmarsh: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
  kelp: "bg-green-500/20 text-green-400 border-green-500/50",
};

const statusColors: Record<string, string> = {
  verified: "bg-green-500/20 text-green-400 border-green-500/50",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  rejected: "bg-red-500/20 text-red-400 border-red-500/50",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`);
      }

      const data = await response.json();
      const rawProject = data?.data || data;

      const locationValue = rawProject.location;
      const locationString = typeof locationValue === "string"
        ? locationValue
        : locationValue
        ? `${locationValue.region || ""}${locationValue.country ? `, ${locationValue.country}` : ""}`.trim()
        : "";

      // Map MongoDB response to frontend types
      const mappedProject: Project = {
        ...rawProject,
        id: rawProject._id || rawProject.id,
        location: locationString || "Not specified",
        coordinates: {
          lat: rawProject.latitude ?? rawProject.coordinates?.lat ?? 0,
          lng: rawProject.longitude ?? rawProject.coordinates?.lng ?? 0,
        },
      };

      setProject(mappedProject);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError(error instanceof Error ? error.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Project Details"
          description="Loading project information..."
        />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen">
        <Header
          title="Project Details"
          description="Error loading project"
        />
        <div className="p-4 sm:p-6 space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">{error || "Project not found"}</p>
              <Button onClick={() => router.back()} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const EcosystemIcon = ecosystemIcons[project.ecosystemType] || Leaf;

  return (
    <div className="min-h-screen">
      <Header
        title={project.name}
        description={`${project.location} • ${project.ecosystemType}`}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>

        {/* Project Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Carbon Credits</p>
              <p className="text-2xl font-bold text-primary">
                {(project.carbonCredits ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Area (hectares)</p>
              <p className="text-2xl font-bold text-foreground">
                {(project.area ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={cn("mt-2 capitalize", statusColors[project.status])}
              >
                {project.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Ecosystem</p>
              <div className="flex items-center gap-2 mt-2">
                <EcosystemIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold capitalize">
                  {project.ecosystemType}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Location Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold text-foreground">{project.location}</p>
              </div>
              {project.coordinates && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Latitude</p>
                      <p className="font-mono text-foreground">
                        {project.coordinates.lat.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Longitude</p>
                      <p className="font-mono text-foreground">
                        {project.coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Project ID</p>
                <p className="font-mono text-sm text-foreground break-all">
                  {project.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              {project.verifiedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-foreground">
                    {new Date(project.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {project.description}
            </p>
          </CardContent>
        </Card>

        {project.rejectionReason && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Rejection Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 whitespace-pre-wrap">
                {project.rejectionReason}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This reason was provided by the admin when rejecting your project.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Proof Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.proofUrl ? (
              <div>
                <p className="text-sm text-muted-foreground">Uploaded Proof</p>
                <a
                  href={project.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {project.proofFileName || project.proofUrl}
                </a>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No proof document uploaded yet. Use the upload section below to pin a file to Pinata.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Information */}
        {project.transactionHash && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Blockchain Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Transaction Hash</p>
                <p className="font-mono text-sm text-primary break-all">
                  {project.transactionHash}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                ✅ Project is registered on the blockchain
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Processing and Upload Options */}
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={() => setBulkUploadOpen(true)}
            className="gap-2"
            variant="default"
          >
            <Upload className="h-4 w-4" />
            Upload & Process Dataset with MRV
          </Button>
        </div>

        {/* File Upload Component */}
        <FileUploadComponent
          projectId={project.id}
          projectName={project.name}
          onSuccess={(data) => {
            setIpfsHash(data.ipfsHash);
            alert("✅ File uploaded successfully!");
          }}
          onError={(error) => {
            alert(`❌ Error: ${error}`);
          }}
        />

        {/* Bulk Dataset Upload Modal */}
        <BulkDatasetUploadModal
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          projectId={project.id}
          onSuccess={() => {
            // Refresh project data to show updated MRV results
            fetchProject();
          }}
        />

        {/* Blockchain Verification Component */}
        <BlockchainVerifyComponent
          projectId={project.id}
          projectName={project.name}
          currentStatus={project.status}
          ipfsHash={ipfsHash || project.proofIpfsHash}
          transactionHash={project.transactionHash}
          onVerifySuccess={() => {
            // Refresh project data
            setLoading(true);
            fetchProject();
          }}
        />
      </div>
    </div>
  );
}
