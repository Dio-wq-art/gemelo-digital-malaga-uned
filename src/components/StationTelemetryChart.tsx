import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StationComparisonResult } from '../lib/physics';
import { ScientificTooltip } from './ScientificTooltip';

interface ChartProps {
  stations: StationComparisonResult[];
}

export const StationTelemetryChart: React.FC<ChartProps> = ({ stations }) => {
  const data = useMemo(() => {
    return stations.map(s => ({
      name: s.station.name.split(' - ')[0], // Short name
      Empírico: s.measuredNO2,
      Simulado: s.estimatedNO2,
      Error: s.errorAbsoluteNO2
    }));
  }, [stations]);

  return (
    <div className="w-full h-60 bg-slate-900 border border-slate-800 p-2 rounded mt-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[10px] text-slate-300 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
          <span>Asimilación Telemetría vs Inferencia PINN (NO₂ µg/m³)</span>
        </h3>
        <ScientificTooltip
          title="Validación Telemetría vs PINN (FAIRMODE WG1)"
          content="Intercomparación directa entre las mediciones oficiales de referencia de la Red de Calidad del Aire de la Junta de Andalucía (quimioluminiscencia EN 14211) y la inferencia espacial física del resolvedor PINN acoplado a la microescala."
          formula="R_{V} = \frac{|C_{\text{PINN}} - C_{\text{obs}}|}{C_{\text{obs}}} \le 0.25 \quad (\text{Objetivo de Calidad FAIRMODE})"
          regulatory="Directiva 2008/50/CE Anexo I (Incertidumbre máxima admisible para modelización: 50% NO2)"
          citation="FAIRMODE WG1 Guidance on Model Quality Objectives and Benchmarking"
          position="left"
        />
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={9} angle={-30} textAnchor="end" />
          <YAxis stroke="#64748b" fontSize={9} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
            formatter={(value: number) => [`${value.toFixed(1)} µg/m³`]}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Bar dataKey="Empírico" fill="#38bdf8" name="Real (AEMET/JA)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Simulado" fill="#f43f5e" name="Inferencia (PINN)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
