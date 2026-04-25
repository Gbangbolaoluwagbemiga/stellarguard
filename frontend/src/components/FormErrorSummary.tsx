"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "./Shimmer";

export interface FormError {
  field?: string;
  message: string;
}

interface FormErrorSummaryProps {
  /** List of errors to display. Renders nothing when empty or undefined. */
  errors?: FormError[];
  /** Optional heading. Defaults to "Please fix the following errors:". */
  heading?: string;
  className?: string;
}

/**
 * Inline error summary for modal and form flows.
 *
 * - Rendered above the submit button so it is visible without scrolling.
 * - Uses `role="alert"` + `aria-live="assertive"` so screen readers announce
 *   errors immediately when they appear.
 * - Focuses itself on mount when there are errors so keyboard users land on it.
 */
export function FormErrorSummary({
  errors,
  heading = "Please fix the following errors:",
  className,
}: FormErrorSummaryProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const hasErrors = Array.isArray(errors) && errors.length > 0;

  React.useEffect(() => {
    if (hasErrors && ref.current) {
      ref.current.focus();
    }
  }, [hasErrors]);

  if (!hasErrors) return null;

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={cn(
        "rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 space-y-2",
        "focus:outline-none",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          size={16}
          className="text-red-400 shrink-0"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-red-300">{heading}</p>
      </div>

      {errors!.length === 1 && !errors![0].field ? (
        <p className="text-xs text-red-400 leading-relaxed pl-6">
          {errors![0].message}
        </p>
      ) : (
        <ul className="pl-6 space-y-1 list-disc list-inside" aria-label="Form errors">
          {errors!.map((err, i) => (
            <li key={i} className="text-xs text-red-400 leading-relaxed">
              {err.field ? (
                <>
                  <span className="font-medium text-red-300">{err.field}:</span>{" "}
                  {err.message}
                </>
              ) : (
                err.message
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
