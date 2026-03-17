'use client';
import React from 'react';
import { Card, BarChart } from '@tremor/react';
import { AnalyzedChange } from '@/types';

interface EcoImpactMatrixProps {
  changes: AnalyzedChange[];
}

export const EcoImpactMatrix = ({ changes }: EcoImpactMatrixProps) => {
  // 1. Impact Distribution Bar Chart
  const tiers = ["Critical Impact", "High Impact", "Moderate Impact", "Low Impact"];
  const distributionData = tiers.map(tier => ({
    name: tier,
    "Changes": changes.filter(c => c.impact.impact_label === tier).length
  }));

  // 2. Cost Delta Waterfall
  const costData = [...changes]
    .filter(c => c.impact.cost_delta_usd !== 0)
    .sort((a, b) => b.impact.cost_delta_usd - a.impact.cost_delta_usd)
    .map(c => {
      const isPositive = c.impact.cost_delta_usd >= 0;
      return {
        part: c.part_number.slice(0, 10),
        description: c.part_number,
        "Cost Increase": isPositive ? c.impact.cost_delta_usd : 0,
        "Cost Savings": isPositive ? 0 : Math.abs(c.impact.cost_delta_usd)
      };
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Hidden div to enforce Tailwind v4 generation of Tremor dynamic colors */}
      <div className="hidden bg-blue-500 fill-blue-500 text-blue-500 stroke-blue-500 ring-blue-500 
                      bg-red-500 fill-red-500 text-red-500 stroke-red-500 ring-red-500 
                      bg-cyan-500 fill-cyan-500 text-cyan-500 stroke-cyan-500 ring-cyan-500
                      hover:bg-blue-600 hover:bg-red-600 hover:bg-cyan-600"></div>

      {/* Left Chart */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <h3 className="text-sm font-medium text-white mb-6">Impact Distribution</h3>
        <BarChart
          className="h-64 mt-4"
          data={distributionData}
          index="name"
          categories={["Changes"]}
          colors={["blue"]}
          yAxisWidth={30}
          showYAxis={true}
          showXAxis={true}
          showAnimation={true}
          customTooltip={({ payload, active }) => {
            if (!active || !payload) return null;
            return (
              <div className="bg-[#0F1117] border border-white/10 p-2 rounded text-xs text-white shadow-xl">
                {payload[0].payload.name}: <span className="font-mono">{payload[0].value}</span>
              </div>
            );
          }}
        />
      </Card>

      {/* Right Chart */}
      <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none hover:border-white/16 transition-all duration-200">
        <h3 className="text-sm font-medium text-white mb-6">Cost Delta Distribution</h3>
        <BarChart
          className="h-64 mt-4 font-mono"
          data={costData}
          index="part"
          categories={["Cost Increase", "Cost Savings"]}
          colors={["red", "cyan"]}
          stack={true}
          yAxisWidth={60}
          showYAxis={true}
          showXAxis={true}
          showAnimation={true}
          valueFormatter={(val) => `$${val.toLocaleString()}`}
        />
      </Card>
    </div>
  );
};
