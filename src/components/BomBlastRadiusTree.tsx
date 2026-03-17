'use client';
import React, { useState } from 'react';
import { BomNode } from '@/lib/bomTree';

interface BomBlastRadiusTreeProps {
  roots: BomNode[];
  affectedAssemblies: Set<string>;
}

const TreeNode = ({ node, affectedAssemblies, depth = 0 }: { node: BomNode; affectedAssemblies: Set<string>; depth?: number }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isAffected = affectedAssemblies.has(node.part_number);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center py-1.5 px-2 hover:bg-white/5 rounded transition-colors group ${
          !isAffected && depth > 0 ? "opacity-40 hover:opacity-100" : ""
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        {/* Expand/Collapse Toggle */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center shrink-0">
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-white font-mono text-xs w-full h-full"
            >
              {expanded ? '−' : '+'}
            </button>
          )}
        </div>

        {/* Node Content */}
        <div className={`flex items-center space-x-3 flex-1 border-l-2 pl-2 ${
          isAffected ? 'border-amber-500' : 'border-transparent'
        }`}>
          <span className="font-mono text-sm text-white bg-white/5 px-1.5 rounded truncate">
            {node.part_number}
          </span>
          <span className="text-sm text-gray-400 truncate max-w-xs">{node.description}</span>
          <span className="text-xs text-gray-600 font-mono hidden md:inline-block">L{node.level}</span>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child, idx) => (
            <TreeNode key={`${child.part_number}-${idx}`} node={child} affectedAssemblies={affectedAssemblies} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const BomBlastRadiusTree = ({ roots, affectedAssemblies }: BomBlastRadiusTreeProps) => {
  return (
    <div className="bg-[#1A1D27] border border-white/8 rounded-2xl ring-0 shadow-none overflow-hidden w-full max-h-[500px] flex flex-col">
      <div className="px-4 py-3 border-b border-white/8 bg-[#1A1D27]">
        <h3 className="text-sm font-medium text-white flex items-center">
          Assembly Impact Visualizer 
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {affectedAssemblies.size} of {roots.reduce((acc, root) => acc + countNodes(root), 0)} affected
          </span>
        </h3>
      </div>
      <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
        {roots.map((root, idx) => (
          <TreeNode key={`${root.part_number}-${idx}`} node={root} affectedAssemblies={affectedAssemblies} />
        ))}
        {roots.length === 0 && <div className="p-4 text-center text-sm text-gray-500">No BOM structure loaded.</div>}
      </div>
    </div>
  );
};

function countNodes(node: BomNode): number {
  return 1 + node.children.reduce((acc, child) => acc + countNodes(child), 0);
}
