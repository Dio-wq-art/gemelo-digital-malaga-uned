import React from 'react';
import { ScientificTooltip } from './ScientificTooltip';

interface DiagramProps {
  value: number;
  limit2008: number;
  limit2030: number;
  whoLimit: number;
  maxAxis?: number;
}

export const RegulatoryComplianceDiagram: React.FC<DiagramProps> = ({ 
  value, limit2008, limit2030, whoLimit, maxAxis = 100 
}) => {
  const getX = (val: number) => (val / maxAxis) * 100;
  
  const valX = getX(value);
  const l2008X = getX(limit2008);
  const l2030X = getX(limit2030);
  const whoX = getX(whoLimit);

  // Color logic
  let barColor = "#10b981"; // green
  if (value > whoLimit) barColor = "#f59e0b"; // yellow
  if (value > limit2030) barColor = "#f97316"; // orange
  if (value > limit2008) barColor = "#ef4444"; // red

  return (
    <div className="w-full mt-3">
      <ScientificTooltip
        position="top"
        width="w-[310px]"
        title="Termómetro de Conformidad Multi-Normativa"
        formula={`C_{\\text{actual}} = ${value.toFixed(1)}\\,\\mu\\text{g/m}^3 \\;\\text{vs}\\; [\\text{OMS}: ${whoLimit},\\; \\text{UE 2030}: ${limit2030},\\; \\text{UE 2008}: ${limit2008}]\\,\\mu\\text{g/m}^3`}
        normative="Guías OMS 2021 • Directiva (UE) 2024/2881 (horizonte 2030) • Directiva 2008/50/CE"
        content={`Evalúa simultáneamente la concentración asimilada (${value.toFixed(1)} µg/m³) frente a los tres umbrales de referencia: Guía de Salud Pública OMS 2021 (${whoLimit} µg/m³), nuevo límite legal vinculante de la Directiva (UE) 2024/2881 para 2030 (${limit2030} µg/m³) y límite histórico de la Directiva 2008/50/CE (${limit2008} µg/m³).`}
      >
        <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none" className="cursor-help">
          {/* Background track */}
          <rect x="0" y="15" width="100" height="10" fill="#1e293b" rx="2" />
          
          {/* Value bar */}
          <rect x="0" y="15" width={Math.min(valX, 100)} height="10" fill={barColor} rx="2" />
          <circle cx={Math.min(valX, 100)} cy="20" r="4" fill="#ffffff" />
          
          {/* Markers */}
          <g opacity="0.8">
            <line x1={whoX} y1="10" x2={whoX} y2="30" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="1 1" />
            <text x={whoX} y="8" fill="#38bdf8" fontSize="4" fontFamily="monospace" textAnchor="middle">OMS</text>

            <line x1={l2030X} y1="10" x2={l2030X} y2="30" stroke="#c084fc" strokeWidth="0.5" strokeDasharray="1 1" />
            <text x={l2030X} y="36" fill="#c084fc" fontSize="4" fontFamily="monospace" textAnchor="middle">UE 2030</text>

            <line x1={l2008X} y1="10" x2={l2008X} y2="30" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="1 1" />
            <text x={l2008X} y="8" fill="#f43f5e" fontSize="4" fontFamily="monospace" textAnchor="middle">UE 2008</text>
          </g>
        </svg>
      </ScientificTooltip>
    </div>
  );
};
