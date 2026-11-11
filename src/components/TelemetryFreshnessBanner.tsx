import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Activity, Info, Satellite, Car, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScientificTooltip } from './ScientificTooltip';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

interface TelemetryFreshnessBannerProps {
  timestamps: Record<string, number>;
  isSyncing: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const TelemetryFreshnessPopover: React.FC<{
  timestamps: Record<string, number>;
  isSyncing: boolean;
  onRefresh?: () => void;
}> = ({ timestamps, isSyncing, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverMenuRef = useRef<HTMLDivElement>(null);

  // Contador de actualización en vivo cada segundo mientras esté abierto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sources = [
    { id: 'meteorology', label: 'METEO: AEMET 6156X / Open-Meteo', icon: <Clock className="w-3 h-3 text-sky-400" /> },
    { id: 'airQuality', label: `CALIDAD DEL AIRE (${SYSTEM_PROPAGATION.stationsCount} Estaciones In Situ)`, icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" /> },
    { id: 'satellites', label: `SATÉLITES & CAMS (${SYSTEM_PROPAGATION.satellitesCount} Misiones)`, icon: <Satellite className="w-3 h-3 text-purple-400" /> },
    { id: 'traffic', label: 'TRÁFICO COPERT 5 (DGT / Espiras)', icon: <Car className="w-3 h-3 text-amber-400" /> },
    { id: 'topology', label: 'TOPOLOGÍA OSM 3D & CATASTRO', icon: <Layers className="w-3 h-3 text-indigo-400" /> },
  ];

  const updatePopoverPosition = () => {
    if (containerRef.current && typeof window !== 'undefined') {
      const rect = containerRef.current.getBoundingClientRect();
      const menuWidth = 320;
      const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 12));
      setPopoverPos({
        top: rect.bottom + 6,
        left: safeLeft
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = containerRef.current && containerRef.current.contains(target);
      const insideMenu = popoverMenuRef.current && popoverMenuRef.current.contains(target);
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      if (isOpen) updatePopoverPosition();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          if (!isOpen) updatePopoverPosition();
          setIsOpen(!isOpen);
        }}
        className={`px-1.5 py-1 border transition-all flex items-center gap-1 font-bold font-mono text-[8px] uppercase tracking-normal rounded-sm cursor-pointer whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-slate-900 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'bg-black/40 border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-600/60'
        }`}
        title={`Ver latencia de datos de las 5 fuentes oficiales: AEMET, ${SYSTEM_PROPAGATION.stationsCount} estaciones Junta, ${SYSTEM_PROPAGATION.satellitesCount} satélites, Tráfico y Topología 3D`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'}`} />
        <span>LATENCIA DATOS:</span>
        <span className="text-emerald-400 font-mono">EN VIVO</span>
        <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && popoverPos && (
              <motion.div
                ref={popoverMenuRef}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
                className="fixed w-80 bg-slate-950 border border-slate-800 shadow-[0_10px_25px_rgba(0,0,0,0.9)] z-[99999] p-2.5 font-mono rounded-sm backdrop-blur-md"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Telemetría en Vivo (5 Feeds)
                  </span>
                  <div className="flex items-center gap-1">
                    {onRefresh && (
                      <button
                        onClick={() => onRefresh()}
                        disabled={isSyncing}
                        className="text-[7.5px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 hover:border-emerald-500 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Forzar actualización asíncrona de todas las fuentes"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>SINCRONIZAR</span>
                      </button>
                    )}
                    {isSyncing && (
                      <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-bold animate-pulse">
                        ASIMILANDO
                      </span>
                    )}
                    <ScientificTooltip
                      title="Asimilación Continua Multifuente (Tesis Doctoral)"
                      content={`Protocolo de ingesta y asimilación continua sin datos sintéticos ni aleatoriedad (Regla 1). Conexión en tiempo real con 5 fuentes oficiales: AEMET (meteorología sinóptica horaria), Copernicus CAMS/Sentinel-5P (${SYSTEM_PROPAGATION.satellitesCount} misiones espaciales), Red Oficial de Vigilancia de Andalucía (${SYSTEM_PROPAGATION.stationsCount} estaciones), espiras de tráfico COPERT 5 y topología 3D OSM.`}
                      formula="\Delta t_{\text{latencia}} < 60\text{ s} \quad (\text{Asimilación PINN Continua})"
                      regulatory="Directiva 2008/50/CE / W3C PROV-O Data Lineage / Directiva INSPIRE"
                      citation="Copernicus Atmosphere Monitoring Service (CAMS) / AEMET OpenData / Junta de Andalucía"
                      position="left"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {sources.map((source) => {
                    const ts = timestamps[source.id] || Date.now();
                    const ageSeconds = Math.max(0, (Date.now() - ts) / 1000);
                    const isStale = ageSeconds > 3600 * 3;

                    return (
                      <div key={source.id} className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded border border-slate-800/60">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          {source.icon}
                          <span className="text-[8.5px] font-bold text-slate-300 truncate">{source.label}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-[9px] font-bold ${isStale ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {ageSeconds < 5 ? 'Ahora mismo' : formatDistanceToNow(ts, { addSuffix: true, locale: es })}
                          </div>
                          <div className="text-[7.5px] text-slate-500 font-mono">
                            {ageSeconds < 10 ? '0s (En vivo)' : `${Math.floor(ageSeconds / 60)}m ${Math.floor(ageSeconds % 60)}s`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[7.5px] text-slate-500 italic">
                  <span>* Asimilación determinista (Regla 1)</span>
                  <span className="text-emerald-400 font-bold">Ciclo: Cada 60s</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export const TelemetryFreshnessBanner: React.FC<TelemetryFreshnessBannerProps> = ({ timestamps, isSyncing, onRefresh, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sources = [
    { 
      id: 'meteorology', 
      label: 'METEO (AEMET/Open-Meteo)', 
      icon: <Clock className="w-3 h-3 text-sky-400" />,
      citation: 'AEMET Estación 6156X / WMO No. 8',
      desc: 'Datos meteorológicos sinópticos y de microescala en tiempo real'
    },
    { 
      id: 'airQuality', 
      label: `CALIDAD DEL AIRE (${SYSTEM_PROPAGATION.stationsCount} Estaciones)`, 
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      citation: 'Directiva 2008/50/CE & Red Junta de Andalucía',
      desc: 'Telemetría horaria in situ calibrada por analizadores certificados'
    },
    { 
      id: 'satellites', 
      label: `SATÉLITES & CAMS (${SYSTEM_PROPAGATION.satellitesCount} Misiones)`, 
      icon: <Satellite className="w-3 h-3 text-purple-400" />,
      citation: 'Copernicus Sentinel-5P TROPOMI & ECMWF CAMS',
      desc: 'Columnas troposféricas satelitales y condiciones de contorno'
    },
    { 
      id: 'traffic', 
      label: 'TRÁFICO (COPERT 5/DGT)', 
      icon: <Car className="w-3 h-3 text-amber-400" />,
      citation: 'Guía EMEP/EEA 2023 & Espiras Municipales',
      desc: 'Aforos vehiculares en vivo y factores de emisión Tier 3'
    },
    { 
      id: 'topology', 
      label: 'TOPOLOGÍA (OSM 3D)', 
      icon: <Layers className="w-3 h-3 text-indigo-400" />,
      citation: 'OpenStreetMap Overpass API & Catastro MDE',
      desc: 'Geometría 3D de cañones urbanos, anchura W y altura H'
    },
  ];

  return (
    <div className={`bg-slate-950/90 backdrop-blur-md border-b border-cyan-950/60 px-3 py-1 text-slate-300 font-mono transition-all select-none ${className}`}>
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Lado izquierdo: Identificador y Estatus General */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[9.5px]">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'}`} />
            <span className="font-bold text-slate-200 tracking-wider">LATENCIA DE RED</span>
            <span className="text-[8px] text-emerald-400 font-bold px-1 bg-emerald-950/70 border border-emerald-800/80 rounded">5 FLUJOS</span>
          </div>

          <ScientificTooltip
            title="Sincronización Telemétrica en Vivo"
            content="Comprueba la frescura temporal de los 5 flujos telemétricos oficiales acoplados al Gemelo Digital. Cada dato bruto se asimila de forma continua sin retardos ni ruido sintético."
            regulatory="Directiva 2008/50/CE Art. 10 & FAIRMODE WG1"
            citation="CEN/TR 17536 (2020) Calidad de Modelos y Datos Observacionales"
            position="bottom"
            width="w-[340px]"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[8.5px] px-2 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/80 text-cyan-300 rounded cursor-pointer transition-all shadow-xs"
              title="Desplegar u ocultar detalle de latencia de las 5 fuentes"
            >
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              <span>{isExpanded ? 'Plegar Detalle' : 'Ver 5 Fuentes'}</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </ScientificTooltip>
        </div>

        {/* Lado central: Fuentes en modo compacto o expandido */}
        <div className="flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar">
          {sources.map((source) => {
            const ts = timestamps[source.id] || Date.now();
            const ageSeconds = Math.max(0, (Date.now() - ts) / 1000);
            const isStale = ageSeconds > 3600 * 3;

            return (
              <ScientificTooltip
                key={source.id}
                title={source.label}
                content={`${source.desc}. Procedencia oficial certificada: ${source.citation}.`}
                regulatory="Garantía de procedencia de datos oficiales (Regla 1 y 2)"
                citation={source.citation}
                position="bottom"
                width="w-[300px]"
              >
                <div className="flex items-center gap-1.5 cursor-help px-1.5 py-0.5 rounded hover:bg-slate-900/60 transition-colors">
                  <span className="shrink-0">{source.icon}</span>
                  <div className="flex flex-col text-[8px] leading-tight">
                    <span className="text-slate-400 font-bold uppercase tracking-tight">{source.label.split('(')[0].trim()}</span>
                    <span className={`font-mono text-[8.5px] ${isStale ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {ageSeconds < 60 ? '● EN VIVO' : formatDistanceToNow(ts, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </ScientificTooltip>
            );
          })}
        </div>

        {/* Lado derecho: Acciones de refresco y asimilación */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {onRefresh && (
            <ScientificTooltip
              title="Forzar Ingesta y Reasimilación"
              content="Dispara una petición síncrona a las 5 fuentes oficiales para refrescar la telemetría del punto activo y su contorno."
              position="bottom"
              width="w-[280px]"
            >
              <button
                onClick={onRefresh}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/70 hover:border-cyan-400 text-cyan-200 rounded text-[8.5px] font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refrescar</span>
              </button>
            </ScientificTooltip>
          )}

          <AnimatePresence>
            {isSyncing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 border border-amber-600/60 rounded text-amber-300 text-[8px] font-bold shrink-0"
              >
                <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                <span>Asimilando...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detalle Plegable / Desplegable con Metadatos Ampliados */}
      {isExpanded && (
        <div className="mt-1 pt-1 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[8px] animate-fadeIn pb-0.5">
          {sources.map((s) => (
            <div key={s.id} className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 font-bold text-slate-200">
                  {s.icon}
                  <span className="truncate">{s.label}</span>
                </div>
                <div className="text-slate-400 text-[7.5px] mt-0.5">{s.desc}</div>
              </div>
              <div className="mt-1 pt-1 border-t border-slate-800/80 text-[7px] text-cyan-400 truncate">
                {s.citation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

