import React from 'react';
import { EcoChange } from '@/types';

export const ChangeTypePill = ({ type }: { type: EcoChange['change_type'] }) => {
  let colorClass = 'bg-gray-500/20 text-gray-400';
  
  switch (type) {
    case 'Add':
      colorClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      break;
    case 'Remove':
      colorClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
      break;
    case 'Substitute':
      colorClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      break;
    case 'Modify':
      colorClass = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      break;
    case 'Qty Change':
      colorClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      break;
    case 'Cost Update':
      colorClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      break;
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${colorClass}`}>
      {type}
    </span>
  );
};
