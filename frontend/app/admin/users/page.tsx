"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserCheck, UserX, Shield, Eye, Loader } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status: "active" | "blocked";
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching users from API...");
      
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 API Response Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Raw API Response:", data);
        
        let parsedUsers = Array.isArray(data) ? data : data.users || [];
        console.log("👥 Before mapping:", parsedUsers);

        // Map new user state
        parsedUsers = parsedUsers.map((user: any) => {
          let status: "active" | "blocked" = "active";
          if (user.isBlocked) status = "blocked";

          return {
            ...user,
            role: user.role || "developer",
            status,
          };
        });

        console.log("✅ Users loaded and mapped:", parsedUsers.length, parsedUsers);
        setUsers(parsedUsers);
      } else {
        const errorData = await response.text();
        console.error("❌ API Error Response:", response.status, errorData);
        setUsers([]);
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }


  const handleBlockUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser._id}/block`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u._id === selectedUser._id ? { ...u, status: "blocked" } : u
          )
        );
        setShowDetailDialog(false);
        alert("✅ User blocked successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "API error");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("❌ Error blocking user: " + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser._id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u._id === selectedUser._id ? { ...u, status: "active" } : u
          )
        );
        setShowDetailDialog(false);
        alert("✅ User approved successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "API error");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      alert("❌ Error approving user: " + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser._id}/unblock`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u._id === selectedUser._id ? { ...u, status: "active" } : u
          )
        );
        setShowDetailDialog(false);
        alert("✅ User unblocked successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "API error");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("❌ Error unblocking user: " + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const nonAdminUsers = users.filter(
    (u) => (u.role || "").toLowerCase() !== "admin"
  );
  const totalUsersCount = nonAdminUsers.length;
  const activeUsersCount = nonAdminUsers.filter((u) => u.status === "active").length;
  const blockedUsersCount = nonAdminUsers.filter((u) => u.status === "blocked").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-500" />
            Users Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and their permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {totalUsersCount}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-green-500 mt-2">
                  {activeUsersCount}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="text-3xl font-bold text-red-500 mt-2">
                  {blockedUsersCount}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonAdminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    nonAdminUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role || "User"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status === "active"
                                ? "bg-green-500/10 text-green-700 border-green-500/30"
                                : "bg-red-500/10 text-red-700 border-red-500/30"
                            }
                          >
                            {user.status === "active" ? "✓ Active" : "✗ Blocked"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailDialog(true);
                            }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Manage user account and settings</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-card p-4 rounded-lg space-y-3 border">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    NAME
                  </label>
                  <p className="text-foreground font-medium mt-1">
                    {selectedUser.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    EMAIL
                  </label>
                  <p className="text-foreground font-medium mt-1">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    ROLE
                  </label>
                  <p className="text-foreground font-medium mt-1">
                    {selectedUser.role || "User"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    STATUS
                  </label>
                  <Badge
                    className={`mt-1 ${
                      selectedUser.status === "active"
                        ? "bg-green-500/10 text-green-700"
                        : "bg-red-500/10 text-red-700"
                    }`}
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    JOINED
                  </label>
                  <p className="text-foreground font-medium mt-1">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedUser.status === "pending" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={handleApproveUser}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Approve User
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleBlockUser}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Blocking...
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Block User
                        </>
                      )}
                    </Button>
                  </>
                )}

                {selectedUser.status === "active" && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleBlockUser}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Blocking...
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Block User
                      </>
                    )}
                  </Button>
                )}

                {selectedUser.status === "blocked" && (
                  <Button
                    className="flex-1"
                    onClick={handleUnblockUser}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Unblocking...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unblock User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
