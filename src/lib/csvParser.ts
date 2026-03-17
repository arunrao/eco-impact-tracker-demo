import Papa from "papaparse";
import { BomRow, EcoChange } from "@/types";

export function parseBomCsv(csvString: string): Promise<BomRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<BomRow>(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Map user's headers to schema
        // Expected user headers: "Description", "Level", "Parent Assembly", "Qty Per", "Unit Cost", "Supplier", "Lead Time (Days)", "Category", "Notes"
        const cleanHeader = header.trim().toLowerCase();
        if (cleanHeader.includes("part number")) return "part_number";
        if (cleanHeader.includes("description")) return "description";
        if (cleanHeader.includes("level")) return "level";
        if (cleanHeader.includes("parent assembly")) return "parent_assembly";
        if (cleanHeader.includes("qty per")) return "qty_per";
        if (cleanHeader.includes("unit cost")) return "unit_cost";
        if (cleanHeader.includes("supplier")) return "supplier";
        if (cleanHeader.includes("lead time")) return "lead_time_days";
        if (cleanHeader.includes("category")) return "category";
        if (cleanHeader.includes("notes")) return "notes";
        return header;
      },
      transform: (value, field) => {
        if (field === "level" || field === "qty_per" || field === "lead_time_days") {
          return parseInt(value, 10) || 0;
        }
        if (field === "unit_cost") {
          // Remove $ and parse float
          return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
        }
        return value.trim();
      },
      complete: (results) => {
        // Validate
        const validRows = results.data.filter((r) => r.part_number);
        resolve(validRows);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function parseEcoCsv(csvString: string): Promise<EcoChange[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<EcoChange>(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const cleanHeader = header.trim().toLowerCase();
        if (cleanHeader.includes("co number") || cleanHeader.includes("eco number")) return "eco_number";
        if (cleanHeader.includes("part number")) return "part_number";
        if (cleanHeader.includes("change type")) return "change_type";
        if (cleanHeader.includes("old value")) return "old_value";
        if (cleanHeader.includes("new value")) return "new_value";
        if (cleanHeader.includes("reason code")) return "reason_code";
        if (cleanHeader.includes("requested by")) return "requested_by";
        if (cleanHeader.includes("priority")) return "priority";
        if (cleanHeader.includes("notes")) return "notes";
        return header;
      },
      transform: (value) => value.trim(),
      complete: (results) => {
        // Validate
        const validRows = results.data.filter((r) => r.eco_number && r.part_number);
        resolve(validRows);
      },
      error: (error: Error) => reject(error),
    });
  });
}
