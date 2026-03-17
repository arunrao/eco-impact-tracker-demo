import React from 'react';

export const ImpactBadge = ({ label, score }: { label: string; score: number }) => {
  let colorClass = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  
  if (score >= 75) {
    colorClass = 'bg-red-500/20 text-red-500 border border-red-500/30'; // Critical Impact (#EF4444)
  } else if (score >= 50) {
    colorClass = 'bg-orange-500/20 text-orange-500 border border-orange-500/30'; // High Impact (#F97316)
  } else if (score >= 25) {
    colorClass = 'bg-amber-500/20 text-amber-500 border border-amber-500/30'; // Moderate Impact (#F59E0B)
  } else if (score >= 0) {
    colorClass = 'bg-green-500/20 text-green-500 border border-green-500/30'; // Low Impact (#22C55E)
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-transform hover:scale-105 ${colorClass}`}>
      {label}
    </span>
  );
};
