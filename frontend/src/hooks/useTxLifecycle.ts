"use client";

import { useState, useCallback, useRef } from "react";
import { type AppError, classifyError } from "@/lib/errors";

/**
 * Lifecycle stages of a Soroban transaction, in order.
 *
 *  idle → building → signing → submitting → confirming → success
 *                                                       ↘ error
 */
export type TxStage =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface TxState {
  /** Current lifecycle stage. */
  stage: TxStage;
  /** Structured error when stage === "error", null otherwise. */
  error: AppError | null;
  /** Whether the user can meaningfully retry the failed action. */
  canRetry: boolean;
}

/** Human-readable label per stage, for step indicators and toasts. */
export const TX_STAGE_LABELS: Record<TxStage, string> = {
  idle: "Ready",
  building: "Building transaction…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to network…",
  confirming: "Confirming on chain…",
  success: "Transaction confirmed",
  error: "Transaction failed",
};

const IDLE_STATE: TxState = { stage: "idle", error: null, canRetry: false };

/**
 * Manages the full async lifecycle of a single Soroban transaction.
 *
 * Usage:
 * ```ts
 * const { state, run, reset } = useTxLifecycle();
 *
 * await run({
 *   build: async () => {
 *     const tx = await buildApproveTx(...);
 *     return tx.build();
 *   },
 *   sign: (built) => signAndSubmit(built),
 *   onSuccess: () => refresh(),
 * });
 * ```
 *
 * Each call to `run()` gets a monotonic run-ID so that stale async
 * callbacks from a superseded call cannot mutate state.
 */
export function useTxLifecycle() {
  const [state, setState] = useState<TxState>(IDLE_STATE);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    setState(IDLE_STATE);
  }, []);

  const run = useCallback(
    async <TBuilt = unknown, TResult = unknown>(steps: {
      /** Constructs the transaction (or any async setup). */
      build: () => Promise<TBuilt>;
      /**
       * Signs and submits the built transaction.
       * Spans the signing → submitting → confirming stages.
       */
      sign: (built: TBuilt) => Promise<TResult>;
      /** Called with the result after the chain confirms. */
      onSuccess?: (result: TResult) => void;
    }): Promise<TResult> => {
      const runId = ++runIdRef.current;

      const setStage = (stage: TxStage) => {
        if (runIdRef.current === runId) {
          setState({ stage, error: null, canRetry: false });
        }
      };

      try {
        setStage("building");
        const built = await steps.build();

        setStage("signing");
        // signing and submitting are sequential but happen inside signAndSubmit;
        // we advance to "submitting" immediately after the sign call resolves so
        // the UI shows deterministic progress.
        setStage("submitting");
        const result = await steps.sign(built);

        setStage("confirming");

        if (runIdRef.current === runId) {
          setState({ stage: "success", error: null, canRetry: false });
          steps.onSuccess?.(result);
        }

        return result;
      } catch (err: unknown) {
        if (runIdRef.current === runId) {
          const appError = classifyError(err);
          setState({ stage: "error", error: appError, canRetry: appError.recoverable });
        }
        throw err;
      }
    },
    [],
  );

  return { state, run, reset };
}
