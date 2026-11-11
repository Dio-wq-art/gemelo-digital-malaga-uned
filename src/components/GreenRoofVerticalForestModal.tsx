import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Leaf, 
  Layers, 
  Wind, 
  Sun, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  ArrowDownRight, 
  Trees, 
  Activity, 
  Info,
  Maximize2,
  Filter,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { UrbanGreenInfrastructureDiagram } from './UrbanGreenInfrastructureDiagram';
import {
  MALAGA_SIMULATION_QUADRANTS,
  SimulationQuadrant,
  calculateQuadrantMitigation,
  exportGreenRoofMitigationGeoJson,
  exportGreenRoofMitigationCsv,
  VEGETATION_TYPOLOGIES,
  VegetationTypology
} from '../lib/greenRoofMitigation';
import {
  VERTICAL_FOREST_SPECIES_DATABASE,
  calculateAllSpeciesFacadeRemoval,
  exportFacadeRemovalCsv,
  FacadeNOxRemovalResult
} from '../lib/verticalForestFacadeEngine';

export interface GreenRoofVerticalForestModalProps {
  onClose: () => void;
  onOpenDiagram?: (quadrantId?: string) => void;
  currentLat?: number;
  currentLon?: number;
  currentTemp?: number;
  currentRH?: number;
  currentWindSpeed?: number;
  currentNO2Base?: number;
  currentPAR?: number;
  currentUstar?: number;
}

export function GreenRoofVerticalForestModal({
  onClose,
  onOpenDiagram,
  currentLat = 36.7196,
  currentLon = -4.4200,
  currentTemp = 22.5,
  currentRH = 58.0,
  currentWindSpeed = 3.2,
  currentNO2Base = 42.8,
  currentPAR = 380.0,
  currentUstar = 0.32
}: GreenRoofVerticalForestModalProps) {
  // Encuentra el cuadrante más cercano a la ubicación actual o usa el primero
  const initialQuadrant = useMemo(() => {
    let closest = MALAGA_SIMULATION_QUADRANTS[0];
    let minD = Infinity;
    for (const q of MALAGA_SIMULATION_QUADRANTS) {
      const d = Math.hypot(q.lat - currentLat, q.lon - currentLon);
      if (d < minD) {
        minD = d;
        closest = q;
      }
    }
    return closest;
  }, [currentLat, currentLon]);

  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string>(initialQuadrant.id);
  const [activeTab, setActiveTab] = useState<'quadrant_impact' | 'typologies_breakdown' | 'vertical_forest_facade' | 'city_grid' | 'scientific_model'>('quadrant_impact');

  // Parámetros dinámicos asimilados con controles de ajuste analítico
  const [simTemp, setSimTemp] = useState<number>(currentTemp);
  const [simRH, setSimRH] = useState<number>(currentRH);
  const [simPAR, setSimPAR] = useState<number>(currentPAR);
  const [simWind, setSimWind] = useState<number>(currentWindSpeed);
  const [simNO2, setSimNO2] = useState<number>(currentNO2Base);
  const [simUstar, setSimUstar] = useState<number>(currentUstar);

  // Remoción específica en fachadas vegetales (Bosques Verticales) para todas las especies del catálogo
  const facadeSpeciesResults = useMemo(() => {
    return calculateAllSpeciesFacadeRemoval(
      simTemp,
      simRH,
      simPAR,
      simWind,
      simUstar,
      simNO2
    );
  }, [simTemp, simRH, simPAR, simWind, simUstar, simNO2]);

  const handleDownloadFacadeCsv = () => {
    const csv = exportFacadeRemovalCsv(facadeSpeciesResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `malaga_fachadas_bosques_verticales_remocion_m2_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cuadrante seleccionado
  const activeQuadrant = useMemo(() => {
    return MALAGA_SIMULATION_QUADRANTS.find(q => q.id === selectedQuadrantId) || MALAGA_SIMULATION_QUADRANTS[0];
  }, [selectedQuadrantId]);

  // Cálculo determinista del cuadrante actual
  const mitigationResult = useMemo(() => {
    return calculateQuadrantMitigation(
      activeQuadrant,
      simTemp,
      simRH,
      simPAR,
      simWind,
      simUstar,
      simNO2
    );
  }, [activeQuadrant, simTemp, simRH, simPAR, simWind, simUstar, simNO2]);

  // Cálculos para todos los cuadrantes (para la tabla global y exportación FAIR)
  const allQuadrantsResults = useMemo(() => {
    return MALAGA_SIMULATION_QUADRANTS.map(q => 
      calculateQuadrantMitigation(q, simTemp, simRH, simPAR, simWind, simUstar, simNO2)
    );
  }, [simTemp, simRH, simPAR, simWind, simUstar, simNO2]);

  // Datos para el gráfico de absorción por tipología en el cuadrante
  const typologiesChartData = useMemo(() => {
    return mitigationResult.typologies.map(t => ({
      name: t.name.split('(')[0].replace('Cubierta Vegetal ', '').trim(),
      absorcion_gh: t.no2RemovalGramsPerHour,
      area_m2: t.areaM2,
      vd_cm_s: t.vd_cm_s,
      flujo_ug_m2_s: t.no2Flux_ug_m2_s
    }));
  }, [mitigationResult]);

  // Datos para el gráfico comparativo entre cuadrantes de Málaga
  const cityComparisonChartData = useMemo(() => {
    return allQuadrantsResults.map(r => ({
      name: r.quadrant.name.split(':')[1]?.trim() || r.quadrant.name,
      no2_base: r.ambientConditions.baselineNO2_ug_m3,
      no2_mitigado: r.totals.mitigatedNO2_ug_m3,
      reduccion_ug: r.totals.effectiveQuadrantDeltaNO2_ug_m3,
      eficiencia_pct: r.totals.mitigationEfficiencyPct,
      remocion_kg_ano: r.totals.totalNo2RemovalKgPerYear,
      isCurrent: r.quadrant.id === activeQuadrant.id
    }));
  }, [allQuadrantsResults, activeQuadrant.id]);

  // Manejadores de Descarga FAIR
  const handleDownloadGeoJson = () => {
    const geoJsonStr = exportGreenRoofMitigationGeoJson(allQuadrantsResults);
    const blob = new Blob([geoJsonStr], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubiertas_verdes_bosques_verticales_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportGreenRoofMitigationCsv(allQuadrantsResults);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubiertas_verdes_bosques_verticales_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Auditoría de Sumideros Vegetales y Bosques Verticales"
      subtitle="Cuantificación determinista de absorción estomática de NO₂ en la canopia urbana existente (Wesely 1989 / EMEP-EEA)"
      icon={<Building2 className="w-4 h-4 text-emerald-400" />}
      badge={
        <span className="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 font-mono font-bold flex items-center gap-1">
          <Leaf className="w-3 h-3 text-emerald-400" />
          <span>-{mitigationResult.totals.effectiveQuadrantDeltaNO2_ug_m3} µg/m³ NO₂ ({mitigationResult.totals.mitigationEfficiencyPct}%)</span>
        </span>
      }
      headerExtra={
        <div className="flex items-center gap-1.5">
          {onOpenDiagram && (
            <ScientificTooltip position="bottom" width="w-[300px]" content="Abrir el diagrama explicativo extenso a color: sección transversal 2D de cañón urbano a escala, líneas de corriente del vórtice CFD, pluma de NO₂ y circuito de resistencias de Wesely.">
              <button
                onClick={() => onOpenDiagram(selectedQuadrantId)}
                className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/80 text-indigo-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors font-bold shadow-[0_0_8px_rgba(99,102,241,0.25)]"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Diagrama Color (Wesely/CFD)</span>
              </button>
            </ScientificTooltip>
          )}
          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar capa espacial en GeoJSON estandarizado (EPSG:4326) con geometrías de cuadrantes, áreas verdes y tasas de remoción según principios FAIR.">
            <button
              onClick={handleDownloadGeoJson}
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <FileJson className="w-3 h-3" />
              <span>GeoJSON</span>
            </button>
          </ScientificTooltip>
          <ScientificTooltip position="bottom" width="w-[280px]" content="Exportar matriz completa de variables físicas, resistencias de Wesely y balances de masa en formato CSV tabulado citable.">
            <button
              onClick={handleDownloadCsv}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </ScientificTooltip>
        </div>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-500/40"
      className="w-[96vw] max-w-5xl"
    >
      <div className="p-3.5 space-y-3.5 text-slate-200 text-xs font-sans overflow-y-auto max-h-[75vh]">
        {/* SELECTOR DE CUADRANTE Y TELEMETRÍA EN VIVO */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>Cuadrante de Asimilación Microescalar en Málaga:</span>
            </label>
            <select
              value={selectedQuadrantId}
              onChange={e => setSelectedQuadrantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs p-1.5 rounded focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {MALAGA_SIMULATION_QUADRANTS.map(q => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.district})
                </option>
              ))}
            </select>
          </div>

          {/* TELEMETRÍA ASIMILADA */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full md:w-auto text-center font-mono">
            <ScientificTooltip position="bottom" width="w-[250px]" content="Concentración de dióxido de nitrógeno ambiente de fondo. Referencia toxicológica según Directiva 2008/50/CE (Límite anual 40 µg/m³).">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-amber-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">NO₂ Base</div>
                <div className="text-amber-400 font-bold">{simNO2} <span className="text-[8px] text-slate-500">µg/m³</span></div>
              </div>
            </ScientificTooltip>
            
            <ScientificTooltip position="bottom" width="w-[250px]" content="Temperatura del aire termodinámica. Modula la apertura estomática foliar (resistencia Rc) y la difusividad cinemática de los gases.">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-cyan-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">Temp</div>
                <div className="text-cyan-300 font-bold">{simTemp}°C</div>
              </div>
            </ScientificTooltip>
            
            <ScientificTooltip position="bottom" width="w-[250px]" content="Radiación Fotosintéticamente Activa (PAR 400-700nm). Motor primario de la fisiología estomática y la bomba de succión foliar.">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-yellow-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">PAR</div>
                <div className="text-yellow-400 font-bold">{simPAR} <span className="text-[8px] text-slate-500">W/m²</span></div>
              </div>
            </ScientificTooltip>
            
            <ScientificTooltip position="bottom" width="w-[250px]" content="Humedad Relativa. Define el déficit de presión de vapor (VPD), afectando la turgencia y transpiración (resistencia estomática Rs).">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-blue-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">Humedad</div>
                <div className="text-blue-300 font-bold">{simRH}%</div>
              </div>
            </ScientificTooltip>
            
            <ScientificTooltip position="bottom" width="w-[250px]" content="Velocidad media del aire confinada en el cañón urbano, fuertemente atenuada por la topología de los edificios perimetrales.">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-emerald-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">Viento Cañón</div>
                <div className="text-emerald-300 font-bold">{mitigationResult.urbanCanyonPhysics.meanCanyonWindMs} <span className="text-[8px] text-slate-500">m/s</span></div>
              </div>
            </ScientificTooltip>
            
            <ScientificTooltip position="bottom" width="w-[250px]" content="Velocidad de fricción (u*). Cuantifica el cizallamiento mecánico y la intensidad de la turbulencia en la capa límite, determinando la Resistencia Aerodinámica (Ra).">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded hover:border-purple-500/50 transition-colors cursor-help">
                <div className="text-[9px] text-slate-400">Fricción u*</div>
                <div className="text-purple-300 font-bold">{simUstar} <span className="text-[8px] text-slate-500">m/s</span></div>
              </div>
            </ScientificTooltip>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-[11px] font-mono">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Visualiza la absorción neta de NO2 en el cuadrante seleccionado, comparando cubiertas verdes, fachadas verticales y arbolado viario.">
            <button
              onClick={() => setActiveTab('quadrant_impact')}
              className={`px-3 py-1.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'quadrant_impact'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Impacto en Cuadrante ({activeQuadrant.district})</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Desglose analítico de resistencias de Wesely (Ra, Rb, Rs, Rc) y velocidades de deposición vd para cada tipología vegetal.">
            <button
              onClick={() => setActiveTab('typologies_breakdown')}
              className={`px-3 py-1.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'typologies_breakdown'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tipologías & Resistencias</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[300px]" content="Capacidad específica de remoción de NOx por metro cuadrado de fachada (g/m²·año, mg/m²·día, v_d y asimetría de vórtice sotavento/barlovento) según catálogo de especies botánicas trepadoras y muros vivos.">
            <button
              onClick={() => setActiveTab('vertical_forest_facade')}
              className={`px-3 py-1.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'vertical_forest_facade'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bosques Verticales (m² fachada)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Malla comparativa de los 8 cuadrantes urbanos de Málaga frente a emisiones de NO2 y potencial de azoteas verdes.">
            <button
              onClick={() => setActiveTab('city_grid')}
              className={`px-3 py-1.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'city_grid'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Malla Urbana de Málaga</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Formulación físico-matemática determinista del modelo de Wesely (1989), balance de masa canópica y directivas europeas.">
            <button
              onClick={() => setActiveTab('scientific_model')}
              className={`px-3 py-1.5 border-b-2 font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'scientific_model'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Formulación & Marco Normativo</span>
            </button>
          </ScientificTooltip>
        </div>

        {/* TAB 1: IMPACTO EN CUADRANTE */}
        {activeTab === 'quadrant_impact' && (
          <div className="space-y-3">
            {/* DIAGRAMA VECTORIAL ANIMADO DE BIOFILTRACIÓN URBANA */}
            <UrbanGreenInfrastructureDiagram
              quadrantName={activeQuadrant.name}
              no2Baseline={mitigationResult.ambientConditions.baselineNO2_ug_m3}
              no2Mitigated={mitigationResult.totals.mitigatedNO2_ug_m3}
              totalGreenAreaM2={mitigationResult.totals.totalGreenAreaM2}
              weightedVd={mitigationResult.totals.weightedVd_cm_s}
              annualRemovalKg={mitigationResult.totals.totalNo2RemovalKgPerYear}
              laiMean={activeQuadrant.inventory.extensiveGreenRoofAreaM2 > 0 ? 3.8 : 2.5}
              windSpeed={simWind}
              parWm2={simPAR}
            />

            {/* CARDS DE RESUMEN EJECUTIVO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Masa neta volumétrica de NO₂ abatida en el volumen de control. La diferencia de concentración ilustra la capacidad depuradora (Sink Effect) de la biomasa foliar del cuadrante.">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-emerald-500/50 transition-colors cursor-help">
                  <div className="text-[10px] text-slate-400 uppercase">NO₂ Antes / Después</div>
                  <div className="text-base font-bold flex items-baseline gap-1 mt-1">
                    <span className="text-slate-400 line-through">{mitigationResult.ambientConditions.baselineNO2_ug_m3}</span>
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-lg">{mitigationResult.totals.mitigatedNO2_ug_m3}</span>
                    <span className="text-[9px] text-slate-400">µg/m³</span>
                  </div>
                  <div className="text-[9.5px] text-emerald-400 mt-1">
                    Reducción neta: <strong>-{mitigationResult.totals.effectiveQuadrantDeltaNO2_ug_m3} µg/m³</strong> ({mitigationResult.totals.mitigationEfficiencyPct}%)
                  </div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Flujo gravimétrico de nitrógeno reactivo removido de la atmósfera. Calculado asumiendo un patrón de asimilación anual para extrapolar la mitigación equivalente en kg/año de NO₂.">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-cyan-500/50 transition-colors cursor-help">
                  <div className="text-[10px] text-slate-400 uppercase">Remoción Horaria / Anual</div>
                  <div className="text-lg font-bold text-cyan-300 mt-1">
                    {mitigationResult.totals.totalNo2RemovalGramsPerHour} <span className="text-[9px] text-slate-400 font-normal">g NO₂/h</span>
                  </div>
                  <div className="text-[9.5px] text-cyan-400/90 mt-1">
                    Equivalente: <strong>{mitigationResult.totals.totalNo2RemovalKgPerYear} kg/año</strong> absorbidos
                  </div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Sumatorio planimétrico (m²) de todas las tipologías vegetales (extensivas, intensivas, muros verticales, arbolado) ponderado por sus velocidades de deposición Vd combinadas.">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-emerald-500/50 transition-colors cursor-help">
                  <div className="text-[10px] text-slate-400 uppercase">Superficie Vegetal Existente</div>
                  <div className="text-lg font-bold text-emerald-300 mt-1">
                    {mitigationResult.totals.totalGreenAreaM2.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">m²</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    Vd ponderada: <strong className="text-emerald-400">{mitigationResult.totals.weightedVd_cm_s} cm/s</strong>
                  </div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Proyección analítica: Capacidad máxima de remoción si todas las azoteas planas disponibles técnica y estructuralmente en el cuadrante fuesen retro-equipadas con cubierta vegetal extensiva.">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-amber-500/50 transition-colors cursor-help">
                  <div className="text-[10px] text-slate-400 uppercase">Potencial con Retrofit</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">
                    {mitigationResult.totals.potentialWithRetrofitKgPerYear.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">kg/año</span>
                  </div>
                  <div className="text-[9px] text-amber-400/90 mt-1">
                    +{(activeQuadrant.inventory.potentialRetrofitRoofAreaM2).toLocaleString()} m² azoteas disponibles
                  </div>
                </div>
              </ScientificTooltip>
            </div>

            {/* GRÁFICO DE APORTE POR TIPOLOGÍA Y DESGLOSE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-200 font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tasa de Absorción de NO₂ por Tipología (g/h)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Fórmula Wesely 1989</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typologiesChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9.5 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'g NO₂/h', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                        formatter={(val: any) => [`${val} g/h`, 'Absorción NO₂']}
                      />
                      <Bar dataKey="absorcion_gh" radius={[3, 3, 0, 0]}>
                        {typologiesChartData.map((item, idx) => (
                          <Cell 
                            key={`typo-cell-${item.name || idx}`} 
                            fill={idx === 0 ? '#10b981' : idx === 1 ? '#06b6d4' : idx === 2 ? '#a855f7' : '#22c55e'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DETALLES DEL CAÑÓN Y MORFOLOGÍA URBANA */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-3 rounded flex flex-col justify-between font-mono text-[11px] space-y-2">
                <div className="text-slate-200 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Morfología de Cañón Urbano</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Cuadrante {activeQuadrant.district}</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <ScientificTooltip position="left" width="w-[280px]" content="Relación Altura/Anchura (Aspect Ratio H/W). Define el régimen de flujo aerodinámico (Skimming flow vs Wake interference). H/W altos atrapan contaminantes reduciendo fuertemente la dispersión.">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60 hover:bg-slate-800/40 px-1 rounded cursor-help">
                      <span className="text-slate-400">Relación de Aspecto (H/W):</span>
                      <strong className="text-cyan-300">{activeQuadrant.aspectRatioHW.toFixed(2)} (Alto {activeQuadrant.canyonHeightM}m / Ancho {activeQuadrant.canyonWidthM}m)</strong>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip position="left" width="w-[280px]" content="Sky View Factor (SVF). Fracción adimensional de cielo libre de obstáculos. Rige el balance radiativo de onda larga nocturno y la interceptación de fotones solares en la calle.">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60 hover:bg-slate-800/40 px-1 rounded cursor-help">
                      <span className="text-slate-400">Factor de Visión del Cielo (SVF):</span>
                      <strong className="text-amber-300">{activeQuadrant.skyViewFactorSVF.toFixed(2)} adim</strong>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip position="left" width="w-[280px]" content="Volumen de aire retenido en la geometría del cañón urbano (V = W × H × L). Sirve de volumen de control (Box Model) para la ecuación de balance de concentración.">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60 hover:bg-slate-800/40 px-1 rounded cursor-help">
                      <span className="text-slate-400">Volumen Capa Canópica (V):</span>
                      <strong className="text-slate-200">{mitigationResult.urbanCanyonPhysics.canopyAirVolumeM3.toLocaleString()} m³</strong>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip position="left" width="w-[280px]" content="Tasa de Renovación de Aire (ACH). Volumen de aire limpio renovado por unidad de tiempo mediante cizalladura turbulenta y advección lateral. Mayor ACH reduce estancamientos.">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60 hover:bg-slate-800/40 px-1 rounded cursor-help">
                      <span className="text-slate-400">Tasa Renovación de Aire (λ):</span>
                      <strong className="text-purple-300">{mitigationResult.urbanCanyonPhysics.airExchangeRatePerHour} h⁻¹</strong>
                    </div>
                  </ScientificTooltip>
                  <ScientificTooltip position="left" width="w-[280px]" content="Flujo másico-volumétrico expulsado de la canopia inducido por gradientes de presión termodinámicos y efectos vortex tipo Prandtl-Meyer de techumbre.">
                    <div className="flex justify-between py-0.5 hover:bg-slate-800/40 px-1 rounded cursor-help">
                      <span className="text-slate-400">Flujo Ventilación Transversal:</span>
                      <strong className="text-emerald-300">{mitigationResult.urbanCanyonPhysics.ventilationFluxM3_s.toLocaleString()} m³/s</strong>
                    </div>
                  </ScientificTooltip>
                </div>

                <div className="p-2 bg-slate-950 border border-slate-800/80 rounded text-[10px] text-slate-400 leading-relaxed">
                  <span className="text-emerald-400 font-bold block mb-0.5">Diagnóstico Físico:</span>
                  {activeQuadrant.notes}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIPOLOGÍAS & RESISTENCIAS DE WESELY */}
        {activeTab === 'typologies_breakdown' && (
          <div className="space-y-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="p-2.5">Tipología Vegetal</th>
                    <th className="p-2.5 text-center">Superficie (m²)</th>
                    <ScientificTooltip position="top" width="w-[200px]" content="Leaf Area Index (Índice de Área Foliar). Superficie m² de hojas por m² de suelo. Multiplica la superficie captadora aerodinámica total.">
                      <th className="p-2.5 text-center cursor-help">LAI</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Resistencia Aerodinámica (Ra): Resistencia al paso del NO₂ a través del régimen turbulento de la capa límite atmosférica hacia el dosel.">
                      <th className="p-2.5 text-center cursor-help">R_a (s/m)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Resistencia Cuasi-Laminar (Rb): Resistencia molecular difusiva a través de la fina capa subcapa viscosa adherida a la superficie de la hoja.">
                      <th className="p-2.5 text-center cursor-help">R_b (s/m)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Resistencia Estomática (Rs): Limitación fisiológica dependiente de los poros estomáticos (regulada biológicamente por PAR, VPD, Temp).">
                      <th className="p-2.5 text-center cursor-help">R_s (s/m)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Resistencia Canópica (Rc): Integración macroscópica paralela de absorción estomática (Rs), cuticular y suelo. Principal sumidero.">
                      <th className="p-2.5 text-center cursor-help">R_c (s/m)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Velocidad de Deposición (Vd): Inversa escalar de la suma de resistencias en serie (1 / (Ra + Rb + Rc)). Define la rapidez del flujo descendente de contaminante.">
                      <th className="p-2.5 text-center cursor-help">v_d (cm/s)</th>
                    </ScientificTooltip>
                    <th className="p-2.5 text-right">NO₂ Absorbido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mitigationResult.typologies.map((t) => (
                    <tr key={t.typology} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-200">{t.name}</div>
                        <div className="text-[9.5px] text-slate-500 italic">
                          {VEGETATION_TYPOLOGIES[t.typology].scientificName}
                        </div>
                      </td>
                      <td className="p-2.5 text-center text-slate-300">
                        {t.areaM2.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center text-cyan-300 font-bold">
                        {t.effectiveLAI}
                      </td>
                      <td className="p-2.5 text-center text-slate-400">
                        {t.ra_s_m}
                      </td>
                      <td className="p-2.5 text-center text-slate-400">
                        {t.rb_s_m}
                      </td>
                      <td className="p-2.5 text-center text-amber-400 font-bold">
                        {t.rs_s_m}
                      </td>
                      <td className="p-2.5 text-center text-purple-400">
                        {t.rc_s_m}
                      </td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">
                        {t.vd_cm_s}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-300">
                        <div>{t.no2RemovalGramsPerHour} g/h</div>
                        <div className="text-[9.5px] text-slate-400 font-normal">
                          {t.no2RemovalKgPerYear} kg/año
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DESCRIPCIÓN BOTÁNICA Y AERODINÁMICA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Object.values(VEGETATION_TYPOLOGIES).map(typo => (
                <div key={typo.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-200 text-[11px] block">{typo.name}</span>
                      <span className="text-[10px] text-emerald-400 italic font-mono">{typo.scientificName}</span>
                    </div>
                    <span className="text-[9.5px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      LAI: {typo.defaultLAI}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">{typo.description}</p>
                  <div className="flex gap-3 text-[9.5px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>z₀: <strong className="text-slate-200">{typo.roughnessZ0_m} m</strong></span>
                    <span>Rs min: <strong className="text-amber-400">{typo.rsMin_s_m} s/m</strong></span>
                    <span>Enfriamiento: <strong className="text-cyan-400">-{typo.transpirationCooling_C}°C</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BOSQUES VERTICALES Y FACHADAS VERDES (POR M² DE FACHADA) */}
        {activeTab === 'vertical_forest_facade' && (
          <div className="space-y-3.5">
            {/* ENCABEZADO Y CONTROLES DE LA PESTAÑA */}
            <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-[12px] font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-emerald-400" />
                  <span>Capacidad Específica de Remoción de NOₓ por Metro Cuadrado de Fachada</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Base de datos botánica de especies trepadoras y muros vivos acoplada a Wesely (1989) y asimetría de cañón (Pugh et al. 2012)
                </p>
              </div>

              <ScientificTooltip
                position="left"
                width="w-[300px]"
                content="Descargar matriz en formato CSV con todas las variables micrometeorológicas, índices foliares verticales (LAI), resistencias estomáticas y tasas de captación por m²."
              >
                <button
                  onClick={handleDownloadFacadeCsv}
                  className="bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500 text-emerald-100 text-[10px] px-2.5 py-1 flex items-center gap-1.5 font-mono font-bold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Exportar CSV Fachadas</span>
                </button>
              </ScientificTooltip>
            </div>

            {/* TABLA PRINCIPAL DE ESPECIES BOTÁNICAS POR M² */}
            <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="p-2.5">Especie Botánica</th>
                    <th className="p-2.5 text-center">Tipología / Hábito</th>
                    <ScientificTooltip position="top" width="w-[200px]" content="Índice de Área Foliar vertical (m² de lámina foliar por cada m² de superficie de paramento vertical edificado).">
                      <th className="p-2.5 text-center cursor-help">LAI (m²/m²)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Resistencia estomática mínima en condiciones basales óptimas según Wesely (1989).">
                      <th className="p-2.5 text-center cursor-help">R_s,min (s/m)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Velocidad de deposición efectiva en fachada v_d = 1/(Ra + Rb + Rc) dependiente de meteorología actual.">
                      <th className="p-2.5 text-center cursor-help">v_d (cm/s)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[220px]" content="Flujo instantáneo de remoción neta de NO2 por cada metro cuadrado de fachada: F_d = v_d · [NO2].">
                      <th className="p-2.5 text-center cursor-help">Flujo (µg/m²·s)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[220px]" content="Captación de NO2 diaria por m² de fachada bajo la radiación PAR y condiciones atmosféricas actuales.">
                      <th className="p-2.5 text-right cursor-help text-cyan-400">mg/m²·día</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[240px]" content="Capacidad anualizada de remoción de NO2 por metro cuadrado de fachada (8760 horas continuas).">
                      <th className="p-2.5 text-right cursor-help text-emerald-400">g/m²·año</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[220px]" content="Masa anual de NO2 depurada por cada 100 m² de fachada vegetal (ej. edificio de 4 plantas x 10 m de ancho).">
                      <th className="p-2.5 text-right cursor-help text-emerald-300">kg/100m²·año</th>
                    </ScientificTooltip>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {facadeSpeciesResults.map((r) => (
                    <tr key={r.species.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-200">{r.species.commonName}</div>
                        <div className="text-[9.5px] text-emerald-400 italic">
                          {r.species.scientificName}
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[9.5px]">
                          {r.species.typology}
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5">{r.species.foliageRetention}</div>
                      </td>
                      <td className="p-2.5 text-center text-cyan-300 font-bold">
                        {r.species.defaultLAI}
                      </td>
                      <td className="p-2.5 text-center text-amber-400">
                        {r.species.rsMin_s_m}
                      </td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">
                        {r.effectiveVd_cm_s}
                      </td>
                      <td className="p-2.5 text-center text-slate-300">
                        {r.specificCapacity.instantaneousFlux_ug_m2_s}
                      </td>
                      <td className="p-2.5 text-right font-bold text-cyan-300">
                        {r.specificCapacity.dailyRemovalMg_m2_day}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-400 text-xs">
                        {r.specificCapacity.annualRemovalG_m2_year}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-300">
                        {r.specificCapacity.annualRemovalKg_per_100m2_year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* COMPARATIVA GRÁFICA ENTRE ESPECIES (g/m²·año) */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-200 font-mono">
                  Capacidad de Remoción Anual Específica por Especie (g NOₓ / m² fachada · año)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Condición: {simNO2} µg/m³ NO₂ · PAR {simPAR} W/m²
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={facadeSpeciesResults.map(r => ({
                      name: r.species.commonName.split('(')[0].trim(),
                      annualG: r.specificCapacity.annualRemovalG_m2_year,
                      leewardG: r.canyonAsymmetry.leewardAnnualRemovalG_m2_year,
                      windwardG: r.canyonAsymmetry.windwardAnnualRemovalG_m2_year
                    }))}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9.5 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'g NO₂ / m²·año', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any, name: string) => [
                        `${val} g/m²·año`,
                        name === 'annualG' ? 'Promedio Fachada' : name === 'leewardG' ? 'Pared Sotavento (Vórtice)' : 'Pared Barlovento'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="annualG" name="Promedio Fachada" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="leewardG" name="Pared Sotavento (Vórtice)" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="windwardG" name="Pared Barlovento" fill="#64748b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ASIMETRÍA DE CAÑÓN URBANO Y DESCRIPCIÓN BOTÁNICA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {facadeSpeciesResults.map(r => (
                <div key={r.species.id} className="p-3 bg-slate-900/70 border border-slate-800 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-200 text-[11px] block">{r.species.commonName}</span>
                      <span className="text-[10px] text-emerald-400 italic font-mono">{r.species.scientificName}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-700/60 rounded">
                      {r.specificCapacity.annualRemovalG_m2_year} g/m²·a
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Aplicación en Málaga: </strong>
                    {r.species.typicalMalagaApplication}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      Tricomas: <strong className="text-slate-200">{r.species.trichomeDensity}</strong>
                    </div>
                    <div>
                      Enfriamiento: <strong className="text-cyan-400">-{r.species.summerCoolingC}°C</strong>
                    </div>
                    <div>
                      Sotavento: <strong className="text-emerald-300">{r.canyonAsymmetry.leewardAnnualRemovalG_m2_year} g/m²·a</strong>
                    </div>
                    <div>
                      Barlovento: <strong className="text-slate-400">{r.canyonAsymmetry.windwardAnnualRemovalG_m2_year} g/m²·a</strong>
                    </div>
                  </div>

                  <div className="text-[8.5px] text-slate-500 italic pt-0.5 border-t border-slate-800/50">
                    Ref: {r.species.scientificReference}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MALLA URBANA DE MÁLAGA */}
        {activeTab === 'city_grid' && (
          <div className="space-y-3">
            {/* GRÁFICO COMPARATIVO DE CONCENTRACIONES */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-slate-200 font-mono">
                  Comparativa de NO₂ Base vs Mitigado en Cuadrantes Urbanos (µg/m³)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {simNO2} µg/m³ Base General
                </span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityComparisonChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9.5 }} interval={0} angle={-20} textAnchor="end" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'NO₂ (µg/m³)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any, name: string) => [
                        `${val} ${name.includes('pct') ? '%' : 'µg/m³'}`, 
                        name === 'no2_base' ? 'NO₂ Base' : name === 'no2_mitigado' ? 'NO₂ Mitigado' : name
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="no2_base" name="NO₂ Base" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="no2_mitigado" name="NO₂ Mitigado" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABLA DE CUADRANTES DE MÁLAGA */}
            <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="p-2.5">Cuadrante</th>
                    <ScientificTooltip position="top" width="w-[200px]" content="Sumatorio total de superficie con cobertura vegetal en el cuadrante, incluyendo arbolado, parques, jardines y cubiertas vegetadas.">
                      <th className="p-2.5 text-center cursor-help">Área Vegetada (m²)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="M² totales de techos verdes (extensivos e intensivos). Estas superficies actúan como sumideros secos permanentes en las azoteas de los edificios.">
                      <th className="p-2.5 text-center cursor-help">Cubiertas (m²)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Superficie vertical bio-activa (fachadas verdes, enredaderas, muros vivos). Clave para aumentar el área de deposición dentro del cañón urbano.">
                      <th className="p-2.5 text-center cursor-help">Muros Vivos (m²)</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Concentración final calculada de NO₂ en el volumen de control tras sustraer la masa absorbida por la vegetación.">
                      <th className="p-2.5 text-center cursor-help">NO₂ Mitigado</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Diferencial de concentración (ΔC) logrado respecto al escenario base sin vegetación adicional o deposición seca.">
                      <th className="p-2.5 text-center cursor-help">Reducción ΔC</th>
                    </ScientificTooltip>
                    <ScientificTooltip position="top" width="w-[200px]" content="Proyección de masa total de nitrógeno reactivo secuestrado y metabolizado anualmente por la biosfera del cuadrante.">
                      <th className="p-2.5 text-right cursor-help">Absorción Anual</th>
                    </ScientificTooltip>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allQuadrantsResults.map((r) => {
                    const isSelected = r.quadrant.id === activeQuadrant.id;
                    return (
                      <tr 
                        key={r.quadrant.id} 
                        onClick={() => setSelectedQuadrantId(r.quadrant.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-950/40 border-l-2 border-emerald-400' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-slate-200">
                          <div>{r.quadrant.name}</div>
                          <span className="text-[9.5px] text-slate-400 font-normal">{r.quadrant.district}</span>
                        </td>
                        <td className="p-2.5 text-center text-slate-300">
                          {r.totals.totalGreenAreaM2.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center text-emerald-400">
                          {(r.quadrant.inventory.extensiveGreenRoofAreaM2 + r.quadrant.inventory.intensiveGreenRoofAreaM2).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center text-cyan-300">
                          {r.quadrant.inventory.verticalForestAreaM2.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-300">
                          {r.totals.mitigatedNO2_ug_m3} µg/m³
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-400">
                          -{r.totals.effectiveQuadrantDeltaNO2_ug_m3} ({r.totals.mitigationEfficiencyPct}%)
                        </td>
                        <td className="p-2.5 text-right font-bold text-amber-300">
                          {r.totals.totalNo2RemovalKgPerYear} kg/año
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FORMULACIÓN & MARCO NORMATIVO */}
        {activeTab === 'scientific_model' && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Modelo de Resistencias en Serie para Deposición Seca (Wesely 1989)</span>
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                La velocidad de deposición de dióxido de nitrógeno (<span className="font-mono text-emerald-300">v_d</span>) sobre elementos vegetales urbanos se formula mediante la analogía eléctrica de resistencias en serie:
              </p>
              <div className="bg-slate-950 p-2.5 border border-slate-800 text-center font-mono text-emerald-300 text-xs">
                v_d = 1 / ( R_a + R_b + R_c )
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400 font-sans text-[11px]">
                <li><strong className="text-slate-200 font-mono">R_a (Resistencia Aerodinámica):</strong> ln(z_ref / z_0) / (k · u*). Modela el transporte turbulento en la capa superficial atmosférica sobre el plano de azotea o calle.</li>
                <li><strong className="text-slate-200 font-mono">R_b (Resistencia Cuasi-Laminar Foliar):</strong> 2 / (k · u*) · (Sc / Pr)^(2/3). Dependiente del número de Schmidt (Sc/Pr = 1.6 para NO₂) y la difusividad molecular gaseosa en la interfase hoja-aire.</li>
                <li><strong className="text-slate-200 font-mono">R_c (Resistencia Canópica):</strong> ( 1/R_s + 1/R_mes + 1/R_cut )⁻¹. Integra la apertura estomática controlada por radiación fotosintéticamente activa (PAR) y temperatura, junto con la disolución mesofílica y captura cuticular.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
              <span className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Balance de Masa y Ventilacion en Cañón Urbano</span>
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                La caída local de concentración (<span className="font-mono text-cyan-300">Δ[NO₂]</span>) en el aire del cañón se obtiene del balance entre el flujo de absorción de la masa vegetal y la tasa de ventilación transversal:
              </p>
              <div className="bg-slate-950 p-2.5 border border-slate-800 text-center font-mono text-cyan-300 text-xs">
                Δ[NO₂] = ( ∑ F_d · A_veg ) / ( W_canyon · H_canyon · U_canyon )
              </div>
              <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                Donde <span className="font-mono text-slate-200">W_canyon</span> y <span className="font-mono text-slate-200">H_canyon</span> son la anchura y altura del cañón urbano del cuadrante, y <span className="font-mono text-slate-200">U_canyon</span> es la velocidad del viento atenuada por fricción en fondo de calle.
              </p>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1.5">
              <span className="text-purple-400 font-bold text-xs block">Trazabilidad Normativa Europea</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px] font-sans">
                <div className="bg-slate-950 p-2 border border-slate-800 rounded">
                  <strong className="text-purple-300 block font-mono">Directiva 2008/50/CE</strong>
                  <span className="text-slate-400">Objetivo anual de protección para NO₂: límite de 40 µg/m³ (futuro 20 µg/m³ bajo revisión directiva 2024).</span>
                </div>
                <div className="bg-slate-950 p-2 border border-slate-800 rounded">
                  <strong className="text-purple-300 block font-mono">Guías OMS 2021</strong>
                  <span className="text-slate-400">Guía de calidad del aire para NO₂: valor medio anual recomendado de 10 µg/m³.</span>
                </div>
                <div className="bg-slate-950 p-2 border border-slate-800 rounded">
                  <strong className="text-purple-300 block font-mono">Guía EMEP/EEA 2023</strong>
                  <span className="text-slate-400">Metodología internacional para inventarios de deposición seca y sumideros de gases reactivos en la biosfera.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
