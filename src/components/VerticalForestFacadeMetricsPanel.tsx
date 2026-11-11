import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Leaf, 
  Layers, 
  Wind, 
  Sun, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  ArrowDownRight, 
  Trees, 
  Activity, 
  Info,
  Maximize2,
  Compass,
  Scale,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  VERTICAL_FOREST_SPECIES_DATABASE, 
  VerticalForestPlantSpecies,
  calculateFacadeNOxRemoval,
  calculateAllSpeciesFacadeRemoval,
  exportFacadeRemovalCsv,
  FacadeNOxRemovalResult
} from '../lib/verticalForestFacadeEngine';

export interface VerticalForestFacadeMetricsPanelProps {
  currentTemp?: number;
  currentRH?: number;
  currentWindSpeedMs?: number;
  currentNO2Base?: number;
  currentPAR?: number;
  currentUstar?: number;
  onOpenSimulationModal?: () => void;
  onOpenCanyonDiagram?: () => void;
}

export const VerticalForestFacadeMetricsPanel: React.FC<VerticalForestFacadeMetricsPanelProps> = ({
  currentTemp = 23.5,
  currentRH = 58.0,
  currentWindSpeedMs = 2.8,
  currentNO2Base = 38.5,
  currentPAR = 380.0,
  currentUstar = 0.28,
  onOpenSimulationModal,
  onOpenCanyonDiagram
}) => {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('hedera_helix');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAllSpeciesRanking, setShowAllSpeciesRanking] = useState<boolean>(false);
  const [canyonOrientationMode, setCanyonOrientationMode] = useState<'both' | 'leeward' | 'windward'>('both');

  // Recuperar especie seleccionada
  const selectedSpecies = useMemo(() => {
    return VERTICAL_FOREST_SPECIES_DATABASE.find(s => s.id === selectedSpeciesId) 
      || VERTICAL_FOREST_SPECIES_DATABASE[0];
  }, [selectedSpeciesId]);

  // Cálculo individual de la especie seleccionada
  const activeMetrics = useMemo(() => {
    return calculateFacadeNOxRemoval(
      selectedSpecies,
      currentTemp,
      currentRH,
      currentPAR,
      currentWindSpeedMs,
      currentUstar,
      currentNO2Base
    );
  }, [selectedSpecies, currentTemp, currentRH, currentPAR, currentWindSpeedMs, currentUstar, currentNO2Base]);

  // Cálculo para todas las especies del catálogo para rankings comparativos
  const allSpeciesResults = useMemo(() => {
    return calculateAllSpeciesFacadeRemoval(
      currentTemp,
      currentRH,
      currentPAR,
      currentWindSpeedMs,
      currentUstar,
      currentNO2Base
    );
  }, [currentTemp, currentRH, currentPAR, currentWindSpeedMs, currentUstar, currentNO2Base]);

  // Descarga citable en CSV
  const handleExportCsv = () => {
    const csvContent = exportFacadeRemovalCsv(allSpeciesResults);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tesis_bosques_verticales_malaga_remocion_m2_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-emerald-950/30 border border-emerald-800/60 p-3 space-y-2.5 text-slate-200 mt-2">
      {/* Encabezado del Panel */}
      <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1.5">
              <span>Remoción de NOₓ en Fachada Vertical</span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 border border-emerald-500/40 font-mono">
                m⁻² fachada
              </span>
            </h4>
            <p className="text-[8px] text-slate-400 font-mono">
              Modelo Wesely (1989) + Guía EMEP/EEA 2023 · Bosques Verticales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ScientificTooltip 
            position="left" 
            width="w-[300px]" 
            content="Exportar matriz analítica de captación específica de NO2 (g/m²·año, mg/m²·día, v_d y resistances) para todas las especies botánicas del catálogo en formato CSV citable (FAIR Open Science)."
          >
            <button
              onClick={handleExportCsv}
              className="p-1 bg-black/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 hover:text-white transition-colors flex items-center gap-0.5 text-[8px] font-mono cursor-pointer"
            >
              <Download className="w-2.5 h-2.5" />
              <span>CSV</span>
            </button>
          </ScientificTooltip>

          {onOpenSimulationModal && (
            <ScientificTooltip 
              position="left" 
              width="w-[280px]" 
              content="Abrir balance físico-químico y balance multidistrito de cubiertas vegetales y bosques verticales en Málaga."
            >
              <button
                onClick={onOpenSimulationModal}
                className="p-1 bg-black/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <Maximize2 className="w-2.5 h-2.5" />
              </button>
            </ScientificTooltip>
          )}

          <ScientificTooltip content={isExpanded ? "Colapsar métricas específicas de absorción por especie vegetal." : "Desplegar métricas detalladas y desglose fitoquímico por especie."}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2.5">
          {/* Selector de Especie Botánica */}
          <div>
            <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Leaf className="w-2.5 h-2.5 text-emerald-400" />
                <span>Especie Botánica en Fachada:</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                LAI = {selectedSpecies.defaultLAI} m²/m²
              </span>
            </div>

            <ScientificTooltip
              position="top"
              width="w-[320px]"
              content="Base de datos botánica certificada de especies para muros vivos y fachadas vegetales en Málaga. Cada taxón aporta un índice foliar vertical (LAI), resistencia estomática mínima (Rs,min) y rugosidad aerodinámica z0 verificados."
            >
              <select
                value={selectedSpeciesId}
                onChange={(e) => setSelectedSpeciesId(e.target.value)}
                className="w-full bg-black/80 border border-emerald-800 text-[9.5px] font-mono text-emerald-200 px-2 py-1 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                {VERTICAL_FOREST_SPECIES_DATABASE.map((sp) => (
                  <option key={sp.id} value={sp.id} className="bg-slate-950 text-slate-200">
                    {sp.commonName} ({sp.scientificName}) - LAI {sp.defaultLAI}
                  </option>
                ))}
              </select>
            </ScientificTooltip>

            <div className="text-[8px] text-slate-400 italic mt-0.5 flex justify-between">
              <span>{selectedSpecies.family} · {selectedSpecies.typology}</span>
              <span className="text-emerald-400 font-semibold">{selectedSpecies.foliageRetention}</span>
            </div>
          </div>

          {/* Cuadrícula de Métricas Clave Específicas por Metro Cuadrado */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Tasa Anual Específica por m² */}
            <ScientificTooltip
              position="left"
              width="w-[300px]"
              content="Capacidad anual específica de remoción neta de NO2 por cada metro cuadrado de fachada vertical: F_d = v_d · [NO2] integrado a lo largo de 8760 horas/año. Considera la fotosíntesis y el balance estomático diario continuo."
            >
              <div className="bg-black/50 p-2 border border-emerald-800/60 cursor-help">
                <div className="text-[7.5px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>Remoción Anual</span>
                  <span className="text-emerald-400 font-mono">g/m²·año</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                  {activeMetrics.specificCapacity.annualRemovalG_m2_year}
                  <span className="text-[9px] text-slate-400 font-normal ml-1">g/m²·a</span>
                </div>
                <div className="text-[7.5px] text-slate-500 font-mono mt-0.5">
                  ≈ {activeMetrics.specificCapacity.annualRemovalKg_per_100m2_year} kg/año por 100m²
                </div>
              </div>
            </ScientificTooltip>

            {/* Tasa Diaria Específica por m² */}
            <ScientificTooltip
              position="left"
              width="w-[300px]"
              content="Tasa diaria de captación foliar por metro cuadrado bajo las condiciones meteorológicas y de contaminación actuales de Málaga (Temperatura, PAR, Humedad Relativa y concentración de NO2 ambiental)."
            >
              <div className="bg-black/50 p-2 border border-emerald-800/60 cursor-help">
                <div className="text-[7.5px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>Captación Diaria</span>
                  <span className="text-cyan-400 font-mono">mg/m²·día</span>
                </div>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                  {activeMetrics.specificCapacity.dailyRemovalMg_m2_day}
                  <span className="text-[9px] text-slate-400 font-normal ml-1">mg/m²·d</span>
                </div>
                <div className="text-[7.5px] text-slate-500 font-mono mt-0.5">
                  Flujo: {activeMetrics.specificCapacity.instantaneousFlux_ug_m2_s} µg/(m²·s)
                </div>
              </div>
            </ScientificTooltip>
          </div>

          {/* Segunda Fila de Parámetros Físicos: Vd y Resistencias */}
          <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
            {/* Velocidad de Deposición vd */}
            <ScientificTooltip
              position="top"
              width="w-[280px]"
              content="Velocidad de deposición seca v_d = 1 / (R_a + R_b + R_c) específica en la capa límite de fachada. Representa la velocidad convectiva-difusiva neta con la que las moléculas de NO2 penetran en el manto vegetal vertical."
            >
              <div className="bg-slate-950/80 p-1.5 border border-slate-800 cursor-help">
                <div className="text-slate-400 text-[7px] uppercase">v_d Deposición</div>
                <div className="text-emerald-400 font-bold text-[10px] mt-0.5">
                  {activeMetrics.effectiveVd_cm_s} <span className="text-[7.5px] text-slate-500">cm/s</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Resistencia Estomática Rs */}
            <ScientificTooltip
              position="top"
              width="w-[280px]"
              content="Resistencia estomática R_s calculada según Wesely (1989): R_s = (r_s,min · f_PAR · f_Temp · f_RH) / LAI. Control fisiológico de la apertura del poro estomático."
            >
              <div className="bg-slate-950/80 p-1.5 border border-slate-800 cursor-help">
                <div className="text-slate-400 text-[7px] uppercase">R_s Estomática</div>
                <div className="text-amber-400 font-bold text-[10px] mt-0.5">
                  {activeMetrics.resistances.rs_s_m} <span className="text-[7.5px] text-slate-500">s/m</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Resistencia Canópica Rc */}
            <ScientificTooltip
              position="top"
              width="w-[280px]"
              content="Resistencia superficial total de dosel vertical R_c = (1/R_s + 1/R_mes + 1/R_cut)^(-1). Acopla la absorción en cutícula foliar y la disolución mesofílica apoplástica en el tejido vegetal."
            >
              <div className="bg-slate-950/80 p-1.5 border border-slate-800 cursor-help">
                <div className="text-slate-400 text-[7px] uppercase">R_c Canópica</div>
                <div className="text-purple-400 font-bold text-[10px] mt-0.5">
                  {activeMetrics.resistances.rc_s_m} <span className="text-[7.5px] text-slate-500">s/m</span>
                </div>
              </div>
            </ScientificTooltip>
          </div>

          {/* Asimetría del Cañón Urbano: Pared Sotavento vs Barlovento (Pugh et al. 2012) */}
          <div className="bg-slate-950/90 p-2 border border-emerald-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-[8px]">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <Compass className="w-2.5 h-2.5 text-cyan-400" />
                <span>Asimetría en Cañón (Vórtice Oke 1988)</span>
              </span>
              <span className="font-mono text-cyan-400 text-[7.5px]">
                Factor Sotavento: ×{activeMetrics.canyonAsymmetry.vortexConcentrationFactor}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[7.5px] font-mono">
              <ScientificTooltip
                position="top"
                width="w-[280px]"
                content="Pared de Sotavento (Leeward Wall): El vórtice de recirculación arrastra y atrapa las emisiones vehiculares ascendiendo por este paramento, donde la concentración es hasta 42% superior, multiplicando la remoción foliar por m² (Pugh et al. 2012)."
              >
                <div className="bg-emerald-950/40 p-1.5 border border-emerald-700/50 cursor-help">
                  <div className="text-slate-400 text-[7px] uppercase">Pared de Sotavento</div>
                  <div className="text-emerald-300 font-bold text-[9px] mt-0.5">
                    {activeMetrics.canyonAsymmetry.leewardAnnualRemovalG_m2_year} g/m²·a
                  </div>
                  <div className="text-slate-500 text-[6.5px]">Máxima concentración por vórtice</div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                position="top"
                width="w-[280px]"
                content="Pared de Barlovento (Windward Wall): Recibe la corriente de descenso de aire más limpio desde la parte superior del dosel urbano, con un gradiente de concentración menor."
              >
                <div className="bg-slate-900/60 p-1.5 border border-slate-800 cursor-help">
                  <div className="text-slate-400 text-[7px] uppercase">Pared de Barlovento</div>
                  <div className="text-slate-300 font-bold text-[9px] mt-0.5">
                    {activeMetrics.canyonAsymmetry.windwardAnnualRemovalG_m2_year} g/m²·a
                  </div>
                  <div className="text-slate-500 text-[6.5px]">Flujo descendente ventilado</div>
                </div>
              </ScientificTooltip>
            </div>
          </div>

          {/* Comparativa con Árboles Urbanos y No-Bloqueo de Ventilación */}
          <div className="bg-black/40 p-2 border border-emerald-950 text-[8px] flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold text-slate-200">Ventaja Aerodinámica en Cañones Estrechos:</span>
              <p className="text-slate-400 mt-0.5 text-[7.5px]">
                A diferencia del arbolado de alineación con copa densa (que tapona el cañón si H/W &gt; 1.2), el bosque vertical se adosa al paramento sin reducir la sección de ventilación del vórtice, rindiendo <strong className="text-emerald-300">+{activeMetrics.comparisonWithTrees.relativeAdvantagePct}%</strong> de captación neta sin penalizar la dispersión.
              </p>
            </div>
          </div>

          {/* Botón para alternar ranking comparativo de especies */}
          <div className="pt-0.5">
            <button
              onClick={() => setShowAllSpeciesRanking(!showAllSpeciesRanking)}
              className="w-full py-1 px-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1">
                <Sliders className="w-2.5 h-2.5 text-emerald-400" />
                <span>Comparativa Multiespecie ({VERTICAL_FOREST_SPECIES_DATABASE.length} taxones)</span>
              </span>
              <span>{showAllSpeciesRanking ? '▲ Ocultar' : '▼ Ver Ranking'}</span>
            </button>
          </div>

          {/* Ranking comparativo desplegable de todas las especies */}
          {showAllSpeciesRanking && (
            <div className="space-y-1.5 pt-1 border-t border-emerald-900/40">
              <div className="text-[7.5px] uppercase tracking-wider text-slate-400 font-mono flex justify-between">
                <span>Especie (LAI)</span>
                <span>Capacidad Anual (g/m²·año)</span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {allSpeciesResults.map((res) => {
                  const maxAnnual = 28.0; // Escala máxima para barra proporcional
                  const pct = Math.min(100, Math.max(10, (res.specificCapacity.annualRemovalG_m2_year / maxAnnual) * 100));
                  const isSelected = res.species.id === selectedSpeciesId;

                  return (
                    <ScientificTooltip key={res.species.id} content={`Seleccionar ${res.species.commonName} (${res.species.scientificName}): LAI ${res.species.defaultLAI}, captación ${res.specificCapacity.annualRemovalG_m2_year} g/m²·año.`}>
                      <div 
                        onClick={() => setSelectedSpeciesId(res.species.id)}
                        className={`p-1.5 border transition-all cursor-pointer text-[7.5px] ${
                          isSelected 
                            ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' 
                            : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold truncate max-w-[170px]">
                            {res.species.commonName}
                          </span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {res.specificCapacity.annualRemovalG_m2_year} g/m²·a
                          </span>
                        </div>

                        {/* Barra de progreso proporcional */}
                        <div className="w-full bg-slate-900 h-1 rounded-none overflow-hidden flex">
                          <div 
                            className={`h-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-700'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[6.5px] text-slate-500 font-mono mt-0.5">
                          <span>LAI: {res.species.defaultLAI} · v_d: {res.effectiveVd_cm_s} cm/s</span>
                          <span>Enfriamiento: -{res.species.summerCoolingC}°C</span>
                        </div>
                      </div>
                    </ScientificTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enlace contextual a los diagramas explicativos */}
          {onOpenCanyonDiagram && (
            <div className="pt-1">
              <ScientificTooltip content="Abrir diagrama físico 2D del cañón urbano con perfiles de velocidad del viento, recirculación de vórtice (Oke 1987) y circuito de resistencias de deposición seca (Wesely 1989).">
                <button
                  onClick={onOpenCanyonDiagram}
                  className="w-full py-1 px-2 bg-black/60 hover:bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-[8px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Ver Sección 2D Cañón Urbano & Vórtice</span>
                </button>
              </ScientificTooltip>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
