import { BomRow } from "@/types";

export interface BomNode extends BomRow {
  children: BomNode[];
}

export class BomTree {
  private partMap: Map<string, BomNode>;
  private roots: BomNode[];

  constructor(bomRows: BomRow[]) {
    this.partMap = new Map();
    this.roots = [];
    this.buildTree(bomRows);
  }

  private buildTree(bomRows: BomRow[]) {
    // 1. Initialize map with all rows
    bomRows.forEach((row) => {
      this.partMap.set(row.part_number, { ...row, children: [] });
    });

    // 2. Build linkages
    bomRows.forEach((row) => {
      const node = this.partMap.get(row.part_number)!;
      if (!row.parent_assembly || row.parent_assembly.trim() === "") {
        this.roots.push(node);
      } else {
        const parent = this.partMap.get(row.parent_assembly);
        if (parent) {
          parent.children.push(node);
        } else {
          // Orphaned node, treat as root for safety
          this.roots.push(node);
        }
      }
    });
  }

  public getRoots(): BomNode[] {
    return this.roots;
  }

  public getNode(partNumber: string): BomNode | undefined {
    return this.partMap.get(partNumber);
  }

  public getAffectedAssemblies(changedPartNumber: string): string[] {
    const affected = new Set<string>();
    
    // Reverse traversal: Find all nodes where the child is the changed part or is itself affected
    // Wait, the BOM tree is directed downwards (parent -> children). To traverse up, we need parent links.
    // Instead of adding parent pointers, let's do a simple full traversal for each to find paths to the changed part.
    // Wait, it's simpler to just build child-to-parent map.

    const childToParent = new Map<string, string>();
    this.partMap.forEach((node, partNum) => {
      if (node.parent_assembly && node.parent_assembly.trim() !== "") {
        childToParent.set(partNum, node.parent_assembly);
      }
    });

    let current = childToParent.get(changedPartNumber);
    while (current) {
      affected.add(current);
      current = childToParent.get(current);
    }

    return Array.from(affected);
  }

  public getTotalAssemblyCount(): number {
    return this.partMap.size;
  }
}
