"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckCircle,
  FolderKanban,
  Users,
  ArrowRightLeft,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Bell,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Pending Approvals",
    href: "/admin/approvals",
    icon: CheckCircle,
    badge: "5",
  },
  {
    label: "All Projects",
    href: "/admin/projects",
    icon: FolderKanban,
    badge: null,
  },
  {
    label: "Users Management",
    href: "/admin/users",
    icon: Users,
    badge: null,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ArrowRightLeft,
    badge: null,
  },
  {
    label: "Activity Logs",
    href: "/admin/logs",
    icon: Activity,
    badge: null,
  },
];

export function AdminSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 fixed h-full z-40`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">BlueCarbon</span>
                <span className="text-xs text-red-400">Admin</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                  title={!sidebarOpen ? item.label : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/admin/settings">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              title={!sidebarOpen ? "Settings" : ""}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Settings</span>}
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-all duration-200"
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        {/* Top Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <span className="text-sm text-slate-300">Admin</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-950">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
