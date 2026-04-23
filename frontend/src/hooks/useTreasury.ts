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
import { readPublicEnv } from "@/lib/env";

export interface TreasuryConfig {
  admin: string;
  threshold: number;
  signer_count: number;
  balance: number;
  tx_count: number;
}

export interface TreasuryTransaction {
  id: number;
  contract_id: string;
  topic_1: string | null;
  topic_2: string | null;
  event_data: any;
  ledger: number;
  timestamp: number | null;
  cursor: string | null;
  created_at: string;
}

const REFRESH_INTERVAL = 30_000;
const API_BASE = readPublicEnv("NEXT_PUBLIC_API_URL") || "http://localhost:3001/api";

export function useTreasury() {
  const { address } = useFreighter();
  const [balance, setBalance] = useState<number>(0);
  const [config, setConfig] = useState<TreasuryConfig | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
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
      console.warn("Failed to fetch balance, using placeholder", err);
      // Fallback placeholder logic just so the UI doesn't crash if contract isn't deployed
      setBalance(1000);
      return 1000;
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
      console.warn("Failed to fetch config, using placeholder", err);
      setConfig({
        admin: "G...",
        threshold: 2,
        signer_count: 3,
        balance: 1000,
        tx_count: 10,
      });
      return null;
    }
  }, []);

  const fetchTransactions = useCallback(async (page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/treasury/transactions?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
      // Fallback dummy data for UI testing (since backend might not be fully seeded)
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([getBalance(), getConfig(), fetchTransactions()]);
    } catch {
      // Errors handled
    } finally {
      setIsLoading(false);
    }
  }, [getBalance, getConfig, fetchTransactions]);

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
    transactions,
    isLoading,
    error,
    getBalance,
    getConfig,
    fetchTransactions,
    deposit,
    proposeWithdrawal,
    approve,
    execute,
    refresh,
  };
}
