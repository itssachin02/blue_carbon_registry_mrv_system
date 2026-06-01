"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Leaf } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentProjectsProps {
  projects: Project[];
}

const ecosystemIcons: Record<string, string> = {
  mangrove: "bg-chart-1/20 text-chart-1",
  seagrass: "bg-chart-2/20 text-chart-2",
  saltmarsh: "bg-chart-3/20 text-chart-3",
  kelp: "bg-chart-4/20 text-chart-4",
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-2 text-primary">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.slice(0, 5).map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  ecosystemIcons[project.ecosystemType]
                )}
              >
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{project.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {project.location}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {project.carbonCredits.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Carbon Credits</p>
              </div>
              <Badge
                variant={project.status === "verified" ? "default" : "secondary"}
                className={cn(
                  project.status === "verified" &&
                    "bg-green-500/20 text-green-500 hover:bg-green-500/30",
                  project.status === "pending" &&
                    "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                )}
              >
                {project.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
