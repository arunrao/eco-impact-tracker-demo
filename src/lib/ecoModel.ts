import { EcoChange, BomRow } from "@/types";
import { BomTree } from "./bomTree";

export const IMPACT_THRESHOLDS = {
  CRITICAL: 75,
  HIGH: 50,
  MODERATE: 25,
  LOW: 0,
};

export const CHANGE_TYPE_RISK = {
  Add: "Low-Medium",
  Remove: "Medium",
  Substitute: "High",
  Modify: "Medium-High",
  "Qty Change": "Medium",
  "Cost Update": "Low",
};

export function calculateCostDelta(
  change: EcoChange,
  bomRow: BomRow,
  affectedAssemblyCount: number
): number {
  if (change.change_type === "Cost Update") {
    const oldCost = bomRow.unit_cost;
    const newCost = parseFloat(change.new_value.replace(/[^0-9.-]+/g, "")) || 0;
    return (newCost - oldCost) * bomRow.qty_per * affectedAssemblyCount;
  } else if (change.change_type === "Remove") {
    return -(bomRow.unit_cost * bomRow.qty_per * affectedAssemblyCount);
  } else if (change.change_type === "Add") {
    const newCost = parseFloat(change.new_value.replace(/[^0-9.-]+/g, "")) || 0;
    return newCost * 1 * affectedAssemblyCount; // Assuming qty_per=1 for new adds unless specified
  } else if (change.change_type === "Qty Change") {
    const oldQty = bomRow.qty_per;
    const newQty = parseInt(change.new_value, 10) || oldQty;
    return (newQty - oldQty) * bomRow.unit_cost * affectedAssemblyCount;
  } else if (change.change_type === "Substitute") {
     // A substitution usually specifies old part -> new part or old unit cost -> new unit cost.
     // In an advanced model we'd map this better, but we leave the heavy lifting to Gemini.
     return 0; // Let Gemini estimate based on context if we don't have explicit values.
  }
  return 0;
}
