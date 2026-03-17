'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EcoChange, BomRow, ImpactResult, EcoSummary } from "@/types";

export async function analyzeChangeLine(
  change: EcoChange,
  bomRow: BomRow | undefined,
  affectedAssemblyCount: number,
  affectedAssembliesList: string[],
  totalAssemblyCount: number
): Promise<ImpactResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are a supply chain engineering analyst reviewing a BOM change order. Given this change and BOM context, return ONLY a valid JSON object — no markdown, no preamble.

ECO Number: ${change.eco_number}
Part Number: ${change.part_number}
Description: ${bomRow?.description || "Unknown"}
Change Type: ${change.change_type}
Old Value: ${change.old_value}
New Value: ${change.new_value}
Reason Code: ${change.reason_code}
Priority: ${change.priority}
Current Unit Cost: ${bomRow?.unit_cost || 0}
Lead Time (days): ${bomRow?.lead_time_days || 0}
Supplier: ${bomRow?.supplier || "Unknown"}
Directly Affected Assemblies: ${affectedAssembliesList.join(", ")}
Total Assemblies in BOM: ${totalAssemblyCount}
Notes: ${change.notes || ""}

Return exactly this schema:
{
  "cost_delta_usd": <number — total cost impact in USD, negative = savings>,
  "cost_delta_score": <0-100>,
  "blast_radius_score": <0-100>,
  "affected_assembly_count": <number>,
  "affected_assembly_names": ["<name>", ...],
  "supply_chain_disruption_score": <0-100>,
  "disruption_rationale": "<one sentence>",
  "production_risk_score": <0-100>,
  "production_risk_rationale": "<one sentence>",
  "eco_impact_score": <0-100>,
  "impact_label": "<Critical Impact|High Impact|Moderate Impact|Low Impact>",
  "change_summary": "<one sentence — what this change does in plain English>",
  "approval_recommendation": "<Approve|Approve with Conditions|Reject|Escalate>",
  "conditions": "<if Approve with Conditions — what conditions. Otherwise empty string>",
  "risk_flag": "<the single biggest risk if this change is approved>"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText.trim()) as ImpactResult;
  } catch (err) {
    console.error("Gemini line parsing failed", err);
    // Fallback stub
    return {
      cost_delta_usd: 0,
      cost_delta_score: 50,
      blast_radius_score: 50,
      affected_assembly_count: affectedAssemblyCount,
      affected_assembly_names: affectedAssembliesList,
      supply_chain_disruption_score: 50,
      disruption_rationale: "Analysis failed.",
      production_risk_score: 50,
      production_risk_rationale: "Analysis failed.",
      eco_impact_score: 50,
      impact_label: "High Impact",
      change_summary: `Fallback generated for ${change.part_number} ${change.change_type}`,
      approval_recommendation: "Escalate",
      conditions: "Require manual review due to analysis failure.",
      risk_flag: "Unknown risk (AI fallback)",
    };
  }
}

export async function analyzeEcoPortfolio(
  ecoNumber: string,
  totalLines: number,
  criticalCount: number,
  highCount: number,
  totalCostDelta: number,
  topAssemblies: string[],
  supplierCount: number,
  highestRiskRisk: string,
  requestedBy: string,
  notes: string = ""
): Promise<EcoSummary> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are a supply chain change management analyst. Given this ECO package summary, return ONLY a valid JSON object — no markdown, no preamble.

ECO Number: ${ecoNumber}
Total Change Lines: ${totalLines}
Critical Impact Lines: ${criticalCount}
High Impact Lines: ${highCount}
Net Cost Delta (USD): ${totalCostDelta}
Top 3 Affected Assemblies: ${topAssemblies.join(", ")}
Unique Suppliers Affected: ${supplierCount}
Highest Risk Change: ${highestRiskRisk}
Requestor: ${requestedBy}
Notes: ${notes}

Return exactly this schema:
{
  "eco_headline": "<one sentence — the most important thing the approver needs to know>",
  "cost_summary": "<one sentence — net financial impact>",
  "top_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "approval_recommendation": "<Approve|Approve with Conditions|Reject|Escalate>",
  "conditions": "<conditions if any, else empty string>",
  "estimated_validation_effort": "<Low|Medium|High> — estimated engineering effort to validate all changes",
  "production_impact_window": "<estimated days of production disruption if implemented without preparation>",
  "bottom_line": "<one sentence — consequence of approving vs. not approving>"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText.trim()) as EcoSummary;
  } catch (err) {
    console.error("Gemini portfolio parsing failed", err);
    // Fallback stub
    return {
      eco_headline: "ECO package processing failed. Manual review required.",
      cost_summary: "Unable to synthesize cost impacts automatically.",
      top_risks: ["Unknown AI failure", "Data inconsistency"],
      approval_recommendation: "Escalate",
      conditions: "Manual signoff needed.",
      estimated_validation_effort: "High",
      production_impact_window: "Unknown",
      bottom_line: "Escalate for manual processing.",
    };
  }
}
