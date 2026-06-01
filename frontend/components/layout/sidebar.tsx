"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileBarChart,
  Shield,
  CreditCard,
  Waves,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "MRV System", href: "/mrv", icon: FileBarChart },
  { name: "Verification", href: "/verification", icon: Shield },
  { name: "Carbon Credits", href: "/credits", icon: CreditCard },
  { name: "Trading", href: "/trading", icon: TrendingUp },
  { name: "Analytics", href: "/analytics", icon: FileBarChart },
];

// Removed secondaryNavigation - Settings permanently removed

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Load wallet address from localStorage
    const wallet = localStorage.getItem('walletAddress');
    if (wallet) {
      setWalletAddress(wallet);
    }
  }, []);

  // Prefetch important routes lightly on mount to reduce dev-time compiling latency.
  useEffect(() => {
    // Only prefetch in development to avoid unnecessary work in production
    if (process.env.NODE_ENV !== "development") return;

    const routesToPrefetch = navigation.map((n) => n.href);
    // Stagger prefetch to avoid spamming the dev server
    routesToPrefetch.forEach((r, i) => {
      setTimeout(() => {
        try {
          router.prefetch(r);
        } catch (e) {
          // ignore prefetch errors in older Next versions
        }
      }, 200 * i);
    });
  }, [router]);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Waves className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-foreground">
                OceanLedger MRV
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className={cn("mb-2", !collapsed && "px-2")}>
            {!collapsed && (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Main Menu
              </span>
            )}
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onMouseEnter={() => {
                  // Prefetch this route on hover to speed up navigation in dev
                  if (process.env.NODE_ENV === "development") {
                    try { router.prefetch(item.href); } catch (e) {}
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-border p-3">
          {!collapsed && user && walletAddress && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-600">
                  <User className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          {!collapsed && !user && !walletAddress && (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Loading...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              collapsed ? "px-2 justify-center" : "justify-start px-3"
            )}
            onClick={() => {
              // Clear authentication data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('walletAddress');
              // Redirect to login page
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
