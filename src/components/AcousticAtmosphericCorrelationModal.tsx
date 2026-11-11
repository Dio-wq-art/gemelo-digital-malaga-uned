import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  Volume2,
  Activity,
  ShieldCheck,
  Download,
  AlertTriangle,
  Sliders,
  Layers,
  MapPin,
  Sparkles,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AcousticAtmosphericCorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcousticAtmosphericCorrelationModal: React.FC<AcousticAtmosphericCorrelationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [speedKmh, setSpeedKmh] = useState<number>(50); // Velocidad media del flujo [km/h]
  const [heavyVehiclePct, setHeavyVehiclePct] = useState<number>(12); // % Vehículos Pesados
  const [asphaltType, setAsphaltType] = useState<'standard' | 'phonoreducing'>('phonoreducing'); // Asfalto Fonoabsorbente

  if (!isOpen) return null;

  // Ejes viarios de Málaga con cálculo acoplado ISO 9613-2 (Ruido Lden dBA) y COPERT 5 (NO2 ug/m3)
  const noiseCorrection = asphaltType === 'phonoreducing' ? -3.5 : 0.0;

  const roadCorridors = [
    { name: 'Alameda Principal', trafficVehDay: 22000, baseLden: 68.5, baseNO2: 31.2 },
    { name: 'Avenida Juan XXIII', trafficVehDay: 38000, baseLden: 73.2, baseNO2: 48.0 },
    { name: 'Avenida de Andalucía', trafficVehDay: 46000, baseLden: 75.8, baseNO2: 52.0 },
    { name: 'Ronda Oeste MA-20', trafficVehDay: 85000, baseLden: 78.4, baseNO2: 65.0 },
    { name: 'Calle Hilera', trafficVehDay: 19000, baseLden: 66.8, baseNO2: 34.8 },
    { name: 'Calle Carretería', trafficVehDay: 11000, baseLden: 62.4, baseNO2: 21.0 }
  ];

  const processedCorridors = roadCorridors.map(r => {
    // Cálculo ISO 9613-2 para Lden en dBA: L_den = L_ref + 10*log10(Veh/dia) + Delta_speed + Delta_heavy + Delta_asphalt
    const speedFactor = 10 * Math.log10(speedKmh / 50.0);
    const heavyFactor = (heavyVehiclePct - 10) * 0.25;
    const ldenDba = Number((r.baseLden + speedFactor + heavyFactor + noiseCorrection).toFixed(1));

    // COPERT 5 para NO2 en ug/m3: E_NOx(v) acoplado a la velocidad
    const copertSpeedModifier = 1.0 + Math.pow((speedKmh - 45) / 50, 2) * 0.4;
    const no2UgM3 = Number((r.baseNO2 * copertSpeedModifier * (1 + heavyVehiclePct * 0.02)).toFixed(1));

    // Índice Combinado de Co-Riesgo
    const coRiskIndex = Number(((ldenDba / 65.0) * (no2UgM3 / 40.0)).toFixed(2));

    return {
      ...r,
      ldenDba,
      no2UgM3,
      coRiskIndex,
      isExceedingNoise: ldenDba > 65.0, // Umbral OMS Ruido Lden > 65 dBA
      isExceedingNO2: no2UgM3 > 40.0    // Umbral UE NO2 Anual > 40 ug/m3
    };
  });

  const handleExportCSV = () => {
    const headers = 'Eje_Viario,Trafico_Veh_Dia,Velocidad_Kmh,Pesados_Pct,Asfalto,Ruido_Lden_dBA,NO2_ugm3,Indice_CoRiesgo\n';
    const rows = processedCorridors.map(r => `${r.name},${r.trafficVehDay},${speedKmh},${heavyVehiclePct},${asphaltType},${r.ldenDba},${r.no2UgM3},${r.coRiskIndex}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_coexposicion_ruido_no2_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="MATRIZ DE CO-EXPOSICIÓN RUIDO AMBIENTAL (ISO 9613-2) & NO₂ TRÁFICO (COPERT 5)"
      subtitle="Evaluación Acoplada de Contaminación Acústica (dBA) y Química (µg/m³) en Ejes Viarios de Málaga"
      icon={<Volume2 className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[8.5px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 font-mono font-bold">
          ISO 9613-2 • COPERT 5 BIVARIABLE
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[92vw] max-w-4xl max-h-[85vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Principial */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border border-amber-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Co-Exposición Bivariable Atmosférico-Acústica</span>
              <span className="bg-amber-900 text-amber-200 text-[8px] font-mono px-1.5 py-0.5 border border-amber-700">ISO 9613-2 + COPERT 5</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Análisis acoplado de la doble carga ambiental sobre la población: presión sonora (L_den dBA) y concentración de NO₂ (µg/m³).
            </p>
          </div>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar la matriz bivariable de ruido y dióxido de nitrógeno en formato CSV abierto citable.">
            <button
              onClick={handleExportCSV}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10.5px] uppercase font-bold py-2 px-3.5 rounded border border-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>EXPORTAR FAIR CSV</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* Controles de Tráfico y Mitigación Acústica */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 border border-slate-800 rounded">
          <ScientificTooltip position="top" width="w-[280px]" content="Velocidad media del flujo de tráfico viario (km/h). Afecta al ruido de rodadura (ISO 9613-2) y al factor de emisión COPERT 5.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Velocidad Flujo Viario:</span>
                <span className="text-amber-300 font-bold">{speedKmh} km/h</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={speedKmh}
                onChange={(e) => setSpeedKmh(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Porcentaje de vehículos pesados (autobuses EMT, camiones de reparto). Tienen una huella acústica +8 dBA superior a turismos.">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">% Vehículos Pesados:</span>
                <span className="text-rose-300 font-bold">{heavyVehiclePct}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={heavyVehiclePct}
                onChange={(e) => setHeavyVehiclePct(parseInt(e.target.value))}
                className="w-full accent-rose-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Pavimento fonoabsorbente (-3.5 dBA de atenuación sonora por porosidad de mezcla bituminosa).">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px]">Tipo de Pavimento:</span>
              <button
                onClick={() => setAsphaltType(asphaltType === 'phonoreducing' ? 'standard' : 'phonoreducing')}
                className={`w-full py-1.5 px-2 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  asphaltType === 'phonoreducing'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {asphaltType === 'phonoreducing' ? 'Fonoabsorbente (-3.5 dBA)' : 'Asfalto Convencional'}
              </button>
            </div>
          </ScientificTooltip>
        </div>

        {/* Gráfico de Co-Exposición Bivariable */}
        <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
          <span className="text-xs font-bold text-amber-300 block">
            Índice de Co-Riesgo Acoplado (I_co-risk): Ruido L_den vs NO₂
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedCorridors} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar dataKey="coRiskIndex" name="Índice Co-Riesgo">
                  {processedCorridors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.coRiskIndex > 1.5 ? '#f43f5e' : entry.coRiskIndex > 1.0 ? '#fbbf24' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
