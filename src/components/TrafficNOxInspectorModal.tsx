import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, AlertTriangle, Flame, ShieldAlert, Navigation, Gauge, Activity, TrendingUp, Info, MapPin, ArrowRight, Zap, RefreshCw, Layers } from 'lucide-react';
import { MALAGA_CRITICAL_TRAFFIC_HOTSPOTS, TrafficNOxHotspot, getDiurnalTrafficFactor } from '../lib/trafficEmission';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { TrafficDiurnalProfileChart } from './TrafficDiurnalProfileChart';
import { CopertSpeedEmissionsDiagram } from './CopertSpeedEmissionsDiagram';

interface TrafficNOxInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  temporalFactor: number;
  periodLabel: string;
  totalNetworkNOx_g_s: number;
  criticalSegmentsCount: number;
  averageFlowVehH: number;
  onSelectHotspot: (lat: number, lon: number, name: string) => void;
}

export const TrafficNOxInspectorModal: React.FC<TrafficNOxInspectorModalProps> = ({
  isOpen,
  onClose,
  temporalFactor,
  periodLabel,
  totalNetworkNOx_g_s,
  criticalSegmentsCount,
  averageFlowVehH,
  onSelectHotspot
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<TrafficNOxHotspot>(MALAGA_CRITICAL_TRAFFIC_HOTSPOTS[0]);
  const [viewMode, setViewMode] = useState<'diurnal' | 'copert_curve'>('diurnal');
  const diurnalInfo = getDiurnalTrafficFactor();

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Intensidad de Tráfico Rodado y Emisión de NOₓ (OpenStreetMap)"
      subtitle="Modelización espacial de fuentes lineales vehiculares y puntos críticos de emisión en Málaga"
      icon={<Car className="w-5 h-5 text-amber-400" />}
      badge={
        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 font-bold uppercase">
          HOTSPOTS NOₓ
        </span>
      }
      onClose={onClose}
      className="w-full max-w-4xl"
      initialPositionClass="top-24 left-1/2 -translate-x-1/2"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-500/50"
    >
      <div className="flex flex-col h-full bg-[#0a0f18] text-slate-200 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Cabecera Principal y KPIs Globales */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Multiplicador mecanicista aplicado a todas las emisiones vehiculares base de Málaga. Varía horariamente siguiendo el perfil de intensidad de tráfico (valle, llano, punta).">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Estado de Tráfico Actual</span>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-slate-200">
                      Factor <span className="text-emerald-400 font-mono">x{temporalFactor.toFixed(2)}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{periodLabel}</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Suma integral del flujo másico de NOx emitido a la atmósfera por todo el entramado de vías (calles, autovías MA-20/A-7) cargado en la malla OSM.">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Emisión Global Red (NOₓ)</span>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {totalNetworkNOx_g_s.toFixed(2)} <span className="text-[10px] text-slate-400">g/s</span>
                    </span>
                  </div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Número de segmentos lineales (ways OSM) que superan el umbral de emisión crítica predefinido (> 30 µg/m·s).">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Segmentos Críticos (Saturados)</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {criticalSegmentsCount} <span className="text-[10px] text-slate-400">vías</span>
                    </span>
                  </div>
                </div>
              </ScientificTooltip>
              
              <ScientificTooltip position="bottom" width="w-[280px]" content="Promedio matemático de la intensidad circulatoria a lo largo de toda el área simulada, dependiente del reloj interno del simulador.">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Flujo Vehicular Promedio</span>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {Math.round(averageFlowVehH)} <span className="text-[10px] text-slate-400">veh/h</span>
                    </span>
                  </div>
                </div>
              </ScientificTooltip>
            </div>

            {/* Split Panel: Hotspot Selector and Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Col 1: Selector Hotspot */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                <h3 className="font-bold text-slate-300 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Navigation className="w-4 h-4 text-amber-500" />
                  Nodos de Emisión Critica (Hotspots)
                </h3>
                <div className="h-[230px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {MALAGA_CRITICAL_TRAFFIC_HOTSPOTS.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => {
                        setSelectedHotspot(hotspot);
                        onSelectHotspot(hotspot.lat, hotspot.lon, hotspot.name);
                      }}
                      className={`w-full text-left p-2.5 rounded border transition-colors flex items-center justify-between ${
                        selectedHotspot.id === hotspot.id
                          ? 'bg-amber-950/40 border-amber-500/50'
                          : 'bg-black/30 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`text-[11px] font-bold block ${selectedHotspot.id === hotspot.id ? 'text-amber-400' : 'text-slate-300'}`}>
                          {hotspot.name}
                        </span>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3" /> {hotspot.corridorType}
                        </span>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${selectedHotspot.id === hotspot.id ? 'text-amber-400' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Col 2: Analytics & Chart */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-amber-400 text-[11px] uppercase tracking-wider truncate">
                      {selectedHotspot.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed border-b border-slate-800 pb-2">
                    {selectedHotspot.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ScientificTooltip position="top" width="w-[260px]" content="Flujo local de emisión de Óxidos de Nitrógeno (Q_NOx) emitido por metro lineal de la vía y segundo (ug/m·s). Ajustado a la hora actual de simulación.">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded cursor-help">
                      <span className="text-[9px] text-slate-400 block uppercase">Q_NOₓ Instantáneo</span>
                      <span className="text-base font-bold text-red-400 font-mono">
                        {(selectedHotspot.qNOx_ug_m_s * temporalFactor).toFixed(1)} <span className="text-[9px] text-slate-400">µg/m·s</span>
                      </span>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip position="top" width="w-[260px]" content="Volumen horario estimado de vehículos ligeros y pesados en circulación sobre el nudo viario específico.">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded cursor-help">
                      <span className="text-[9px] text-slate-400 block uppercase">Aforo Instantáneo</span>
                      <span className="text-base font-bold text-amber-300 font-mono">
                        {Math.round(selectedHotspot.trafficFlowVehH * temporalFactor)} <span className="text-[9px] text-slate-400">veh/h</span>
                      </span>
                    </div>
                  </ScientificTooltip>
                </div>

                {/* Mode Selector between Diurnal Profile and COPERT 5 Curve */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setViewMode('diurnal')}
                      className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                        viewMode === 'diurnal'
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Perfil Horario 24h
                    </button>
                    <button
                      onClick={() => setViewMode('copert_curve')}
                      className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                        viewMode === 'copert_curve'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Curva COPERT 5 (V vs EF)
                    </button>
                  </div>
                  <span className="text-[8.5px] text-slate-500 font-mono">Guía EMEP/EEA</span>
                </div>

                <div className="flex-1 min-h-[160px]">
                  {viewMode === 'diurnal' ? (
                    <TrafficDiurnalProfileChart 
                      hotspot={selectedHotspot} 
                      currentHour={new Date().getHours()} 
                    />
                  ) : (
                    <CopertSpeedEmissionsDiagram />
                  )}
                </div>
              </div>
            </div>

            {/* Guía de Simbología de Capas OSM en el Mapa */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Leyenda de Intensidad y Código de Color de Vías (OpenStreetMap)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-red-900/50 rounded">
                  <div className="w-4 h-1.5 bg-red-500 rounded shadow-[0_0_8px_#ef4444]"></div>
                  <div>
                    <span className="text-xs font-bold text-red-400 block">Crítico (&gt; 65 µg/m·s)</span>
                    <span className="text-[9px] text-slate-400">Autovías MA-20, A-7, Accesos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-orange-900/50 rounded">
                  <div className="w-4 h-1.5 bg-orange-500 rounded shadow-[0_0_8px_#f97316]"></div>
                  <div>
                    <span className="text-xs font-bold text-orange-400 block">Alto (32 - 65 µg/m·s)</span>
                    <span className="text-[9px] text-slate-400">Alameda, Paseo Parque, Heredia</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-yellow-900/50 rounded">
                  <div className="w-4 h-1.5 bg-yellow-400 rounded shadow-[0_0_8px_#fbbf24]"></div>
                  <div>
                    <span className="text-xs font-bold text-yellow-300 block">Medio (14 - 32 µg/m·s)</span>
                    <span className="text-[9px] text-slate-400">Vías Colectoras Secundarias</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-emerald-900/50 rounded">
                  <div className="w-4 h-1.5 bg-emerald-400 rounded shadow-[0_0_8px_#10b981]"></div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">Bajo (&lt; 14 µg/m·s)</span>
                    <span className="text-[9px] text-slate-400">ZBE, Calles Residenciales 30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </DraggableWindow>
  );
};
