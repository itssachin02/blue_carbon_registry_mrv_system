"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Box,
  FileCheck,
  Send,
  FileSignature,
} from "lucide-react";
import type { BlockchainTransaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  transactions: BlockchainTransaction[];
}

const statusConfig = {
  confirmed: {
    icon: <CheckCircle className="h-4 w-4" />,
    className: "bg-green-500/20 text-green-500 border-green-500/50",
    label: "Confirmed",
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
    label: "Pending",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-red-500/20 text-red-500 border-red-500/50",
    label: "Failed",
  },
};

const typeConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  registration: {
    icon: <FileSignature className="h-4 w-4" />,
    label: "Project Registration",
    color: "text-blue-400",
  },
  verification: {
    icon: <FileCheck className="h-4 w-4" />,
    label: "Verification",
    color: "text-green-400",
  },
  "credit-issuance": {
    icon: <Box className="h-4 w-4" />,
    label: "Credit Issuance",
    color: "text-teal-400",
  },
  transfer: {
    icon: <Send className="h-4 w-4" />,
    label: "Credit Transfer",
    color: "text-primary",
  },
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => {
            const status = statusConfig[tx.status];
            const type = typeConfig[tx.type];

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-secondary",
                      type.color
                    )}
                  >
                    {type.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{type.label}</p>
                      <Badge
                        variant="outline"
                        className={cn("gap-1 text-xs", status.className)}
                      >
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="font-mono text-xs text-muted-foreground">
                        {tx.transactionHash.slice(0, 14)}...
                        {tx.transactionHash.slice(-8)}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        Block #{tx.blockNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={`https://polygonscan.com/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Box className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Transactions will appear here once projects are verified.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
