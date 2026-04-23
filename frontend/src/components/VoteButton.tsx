"use client";

import { useState, useEffect } from "react";
import { useGovernance } from "@/hooks/useGovernance";
import { toast } from "react-hot-toast";

interface VoteButtonProps {
  /** Proposal ID */
  proposalId: number;
  /** Vote direction */
  voteFor: boolean;
  /** Whether voting is closed */
  votingClosed?: boolean;
  /** Callback after vote is submitted (optional) */
  onVoteSuccess?: () => void;
}

/**
 * Button component for casting votes on governance proposals.
 * Handles loading states, disabled states, optimistic pending state,
 * and visual feedback.
 */
export function VoteButton({
  proposalId,
  voteFor,
  votingClosed = false,
  onVoteSuccess,
}: VoteButtonProps) {
  const { vote, hasVoted: checkHasVoted, isLoading: isVoting } = useGovernance();
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const updateVoteStatus = async () => {
      try {
        const voted = await checkHasVoted(proposalId);
        setAlreadyVoted(voted);
      } catch (err) {
        console.error("Failed to check vote status:", err);
      } finally {
        setIsChecking(false);
      }
    };

    updateVoteStatus();
  }, [proposalId, checkHasVoted]);

  const isDisabled = alreadyVoted || votingClosed || isVoting || isChecking;

  const label = voteFor ? "✅ Vote For" : "❌ Vote Against";
  const disabledLabel = alreadyVoted
    ? "Already Voted"
    : votingClosed
      ? "Voting Closed"
      : isVoting
        ? "Casting Vote..."
        : label;

  const baseClass = voteFor
    ? "bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg"
    : "bg-transparent border border-red-700 hover:bg-red-900/30 text-red-500 rounded-lg transition-all font-medium";

  const handleClick = async () => {
    if (isDisabled) return;

    const toastId = toast.loading(`Casting vote ${voteFor ? "FOR" : "AGAINST"}...`);

    try {
      await vote(proposalId, voteFor);
      setAlreadyVoted(true);
      toast.success("Vote cast successfully!", { id: toastId });
      if (onVoteSuccess) onVoteSuccess();
    } catch (err: any) {
      console.error("Vote failed:", err);
      toast.error(err.message || "Failed to cast vote. Try again.", { id: toastId });
    }
  };

  return (
    <button
      className={`${baseClass} flex-1 py-3 px-4 ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isDisabled ? disabledLabel : label}
    </button>
  );
}
