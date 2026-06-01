"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Users,
  BarChart3,
  LogOut,
  Waves,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Zap,
  Coins,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const adminNavigation = [
  { name: "Pending Approvals", href: "/admin/approvals", icon: CheckCircle2 },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "MRV Verification", href: "/admin/mrv", icon: Zap },
  { name: "Carbon Credits", href: "/admin/credits", icon: Coins },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reports", href: "/admin/reports", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
              <Waves className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-foreground">
                Admin Panel
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

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className={cn("mb-2", !collapsed && "px-2")}>
            {!collapsed && (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Admin Menu
              </span>
            )}
          </div>
          {adminNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-600/10 text-red-600"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              collapsed ? "px-2 justify-center" : "justify-start px-3"
            )}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("walletAddress");
              window.location.href = "/login";
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
