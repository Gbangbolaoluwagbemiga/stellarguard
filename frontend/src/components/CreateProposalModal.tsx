"use client";

import { useEffect, useId, useState } from "react";
import type { GovernanceProposalAction } from "@/lib/contractData";
import { ACTION_DESCRIPTIONS } from "@/lib/contractData";
import { isValidStellarAddress } from "@/lib/stellarAddress";

interface CreateProposalModalProps {
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    action: GovernanceProposalAction;
    target: string;
    amount: bigint;
  }) => Promise<void>;
}

const ACTIONS: GovernanceProposalAction[] = [
  "Funding",
  "PolicyChange",
  "AddMember",
  "RemoveMember",
  "General",
];

export function CreateProposalModal({
  isOpen,
  isCreating = false,
  onClose,
  onCreate,
}: CreateProposalModalProps) {
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState<GovernanceProposalAction>("General");
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const normalizedTarget = target.trim();
  const isTargetAddressValid = isValidStellarAddress(normalizedTarget);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreating) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isCreating, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Proposal title is required");
      return;
    }

    if (!description.trim()) {
      setError("Proposal description is required");
      return;
    }

    if (action === "Funding" || action === "AddMember" || action === "RemoveMember") {
      if (!target.trim()) {
        setError(`Target address is required for ${action} proposals`);
        return;
      }

      if (!isTargetAddressValid) {
        setError("Invalid Stellar address");
        return;
      }
    }

    if (action === "Funding") {
      if (!amount || Number(amount) <= 0) {
        setError("Amount must be greater than 0");
        return;
      }
    }

    try {
      const amountBigInt =
        action === "Funding" ? BigInt(Math.floor(Number(amount) * 10 ** 7)) : BigInt(0);

      await onCreate({
        title: title.trim(),
        description: description.trim(),
        action,
        target: normalizedTarget,
        amount: amountBigInt,
      });

      setTitle("");
      setDescription("");
      setAction("General");
      setTarget("");
      setAmount("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create proposal");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="presentation"
      onClick={() => {
        if (!isCreating) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md card max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          Create Proposal
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Submit a proposal for your organization to vote on
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-gray-300 mb-1">
              Proposal Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Increase Treasury Allocation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              className="w-full bg-gray-900 border border-stellar-border rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Explain the purpose and details of this proposal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
              className="w-full bg-gray-900 border border-stellar-border rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500 disabled:opacity-50 resize-none"
            />
          </div>

          <div>
            <label htmlFor="action" className="block text-xs font-medium text-gray-300 mb-1">
              Action Type
            </label>
            <select
              id="action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value as GovernanceProposalAction);
                setTarget("");
                setAmount("");
              }}
              disabled={isCreating}
              className="w-full bg-gray-900 border border-stellar-border rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500 disabled:opacity-50"
            >
              {ACTIONS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{ACTION_DESCRIPTIONS[action]}</p>
          </div>

          {(action === "Funding" || action === "AddMember" || action === "RemoveMember") && (
            <div>
              <label htmlFor="target" className="block text-xs font-medium text-gray-300 mb-1">
                {action === "Funding" ? "Destination Address" : "Target Address"}
              </label>
              <input
                id="target"
                type="text"
                placeholder="G... or C..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isCreating}
                className="w-full bg-gray-900 border border-stellar-border rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500 disabled:opacity-50"
              />
              {target && !isTargetAddressValid && (
                <p className="text-xs text-red-400 mt-1">Enter a valid Stellar account or contract address</p>
              )}
            </div>
          )}

          {action === "Funding" && (
            <div>
              <label htmlFor="amount" className="block text-xs font-medium text-gray-300 mb-1">
                Amount (XLM)
              </label>
              <input
                id="amount"
                type="number"
                placeholder="0.00"
                step="0.0000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isCreating}
                className="w-full bg-gray-900 border border-stellar-border rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500 disabled:opacity-50"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim() || !description.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
