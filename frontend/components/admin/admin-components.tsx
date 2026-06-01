"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

// Admin Card Component
export function AdminCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = "",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string; isPositive: boolean };
  className?: string;
}) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-all ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8 text-red-500 opacity-80" />}
      </div>
      {trend && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <span
            className={`text-sm font-semibold ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend.isPositive ? "+" : "-"}{trend.value}%
          </span>
          <span className="text-slate-400 text-xs">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// Admin Table Component
export function AdminTable({
  headers,
  rows,
  onRowClick,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  onRowClick?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-6 py-4 text-left text-sm font-semibold text-slate-300 bg-slate-900/50"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(rowIndex)}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 text-sm text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge
export function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected" | "active" | "blocked";
}) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
    active: "bg-green-500/20 text-green-400 border border-green-500/30",
    blocked: "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Modal Component
export function AdminModal({
  title,
  isOpen,
  onClose,
  children,
  actions,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex gap-3 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading Spinner
export function AdminSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
    </div>
  );
}

// Empty State
export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
