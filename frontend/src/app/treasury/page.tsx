"use client";

import { useTreasury, TreasuryTransaction } from "@/hooks/useTreasury";
import { useState } from "react";
import { useFreighter } from "@/hooks/useFreighter";

export default function TreasuryPage() {
  const { address } = useFreighter();
  const { balance, config, transactions, isLoading } = useTreasury();
  const [selectedTx, setSelectedTx] = useState<TreasuryTransaction | null>(null);

  // Simple heuristic for demo purposes: consider transactions 'Pending' if topic_1 implies propose or they lack an execution event
  const pendingTxs = transactions.filter(t => t.topic_1 && t.topic_1.includes('propose'));
  const historyTxs = transactions.filter(t => !t.topic_1?.includes('propose'));

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Treasury</h1>
          <p className="text-gray-400 mt-1">
            Manage shared funds with multi-signature approvals
          </p>
        </div>
        <button className="btn-primary">+ Deposit</button>
      </div>

      {/* Balance Overview */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total Balance</p>
            <p className="text-4xl font-bold text-white mt-1">
              {isLoading && balance === 0 ? "..." : balance} XLM
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Approval Threshold</p>
            <p className="text-2xl font-semibold text-primary-400 mt-1">
              {config?.threshold || "—"} of {config?.signer_count || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Transactions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Pending Transactions
        </h2>
        <div className="card">
          {!address ? (
            <p className="text-gray-500 text-center py-8">
              Connect your wallet to view pending transactions
            </p>
          ) : pendingTxs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pending transactions
            </p>
          ) : (
            <div className="space-y-4">
              {pendingTxs.map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-stellar-border cursor-pointer hover:bg-gray-800 transition" onClick={() => setSelectedTx(tx)}>
                  <div>
                    <p className="text-sm font-semibold text-white">Transaction #{tx.id}</p>
                    <p className="text-xs text-gray-400 mt-1">{tx.topic_1 || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded text-xs">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">History</h2>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-stellar-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Event Topic</th>
                  <th className="text-left py-3 px-4">Ledger</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && historyTxs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">Loading history...</td>
                  </tr>
                ) : historyTxs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-8">No transactions yet</td>
                  </tr>
                ) : (
                  historyTxs.map((tx) => (
                    <tr key={tx.id} className="border-b border-stellar-border/50 hover:bg-gray-800/50 cursor-pointer transition" onClick={() => setSelectedTx(tx)}>
                      <td className="py-3 px-4 text-white">#{tx.id}</td>
                      <td className="py-3 px-4 text-gray-300">{tx.topic_1 || "Contract Event"}</td>
                      <td className="py-3 px-4 text-gray-400">{tx.ledger}</td>
                      <td className="py-3 px-4 text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Overlay Drawer */}
      {selectedTx && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setSelectedTx(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-stellar-border z-50 p-6 shadow-2xl overflow-y-auto transform transition-transform">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Transaction Details</h2>
              <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">ID</p>
                <p className="text-sm text-gray-200 mt-1">#{selectedTx.id}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase">Contract</p>
                <p className="text-sm text-gray-200 mt-1 font-mono break-all">{selectedTx.contract_id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Topic 1</p>
                <p className="text-sm text-gray-200 mt-1">{selectedTx.topic_1 || "—"}</p>
              </div>

               <div>
                <p className="text-xs text-gray-500 uppercase">Topic 2</p>
                <p className="text-sm text-gray-200 mt-1 font-mono break-all">{selectedTx.topic_2 || "—"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Event Data</p>
                <pre className="bg-gray-900 p-3 rounded text-xs text-green-400 mt-1 overflow-x-auto">
                  {JSON.stringify(selectedTx.event_data, null, 2)}
                </pre>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Ledger</p>
                  <p className="text-sm text-gray-200 mt-1">{selectedTx.ledger}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Time</p>
                  <p className="text-sm text-gray-200 mt-1">{new Date(selectedTx.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stellar-border">
              <button 
                className="w-full btn-secondary py-3"
                onClick={() => setSelectedTx(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
