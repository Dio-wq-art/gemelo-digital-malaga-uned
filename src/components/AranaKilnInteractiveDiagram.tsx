import React, { useMemo } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import {
  Factory,
  Wind,
  Activity,
  MapPin,
  Compass,
  Gauge,
  Flame,
  ShieldCheck,
  Info
} from 'lucide-react';
import { calculateHollandPlumeRise, ARANA_CEMENT_PLANT_DATA } from '../lib/majorEmissionsSources';

export interface AranaKilnInteractiveDiagramProps {
  ambientTempC?: number;
  liveWindSpeedMs?: number;
  liveWindDirDeg?: number;
  onFlyToMap?: () => void;
}

export const AranaKilnInteractiveDiagram: React.FC<AranaKilnInteractiveDiagramProps> = ({
  ambientTempC = 24.5,
  liveWindSpeedMs = 3.8,
  liveWindDirDeg = 100,
  onFlyToMap
}) => {
  // Diagnóstico determinista del régimen de viento real en vivo
  const isLevanteEast = liveWindDirDeg >= 60 && liveWindDirDeg <= 140;
  const isTerralNorthWest = liveWindDirDeg >= 280 && liveWindDirDeg <= 350;
  const isPonienteSouthWest = liveWindDirDeg >= 200 && liveWindDirDeg < 280;

  // Parámetros físicos oficiales certificados E-PRTR (Directiva 2010/75/UE / AAI Junta de Andalucía)
  const processMetrics = useMemo(() => {
    const base = ARANA_CEMENT_PLANT_DATA;
    
    // Tasa nominal autorizada de emisión continua E-PRTR
    const currentNoxGs = base.emissionRateNOxGs; // 128.5 g/s
    const currentSo2Gs = base.emissionRateSO2Gs; // 34.2 g/s
    const currentPm10Gs = base.emissionRatePM10Gs; // 8.4 g/s
    const co2TonHour = Number((base.annualCO2FossilTon / 8760).toFixed(1)); // ~89.7 t CO2/h

    // Sobreelevación analítica del penacho de Holland (1953) con el viento AEMET en vivo
    const plumeRise = calculateHollandPlumeRise(
      base.stackVelocityMs,
      base.stackDiameterM,
      liveWindSpeedMs,
      base.gasTemperatureC,
      ambientTempC
    );
    const effectiveHeightM = Number((base.stackHeightM + plumeRise).toFixed(1));

    // Concentración máxima en superficie C_max y distancia x_max según ecuación gaussiana de penacho elevado
    const Q = currentNoxGs * 1e6; // µg/s
    const u = Math.max(0.8, liveWindSpeedMs);
    const cMaxNox = Number(((2 * Q) / (Math.E * Math.PI * u * Math.pow(effectiveHeightM, 2)) * 0.45).toFixed(1));
    const distMaxKm = Number((effectiveHeightM * 0.024).toFixed(2));

    let affectedAreaName = '';
    let affectedDescription = '';

    if (isLevanteEast) {
      affectedAreaName = 'El Candado • El Palo • Miraflores (Málaga Este)';
      affectedDescription = `Viento de Levante (${liveWindDirDeg}°): arrastra la pluma hacia el Oeste afectando las cotas intermedias de El Palo (+${cMaxNox} µg/m³ NO₂).`;
    } else if (isTerralNorthWest) {
      affectedAreaName = 'Mar de Alborán (Bahía Exterior)';
      affectedDescription = `Viento de Terral (${liveWindDirDeg}°): la pluma es evacuada mar adentro sin afección a zonas residenciales habitadas.`;
    } else if (isPonienteSouthWest) {
      affectedAreaName = 'La Cala del Moral • Rincón de la Victoria (La Axarquía)';
      affectedDescription = `Viento de Poniente (${liveWindDirDeg}°): advección hacia el término municipal oriental fuera de Málaga capital.`;
    } else {
      affectedAreaName = 'Litoral de La Araña / Desembocadura Totalán';
      affectedDescription = `Circulación local costera (${liveWindDirDeg}°): mezcla confinada en el entorno inmediato de la fábrica.`;
    }

    return {
      currentNoxGs,
      currentSo2Gs,
      currentPm10Gs,
      co2TonHour,
      plumeRise,
      effectiveHeightM,
      cMaxNox,
      distMaxKm,
      affectedAreaName,
      affectedDescription
    };
  }, [liveWindSpeedMs, liveWindDirDeg, ambientTempC, isLevanteEast, isTerralNorthWest, isPonienteSouthWest]);

  const isBlowingTowardsCity = isLevanteEast;

  return (
    <div className="bg-[#0b111e] border border-amber-900/60 rounded-xl overflow-hidden shadow-2xl">
      
      {/* 1. ENCABEZADO ELEGANTE Y COMPACTO */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-900/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-amber-200 tracking-wide font-mono uppercase">
                Planta Cementera Heidelberg Materials (La Araña)
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 text-[9px] border border-amber-800 font-mono font-bold">
                ES-PRTR-290001
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Clinkerización 1.450 °C • Chimenea 85 m • Modelo Gaussiano con Elevación Holland
            </p>
          </div>
        </div>

        {/* Telemetría AEMET en Vivo y Botón de Mapa */}
        <div className="flex flex-wrap items-center gap-2">
          <ScientificTooltip
            title="Telemetría Meteorológica AEMET en Tiempo Real"
            content="Velocidad y dirección del viento anemométrico medido en tiempo real por AEMET OpenData. La dirección indica de dónde procede el viento, gobernando el vector de dispersión a sotavento (+180°)."
            formula={`\\theta_{\\text{incidente}} = ${liveWindDirDeg}^\\circ, \\quad \\theta_{\\text{sotavento}} = ${(liveWindDirDeg + 180) % 360}^\\circ`}
            regulatory="Estándares OMM / AEMET OpenData"
            citation="AEMET Red de Estaciones Automáticas de Málaga"
            position="bottom"
          >
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded-md text-[10px] font-mono text-emerald-300 shadow-inner cursor-help">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>AEMET: <strong>{liveWindSpeedMs.toFixed(1)} m/s</strong> ({liveWindDirDeg}°)</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip
            title="Vector de Advección Sotavento"
            content={`Rumbo del penacho industrial hacia sotavento: ${(liveWindDirDeg + 180) % 360}°. ${
              isTerralNorthWest 
                ? 'Con viento de Terral (Noroeste), el penacho se desplaza hacia el Sur-Sureste mar adentro en el Mar de Alborán, registrando 0 µg/m³ en el casco urbano de Málaga.' 
                : isLevanteEast 
                ? 'Con viento de Levante, el penacho advecta hacia el Oeste impactando cotas residenciales de El Candado y El Palo.' 
                : 'Régimen de transición costera.'
            }`}
            formula={`\\text{Rumbo Sotavento} = (${liveWindDirDeg}^\\circ + 180^\\circ) \\pmod{360^\\circ} = ${(liveWindDirDeg + 180) % 360}^\\circ`}
            position="bottom"
          >
            <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-700/60 px-2 py-1 rounded-md text-[10px] font-mono text-amber-300 cursor-help">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Sotavento: <strong>{((liveWindDirDeg + 180) % 360).toFixed(0)}°</strong></span>
            </div>
          </ScientificTooltip>

          {onFlyToMap && (
            <ScientificTooltip content="Navegación cinemática 3D a la chimenea industrial de la Fábrica de Cemento de La Araña y evaluación de la pluma gaussiana.">
              <button
                onClick={onFlyToMap}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] font-mono rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver en Mapa</span>
              </button>
            </ScientificTooltip>
          )}
        </div>
      </div>

      {/* 2. CINTA DE MÉTRICAS CIENTÍFICAS E-PRTR UNIFICADA (SIN SOLAPAMIENTO) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/80 border-b border-slate-800">
        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Emisión NOx Foco:</span>
            <ScientificTooltip
              title="Emisión Industrial de NOx (La Araña)"
              content="Caudal masivo de óxidos de nitrógeno (NO + NO2) formados por mecanismo térmico de Zeldovich a 1.450 °C y NOx de combustible en la clinkerización. Registro oficial E-PRTR con autorización AAI de la Junta de Andalucía."
              formula="Q_{\text{NO}_x} = 128.5\text{ g/s} \quad (4.052\text{ t/año})"
              regulatory="Directiva 2010/75/UE (IPPC / BREF Cemento 2013)"
              citation="E-PRTR Registro Estatal de Emisiones y Fuentes Contaminantes (ES-PRTR-290001)"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-amber-300 font-mono">{processMetrics.currentNoxGs}</span>
            <span className="text-[10px] text-slate-400 font-mono">g/s</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">4.052 t/año continuo</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">SO₂ / PM₁₀ / CO₂:</span>
            <ScientificTooltip
              title="Inventario Multiespecie E-PRTR"
              content="Emisiones simultáneas del proceso cementero: SO2 generado por piritas y coque de petróleo, PM10 capturado en filtros electrostáticos y CO2 fósil derivado de la descarbonatación del carbonato cálcico y combustión."
              formula="\text{CaCO}_3 \xrightarrow{900^\circ\text{C}} \text{CaO} + \text{CO}_2 \uparrow \quad (\approx 60\% \text{ del CO}_2\text{ total})"
              regulatory="Directiva 2003/87/CE (Comercio de Derechos de Emisión ETS)"
              citation="IPCC Guidelines for National GHG Inventories - Mineral Industry"
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-slate-200 font-mono">{processMetrics.currentSo2Gs}</span>
            <span className="text-[10px] text-slate-400 font-mono">/ {processMetrics.currentPm10Gs} g/s</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">CO₂ fósil: {processMetrics.co2TonHour} t/h</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Elevación Holland (Δh):</span>
            <ScientificTooltip
              title="Sobreelevación Térmico-Cinética del Penacho (Holland 1953)"
              content="Cálculo analítico de la sobreelevación de la pluma de gases por empuje cinético (velocidad de salida 22.5 m/s) y empuje térmico de flotabilidad (Ts = 210 °C vs Ta ambiente) acoplado al viento AEMET en tiempo real."
              formula="\Delta h = \frac{v_s \cdot d}{u} \left( 1.5 + 2.68 \cdot 10^{-3} \cdot P \cdot d \cdot \frac{T_s - T_a}{T_s} \right)"
              regulatory="Guía de Modelización de Calidad del Aire MITECO / EPA ISC3"
              citation="Holland, J.Z. (1953). A meteorological survey of the Oak Ridge Area. US Atomic Energy Commission."
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-emerald-300 font-mono">+{processMetrics.plumeRise} m</span>
          </div>
          <span className="text-[9px] text-emerald-400/90 font-mono">Heff = {processMetrics.effectiveHeightM} m</span>
        </div>

        <div className="bg-[#0e1626] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[9.5px] uppercase font-mono">Pico Inmisión en Suelo:</span>
            <ScientificTooltip
              title="Concentración Máxima en Suelo (C_max Gaussiana)"
              content="Pico de inmisión incremental a nivel de suelo calculado según la formulación gaussiana de penacho elevado de Turner (1970). Con viento de Levante, el pico aterriza sobre cotas residenciales de El Candado y El Palo."
              formula="C_{\max} = \frac{2 Q}{e \cdot \pi \cdot u \cdot H_{\text{eff}}^2} \cdot f_{\text{orog}}"
              regulatory="Directiva 2008/50/CE (Valores límite de inmisión: 200 µg/m³ 1h, 40 µg/m³ anual)"
              citation="Turner, D.B. (1970). Workbook of Atmospheric Dispersion Estimates. EPA AP-26."
              position="bottom"
            />
          </div>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-base font-bold text-sky-300 font-mono">+{processMetrics.cMaxNox}</span>
            <span className="text-[10px] text-slate-400 font-mono">µg/m³</span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">a {processMetrics.distMaxKm} km del foco</span>
        </div>
      </div>

      {/* 3. LIENZO GRÁFICO VECTORIAL A COLOR (NÍTIDO Y 100% VISIBLE) */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[340px] bg-gradient-to-b from-[#060b14] via-[#09111f] to-[#140c06] overflow-hidden">
        <svg viewBox="0 0 800 300" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Llama incandescente del horno */}
            <linearGradient id="aranaKilnFlame" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="65%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* Gradiente de cilindro del horno rotatorio */}
            <linearGradient id="aranaKilnShell" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Pluma de dispersión de Holland */}
            <linearGradient id="aranaPlumeDispersion" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#f97316" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#fb923c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
            </linearGradient>

            {/* Chimenea de hormigón */}
            <linearGradient id="aranaStackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Estructuras metálicas */}
            <linearGradient id="aranaStructures" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Orografía: Acantilados de La Araña y Cantera Caliza */}
          <path d="M 0 260 Q 200 252 420 260 T 800 255 L 800 300 L 0 300 Z" fill="#0b1329" />
          <path d="M 520 260 Q 640 195 800 155 L 800 300 L 520 300 Z" fill="#1e293b" opacity="0.65" />
          <path d="M 620 260 Q 700 205 800 175 L 800 300 L 620 300 Z" fill="#334155" opacity="0.5" />
          <text x="705" y="180" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">CANTERA CALIZA</text>
          <text x="705" y="195" fill="#64748b" fontSize="8" fontFamily="monospace">CaCO₃ Materia Prima</text>

          {/* Litoral Mediterráneo */}
          <path d="M 0 265 Q 250 260 500 265 L 500 300 L 0 300 Z" fill="#0284c7" opacity="0.15" />
          <text x="20" y="285" fill="#38bdf8" fontSize="9" fontFamily="monospace" opacity="0.8">LITORAL MEDITERRÁNEO (MAR DE ALBORÁN)</text>

          {/* 1. SILOS DE CLINKER */}
          <rect x="40" y="175" width="70" height="85" rx="4" fill="url(#aranaStructures)" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 40 175 L 75 150 L 110 175 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <text x="48" y="215" fill="#f8fafc" fontSize="8.5" fontWeight="bold" fontFamily="monospace">SILO CLINKER</text>
          <text x="50" y="228" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">Almacén 60 kt</text>

          {/* 2. ENFRIADOR DE CLINKER */}
          <rect x="125" y="205" width="55" height="55" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
          <text x="130" y="235" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="monospace">ENFRIADOR</text>
          <text x="133" y="247" fill="#94a3b8" fontSize="7" fontFamily="monospace">Aire 200°C</text>

          {/* 3. HORNO ROTATORIO 1.450 °C */}
          <g transform="translate(190, 185) rotate(-3)">
            <rect x="35" y="-4" width="10" height="48" rx="2" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <rect x="115" y="-4" width="10" height="48" rx="2" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <rect x="0" y="0" width="165" height="40" rx="6" fill="url(#aranaKilnShell)" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="15" y="10" width="135" height="20" rx="4" fill="url(#aranaKilnFlame)" opacity="0.95" />
            <text x="25" y="24" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="monospace">
              HORNO ROTATORIO 1.450 °C
            </text>
            <text x="32" y="34" fill="#451a03" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              Clinkerización 3CaO·SiO₂
            </text>
          </g>

          {/* 4. PRECALENTADOR Y TORRE DE CICLONES */}
          <rect x="375" y="75" width="50" height="185" rx="4" fill="url(#aranaStructures)" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="400" cy="100" r="13" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="400" cy="138" r="13" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="400" cy="176" r="13" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="400" cy="214" r="13" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="382" y="65" fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">PRECALENTADOR</text>
          <text x="385" y="104" fill="#facc15" fontSize="7.5" fontWeight="bold" fontFamily="monospace">C1</text>
          <text x="385" y="142" fill="#facc15" fontSize="7.5" fontWeight="bold" fontFamily="monospace">C2</text>
          <text x="385" y="180" fill="#facc15" fontSize="7.5" fontWeight="bold" fontFamily="monospace">C3</text>
          <text x="385" y="218" fill="#facc15" fontSize="7.5" fontWeight="bold" fontFamily="monospace">C4</text>

          {/* 5. SNCR Y FILTRO DE MANGAS */}
          <rect x="435" y="135" width="50" height="125" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
          <text x="445" y="158" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">SNCR</text>
          <text x="440" y="170" fill="#7dd3fc" fontSize="7" fontFamily="monospace">Iny. NH₃</text>
          <rect x="440" y="185" width="40" height="65" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text x="444" y="215" fill="#94a3b8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">FILTRO</text>
          <text x="444" y="227" fill="#64748b" fontSize="7" fontFamily="monospace">Mangas</text>

          <path d="M 485 180 L 515 180 L 515 240" fill="none" stroke="#64748b" strokeWidth="6" />

          {/* 6. CHIMENEA 85 METROS CON BALIZAS OACI */}
          <polygon points="508,260 526,260 522,45 512,45" fill="url(#aranaStackGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
          <polygon points="510,65 524,65 522,45 512,45" fill="#dc2626" />
          <polygon points="509,110 525,110 524,90 511,90" fill="#dc2626" />
          <circle cx="517" cy="42" r="3.5" fill="#ef4444" className="animate-pulse" />
          
          <text x="532" y="52" fill="#f87171" fontSize="10" fontWeight="bold" fontFamily="monospace">Hs = 85 m</text>
          <text x="532" y="65" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Ø 2.8 m • Ts = 210 °C</text>
          <text x="532" y="77" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">vs = 22.5 m/s (IPPC)</text>

          {/* 7. PLUMA DINÁMICA DE HOLLAND */}
          {(() => {
            const plumeH = Math.min(50, processMetrics.plumeRise * 0.6);
            const apexY = 45 - plumeH;

            if (isBlowingTowardsCity) {
              return (
                <g>
                  <path
                    d={`M 515 45 C 480 ${apexY + 15} 410 ${apexY} 30 ${apexY - 10} L 30 ${apexY + 70} C 360 ${apexY + 60} 480 ${apexY + 25} 521 45 Z`}
                    fill="url(#aranaPlumeDispersion)"
                  />
                  <line x1="495" y1={apexY} x2="80" y2={apexY} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" />
                  <polygon points={`75,${apexY} 85,${apexY - 4} 85,${apexY + 4}`} fill="#f59e0b" />

                  <g transform="translate(40, 225)">
                    <rect x="0" y="0" width="145" height="30" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="8" y="13" fill="#fcd34d" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      EL PALO / EL CANDADO
                    </text>
                    <text x="8" y="24" fill="#f87171" fontSize="7.5" fontFamily="monospace">
                      Sotavento: +{processMetrics.cMaxNox} µg/m³ NOx
                    </text>
                  </g>
                </g>
              );
            } else {
              return (
                <g>
                  <path
                    d={`M 519 45 C 550 ${apexY + 15} 620 ${apexY} 780 ${apexY - 10} L 780 ${apexY + 70} C 640 ${apexY + 60} 560 ${apexY + 25} 513 45 Z`}
                    fill="url(#aranaPlumeDispersion)"
                  />
                  <line x1="535" y1={apexY} x2="760" y2={apexY} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" />
                  <polygon points={`765,${apexY} 755,${apexY - 4} 755,${apexY + 4}`} fill="#f59e0b" />

                  <g transform="translate(610, 225)">
                    <rect x="0" y="0" width="165" height="30" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                    <text x="8" y="13" fill="#6ee7b7" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      {isTerralNorthWest ? 'MAR DE ALBORÁN (TERRAL)' : 'LA CALA DEL MORAL'}
                    </text>
                    <text x="8" y="24" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                      Dispersión libre mar adentro
                    </text>
                  </g>
                </g>
              );
            }
          })()}

          {/* Cota de Altura Efectiva Heff */}
          <line x1="490" y1={45 - Math.min(50, processMetrics.plumeRise * 0.6)} x2="490" y2="260" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
          <text x="350" y="38" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
            Heff = {processMetrics.effectiveHeightM} m (Holland Δh = +{processMetrics.plumeRise} m)
          </text>
        </svg>
      </div>

      {/* 4. DIAGNÓSTICO METEOROLÓGICO TERRITORIAL */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-[#0b111e] border-t border-amber-900/40 text-[11px] font-sans flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono text-amber-300 font-bold text-[10px] uppercase block mb-0.5">
            Diagnóstico Territorial en Vivo ({processMetrics.affectedAreaName}):
          </span>
          <p className="text-slate-300 leading-relaxed">
            {processMetrics.affectedDescription}
          </p>
        </div>
      </div>

    </div>
  );
};
