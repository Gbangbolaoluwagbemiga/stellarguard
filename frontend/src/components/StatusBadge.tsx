type ProposalStatus = "Active" | "Passed" | "Rejected" | "Executed" | "Expired";

interface StatusBadgeProps {
  status: ProposalStatus;
  size?: "sm" | "md";
}

const STATUS_STYLES: Record<ProposalStatus, string> = {
  Active:
    "bg-green-900/50 text-green-300 border-green-700 shadow-[0_0_10px_rgba(34,197,94,0.25)]",
  Passed: "bg-blue-900/50 text-blue-300 border-blue-700",
  Rejected: "bg-red-900/50 text-red-300 border-red-700",
  Executed: "bg-purple-900/50 text-purple-300 border-purple-700",
  Expired: "bg-gray-900/50 text-gray-300 border-gray-700",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${sizeClass} ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
