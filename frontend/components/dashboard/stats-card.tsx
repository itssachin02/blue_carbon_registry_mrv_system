"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  description,
}: StatsCardProps) {
  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {(change || description) && (
              <div className="flex items-center gap-2">
                {change && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      changeType === "positive" && "text-green-500",
                      changeType === "negative" && "text-red-500",
                      changeType === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {change}
                  </span>
                )}
                {description && (
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10",
              iconColor
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
