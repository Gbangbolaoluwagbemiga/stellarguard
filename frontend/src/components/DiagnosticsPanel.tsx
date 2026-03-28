"use client";

import { useState, useEffect, useCallback } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { ACTIVE_NETWORK, SOROBAN_RPC_URL } from "@/lib/network";
import { readPublicEnv } from "@/lib/env";

interface DiagnosticInfo {
  wallet: {
    connected: boolean;
    address: string | null;
    network: string | null;
    freighterInstalled: boolean;
  };
  network: {
    name: string;
    rpcUrl: string;
    passphrase: string;
    rpcLatencyMs: number | null;
    rpcStatus: "checking" | "ok" | "error";
  };
  contracts: {
    treasury: string | undefined;
    governance: string | undefined;
  };
  env: {
    nodeEnv: string;
    nextPublicVars: string[];
  };
  timestamp: string;
}

function DiagRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? "font-mono" : ""} text-gray-200`}>
        {value}
      </span>
    </div>
  );
}

export function DiagnosticsPanel() {
  const { address, network, isConnected, isFreighterInstalled } = useFreighter();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rpcLatency, setRpcLatency] = useState<number | null>(null);
  const [rpcStatus, setRpcStatus] = useState<"checking" | "ok" | "error">("checking");

  const isDev = process.env.NODE_ENV === "development";

  const checkRpcHealth = useCallback(async () => {
    setRpcStatus("checking");
    try {
      const start = performance.now();
      const res = await fetch(SOROBAN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
      });
      const elapsed = Math.round(performance.now() - start);
      setRpcLatency(elapsed);
      setRpcStatus(res.ok ? "ok" : "error");
    } catch {
      setRpcLatency(null);
      setRpcStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkRpcHealth();
    }
  }, [isOpen, checkRpcHealth]);

  if (!isDev) return null;

  const info: DiagnosticInfo = {
    wallet: {
      connected: isConnected,
      address,
      network,
      freighterInstalled: isFreighterInstalled,
    },
    network: {
      name: ACTIVE_NETWORK.name,
      rpcUrl: SOROBAN_RPC_URL,
      passphrase: ACTIVE_NETWORK.networkPassphrase,
      rpcLatencyMs: rpcLatency,
      rpcStatus,
    },
    contracts: {
      treasury: readPublicEnv("NEXT_PUBLIC_TREASURY_CONTRACT_ID"),
      governance: readPublicEnv("NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID"),
    },
    env: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      nextPublicVars: Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_")),
    },
    timestamp: new Date().toISOString(),
  };

  const snapshot = JSON.stringify(info, null, 2);

  async function copySnapshot() {
    try {
      await navigator.clipboard.writeText(snapshot);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = snapshot;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const statusColor =
    rpcStatus === "ok" ? "bg-emerald-500" : rpcStatus === "error" ? "bg-red-500" : "bg-yellow-500";

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-stellar-blue/20 border border-stellar-blue/30 text-stellar-blue hover:bg-stellar-blue/30 transition-colors"
        aria-label="Toggle diagnostics panel"
        title="Developer Diagnostics"
      >
        <span className="text-lg">🔧</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-stellar-darker/95 backdrop-blur-xl shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-stellar-darker/95 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Diagnostics</h3>
            <div className="flex gap-2">
              <button
                onClick={copySnapshot}
                className="rounded-lg bg-white/5 px-3 py-1 text-xs text-gray-300 hover:bg-white/10 transition-colors"
              >
                {copied ? "Copied!" : "Copy Snapshot"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close diagnostics"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Wallet */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Wallet
              </h4>
              <DiagRow label="Freighter Installed" value={isFreighterInstalled ? "Yes" : "No"} />
              <DiagRow label="Connected" value={isConnected ? "Yes" : "No"} />
              <DiagRow label="Address" value={address ?? "N/A"} mono />
              <DiagRow label="Network" value={network ?? "N/A"} />
            </section>

            {/* Network */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Network
              </h4>
              <DiagRow label="Active Network" value={info.network.name} />
              <DiagRow label="RPC URL" value={info.network.rpcUrl} mono />
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-xs text-gray-400">RPC Status</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-xs text-gray-200">
                    {rpcStatus === "checking" ? "Checking..." : rpcStatus === "ok" ? `OK (${rpcLatency}ms)` : "Error"}
                  </span>
                </div>
              </div>
            </section>

            {/* Contracts */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Contracts
              </h4>
              <DiagRow label="Treasury" value={info.contracts.treasury ?? "Not configured"} mono />
              <DiagRow label="Governance" value={info.contracts.governance ?? "Not configured"} mono />
            </section>

            {/* Environment */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Environment
              </h4>
              <DiagRow label="NODE_ENV" value={info.env.nodeEnv} />
              <DiagRow label="Public Env Vars" value={String(info.env.nextPublicVars.length)} />
            </section>

            <p className="text-[10px] text-gray-600 text-center pt-2">
              Snapshot: {info.timestamp}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
