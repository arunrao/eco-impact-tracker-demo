export interface BomRow {
  part_number: string;
  description: string;
  level: number;
  parent_assembly: string;
  qty_per: number;
  unit_cost: number;
  supplier: string;
  lead_time_days: number;
  category: string;
  notes: string;
}

export interface EcoChange {
  eco_number: string;
  part_number: string;
  change_type: "Add" | "Remove" | "Substitute" | "Modify" | "Qty Change" | "Cost Update";
  old_value: string;
  new_value: string;
  reason_code: string;
  requested_by: string;
  priority: "Critical" | "High" | "Normal" | "Low";
  notes?: string;
}

export interface ImpactResult {
  cost_delta_usd: number;
  cost_delta_score: number;
  blast_radius_score: number;
  affected_assembly_count: number;
  affected_assembly_names: string[];
  supply_chain_disruption_score: number;
  disruption_rationale: string;
  production_risk_score: number;
  production_risk_rationale: string;
  eco_impact_score: number;
  impact_label: "Critical Impact" | "High Impact" | "Moderate Impact" | "Low Impact";
  change_summary: string;
  approval_recommendation: "Approve" | "Approve with Conditions" | "Reject" | "Escalate";
  conditions: string;
  risk_flag: string;
}

export interface EcoSummary {
  eco_headline: string;
  cost_summary: string;
  top_risks: string[];
  approval_recommendation: "Approve" | "Approve with Conditions" | "Reject" | "Escalate";
  conditions: string;
  estimated_validation_effort: "Low" | "Medium" | "High";
  production_impact_window: string;
  bottom_line: string;
}

export interface AnalyzedChange extends EcoChange {
  impact: ImpactResult;
}
