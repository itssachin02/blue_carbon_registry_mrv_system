"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, Loader } from "lucide-react";

interface Transaction {
  _id: string;
  type: "buy" | "issue" | "retire";
  from: string;
  to: string;
  amount: number;
  date: string;
  status: "confirmed" | "pending";
  hash?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.hash && tx.hash.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "buy":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "issue":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "retire":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <ArrowUpRight className="h-4 w-4" />;
      case "retire":
        return <ArrowDownLeft className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "buy":
        return "Purchase";
      case "issue":
        return "Issue";
      case "retire":
        return "Retire";
      default:
        return type;
    }
  };
  const stats = {
    total: transactions.length,
    purchases: transactions.filter((t) => t.type === "buy").length,
    issued: transactions.filter((t) => t.type === "issue").length,
    retirements: transactions.filter((t) => t.type === "retire").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ArrowUpRight className="h-8 w-8 text-purple-500" />
          Blockchain Transactions
        </h1>
        <p className="text-muted-foreground mt-1">
          View all carbon credit transactions on the blockchain
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.purchases}</div>
            <p className="text-xs text-muted-foreground mt-1">Credit trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.issued}</div>
            <p className="text-xs text-muted-foreground mt-1">New credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retirements</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.retirements}</div>
            <p className="text-xs text-muted-foreground mt-1">Credits retired</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by sender, receiver, or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(tx.type)}
                            <Badge className={`${getTypeColor(tx.type)} border`}>
                              {getTypeLabel(tx.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{tx.from}</TableCell>
                        <TableCell className="text-sm">{tx.to}</TableCell>
                        <TableCell className="font-semibold">{tx.amount} credits</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border ${
                              tx.status === "confirmed"
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            }`}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {loading ? "Loading..." : "No transactions found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-base">Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 border mt-0.5">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Purchase
            </Badge>
            <p className="text-muted-foreground">User purchases carbon credits</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-green-500/10 text-green-700 border-green-500/20 border mt-0.5">
              Issue
            </Badge>
            <p className="text-muted-foreground">New credits issued for approved projects</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-red-500/10 text-red-700 border-red-500/20 border mt-0.5">
              <ArrowDownLeft className="h-3 w-3 mr-1" />
              Retire
            </Badge>
            <p className="text-muted-foreground">Carbon credits retired from circulation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
