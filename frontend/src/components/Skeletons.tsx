"use client";

import React from "react";
import { cn } from "./Shimmer";

// ── Base shimmer block ────────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/8",
        className
      )}
      aria-hidden="true"
    />
  );
}

// ── Metric card skeleton (dashboard, #323) ───────────────────────────────

/**
 * Compact skeleton for the three dashboard metric cards (Treasury Balance,
 * Active Proposals, Total Signers). Preserves card dimensions during initial
 * load and uses the same bg-white/10 pattern as RouteSkeleton.
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("card text-center animate-pulse", className)}
      aria-label="Loading metric"
      aria-busy="true"
    >
      <Bone className="h-3.5 w-28 mx-auto" />
      <Bone className="h-9 w-24 mx-auto mt-2" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ── Stats card skeleton (#114) ────────────────────────────────────────────

/**
 * Matches the layout of a single treasury / governance stats card:
 * icon slot + label + large value + optional sub-value.
 */
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("card flex items-start gap-4", className)}
      aria-label="Loading stat"
      aria-busy="true"
    >
      {/* Icon */}
      <Bone className="h-12 w-12 rounded-xl shrink-0" />

      <div className="flex-1 space-y-2 pt-1">
        {/* Label */}
        <Bone className="h-3.5 w-24" />
        {/* Value */}
        <Bone className="h-8 w-32" />
        {/* Sub-value */}
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Row of N stats card skeletons. */
export function StatsGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      role="status"
      aria-label="Loading statistics"
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ── List card skeleton ────────────────────────────────────────────────────

/**
 * Skeleton for a single list item card (proposal card, treasury entry, etc.)
 * Header row + two detail lines + action button placeholder.
 */
export function ListCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("card space-y-4", className)}
      aria-label="Loading item"
      aria-busy="true"
    >
      {/* Header row: title + badge */}
      <div className="flex items-center justify-between gap-4">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>

      {/* Description lines */}
      <div className="space-y-2">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-4/5" />
      </div>

      {/* Footer: meta + button */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex gap-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/** Stack of N list card skeletons. */
export function ListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ListCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────

interface TableSkeletonProps {
  /** Number of header columns. */
  cols?: number;
  /** Number of body rows. */
  rows?: number;
  className?: string;
}

/**
 * Skeleton for a sortable data table with header and rows.
 */
export function TableSkeleton({
  cols = 5,
  rows = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn("card overflow-hidden p-0", className)}
      role="status"
      aria-label="Loading table"
      aria-busy="true"
    >
      {/* Header */}
      <div className="flex gap-4 px-6 py-3 border-b border-white/5 bg-white/3">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone
            key={i}
            className={cn("h-3.5 rounded-md", i === 0 ? "w-1/4" : "flex-1")}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 px-6 py-4 border-b border-white/5 last:border-0"
        >
          {Array.from({ length: cols }).map((_, col) => (
            <Bone
              key={col}
              className={cn(
                "h-4 rounded-md",
                col === 0 ? "w-1/4" : "flex-1",
                // Vary widths slightly for a more realistic look
                col % 2 === 0 ? "opacity-80" : "opacity-60"
              )}
            />
          ))}
        </div>
      ))}

      <span className="sr-only">Loading…</span>
    </div>
  );
}
