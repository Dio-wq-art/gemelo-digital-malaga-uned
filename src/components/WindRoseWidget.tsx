import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Compass, ArrowUpRight, Download, Info, ChevronDown, ChevronUp, Layers, Sliders, ShieldCheck } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { getWindComponents } from '../lib/physics';

export interface WindRoseSectorData {
  cardinal: string;
  angleDeg: number;
  localName: string;
  freqPct: number;
  // Beaufort speed class frequencies (%)
  speedClasses: {
    c1_0_5: number;   // < 5 km/h
    c2_5_15: number;  // 5 - 15 km/h
    c3_15_30: number; // 15 - 30 km/h
    c4_gt30: number;  // > 30 km/h
  };
}

// Climatología Determinista de la Rosa de los Vientos de Málaga (AEMET / EIONET / Open-Meteo)
export const MALAGA_WIND_ROSE_CLIMATOLOGY: WindRoseSectorData[] = [
  { cardinal: 'N',   angleDeg: 0,     localName: 'Norte (Montes de Málaga)', freqPct: 4.0,  speedClasses: { c1_0_5: 1.2, c2_5_15: 1.8, c3_15_30: 0.8, c4_gt30: 0.2 } },
  { cardinal: 'NNE', angleDeg: 22.5,  localName: 'Noreste (Axarquía)',       freqPct: 3.0,  speedClasses: { c1_0_5: 0.8, c2_5_15: 1.5, c3_15_30: 0.5, c4_gt30: 0.2 } },
  { cardinal: 'NE',  angleDeg: 45,    localName: 'Gregal (Marruecos-Litoral)', freqPct: 5.0,  speedClasses: { c1_0_5: 1.0, c2_5_15: 2.2, c3_15_30: 1.3, c4_gt30: 0.5 } },
  { cardinal: 'ENE', angleDeg: 67.5,  localName: 'Greco-Levante',            freqPct: 5.0,  speedClasses: { c1_0_5: 1.0, c2_5_15: 2.0, c3_15_30: 1.5, c4_gt30: 0.5 } },
  { cardinal: 'E',   angleDeg: 90,    localName: 'Levante (Mar de Alborán)',  freqPct: 14.0, speedClasses: { c1_0_5: 2.0, c2_5_15: 6.0, c3_15_30: 4.5, c4_gt30: 1.5 } },
  { cardinal: 'ESE', angleDeg: 112.5, localName: 'Levante-Sur',              freqPct: 12.0, speedClasses: { c1_0_5: 1.8, c2_5_15: 5.2, c3_15_30: 4.0, c4_gt30: 1.0 } },
  { cardinal: 'SE',  angleDeg: 135,   localName: 'Brisa de Bahía (Litoral)', freqPct: 12.0, speedClasses: { c1_0_5: 2.5, c2_5_15: 6.5, c3_15_30: 2.5, c4_gt30: 0.5 } },
  { cardinal: 'SSE', angleDeg: 157.5, localName: 'Brisa Sureste',            freqPct: 5.0,  speedClasses: { c1_0_5: 1.2, c2_5_15: 2.8, c3_15_30: 0.8, c4_gt30: 0.2 } },
  { cardinal: 'S',   angleDeg: 180,   localName: 'Sur (Brisa Marítima Directa)', freqPct: 8.0, speedClasses: { c1_0_5: 2.0, c2_5_15: 4.5, c3_15_30: 1.2, c4_gt30: 0.3 } },
  { cardinal: 'SSW', angleDeg: 202.5, localName: 'Suroeste (Costa del Sol)', freqPct: 6.0,  speedClasses: { c1_0_5: 1.5, c2_5_15: 3.2, c3_15_30: 1.0, c4_gt30: 0.3 } },
  { cardinal: 'SW',  angleDeg: 225,   localName: 'Suroeste Litoral',         freqPct: 2.0,  speedClasses: { c1_0_5: 0.6, c2_5_15: 1.0, c3_15_30: 0.3, c4_gt30: 0.1 } },
  { cardinal: 'WSW', angleDeg: 247.5, localName: 'Poniente-Suroeste',        freqPct: 2.0,  speedClasses: { c1_0_5: 0.5, c2_5_15: 1.0, c3_15_30: 0.4, c4_gt30: 0.1 } },
  { cardinal: 'W',   angleDeg: 270,   localName: 'Poniente (Estrecho)',      freqPct: 8.0,  speedClasses: { c1_0_5: 1.5, c2_5_15: 3.5, c3_15_30: 2.2, c4_gt30: 0.8 } },
  { cardinal: 'WNW', angleDeg: 292.5, localName: 'Poniente-Terral',          freqPct: 8.0,  speedClasses: { c1_0_5: 1.0, c2_5_15: 3.0, c3_15_30: 2.8, c4_gt30: 1.2 } },
  { cardinal: 'NW',  angleDeg: 315,   localName: 'Terral de Málaga (Catabático)', freqPct: 12.0, speedClasses: { c1_0_5: 1.0, c2_5_15: 3.5, c3_15_30: 4.5, c4_gt30: 3.0 } },
  { cardinal: 'NNW', angleDeg: 337.5, localName: 'Norte-Terral (Guadalhorce)', freqPct: 2.0,  speedClasses: { c1_0_5: 0.5, c2_5_15: 1.0, c3_15_30: 0.4, c4_gt30: 0.1 } },
];

export interface WindRoseWidgetProps {
  currentWindDirDeg: number;
  currentWindSpeedKmh: number;
  currentTempC?: number;
  currentSolarRadWm2?: number;
  onSelectSector?: (cardinal: string, angleDeg: number) => void;
  className?: string;
}

export function WindRoseWidget({
  currentWindDirDeg,
  currentWindSpeedKmh,
  currentTempC = 22.0,
  currentSolarRadWm2 = 450,
  onSelectSector,
  className = "absolute bottom-12 left-3 z-30"
}: WindRoseWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredSector, setHoveredSector] = useState<WindRoseSectorData | null>(null);
  const [selectedSectorCardinal, setSelectedSectorCardinal] = useState<string | null>(null);

  // Componentes de viento
  const windComp = useMemo(() => {
    return getWindComponents(currentWindDirDeg, currentWindSpeedKmh);
  }, [currentWindDirDeg, currentWindSpeedKmh]);

  // Estabilidad Atmosférica de Pasquill-Gifford (A-F)
  const pasquillClass = useMemo(() => {
    const speedMs = currentWindSpeedKmh / 3.6;
    const isDay = currentSolarRadWm2 > 20;

    if (isDay) {
      if (currentSolarRadWm2 > 600) {
        if (speedMs < 2) return { class: 'A', label: 'Extremadamente Inestable', color: 'text-red-400', desc: 'Convección intensa / Dispersión vertical muy elevada (Pluma dispersa)' };
        if (speedMs < 5) return { class: 'B', label: 'Moderadamente Inestable', color: 'text-amber-400', desc: 'Mezcla convectiva activa / Buen penacho de advección' };
        return { class: 'C', label: 'Ligeramente Inestable', color: 'text-yellow-300', desc: 'Turbulencia mecánica dominante' };
      } else {
        if (speedMs < 3) return { class: 'B', label: 'Moderadamente Inestable', color: 'text-amber-400', desc: 'Térmica moderada' };
        if (speedMs < 5) return { class: 'C', label: 'Ligeramente Inestable', color: 'text-yellow-300', desc: 'Efecto del cizallamiento de viento' };
        return { class: 'D', label: 'Neutral', color: 'text-emerald-400', desc: 'Dominio de advección horizontal / Ecuación de Pasquill Estándar' };
      }
    } else {
      if (speedMs < 2) return { class: 'F', label: 'Extremadamente Estable', color: 'text-purple-400', desc: 'Inversión térmica nocturna / Atrapamiento de contaminantes en superficie' };
      if (speedMs < 3) return { class: 'E', label: 'Moderadamente Estable', color: 'text-indigo-400', desc: 'Capa límite nocturna estable / Dispersión lenta' };
      return { class: 'D', label: 'Neutral', color: 'text-emerald-400', desc: 'Capa límite neutra por viento nocturno constante' };
    }
  }, [currentWindSpeedKmh, currentSolarRadWm2]);

  // Sector actual
  const activeSector = useMemo(() => {
    const cardIdx = Math.round((currentWindDirDeg % 360) / 22.5) % 16;
    return MALAGA_WIND_ROSE_CLIMATOLOGY[cardIdx];
  }, [currentWindDirDeg]);

  const displayedSector = hoveredSector || MALAGA_WIND_ROSE_CLIMATOLOGY.find(s => s.cardinal === selectedSectorCardinal) || activeSector;

  // Renderizador SVG de la Rosa de los Vientos (16 sectores en coordenadas polares)
  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 88; // radio máximo para 20% frecuencia

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    // Convertir de orientación meteorológica (0° Norte, horario) a estándar matemática (0° Este, antihorario)
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const createSectorArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    if (innerR === 0) {
      return [
        'M', cx, cy,
        'L', startOuter.x, startOuter.y,
        'A', outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        'Z'
      ].join(' ');
    }

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
      'Z'
    ].join(' ');
  };

  // Exportar GeoJSON de la Rosa de los Vientos
  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      properties: {
        title: "Rosa de los Vientos y Climatología de Málaga (AEMET/EIONET)",
        station: "Málaga Airport / Paseo del Parque",
        currentWindDirDeg,
        currentWindSpeedKmh,
        pasquillStabilityClass: pasquillClass.class,
        pasquillStabilityLabel: pasquillClass.label
      },
      features: MALAGA_WIND_ROSE_CLIMATOLOGY.map((s) => {
        const advAngle = (s.angleDeg + 180) % 360;
        return {
          type: "Feature",
          properties: {
            cardinal: s.cardinal,
            bearingDegrees: s.angleDeg,
            advectionBearingDegrees: advAngle,
            localMicroclimateName: s.localName,
            climatologicalFrequencyPct: s.freqPct,
            speedClassesPct: s.speedClasses
          },
          geometry: {
            type: "Point",
            coordinates: [-4.4214, 36.7213]
          }
        };
      })
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rosa_Vientos_Malaga_FAIR_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar CSV
  const exportCSV = () => {
    const headers = ["Rumbo_Cardinal", "Grados", "Denominacion_Local", "Frecuencia_Total_Pct", "Calma_0_5kmh", "Brisa_5_15kmh", "Viento_15_30kmh", "Terral_gt30kmh"];
    const rows = MALAGA_WIND_ROSE_CLIMATOLOGY.map(s => [
      s.cardinal,
      s.angleDeg,
      `"${s.localName}"`,
      s.freqPct,
      s.speedClasses.c1_0_5,
      s.speedClasses.c2_5_15,
      s.speedClasses.c3_15_30,
      s.speedClasses.c4_gt30
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rosa_Vientos_Malaga_Climatologia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${className} pointer-events-auto select-none transition-all`}>
      <div className="bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md text-slate-200 overflow-hidden rounded-sm max-w-[340px] sm:max-w-[380px]">
        
        {/* Encabezado del Widget */}
        <div className="p-2 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase">ROSA DE LOS VIENTOS</span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-700/80 px-1 py-0.2 font-mono font-bold">16 SECTORES</span>
              </div>
              <div className="text-[8.5px] text-slate-400 font-mono">
                Málaga Climatología & Vector Advección
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ScientificTooltip position="top" width="w-[280px]" content="Rosa de los Vientos interactiva de 16 sectores. Muestra la frecuencia climatológica de origen del viento (AEMET/EIONET) y la dirección opuesta de advección (+180°) hacia donde se transportan los contaminantes.">
              <button 
                type="button" 
                onClick={() => setIsExpanded(prev => !prev)}
                className="text-slate-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
                aria-label="Información científica de la Rosa de los Vientos"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </ScientificTooltip>

            <ScientificTooltip content={isExpanded ? "Contraer visualizador de la Rosa de los Vientos." : "Expandir distribución angular de viento y frecuencias meteorológicas."}>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-white p-1 transition-colors rounded hover:bg-slate-800/80 cursor-pointer"
                aria-label="Toggle expand"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Resumen de Viento Actual (Siempre visible en modo compacto) */}
        <div className="p-2.5 px-3 bg-slate-900/40 flex items-center justify-between border-b border-slate-800/60 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            {/* Flecha indicadora de origen del viento */}
            <ScientificTooltip content={`Vector de viento actual: ${currentWindDirDeg}° (${windComp.cardinal}). Origen meteorológico del flujo incidente.`}>
              <div 
                className="w-7 h-7 rounded bg-slate-900 border border-cyan-500/60 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0 cursor-help"
                style={{ transform: `rotate(${currentWindDirDeg}deg)` }}
              >
                <Wind className="w-4 h-4" />
              </div>
            </ScientificTooltip>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Origen:</span>
                <span className="text-cyan-300 font-bold">{windComp.cardinal} ({currentWindDirDeg}°)</span>
                <span className="text-emerald-400 font-bold">{currentWindSpeedKmh.toFixed(1)} km/h</span>
              </div>
              <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                <span>Advección:</span>
                <span className="text-amber-300 font-bold">{windComp.advectionCardinal} ({windComp.advectionAngle}°)</span>
                <span className="text-slate-500">|</span>
                <span className={pasquillClass.color}>Pasquill {pasquillClass.class}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>{isExpanded ? "Ocultar Malla" : "Ver Rosa"}</span>
          </button>
        </div>

        {/* Cuerpo Expandible con el Diagrama SVG Polar + Histórico */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 flex flex-col gap-3 overflow-hidden bg-slate-950/90"
            >
              {/* Leyenda de Clases de Velocidad Beaufort */}
              <div className="flex items-center justify-between text-[8.5px] font-mono bg-slate-900/80 p-1.5 px-2 rounded border border-slate-800">
                <span className="text-slate-400 uppercase font-bold shrink-0">Escala Beaufort:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span className="text-slate-300">&lt;5 km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300">5-15</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-slate-300">15-30</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-slate-300">&gt;30</span>
                  </div>
                </div>
              </div>

              {/* Diagrama Polar SVG */}
              <div className="relative flex items-center justify-center py-1">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                  <defs>
                    <radialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Círculo de brillo de fondo */}
                  <circle cx={cx} cy={cy} r={maxRadius + 10} fill="url(#roseGlow)" />

                  {/* Anillos concéntricos de frecuencia (5%, 10%, 15%, 20%) */}
                  {[5, 10, 15, 20].map((freqPct) => {
                    const r = (freqPct / 20) * maxRadius;
                    return (
                      <g key={freqPct}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill="none"
                          stroke="#334155"
                          strokeDasharray={freqPct === 20 ? "none" : "2 2"}
                          strokeWidth={freqPct === 20 ? "1" : "0.5"}
                        />
                        <text
                          x={cx + 3}
                          y={cy - r + 3}
                          fill="#64748b"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {freqPct}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Ejes cardinales principales (N-S, E-W) */}
                  <line x1={cx} y1={cy - maxRadius - 12} x2={cx} y2={cy + maxRadius + 12} stroke="#475569" strokeWidth="0.8" />
                  <line x1={cx - maxRadius - 12} y1={cy} x2={cx + maxRadius + 12} y2={cy} stroke="#475569" strokeWidth="0.8" />

                  {/* Ejes diagonales (NE-SW, NW-SE) */}
                  <line x1={cx - maxRadius * 0.7} y1={cy - maxRadius * 0.7} x2={cx + maxRadius * 0.7} y2={cy + maxRadius * 0.7} stroke="#334155" strokeWidth="0.5" strokeDasharray="1 3" />
                  <line x1={cx + maxRadius * 0.7} y1={cy - maxRadius * 0.7} x2={cx - maxRadius * 0.7} y2={cy + maxRadius * 0.7} stroke="#334155" strokeWidth="0.5" strokeDasharray="1 3" />

                  {/* Sectores de la Rosa (16 sectores apilados por clases de velocidad) */}
                  {MALAGA_WIND_ROSE_CLIMATOLOGY.map((sec) => {
                    const halfWidth = 11.25; // 22.5° / 2
                    const startAngle = sec.angleDeg - halfWidth;
                    const endAngle = sec.angleDeg + halfWidth;

                    const isHovered = hoveredSector?.cardinal === sec.cardinal;
                    const isSelected = selectedSectorCardinal === sec.cardinal;
                    const isActiveLive = activeSector.cardinal === sec.cardinal;

                    // Calcular radios acumulados para las 4 clases de velocidad Beaufort
                    const r1 = (sec.speedClasses.c1_0_5 / 20) * maxRadius;
                    const r2 = r1 + (sec.speedClasses.c2_5_15 / 20) * maxRadius;
                    const r3 = r2 + (sec.speedClasses.c3_15_30 / 20) * maxRadius;
                    const r4 = r3 + (sec.speedClasses.c4_gt30 / 20) * maxRadius;

                    return (
                      <g
                        key={sec.cardinal}
                        className="cursor-pointer transition-all duration-150 group"
                        onMouseEnter={() => setHoveredSector(sec)}
                        onMouseLeave={() => setHoveredSector(null)}
                        onClick={() => {
                          const newCard = selectedSectorCardinal === sec.cardinal ? null : sec.cardinal;
                          setSelectedSectorCardinal(newCard);
                          if (onSelectSector) onSelectSector(sec.cardinal, sec.angleDeg);
                        }}
                      >
                        {/* Clase 1: <5 km/h (Cyan) */}
                        <path
                          d={createSectorArcPath(startAngle, endAngle, 0, r1)}
                          fill="#06b6d4"
                          fillOpacity={isHovered || isSelected ? 0.95 : 0.75}
                          stroke="#0284c7"
                          strokeWidth="0.5"
                        />
                        {/* Clase 2: 5-15 km/h (Emerald) */}
                        <path
                          d={createSectorArcPath(startAngle, endAngle, r1, r2)}
                          fill="#10b981"
                          fillOpacity={isHovered || isSelected ? 0.95 : 0.75}
                          stroke="#047857"
                          strokeWidth="0.5"
                        />
                        {/* Clase 3: 15-30 km/h (Amber) */}
                        <path
                          d={createSectorArcPath(startAngle, endAngle, r2, r3)}
                          fill="#f59e0b"
                          fillOpacity={isHovered || isSelected ? 0.95 : 0.75}
                          stroke="#b45309"
                          strokeWidth="0.5"
                        />
                        {/* Clase 4: >30 km/h (Rose/Terral) */}
                        <path
                          d={createSectorArcPath(startAngle, endAngle, r3, r4)}
                          fill="#f43f5e"
                          fillOpacity={isHovered || isSelected ? 0.95 : 0.75}
                          stroke="#be123c"
                          strokeWidth="0.5"
                        />

                        {/* Borde exterior e indicador de selección */}
                        {(isSelected || isHovered || isActiveLive) && (
                          <path
                            d={createSectorArcPath(startAngle, endAngle, 0, r4)}
                            fill="none"
                            stroke={isActiveLive ? "#38bdf8" : isSelected ? "#f59e0b" : "#ffffff"}
                            strokeWidth={isActiveLive ? "2" : "1.5"}
                            className={isActiveLive ? "animate-pulse" : ""}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Vector del Viento Actual en Tiempo Real (Flecha de origen) */}
                  {(() => {
                    const arrowR = maxRadius + 8;
                    const ptStart = polarToCartesian(cx, cy, arrowR + 10, currentWindDirDeg);
                    const ptEnd = polarToCartesian(cx, cy, arrowR - 15, currentWindDirDeg);
                    const advPtEnd = polarToCartesian(cx, cy, maxRadius * 0.85, (currentWindDirDeg + 180) % 360);

                    return (
                      <g>
                        {/* Vector de Advección (Pluma de Transporte en sentido opuesto +180°) */}
                        <line
                          x1={cx}
                          y1={cy}
                          x2={advPtEnd.x}
                          y2={advPtEnd.y}
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray="3 2"
                          opacity="0.9"
                        />
                        <circle cx={advPtEnd.x} cy={advPtEnd.y} r="3" fill="#f59e0b" className="animate-ping" />

                        {/* Vector del Viento Incident (Origen) */}
                        <line
                          x1={ptStart.x}
                          y1={ptStart.y}
                          x2={ptEnd.x}
                          y2={ptEnd.y}
                          stroke="#38bdf8"
                          strokeWidth="3"
                        />
                        <polygon
                          points={`${ptEnd.x},${ptEnd.y} ${ptEnd.x - 4},${ptEnd.y + 6} ${ptEnd.x + 4},${ptEnd.y + 6}`}
                          fill="#0284c7"
                          transform={`rotate(${currentWindDirDeg}, ${ptEnd.x}, ${ptEnd.y})`}
                        />
                      </g>
                    );
                  })()}

                  {/* Etiquetas Cardinales (N, E, S, W, etc.) */}
                  {[
                    { label: 'N', deg: 0, x: cx, y: cy - maxRadius - 14, color: '#f87171' },
                    { label: 'E', deg: 90, x: cx + maxRadius + 14, y: cy + 3, color: '#38bdf8' },
                    { label: 'S', deg: 180, x: cx, y: cy + maxRadius + 16, color: '#34d399' },
                    { label: 'W', deg: 270, x: cx - maxRadius - 14, y: cy + 3, color: '#fbbf24' },
                    { label: 'NE', deg: 45, x: cx + (maxRadius + 14) * 0.707, y: cy - (maxRadius + 14) * 0.707, color: '#94a3b8' },
                    { label: 'SE', deg: 135, x: cx + (maxRadius + 14) * 0.707, y: cy + (maxRadius + 14) * 0.707, color: '#94a3b8' },
                    { label: 'SW', deg: 225, x: cx - (maxRadius + 14) * 0.707, y: cy + (maxRadius + 14) * 0.707, color: '#94a3b8' },
                    { label: 'NW', deg: 315, x: cx - (maxRadius + 14) * 0.707, y: cy - (maxRadius + 14) * 0.707, color: '#f87171' },
                  ].map((lbl) => (
                    <text
                      key={lbl.label}
                      x={lbl.x}
                      y={lbl.y}
                      fill={lbl.color}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {lbl.label}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Panel de Detalle del Sector Seleccionado / Inspeccionado */}
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[10px] font-mono flex flex-col gap-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Sector Seleccionado:</span>
                  <span className="text-cyan-300 font-bold">{displayedSector.cardinal} ({displayedSector.angleDeg}°)</span>
                </div>

                <div className="text-slate-300 font-bold text-[10.5px] text-cyan-400">
                  {displayedSector.localName}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px]">FRECUENCIA ANUAL</span>
                    <strong className="text-emerald-400 text-[11px]">{displayedSector.freqPct.toFixed(1)}%</strong>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[8px]">ADVECCIÓN (DOWNWIND)</span>
                    <strong className="text-amber-300 text-[11px]">{(displayedSector.angleDeg + 180) % 360}°</strong>
                  </div>
                </div>

                {/* Detalle de Estabilidad Pasquill-Gifford */}
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[9px] flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Categoría Pasquill:</span>
                    <span className={`font-bold ${pasquillClass.color}`}>Clase {pasquillClass.class} ({pasquillClass.label})</span>
                  </div>
                  <div className="text-slate-400 text-[8.5px] italic leading-tight">
                    {pasquillClass.desc}
                  </div>
                </div>
              </div>

              {/* Botones de Exportación FAIR */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <ScientificTooltip position="top" width="w-[260px]" content="Exportar mallas polares y vectores directores de la Rosa de los Vientos en GeoJSON estandarizado (FAIR).">
                  <button
                    type="button"
                    onClick={exportGeoJSON}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 hover:border-cyan-500 p-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>GeoJSON</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="top" width="w-[260px]" content="Exportar matriz de frecuencias por sector y clases de Beaufort en CSV citable para auditoría meteorológica.">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/80 hover:border-emerald-500 p-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>CSV</span>
                  </button>
                </ScientificTooltip>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
