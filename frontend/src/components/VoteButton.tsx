interface VoteButtonProps {
  /** Proposal ID */
  proposalId: number;
  /** Vote direction */
  voteFor: boolean;
  /** Whether the user has already voted on chain */
  hasVoted?: boolean;
  /** Whether voting is closed */
  votingClosed?: boolean;
  /** Callback when vote is submitted */
  onVote?: (proposalId: number, voteFor: boolean) => Promise<void>;
  /**
   * Whether a vote for this proposal is currently in-flight.
   * When true the button shows a pending state immediately (optimistic UI),
   * before the chain confirms the vote.
   */
  isPending?: boolean;
}

/**
 * Button component for casting votes on governance proposals.
 * Handles loading states, disabled states, optimistic pending state,
 * and visual feedback.
 */
export function VoteButton({
  proposalId,
  voteFor,
  hasVoted = false,
  votingClosed = false,
  onVote,
  isPending = false,
}: VoteButtonProps) {
  const isDisabled = hasVoted || votingClosed || isPending;

  const label = voteFor ? "✅ Vote For" : "❌ Vote Against";
  const pendingLabel = voteFor ? "Submitting for…" : "Submitting against…";
  const disabledLabel = isPending
    ? pendingLabel
    : hasVoted
      ? "Already Voted"
      : votingClosed
        ? "Voting Closed"
        : label;

  const baseClass = voteFor
    ? "btn-primary"
    : "btn-secondary border-red-700 hover:bg-red-900/30";

  const handleClick = async () => {
    if (isDisabled || !onVote) return;

    try {
      await onVote(proposalId, voteFor);
    } catch {
      // Error handling is managed by the hook (useGovernance).
      // The optimistic rollback keeps the UI consistent on failure.
    }
  };

  return (
    <button
      className={`${baseClass} flex-1 py-3 ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${isPending ? "animate-pulse" : ""}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isDisabled ? disabledLabel : label}
    </button>
  );
}
