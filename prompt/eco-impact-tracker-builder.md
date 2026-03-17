# ECO Impact Tracker — BOM Change Intelligence Dashboard

## Role

Act as a World-Class Senior Full-Stack Engineer specializing in supply chain intelligence tools. You build production-grade Engineering Change Order (ECO) Impact Dashboards for supply chain and product management teams. Every dashboard you produce should feel like a change control instrument — cost deltas are immediately visible, affected assemblies are traceable in one click, and downstream production risk is quantified before the ECO is approved. Eradicate all generic AI dashboard patterns. No decorative charts. No ambiguous alerts. Every number must answer a decision.

## Agent Flow — MUST FOLLOW

When the user asks to build this dashboard (or this file is loaded into a fresh project), immediately ask **exactly these questions** using AskUserQuestion in a single call, then build the full dashboard from the answers. Do not ask follow-ups. Do not over-discuss. Build.

### Questions (all in one AskUserQuestion call)

1. **"What is the name of this dashboard and the organization running it?"** — Free text. Example: "Apex Hardware — ECO Change Intelligence Center."
2. **"What are the column headers in your BOM CSV?"** — Free text. The agent will map these to the ECO model fields. Example: "Part Number, Description, Level, Parent Assembly, Qty Per, Unit Cost, Supplier, Lead Time (Days), Category, Notes."
3. **"What are the column headers in your ECO change CSV?"** — Free text. The second upload. Example: "ECO Number, Part Number, Change Type, Old Value, New Value, Reason Code, Requested By, Priority."
4. **"What is the primary decision this dashboard needs to support?"** — Free text. Example: "Approve or reject the ECO", "Estimate cost impact before procurement commit", "Identify which production orders are at risk."

---

## Data Model (FIXED — NEVER CHANGE LOGIC)

This dashboard ingests **two CSV files**: the current BOM and the ECO change list. The Gemini AI layer cross-references them to produce impact scores, cost deltas, and production risk flags.

### File 1 — BOM CSV (Current State)
Expected schema (map user's headers to these fields):
```
part_number       — unique component identifier
description       — human-readable part name
level             — BOM indentation level (0 = top assembly, 1 = sub-assembly, 2 = component)
parent_assembly   — part_number of the parent node
qty_per           — quantity used per parent assembly
unit_cost         — current unit cost in USD
supplier          — primary supplier name
lead_time_days    — standard lead time in calendar days
category          — component category (PCB, Mechanical, Fastener, Cable, etc.)
notes             — any existing flags or comments
```

### File 2 — ECO Change CSV
Expected schema (map user's headers to these fields):
```
eco_number        — ECO identifier (multiple rows can share one ECO number)
part_number       — the part being changed (must exist in BOM)
change_type       — Add | Remove | Substitute | Modify | Qty Change | Cost Update
old_value         — current value of the changed field
new_value         — proposed new value
reason_code       — Cost Reduction | Quality Issue | Supply Risk | Regulatory | Obsolescence | Performance
requested_by      — name or team
priority          — Critical | High | Normal | Low
```

### Change Type Definitions (Gemini must understand these)
| Change Type | What it means | Risk profile |
|---|---|---|
| Add | New part added to BOM | Low-Medium — new procurement needed |
| Remove | Part removed from BOM | Medium — check if used in other assemblies |
| Substitute | Replace part A with part B | High — form/fit/function validation required |
| Modify | Change spec of existing part | Medium-High — depends on what's modified |
| Qty Change | Change qty_per | Medium — ripples through cost and production planning |
| Cost Update | Price change only | Low — financial impact only |

---

## Impact Scoring Model (FIXED — NEVER CHANGE LOGIC)

The Gemini AI layer must compute an **ECO Impact Score (0–100)** for each change line item, plus a **Portfolio Impact Score** for the full ECO package.

### Four Impact Dimensions (equal weight, 25% each)

**1. Cost Delta Score (0–100)**
- Compute total cost delta per changed part: `(new_unit_cost − old_unit_cost) × qty_per × affected_assembly_count`
- Scale relative to largest delta in the ECO set.
- Positive delta (cost increase) scores higher risk. Negative delta (cost reduction) scores lower.
- If change_type is Remove: cost delta = negative of that part's total contribution.

**2. Assembly Blast Radius Score (0–100)**
- Count how many assemblies (parent nodes) reference the changed part_number, traversing the BOM tree upward.
- 1 assembly → 0–25. 2–3 assemblies → 26–60. 4–6 assemblies → 61–85. 7+ assemblies → 86–100.
- Gemini must traverse the parent_assembly chain to compute this — not just count direct parents.

**3. Supply Chain Disruption Score (0–100)**
- Derived from lead_time_days and change_type.
- Substitute or Add with lead_time > 60 days → 80–100.
- Substitute or Add with lead_time 30–60 days → 50–79.
- Modify or Qty Change → 30–59.
- Cost Update only → 0–29.
- If supplier changes (old_value vs new_value contains a supplier name) → add 20 points.

**4. Production Risk Score (0–100)**
- Gemini infers production risk from the reason_code, priority, and notes fields.
- Critical priority → 80–100 base.
- Quality Issue or Regulatory reason code → +20 points.
- Obsolescence → +15 points.
- Cost Reduction alone → 0–30 base.
- Gemini must explain its reasoning in a `production_risk_rationale` field.

### ECO Impact Thresholds
| Score | Label | Badge Color |
|---|---|---|
| 75–100 | Critical Impact | Red `#EF4444` |
| 50–74 | High Impact | Orange `#F97316` |
| 25–49 | Moderate Impact | Amber `#F59E0B` |
| 0–24 | Low Impact | Green `#22C55E` |

### Gemini Prompt Template — Per Change Line
```
You are a supply chain engineering analyst reviewing a BOM change order. Given this change and BOM context, return ONLY a valid JSON object — no markdown, no preamble.

ECO Number: {eco_number}
Part Number: {part_number}
Description: {description}
Change Type: {change_type}
Old Value: {old_value}
New Value: {new_value}
Reason Code: {reason_code}
Priority: {priority}
Current Unit Cost: {unit_cost}
Lead Time (days): {lead_time_days}
Supplier: {supplier}
Directly Affected Assemblies: {affected_assemblies_list}
Total Assemblies in BOM: {total_assembly_count}
Notes: {notes}

Return:
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
```

### Gemini Prompt Template — ECO Portfolio Summary
```
You are a supply chain change management analyst. Given this ECO package summary, return ONLY a valid JSON object — no markdown, no preamble.

ECO Number: {eco_number}
Total Change Lines: {total_lines}
Critical Impact Lines: {critical_count}
High Impact Lines: {high_count}
Net Cost Delta (USD): {total_cost_delta}
Top 3 Affected Assemblies: {top_3_assemblies}
Unique Suppliers Affected: {supplier_count}
Highest Risk Change: {highest_risk_description}
Requestor: {requested_by}
Notes: {notes}

Return:
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
```

---

## Fixed Design System (NEVER CHANGE)

Same visual language as the Project Risk Dashboard for suite consistency.

### Visual Language
- Background: `#0F1117`. Cards: `#1A1D27` with `border border-white/8`.
- No gradients on data. Gradients only on hero stat bar and dividers.
- `rounded-2xl` for all cards and containers.
- Typography: `Inter` for UI. `JetBrains Mono` for part numbers, ECO IDs, costs, scores, and lead times.
- Noise overlay: SVG `<feTurbulence>` at `0.03 opacity` in `globals.css ::before` on `body`.

### Status Color System
```css
:root {
  --impact-critical: #EF4444;
  --impact-high: #F97316;
  --impact-moderate: #F59E0B;
  --impact-low: #22C55E;
  --impact-savings: #38BDF8;   /* blue — for negative cost delta (savings) */
  --surface: #1A1D27;
  --surface-hover: #22263A;
  --border: rgba(255,255,255,0.08);
  --text-primary: #F1F5F9;
  --text-muted: #64748B;
  --mono: 'JetBrains Mono', monospace;
}
```

### Micro-Interactions
- Table rows: `hover:bg-white/4 transition-colors duration-150`.
- Cards: `hover:border-white/16 transition-all duration-200`.
- Impact badges: `transition-transform hover:scale-105`.
- Cost delta values: positive delta in `var(--impact-critical)`, negative delta (savings) in `var(--impact-savings)`.
- Sortable columns: animated `↑↓` arrow toggling on click.

---

## Component Architecture (NEVER CHANGE STRUCTURE)

### A. TOPBAR — "ECO Command Header"
Fixed `h-14` bar.
- Left: Dashboard name + organization.
- Center: Three reactive pill badges — **Net Cost Delta** (red if positive, blue if savings) + **Critical Changes** count + **Assemblies Affected** count.
- Right: ECO number displayed in monospace + "Approve ECO" / "Export Report" CTA button.
- Bottom border: `border-b border-white/8`.

### B. DUAL UPLOAD ZONE — "Two-File Ingestion Panel"
Shown only when files have not been loaded. Two side-by-side drop zones.
- Left zone: "Drop BOM CSV" — accepts the current bill of materials.
- Right zone: "Drop ECO Changes CSV" — accepts the change order line items.
- Each zone shows expected column format in monospace below the drop target.
- A `→` connector between the two zones with label "Gemini will cross-reference these."
- Both files required before analysis begins. If only one is uploaded, the other zone pulses with an amber border.
- On both files loaded: show row counts + column match confirmation, then trigger Gemini pipeline.

### C. SUMMARY STATS — "Four ECO Instruments"
Four Tremor `<Card>` components in `grid grid-cols-2 md:grid-cols-4`.

**Stat 1 — Net Cost Delta:** Sum of all `cost_delta_usd` values. Red if positive (cost increase), blue if negative (savings). Icon: `TrendingUp` or `TrendingDown` (Lucide). Monospace value with `$` prefix.
**Stat 2 — Critical + High Changes:** Count of change lines with impact score ≥ 50. Icon: `Zap` (Lucide). Value colored `text-red-400`.
**Stat 3 — Assemblies at Risk:** Total unique assemblies in `affected_assembly_names` across all changes. Icon: `GitBranch` (Lucide). Value colored `text-amber-400`.
**Stat 4 — Approval Recommendation:** Gemini's portfolio-level recommendation (Approve / Approve with Conditions / Reject / Escalate). Displayed as a color-coded badge. Icon: `ClipboardCheck` (Lucide).

### D. ECO IMPACT MATRIX — "Distribution Intelligence"
Two Tremor charts side by side.

**Left — Impact Distribution Bar Chart:**
- Tremor `<BarChart>` — count of change lines per impact tier (Critical / High / Moderate / Low).
- Colors from fixed status color system.
- X-axis: impact tiers. Y-axis: line count in monospace.

**Right — Cost Delta Waterfall:**
- Tremor `<BarChart>` configured as a waterfall — one bar per ECO change line, sorted by cost delta magnitude.
- Positive deltas red, negative deltas (savings) blue.
- X-axis labels: part numbers in monospace (truncated to 10 chars).
- Tooltip: full part description + delta amount.

### E. BOM BLAST RADIUS TREE — "Assembly Impact Visualizer"
A collapsible tree visualization showing which assemblies are affected by the ECO.
- Render as an indented tree using recursive React components (no external graph library needed).
- Each BOM node shows: part number (monospace) + description + level indicator.
- Nodes affected by the ECO are highlighted with a left border in the impact color (`var(--impact-critical)` etc.).
- Unaffected nodes are dimmed (`opacity-40`).
- Expand/collapse at each level with a `+` / `−` toggle.
- Header shows: "X of Y assemblies affected."

### F. CHANGE LINE TABLE — "The ECO Registry"
Full-width Tremor `<Table>` with sortable columns.

**Columns:**
| Column | Source | Format |
|---|---|---|
| Part Number | ECO CSV | Monospace, links to BOM row |
| Description | BOM CSV | Text, `font-medium` |
| Change Type | ECO CSV | Color-coded pill (Add=blue, Remove=red, Substitute=orange, etc.) |
| Old → New Value | ECO CSV | Monospace, strikethrough old, bold new |
| Cost Delta | Gemini | Monospace, red/blue colored |
| Blast Radius | Gemini | Badge showing affected assembly count |
| Impact Score | Gemini | Large monospace, color-matched |
| Recommendation | Gemini | Pill (Approve / Conditions / Reject / Escalate) |
| Risk Flag | Gemini | Small text, `text-muted`, 1-line truncated |
| Detail | — | Chevron `>` expands row drawer |

**Row Expansion Drawer:**
Clicking chevron opens full-width sub-row revealing:
- `change_summary` — plain English explanation of the change.
- `conditions` — if Approve with Conditions, shows conditions.
- `risk_flag` — full text of the top risk.
- `disruption_rationale` + `production_risk_rationale` from Gemini.
- Raw BOM data for that part in a monospace pre block.
- Two action buttons: "Flag for Review" and "Mark Approved."

**Table Controls:**
- Search by part number or description.
- Filter by change_type (multi-select pills).
- Filter by impact tier (multi-select pills).
- Filter by approval_recommendation.

### G. ECO APPROVAL PANEL — "The Decision Brief"
Full-width collapsible bottom panel. Triggered by "Approve ECO" CTA in Topbar.

Renders the portfolio-level Gemini summary:
- `eco_headline` in large serif italic (`text-2xl font-playfair text-white`).
- `cost_summary` in monospace in a colored callout box (red for cost increase, blue for savings).
- `top_risks` and `conditions` side by side with Lucide `AlertCircle` icons.
- `estimated_validation_effort` and `production_impact_window` as two instrument cards.
- `bottom_line` in a bordered callout.
- `approval_recommendation` as a large color-coded decision badge.
- Three action buttons: "Approve ECO", "Request Revision", "Escalate to Engineering."
- "Export PDF" wired to `window.print()` with print-specific CSS.

---

## Technical Requirements (NEVER CHANGE)

- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS v3, `@tremor/react` latest, `papaparse` for CSV parsing, `@google/generative-ai` (Gemini SDK).
- **Gemini Model:** `gemini-2.5-flash` for per-change-line analysis. `gemini-2.5-pro` for ECO portfolio summary.
- **API Key:** `process.env.GEMINI_API_KEY` in `.env.local`. Never hardcode.
- **Fonts:** `Inter` and `JetBrains Mono` via `next/font/google` in `layout.tsx`.
- **BOM Tree traversal:** Computed client-side in `lib/bomTree.ts` before Gemini calls. Build adjacency map from `parent_assembly` column. Gemini receives pre-computed `affected_assemblies_list` — do not ask Gemini to traverse raw CSV rows.
- **File structure:**
```
/app
  layout.tsx
  page.tsx
  globals.css
/components
  Topbar.tsx
  DualUploadZone.tsx
  SummaryStats.tsx
  EcoImpactMatrix.tsx
  BomBlastRadiusTree.tsx
  ChangeLineTable.tsx
  EcoApprovalPanel.tsx
  ImpactBadge.tsx         ← shared badge component
  ChangeTypePill.tsx      ← colored pill per change type
/lib
  gemini.ts               ← Gemini client + per-line and portfolio prompts
  csvParser.ts            ← papaparse wrapper for both CSV schemas
  bomTree.ts              ← BOM adjacency builder + blast radius traversal
  ecoModel.ts             ← impact scoring constants + cost delta calculator
/types
  index.ts                ← BomRow, EcoChange, ImpactResult, EcoSummary interfaces
```
- **Loading states:** Progress bar in Topbar counting `X of Y changes analyzed`. Rows render progressively.
- **Error handling:** Invalid Gemini JSON → retry once with stricter prompt → fallback to score 50 (High Impact) with yellow warning badge.
- **Responsive:** Table scrolls horizontally on mobile. Stats collapse to 2-column grid. Tree collapses to list on mobile. Charts stack vertically.

---

## Antigravity Integration (NEVER CHANGE)

```typescript
// lib/antigravity.ts
import { AntigravityAgent } from '@antigravity/sdk';

export const ecoAgent = new AntigravityAgent({
  name: 'eco-impact-tracker',
  skills: ['bom-ingestion', 'eco-ingestion', 'blast-radius-analysis',
           'gemini-impact-scoring', 'approval-workflow'],
  memory: 'session',
  triggers: ['dual-csv-upload'],
});
```

### Agent Skills to Register
1. **`bom-ingestion`** — Parses BOM CSV, normalizes to schema, builds adjacency tree, returns `BomRow[]` + tree map.
2. **`eco-ingestion`** — Parses ECO CSV, validates all `part_number` values exist in BOM, flags orphaned parts, returns `EcoChange[]`.
3. **`blast-radius-analysis`** — Traverses BOM tree upward from each changed part, returns `affected_assembly_names[]` per change line. Runs entirely client-side before any Gemini calls.
4. **`gemini-impact-scoring`** — Iterates over `EcoChange[]` with pre-computed blast radius data, fires per-line Gemini prompt, collects `ImpactResult[]`. Handles retries.
5. **`approval-workflow`** — Fires portfolio summary Gemini call, aggregates line-level recommendations, surfaces final ECO decision. Tracks approval actions (Approve / Flag / Escalate) in session memory.

### Session Memory
```typescript
await ecoAgent.memory.set('last_eco_analysis', {
  timestamp: new Date().toISOString(),
  eco_number: ecoNumber,
  total_lines: changes.length,
  net_cost_delta_usd: totalCostDelta,
  critical_count: criticalChanges.length,
  assemblies_affected: uniqueAssembliesAffected,
  recommendation: portfolioRecommendation,
});
```

### Shareable Endpoint
```typescript
// antigravity.config.ts
export default {
  shareMode: 'snapshot',
  auth: 'link-only',
  ttl: '30d',     // ECOs need longer review windows than project status
};
```

---

## Build Sequence

After receiving answers to the 4 questions:

1. Map user's BOM CSV headers and ECO CSV headers to schema fields.
2. Scaffold Next.js: `npx create-next-app@latest --typescript --tailwind --app`.
3. Install: `npm install @tremor/react papaparse @google/generative-ai @antigravity/sdk`.
4. Write `globals.css` with CSS variables, noise overlay, change-type color utilities, and print styles.
5. Build `lib/bomTree.ts` — adjacency map builder and upward blast radius traversal.
6. Build `lib/ecoModel.ts` — cost delta calculator, impact thresholds, change type definitions.
7. Build `lib/csvParser.ts` — two separate parsers with column mapping for BOM and ECO schemas.
8. Build `lib/gemini.ts` — per-line and portfolio prompt templates with blast radius injection.
9. Build components in sequence: `ImpactBadge` → `ChangeTypePill` → `DualUploadZone` → `SummaryStats` → `EcoImpactMatrix` → `BomBlastRadiusTree` → `ChangeLineTable` → `EcoApprovalPanel` → `Topbar`.
10. Wire `page.tsx` as state orchestrator: dual upload → parse → tree build → blast radius → Gemini analysis → render.
11. Wire Antigravity agent skills and session memory.
12. Add print styles in `globals.css` for ECO Approval Panel PDF export.

**Execution Directive:** "Do not build a change order tool; build a decision instrument. Every change line should answer: what does this cost, what does it break, and should we do it. The approver should be able to make a confident decision in under 3 minutes. Eradicate all ambiguous alerts."
