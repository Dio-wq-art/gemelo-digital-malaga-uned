import React, { useState } from 'react';
import { Sun, ShieldAlert, Wind, Layers, ArrowUpRight, Flame, Atom, Compass, Activity, Eye, FileText, Droplets, Sparkles, Filter } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SaharaDustTransportDiagram } from "./SaharaDustTransportDiagram";
import { analyzeSaharaDustAdvection, DustReanalysisResult } from '../lib/saharaDustReanalysis';

export interface SaharaDustModalProps {
  isOpen: boolean;
  onClose: () => void;
  dustConcentrationUgm3: number;
  aod550nm: number;
  tempC: number;
  relHumidityPct: number;
  windSpeedKmh: number;
}

export function SaharaDustModal({
  isOpen,
  onClose,
  dustConcentrationUgm3,
  aod550nm,
  tempC,
  relHumidityPct,
  windSpeedKmh
}: SaharaDustModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'mineralogy' | 'optics_sds' | 'heterogeneous_chem'>('overview');

  if (!isOpen) return null;

  const result: DustReanalysisResult = analyzeSaharaDustAdvection({
    dustConcentrationUgm3,
    aod550nm,
    tempC,
    relHumidityPct,
    windSpeedKmh
  });

  return (
    <DraggableWindow
      title="REANÁLISIS DE CALIMA Y POLVO SAHARIANO (COPERNICUS CAMS / WMO SDS-WAS)"
      onClose={onClose}
      className="w-[880px] max-h-[88vh]"
      icon={<Sun className="w-4 h-4 text-amber-400" />}
    >
      <div className="p-4 space-y-4 text-xs font-mono text-slate-200">
        {/* Banner Alert */}
        <ScientificTooltip position="bottom" width="w-[360px]" content="Clasificación del episodio de advección sahariana según concentración de masa particulada mineral y espesor óptico de aerosoles (CAMS AOD 550nm) e inmersión en la Capa Sahariana de Aire (SAL).">
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded flex items-center justify-between cursor-help">
            <div className="flex items-center gap-3">
              <Sun className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              <div>
                <div className="font-bold text-amber-300 text-sm">Estado de Advección Sahariana • Málaga & Alborán</div>
                <div className="text-[11px] text-slate-300">{result.airQualityImpactCategory}</div>
              </div>
            </div>
            <div className="text-right border-l border-amber-800/60 pl-3 hidden sm:block">
              <span className="text-[9px] text-amber-400 block uppercase">Capa de Transporte</span>
              <span className="text-[11px] font-bold text-slate-200">{result.transportElevationLayerM}</span>
            </div>
          </div>
        </ScientificTooltip>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Resumen de diagnóstico de advección sahariana, categoría de impacto en la calidad del aire y diagrama 3D del perfil vertical de la pluma.">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-900/80 text-amber-200 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Resumen diagnóstico de calima y polvo sahariano"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Resumen Diagnóstico</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Matriz de composición mineralógica de la masa de polvo sahariano (cuarzo SiO2, calcita CaCO3, ilita, esmectita e hidróxidos de hierro Fe2O3).">
            <button
              onClick={() => setActiveTab('mineralogy')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mineralogy'
                  ? 'bg-amber-900/80 text-amber-200 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Ver composición de la matriz mineralógica del polvo"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Matriz Mineralógica</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[280px]" content="Propiedades ópticas radiativas (AOD 550nm, exponente de Ångström α, albedo de dispersión simple SSA) y red WMO SDS-WAS.">
            <button
              onClick={() => setActiveTab('optics_sds')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'optics_sds'
                  ? 'bg-amber-900/80 text-amber-200 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Ver propiedades ópticas AOD y modelo WMO SDS-WAS"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Óptica & SDS-WAS</span>
            </button>
          </ScientificTooltip>

          <button
            onClick={() => setActiveTab('heterogeneous_chem')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'heterogeneous_chem'
                ? 'bg-amber-900/80 text-amber-200 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-amber-400" />
            <span>Química Heterogénea HONO</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <SaharaDustTransportDiagram />

            {/* Core Dust Indicators */}
            <div className="grid grid-cols-4 gap-3">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Masa total de mineral de polvo en suspensión por metro cúbico expresada en µg/m³.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Carga Másica Polvo</span>
                  <span className="text-base font-bold text-amber-400">{result.dustMassLoadingUgm3} µg/m³</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Coeficiente de extinción óptica alpha_ext (Mm⁻¹) en la capa límite.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Extinción Óptica α_ext</span>
                  <span className="text-base font-bold text-cyan-400">{result.extinctionCoefficientMm1} Mm⁻¹</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Porcentaje de radiación solar UV atenuada por scattering y absorción mineral.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Atenuación Solar UV</span>
                  <span className="text-base font-bold text-yellow-400">{result.uvSolarAttenuationPct}%</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Tasa heterogénea k_het para la reacción de NO2 sobre la superficie de aluminosilicatos generando HONO fotoquímico.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Tasa Heterogénea k_het</span>
                  <span className="text-base font-bold text-purple-400">{result.heterogeneousReactionRateS1} s⁻¹</span>
                </div>
              </ScientificTooltip>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <ScientificTooltip position="top" width="w-[340px]" content="Exponente de Ångström (440-870nm) e índice de refracción efectivo de los esferoides minerales en el Mar de Alborán.">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
                  <span className="text-amber-300 font-bold block border-b border-slate-800 pb-1">Microfísica Óptica de Aerosoles</span>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between"><span>Exponente de Ångström α (440-870):</span> <span className="font-bold text-amber-400">{result.angstromExponent} (Aerosol Grueso)</span></div>
                    <div className="flex justify-between"><span>Albedo Dispersión Simple (SSA₅₅₀):</span> <span className="font-bold text-amber-400">{result.singleScatteringAlbedo550}</span></div>
                    <div className="flex justify-between"><span>Factor Asimetría g:</span> <span className="font-bold text-slate-200">{result.asymmetryParameterG}</span></div>
                  </div>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="top" width="w-[340px]" content="Impacto biogeoquímico de la deposición seca de hierro bioasimilable en la superficie marina de la Bahía de Málaga.">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
                  <span className="text-amber-300 font-bold block border-b border-slate-800 pb-1">Deposición de Fe Bioasimilable al Mar</span>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between"><span>Flujo de Hierro Soluble Fe(II/III):</span> <span className="font-bold text-emerald-400">{result.ironSolubleFluxUgm2Day} µg/m²/día</span></div>
                    <div className="flex justify-between"><span>Núcleos Condensación Nubes (CCN):</span> <span className="font-bold text-cyan-400">{result.cloudCondensationNucleiCCN} cm⁻³</span></div>
                    <div className="flex justify-between"><span>Coef. Captura N₂O₅ (γ_N2O5):</span> <span className="font-bold text-purple-400">{result.n2o5UptakeCoefficient}</span></div>
                  </div>
                </div>
              </ScientificTooltip>
            </div>

            {/* Recommendation Box */}
            <ScientificTooltip position="top" width="w-[320px]" content="Protocolo de salud pública y contingencia atmosférica conforme a las Guías de Calidad del Aire de la OMS (2021) y el Plan de Actuación ante Episodios de Intrusión de la Junta de Andalucía.">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1 cursor-help">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Recomendación Sanitaria y de Mitigación</span>
                <p className="text-[11px] text-slate-200">{result.mitigationRecommendation}</p>
              </div>
            </ScientificTooltip>
          </div>
        )}

        {/* TAB 2: MINERALOGY */}
        {activeTab === 'mineralogy' && (
          <div className="space-y-3">
            <div className="text-slate-300 text-[11px] leading-relaxed">
              Fracción mineralógica detallada de la masa de polvo sahariano advectada desde el desierto de Argelia y el Erg Chebbi hacia la cuenca del Guadalhorce y la Bahía de Málaga:
            </div>

            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2">Especie Mineral</th>
                    <th className="p-2">Fórmula</th>
                    <th className="p-2 text-right">Masa (% peso)</th>
                    <th className="p-2 text-center">Índice Refracción</th>
                    <th className="p-2">Función en el Gemelo Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {result.mineralMatrix.map((min, idx) => (
                    <tr key={`mineral-${min.name || idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 font-bold text-amber-300">{min.name}</td>
                      <td className="p-2 font-mono text-cyan-300">{min.chemicalFormula}</td>
                      <td className="p-2 text-right font-bold text-emerald-400">{min.weightPct}%</td>
                      <td className="p-2 text-center font-mono text-slate-300 text-[10px]">{min.refractiveIndex}</td>
                      <td className="p-2 text-slate-300 text-[10px]">{min.roleDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-[10.5px] text-slate-300">
              <span className="font-bold text-amber-400">Absorción por Hematita (Fe₂O₃):</span> La hematita presente en un 4.4% determina la absorción selectiva de onda corta en el rango UV-azul, calentando localmente la Capa Sahariana de Aire (SAL) e invirtiendo el gradiente térmico vertical.
            </div>
          </div>
        )}

        {/* TAB 3: OPTICS & SDS-WAS */}
        {activeTab === 'optics_sds' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                <span className="text-amber-300 font-bold block border-b border-slate-800 pb-1">Red WMO SDS-WAS & SKIRON</span>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between"><span>Aerosol Optical Depth (AOD₅₅₀):</span> <span className="font-bold text-amber-400">{aod550nm}</span></div>
                  <div className="flex justify-between"><span>Exponente de Ångström α:</span> <span className="font-bold text-amber-400">{result.angstromExponent}</span></div>
                  <div className="flex justify-between"><span>Capa de Inmersión Sahariana:</span> <span className="font-bold text-slate-200">{result.transportElevationLayerM}</span></div>
                  <div className="flex justify-between"><span>Transmisión Atmosférica:</span> <span className="font-bold text-emerald-400">{(100 - result.uvSolarAttenuationPct).toFixed(1)}%</span></div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                <span className="text-cyan-300 font-bold block border-b border-slate-800 pb-1">Efectos Biogeoquímicos Marinos</span>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between"><span>Flujo Fe Soluble (Mar Alborán):</span> <span className="font-bold text-emerald-400">{result.ironSolubleFluxUgm2Day} µg/m²/día</span></div>
                  <div className="flex justify-between"><span>Activación CCN (S=0.2%):</span> <span className="font-bold text-cyan-400">{result.cloudCondensationNucleiCCN} cm⁻³</span></div>
                  <div className="flex justify-between"><span>Captura Heterogénea N₂O₅:</span> <span className="font-bold text-purple-400">{result.n2o5UptakeCoefficient}</span></div>
                  <div className="flex justify-between"><span>Velocidad de Deposición Seca:</span> <span className="font-bold text-slate-200">0.8 cm/s</span></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
              <span className="text-amber-300 font-bold block">Discriminación Físico-Óptica de Partículas</span>
              <p className="text-[10.5px] leading-relaxed text-slate-300">
                El Exponente de Ångström α (440-870 nm) = {result.angstromExponent} confirma inequívocamente la dominancia de partículas minerales gruesas de origen terrestre (diámetro modal Dₚ ~ 2.5 µm), diferenciando el episodio de los aerosoles antropogénicos finos derivados del tráfico urbano (α &gt; 1.2).
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: HETEROGENEOUS CHEM */}
        {activeTab === 'heterogeneous_chem' && (
          <div className="space-y-3">
            <ScientificTooltip position="top" width="w-[340px]" content="Química heterogénea interfacial sobre aerosoles minerales (Ammann et al. 1998): La quimisorción superficial de 2 NO2 + H2O → HONO + HNO3 genera ácido nitroso gaseoso que tras el orto solar se fotoliza HONO + hν → NO + OH•, incrementando drásticamente el pool de radicales oxidantes urbanos.">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 cursor-help">
                <div className="text-amber-300 font-bold flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span>Química Heterogénea Secundaria sobre Superficie Mineral</span>
                  <span className="text-cyan-400">Producción HONO: +{result.honoSecondaryProductionPpbh} ppb/h</span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-300">
                  El polvo mineral sahariano actúa no solo como un extintor óptico que suprime la fotólisis j(NO2), sino también como una superficie sintética para reacciones fotoquímicas heterogéneas. La adsorción de NO2 sobre aluminosilicatos en presencia de humedad relativa (RH = {relHumidityPct}%) produce Ácido Nitroso (HONO), el cual se fotoliza al amanecer liberando impulsos de radical OH•.
                </p>
              </div>
            </ScientificTooltip>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-center space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Superficie Específica S_dust</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {((6 * (dustConcentrationUgm3 * 1e-6)) / (2.65e3 * 2.5e-6)).toExponential(2)} m²/m³
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-center space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Coeficiente Acomodación γ</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {(1.2e-4 * (1 + 0.005 * relHumidityPct)).toExponential(2)}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Velocidad Térmica v_bar</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {Math.round(Math.sqrt((8 * 8.314 * (tempC + 273.15)) / (Math.PI * 0.046)))} m/s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
