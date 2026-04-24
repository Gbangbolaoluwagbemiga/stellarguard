"use client";

import { useEffect, useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";

interface CopyButtonProps {
  value: string;
  label: string;
  className?: string;
}

export function CopyButton({ value, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    try {
      setError(null);
      await copyTextToClipboard(value);
      setCopied(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Copy failed");
    }
  };

  const statusLabel = copied ? "Copied" : "Copy";
  const ariaLabel = copied
    ? `${label} copied to clipboard`
    : `Copy ${label} to clipboard`;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      title={error ?? `${statusLabel} ${label}`}
      className={`text-xs px-2 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
    >
      {error ? "Retry" : statusLabel}
    </button>
  );
}
