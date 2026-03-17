'use client';
import React from 'react';

interface TopbarProps {
  netCostDelta: number;
  criticalCount: number;
  assembliesAffected: number;
  ecoNumber?: string;
  onApprove: () => void;
  onExport: () => void;
  isLoading?: boolean;
  analyzedCount?: number;
  totalCount?: number;
}

export const Topbar = ({
  netCostDelta,
  criticalCount,
  assembliesAffected,
  ecoNumber,
  onApprove,
  onExport,
  isLoading,
  analyzedCount,
  totalCount
}: TopbarProps) => {
  const isSavings = netCostDelta < 0;
  
  return (
    <header className="h-14 border-b border-white/8 bg-[#0F1117] flex items-center justify-between px-6 shrink-0 no-print">
      <div className="flex items-center space-x-2">
        <h1 className="font-semibold text-sm">Dashboard — ECO Change Intelligence Center</h1>
      </div>
      
      {isLoading ? (
        <div className="text-sm text-amber-500 animate-pulse font-mono">
          Analyzing {analyzedCount} of {totalCount} changes...
        </div>
      ) : ecoNumber ? (
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className={`px-3 py-1 rounded-full border ${isSavings ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            Delta: {isSavings ? '-' : '+'}${Math.abs(netCostDelta).toLocaleString()}
          </div>
          <div className="px-3 py-1 rounded-full border bg-red-500/10 text-red-500 border-red-500/20">
            {criticalCount} Critical
          </div>
          <div className="px-3 py-1 rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/20">
            {assembliesAffected} Assemblies at Risk
          </div>
        </div>
      ) : null}

      <div className="flex items-center space-x-3">
        {ecoNumber && <span className="text-sm font-mono text-gray-400 mr-2">{ecoNumber}</span>}
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 rounded transition-colors text-white"
        >
          Export Report
        </button>
        <button
          onClick={onApprove}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white"
        >
          Approve ECO
        </button>
      </div>
    </header>
  );
};
