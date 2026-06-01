"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeasurementData {
  _id: string;
  projectName: string;
  measurementDate: string;
  areaMonitored: number;
  growthRate: number;
  co2AbsorptionRate: number;
  dataSource: string;
  calculatedCO2Absorbed: number;
  carbonCreditsGenerated: number;
  status: "submitted" | "calculated" | "verified" | "rejected";
}

interface MeasurementTableProps {
  measurements: MeasurementData[];
  loading: boolean;
  onRefresh: () => void;
}

export function MeasurementTable({
  measurements,
  loading,
  onRefresh,
}: MeasurementTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "calculated":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-500/10 text-green-700 border-green-500/30";
      case "calculated":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
      case "rejected":
        return "bg-red-500/10 text-red-700 border-red-500/30";
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading measurements...</p>
        </div>
      </Card>
    );
  }

  if (measurements.length === 0) {
    return (
      <Card className="bg-card border-border">
        <div className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No measurements yet. Record your first measurement to get started!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Area (ha)</TableHead>
              <TableHead className="font-semibold text-right">Growth %</TableHead>
              <TableHead className="font-semibold text-right">CO₂ Absorbed</TableHead>
              <TableHead className="font-semibold text-right">Credits</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.map((measurement) => (
              <TableRow key={measurement._id} className="hover:bg-secondary/30">
                <TableCell className="font-medium text-foreground">
                  {measurement.projectName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(measurement.measurementDate)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {measurement.areaMonitored}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {measurement.growthRate}%
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-green-600">
                    {measurement.calculatedCO2Absorbed.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground"> tCO₂e</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-teal-600">
                    {measurement.carbonCreditsGenerated}
                  </span>
                </TableCell>
                <TableCell className="capitalize text-sm text-muted-foreground">
                  {measurement.dataSource === "combined" ? "Multi-source" : measurement.dataSource}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("flex items-center gap-1 w-fit", getStatusColor(measurement.status))}
                  >
                    {getStatusIcon(measurement.status)}
                    <span className="capitalize text-xs">{measurement.status}</span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
