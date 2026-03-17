import React from 'react';
import { Card } from '@tremor/react';
import { TrendingUp, TrendingDown, Zap, GitBranch, ClipboardCheck } from 'lucide-react';

interface SummaryStatsProps {
  netCostDelta: number;
  criticalCount: number;
  assembliesAffected: number;
  recommendation: string;
}

export const SummaryStats = ({
  netCostDelta,
  criticalCount,
  assembliesAffected,
  recommendation
}: SummaryStatsProps) => {
  const isSavings = netCostDelta < 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {/* Stat 1: Net Cost Delta */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          {isSavings ? <TrendingDown className="w-4 h-4 text-sky-400" /> : <TrendingUp className="w-4 h-4 text-red-500" />}
          <span>Net Cost Delta</span>
        </div>
        <div className={`text-2xl font-mono ${isSavings ? 'text-sky-400' : 'text-red-500'}`}>
          {isSavings ? '-' : '+'}${Math.abs(netCostDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </Card>

      {/* Stat 2: Critical + High Changes */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Zap className="w-4 h-4 text-red-400" />
          <span>Critical Changes</span>
        </div>
        <div className="text-2xl font-mono text-red-400">
          {criticalCount}
        </div>
      </Card>

      {/* Stat 3: Assemblies at Risk */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <GitBranch className="w-4 h-4 text-amber-400" />
          <span>Assemblies Affected</span>
        </div>
        <div className="text-2xl font-mono text-amber-400">
          {assembliesAffected}
        </div>
      </Card>

      {/* Stat 4: Approval Recommendation */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-400" />
          <span>Recommendation</span>
        </div>
        <div className="flex py-1">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded ${
            recommendation === 'Approve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            recommendation === 'Approve with Conditions' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            recommendation === 'Reject' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {recommendation}
          </span>
        </div>
      </Card>
    </div>
  );
};
