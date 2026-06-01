"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't protect the login page - it's public
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    // Check if user is authenticated for other admin pages
    const adminToken = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (!adminToken) {
      router.push("/admin/login");
      return;
    }
    
    setIsAuthorized(true);
    setLoading(false);
  }, [router, pathname]);

  // For login page, render without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin">⚙️</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
