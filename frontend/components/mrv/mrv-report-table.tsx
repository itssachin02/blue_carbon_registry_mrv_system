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
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { MRVReport } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MRVReportTableProps {
  reports: MRVReport[];
  onView?: (report: MRVReport) => void;
  onApprove?: (report: MRVReport) => void;
  onReject?: (report: MRVReport) => void;
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; className: string; label: string }
> = {
  submitted: {
    icon: <Clock className="h-4 w-4" />,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    label: "Submitted",
  },
  "under-review": {
    icon: <AlertCircle className="h-4 w-4" />,
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    label: "Under Review",
  },
  approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    className: "bg-green-500/20 text-green-400 border-green-500/50",
    label: "Approved",
  },
  rejected: {
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-red-500/20 text-red-400 border-red-500/50",
    label: "Rejected",
  },
};

const reportTypeConfig: Record<string, { className: string; label: string }> = {
  monitoring: {
    className: "bg-teal-500/20 text-teal-400 border-teal-500/50",
    label: "Monitoring",
  },
  verification: {
    className: "bg-primary/20 text-primary border-primary/50",
    label: "Verification",
  },
  baseline: {
    className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
    label: "Baseline",
  },
};

export function MRVReportTable({
  reports,
  onView,
  onApprove,
  onReject,
}: MRVReportTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Report</TableHead>
            <TableHead className="text-muted-foreground">Project</TableHead>
            <TableHead className="text-muted-foreground">Type</TableHead>
            <TableHead className="text-muted-foreground">Methodology</TableHead>
            <TableHead className="text-muted-foreground">Carbon (tCO2e)</TableHead>
            <TableHead className="text-muted-foreground">Submitted</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const status = statusConfig[report.status];
            const reportType = reportTypeConfig[report.reportType];

            return (
              <TableRow
                key={report.id}
                className="border-border hover:bg-secondary/50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {report.fileName || `Report ${report.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {report.id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {report.projectName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(reportType.className)}>
                    {reportType.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">
                    {report.methodology}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">
                    {report.carbonSequestered.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(report.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("gap-1", status.className)}
                  >
                    {status.icon}
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onView?.(report)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Report
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      {(report.status === "submitted" ||
                        report.status === "under-review") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onApprove?.(report)}
                            className="gap-2 text-green-500"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReject?.(report)}
                            className="gap-2 text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
