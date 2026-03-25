"use client";

import React from "react";
import { useFreighter } from "@/context/FreighterProvider";

export const WalletConnect = () => {
  const { address, isConnecting, connect, disconnect, isFreighterInstalled, error } = useFreighter();

  if (!isFreighterInstalled) {
    return (
      <a 
        href="https://www.freighter.app/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        Install Freighter
      </a>
    );
  }

  if (isConnecting) {
    return (
      <button disabled className="px-4 py-2 bg-stellar-dark text-gray-400 border border-stellar-border rounded-lg cursor-not-allowed text-sm font-medium">
        Connecting...
      </button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm font-mono bg-stellar-dark/50 px-3 py-1.5 rounded-lg border border-stellar-border text-purple-400">
          {address.slice(0, 4)}...{address.slice(-4)}
        </div>
        <button 
          onClick={disconnect}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-1">
      <button 
        onClick={connect}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-purple-500/20"
      >
        Connect Wallet
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
};
