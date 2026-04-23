"use client";

import React, { useState } from 'react';
import { cn } from './Shimmer';
import { X } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<void>;
  balance: string;
}

export function DepositModal({ isOpen, onClose, onDeposit, balance }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimatedFee = "0.0001"; // Placeholder fee
  const isValidAmount = !isNaN(Number(amount)) && Number(amount) > 0 && Number(amount) <= Number(balance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onDeposit(amount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete deposit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Deposit Treasury Funds</h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="amount" className="text-sm font-medium">Amount to Deposit</label>
              <span className="text-xs text-slate-500">Balance: {balance} XLM</span>
            </div>
            
            <div className="relative">
              <input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                  error ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                )}
                disabled={isSubmitting}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                XLM
              </div>
            </div>
            
            {error && <p className="text-sm text-rose-500 mt-1">{error}</p>}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Estimated Network Fee</span>
              <span>~{estimatedFee} XLM</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <span>Total Requirement</span>
              <span>{amount ? (Number(amount) + Number(estimatedFee)).toFixed(4) : "0.00"} XLM</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidAmount || isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Deposit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}