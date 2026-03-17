'use client';
import React from 'react';
import { EcoSummary } from '@/types';
import { AlertCircle, Calendar, Wrench } from 'lucide-react';

interface EcoApprovalPanelProps {
  summary: EcoSummary;
  onAction: (action: string) => void;
}

export const EcoApprovalPanel = ({ summary, onAction }: EcoApprovalPanelProps) => {
  const isSavings = summary.cost_summary.toLowerCase().includes("savings") || summary.cost_summary.includes("-");

  const badgeColor = 
    summary.approval_recommendation === 'Approve' ? 'bg-emerald-500 text-white border-emerald-600' :
    summary.approval_recommendation === 'Approve with Conditions' ? 'bg-amber-500 text-white border-amber-600' :
    summary.approval_recommendation === 'Reject' ? 'bg-red-500 text-white border-red-600' :
    'bg-gray-500 text-white border-gray-600';

  return (
    <div className="bg-[#1A1D27] border-t border-white/8 w-full print:border-none print:bg-white text-white print:text-black shadow-2xl z-40">
      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - Headline and Bottom Line */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-serif italic text-white print:text-black drop-shadow-sm mb-2">
              "{summary.eco_headline}"
            </h2>
            <div className={`inline-block font-mono px-3 py-1.5 rounded-lg border text-sm shadow-sm ${
              isSavings ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {summary.cost_summary}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Top Risks
              </h4>
              <ul className="space-y-2">
                {summary.top_risks.map((risk, i) => (
                  <li key={i} className="text-sm text-gray-300 print:text-gray-800 flex items-start">
                    <span className="text-amber-500 mr-2 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            
            {summary.conditions && (
              <div className="space-y-3 bg-amber-500/5 print:bg-amber-50 border border-amber-500/10 p-4 rounded-xl">
                <h4 className="text-xs uppercase tracking-wider text-amber-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Approval Conditions
                </h4>
                <p className="text-sm text-amber-200/90 print:text-amber-900">{summary.conditions}</p>
              </div>
            )}
          </div>

          <div className="border-l-4 border-white/20 pl-4 py-1">
            <p className="text-sm font-medium text-gray-300 print:text-gray-800 italic">
              {summary.bottom_line}
            </p>
          </div>
        </div>

        {/* Right Column - Decision & Actions */}
        <div className="space-y-6">
          <div className="text-center p-6 border border-white/8 rounded-2xl bg-[#0F1117] print:bg-gray-50">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">AI Recommendation</div>
            <div className={`inline-block px-4 py-2 rounded-lg font-semibold text-lg border shadow-lg ${badgeColor}`}>
              {summary.approval_recommendation}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/8 bg-[#0F1117] p-4 rounded-xl flex items-center">
              <Wrench className="w-6 h-6 text-emerald-400 mr-3 shrink-0" />
              <div>
                <div className="text-[10px] uppercase text-gray-500">Validation Effort</div>
                <div className="text-sm text-emerald-100 font-medium">{summary.estimated_validation_effort}</div>
              </div>
            </div>
            <div className="border border-white/8 bg-[#0F1117] p-4 rounded-xl flex items-center">
              <Calendar className="w-6 h-6 text-blue-400 mr-3 shrink-0" />
              <div>
                <div className="text-[10px] uppercase text-gray-500">Impact Window</div>
                <div className="text-sm text-blue-100 font-medium">{summary.production_impact_window}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 no-print">
            <button 
              onClick={() => onAction('Approve ECO')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              Approve ECO
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onAction('Request Revision')}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors"
               >
                Request Revision
              </button>
              <button 
                onClick={() => onAction('Escalate to Engineering')}
                className="py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors"
              >
                Escalate
              </button>
            </div>
            <button 
              onClick={() => window.print()} 
              className="w-full py-2.5 mt-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Export PDF Portfolio
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
