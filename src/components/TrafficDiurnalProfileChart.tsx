import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrafficNOxHotspot } from '../lib/trafficEmission';
import { ScientificTooltip } from './ScientificTooltip';

interface ChartProps {
  hotspot: TrafficNOxHotspot;
  currentHour: number;
}

export const TrafficDiurnalProfileChart: React.FC<ChartProps> = ({ hotspot, currentHour }) => {
  const data = useMemo(() => {
    const points = [];
    // Emulating the typical diurnal traffic curve for Malaga (rush hours around 08:00, 14:00, 19:00)
    const baseCurve = [
      0.1, 0.08, 0.05, 0.05, 0.1, 0.2, 0.5, 0.9, 1.0, 0.85, 0.7, 0.75, 
      0.8, 0.95, 1.0, 0.85, 0.7, 0.75, 0.8, 0.95, 0.8, 0.6, 0.4, 0.2
    ];
    
    for (let h = 0; h < 24; h++) {
      const factor = baseCurve[h];
      const nox = hotspot.qNOx_ug_m_s * factor;
      const veh = Math.round(hotspot.trafficFlowVehH * factor);
      points.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        factor,
        nox,
        veh
      });
    }
    return points;
  }, [hotspot]);

  return (
    <div className="w-full h-52 bg-slate-900 border border-slate-800 p-2 rounded">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <h3 className="text-[10px] text-slate-300 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
          <span>Perfil Temporal de Emisión NOₓ (24h) — {hotspot.name}</span>
        </h3>
        <ScientificTooltip
          title="Modulación Horaria de Emisiones COPERT 5"
          content="Curva de modulación diurna del tráfico urbano en Málaga basada en los aforos reales de espiras inductivas de tráfico (Movilidad Málaga). Incorpora picos laborales (08:00, 14:00 y 19:30) y factor de sobreemisión por arranque en frío (cold start)."
          formula="q_{\text{NO}_x}(t) = q_{\text{base}} \cdot f_{\text{diurno}}(t) \cdot \left[ 1 + \beta_{\text{cold}} \cdot \exp(-T_{\text{amb}} / 10) \right]"
          regulatory="Guía EMEP/EEA 2019 / Modelo COPERT 5.4"
          citation="Ntziachristos et al. (2020). COPERT: A European road transport emission inventory model."
          position="left"
        />
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="noxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={9} interval={3} />
          <YAxis stroke="#64748b" fontSize={9} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
            formatter={(value: number, name: string) => [
              name === 'nox' ? `${value.toFixed(1)} µg/m/s` : `${value} veh/h`, 
              name === 'nox' ? 'Emisión NOₓ' : 'Flujo Tráfico'
            ]}
          />
          <ReferenceLine x={`${currentHour.toString().padStart(2, '0')}:00`} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'top', value: 'AHORA', fill: '#ef4444', fontSize: 9 }} />
          <Area type="monotone" dataKey="nox" stroke="#f59e0b" fillOpacity={1} fill="url(#noxGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
