import React from 'react';
import { motion } from 'motion/react';
import { Bus, Zap, Activity, Leaf, ShieldCheck, ArrowRight, Gauge, BatteryCharging } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { EmtGtfsSummary } from '../lib/emtGtfsCopert';

interface EmtGtfsTransitEmissionDiagramProps {
  summary: EmtGtfsSummary;
  is100PctElectricSimulated: boolean;
}

export function EmtGtfsTransitEmissionDiagram({
  summary,
  is100PctElectricSimulated
}: EmtGtfsTransitEmissionDiagramProps) {
  // SVG Canvas dimensions: 620x350
  const width = 620;
  const height = 350;

  const totalBuses = summary.totalActiveBusesInService;
  const currentElectric = summary.linesStatus.reduce((acc, l) => acc + l.electricCount, 0);
  const currentDiesel = summary.linesStatus.reduce((acc, l) => acc + l.dieselCount, 0);
  const currentHybrid = summary.linesStatus.reduce((acc, l) => acc + l.hybridCount, 0);
  const currentCng = summary.linesStatus.reduce((acc, l) => acc + l.cngCount, 0);

  const electricBuses = is100PctElectricSimulated ? totalBuses : currentElectric;
  const electricPct = totalBuses > 0 ? (electricBuses / totalBuses) * 100 : 0;

  const baseNOx = summary.linesStatus.reduce((acc, l) => acc + l.totalNOxEmissionsGramsHour, 0);
  const basePM25 = summary.linesStatus.reduce((acc, l) => acc + l.totalPM25EmissionsGramsHour, 0);

  const totalNoxHourlyG = is100PctElectricSimulated ? 0.0 : baseNOx;
  const totalPm25HourlyG = is100PctElectricSimulated ? 0.0 : basePM25;

  const noxSavedG = is100PctElectricSimulated ? baseNOx : 0.0;
  const pmSavedG = is100PctElectricSimulated ? basePM25 : 0.0;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
            <Bus className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Corredores de Transporte EMT Málaga &amp; Factores COPERT 5 Tier 3</span>
              <ScientificTooltip
                topic="copert_speed_emissions"
                title="Integración GTFS y COPERT 5 Tier 3"
                content="Asimilación en tiempo real del General Transit Feed Specification (GTFS) de la Empresa Malagueña de Transportes (EMT) acoplada a las ecuaciones de velocidad y aceleración instantánea COPERT 5."
                regulatory="Metodología EMEP/EEA 2023 & Reglamento (UE) 2019/1242"
              />
            </h4>
            <p className="text-[9.5px] text-slate-400">
              Integración de telemetría GTFS en tiempo real • Ciclos de parada y arranque (Stop &amp; Go) vs Electrificación
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Penetración de Flota Cero Emisiones"
            content="Porcentaje de vehículos 100% eléctricos en servicio activo respecto a la flota total programada por los concesionarios municipales."
          >
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-help ${
              is100PctElectricSimulated
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-sky-950 text-sky-300 border-sky-700'
            }`}>
              <Zap className="w-3 h-3 text-emerald-400" />
              Flota Cero Emisiones: {electricPct.toFixed(0)}%
            </span>
          </ScientificTooltip>
        </div>
      </div>

      {/* SVG Canvas for Bus Corridors */}
      <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-lg border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          id="emt-gtfs-transit-svg"
        >
          <defs>
            <linearGradient id="routeGrad1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="routeGrad2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="routeGrad3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="busGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid & Axis Lines */}
          <line x1="30" y1="60" x2="590" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <line x1="30" y1="130" x2="590" y2="130" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <line x1="30" y1="200" x2="590" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          <line x1="30" y1="270" x2="590" y2="270" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

          {/* 1. Corridor: Línea 1 (Parque - Alameda - San Andrés) */}
          <g>
            <path
              d="M 40 70 C 180 70, 240 50, 360 85 S 480 70, 580 70"
              fill="none"
              stroke={is100PctElectricSimulated ? '#10b981' : 'url(#routeGrad1)'}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Bus Stations */}
            <circle cx="60" cy="70" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="230" cy="58" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="360" cy="85" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="560" cy="70" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

            {/* Line Label */}
            <rect x="40" y="42" width="60" height="18" rx="3" fill="#0284c7" />
            <text x="70" y="54" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Línea 1</text>
            <text x="110" y="55" fill="#94a3b8" fontSize="8">Parque ↔ San Andrés (12 buh/h)</text>

            {/* Moving Bus on Line 1 */}
            <g transform="translate(290, 68)">
              <rect x="-14" y="-8" width="28" height="16" rx="3" fill={is100PctElectricSimulated ? '#10b981' : '#0284c7'} stroke="#ffffff" strokeWidth="1.2" filter="url(#busGlow)" />
              <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EMT</text>
            </g>
          </g>

          {/* 2. Corridor: Línea 3 / 11 (El Palo - Puerta Blanca / Teatinos) */}
          <g>
            <path
              d="M 40 145 C 150 145, 260 170, 400 135 S 520 150, 580 150"
              fill="none"
              stroke={is100PctElectricSimulated ? '#10b981' : 'url(#routeGrad2)'}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Bus Stations */}
            <circle cx="70" cy="145" r="4.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
            <circle cx="260" cy="168" r="4.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
            <circle cx="430" cy="138" r="4.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
            <circle cx="560" cy="150" r="4.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />

            {/* Line Label */}
            <rect x="40" y="118" width="60" height="18" rx="3" fill="#059669" />
            <text x="70" y="130" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Línea 3/11</text>
            <text x="110" y="131" fill="#94a3b8" fontSize="8">Eje Litoral Este-Oeste (18 buh/h)</text>

            {/* Moving Bus on Line 3 */}
            <g transform="translate(420, 138)">
              <rect x="-14" y="-8" width="28" height="16" rx="3" fill={is100PctElectricSimulated ? '#10b981' : '#059669'} stroke="#ffffff" strokeWidth="1.2" filter="url(#busGlow)" />
              <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EMT</text>
            </g>
          </g>

          {/* 3. Corridor: Línea 7 / C1 / C2 (Circulares & Distrito Centro) */}
          <g>
            <path
              d="M 40 220 C 180 250, 320 190, 440 230 S 540 220, 580 220"
              fill="none"
              stroke={is100PctElectricSimulated ? '#10b981' : 'url(#routeGrad3)'}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Bus Stations */}
            <circle cx="60" cy="223" r="4.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="210" cy="245" r="4.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="360" cy="205" r="4.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="560" cy="220" r="4.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />

            {/* Line Label */}
            <rect x="40" y="192" width="60" height="18" rx="3" fill="#d97706" />
            <text x="70" y="204" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Línea C1/C2</text>
            <text x="110" y="205" fill="#94a3b8" fontSize="8">Circular Cañones Urbanos Centro (14 buh/h)</text>

            {/* Moving Bus on Line C1 */}
            <g transform="translate(180, 246)">
              <rect x="-14" y="-8" width="28" height="16" rx="3" fill={is100PctElectricSimulated ? '#10b981' : '#d97706'} stroke="#ffffff" strokeWidth="1.2" filter="url(#busGlow)" />
              <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EMT</text>
            </g>
          </g>

          {/* 4. Real-time Dynamics & Speed-Emission Curve */}
          <g transform="translate(40, 260)">
            <rect width="540" height="75" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" opacity="0.95" />
            <text x="12" y="18" fill="#e2e8f0" fontSize="9" fontWeight="bold">
              Dinámica de Aceleración COPERT 5 (Stop &amp; Go en Semáforos):
            </text>

            {/* Step 1: Parada */}
            <g transform="translate(15, 28)">
              <rect width="105" height="38" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="8" y="14" fill="#94a3b8" fontSize="7.5">1. Parada / Ralentí</text>
              <text x="8" y="28" fill="#38bdf8" fontSize="8" fontWeight="bold">v = 0 km/h</text>
            </g>

            {/* Step 2: Aceleración */}
            <g transform="translate(145, 28)">
              <rect width="125" height="38" rx="4" fill={is100PctElectricSimulated ? '#064e3b' : '#450a0a'} stroke={is100PctElectricSimulated ? '#10b981' : '#ef4444'} strokeWidth="1" />
              <text x="8" y="14" fill={is100PctElectricSimulated ? '#a7f3d0' : '#fca5a5'} fontSize="7.5">2. Arranque (Pico NOₓ)</text>
              <text x="8" y="28" fill={is100PctElectricSimulated ? '#34d399' : '#f87171'} fontSize="8" fontWeight="bold">
                {is100PctElectricSimulated ? '0.0 g/km (Eléctrico)' : '14.8 g/km (Tier 3)'}
              </text>
            </g>

            {/* Step 3: Crucero */}
            <g transform="translate(295, 28)">
              <rect width="115" height="38" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="8" y="14" fill="#94a3b8" fontSize="7.5">3. Crucero Urbano</text>
              <text x="8" y="28" fill="#fbbf24" fontSize="8" fontWeight="bold">v = 28 km/h</text>
            </g>

            {/* Step 4: Frenado / Regeneración */}
            <g transform="translate(435, 28)">
              <rect width="90" height="38" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x="8" y="14" fill="#a7f3d0" fontSize="7.5">4. Regeneración</text>
              <text x="8" y="28" fill="#34d399" fontSize="8" fontWeight="bold">Regen +32%</text>
            </g>
          </g>
        </svg>
      </div>

      {/* Numerical Synthesis Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Flota en Circulación:</span>
            <ScientificTooltip
              title="Flota Activa en Servicio (GTFS)"
              content="Número de unidades simultáneamente en ruta según el feed de posiciones horarias de la EMT."
            />
          </div>
          <span className="text-sky-300 font-bold text-xs">{totalBuses} autobuses</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Emisión Total NOₓ:</span>
            <ScientificTooltip
              title="Tasa de Emisión Agregada de NOx"
              content="Cálculo integrado en gramos por hora sumando las contribuciones de todas las líneas en tránsito bajo el régimen cinético COPERT 5."
            />
          </div>
          <span className={`${is100PctElectricSimulated ? 'text-emerald-400' : 'text-amber-400'} font-bold text-xs`}>
            {totalNoxHourlyG.toFixed(1)} g/h
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Emisión Total PM₂.₅:</span>
            <ScientificTooltip
              title="Emisión de Partículas Finas por Tubo de Escape y Freno"
              content="Comprende hollín elemental (elemental carbon / soot) y desgaste de ferodos de frenado."
            />
          </div>
          <span className={`${is100PctElectricSimulated ? 'text-emerald-400' : 'text-rose-400'} font-bold text-xs`}>
            {totalPm25HourlyG.toFixed(2)} g/h
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 block">Ahorro Ambiental:</span>
            <ScientificTooltip
              title="Reducción Másica de Contaminantes"
              content="Masa de óxidos de nitrógeno evitada mediante la sustitución completa de tecnologías térmicas por tracción eléctrica pura."
            />
          </div>
          <span className="text-emerald-400 font-bold text-xs">
            {is100PctElectricSimulated ? `-${noxSavedG.toFixed(0)} g NOₓ/h` : 'Líneas Diésel/GNC'}
          </span>
        </div>
      </div>
    </div>
  );
}
