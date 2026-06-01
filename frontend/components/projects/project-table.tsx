"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  ExternalLink,
  Leaf,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProjectTableProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ecosystemColors: Record<string, string> = {
  mangrove: "bg-teal-500/20 text-teal-400 border-teal-500/50",
  seagrass: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  saltmarsh: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
  kelp: "bg-green-500/20 text-green-400 border-green-500/50",
};

const statusColors: Record<string, string> = {
  approved: "bg-green-500/20 text-green-400 border-green-500/50",
  verified: "bg-green-500/20 text-green-400 border-green-500/50",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  rejected: "bg-red-500/20 text-red-400 border-red-500/50",
};

export function ProjectTable({
  projects,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Project Name</TableHead>
            <TableHead className="text-muted-foreground">Location</TableHead>
            <TableHead className="text-muted-foreground">Ecosystem</TableHead>
            <TableHead className="text-muted-foreground">Area (ha)</TableHead>
            <TableHead className="text-muted-foreground">Carbon Credits</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Blockchain</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="border-border hover:bg-secondary/50"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Leaf className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {project.id}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-foreground">{project.location || "Not specified"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    ecosystemColors[project.ecosystemType || "mangrove"]
                  )}
                >
                  {project.ecosystemType || "Unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-foreground">
                {(project.area || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-primary">
                  {(project.carbonCredits || 0).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                {(() => {
                  const displayStatus = project.approvalStatus || project.status;
                  return (
                    <Badge
                      variant="outline"
                      className={cn("capitalize", statusColors[displayStatus])}
                    >
                      {displayStatus === "approved"
                        ? "Approved"
                        : displayStatus === "verified"
                        ? "Verified"
                        : displayStatus === "pending"
                        ? "Pending"
                        : displayStatus === "rejected"
                        ? "Rejected"
                        : displayStatus}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell>
                {project.transactionHash ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs font-mono text-muted-foreground hover:text-primary"
                  >
                    {project.transactionHash.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Not registered
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit?.(project)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(project)}
                      className="gap-2 text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
