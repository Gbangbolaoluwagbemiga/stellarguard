"use client";

import { useState, useEffect, useCallback } from "react";
import { nativeToScVal, Address } from "@stellar/stellar-sdk";
import {
  CONTRACT_IDS,
  readContractValue,
  signAndSubmit,
  buildCreateProposalTx,
  buildVoteTx,
  buildFinalizeTx,
  buildExecuteProposalTx,
} from "@/lib/soroban";
import { useFreighter } from "./useFreighter";

export interface GovConfig {
  admin: string;
  member_count: number;
  quorum_percent: number;
  voting_period: number;
  proposal_count: number;
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  action: string;
  proposer: string;
  votes_for: number;
  votes_against: number;
  total_votes: number;
  status: string;
  created_at: number;
  ends_at: number;
  amount: number;
  target: string;
}

const REFRESH_INTERVAL = 30_000;

export function useGovernance() {
  const { address } = useFreighter();
  const [config, setConfig] = useState<GovConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getConfig = useCallback(async () => {
    try {
      const result = await readContractValue(
        CONTRACT_IDS.governance,
        "get_config",
        []
      );
      setConfig(result);
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to fetch governance config");
      throw err;
    }
  }, []);

  const getProposal = async (id: number): Promise<Proposal> => {
    setError(null);
    try {
      const result = await readContractValue(
        CONTRACT_IDS.governance,
        "get_proposal",
        [nativeToScVal(id, { type: "u64" })]
      );
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposal");
      throw err;
    }
  };

  const createProposal = async (
    title: string,
    description: string,
    action: string,
    amount: number,
    target: string
  ): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildCreateProposalTx(
        CONTRACT_IDS.governance,
        address,
        title,
        description,
        action,
        amount,
        target
      );
      const built = tx.build();
      await signAndSubmit(built);
      await getConfig();
    } catch (err: any) {
      setError(err.message || "Failed to create proposal");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const vote = async (proposalId: number, voteFor: boolean): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildVoteTx(
        CONTRACT_IDS.governance,
        address,
        proposalId,
        voteFor
      );
      const built = tx.build();
      await signAndSubmit(built);
    } catch (err: any) {
      setError(err.message || "Failed to vote");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const finalize = async (proposalId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildFinalizeTx(
        CONTRACT_IDS.governance,
        address,
        proposalId
      );
      const built = tx.build();
      await signAndSubmit(built);
      await getConfig();
    } catch (err: any) {
      setError(err.message || "Failed to finalize proposal");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeProposal = async (proposalId: number): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    setIsLoading(true);
    try {
      const tx = await buildExecuteProposalTx(
        CONTRACT_IDS.governance,
        address,
        proposalId
      );
      const built = tx.build();
      await signAndSubmit(built);
      await getConfig();
    } catch (err: any) {
      setError(err.message || "Failed to execute proposal");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasVoted = async (proposalId: number): Promise<boolean> => {
    if (!address) throw new Error("Wallet not connected");
    setError(null);
    try {
      const result = await readContractValue(
        CONTRACT_IDS.governance,
        "has_voted",
        [
          nativeToScVal(proposalId, { type: "u64" }),
          nativeToScVal(Address.fromString(address), { type: "address" }),
        ]
      );
      return Boolean(result);
    } catch (err: any) {
      setError(err.message || "Failed to check vote status");
      throw err;
    }
  };

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await getConfig();
    } catch {
      // Error already handled in getConfig
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    config,
    isLoading,
    error,
    getConfig,
    getProposal,
    createProposal,
    vote,
    finalize,
    executeProposal,
    hasVoted,
    refresh,
  };
}
