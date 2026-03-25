"use client";

import { useState, useEffect, useCallback } from "react";
import {
  buildDepositTx,
  buildProposeWithdrawalTx,
  buildApproveTx,
  buildExecuteTx,
  CONTRACT_IDS,
  readContractValue,
  signAndSubmit,
} from "@/lib/soroban";
import { useFreighter } from "./useFreighter";

export interface TreasuryConfig {
  admin: string;
  threshold: number;
  signer_count: number;
  balance: number;
  tx_count: number;
}

const REFRESH_INTERVAL = 30_000;

export function useTreasury() {
  const { address } = useFreighter();
  const [balance, setBalance] = useState<number>(0);
  const [config, setConfig] = useState<TreasuryConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getBalance = useCallback(async () => {
    try {
      const result = await readContractValue(
        CONTRACT_IDS.treasury,
        "get_balance",
        []
      );
      const val = Number(result);
      setBalance(val);
      return val;
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance");
      throw err;
    }
  }, []);

  const getConfig = useCallback(async () => {
    try {
      const result = await readContractValue(
        CONTRACT_IDS.treasury,
        "get_config",
        []
      );
      setConfig(result);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to fetch config");
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([getBalance(), getConfig()]);
    } catch {
      // Errors already handled in individual functions
    } finally {
      setIsLoading(false);
    }
  }, [getBalance, getConfig]);

  const deposit = async (amount: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildDepositTx(CONTRACT_IDS.treasury, address, amount);
      const built = tx.build();
      await signAndSubmit(built);
      await getBalance();
    } catch (err: any) {
      setError(err.message || "Deposit failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const proposeWithdrawal = async (
    to: string,
    amount: number,
    memo: string
  ): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildProposeWithdrawalTx(
        CONTRACT_IDS.treasury,
        address,
        to,
        amount,
        memo
      );
      const built = tx.build();
      await signAndSubmit(built);
      await getConfig();
    } catch (err: any) {
      setError(err.message || "Propose withdrawal failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approve = async (txId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildApproveTx(CONTRACT_IDS.treasury, address, txId);
      const built = tx.build();
      await signAndSubmit(built);
      await refresh();
    } catch (err: any) {
      setError(err.message || "Approve failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const execute = async (txId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildExecuteTx(CONTRACT_IDS.treasury, address, txId);
      const built = tx.build();
      await signAndSubmit(built);
      await refresh();
    } catch (err: any) {
      setError(err.message || "Execute failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    balance,
    config,
    isLoading,
    error,
    getBalance,
    getConfig,
    deposit,
    proposeWithdrawal,
    approve,
    execute,
    refresh,
  };
}
