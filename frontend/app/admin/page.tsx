"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, XCircle, Clock, Users, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AdminStats {
  totalProjects: number;
  pendingProjects: number;
  approvedProjects: number;
  rejectedProjects: number;
  totalDevelopers: number;
  totalAdmins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
    href,
  }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
    href?: string;
  }) => {
    const colorClass = {
      red: "bg-red-500/10 text-red-600",
      yellow: "bg-yellow-500/10 text-yellow-600",
      green: "bg-green-500/10 text-green-600",
      blue: "bg-blue-500/10 text-blue-600",
      purple: "bg-purple-500/10 text-purple-600",
    }[color];

    const content = (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </CardContent>
      </Card>
    );

    if (href) {
      return (
        <Link href={href} className="block">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage project approvals and monitor developers
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin text-2xl">⚙️</div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Pending Approval"
                value={stats.pendingProjects}
                icon={Clock}
                color="yellow"
                href="/admin/approvals"
              />
              <StatCard
                title="Approved Projects"
                value={stats.approvedProjects}
                icon={CheckCircle2}
                color="green"
                href="/admin/projects?status=approved"
              />
              <StatCard
                title="Rejected Projects"
                value={stats.rejectedProjects}
                icon={XCircle}
                color="red"
                href="/admin/projects?status=rejected"
              />
              <StatCard
                title="Total Projects"
                value={stats.totalProjects}
                icon={Leaf}
                color="blue"
              />
              <StatCard
                title="Developers"
                value={stats.totalDevelopers}
                icon={Users}
                color="purple"
                href="/admin/developers"
              />
              <StatCard
                title="Admin Users"
                value={stats.totalAdmins}
                icon={BarChart3}
                color="blue"
              />
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/admin/approvals">
                    <Clock className="h-4 w-4" />
                    Review Pending Projects ({stats.pendingProjects})
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/admin/developers">
                    <Users className="h-4 w-4" />
                    View All Developers
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/admin/projects">
                    <Leaf className="h-4 w-4" />
                    View All Projects
                  </Link>
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                📋 Approval Process
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  Review pending projects on the "Pending Approval" page
                </li>
                <li>
                  Approve projects if all information is complete and accurate
                </li>
                <li>
                  Reject projects with invalid data and provide feedback
                </li>
                <li>
                  Developers receive notifications for approval/rejection
                </li>
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
