"use client";

import { Bell, Search, Plus, Wallet, X, CheckCheck, Trash2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddProjectModal } from "@/components/projects/add-project-modal";
import { toast } from "@/hooks/use-toast";
import { isMetaMaskInstalled, requestAccount } from "@/lib/web3";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  projectId?: {
    _id: string;
    name: string;
  };
}

interface HeaderProps {
  title: string;
  description?: string;
  onSearch?: (query: string) => void;
}

export function Header({ title, description, onSearch }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // Load wallet and fetch notifications on mount
  useEffect(() => {
    // Load wallet from localStorage (same as sidebar)
    const wallet = localStorage.getItem("walletAddress");
    if (wallet) {
      setWalletAddress(wallet);
    }

    // Fetch notifications
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectWallet = async () => {
    if (walletLoading) return;
    setWalletLoading(true);

    try {
      if (!isMetaMaskInstalled()) {
        toast({
          title: "MetaMask not installed",
          description: "Install MetaMask or use a supported wallet extension.",
          variant: "destructive",
        });
        return;
      }

      const account = await requestAccount();
      setWalletAddress(account);
      localStorage.setItem("walletAddress", account);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      toast({
        title: "Wallet Connection Failed",
        description: error?.message || "Unable to connect wallet.",
        variant: "destructive",
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);

        // Count unread
        const unread = data.notifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const notification = notifications.find((n) => n._id === notificationId);
        setNotifications(notifications.filter((n) => n._id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all/read`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      verification_request: "🔍",
      transaction_confirmed: "✅",
      mrv_report_approved: "📋",
      project_created: "🌱",
      credit_transfer: "💚",
      trading_offer: "💰",
      system_alert: "⚠️",
    };
    return icons[type] || "📬";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleAddProject = async (formData: any, file?: File) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Authentication required. Please login again.");
        return;
      }

      const createUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/projects`;
      let response;
      let responseData;

      if (file) {
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("description", formData.description);
        payload.append("location", formData.location);
        payload.append("area", String(formData.area));
        payload.append("carbonCredits", String(formData.carbonCredits));
        payload.append("ecosystemType", formData.ecosystemType);
        payload.append("latitude", String(formData.latitude));
        payload.append("longitude", String(formData.longitude));
        payload.append("file", file);

        response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: payload,
        });
      } else {
        response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      responseData = await response.json();

      if (!response.ok) {
        alert(`❌ Error: ${responseData.error || responseData.msg || "Failed to create project"}`);
        console.error("Project creation error:", responseData);
        return;
      }

      const projectId = responseData.project?._id || responseData.project?.id || responseData._id || responseData.id;
      const proofUploadResult = responseData.proofUploadResult;

      if (file && proofUploadResult) {
        if (proofUploadResult.error) {
          alert(`✅ Project created, but proof upload failed: ${proofUploadResult.error}`);
        } else {
          alert(`✅ Project created! Proof file pinned to Pinata. IPFS Hash: ${proofUploadResult.ipfsHash}`);
        }
      } else {
        alert("✅ Project created successfully!");
      }

      setAddProjectModalOpen(false);
      window.location.href = "/projects";
    } catch (error) {
      alert("❌ Error creating project. Check console for details.");
      console.error("Error creating project:", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="w-64 bg-secondary pl-9"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (onSearch) {
                onSearch(e.target.value);
              }
            }}
          />
        </div>

        {/* Wallet Connection */}
        {walletAddress ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50"
              >
                <div className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden sm:inline text-xs font-semibold">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <span className="sm:hidden">
                  <Wallet className="h-4 w-4" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-center py-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Wallet Connected</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Crypto Address</p>
                  <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono break-all text-foreground max-w-[85%]">
                      {walletAddress}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ✓ Each user has a unique blockchain address
                  </p>
                </div>
              </div>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-xs text-muted-foreground cursor-help py-2">
                💡 Your wallet is used for carbon credit transactions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={connectWallet}
            disabled={walletLoading}
          >
            {walletLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Approve in MetaMask</span>
                <span className="sm:hidden">Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </>
            )}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <div className="flex items-center justify-between px-4 py-2">
              <DropdownMenuLabel>Notifications ({unreadCount} new)</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-0 text-xs"
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-3 border-b p-3 transition-colors last:border-0 ${
                      notification.isRead
                        ? "bg-background hover:bg-secondary/30"
                        : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        notification.isRead
                          ? "text-muted-foreground"
                          : "text-foreground font-semibold"
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="h-6 w-6 p-0"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification._id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add New */}
        <Button 
          size="sm" 
          className="gap-2"
          onClick={() => setAddProjectModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </Button>
        </div>
      </header>

      <AddProjectModal 
        open={addProjectModalOpen}
        onOpenChange={setAddProjectModalOpen}
        onSubmit={handleAddProject}
      />
    </>
  );
}
