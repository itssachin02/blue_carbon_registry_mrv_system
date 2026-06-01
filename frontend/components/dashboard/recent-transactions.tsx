"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import type { BlockchainTransaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: BlockchainTransaction[];
}

const statusIcons = {
  confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const typeLabels: Record<string, string> = {
  registration: "Project Registration",
  verification: "Verification",
  "credit-issuance": "Credit Issuance",
  transfer: "Credit Transfer",
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">
          Blockchain Transactions
        </CardTitle>
        <Link href="/verification">
          <Button variant="ghost" size="sm" className="gap-2 text-primary">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
          >
            <div className="flex items-center gap-3">
              {statusIcons[tx.status]}
              <div>
                <p className="font-medium text-foreground">
                  {typeLabels[tx.type]}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={cn(
                    tx.status === "confirmed" &&
                      "border-green-500/50 text-green-500",
                    tx.status === "pending" &&
                      "border-yellow-500/50 text-yellow-500",
                    tx.status === "failed" && "border-red-500/50 text-red-500"
                  )}
                >
                  {tx.status}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  Block #{tx.blockNumber}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
