"use client";

import Link from "next/link";
import { VoteButton } from "@/components/VoteButton";
import { StatusBadge } from "@/components/StatusBadge";

export default function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-8 pb-32 md:pb-0">
      {/* Back Link */}
      <Link
        href="/governance"
        className="text-primary-400 hover:text-primary-300 text-sm"
      >
        ← Back to Governance
      </Link>

      {/* Proposal Header */}
      {/* TODO: [FE-15] Fetch real proposal data from Soroban */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">
                Proposal #{params.id}
              </h1>
              <StatusBadge status="Active" size="md" />
            </div>
            <p className="text-gray-400 mt-2">Loading proposal details...</p>
          </div>
        </div>
      </div>

      {/* Voting Progress */}
      {/* TODO: [FE-18] Implement voting progress bar */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          Voting Progress
        </h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">For</span>
              <span className="text-gray-400">0 votes</span>
            </div>
            <div className="w-full bg-stellar-border rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400">Against</span>
              <span className="text-gray-400">0 votes</span>
            </div>
            <div className="w-full bg-stellar-border rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Vote Actions (Sticky on Mobile) */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gray-900 border-t border-stellar-border z-50 md:relative md:p-0 md:bg-transparent md:border-t-0 md:z-auto card md:card">
        <h2 className="hidden md:block text-lg font-semibold text-white mb-4">Cast Vote</h2>
        <div className="flex space-x-4">
          <VoteButton proposalId={parseInt(params.id, 10)} voteFor={true} />
          <VoteButton proposalId={parseInt(params.id, 10)} voteFor={false} />
        </div>
      </div>
    </div>
  );
}
