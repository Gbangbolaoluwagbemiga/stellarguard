import React from 'react';
import { cn } from './Shimmer';

interface VotingProgressBarProps {
  forVotes: number;
  againstVotes: number;
  totalVotes: number;
  quorum: number;
  className?: string;
}

export function VotingProgressBar({
  forVotes,
  againstVotes,
  totalVotes,
  quorum,
  className,
}: VotingProgressBarProps) {
  const forPercentage = totalVotes === 0 ? 0 : (forVotes / totalVotes) * 100;
  const againstPercentage = totalVotes === 0 ? 0 : (againstVotes / totalVotes) * 100;
  const quorumPercentage = (quorum / totalVotes) * 100;

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex justify-between text-sm font-medium">
        <span className="text-emerald-500">For: {forPercentage.toFixed(1)}%</span>
        <span className="text-rose-500">Against: {againstPercentage.toFixed(1)}%</span>
      </div>
      
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden flex">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${forPercentage}%` }}
        />
        <div 
          className="h-full bg-rose-500 transition-all duration-500"
          style={{ width: `${againstPercentage}%` }}
        />
        
        {/* Quorum Marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
          style={{ left: `${quorumPercentage}%` }}
          title={`Quorum Requirement: ${quorum}`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>Total Votes: {totalVotes}</span>
        <span>Quorum: {quorum}</span>
      </div>
    </div>
  );
}