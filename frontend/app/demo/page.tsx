"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockDashboardStats, mockProjects } from "@/lib/mock-data";

export default function DemoDashboardPage() {
  const featuredProjects = mockProjects.slice(0, 4);

  const statusVariant = (status: string) => {
    switch (status) {
      case "verified":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
            Demo Preview
          </p>
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
            Blue Carbon Dashboard Demo
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Explore a sample dashboard experience without signing in. This demo uses mocked
            blue carbon projects and verification data so you can preview the platform instantly.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Try the Full Experience
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="gap-2">
                Back to Home
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold text-foreground">
                {mockDashboardStats.totalProjects}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Verified Projects</p>
              <p className="text-3xl font-bold text-foreground">
                {mockDashboardStats.verifiedProjects}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Pending Verifications</p>
              <p className="text-3xl font-bold text-foreground">
                {mockDashboardStats.pendingVerifications}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Total Carbon Credits</p>
              <p className="text-3xl font-bold text-foreground">
                {mockDashboardStats.totalCarbonCredits.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Sample Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              A quick preview of how projects appear in the dashboard.
            </p>
          </div>
          <Badge variant="outline">Demo mode - no login required</Badge>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-background/70">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Ecosystem</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Credits</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {featuredProjects.map((project) => (
                <tr key={project.id} className="odd:bg-card even:bg-background/80">
                  <td className="px-4 py-4 text-foreground">{project.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{project.location}</td>
                  <td className="px-4 py-4 text-muted-foreground capitalize">
                    {project.ecosystemType}
                  </td>
                  <td className="px-4 py-4 text-foreground">
                    {project.carbonCredits?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant(project.status || "pending")}>{project.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
