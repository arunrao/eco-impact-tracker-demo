'use client';
import React, { useState } from 'react';
import { Card, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@tremor/react';
import { AnalyzedChange } from '@/types';
import { ImpactBadge } from './ImpactBadge';
import { ChangeTypePill } from './ChangeTypePill';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const ChangeLineTable = ({ changes, bomData }: { changes: AnalyzedChange[], bomData: any }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="bg-[#1A1D27] border-white/8 rounded-2xl ring-0 shadow-none w-full p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/8">
        <h3 className="text-sm font-medium text-white">The ECO Registry</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHead>
            <TableRow className="border-b border-white/8 bg-[#0F1117]/50">
              <TableHeaderCell className="text-gray-400 font-medium font-sans">Part</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans">Type</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans">Change</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans text-right">Delta ($)</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans text-center">Radius</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans">Impact</TableHeaderCell>
              <TableHeaderCell className="text-gray-400 font-medium font-sans">Status</TableHeaderCell>
              <TableHeaderCell className="w-10"></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changes.map((change, idx) => {
              const isExpanded = expandedId === `${change.part_number}-${idx}`;
              const isSavings = change.impact.cost_delta_usd < 0;

              return (
                <React.Fragment key={`${change.part_number}-${idx}`}>
                  <TableRow 
                    className={`border-b border-white/4 hover:bg-white/4 transition-colors cursor-pointer ${isExpanded ? 'bg-white/4' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : `${change.part_number}-${idx}`)}
                  >
                    <TableCell className="font-mono text-white text-sm">
                      {change.part_number}
                    </TableCell>
                    <TableCell>
                      <ChangeTypePill type={change.change_type} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {change.old_value && <span className="line-through text-gray-500 mr-2">{change.old_value}</span>}
                      <span className="text-white bg-white/5 px-1 rounded">{change.new_value}</span>
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-right ${isSavings ? 'text-sky-400' : change.impact.cost_delta_usd > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {change.impact.cost_delta_usd === 0 ? '--' : `${isSavings ? '-' : '+'}$${Math.abs(change.impact.cost_delta_usd).toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-0.5 rounded text-xs border border-amber-500/20 text-amber-500 bg-amber-500/10 font-mono">
                        {change.impact.affected_assembly_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ImpactBadge label={change.impact.impact_label} score={change.impact.eco_impact_score} />
                    </TableCell>
                    <TableCell className="text-xs text-muted max-w-[150px] truncate">
                      {change.impact.risk_flag}
                    </TableCell>
                    <TableCell>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </TableCell>
                  </TableRow>

                  {/* Expansion Drawer */}
                  {isExpanded && (
                    <TableRow className="bg-[#0F1117]/80">
                      <TableCell colSpan={8} className="p-0 border-b border-white/8">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="col-span-2 space-y-4">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Executive Summary</div>
                              <div className="text-sm text-gray-300">{change.impact.change_summary}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded flex flex-col">
                                <span className="text-xs text-red-500/70 uppercase mb-1 drop-shadow-sm">Production Risk Rationale</span>
                                <span className="text-sm text-red-100/90">{change.impact.production_risk_rationale}</span>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded flex flex-col">
                                <span className="text-xs text-amber-500/70 uppercase mb-1 drop-shadow-sm">Supply Disruption</span>
                                <span className="text-sm text-amber-100/90">{change.impact.disruption_rationale}</span>
                              </div>
                            </div>
                            
                            {change.impact.conditions && (
                              <div className="bg-blue-500/10 border-l-2 border-blue-500 p-2 text-sm text-blue-300">
                                <span className="font-semibold text-blue-400 mr-2">Condition:</span>
                                {change.impact.conditions}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Action</div>
                              <div className="flex space-x-2">
                                <button className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/30 transition-colors">
                                  Mark Approved
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 rounded border border-white/10 transition-colors">
                                  Flag for Review
                                </button>
                              </div>
                            </div>
                            <div>
                               <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">BOM Integrity</div>
                               <pre className="text-[10px] font-mono text-gray-400 bg-black/40 p-2 rounded overflow-x-auto ring-1 ring-inset ring-white/5">
                                 {JSON.stringify(bomData[change.part_number] || { status: 'Orphaned - Not traversing' }, null, 2)}
                               </pre>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
