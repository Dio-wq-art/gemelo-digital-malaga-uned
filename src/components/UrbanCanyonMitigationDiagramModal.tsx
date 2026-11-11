import React, { useState, useMemo, useRef } from 'react';
import { 
  Building2, 
  Wind, 
  Sun, 
  Leaf, 
  Layers, 
  Activity, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  TrendingDown,
  Thermometer
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MALAGA_SIMULATION_QUADRANTS, SimulationQuadrant, calculateQuadrantMitigation } from '../lib/greenRoofMitigation';

interface Props {
  onClose: () => void;
  initialQuadrantId?: string;
  ambientTemp?: number;
  ambientNO2?: number;
  ambientWind?: number;
}

export function UrbanCanyonMitigationDiagramModal({
  onClose,
  initialQuadrantId = 'centro_alameda',
  ambientTemp = 24.5,
  ambientNO2 = 46.0,
  ambientWind = 3.5
}: Props) {
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string>(initialQuadrantId);
  const [tempC, setTempC] = useState<number>(ambientTemp);
  const [parWm2, setParWm2] = useState<number>(420);
  const [rhPct, setRhPct] = useState<number>(55);
  const [windSpeedMs, setWindSpeedMs] = useState<number>(ambientWind);
  const [baselineNO2, setBaselineNO2] = useState<number>(ambientNO2);
  const [showFlowLines, setShowFlowLines] = useState<boolean>(true);
  const [showResistanceLadder, setShowResistanceLadder] = useState<boolean>(true);
  const [activeLayerMode, setActiveLayerMode] = useState<'composite' | 'velocity_vortex' | 'no2_gradient' | 'wesely_circuit'>('composite');

  const svgRef = useRef<SVGSVGElement>(null);

  const activeQuadrant = useMemo(() => {
    return MALAGA_SIMULATION_QUADRANTS.find(q => q.id === selectedQuadrantId) || MALAGA_SIMULATION_QUADRANTS[0];
  }, [selectedQuadrantId]);

  // Cálculo determinista acoplado de física y Wesely
  const mitigationData = useMemo(() => {
    const ustar = Math.max(0.08, windSpeedMs * 0.1);
    return calculateQuadrantMitigation(
      activeQuadrant,
      tempC,
      rhPct,
      parWm2,
      windSpeedMs,
      ustar,
      baselineNO2
    );
  }, [activeQuadrant, tempC, rhPct, parWm2, windSpeedMs, baselineNO2]);

  // Régimen de flujo según Oke (1987)
  const flowRegime = useMemo(() => {
    const hw = activeQuadrant.aspectRatioHW;
    if (hw < 0.35) return { name: 'Isolated Roughness Flow', desc: 'Flujo aislado sin recirculación cerrada (H/W < 0.35)', color: 'text-blue-400' };
    if (hw <= 0.65) return { name: 'Wake Interference Flow', desc: 'Interferencia de estelas entre edificios contiguos (0.35 ≤ H/W ≤ 0.65)', color: 'text-yellow-400' };
    return { name: 'Skimming Flow (Vórtice Estable)', desc: 'Régimen de rasante con vórtice cautivo de recirculación profunda (H/W > 0.65)', color: 'text-rose-400' };
  }, [activeQuadrant.aspectRatioHW]);

  // Velocidad de deposición y resistencias
  const typoExt = mitigationData.typologies.find(t => t.typology === 'extensive_green_roof')!;
  const typoVert = mitigationData.typologies.find(t => t.typology === 'vertical_forest_wall')!;

  // Función para exportar SVG vectorial puro
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama_canon_urbano_wesely_${activeQuadrant.id}_${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Función para exportar datos en CSV
  const handleExportCSV = () => {
    const csvContent = [
      'Variable,Valor,Unidad,Definición',
      `Cuadrante,"${activeQuadrant.name}",-,ID y Distrito`,
      `Relacion_Aspecto_HW,${activeQuadrant.aspectRatioHW.toFixed(2)},-,Altura/Anchura del cañón`,
      `Regimen_Flujo,"${flowRegime.name}",-,Criterio de Oke (1987)`,
      `Temperatura_Aire,${tempC},°C,Temperatura ambiente asimilada`,
      `Radiacion_PAR,${parWm2},W/m²,Radiación fotosintéticamente activa`,
      `Velocidad_Viento_Libre,${windSpeedMs},m/s,Velocidad a cota de tejado`,
      `Velocidad_Viento_Canyon,${mitigationData.urbanCanyonPhysics.meanCanyonWindMs},m/s,Viento atenuado en fondo de calle`,
      `NO2_Base,${baselineNO2},µg/m³,Concentración de fondo previa a mitigación`,
      `NO2_Mitigado,${mitigationData.totals.mitigatedNO2_ug_m3},µg/m³,Concentración residual con sumideros verdes`,
      `Reduccion_Delta_NO2,${mitigationData.totals.effectiveQuadrantDeltaNO2_ug_m3},µg/m³,Abatimiento en capa canópica`,
      `Eficiencia_Mitigacion,${mitigationData.totals.mitigationEfficiencyPct},%,Porcentaje de reducción neta`,
      `Tasa_Absorcion_Total,${mitigationData.totals.totalNo2RemovalGramsPerHour},g/h,Masa de NO2 extraída por hora`,
      `Remocion_Anual_Kg,${mitigationData.totals.totalNo2RemovalKgPerYear},kg/año,Remoción acumulada anual`,
      `Ra_Cubierta_Extensiva,${typoExt.ra_s_m},s/m,Resistencia aerodinámica`,
      `Rb_Cubierta_Extensiva,${typoExt.rb_s_m},s/m,Resistencia cuasi-laminar foliar`,
      `Rs_Cubierta_Extensiva,${typoExt.rs_s_m},s/m,Resistencia estomática`,
      `Rc_Cubierta_Extensiva,${typoExt.rc_s_m},s/m,Resistencia canópica total`,
      `Vd_Cubierta_Extensiva,${typoExt.vd_cm_s},cm/s,Velocidad de deposición seca`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datos_canon_wesely_${activeQuadrant.id}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dinámica de colores según concentración
  const no2ReductionRatio = mitigationData.totals.effectiveQuadrantDeltaNO2_ug_m3 / Math.max(1, baselineNO2);

  return (
    <DraggableWindow
      title="Diagrama Microescalar de Cañón Urbano, Vórtices y Modelo de Wesely"
      subtitle="Física de fluidos en régimen de rasante (Oke 1987) y circuito de resistencias foliares (Wesely 1989)"
      icon={<Building2 className="w-4 h-4 text-emerald-400" />}
      badge={
        <span className="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 font-mono font-bold flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-emerald-400" />
          <span>Δ[NO₂]: -{mitigationData.totals.effectiveQuadrantDeltaNO2_ug_m3} µg/m³ ({mitigationData.totals.mitigationEfficiencyPct}%)</span>
        </span>
      }
      headerExtra={
        <div className="flex items-center gap-1.5">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar este diagrama explicativo completo en formato vectorial SVG nativo editable, con resolución infinita para inclusión directa en LaTeX (\includesvg).">
            <button
              onClick={handleExportSVG}
              className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>SVG Vectorial</span>
            </button>
          </ScientificTooltip>
          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar tabla de variables aerodinámicas, coeficientes de resistencia de Wesely y balances de masa en formato CSV tabulado.">
            <button
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>CSV Datos</span>
            </button>
          </ScientificTooltip>
        </div>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/40"
      className="w-[96vw] max-w-6xl"
    >
      <div className="p-3.5 space-y-3.5 text-slate-200 text-xs font-sans overflow-y-auto max-h-[82vh]">
        {/* BARRA SUPERIOR DE SELECTOR Y MODOS VISUALES */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col md:flex-row gap-3 items-start md:items-center justify-between font-mono text-[11px]">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 uppercase text-[10px] whitespace-nowrap">Cuadrante Urbano:</span>
            <select
              value={selectedQuadrantId}
              onChange={e => setSelectedQuadrantId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-emerald-300 p-1 rounded text-xs focus:outline-none focus:border-emerald-500"
            >
              {MALAGA_SIMULATION_QUADRANTS.map(q => (
                <option key={q.id} value={q.id}>
                  {q.name} (H/W = {q.aspectRatioHW.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR DE MODO DE DIAGRAMA */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
            <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Modo Visual:</span>
            <button
              onClick={() => setActiveLayerMode('composite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeLayerMode === 'composite' ? 'bg-emerald-900 text-emerald-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Integral Compuesto
            </button>
            <button
              onClick={() => setActiveLayerMode('velocity_vortex')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeLayerMode === 'velocity_vortex' ? 'bg-cyan-900 text-cyan-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vórtice Aerodinámico
            </button>
            <button
              onClick={() => setActiveLayerMode('no2_gradient')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeLayerMode === 'no2_gradient' ? 'bg-amber-900 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gradiente NO₂
            </button>
            <button
              onClick={() => setActiveLayerMode('wesely_circuit')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeLayerMode === 'wesely_circuit' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Circuito Wesely
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showFlowLines} 
                onChange={e => setShowFlowLines(e.target.checked)} 
                className="accent-emerald-500 rounded"
              />
              <span>Líneas Flujo</span>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showResistanceLadder} 
                onChange={e => setShowResistanceLadder(e.target.checked)} 
                className="accent-purple-500 rounded"
              />
              <span>Circuito Eléctrico</span>
            </label>
          </div>
        </div>

        {/* LIENZO SVG EXTENSO VECTORIAL */}
        <div className="relative w-full h-[460px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes vortexSpin {
              from { stroke-dashoffset: 80; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes leafUptake {
              0% { opacity: 0.3; stroke-dashoffset: 30; }
              50% { opacity: 1; }
              100% { opacity: 0.3; stroke-dashoffset: 0; }
            }
            @keyframes pulseGlow {
              0%, 100% { filter: drop-shadow(0 0 3px rgba(16,185,129,0.5)); }
              50% { filter: drop-shadow(0 0 10px rgba(16,185,129,0.9)); }
            }
            .vortex-line {
              animation: vortexSpin ${Math.max(1.5, 6.0 / Math.max(0.5, windSpeedMs))}s linear infinite;
            }
            .leaf-uptake-line {
              animation: leafUptake 2.5s ease-in-out infinite;
            }
            .pulsing-circuit {
              animation: pulseGlow 3s ease-in-out infinite;
            }
          `}} />

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 1000 460"
            className="absolute top-0 left-0 select-none"
          >
            <defs>
              {/* Degradados cromáticos para edificios y atmósfera */}
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#030712" />
                <stop offset="100%" stopColor="#0b132b" />
              </linearGradient>

              {/* Degradado de penacho de NO2 desde calzada */}
              <radialGradient id="no2PlumeGrad" cx="50%" cy="85%" r="70%">
                <stop offset="0%" stopColor="rgba(244, 63, 94, 0.75)" />
                <stop offset="40%" stopColor="rgba(245, 158, 11, 0.45)" />
                <stop offset="80%" stopColor="rgba(16, 185, 129, 0.15)" />
                <stop offset="100%" stopColor="rgba(2, 6, 23, 0.0)" />
              </radialGradient>

              {/* Degradado de enfriamiento microclimático por evapotranspiración */}
              <linearGradient id="coolAuraGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.45)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.0)" />
              </linearGradient>

              {/* Patrón de Malla de Fondo */}
              <pattern id="diagGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.4" />
              </pattern>

              {/* Marcadores de flecha para vectores de viento */}
              <marker id="arrowWind" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker id="arrowDeposition" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrowTraffic" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
              </marker>
            </defs>

            {/* FONDO Y REJILLA */}
            <rect width="1000" height="460" fill="url(#skyGrad)" />
            <rect width="1000" height="460" fill="url(#diagGrid)" opacity="0.6" />

            {/* CAPA DE DISPERSIÓN Y CONCENTRACIÓN DE NO2 */}
            {(activeLayerMode === 'composite' || activeLayerMode === 'no2_gradient') && (
              <rect x="220" y="80" width="360" height="300" fill="url(#no2PlumeGrad)" opacity="0.85" />
            )}

            {/* 1. EDIFICIO BARLOVENTO (WINDWARD, IZQUIERDA) */}
            <g id="windward_building">
              <rect x="40" y="80" width="180" height="300" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              {/* Ventanas representativas */}
              {[120, 170, 220, 270, 320].map(y => (
                <g key={`w-left-${y}`}>
                  <rect x="60" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="100" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="140" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="180" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                </g>
              ))}

              {/* CUBIERTA VEGETAL INTENSIVA EN BARLOVENTO */}
              <rect x="35" y="62" width="190" height="18" fill="#065f46" stroke="#10b981" strokeWidth="1.5" rx="3" />
              {/* Matriz de vegetación / arbustos */}
              {[45, 65, 85, 105, 125, 145, 165, 185, 205].map(x => (
                <circle key={`shrub-l-${x}`} cx={x} cy="60" r="7" fill="#10b981" opacity="0.85" />
              ))}
              <rect x="35" y="45" width="190" height="20" fill="url(#coolAuraGrad)" />
              <text x="130" y="52" fill="#a7f3d0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Cubierta Vegetal Intensiva ({typoExt.effectiveLAI} LAI)
              </text>
            </g>

            {/* 2. EDIFICIO SOTAVENTO (LEEWARD, DERECHA) */}
            <g id="leeward_building">
              <rect x="580" y="80" width="180" height="300" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              {/* Ventanas representativas */}
              {[120, 170, 220, 270, 320].map(y => (
                <g key={`w-right-${y}`}>
                  <rect x="600" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="640" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="680" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                  <rect x="720" y={y} width="25" height="30" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                </g>
              ))}

              {/* BOSQUE VERTICAL / FACHADA VERDE EN LA MEDIANERA DEL CAÑÓN */}
              <rect x="572" y="100" width="12" height="240" fill="#047857" stroke="#34d399" strokeWidth="1.2" rx="2" />
              {/* Hojas modulares del muro vivo */}
              {[115, 145, 175, 205, 235, 265, 295, 325].map(y => (
                <circle key={`vert-leaf-${y}`} cx="578" cy={y} r="5" fill="#34d399" opacity="0.9" />
              ))}
              <text x="590" y="220" fill="#6ee7b7" fontSize="9" fontFamily="monospace" transform="rotate(-90 590 220)" textAnchor="middle">
                Muro Vivo Vertical ({typoVert.effectiveLAI} LAI)
              </text>

              {/* CUBIERTA VEGETAL EXTENSIVA EN SOTAVENTO */}
              <rect x="575" y="66" width="190" height="14" fill="#065f46" stroke="#10b981" strokeWidth="1.5" rx="3" />
              {[585, 605, 625, 645, 665, 685, 705, 725, 745].map(x => (
                <circle key={`shrub-r-${x}`} cx={x} cy="66" r="5" fill="#22c55e" opacity="0.8" />
              ))}
              <text x="670" y="58" fill="#a7f3d0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Cubierta Sedum Extensiva
              </text>
            </g>

            {/* 3. CALZADA Y FONDO DE CAÑÓN */}
            <g id="street_floor">
              <rect x="0" y="380" width="1000" height="80" fill="#020617" stroke="#1e293b" strokeWidth="2" />
              <line x1="220" y1="380" x2="580" y2="380" stroke="#475569" strokeWidth="3" />
              {/* Señalización de carril */}
              <line x1="260" y1="410" x2="540" y2="410" stroke="#64748b" strokeWidth="2" strokeDasharray="15 10" />

              {/* Vehículos y fuentes de emisión de tráfico */}
              <g transform="translate(320, 370)">
                <rect x="0" y="0" width="45" height="15" fill="#334155" stroke="#64748b" rx="3" />
                <circle cx="10" cy="15" r="4" fill="#0f172a" />
                <circle cx="35" cy="15" r="4" fill="#0f172a" />
                {/* Emisión de tubo de escape */}
                <path d="M 45 10 Q 55 5, 65 0" stroke="#f43f5e" strokeWidth="2.5" fill="none" markerEnd="url(#arrowTraffic)" />
              </g>

              <g transform="translate(420, 370)">
                <rect x="0" y="0" width="45" height="15" fill="#1e293b" stroke="#475569" rx="3" />
                <circle cx="10" cy="15" r="4" fill="#020617" />
                <circle cx="35" cy="15" r="4" fill="#020617" />
                <path d="M 45 10 Q 55 5, 65 0" stroke="#f43f5e" strokeWidth="2.5" fill="none" markerEnd="url(#arrowTraffic)" />
              </g>

              {/* Acera arbolada en barlovento */}
              <g transform="translate(240, 310)">
                <line x1="15" y1="70" x2="15" y2="30" stroke="#78350f" strokeWidth="5" />
                <ellipse cx="15" cy="25" rx="22" ry="26" fill="#15803d" opacity="0.85" />
                <ellipse cx="15" cy="25" rx="16" ry="18" fill="#22c55e" opacity="0.75" />
                <text x="15" y="75" fill="#86efac" fontSize="8" fontFamily="monospace" textAnchor="middle">Platanus</text>
              </g>

              <text x="400" y="440" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                Calzada Cañón: W = {activeQuadrant.canyonWidthM} m • Tráfico EMEP/COPERT • Emisión NOₓ Primaria
              </text>
            </g>

            {/* 4. CAMPO AERODINÁMICO: VIENTO LIBRE Y VÓRTICE DE CAÑÓN (CFD) */}
            {(activeLayerMode === 'composite' || activeLayerMode === 'velocity_vortex') && showFlowLines && (
              <g id="aerodynamic_vortex">
                {/* Viento libre horizontal sobre cota de tejado */}
                <path d="M 20 35 L 950 35" stroke="#38bdf8" strokeWidth="3" strokeDasharray="12 6" className="vortex-line" markerEnd="url(#arrowWind)" />
                <text x="120" y="25" fill="#7dd3fc" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                  Viento Libre U_ref = {windSpeedMs} m/s (Cota z &gt; H)
                </text>

                {/* Desprendimiento de capa límite en la arista de barlovento */}
                <path d="M 220 80 Q 280 60, 360 85" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="6 4" fill="none" className="vortex-line" />

                {/* VÓRTICE PRINCIPAL DE RECIRCULACIÓN INTERIOR (SENTIDO ANTIHORARIO) */}
                <ellipse cx="400" cy="230" rx="130" ry="110" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="14 8" className="vortex-line" opacity="0.85" />
                
                {/* Vórtice secundario concéntrico */}
                <ellipse cx="400" cy="230" rx="80" ry="65" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="10 6" className="vortex-line" opacity="0.7" />

                {/* Flechas indicativas del sentido antihorario */}
                <path d="M 520 220 L 520 240" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowWind)" />
                <path d="M 280 240 L 280 220" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowWind)" />
                <path d="M 410 120 L 390 120" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowWind)" />
                <path d="M 390 340 L 410 340" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowWind)" />

                {/* Etiqueta del vórtice */}
                <g transform="translate(400, 225)">
                  <rect x="-70" y="-12" width="140" height="24" fill="#030712" stroke="#0284c7" strokeWidth="1" rx="4" />
                  <text x="0" y="4" fill="#bae6fd" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    Vórtice Recirculante
                  </text>
                </g>

                <text x="400" y="260" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  U_canyon = {mitigationData.urbanCanyonPhysics.meanCanyonWindMs} m/s (Atenuado)
                </text>
              </g>
            )}

            {/* 5. VECTORES DE FLUJO DE ABSORCIÓN ESTOMÁTICA (WESELY) */}
            <g id="deposition_vectors">
              {/* Hacia la cubierta de barlovento */}
              <path d="M 130 110 L 130 75" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" className="leaf-uptake-line" markerEnd="url(#arrowDeposition)" />
              {/* Hacia la cubierta de sotavento */}
              <path d="M 670 110 L 670 78" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" className="leaf-uptake-line" markerEnd="url(#arrowDeposition)" />
              {/* Hacia el muro verde vertical */}
              <path d="M 520 200 L 568 200" stroke="#34d399" strokeWidth="2.5" strokeDasharray="5 3" className="leaf-uptake-line" markerEnd="url(#arrowDeposition)" />
              <path d="M 520 260 L 568 260" stroke="#34d399" strokeWidth="2.5" strokeDasharray="5 3" className="leaf-uptake-line" markerEnd="url(#arrowDeposition)" />

              <text x="500" y="190" fill="#a7f3d0" fontSize="9" fontFamily="monospace" fontWeight="bold">
                Flux F_d = {typoVert.no2Flux_ug_m2_s} µg/m²s
              </text>
            </g>

            {/* 6. CIRCUITO ANÁLOGO DE RESISTENCIAS DE WESELY (PANEL DERECHO EMBEBIDO) */}
            {showResistanceLadder && (
              <g id="wesely_circuit_panel" transform="translate(775, 45)" className="pulsing-circuit">
                {/* Marco del circuito */}
                <rect x="0" y="0" width="215" height="395" fill="#020617" stroke="#6b21a8" strokeWidth="1.5" rx="6" opacity="0.95" />
                <rect x="0" y="0" width="215" height="24" fill="#3b0764" rx="6" />
                <text x="107" y="16" fill="#e9d5ff" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Circuito de Wesely (1989)
                </text>

                {/* Potencial atmosférico C_atm */}
                <circle cx="107" cy="45" r="8" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
                <text x="107" y="48" fill="#ffffff" fontSize="9" fontFamily="monospace" textAnchor="middle">C</text>
                <text x="107" y="65" fill="#c084fc" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  C_atm = {baselineNO2} µg/m³
                </text>

                {/* Conductor a R_a */}
                <line x1="107" y1="53" x2="107" y2="85" stroke="#a855f7" strokeWidth="2" />

                {/* Resistencia R_a */}
                <rect x="72" y="85" width="70" height="26" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" rx="3" />
                <text x="107" y="97" fill="#c7d2fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  R_a (Aerodinámica)
                </text>
                <text x="107" y="107" fill="#818cf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  {typoExt.ra_s_m} s/m
                </text>

                {/* Conductor a R_b */}
                <line x1="107" y1="111" x2="107" y2="135" stroke="#a855f7" strokeWidth="2" />

                {/* Resistencia R_b */}
                <rect x="72" y="135" width="70" height="26" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.2" rx="3" />
                <text x="107" y="147" fill="#bae6fd" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  R_b (Capa Límite)
                </text>
                <text x="107" y="157" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  {typoExt.rb_s_m} s/m (Sc/Pr=1.6)
                </text>

                {/* Bifurcación en paralelo a R_c */}
                <line x1="107" y1="161" x2="107" y2="185" stroke="#a855f7" strokeWidth="2" />
                <line x1="35" y1="185" x2="180" y2="185" stroke="#a855f7" strokeWidth="2" />

                {/* Ramo 1: R_s (Estomática) */}
                <line x1="45" y1="185" x2="45" y2="205" stroke="#a855f7" strokeWidth="1.5" />
                <rect x="15" y="205" width="60" height="42" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" rx="3" />
                <text x="45" y="218" fill="#a7f3d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">R_s Estoma</text>
                <text x="45" y="230" fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">{typoExt.rs_s_m} s/m</text>
                <text x="45" y="242" fill="#6ee7b7" fontSize="7.5" fontFamily="monospace" textAnchor="middle">PAR={parWm2}W</text>
                <line x1="45" y1="247" x2="45" y2="275" stroke="#a855f7" strokeWidth="1.5" />

                {/* Ramo 2: R_mes (Mesofílica) */}
                <line x1="107" y1="185" x2="107" y2="205" stroke="#a855f7" strokeWidth="1.5" />
                <rect x="80" y="205" width="55" height="42" fill="#14532d" stroke="#4ade80" strokeWidth="1.2" rx="3" />
                <text x="107" y="218" fill="#bbf7d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">R_mes</text>
                <text x="107" y="230" fill="#4ade80" fontSize="8" fontFamily="monospace" textAnchor="middle">10.0 s/m</text>
                <text x="107" y="242" fill="#86efac" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Apoplasto</text>
                <line x1="107" y1="247" x2="107" y2="275" stroke="#a855f7" strokeWidth="1.5" />

                {/* Ramo 3: R_cut (Cuticular) */}
                <line x1="170" y1="185" x2="170" y2="205" stroke="#a855f7" strokeWidth="1.5" />
                <rect x="142" y="205" width="56" height="42" fill="#312e81" stroke="#a78bfa" strokeWidth="1.2" rx="3" />
                <text x="170" y="218" fill="#ddd6fe" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">R_cut</text>
                <text x="170" y="230" fill="#a78bfa" fontSize="8" fontFamily="monospace" textAnchor="middle">4760 s/m</text>
                <text x="170" y="242" fill="#c4b5fd" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Cera foliar</text>
                <line x1="170" y1="247" x2="170" y2="275" stroke="#a855f7" strokeWidth="1.5" />

                {/* Unión de ramos paralelos */}
                <line x1="35" y1="275" x2="180" y2="275" stroke="#a855f7" strokeWidth="2" />
                <line x1="107" y1="275" x2="107" y2="300" stroke="#a855f7" strokeWidth="2" />

                {/* Tierra / Sumidero bioquímico celular */}
                <rect x="45" y="300" width="125" height="35" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" rx="4" />
                <text x="107" y="315" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Sumidero Foliar NO₂
                </text>
                <text x="107" y="328" fill="#6ee7b7" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
                  v_d = {typoExt.vd_cm_s} cm/s (R_c = {typoExt.rc_s_m} s/m)
                </text>

                {/* Símbolo de Tierra */}
                <line x1="107" y1="335" x2="107" y2="350" stroke="#10b981" strokeWidth="2" />
                <line x1="92" y1="350" x2="122" y2="350" stroke="#10b981" strokeWidth="2" />
                <line x1="97" y1="355" x2="117" y2="355" stroke="#10b981" strokeWidth="1.5" />
                <line x1="102" y1="360" x2="112" y2="360" stroke="#10b981" strokeWidth="1" />

                <text x="107" y="380" fill="#a7f3d0" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  Absorción: {mitigationData.totals.totalNo2RemovalGramsPerHour} g/h
                </text>
              </g>
            )}

            {/* LEYENDA TÉCNICA EN LA ESQUINA INFERIOR IZQUIERDA */}
            <g transform="translate(15, 395)">
              <rect x="0" y="0" width="200" height="55" fill="#030712" stroke="#334155" strokeWidth="1" rx="4" opacity="0.9" />
              <circle cx="15" cy="15" r="5" fill="#10b981" />
              <text x="28" y="18" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">Cubiertas Verdes & Muros Vivos</text>

              <circle cx="15" cy="30" r="5" fill="#38bdf8" />
              <text x="28" y="33" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">Líneas de Corriente Vórtice CFD</text>

              <circle cx="15" cy="45" r="5" fill="#f43f5e" />
              <text x="28" y="48" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">Emisión Diésel/Tráfico Vehicular</text>
            </g>
          </svg>
        </div>

        {/* CONTROLES ANALÍTICOS Y ASIMILACIÓN METEOROLÓGICA */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded font-mono text-[11px]">
          <ScientificTooltip position="top" width="w-[280px]" content="Radiación Fotosintéticamente Activa (PAR). Condiciona la apertura estomática celular. A mayor PAR, menor resistencia Rs, mejorando la velocidad de deposición Vd.">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1 cursor-help">
                <span>Radiación PAR (W/m²):</span>
                <strong className="text-yellow-400">{parWm2}</strong>
              </label>
              <input
                type="range" min="0" max="800" step="20"
                value={parWm2}
                onChange={e => setParWm2(Number(e.target.value))}
                className="w-full accent-yellow-500 h-1.5 bg-slate-800 rounded appearance-none"
              />
              <span className="text-[9px] text-slate-500 block mt-0.5">Apertura estomática</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Temperatura ambiente termodinámica. Altera la difusividad térmica y rige el óptimo biológico del metabolismo celular para la captación del nitrógeno.">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1 cursor-help">
                <span>Temperatura (°C):</span>
                <strong className="text-cyan-300">{tempC}°C</strong>
              </label>
              <input
                type="range" min="10" max="42" step="0.5"
                value={tempC}
                onChange={e => setTempC(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded appearance-none"
              />
              <span className="text-[9px] text-slate-500 block mt-0.5">Óptimo fisiológico (25°C)</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Velocidad geostrófica / sinóptica a la cota del techo del cañón urbano. Alimenta la formulación de turbulencia (cizalladura) e incrementa el intercambio de masas.">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1 cursor-help">
                <span>Viento Tejado U (m/s):</span>
                <strong className="text-blue-300">{windSpeedMs} m/s</strong>
              </label>
              <input
                type="range" min="0.5" max="10.0" step="0.2"
                value={windSpeedMs}
                onChange={e => setWindSpeedMs(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded appearance-none"
              />
              <span className="text-[9px] text-slate-500 block mt-0.5">Velocidad de cota superior</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Humedad Relativa. Define indirectamente el Déficit de Presión de Vapor (VPD). Humedades muy bajas (estrés hídrico) cierran estomas, anulando Vd.">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1 cursor-help">
                <span>Humedad Relativa (%):</span>
                <strong className="text-purple-300">{rhPct}%</strong>
              </label>
              <input
                type="range" min="20" max="95" step="5"
                value={rhPct}
                onChange={e => setRhPct(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded appearance-none"
              />
              <span className="text-[9px] text-slate-500 block mt-0.5">Turgencia foliar</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[280px]" content="Concentración inicial de masa en la celda urbana, originada por tubo de escape y resuspensión. El gradiente impulsa la caída hacia el dosel.">
            <div>
              <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1 cursor-help">
                <span>NO₂ Base (µg/m³):</span>
                <strong className="text-amber-400">{baselineNO2}</strong>
              </label>
              <input
                type="range" min="15" max="120" step="1"
                value={baselineNO2}
                onChange={e => setBaselineNO2(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded appearance-none"
              />
              <span className="text-[9px] text-slate-500 block mt-0.5">Emisión fondo cañón</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* MÉTRICAS CIENTÍFICAS Y RESUMEN DE LA TESIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
          <ScientificTooltip position="top" width="w-[300px]" content="Clasificación fenomenológica del campo de flujo (Oke, 1987). Skimming flow atrapa por completo la masa; Wake Interference ventila transitoriamente las estelas; Isolated Roughness disipa eficientemente.">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-1.5 hover:border-slate-600 transition-colors cursor-help">
              <span className="text-slate-400 text-[10px] uppercase block">Régimen de Vórtice en Cañón</span>
              <div className={`text-sm font-bold ${flowRegime.color}`}>
                {flowRegime.name}
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                {flowRegime.desc}. Con relación H/W = {activeQuadrant.aspectRatioHW.toFixed(2)}, la ventilación transversal queda condicionada por el desprendimiento de vórtice.
              </p>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[300px]" content="La Resistencia Total es el sumatorio en serie de la Aerodinámica (Ra), Laminar (Rb) y de Superficie/Foliar (Rc). Su recíproco gobierna la Velocidad de Deposición (Vd = 1/(Ra+Rb+Rc)).">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-1.5 hover:border-slate-600 transition-colors cursor-help">
              <span className="text-slate-400 text-[10px] uppercase block">Resistencias Foliar y Canópica</span>
              <div className="text-sm font-bold text-emerald-400">
                v_d = {typoExt.vd_cm_s} cm/s (R_c = {typoExt.rc_s_m} s/m)
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                La resistencia aerodinámica R_a ({typoExt.ra_s_m} s/m) y cuasi-laminar R_b ({typoExt.rb_s_m} s/m) rigen el transporte hacia los estomas foliares (R_s = {typoExt.rs_s_m} s/m).
              </p>
            </div>
          </ScientificTooltip>

          <ScientificTooltip position="top" width="w-[300px]" content="Integración a nivel de mesoescala (Cuadrante) que extrapola la cinética de remoción hoja a hoja multiplicándola por el LAI total y la fracción de terreno permeada.">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-1.5 hover:border-slate-600 transition-colors cursor-help">
              <span className="text-slate-400 text-[10px] uppercase block">Balance de Remoción Anual</span>
              <div className="text-sm font-bold text-cyan-300">
                {mitigationData.totals.totalNo2RemovalGramsPerHour} g/h ({mitigationData.totals.totalNo2RemovalKgPerYear} kg/año)
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Extracción neta de dióxido de nitrógeno por la masa vegetal consolidada en el cuadrante ({mitigationData.totals.totalGreenAreaM2.toLocaleString()} m² vegetados).
              </p>
            </div>
          </ScientificTooltip>
        </div>
      </div>
    </DraggableWindow>
  );
}
