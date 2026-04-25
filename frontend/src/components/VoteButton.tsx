import React from "react";
import { toast } from "react-hot-toast";
import { useFreighter } from "@/hooks/useFreighter";
import { useGovernance } from "@/hooks/useGovernance";

interface VoteButtonProps {
  proposalId: number;
  voteFor: boolean;
  hasVoted: boolean;
  votingClosed: boolean;
  isPending?: boolean;
  onVoteSuccess?: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  proposalId,
  voteFor,
  hasVoted,
  votingClosed,
  isPending = false,
  onVoteSuccess,
}) => {
  const { isConnected } = useFreighter();
  const { vote, isLoading } = useGovernance();

  const isDisabled = hasVoted || votingClosed || !isConnected || isLoading || isPending;

  const handleVote = async () => {
    if (isDisabled) {
      return;
    }

    try {
      await vote(proposalId, voteFor);
      toast.success(`Vote submitted ${voteFor ? "for" : "against"} proposal #${proposalId}`);
      await onVoteSuccess?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cast vote",
      );
      console.error(error);
    }
  };

  const title = hasVoted
    ? "You have already voted on this proposal"
    : votingClosed
      ? "Voting is closed"
      : !isConnected
        ? "Connect your wallet to vote"
        : isPending
          ? "Waiting for vote confirmation"
          : "";

  return (
    <button
      className={voteFor ? "btn-primary" : "btn-secondary"}
      disabled={isDisabled}
      onClick={handleVote}
      title={title}
      type="button"
    >
      {isLoading || isPending
        ? "Submitting..."
        : voteFor
          ? "Vote For"
          : "Vote Against"}
    </button>
  );
};
