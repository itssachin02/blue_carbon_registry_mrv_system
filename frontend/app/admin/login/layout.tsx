"use client";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check here - login page is public
  return children;
}
