 "use client";

import { useEffect, useMemo, useState } from "react";
import { ProposalCard } from "@/components/ProposalCard";
import { useGovernance } from "@/hooks/useGovernance";
import type {
  GovernanceProposal,
  GovernanceProposalAction,
  GovernanceProposalStatus,
} from "@/lib/contractData";

const STATUS_FILTERS: Array<"All" | GovernanceProposalStatus> = [
  "All",
  "Active",
  "Passed",
  "Rejected",
  "Executed",
  "Expired",
];

const ACTION_FILTERS: Array<"All" | GovernanceProposalAction> = [
  "All",
  "Funding",
  "PolicyChange",
  "AddMember",
  "RemoveMember",
  "General",
];

export default function GovernancePage() {
  const { config, getConfig, getProposal, isLoading, error } = useGovernance();
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | GovernanceProposalStatus>("All");
  const [actionFilter, setActionFilter] = useState<"All" | GovernanceProposalAction>("All");

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await getConfig();
        const count = cfg?.proposalCount ?? 0;
        if (count <= 0) {
          setProposals([]);
          return;
        }

        const ids = Array.from({ length: count }, (_, i) => i + 1);
        const loaded: GovernanceProposal[] = [];
        for (const id of ids) {
          try {
            const proposal = await getProposal(id);
            loaded.push(proposal);
          } catch {
            // Ignore sparse/unavailable ids from contract history.
          }
        }

        setProposals(
          loaded.sort((a, b) => b.id - a.id),
        );
      } catch {
        setProposals([]);
      }
    };

    load();
  }, [getConfig, getProposal]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const statusOk = statusFilter === "All" || proposal.status === statusFilter;
      const actionOk = actionFilter === "All" || proposal.action === actionFilter;
      return statusOk && actionOk;
    });
  }, [proposals, statusFilter, actionFilter]);

  const activeProposals = filteredProposals.filter((p) => p.status === "Active");
  const pastProposals = filteredProposals.filter((p) => p.status !== "Active");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Governance</h1>
          <p className="text-gray-400 mt-1">
            Create and vote on proposals for your organization
          </p>
        </div>
        {/* TODO: [FE-14] Add Create Proposal Modal trigger */}
        <button className="btn-primary">+ New Proposal</button>
      </div>

      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-400">Total Proposals</p>
          <p className="text-2xl font-bold text-white mt-1">{config?.proposalCount ?? proposals.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{proposals.filter((p) => p.status === "Active").length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400">Quorum %</p>
          <p className="text-2xl font-bold text-primary-400 mt-1">{config?.quorumPercent ?? 0}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400">Members</p>
          <p className="text-2xl font-bold text-white mt-1">{config?.memberCount ?? 0}</p>
        </div>
      </div>

      <div className="card flex flex-col md:flex-row gap-4 md:items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            className="bg-gray-900 border border-stellar-border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Action</label>
          <select
            className="bg-gray-900 border border-stellar-border rounded px-3 py-2"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
          >
            {ACTION_FILTERS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="text-red-400 text-sm">{error.message}</p> : null}
      </div>

      {/* Proposal List */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Active Proposals
        </h2>
        <div className="space-y-4">
          {isLoading ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">Loading proposals...</p>
            </div>
          ) : activeProposals.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No active proposals for selected filters</p>
            </div>
          ) : (
            activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} {...proposal} totalMembers={config?.memberCount ?? 0} />
            ))
          )}
        </div>
      </div>

      {/* Past Proposals */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Past Proposals
        </h2>
        <div className="space-y-4">
          {pastProposals.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No past proposals for selected filters</p>
            </div>
          ) : (
            pastProposals.map((proposal) => (
              <ProposalCard key={proposal.id} {...proposal} totalMembers={config?.memberCount ?? 0} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
