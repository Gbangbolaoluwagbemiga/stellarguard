import { formatAddress, formatXlm } from "@/lib/formatters";
import { CopyButton } from "@/components/CopyButton";

interface TreasuryCardProps {
  /** Transaction ID */
  txId: number;
  /** Destination address */
  to: string;
  /** Amount in stroops */
  amount: bigint;
  /** Transaction memo */
  memo: string;
  /** Current approver addresses */
  approvals?: string[];
  /** Required approval threshold */
  threshold: number;
  /** Whether the transaction has been executed */
  executed: boolean;
  /**
   * Whether an approval for this transaction is currently in-flight.
   * When true the button shows a pending state immediately (optimistic UI),
   * before the chain confirms the approval.
   */
  isPendingApproval?: boolean;
  /** Whether execution for this transaction is currently in-flight. */
  isPendingExecution?: boolean;
  /** Called when the user clicks Approve. Receives the txId. */
  onApprove?: (txId: number) => void;
  /** Called when the user clicks Execute. Receives the txId. */
  onExecute?: (txId: number) => void;
}

/**
 * Card component for displaying a treasury transaction.
 * Shows transaction details, approval progress, and action buttons.
 * Supports optimistic approval state via `isPendingApproval`.
 */
export function TreasuryCard({
  txId,
  to,
  amount,
  memo,
  approvals = [],
  threshold,
  executed,
  isPendingApproval = false,
  isPendingExecution = false,
  onApprove,
  onExecute,
}: TreasuryCardProps) {
  const approvalCount = approvals.length;
  const statusColor = executed
    ? "text-gray-400"
    : approvalCount >= threshold
      ? "text-green-400"
      : "text-yellow-400";

  const statusText = executed
    ? "Executed"
    : approvalCount >= threshold
      ? "Ready"
      : "Pending";

  const canApprove = !executed && !isPendingApproval && !!onApprove;
  const canExecute =
    !executed &&
    !isPendingExecution &&
    approvalCount >= threshold &&
    !!onExecute;

  const handleApprove = () => {
    if (canApprove) onApprove(txId);
  };

  const handleExecute = () => {
    if (canExecute) onExecute(txId);
  };

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-mono text-gray-500">#{txId}</span>
          <CopyButton value={String(txId)} label={`transaction ${txId} id`} />
          <span className={`text-xs font-semibold ${statusColor}`}>
            {statusText}
          </span>
          {isPendingApproval && (
            <span className="text-xs font-semibold text-primary-400 animate-pulse">
              Approving...
            </span>
          )}
          {isPendingExecution && (
            <span className="text-xs font-semibold text-primary-400 animate-pulse">
              Executing...
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400">
          {approvalCount}/{threshold} approvals
        </p>
      </div>

      <div className="flex-1">
        <p className="text-white font-semibold mt-1">
          {formatXlm(amount)} XLM → {formatAddress(to, { startChars: 6, endChars: 4 })}
        </p>
        {memo && <p className="text-gray-400 text-sm mt-0.5">{memo}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {approvals.length === 0 ? (
          <span className="text-xs text-gray-500">No approvals yet</span>
        ) : (
          approvals.map((approver) => (
            <div
              key={`${txId}-${approver}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pr-2 pl-1"
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full bg-primary-500/25 text-[10px] font-semibold text-primary-300 flex items-center justify-center"
              >
                {approver.slice(1, 2).toUpperCase()}
              </span>
              <span className="text-xs text-gray-300">
                {formatAddress(approver, { startChars: 4, endChars: 3 })}
              </span>
            </div>
          ))
        )}
      </div>

      {!executed && (
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            className={`btn-primary text-xs py-1 px-3 ${
              isPendingApproval ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isPendingApproval || !onApprove}
            onClick={handleApprove}
          >
            {isPendingApproval ? "Approving..." : "Approve"}
          </button>
          <button
            className={`btn-secondary text-xs py-1 px-3 ${
              !canExecute ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!canExecute}
            onClick={handleExecute}
          >
            {isPendingExecution ? "Executing..." : "Execute"}
          </button>
        </div>
      )}
      {executed && (
        <p className="text-xs text-green-400 text-right">
          Executed on-chain
        </p>
      )}
      {approvalCount < threshold && !executed && (
        <p className="text-xs text-gray-500 text-right">
          Needs {threshold - approvalCount} more approval
          {threshold - approvalCount === 1 ? "" : "s"}.
        </p>
      )}
      {approvalCount >= threshold && !executed && (
        <p className="text-xs text-green-400 text-right">
          Threshold met. Ready to execute.
        </p>
      )}
      <div className="text-right">
        <CopyButton value={to} label={`transaction ${txId} destination address`} />
      </div>
    </div>
  );
}
