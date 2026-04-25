"use client";

import React, { useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "./Shimmer";

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. 0 = no auto-dismiss. Default 5000. */
  duration?: number;
}

// ── Store (simple module-level singleton) ──────────────────────────────────

type Listener = (toasts: ToastItem[]) => void;

let _toasts: ToastItem[] = [];
const _listeners: Set<Listener> = new Set();

function notify() {
  _listeners.forEach((fn) => fn([..._toasts]));
}

export const toast = {
  show(item: Omit<ToastItem, "id">): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    _toasts = [..._toasts, { ...item, id }];
    notify();
    return id;
  },
  success(title: string, description?: string) {
    return toast.show({ variant: "success", title, description });
  },
  error(title: string, description?: string) {
    return toast.show({ variant: "error", title, description, duration: 8000 });
  },
  warning(title: string, description?: string) {
    return toast.show({ variant: "warning", title, description });
  },
  info(title: string, description?: string) {
    return toast.show({ variant: "info", title, description });
  },
  dismiss(id: string) {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  },
  dismissAll() {
    _toasts = [];
    notify();
  },
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useToasts() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([..._toasts]);

  useEffect(() => {
    const fn: Listener = (next) => setToasts(next);
    _listeners.add(fn);
    return () => {
      _listeners.delete(fn);
    };
  }, []);

  return toasts;
}

// ── Single toast item ──────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10",
  error: "border-red-500/40 bg-red-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  info: "border-primary-500/40 bg-primary-500/10",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-primary-400",
};

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItemComponent({ item }: { item: ToastItem }) {
  const Icon = ICONS[item.variant];
  const duration = item.duration ?? 5000;

  const dismiss = useCallback(() => toast.dismiss(item.id), [item.id]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  return (
    <div
      role="alert"
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-xl border px-4 py-3",
        "backdrop-blur-xl shadow-glass",
        "animate-in slide-in-from-right-5 fade-in duration-300",
        VARIANT_STYLES[item.variant]
      )}
    >
      <Icon
        size={18}
        className={cn("mt-0.5 shrink-0", ICON_STYLES[item.variant])}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{item.description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-gray-500 hover:text-white transition-colors rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Container (mount once in layout) ──────────────────────────────────────

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastItemComponent item={item} />
        </div>
      ))}
    </div>
  );
}
