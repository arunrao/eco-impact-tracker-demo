'use client';
import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/Topbar';
import { DualUploadZone } from '@/components/DualUploadZone';
import { SummaryStats } from '@/components/SummaryStats';
import { EcoImpactMatrix } from '@/components/EcoImpactMatrix';
import { BomBlastRadiusTree } from '@/components/BomBlastRadiusTree';
import { ChangeLineTable } from '@/components/ChangeLineTable';
import { EcoApprovalPanel } from '@/components/EcoApprovalPanel';

import { parseBomCsv, parseEcoCsv } from '@/lib/csvParser';
import { BomTree, BomNode } from '@/lib/bomTree';
import { calculateCostDelta } from '@/lib/ecoModel';
import { analyzeChangeLine, analyzeEcoPortfolio } from '@/lib/gemini';
import { ecoAgent } from '@/lib/antigravity';

import { BomRow, EcoChange, AnalyzedChange, EcoSummary } from '@/types';

export default function Page() {
  const [bomRows, setBomRows] = useState<BomRow[]>([]);
  const [ecoChanges, setEcoChanges] = useState<EcoChange[]>([]);
  const [tree, setTree] = useState<BomTree | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [results, setResults] = useState<AnalyzedChange[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<EcoSummary | null>(null);

  // Stats
  const [netCostDelta, setNetCostDelta] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [allAffectedAssemblies, setAllAffectedAssemblies] = useState<Set<string>>(new Set());

  const handleBomUpload = async (file: File) => {
    const text = await file.text();
    const rows = await parseBomCsv(text);
    setBomRows(rows);
    setTree(new BomTree(rows));
  };

  const handleEcoUpload = async (file: File) => {
    const text = await file.text();
    const rows = await parseEcoCsv(text);
    setEcoChanges(rows);
  };

  useEffect(() => {
    if (bomRows.length > 0 && ecoChanges.length > 0 && tree && results.length === 0 && !isProcessing) {
      processAnalysis();
    }
  }, [bomRows, ecoChanges, tree]);

  const processAnalysis = async () => {
    setIsProcessing(true);
    let cumulativeCost = 0;
    let critCount = 0;
    const globalAffected = new Set<string>();
    const completedResults: AnalyzedChange[] = [];

    const totalAssemblies = tree!.getTotalAssemblyCount();

    // Line level analysis
    for (let i = 0; i < ecoChanges.length; i++) {
      const change = ecoChanges[i];
      const bomData = tree!.getNode(change.part_number);
      const affectedList = tree!.getAffectedAssemblies(change.part_number);
      
      affectedList.forEach(a => globalAffected.add(a));
      
      const impact = await analyzeChangeLine(
        change, 
        bomData, 
        affectedList.length, 
        affectedList, 
        totalAssemblies
      );

      // We override cost delta mathematically if Gemini guesses wrong
      // But specs say Gemini calculates it. Let's trust Gemini's number here, but we can augment.
      // The prompt guides Gemini properly.
      
      completedResults.push({ ...change, impact });
      
      cumulativeCost += impact.cost_delta_usd;
      if (impact.eco_impact_score >= 50) critCount++;
      
      setNetCostDelta(cumulativeCost);
      setCriticalCount(critCount);
      setAllAffectedAssemblies(new Set(globalAffected));
      setAnalyzedCount(i + 1);
    }

    setResults(completedResults);

    // Portfolio summary analysis
    const ecoNumber = ecoChanges[0]?.eco_number || "MULTI-ECO";
    const topRisksRaw = completedResults.sort((a,b) => b.impact.eco_impact_score - a.impact.eco_impact_score).slice(0,1);
    const topRiskDesc = topRisksRaw[0]?.impact.risk_flag || "Unknown";

    const summary = await analyzeEcoPortfolio(
      ecoNumber,
      ecoChanges.length,
      critCount,
      completedResults.filter(c => c.impact.eco_impact_score >= 50 && c.impact.eco_impact_score < 75).length,
      cumulativeCost,
      Array.from(globalAffected).slice(0, 3),
      new Set(bomRows.map(r => r.supplier)).size,
      topRiskDesc,
      ecoChanges[0]?.requested_by || "Unknown Team"
    );

    setPortfolioSummary(summary);
    setIsProcessing(false);

    // Track state in Antigravity Mock
    await ecoAgent.memory.set('last_eco_analysis', {
      timestamp: new Date().toISOString(),
      eco_number: ecoNumber,
      total_lines: ecoChanges.length,
      net_cost_delta_usd: cumulativeCost,
      critical_count: critCount,
      assemblies_affected: globalAffected.size,
      recommendation: summary.approval_recommendation,
    });
  };

  const hasData = results.length > 0;
  const ecoNumber = ecoChanges[0]?.eco_number;
  
  // Construct raw bom data map for table details
  const bomDataMap = bomRows.reduce((acc, row) => ({...acc, [row.part_number]: row}), {} as Record<string, BomRow>);

  return (
    <main className="flex flex-col min-h-screen">
      <Topbar 
        netCostDelta={netCostDelta}
        criticalCount={criticalCount}
        assembliesAffected={allAffectedAssemblies.size}
        ecoNumber={hasData ? ecoNumber : undefined}
        onApprove={() => window.scrollTo(0, document.body.scrollHeight)}
        onExport={() => window.print()}
        isLoading={isProcessing}
        analyzedCount={analyzedCount}
        totalCount={ecoChanges.length}
      />

      <div className="flex-1 overflow-x-hidden p-6 pb-32">
        {!hasData && !isProcessing && (
          <div className="flex-1 flex items-center justify-center min-h-[80vh]">
            <DualUploadZone 
              onBomUpload={handleBomUpload}
              onEcoUpload={handleEcoUpload}
              bomUploaded={bomRows.length > 0}
              ecoUploaded={ecoChanges.length > 0}
            />
          </div>
        )}

        {hasData && (
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            <SummaryStats 
              netCostDelta={netCostDelta}
              criticalCount={criticalCount}
              assembliesAffected={allAffectedAssemblies.size}
              recommendation={portfolioSummary?.approval_recommendation || "Pending"}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <EcoImpactMatrix changes={results} />
                <ChangeLineTable changes={results} bomData={bomDataMap} />
              </div>
              
              <div className="lg:col-span-1">
                <BomBlastRadiusTree roots={tree?.getRoots() || []} affectedAssemblies={allAffectedAssemblies} />
              </div>
            </div>
          </div>
        )}
      </div>

      {portfolioSummary && (
        <div className="mt-8">
          <EcoApprovalPanel 
            summary={portfolioSummary} 
            onAction={(action) => alert(`${action} triggered for ${ecoNumber}`)} 
          />
        </div>
      )}

      <style jsx global>{`
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
