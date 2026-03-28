"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  buildDepositTx,
  buildProposeWithdrawalTx,
  buildApproveTx,
  buildExecuteTx,
  CONTRACT_IDS,
  readContractValue,
  signAndSubmit,
} from "@/lib/soroban";
import {
  decodeBigInt,
  decodeTreasuryConfig,
  type TreasuryConfig,
} from "@/lib/contractData";
import {
  createLatestRequestGuard,
  isAbortError,
} from "@/lib/requestGuard";
import { classifyError, type AppError } from "@/lib/errors";
import { useFreighter } from "./useFreighter";

const REFRESH_INTERVAL = 30_000;

export function useTreasury() {
  const { address } = useFreighter();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [config, setConfig] = useState<TreasuryConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  // Tracks txIds currently being approved optimistically.
  // UI can reflect intent before chain confirmation.
  const [pendingApprovalIds, setPendingApprovalIds] = useState<ReadonlySet<number>>(
    new Set(),
  );

  const requestGuardRef = useRef(createLatestRequestGuard());

  const fetchBalance = useCallback(
    async (requestId: number, signal: AbortSignal) => {
      const result = await readContractValue(
        CONTRACT_IDS.treasury,
        "get_balance",
        [],
        {
          decoder: decodeBigInt,
          signal,
          sourceAddress: address ?? undefined,
        },
      );

      if (requestGuardRef.current.isCurrent(requestId)) {
        setBalance(result);
      }

      return result;
    },
    [address],
  );

  const fetchConfig = useCallback(
    async (requestId: number, signal: AbortSignal) => {
      const result = await readContractValue(
        CONTRACT_IDS.treasury,
        "get_config",
        [],
        {
          decoder: decodeTreasuryConfig,
          signal,
          sourceAddress: address ?? undefined,
        },
      );

      if (requestGuardRef.current.isCurrent(requestId)) {
        setConfig(result);
      }

      return result;
    },
    [address],
  );

  const getBalance = useCallback(async () => {
    const request = requestGuardRef.current.begin();

    try {
      const result = await fetchBalance(request.id, request.signal);

      if (requestGuardRef.current.isCurrent(request.id)) {
        setError(null);
      }

      return result;
    } catch (err: unknown) {
      if (isAbortError(err)) {
        throw err;
      }

      if (requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    }
  }, [fetchBalance]);

  const getConfig = useCallback(async () => {
    const request = requestGuardRef.current.begin();

    try {
      const result = await fetchConfig(request.id, request.signal);

      if (requestGuardRef.current.isCurrent(request.id)) {
        setError(null);
      }

      return result;
    } catch (err: unknown) {
      if (isAbortError(err)) {
        throw err;
      }

      if (requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    }
  }, [fetchConfig]);

  const refresh = useCallback(async () => {
    const request = requestGuardRef.current.begin();

    if (requestGuardRef.current.isCurrent(request.id)) {
      setIsLoading(true);
      setError(null);
    }

    try {
      await Promise.all([
        fetchBalance(request.id, request.signal),
        fetchConfig(request.id, request.signal),
      ]);
    } catch (err) {
      if (!isAbortError(err) && requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }
    } finally {
      if (requestGuardRef.current.isCurrent(request.id)) {
        setIsLoading(false);
      }
    }
  }, [fetchBalance, fetchConfig]);

  const deposit = async (amount: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");

    const request = requestGuardRef.current.begin();
    setError(null);
    setIsLoading(true);

    try {
      const tx = await buildDepositTx(CONTRACT_IDS.treasury, address, amount);
      const built = tx.build();
      await signAndSubmit(built);
      await fetchBalance(request.id, request.signal);
    } catch (err: unknown) {
      if (!isAbortError(err) && requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    } finally {
      if (requestGuardRef.current.isCurrent(request.id)) {
        setIsLoading(false);
      }
    }
  };

  const proposeWithdrawal = async (
    to: string,
    amount: number,
    memo: string,
  ): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");

    const request = requestGuardRef.current.begin();
    setError(null);
    setIsLoading(true);

    try {
      const tx = await buildProposeWithdrawalTx(
        CONTRACT_IDS.treasury,
        address,
        to,
        amount,
        memo,
      );
      const built = tx.build();
      await signAndSubmit(built);
      await fetchConfig(request.id, request.signal);
    } catch (err: unknown) {
      if (!isAbortError(err) && requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    } finally {
      if (requestGuardRef.current.isCurrent(request.id)) {
        setIsLoading(false);
      }
    }
  };

  const approve = async (txId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");

    // Optimistically mark this txId as pending so the UI reflects intent
    // immediately, before the chain confirms.
    setPendingApprovalIds((prev: ReadonlySet<number>) => new Set(Array.from(prev).concat(txId)));

    const request = requestGuardRef.current.begin();
    setError(null);
    setIsLoading(true);

    try {
      const tx = await buildApproveTx(CONTRACT_IDS.treasury, address, txId);
      const built = tx.build();
      await signAndSubmit(built);
      await Promise.all([
        fetchBalance(request.id, request.signal),
        fetchConfig(request.id, request.signal),
      ]);
    } catch (err: unknown) {
      // Rollback: the optimistic mark is deterministically removed on any failure.
      setPendingApprovalIds((prev: ReadonlySet<number>) => {
        const next = new Set(Array.from(prev));
        next.delete(txId);
        return next;
      });

      if (!isAbortError(err) && requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    } finally {
      // Remove from pending regardless of outcome — on success the refreshed
      // chain data will reflect the real approval count.
      setPendingApprovalIds((prev: ReadonlySet<number>) => {
        const next = new Set(Array.from(prev));
        next.delete(txId);
        return next;
      });

      if (requestGuardRef.current.isCurrent(request.id)) {
        setIsLoading(false);
      }
    }
  };

  const execute = async (txId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");

    const request = requestGuardRef.current.begin();
    setError(null);
    setIsLoading(true);

    try {
      const tx = await buildExecuteTx(CONTRACT_IDS.treasury, address, txId);
      const built = tx.build();
      await signAndSubmit(built);
      await Promise.all([
        fetchBalance(request.id, request.signal),
        fetchConfig(request.id, request.signal),
      ]);
    } catch (err: unknown) {
      if (!isAbortError(err) && requestGuardRef.current.isCurrent(request.id)) {
        setError(classifyError(err));
      }

      throw err;
    } finally {
      if (requestGuardRef.current.isCurrent(request.id)) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      requestGuardRef.current.cancel("Treasury refresh cancelled.");
    };
  }, [refresh]);

  useEffect(() => {
    return () => {
      requestGuardRef.current.dispose();
    };
  }, []);

  return {
    balance,
    config,
    isLoading,
    error,
    /** Set of txIds whose approval is in-flight. Use for optimistic UI. */
    pendingApprovalIds,
    getBalance,
    getConfig,
    deposit,
    proposeWithdrawal,
    approve,
    execute,
    refresh,
  };
}
