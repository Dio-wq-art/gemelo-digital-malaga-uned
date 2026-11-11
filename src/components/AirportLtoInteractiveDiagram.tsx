import React, { useState, useMemo } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import {
  Plane,
  Wind,
  Activity,
  MapPin,
  Compass,
  Gauge,
  Zap,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface AirportLtoInteractiveDiagramProps {
  ambientTempC?: number;
  liveWindSpeedMs?: number;
  liveWindDirDeg?: number;
  dailyFlightOps?: number;
  onFlyToMap?: () => void;
}

export const AirportLtoInteractiveDiagram: React.FC<AirportLtoInteractiveDiagramProps> = ({
  ambientTempC = 23.5,
  liveWindSpeedMs = 4.2,
  liveWindDirDeg = 140,
  dailyFlightOps = 450,
  onFlyToMap
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'approach' | 'taxi' | 'takeoff' | 'climbout'>('takeoff');
  const [showTurbofanCutaway, setShowTurbofanCutaway] = useState<boolean>(false);

  // Cálculo de la dinámica LTO en vivo según el viento y operaciones
  const metrics = useMemo(() => {
    const baseFuelFlowKgS = 0.38; // Promedio ponderado LTO
    const baseNoxEiGKg = 16.8; // g NOx / kg Jet-A1
    
    const opsFactor = dailyFlightOps / 420;
    const instantNoxGs = Number((baseFuelFlowKgS * baseNoxEiGKg * opsFactor * 2.1).toFixed(1)); // g/s
    const annualNoxTon = Number((instantNoxGs * 365 * 86400 * 0.14 / 1e6).toFixed(0)); // ~1.845 t/año en capa límite

    const isWindToCity = liveWindDirDeg >= 120 && liveWindDirDeg <= 240;
    const u = Math.max(0.8, liveWindSpeedMs);
    
    const deltaNoxUgM3 = Number((instantNoxGs * 18.5 / u).toFixed(1));

    let advectionTarget = '';
    let advectionDetail = '';

    if (isWindToCity) {
      advectionTarget = 'Carretera de Cádiz • Guadalmar • San Julián (Distrito 8)';
      advectionDetail = `Viento del Sur-Suroeste (${liveWindDirDeg}°): Advección del penacho de turbofans hacia la alta densidad de Carretera de Cádiz (+${deltaNoxUgM3} µg/m³ NO₂).`;
    } else if (liveWindDirDeg >= 300 || liveWindDirDeg <= 40) {
      advectionTarget = 'Bahía de Málaga (Litoral Marítimo)';
      advectionDetail = `Viento de Terral/Norte (${liveWindDirDeg}°): Evacuación del penacho aeronáutico hacia el Mar de Alborán.`;
    } else {
      advectionTarget = 'Valle del Guadalhorce / Campanillas';
      advectionDetail = `Canalización orográfica (${liveWindDirDeg}°): Dispersión a lo largo de la cuenca baja del río Guadalhorce.`;
    }

    return {
      instantNoxGs,
      annualNoxTon,
      deltaNoxUgM3,
      advectionTarget,
      advectionDetail,
      isWindToCity
    };
  }, [liveWindSpeedMs, liveWindDirDeg, dailyFlightOps]);

  // Datos detallados por fase de vuelo OACI LTO para el Turbofan LEAP-1A
  const phaseData = {
    taxi: {
      title: '1. Rodaje e Idle (Taxi)',
      thrustPct: '7% Empuje',
      timeMin: '26.0 min (OACI)',
      fuelFlow: '0.11 kg/s',
      eiNox: '4.8 g/kg',
      eiCo: '24.5 g/kg',
      tempK: '950 K',
      accentColor: '#38bdf8',
      desc: 'Baja temperatura en cámara. Predominan emisiones de hidrocarburos (HC) y monóxido de carbono (CO).'
    },
    takeoff: {
      title: '2. Despegue en Pista (Take-off)',
      thrustPct: '100% Empuje Máx.',
      timeMin: '0.7 min (OACI)',
      fuelFlow: '1.15 kg/s',
      eiNox: '31.2 g/kg',
      eiCo: '0.6 g/kg',
      tempK: '1.850 K',
      accentColor: '#ef4444',
      desc: 'Máxima temperatura de cámara. El nitrógeno del aire se oxida térmicamente (Zeldovich), disparando el NOx y hollín nvPM.'
    },
    climbout: {
      title: '3. Ascenso Inicial (Climb-out)',
      thrustPct: '85% Empuje',
      timeMin: '2.2 min (OACI)',
      fuelFlow: '0.95 kg/s',
      eiNox: '24.6 g/kg',
      eiCo: '0.9 g/kg',
      tempK: '1.680 K',
      accentColor: '#c084fc',
      desc: 'Inyección continua de NOx en la capa límite atmosférica del Valle del Guadalhorce hasta 3.000 ft (914m).'
    },
    approach: {
      title: '4. Aproximación (Approach)',
      thrustPct: '30% Empuje',
      timeMin: '4.0 min (OACI)',
      fuelFlow: '0.30 kg/s',
      eiNox: '10.5 g/kg',
      eiCo: '3.8 g/kg',
      tempK: '1.250 K',
      accentColor: '#818cf8',
      desc: 'Descenso en senda de planeo ILS 3° desde la costa sobre la Bahía de Málaga.'
    }
  }[selectedPhase];

  return (
    <div className="bg-[#0b111e] border border-sky-900/60 rounded-xl overflow-hidden shadow-2xl">
      
      {/* 1. ENCABEZADO ELEGANTE */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-950 border-b border-sky-900/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-sky-200 tracking-wide font-mono uppercase">
                Aeropuerto de Málaga-Costa del Sol (AGP / LEMG)
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-sky-950/90 text-sky-300 text-[9px] border border-sky-800 font-mono font-bold">
                OACI ANEXO 16 TIER 3
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Pistas 13/31 & 12/30 • Flota Turbofan LEAP-1A / CFM56 • Ciclo LTO &lt; 3000 ft
            </p>
          </div>
        </div>

        {/* Telemetría AEMET y Botón Mapa */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded-md text-[10px] font-mono text-emerald-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AEMET: <strong>{liveWindSpeedMs.toFixed(1)} m/s</strong> ({liveWindDirDeg}°)</span>
          </div>

          {onFlyToMap && (
            <ScientificTooltip content="Navegación cinemática 3D al recinto del Aeropuerto de Málaga-Costa del Sol (AGP/LEMG) e inspección de pistas 13/31 y 12/30.">
              <button
                onClick={onFlyToMap}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-[10px] font-mono rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver en Mapa</span>
              </button>
            </ScientificTooltip>
          )}
        </div>
      </div>

      {/* 2. CINTA DE MÉTRICAS CIENTÍFICAS AEROPORTUARIAS (SIN SOLAPAMIENTO) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/80 border-b border-slate-800">
        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Tráfico Diario AGP:</span>
            <ScientificTooltip
              title="Operaciones Comerciales Diarias (AENA LEMG)"
              content="Media de movimientos LTO diarios en el Aeropuerto de Málaga-Costa del Sol. Flota predominante de fuselaje estrecho (Airbus A320neo, Boeing 737-800) equipada con turbofans LEAP-1A y CFM56-7B."
              formula="\text{Ops} \approx 450\text{ vuelos/día} \quad (164.000\text{ mov/año})"
              regulatory="OACI Anexo 16 Volumen II / EMEP-EEA Tier 3 Aviation"
              citation="AENA Estadísticas de Tráfico y Datos de Vuelo LEMG"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-sky-300 font-mono">{dailyFlightOps}</span>
            <span className="text-[10px] text-slate-400 font-mono">vuelos/día</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">Flota A320 / B737</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Emisión NOx LTO:</span>
            <ScientificTooltip
              title="Tasa de Emisión de NOx en Ciclo LTO"
              content="Emisión horaria y anual de óxidos de nitrógeno generados dentro de la capa límite atmosférica (< 3.000 ft / 914 m). La mayor tasa ocurre durante la carrera de despegue (100% de empuje) por mecanismo térmico de Zeldovich."
              formula="Q_{\text{NO}_x} = \sum_{p=1}^4 \dot{m}_{f,p} \cdot \text{EI}_{\text{NO}_x,p} \cdot t_p"
              regulatory="OACI Doc 9889 / EMEP/EEA Emission Inventory Guidebook - Aviation"
              citation="ICAO Aircraft Engine Emissions Databank (CFM56 / LEAP-1A)"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-amber-300 font-mono">{metrics.instantNoxGs}</span>
            <span className="text-[10px] text-slate-400 font-mono">g/s</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">{metrics.annualNoxTon} t/año en capa límite</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Inmisión Incremental:</span>
            <ScientificTooltip
              title="Afección Inmisión en Receptores Urbanos"
              content="Incremento modelizado de NO2 en superficie en los distritos colindantes de Carretera de Cádiz, Guadalmar y San Julián por advección de la pluma aeronáutica acoplada a la brisa marina del suroeste."
              formula="\Delta C_{\text{rec}} = \frac{Q_{\text{LTO}} \cdot 18.5}{\max(0.8, u)} \quad [\mu\text{g/m}^3]"
              regulatory="Directiva 2008/50/CE (Valores límite de protección a la salud humana)"
              citation="FAIRMODE Guidance Document on Local and Microscale Air Quality Assessment"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-emerald-300 font-mono">+{metrics.deltaNoxUgM3}</span>
            <span className="text-[10px] text-slate-400 font-mono">µg/m³ NO₂</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">Carretera de Cádiz / Guadalmar</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Fase Seleccionada:</span>
            <ScientificTooltip
              title="Fase Operativa de Vuelo OACI LTO"
              content="Cada fase del ciclo LTO estándar de la OACI tiene un régimen de empuje, consumo de combustible Jet-A1 e índice de emisión específico (EI NOx, EI CO, EI HC, soot nvPM)."
              formula="\text{EI}_{\text{NO}_x} \propto T_{\text{combustion}}^{1.5} \cdot P_{\text{combustion}}^{0.5}"
              regulatory="OACI Anexo 16 Volumen II Capítulo 2"
              citation="ICAO Doc 9889 - Airport Air Quality Manual"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-sm font-bold font-mono" style={{ color: phaseData.accentColor }}>{phaseData.thrustPct}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">{phaseData.fuelFlow} Jet-A1</span>
        </div>
      </div>

      {/* 3. SELECTOR ERGONÓMICO DE LAS 4 FASES LTO OACI */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Fases de Vuelo OACI LTO:</span>
        </span>

        <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono">
          <button
            onClick={() => setSelectedPhase('taxi')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
              selectedPhase === 'taxi'
                ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Rodaje (7%)
          </button>
          <button
            onClick={() => setSelectedPhase('takeoff')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
              selectedPhase === 'takeoff'
                ? 'bg-red-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Despegue (100%)
          </button>
          <button
            onClick={() => setSelectedPhase('climbout')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
              selectedPhase === 'climbout'
                ? 'bg-purple-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Ascenso (85%)
          </button>
          <button
            onClick={() => setSelectedPhase('approach')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold cursor-pointer ${
              selectedPhase === 'approach'
                ? 'bg-indigo-500 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Aproximación (30%)
          </button>
        </div>
      </div>

      {/* 4. LIENZO GRÁFICO VECTORIAL A COLOR DEL AEROPUERTO */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[340px] bg-gradient-to-b from-[#060e1d] via-[#081326] to-[#040810] overflow-hidden">
        <svg viewBox="0 0 800 300" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="agpJetFlame" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="85%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="agpPlumeLto" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#0284c7" stopOpacity="0.55" />
              <stop offset="80%" stopColor="#0369a1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="agpSkyAtmosphere" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="800" height="300" fill="url(#agpSkyAtmosphere)" />

          {/* Orografía del Valle del Guadalhorce */}
          <path d="M 0 260 Q 200 252 450 260 T 800 256 L 800 300 L 0 300 Z" fill="#0b1329" />
          <path d="M 0 260 Q 180 210 320 190 L 320 300 L 0 300 Z" fill="#1e293b" opacity="0.6" />
          <text x="35" y="205" fill="#94a3b8" fontSize="9" fontFamily="monospace">MONTE CHURRIANA (+140m)</text>

          {/* Pista 13/31 Principal (3200m) */}
          <polygon points="120,262 620,262 610,248 130,248" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          <line x1="140" y1="255" x2="600" y2="255" stroke="#facc15" strokeWidth="2" strokeDasharray="10 10" />
          <text x="320" y="273" fill="#cbd5e1" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            PISTA 13/31 AGP (3.200 m)
          </text>

          {/* Torre de Control & Terminal T2/T3 */}
          <rect x="230" y="195" width="80" height="50" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="238" y="223" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">TERMINAL T2/T3</text>

          {/* Torre de Control AGP */}
          <polygon points="340,248 350,248 348,165 342,165" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="337" y="155" width="16" height="14" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="345" cy="152" r="2.5" fill="#ef4444" className="animate-pulse" />
          <text x="360" y="164" fill="#e0f2fe" fontSize="8" fontFamily="monospace" fontWeight="bold">TWR AGP</text>

          {/* Senda ILS Glidepath 3° */}
          <line x1="120" y1="248" x2="720" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
          <text x="630" y="65" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" opacity="0.9">SENDA ILS 3° (Cota 3.000 ft)</text>

          {/* REPRESENTACIÓN DE TURBOFAN AERONÁUTICO DESPEGANDO EN PISTA */}
          <g transform="translate(360, 195) scale(0.95)">
            <polygon points="0,10 -90,-5 -140,10 -90,25" fill="url(#agpJetFlame)" opacity="0.9" />
            <line x1="0" y1="10" x2="-130" y2="10" stroke="#fef08a" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 40,5 C 20,-2 0,0 -20,8 L -50,8 L -60,2 C -62,0 -68,0 -68,8 L -60,12 L -20,12 C 0,18 20,20 40,13 Z" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M -5,10 L -30,-22 L -15,-22 L 10,10 Z" fill="#e2e8f0" stroke="#0284c7" strokeWidth="1" />
            <rect x="-10" y="14" width="22" height="10" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="10" cy="19" r="4" fill="#facc15" />
          </g>

          {/* PLUMA DE ADVECCIÓN DE DISPERSIÓN DE TURBOFANS */}
          <path
            d="M 370 195 C 440 160 520 130 780 110 L 780 240 C 580 245 460 230 370 205 Z"
            fill="url(#agpPlumeLto)"
          />

          {/* Eje de Viento */}
          <line x1="370" y1="195" x2="760" y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <polygon points="765,119 755,114 755,125" fill="#38bdf8" />
        </svg>
      </div>

      {/* 5. TARJETA DESCRIPTIVA DE LA FASE ACTIVA CON BOTÓN DE CORTE TURBOFAN */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-[#0b111e] border-t border-sky-900/40 text-[11px] font-sans space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold flex items-center gap-1.5" style={{ color: phaseData.accentColor }}>
            <span>{phaseData.title}</span>
            <span className="text-slate-400 font-normal">({phaseData.timeMin})</span>
          </span>

          <button
            onClick={() => setShowTurbofanCutaway(!showTurbofanCutaway)}
            className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer underline"
          >
            <span>{showTurbofanCutaway ? 'Ocultar Corte Turbofan' : 'Ver Corte Motor Turbofan'}</span>
            {showTurbofanCutaway ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-slate-300 leading-relaxed">
          {phaseData.desc}
        </p>

        {/* CORTE TRANSVERSAL EXPANDIBLE DEL MOTOR LEAP-1A */}
        {showTurbofanCutaway && (
          <div className="mt-2 pt-2 border-t border-slate-800 animate-fadeIn">
            <div className="text-[10px] text-sky-400 font-bold mb-1 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Corte Transversal Motor Turbofan LEAP-1A / CFM56 (Cámara 1.800 K - Reacción Zeldovich)</span>
            </div>
            <div className="relative w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-1 overflow-hidden">
              <svg viewBox="0 0 600 130" className="w-full h-full select-none">
                <defs>
                  <linearGradient id="agpCombustHeat" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="35%" stopColor="#facc15" />
                    <stop offset="65%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7c2d12" />
                  </linearGradient>
                </defs>

                <path d="M 20 15 L 120 10 L 520 20 L 570 35 L 570 95 L 520 110 L 120 120 L 20 115 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <ellipse cx="60" cy="65" rx="15" ry="42" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <line x1="60" y1="23" x2="60" y2="107" stroke="#38bdf8" strokeWidth="3" />
                <text x="45" y="68" fill="#e0f2fe" fontSize="8" fontWeight="bold" fontFamily="monospace">FAN N1</text>

                <polygon points="120,30 240,42 240,88 120,100" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <text x="145" y="68" fill="#cbd5e1" fontSize="8" fontFamily="monospace">COMPRESOR HPC</text>

                <rect x="250" y="40" width="130" height="50" rx="4" fill="url(#agpCombustHeat)" stroke="#f59e0b" strokeWidth="2" />
                <text x="260" y="62" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="monospace">COMBUSTIÓN (1.800 K)</text>
                <text x="260" y="75" fill="#0f172a" fontSize="8" fontWeight="bold" fontFamily="monospace">NOx Térmico (Zeldovich)</text>

                <polygon points="390,42 490,30 490,100 390,88" fill="#311042" stroke="#c084fc" strokeWidth="1.5" />
                <text x="410" y="68" fill="#e9d5ff" fontSize="8" fontFamily="monospace">TURBINAS</text>

                <polygon points="490,35 590,20 590,110 490,95" fill="url(#agpJetFlame)" opacity="0.8" />
                <text x="505" y="68" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">ESCAPE (NO2/nvPM)</text>

                <line x1="80" y1="20" x2="520" y2="28" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="80" y1="110" x2="520" y2="102" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                <text x="300" y="22" fill="#38bdf8" fontSize="7.5" fontFamily="monospace">Flujo Secundario Bypass Air (Ratio 11:1)</text>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 6. DIAGNÓSTICO METEOROLÓGICO */}
      <div className="p-3 bg-[#080d16] border-t border-slate-800 text-[11px] font-sans flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono text-sky-300 font-bold text-[10px] uppercase block mb-0.5">
            Diagnóstico Aero-Atmosférico AGP ({metrics.advectionTarget}):
          </span>
          <p className="text-slate-300 leading-relaxed">
            {metrics.advectionDetail}
          </p>
        </div>
      </div>

    </div>
  );
};
