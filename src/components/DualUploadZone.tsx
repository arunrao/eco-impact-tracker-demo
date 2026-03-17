'use client';
import React, { useRef, useState } from 'react';
import { UploadCloud, ArrowRight } from 'lucide-react';

interface DualUploadZoneProps {
  onBomUpload: (file: File) => void;
  onEcoUpload: (file: File) => void;
  bomUploaded: boolean;
  ecoUploaded: boolean;
}

export const DualUploadZone = ({ onBomUpload, onEcoUpload, bomUploaded, ecoUploaded }: DualUploadZoneProps) => {
  const bomInputRef = useRef<HTMLInputElement>(null);
  const ecoInputRef = useRef<HTMLInputElement>(null);
  
  const [bomDragging, setBomDragging] = useState(false);
  const [ecoDragging, setEcoDragging] = useState(false);

  // Missing file pulsing state
  const isMissingBom = ecoUploaded && !bomUploaded;
  const isMissingEco = bomUploaded && !ecoUploaded;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 p-8 max-w-5xl mx-auto w-full">
      {/* BOM Upload */}
      <div 
        className={`flex-1 w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          bomDragging ? 'border-blue-500 bg-blue-500/5' : 
          bomUploaded ? 'border-green-500/50 bg-green-500/5' :
          isMissingBom ? 'border-amber-500 animate-pulse bg-amber-500/5' :
          'border-white/10 hover:border-white/20 bg-[#1A1D27]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setBomDragging(true); }}
        onDragLeave={() => setBomDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setBomDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onBomUpload(file);
        }}
        onClick={() => !bomUploaded && bomInputRef.current?.click()}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">{bomUploaded ? "BOM Loaded" : "Drop BOM CSV"}</h3>
        {!bomUploaded && (
          <div className="text-xs text-gray-500 font-mono mt-4">
            Expected: Description, Level, Parent Assembly, Qty Per, Unit Cost, Supplier, Lead Time (Days), Category, Notes
          </div>
        )}
        <input type="file" accept=".csv" className="hidden" ref={bomInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onBomUpload(file);
        }} />
      </div>

      {/* Connector */}
      <div className="flex flex-col items-center text-gray-500 shrink-0">
        <ArrowRight className="w-6 h-6 mb-2 hidden md:block" />
        <span className="text-xs text-center max-w-[120px]">Gemini will cross-reference these</span>
      </div>

      {/* ECO Upload */}
      <div 
        className={`flex-1 w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          ecoDragging ? 'border-blue-500 bg-blue-500/5' : 
          ecoUploaded ? 'border-green-500/50 bg-green-500/5' :
          isMissingEco ? 'border-amber-500 animate-pulse bg-amber-500/5' :
          'border-white/10 hover:border-white/20 bg-[#1A1D27]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setEcoDragging(true); }}
        onDragLeave={() => setEcoDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEcoDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onEcoUpload(file);
        }}
        onClick={() => !ecoUploaded && ecoInputRef.current?.click()}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">{ecoUploaded ? "ECO Loaded" : "Drop ECO Changes CSV"}</h3>
        {!ecoUploaded && (
          <div className="text-xs text-gray-500 font-mono mt-4">
            Expected: CO Number, Part Number, Change Type, Old Value, New Value, Reason Code, Requested By, Priority, Notes
          </div>
        )}
        <input type="file" accept=".csv" className="hidden" ref={ecoInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onEcoUpload(file);
        }} />
      </div>
    </div>
  );
};
