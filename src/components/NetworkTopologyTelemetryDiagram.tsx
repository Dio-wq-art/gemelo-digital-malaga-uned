import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Radio, ShieldCheck, Activity, MapPin, Gauge, Download, Waves, Sparkles, Navigation } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { StationComparisonResult } from '../lib/physics';
import { downloadVectorSvg } from '../lib/vectorExporter';

export interface NetworkTopologyDiagramProps {
  stations: StationComparisonResult[];
  onFlyToStation?: (lat: number, lon: number) => void;
}

export const NetworkTopologyTelemetryDiagram: React.FC<NetworkTopologyDiagramProps> = ({
  stations,
  onFlyToStation
}) => {
  const [selectedStationCode, setSelectedStationCode] = useState<string>(stations[0]?.station?.code || '');

  const selectedStation = stations.find(s => s.station.code === selectedStationCode) || stations[0];

  const handleExportSvg = () => {
    const svgHeight = Math.max(430, 95 + stations.length * 56);
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${svgHeight}" width="760" height="${svgHeight}" font-family="system-ui, sans-serif">
      <defs>
        <linearGradient id="netBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#netBg)" rx="8" />
      <text x="30" y="36" fill="#34d399" font-size="14" font-weight="bold">TOPOLOGÍA DE RED OFICIAL Y ASIMILACIÓN TELEMÉTRICA (MÁLAGA)</text>
      <text x="30" y="56" fill="#94a3b8" font-size="10">Red de Vigilancia Junta de Andalucía &amp; AEMET • Directiva 2008/50/CE</text>
      ${stations.map((s, idx) => `
        <g transform="translate(40, ${85 + idx * 54})">
          <rect width="680" height="44" fill="#1e293b" stroke="#059669" rx="4" />
          <text x="14" y="20" fill="#f8fafc" font-size="10.5" font-weight="bold">${s.station.name} (${s.station.code}) - [${s.station.environmentType}]</text>
          <text x="14" y="34" fill="#34d399" font-size="9">NO2: ${s.measuredNO2} µg/m³ | O3: ${s.measuredO3} µg/m³ | PM10: ${s.measuredPM10} µg/m³ | MAE PINN: ${s.errorAbsoluteNO2.toFixed(1)} µg/m³</text>
        </g>
      `).join('')}
    </svg>`;
    downloadVectorSvg(svgContent, `Malaga_Network_Topology_${Date.now()}.svg`);
  };

  return (
    <div className="bg-slate-950 border border-emerald-900/60 rounded-lg p-3 space-y-3 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px] font-mono">
              Topología de Red Oficial de Vigilancia &amp; Asimilación Telemétrica
            </span>
            <span className="text-[8px] text-slate-400 block font-mono">
              Vigilancia Junta de Andalucía &amp; AEMET • Validación Directiva 2008/50/CE y OMS 2021
            </span>
          </div>
        </div>

        <ScientificTooltip topic="official_monitoring_network"
          width="w-64"
          content="Exportación vectorial SVG del grafo topológico de la red de calidad del aire con estaciones de referencia, concentraciones medidas y error MAE de asimilación PINN."
        >
          <button
            onClick={handleExportSvg}
            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded text-[8px] font-bold flex items-center gap-1 transition-colors font-mono"
          >
            <Download className="w-2.5 h-2.5 text-emerald-400" /> Vector SVG
          </button>
        </ScientificTooltip>
      </div>

      {/* Network Station Grid & Live Node Pulses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 font-mono">
        {stations.map((s) => {
          const isSelected = selectedStationCode === s.station.code;
          const isCompliant = s.measuredNO2 <= 40;

          return (
            <ScientificTooltip topic="official_monitoring_network"
              key={s.station.code}
              width="w-72"
              content={`Estación oficial ${s.station.name} (${s.station.code}) - ${s.station.environmentType}. Coordenadas: ${s.station.lat.toFixed(4)}°N, ${s.station.lon.toFixed(4)}°W. Asimilada continuamente mediante filtro de Kalman / PINN. Error medio absoluto MAE: ${s.errorAbsoluteNO2.toFixed(2)} µg/m³.`}
            >
              <div
                onClick={() => setSelectedStationCode(s.station.code)}
                className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Station Code & Environment */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-1.5 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-[9.5px] text-white">{s.station.name}</span>
                    </div>
                    <span className="text-[7.5px] text-slate-400 block">{s.station.environmentType}</span>
                  </div>
                  <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-bold ${
                    isCompliant ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {isCompliant ? 'Normativo' : 'Superación'}
                  </span>
                </div>

                {/* Chemical Species Gauges */}
                <div className="grid grid-cols-3 gap-1 text-[8px] my-1">
                  <ScientificTooltip topic="official_monitoring_network"
                    width="w-56"
                    content="Dióxido de nitrógeno medido por quimioluminiscencia (EN 14211). Valor límite horario Directiva 2008/50/CE: 200 µg/m³, límite anual: 40 µg/m³."
                  >
                    <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center cursor-help">
                      <span className="text-slate-400 block text-[7px]">NO₂</span>
                      <strong className="text-indigo-400 font-bold">{s.measuredNO2}</strong>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip topic="official_monitoring_network"
                    width="w-56"
                    content="Ozono troposférico medido por fotometría UV (EN 14625). Umbral de información a la población: 180 µg/m³, umbral de alerta: 240 µg/m³."
                  >
                    <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center cursor-help">
                      <span className="text-slate-400 block text-[7px]">O₃</span>
                      <strong className="text-emerald-400 font-bold">{s.measuredO3}</strong>
                    </div>
                  </ScientificTooltip>

                  <ScientificTooltip topic="official_monitoring_network"
                    width="w-56"
                    content="Partículas PM₁₀ medidas por microbalanza TEOM / atenuación beta (EN 12341). Valor límite diario: 50 µg/m³, límite anual: 40 µg/m³."
                  >
                    <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center cursor-help">
                      <span className="text-slate-400 block text-[7px]">PM₁₀</span>
                      <strong className="text-amber-400 font-bold">{s.measuredPM10}</strong>
                    </div>
                  </ScientificTooltip>
                </div>

                {/* MAE Error vs PINN & FlyTo Button */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[7.5px]">
                  <span className="text-slate-400">
                    MAE PINN: <strong className="text-emerald-400">{s.errorAbsoluteNO2.toFixed(1)} µg</strong>
                  </span>
                  {onFlyToStation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFlyToStation(s.station.lat, s.station.lon);
                      }}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5 font-bold"
                    >
                      <Navigation className="w-2.5 h-2.5" /> Geoposicionar
                    </button>
                  )}
                </div>
              </div>
            </ScientificTooltip>
          );
        })}
      </div>
    </div>
  );
};
