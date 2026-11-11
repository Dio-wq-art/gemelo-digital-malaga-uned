import React, { useState, useMemo } from 'react';
import { 
  Leaf, 
  Sun, 
  Droplets, 
  Wind, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  CloudRain, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Trees, 
  Zap, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp,
  FileSpreadsheet,
  FileJson,
  FileDown,
  Flame,
  FlaskConical,
  Download
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { downloadVectorSvg } from '../lib/vectorExporter';

export interface TreePhysiologyStomataDiagramProps {
  currentTempC?: number;
  currentRhPct?: number;
  currentParWm2?: number;
  currentNO2Ugm3?: number;
  currentO3Ugm3?: number;
  currentPM25Ugm3?: number;
  speciesName?: string;
  isTerralActive?: boolean;
  vpdKpa?: number;
  abaHormoneSignalPct?: number;
  apoplasticAscorbateSaturationPct?: number;
  ozoneOxidativeStressIndex?: number;
}

export const TreePhysiologyStomataDiagram: React.FC<TreePhysiologyStomataDiagramProps> = ({
  currentTempC = 26.5,
  currentRhPct = 58.0,
  currentParWm2 = 620,
  currentNO2Ugm3 = 38.0,
  currentO3Ugm3 = 64.0,
  currentPM25Ugm3 = 14.5,
  speciesName = 'Plátano de Sombra (Platanus × hispanica)',
  isTerralActive: incomingIsTerral = false,
  vpdKpa: incomingVpd = 1.45,
  abaHormoneSignalPct: incomingABA = 15,
  apoplasticAscorbateSaturationPct: incomingAscorbateSat = 52,
  ozoneOxidativeStressIndex: incomingOxStress = 18
}) => {
  // Estados de control interactivo
  const [viewLevel, setViewLevel] = useState<'whole_tree' | 'leaf_cross_section' | 'stomata_ultrastructure'>('stomata_ultrastructure');
  const [selectedPollutant, setSelectedPollutant] = useState<'ALL' | 'NO2' | 'O3' | 'PM25' | 'SO2'>('ALL');
  const [activeScenario, setActiveScenario] = useState<'LIVE' | 'TERRAL_MALAGA' | 'OZONE_PEAK' | 'MEDITERRANEAN_STANDARD'>('LIVE');
  const [manualApertureOverride, setManualApertureOverride] = useState<number | null>(null);
  const [isFlowAnimated, setIsFlowAnimated] = useState<boolean>(true);
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [activeProcessTab, setActiveProcessTab] = useState<'intake' | 'mesophyll_chemistry' | 'foyer_halliwell_asada' | 'terral_aba_xylem' | 'elimination'>('intake');

  // Condiciones ambientales y fito-bioquímicas según el escenario activo
  const effectiveTempC = activeScenario === 'TERRAL_MALAGA' ? 39.5 : activeScenario === 'OZONE_PEAK' ? 32.5 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 24.8 : currentTempC;
  const effectiveRhPct = activeScenario === 'TERRAL_MALAGA' ? 16.0 : activeScenario === 'OZONE_PEAK' ? 38.0 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 68.0 : currentRhPct;
  const effectiveParWm2 = activeScenario === 'TERRAL_MALAGA' ? 920 : activeScenario === 'OZONE_PEAK' ? 840 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 610 : currentParWm2;
  const effectiveNO2Ugm3 = activeScenario === 'TERRAL_MALAGA' ? 42.0 : activeScenario === 'OZONE_PEAK' ? 35.0 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 28.0 : currentNO2Ugm3;
  const effectiveO3Ugm3 = activeScenario === 'TERRAL_MALAGA' ? 82.0 : activeScenario === 'OZONE_PEAK' ? 138.0 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 46.0 : currentO3Ugm3;
  const effectivePM25Ugm3 = activeScenario === 'TERRAL_MALAGA' ? 26.0 : activeScenario === 'OZONE_PEAK' ? 16.0 : activeScenario === 'MEDITERRANEAN_STANDARD' ? 12.0 : currentPM25Ugm3;

  // 1. Presión de vapor de saturación de Tetens y VPD
  const esatKpa = 0.61078 * Math.exp((17.27 * effectiveTempC) / (effectiveTempC + 237.3));
  const eactKpa = esatKpa * (effectiveRhPct / 100.0);
  const calculatedVpdKpa = parseFloat(Math.max(0.05, esatKpa - eactKpa).toFixed(2));
  const effectiveVpdKpa = activeScenario === 'LIVE' ? (incomingVpd || calculatedVpdKpa) : calculatedVpdKpa;

  // 2. Terral en Málaga
  const isTerralActive = activeScenario === 'TERRAL_MALAGA' ? true : activeScenario === 'LIVE' ? (incomingIsTerral || ((effectiveTempC >= 31.0 && effectiveRhPct <= 35.0) || effectiveVpdKpa >= 2.6)) : false;
  const terralSeverityPct = isTerralActive
    ? Math.min(100, Math.max(0, Math.round(((effectiveTempC - 28) * 4.2 + (40 - effectiveRhPct) * 1.6 + (effectiveVpdKpa - 1.8) * 18))))
    : 0;

  // 3. Señalización hormonal por Ácido Abscísico (ABA)
  const calculatedABA = Math.min(100, Math.max(0, Math.round(((effectiveVpdKpa - 1.2) / 2.6) * 100)));
  const effectiveABAPct = activeScenario === 'TERRAL_MALAGA' ? 95 : activeScenario === 'LIVE' ? (incomingABA || calculatedABA) : calculatedABA;
  const abaClosureMultiplier = Math.max(0.06, 1.0 - (effectiveABAPct / 100.0) * 0.86);

  // 4. Ciclo Foyer-Halliwell-Asada & Saturación Oxidativa APX
  const apxVmax = 72.0;
  const kmO3 = 30.0;
  const calculatedAscSat = Math.min(100, Math.max(0, Math.round((effectiveO3Ugm3 / (effectiveO3Ugm3 + kmO3 * 0.85)) * 100 * (effectiveO3Ugm3 > apxVmax ? 1.2 : 0.82))));
  const effectiveAscorbateSatPct = activeScenario === 'OZONE_PEAK' ? 100 : activeScenario === 'LIVE' ? (incomingAscorbateSat || calculatedAscSat) : calculatedAscSat;

  const o3Excess = Math.max(0, effectiveO3Ugm3 - apxVmax);
  const calculatedOxStress = Math.min(100, Math.max(0, Math.round((o3Excess / 75.0) * 100 + (effectiveAscorbateSatPct > 80 ? 15 : 0))));
  const effectiveOxidativeStressIndex = activeScenario === 'OZONE_PEAK' ? 88 : activeScenario === 'LIVE' ? (incomingOxStress || calculatedOxStress) : calculatedOxStress;
  const effectiveROSGeneration = parseFloat((effectiveO3Ugm3 * 0.014 * (1.0 + effectiveOxidativeStressIndex / 100.0)).toFixed(3));

  // 5. Riesgo de Cavitación del Xilema
  const isMedSclerophyll = speciesName.toLowerCase().includes('olivo') || speciesName.toLowerCase().includes('palmera') || speciesName.toLowerCase().includes('ciprés') || speciesName.toLowerCase().includes('adelfa');
  const d0_vpd = isMedSclerophyll ? 2.45 : 1.40;
  const fVpd = 1.0 / (1.0 + (effectiveVpdKpa / d0_vpd));
  const rawCavitationTension = effectiveVpdKpa * (isMedSclerophyll ? 1.05 : 1.75);
  const xylemCavitationRiskPct = Math.min(95, Math.max(2, Math.round(rawCavitationTension * 15)));

  // 6. Apertura natural vs manual
  const fPar = effectiveParWm2 / (effectiveParWm2 + 220.0);
  const tempDiff = Math.abs(effectiveTempC - 26.5);
  const fTemp = Math.max(0.15, 1.0 - (tempDiff * 0.038));
  const naturalAperture = Math.min(100, Math.max(5, Math.round(100 * fPar * fTemp * fVpd * abaClosureMultiplier)));
  
  const stomataAperturePct = manualApertureOverride !== null ? manualApertureOverride : naturalAperture;
  const apertureFactor = stomataAperturePct / 100.0;
  
  // Resistencia estomática R_st (s/cm): inversamente proporcional al poro
  const rStomataO3 = apertureFactor > 0.04 ? parseFloat((1.2 / apertureFactor).toFixed(2)) : 999.0;
  const rStomataNO2 = apertureFactor > 0.04 ? parseFloat((1.5 / apertureFactor).toFixed(2)) : 999.0;
  
  // Conductancia estomática de vapor de agua g_sw (mmol / m² s)
  const stomataConductanceGsw = parseFloat((apertureFactor * 320.0 * Math.max(0.2, fPar)).toFixed(1));

  // Tasa de transpiración foliar E (mmol H2O / m² s) acoplada al VPD
  const transpirationRate = parseFloat((stomataConductanceGsw * (effectiveVpdKpa / 101.3) * 10.0).toFixed(2));

  // Flujo de ingesta estomática (Ley de Fick): J = (C_atm - C_int) / (Ra + Rb + Rst)
  const rBoundary = 0.35;
  const fluxNO2_ug_m2_s = apertureFactor > 0.04 
    ? parseFloat((effectiveNO2Ugm3 / (rBoundary + rStomataNO2)).toFixed(2))
    : 0.06;
    
  const fluxO3_ug_m2_s = apertureFactor > 0.04 
    ? parseFloat((effectiveO3Ugm3 / (rBoundary + rStomataO3)).toFixed(2))
    : 0.09;

  // Adsorción en cutícula de PM2.5 (no estomática)
  const pmAdsorbedCuticle_ug_m2 = isRaining ? 1.2 : parseFloat((effectivePM25Ugm3 * 0.45).toFixed(2));
  const rainWashoffEfficiencyPct = isRaining ? 88.0 : 0.0;

  // Emisión térmica de BVOCs (Isopreno / Terpenos) (Guenther MEGAN)
  const bvocEmissionRate_ug_m2_h = apertureFactor > 0.08
    ? parseFloat((12.5 * Math.exp(0.09 * (effectiveTempC - 30.0)) * apertureFactor).toFixed(1))
    : 0.4;

  // Detoxificación de NO2: Conversión a aminoácidos (GS/GOGAT)
  const no2AssimilationEfficiencyPct = Math.min(96.0, 75.0 + apertureFactor * 18.0);

  // Exportación de balance fisiológico estomático y bioquímico (FAIR)
  const handleExportCsv = () => {
    const headers = [
      'especie_arbol',
      'escenario_activo',
      'temperatura_c',
      'humedad_relativa_pct',
      'vpd_kpa',
      'alerta_terral_malaga',
      'severidad_terral_pct',
      'senal_hormonal_aba_pct',
      'saturacion_ascorbato_apx_pct',
      'indice_estres_oxidativo_o3_pct',
      'generacion_ros_umol_m2_s',
      'riesgo_cavitacion_xilema_pct',
      'nivel_apertura_estoma_pct',
      'conductancia_estomatica_gsw_mmol_m2_s',
      'resistencia_estomatica_o3_s_cm',
      'resistencia_estomatica_no2_s_cm',
      'flujo_ingesta_no2_ug_m2_s',
      'flujo_ingesta_o3_ug_m2_s',
      'pm25_retenido_cuticula_ug_m2',
      'lavado_pluvial_lluvia_pct',
      'transpiracion_vapor_h2o_mmol_m2_s',
      'emision_termoprotectora_bvoc_ug_m2_h',
      'eficiencia_detoxificacion_no2_pct'
    ];
    const values = [
      `"${speciesName}"`,
      `"${activeScenario}"`,
      effectiveTempC,
      effectiveRhPct,
      effectiveVpdKpa,
      isTerralActive ? 'SI' : 'NO',
      terralSeverityPct,
      effectiveABAPct,
      effectiveAscorbateSatPct,
      effectiveOxidativeStressIndex,
      effectiveROSGeneration,
      xylemCavitationRiskPct,
      stomataAperturePct,
      stomataConductanceGsw,
      rStomataO3,
      rStomataNO2,
      fluxNO2_ug_m2_s,
      fluxO3_ug_m2_s,
      pmAdsorbedCuticle_ug_m2,
      rainWashoffEfficiencyPct,
      transpirationRate,
      bvocEmissionRate_ug_m2_h,
      no2AssimilationEfficiencyPct
    ];
    const csvContent = headers.join(',') + '\n' + values.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance_bioquimica_estomatica_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const data = {
      specie: speciesName,
      scenario: activeScenario,
      ambientConditions: {
        tempC: effectiveTempC,
        rhPct: effectiveRhPct,
        parWm2: effectiveParWm2,
        vpdKpa: effectiveVpdKpa,
        isTerralActive,
        terralSeverityPct,
        no2Ugm3: effectiveNO2Ugm3,
        o3Ugm3: effectiveO3Ugm3,
        pm25Ugm3: effectivePM25Ugm3
      },
      biochemistryAndStress: {
        abaHormoneSignalPct: effectiveABAPct,
        apoplasticAscorbateSaturationPct: effectiveAscorbateSatPct,
        ozoneOxidativeStressIndex: effectiveOxidativeStressIndex,
        rosGenerationUmolM2s: effectiveROSGeneration,
        xylemCavitationRiskPct
      },
      stomataPhysiology: {
        aperturePct: stomataAperturePct,
        gswMmolM2s: stomataConductanceGsw,
        rStomataO3_s_cm: rStomataO3,
        rStomataNO2_s_cm: rStomataNO2,
        transpirationH2O_mmol_m2_s: transpirationRate
      },
      fluxes: {
        intakeNO2_ug_m2_s: fluxNO2_ug_m2_s,
        intakeO3_ug_m2_s: fluxO3_ug_m2_s,
        cuticlePM25_ug_m2: pmAdsorbedCuticle_ug_m2,
        rainWashoffActive: isRaining,
        bvocEmission_ug_m2_h: bvocEmissionRate_ug_m2_h,
        no2ProteinAssimilationPct: no2AssimilationEfficiencyPct
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bioquimica_estomas_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    downloadVectorSvg('tree-physiology-svg', `fisiologia_estomatica_${speciesName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.svg`);
  };

  return (
    <div className="flex flex-col space-y-3 font-sans text-slate-200">

      {/* 0. Barra de Escenarios Bioclimáticos y Bioquímicos de Málaga */}
      <div className="bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
            <Flame className="w-4 h-4 text-amber-400" />
            Escenarios de Estrés Físico-Químico:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Telemetría Asimilada en Vivo: utiliza los valores físicos y químicos reales medidos en la calle de Málaga." position="bottom">
              <button
                onClick={() => {
                  setActiveScenario('LIVE');
                  setManualApertureOverride(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                  activeScenario === 'LIVE'
                    ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3 text-emerald-400" /> Telemetría en Vivo
              </button>
            </ScientificTooltip>

            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Brisa Marina Mediterránea Estándar (T=24.8°C, HR=68%, VPD=1.05 kPa, O3=46 µg/m³): Apertura estomática óptima, mínima señal hormonal de ABA y equilibrio redox de ascorbato." position="bottom">
              <button
                onClick={() => {
                  setActiveScenario('MEDITERRANEAN_STANDARD');
                  setManualApertureOverride(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                  activeScenario === 'MEDITERRANEAN_STANDARD'
                    ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplets className="w-3 h-3 text-sky-400" /> Brisa Marina Normal
              </button>
            </ScientificTooltip>

            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Episodio de Terral Extremo en Málaga (T=39.5°C, HR=16%, VPD=4.2 kPa): Viento catabático del NW subsidente, calentamiento adiabático seco (+1°C/100m). Activa señal hormonal de ABA al 95%, fuerza salida masiva de K+ y cierre forzado para evitar embolia del xilema." position="bottom">
              <button
                onClick={() => {
                  setActiveScenario('TERRAL_MALAGA');
                  setManualApertureOverride(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                  activeScenario === 'TERRAL_MALAGA'
                    ? 'bg-red-600 border-red-400 text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-red-600/50'
                }`}
              >
                <Flame className="w-3 h-3 text-red-400" /> Episodio de Terral (Málaga)
              </button>
            </ScientificTooltip>

            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Pico Crítico de Ozono Fotoquímico (O3=138 µg/m³): Saturación completa (100%) del pool apoplástico de ascorbato peroxidasa (APX). Disparo de ROS (OH•, H2O2) y peroxidación de lípidos de membrana de células oclusivas." position="bottom">
              <button
                onClick={() => {
                  setActiveScenario('OZONE_PEAK');
                  setManualApertureOverride(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                  activeScenario === 'OZONE_PEAK'
                    ? 'bg-pink-600 border-pink-400 text-white font-bold shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-pink-600/50'
                }`}
              >
                <Zap className="w-3 h-3 text-pink-400" /> Pico Crítico de Ozono (O₃)
              </button>
            </ScientificTooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Exportar diagrama fisiológico y ultraestructura estomática en formato vectorial SVG de alta resolución para publicaciones Q1." position="left">
            <button
              onClick={handleExportSvg}
              className="p-1.5 rounded bg-slate-900 border border-emerald-800 hover:bg-slate-800 text-emerald-300 flex items-center gap-1 text-[11px] font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> SVG Tesis
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Exportar auditoría estequiométrica foliar y cinética en CSV para cálculo en R / Python." position="left">
            <button
              onClick={handleExportCsv}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> CSV
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Exportar estructura JSON de biometría y bioquímica foliar." position="left">
            <button
              onClick={handleExportJson}
              className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" /> JSON
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* 0.1. Matriz de Indicadores de Estrés Extremo y Biofísica en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* VPD */}
        <div className={`p-2 rounded border ${effectiveVpdKpa > 2.5 ? 'bg-red-950/40 border-red-800/80' : effectiveVpdKpa > 1.5 ? 'bg-amber-950/40 border-amber-800/80' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">VPD (Déficit Vapor)</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Déficit de Presión de Vapor calculado por ecuación de Tetens: esat(T) - eact(T). Mayor a 2.5 kPa genera estrés hídrico agudo." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-cyan-300">{effectiveVpdKpa} <span className="text-[10px] font-normal text-slate-400">kPa</span></span>
            <span className={`text-[10px] font-semibold ${effectiveVpdKpa > 2.5 ? 'text-red-400 font-bold' : effectiveVpdKpa > 1.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {effectiveVpdKpa > 2.5 ? 'Extremo' : effectiveVpdKpa > 1.5 ? 'Moderado' : 'Óptimo'}
            </span>
          </div>
        </div>

        {/* Terral Málaga */}
        <div className={`p-2 rounded border ${isTerralActive ? 'bg-red-950/50 border-red-700' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">Terral Málaga</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Viento catabático de la cuenca del Guadalhorce y Montes de Málaga. Causa compresión adiabática seca con T>31°C y HR<35%." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`font-mono text-base font-bold ${isTerralActive ? 'text-red-400' : 'text-slate-300'}`}>
              {isTerralActive ? 'ACTIVO' : 'Inactivo'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{terralSeverityPct}% sev.</span>
          </div>
        </div>

        {/* Señal ABA */}
        <div className="p-2 rounded border bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">Hormona ABA</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Ácido Abscísico: fitohormona sintetizada en raíces y mesófilo ante déficit hídrico. Activa canales aniónicos SLAC1 provocando salida de K+ y cierre del poro." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-amber-300">{effectiveABAPct}%</span>
            <span className="text-[10px] text-slate-400">Cierre estom.</span>
          </div>
        </div>

        {/* Saturación Ascorbato APX */}
        <div className={`p-2 rounded border ${effectiveAscorbateSatPct > 80 ? 'bg-pink-950/40 border-pink-800/80' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">Saturación APX</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Saturación del pool de ascorbato apoplástico y enzima Ascorbato Peroxidasa (APX). Por encima del 80% el ozono desborda la detoxificación." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-pink-300">{effectiveAscorbateSatPct}%</span>
            <span className="text-[10px] text-slate-400">Pool O₃</span>
          </div>
        </div>

        {/* Estrés Oxidativo & ROS */}
        <div className={`p-2 rounded border ${effectiveOxidativeStressIndex > 60 ? 'bg-purple-950/50 border-purple-700' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">Estrés Oxidativo</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Índice de estrés oxidativo celular por peroxidación lipídica inducida por especies reactivas de oxígeno (ROS: OH•, O2•-, H2O2)." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-purple-300">{effectiveOxidativeStressIndex}%</span>
            <span className="text-[10px] text-slate-400 font-mono">{effectiveROSGeneration} ROS</span>
          </div>
        </div>

        {/* Riesgo Cavitación Xilema */}
        <div className={`p-2 rounded border ${xylemCavitationRiskPct > 50 ? 'bg-amber-950/40 border-amber-800' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">Xilema Cavitación</span>
            <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Riesgo de embolia acústica en los vasos conductores de xilema por tensión excesiva en la columna hídrica bajo alta demanda evaporativa." position="bottom">
              <Info className="w-3 h-3 text-slate-500" />
            </ScientificTooltip>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-blue-300">{xylemCavitationRiskPct}%</span>
            <span className={`text-[10px] font-medium ${xylemCavitationRiskPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {xylemCavitationRiskPct > 50 ? 'Riesgo Alto' : 'Seguro'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 1. Barra de Controles Superiores & Selector de Escala Anatómica */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Selector de Escala de Visualización */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Escala 1: Arquitectura de todo el árbol (dosel, copa, hojas, corteza y rizosfera/raíces) y sus flujos globales de intercambio." position="bottom">
            <button
              onClick={() => setViewLevel('whole_tree')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                viewLevel === 'whole_tree'
                  ? 'bg-emerald-600 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Trees className="w-3.5 h-3.5" /> Árbol Completo
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Escala 2: Sección transversal histológica de la hoja (cutícula cérea, tricomas, epidermis, mesófilo en empalizada y lagunar, haces vasculares y estomas)." position="bottom">
            <button
              onClick={() => setViewLevel('leaf_cross_section')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                viewLevel === 'leaf_cross_section'
                  ? 'bg-teal-600 text-white font-bold shadow-[0_0_8px_rgba(20,184,166,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Corte Histológico de la Hoja
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Escala 3: Ultraestructura macromolecular del estoma (ostiolo, células oclusivas/de guarda, cloroplastos, vacuolas osmorreguladoras y canales de K+)." position="bottom">
            <button
              onClick={() => setViewLevel('stomata_ultrastructure')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                viewLevel === 'stomata_ultrastructure'
                  ? 'bg-cyan-600 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Ultraestructura del Estoma (Ostiolo)
            </button>
          </ScientificTooltip>
        </div>

        {/* Selector de Contaminante Foco */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-[10px] font-mono">
          <span className="text-slate-400 px-1 font-sans">Contaminante:</span>
          {(['ALL', 'NO2', 'O3', 'PM25', 'SO2'] as const).map((pol) => {
            const label = pol === 'ALL' ? 'Multiespecie' : pol === 'NO2' ? 'NO₂' : pol === 'O3' ? 'O₃' : pol === 'PM25' ? 'PM₂.₅' : 'SO₂';
            const colorActive = pol === 'NO2' ? 'bg-orange-600 text-white' : pol === 'O3' ? 'bg-pink-600 text-white' : pol === 'PM25' ? 'bg-slate-500 text-white' : pol === 'SO2' ? 'bg-yellow-600 text-black' : 'bg-cyan-700 text-white';
            return (
              <button
                key={pol}
                onClick={() => setSelectedPollutant(pol)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedPollutant === pol ? `${colorActive} font-bold shadow-sm` : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Acciones interactivas (Animación de flujo & Lluvia) */}
        <div className="flex items-center gap-1.5">
          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content={isFlowAnimated ? "Pausar animación de partículas de transporte molecular." : "Reanudar flujo activo de gases y partículas."} position="bottom">
            <button
              onClick={() => setIsFlowAnimated(!isFlowAnimated)}
              className={`px-2 py-1 rounded border flex items-center gap-1 text-[10px] font-mono transition-colors ${
                isFlowAnimated 
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {isFlowAnimated ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-slate-400" />}
              {isFlowAnimated ? 'Flujo Activo' : 'Pausado'}
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Simular evento de precipitación pluvial: muestra el lavado mecánico (rain wash-off) de partículas adheridas a la cutícula hacia el suelo/alcorque." position="bottom">
            <button
              onClick={() => setIsRaining(!isRaining)}
              className={`px-2 py-1 rounded border flex items-center gap-1 text-[10px] font-mono transition-colors ${
                isRaining 
                  ? 'bg-blue-600 border-blue-400 text-white font-bold animate-pulse' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500'
              }`}
            >
              <CloudRain className="w-3 h-3 text-blue-400" />
              {isRaining ? 'Lluvia: Lavando PM' : 'Simular Lluvia'}
            </button>
          </ScientificTooltip>

          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Exportar auditoría estequiométrica foliar en CSV para cálculo científico en R / Python." position="left">
            <button
              onClick={handleExportCsv}
              className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </ScientificTooltip>
        </div>

      </div>

      {/* 2. Slider Dinámico de Apertura Estomática & Turgencia */}
      <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-semibold text-cyan-300 flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Apertura del Poro Estomático (Ostiolo):
          </span>
          <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            {stomataAperturePct}% {stomataAperturePct === 0 ? '(Cerrado - Noche)' : stomataAperturePct > 70 ? '(Turgencia Máxima - Mediodía)' : '(Apertura Media)'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 w-full max-w-md">
          <span className="text-[10px] text-slate-500 font-mono">0% (Noche)</span>
          <ScientificTooltip topic="bvoc_isoprene_monoterpenes" content="Modula la apertura del poro mediante la turgencia de las células oclusivas (presión osmótica gobernada por K+ y agua). Si no se fuerza manualmente, se calcula determinísticamente a partir de PAR, temperatura, VPD y señal de ABA." position="bottom">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={stomataAperturePct}
              onChange={(e) => setManualApertureOverride(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </ScientificTooltip>
          <span className="text-[10px] text-cyan-400 font-mono">100% (Zenit)</span>
          {manualApertureOverride !== null && (
            <ScientificTooltip content="Restablecer apertura calculada automáticamente por física y variables bioambientales (PAR, VPD, temperatura).">
              <button
                onClick={() => setManualApertureOverride(null)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
              >
                Auto ({naturalAperture}%)
              </button>
            </ScientificTooltip>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            R<sub className="text-[9px]">st(NO2)</sub>: <strong className="text-orange-300">{rStomataNO2} s/cm</strong>
          </span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Conductancia: <strong className="text-cyan-300">{stomataConductanceGsw} mmol/m²s</strong>
          </span>
        </div>
      </div>

      {/* 3. DIAGRAMA MULTICOLOR DINÁMICO VECTORIAL (SVG INTERACTIVO) */}
      <div className="relative w-full h-[420px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        
        {/* Definición de animaciones CSS para partículas de flujo */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes dashIntake {
            from { stroke-dashoffset: 40; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes dashElimination {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 40; }
          }
          @keyframes rainFall {
            0% { transform: translateY(-40px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(380px); opacity: 0; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 4px rgba(6,182,212,0.4)); }
            50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(6,182,212,0.9)); }
          }
          .flow-dash-intake {
            animation: dashIntake ${isFlowAnimated ? '1.4s' : '0s'} linear infinite;
          }
          .flow-dash-elimination {
            animation: dashElimination ${isFlowAnimated ? '1.6s' : '0s'} linear infinite;
          }
          .rain-particle {
            animation: rainFall 0.8s linear infinite;
          }
        `}} />

        <svg id="tree-physiology-svg" width="100%" height="100%" viewBox="0 0 920 420" className="w-full h-full select-none">
          <defs>
            {/* Gradientes multicolores para tejidos y órganos */}
            <linearGradient id="canopyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            <linearGradient id="cuticleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>

            <linearGradient id="guardCellGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="mesophyllGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            <linearGradient id="xylemGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="phloemGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            <radialGradient id="stomataGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Fondo reticular científico */}
          <pattern id="gridSub" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.4" opacity="0.6" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gridSub)" />

          {/* ========================================================================= */}
          {/* ESCALA 1: ÁRBOL COMPLETO & ÓRGANOS (COPA, HOJAS, CORTEZA, RAÍCES) */}
          {/* ========================================================================= */}
          {viewLevel === 'whole_tree' && (
            <g transform="translate(40, 20)">
              {/* Entorno atmosférico urbano */}
              <text x="30" y="30" fill="#94a3b8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                ATMÓSFERA URBANA (Turbulencia & Microclima de Málaga)
              </text>

              {/* Copa del árbol (Dosel foliar) */}
              <g id="tree-canopy">
                {/* Masa foliar exterior con gradiente */}
                <ellipse cx="440" cy="150" rx="200" ry="110" fill="url(#canopyGrad)" stroke="#10b981" strokeWidth="2.5" opacity="0.9" />
                <ellipse cx="380" cy="130" rx="140" ry="85" fill="#059669" opacity="0.6" />
                <ellipse cx="500" cy="140" rx="130" ry="80" fill="#10b981" opacity="0.4" />
                
                {/* Hojas individuales simbólicas en la copa */}
                <path d="M 340 100 Q 360 80 380 100 Q 360 120 340 100" fill="#34d399" />
                <path d="M 480 90 Q 500 70 520 90 Q 500 110 480 90" fill="#34d399" />
                <path d="M 420 160 Q 440 140 460 160 Q 440 180 420 160" fill="#34d399" />
                <path d="M 540 150 Q 560 130 580 150 Q 560 170 540 150" fill="#34d399" />
                
                <text x="440" y="145" textAnchor="middle" fill="#ecfdf5" fontSize="13" fontWeight="bold" filter="url(#glowFilter)">
                  COPA & DOSEL FOLIAR (LAI = 5.2 m²/m²)
                </text>
                <text x="440" y="165" textAnchor="middle" fill="#a7f3d0" fontSize="10">
                  Captura estomática de NO₂, O₃ y adsorción de PM en tricomas
                </text>
              </g>

              {/* Tronco y ramas estructurales */}
              <g id="tree-trunk">
                {/* Ramas principales */}
                <path d="M 440 230 Q 360 190 320 150" stroke="#78350f" strokeWidth="14" strokeLinecap="round" fill="none" />
                <path d="M 440 230 Q 520 190 560 150" stroke="#78350f" strokeWidth="12" strokeLinecap="round" fill="none" />
                <path d="M 440 230 L 440 160" stroke="#78350f" strokeWidth="16" strokeLinecap="round" fill="none" />

                {/* Tronco principal */}
                <path d="M 420 230 L 415 340 Q 440 345 465 340 L 460 230 Z" fill="url(#trunkGrad)" stroke="#451a03" strokeWidth="2" />
                
                <text x="440" y="280" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="bold">
                  CORTEZA & LENTICELAS
                </text>
                <text x="440" y="295" textAnchor="middle" fill="#d97706" fontSize="9">
                  Adsorción pasiva de PM y metales
                </text>
              </g>

              {/* Rizosfera y Raíces */}
              <g id="tree-roots" transform="translate(0, 340)">
                {/* Línea de suelo / alcorque */}
                <line x1="120" y1="0" x2="760" y2="0" stroke="#d97706" strokeWidth="2.5" strokeDasharray="4 2" />
                <rect x="120" y="0" width="640" height="45" fill="#451a03" opacity="0.3" />
                
                {/* Raíces ramificadas */}
                <path d="M 430 0 Q 380 20 320 35" stroke="#92400e" strokeWidth="8" strokeLinecap="round" fill="none" />
                <path d="M 450 0 Q 500 18 580 32" stroke="#92400e" strokeWidth="7" strokeLinecap="round" fill="none" />
                <path d="M 440 0 L 440 40" stroke="#92400e" strokeWidth="9" strokeLinecap="round" fill="none" />
                
                <text x="440" y="25" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="bold">
                  RIZOSFERA & MICORRIZAS (Suelo Urbano)
                </text>
                <text x="440" y="38" textAnchor="middle" fill="#fdba74" fontSize="8.5">
                  Inmovilización de nitrógeno edáfico y filtración de escorrentía pluvial
                </text>
              </g>

              {/* Flujos Dinámicos Multicolores de Ingesta y Eliminación */}
              {/* 1. INGESTA: Penacho de gases vehiculares entrando a la copa */}
              <g id="flow-intake-tree">
                {/* NO2 */}
                <path d="M 80 80 C 180 80, 240 120, 320 130" stroke="#f97316" strokeWidth="3.5" strokeDasharray="8 4" fill="none" className="flow-dash-intake" />
                <circle cx="90" cy="80" r="5" fill="#f97316" />
                <text x="90" y="70" fill="#fb923c" fontSize="10" fontWeight="bold">Ingesta NO₂ ({fluxNO2_ug_m2_s} µg/m²s)</text>

                {/* O3 */}
                <path d="M 80 130 C 180 130, 220 145, 300 150" stroke="#ec4899" strokeWidth="3" strokeDasharray="8 4" fill="none" className="flow-dash-intake" />
                <circle cx="90" cy="130" r="5" fill="#ec4899" />
                <text x="90" y="122" fill="#f472b6" fontSize="10" fontWeight="bold">Ingesta O₃ ({fluxO3_ug_m2_s} µg/m²s)</text>

                {/* PM2.5 */}
                <path d="M 80 180 C 180 180, 220 170, 310 165" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 4" fill="none" className="flow-dash-intake" />
                <circle cx="90" cy="180" r="4.5" fill="#94a3b8" />
                <text x="90" y="172" fill="#cbd5e1" fontSize="10" fontWeight="bold">Adsorción PM₂.₅ en cutícula</text>
              </g>

              {/* 2. ELIMINACIÓN: Vapor de agua transpirado y BVOCs saliendo de la copa */}
              <g id="flow-elimination-tree">
                {/* H2O Vapor */}
                <path d="M 540 120 C 620 100, 680 80, 780 70" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="8 4" fill="none" className="flow-dash-elimination" />
                <circle cx="780" cy="70" r="5" fill="#38bdf8" />
                <text x="680" y="60" fill="#7dd3fc" fontSize="10" fontWeight="bold">Transpiración H₂O ({transpirationRate} mmol/m²s)</text>
                
                {/* BVOCs (Isopreno) */}
                <path d="M 560 150 C 640 140, 700 130, 780 120" stroke="#4ade80" strokeWidth="3" strokeDasharray="8 4" fill="none" className="flow-dash-elimination" />
                <circle cx="780" cy="120" r="5" fill="#4ade80" />
                <text x="680" y="112" fill="#86efac" fontSize="10" fontWeight="bold">Emisión BVOCs ({bvocEmissionRate_ug_m2_h} µg/m²h)</text>

                {/* Translocación hacia raíces (floema) */}
                <path d="M 460 220 L 460 340" stroke="#a855f7" strokeWidth="3" strokeDasharray="6 3" fill="none" className="flow-dash-intake" />
                <text x="475" y="270" fill="#c084fc" fontSize="9">Translocación GS/GOGAT (Aminoácidos)</text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* ESCALA 2: CORTE HISTOLÓGICO DE LA HOJA (SECCIÓN TRANSVERSAL COMPLETA) */}
          {/* ========================================================================= */}
          {viewLevel === 'leaf_cross_section' && (
            <g transform="translate(40, 15)">
              <text x="30" y="25" fill="#94a3b8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                CORTE HISTOLÓGICO DE LA HOJA: CAPAS DE ASIMILACIÓN Y DETOXIFICACIÓN
              </text>

              {/* 1. Atmósfera exterior sobre la hoja (Subcapa laminar Rb) */}
              <rect x="40" y="40" width="800" height="35" fill="#0f172a" opacity="0.6" />
              <text x="60" y="62" fill="#94a3b8" fontSize="11">
                Subcapa laminar cuasi-estacionaria (Resistencia R_b = 0.35 s/cm)
              </text>

              {/* 2. Cutícula superior cérea (Waxy Cuticle) */}
              <rect x="40" y="75" width="800" height="14" fill="url(#cuticleGrad)" stroke="#0e7490" strokeWidth="1.5" />
              <text x="760" y="86" fill="#ecfeff" fontSize="9.5" fontWeight="bold" textAnchor="end">
                Cutícula Adaxial Hidrófoba (Ceras Epicuticulares - Adsorción de PM)
              </text>

              {/* Partículas de PM acumuladas sobre la cutícula */}
              <g id="cuticle-particles">
                <circle cx="120" cy="72" r="4.5" fill="#94a3b8" stroke="#475569" />
                <circle cx="128" cy="70" r="3.5" fill="#64748b" />
                <circle cx="280" cy="71" r="5" fill="#94a3b8" stroke="#475569" />
                <circle cx="450" cy="73" r="4" fill="#cbd5e1" />
                <circle cx="620" cy="71" r="6" fill="#94a3b8" />
                <circle cx="630" cy="70" r="3" fill="#64748b" />
              </g>

              {/* 3. Epidermis Superior (Células epidérmicas adaxiales) */}
              <g id="upper-epidermis">
                {Array.from({ length: 16 }).map((_, i) => (
                  <rect 
                    key={`up-epi-${i}`} 
                    x={40 + i * 50} 
                    y={90} 
                    width={48} 
                    height={26} 
                    rx="4" 
                    fill="#15803d" 
                    stroke="#166534" 
                    strokeWidth="1.2" 
                    opacity="0.85" 
                  />
                ))}
                <text x="50" y="108" fill="#dcfce7" fontSize="10" fontWeight="bold">Epidermis Superior</text>
              </g>

              {/* 4. Parénquima en Empalizada (Palisade Mesophyll) - Células columnares */}
              <g id="palisade-mesophyll">
                {Array.from({ length: 24 }).map((_, i) => (
                  <rect 
                    key={`pali-${i}`} 
                    x={40 + i * 33.3} 
                    y={118} 
                    width={30} 
                    height={85} 
                    rx="6" 
                    fill="url(#mesophyllGrad)" 
                    stroke="#14532d" 
                    strokeWidth="1" 
                  />
                ))}
                <text x="60" y="165" fill="#bbf7d0" fontSize="11" fontWeight="bold">
                  Parénquima en Empalizada: Cloroplastos & Ciclo GS/GOGAT (Fijación de NO₂ en Aminoácidos)
                </text>
              </g>

              {/* 5. Parénquima Esponjoso / Lagunar & Haces Vasculares (Xilema y Floema) */}
              <g id="spongy-mesophyll">
                <rect x="40" y="205" width="800" height="95" fill="#052e16" opacity="0.6" />
                
                {/* Células esponjosas irregulares con amplios espacios aéreos */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <circle key={`sp-1-${i}`} cx={70 + i * 58} cy={230} r="18" fill="#166534" stroke="#14532d" opacity="0.8" />
                ))}
                {Array.from({ length: 13 }).map((_, i) => (
                  <circle key={`sp-2-${i}`} cx={95 + i * 58} cy={270} r="19" fill="#15803d" stroke="#14532d" opacity="0.8" />
                ))}

                {/* Haz vascular central: Xilema (Azul) y Floema (Púrpura) */}
                <g transform="translate(420, 220)">
                  <circle cx="0" cy="0" r="36" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2" />
                  <ellipse cx="-12" cy="0" rx="14" ry="24" fill="url(#xylemGrad)" stroke="#0284c7" />
                  <ellipse cx="14" cy="0" rx="14" ry="24" fill="url(#phloemGrad)" stroke="#7c3aed" />
                  <text x="-12" y="4" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold">Xilema</text>
                  <text x="14" y="4" textAnchor="middle" fill="#f5f3ff" fontSize="9" fontWeight="bold">Floema</text>
                  <text x="0" y="32" textAnchor="middle" fill="#c7d2fe" fontSize="8">Haces Vasculares</text>
                </g>

                <text x="60" y="225" fill="#86efac" fontSize="10" fontWeight="bold">
                  Espacios Intercelulares (Difusión Gaseosa según Ley de Fick)
                </text>
              </g>

              {/* 6. Epidermis Inferior con Estomas y Células Oclusivas */}
              <g id="lower-epidermis">
                {/* Segmento epidérmico izquierdo */}
                <rect x="40" y="302" width="220" height="24" rx="4" fill="#15803d" stroke="#166534" />
                
                {/* ESTOMA 1 (Abaxial Izquierdo) */}
                <g transform="translate(300, 314)">
                  {/* Poro / Ostiolo */}
                  <ellipse cx="0" cy="0" rx={8 * apertureFactor + 1} ry="14" fill="#0284c7" opacity="0.7" />
                  {/* Células de guarda */}
                  <ellipse cx={-12 - 4 * apertureFactor} cy="0" rx="10" ry="15" fill="url(#guardCellGrad)" stroke="#059669" strokeWidth="1.5" />
                  <ellipse cx={12 + 4 * apertureFactor} cy="0" rx="10" ry="15" fill="url(#guardCellGrad)" stroke="#059669" strokeWidth="1.5" />
                  <text x="0" y="25" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="bold">Estoma 1</text>
                </g>

                {/* Segmento epidérmico central */}
                <rect x="340" y="302" width="240" height="24" rx="4" fill="#15803d" stroke="#166534" />

                {/* ESTOMA 2 (Abaxial Derecho) */}
                <g transform="translate(620, 314)">
                  <ellipse cx="0" cy="0" rx={8 * apertureFactor + 1} ry="14" fill="#0284c7" opacity="0.7" />
                  <ellipse cx={-12 - 4 * apertureFactor} cy="0" rx="10" ry="15" fill="url(#guardCellGrad)" stroke="#059669" strokeWidth="1.5" />
                  <ellipse cx={12 + 4 * apertureFactor} cy="0" rx="10" ry="15" fill="url(#guardCellGrad)" stroke="#059669" strokeWidth="1.5" />
                  <text x="0" y="25" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="bold">Estoma 2</text>
                </g>

                {/* Segmento epidérmico derecho */}
                <rect x="660" y="302" width="180" height="24" rx="4" fill="#15803d" stroke="#166534" />
              </g>

              {/* Cutícula inferior abaxial */}
              <rect x="40" y="326" width="800" height="8" fill="url(#cuticleGrad)" stroke="#0e7490" strokeWidth="1" />

              {/* Flujos que atraviesan los estomas abaxiales */}
              <g id="stomata-flows">
                {/* NO2 / O3 entrando por el estoma 1 */}
                <path d="M 300 370 L 300 320 Q 300 280 260 250" stroke="#f97316" strokeWidth="3" strokeDasharray="6 3" fill="none" className="flow-dash-intake" />
                <circle cx="300" cy="370" r="4" fill="#f97316" />
                <text x="250" y="380" fill="#fb923c" fontSize="10" fontWeight="bold">Ingesta NO₂ / O₃</text>

                {/* H2O saliendo por el estoma 2 */}
                <path d="M 580 260 Q 620 280 620 320 L 620 370" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 3" fill="none" className="flow-dash-elimination" />
                <circle cx="620" cy="370" r="4" fill="#38bdf8" />
                <text x="630" y="380" fill="#7dd3fc" fontSize="10" fontWeight="bold">Eliminación H₂O (Transpiración)</text>
              </g>
            </g>
          )}

          {/* ========================================================================= */}
          {/* ESCALA 3: ULTRAESTRUCTURA DEL ESTOMA (CÉLULAS DE GUARDA & OSTIOLO) */}
          {/* ========================================================================= */}
          {viewLevel === 'stomata_ultrastructure' && (
            <g transform="translate(30, 15)">
              <text x="30" y="25" fill="#94a3b8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                ULTRAESTRUCTURA DEL ESTOMA: MECANISMO DE ÓSMOSIS, INGESTA Y DETOXIFICACIÓN
              </text>

              {/* Fondo del complejo estomático */}
              <ellipse cx="430" cy="190" rx="360" ry="170" fill="url(#stomataGlow)" />

              {/* Células Epidérmicas Adyacentes (Pavement Cells) */}
              <path d="M 50 70 Q 180 50 240 100 Q 200 200 180 310 Q 90 320 50 280 Z" fill="#14532d" stroke="#166534" strokeWidth="2" opacity="0.6" />
              <text x="110" y="190" fill="#86efac" fontSize="11" fontWeight="bold" textAnchor="middle">
                Célula Anexa / Epidérmica
              </text>
              <text x="110" y="205" fill="#4ade80" fontSize="9" textAnchor="middle">
                Reservorio de K⁺ y H₂O
              </text>

              <path d="M 810 70 Q 680 50 620 100 Q 660 200 680 310 Q 770 320 810 280 Z" fill="#14532d" stroke="#166534" strokeWidth="2" opacity="0.6" />
              <text x="750" y="190" fill="#86efac" fontSize="11" fontWeight="bold" textAnchor="middle">
                Célula Anexa / Epidérmica
              </text>
              <text x="750" y="205" fill="#4ade80" fontSize="9" textAnchor="middle">
                Intercambio Osmótico
              </text>

              {/* Las Dos Células Oclusivas / De Guarda (Reniformes) */}
              {/* Célula Oclusiva Izquierda */}
              <g id="guard-cell-left">
                {/* Desplazamiento dinámico según apertura: se arquean hacia afuera al aumentar turgencia */}
                <path 
                  d={`M 430 70 
                      C ${320 - apertureFactor * 50} 70, ${280 - apertureFactor * 60} 190, ${280 - apertureFactor * 60} 190 
                      C ${280 - apertureFactor * 60} 190, ${320 - apertureFactor * 50} 310, 430 310 
                      C ${370 + (1 - apertureFactor) * 45} 250, ${370 + (1 - apertureFactor) * 45} 130, 430 70 Z`}
                  fill="url(#guardCellGrad)" 
                  stroke="#10b981" 
                  strokeWidth="3" 
                  filter="url(#glowFilter)"
                />

                {/* Cloroplastos interiores en célula oclusiva */}
                <ellipse cx={330 - apertureFactor * 30} cy="130" rx="9" ry="14" fill="#065f46" stroke="#34d399" />
                <ellipse cx={315 - apertureFactor * 35} cy="190" rx="9" ry="15" fill="#065f46" stroke="#34d399" />
                <ellipse cx={330 - apertureFactor * 30} cy="250" rx="9" ry="14" fill="#065f46" stroke="#34d399" />
                
                {/* Vacuola osmótica de acumulación de K+ / malato */}
                <ellipse cx={355 - apertureFactor * 25} cy="190" rx="15" ry="32" fill="#0284c7" opacity="0.5" stroke="#38bdf8" />
                <text x={355 - apertureFactor * 25} y="194" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="bold">K⁺ / H₂O</text>
              </g>

              {/* Célula Oclusiva Derecha */}
              <g id="guard-cell-right">
                <path 
                  d={`M 430 70 
                      C ${540 + apertureFactor * 50} 70, ${580 + apertureFactor * 60} 190, ${580 + apertureFactor * 60} 190 
                      C ${580 + apertureFactor * 60} 190, ${540 + apertureFactor * 50} 310, 430 310 
                      C ${490 - (1 - apertureFactor) * 45} 250, ${490 - (1 - apertureFactor) * 45} 130, 430 70 Z`}
                  fill="url(#guardCellGrad)" 
                  stroke="#10b981" 
                  strokeWidth="3" 
                  filter="url(#glowFilter)"
                />

                {/* Cloroplastos interiores */}
                <ellipse cx={530 + apertureFactor * 30} cy="130" rx="9" ry="14" fill="#065f46" stroke="#34d399" />
                <ellipse cx={545 + apertureFactor * 35} cy="190" rx="9" ry="15" fill="#065f46" stroke="#34d399" />
                <ellipse cx={530 + apertureFactor * 30} cy="250" rx="9" ry="14" fill="#065f46" stroke="#34d399" />

                {/* Vacuola osmótica */}
                <ellipse cx={505 + apertureFactor * 25} cy="190" rx="15" ry="32" fill="#0284c7" opacity="0.5" stroke="#38bdf8" />
                <text x={505 + apertureFactor * 25} y="194" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="bold">K⁺ / H₂O</text>
              </g>

              {/* OSTIOLO / PORO ESTOMÁTICO CENTRAL (Apertura dinámica) */}
              <g id="stoma-pore">
                <ellipse 
                  cx="430" 
                  cy="190" 
                  rx={Math.max(1, 44 * apertureFactor)} 
                  ry="85" 
                  fill="#0369a1" 
                  opacity="0.45" 
                  stroke="#38bdf8" 
                  strokeWidth={apertureFactor > 0.1 ? "2.5" : "0.5"} 
                  strokeDasharray={apertureFactor > 0.1 ? "6 3" : "none"}
                />
                <text x="430" y="194" textAnchor="middle" fill="#ecfeff" fontSize="12" fontWeight="bold" filter="url(#glowFilter)">
                  {stomataAperturePct === 0 ? 'PORO CERRADO' : `OSTIOLO (${(apertureFactor * 12.0).toFixed(1)} µm)`}
                </text>
              </g>

              {/* Microfibrillas radiales de celulosa (causan el arqueo mecánico al hincharse) */}
              <g id="cellulose-microfibrils" stroke="#6ee7b7" strokeWidth="1" opacity="0.4" strokeDasharray="3 3">
                <line x1="330" y1="120" x2="380" y2="130" />
                <line x1="320" y1="180" x2="375" y2="185" />
                <line x1="330" y1="240" x2="380" y2="235" />
                <line x1="530" y1="120" x2="480" y2="130" />
                <line x1="540" y1="180" x2="485" y2="185" />
                <line x1="530" y1="240" x2="480" y2="235" />
              </g>

              {/* VÍAS QUÍMICAS: FLUJO MULTICOLOR DE ENTRADA (INGESTA) Y SALIDA (ELIMINACIÓN) */}
              {apertureFactor > 0.05 && (
                <g id="stomata-molecular-streams">
                  {/* Flujo de Ingesta 1: NO2 (Naranja) entrando hacia el apoplasto */}
                  <path 
                    d="M 400 20 C 400 90, 415 150, 415 190 C 415 230, 390 280, 340 340" 
                    stroke="#f97316" 
                    strokeWidth="4" 
                    strokeDasharray="8 4" 
                    fill="none" 
                    className="flow-dash-intake" 
                  />
                  <circle cx="400" cy="25" r="5" fill="#f97316" />
                  <text x="320" y="25" fill="#fb923c" fontSize="11" fontWeight="bold">Ingesta NO₂</text>

                  {/* Flujo de Ingesta 2: O3 (Rosa/Magenta) */}
                  <path 
                    d="M 430 15 L 430 190 C 430 240, 430 280, 430 350" 
                    stroke="#ec4899" 
                    strokeWidth="3.5" 
                    strokeDasharray="7 3" 
                    fill="none" 
                    className="flow-dash-intake" 
                  />
                  <circle cx="430" cy="18" r="5" fill="#ec4899" />
                  <text x="445" y="25" fill="#f472b6" fontSize="11" fontWeight="bold">Ingesta O₃</text>

                  {/* Flujo de Salida / Eliminación 1: H2O Vapor (Aqua celeste) */}
                  <path 
                    d="M 470 340 C 455 280, 445 220, 445 190 C 445 140, 465 80, 520 20" 
                    stroke="#38bdf8" 
                    strokeWidth="4" 
                    strokeDasharray="8 4" 
                    fill="none" 
                    className="flow-dash-elimination" 
                  />
                  <circle cx="520" cy="20" r="5" fill="#38bdf8" />
                  <text x="535" y="25" fill="#7dd3fc" fontSize="11" fontWeight="bold">Eliminación H₂O (Transpiración)</text>

                  {/* Flujo de Salida 2: BVOCs Isopreno (Verde menta) */}
                  <path 
                    d="M 520 330 C 480 270, 455 220, 455 190 C 455 150, 500 80, 590 35" 
                    stroke="#4ade80" 
                    strokeWidth="3" 
                    strokeDasharray="6 4" 
                    fill="none" 
                    className="flow-dash-elimination" 
                  />
                  <circle cx="590" cy="35" r="4.5" fill="#4ade80" />
                  <text x="605" y="40" fill="#86efac" fontSize="10" fontWeight="bold">Emisión BVOCs</text>
                </g>
              )}

              {/* SEÑALIZACIÓN HORMONAL DE ÁCIDO ABSCÍSICO (ABA) SI ESTÁ ACTIVA */}
              {effectiveABAPct > 30 && (
                <g id="aba-hormonal-signaling">
                  {/* Moléculas de ABA activando canales aniónicos SLAC1 */}
                  <circle cx="370" cy="120" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                  <text x="370" y="123" textAnchor="middle" fill="#000" fontSize="7" fontWeight="bold">ABA</text>
                  <circle cx="490" cy="120" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                  <text x="490" y="123" textAnchor="middle" fill="#000" fontSize="7" fontWeight="bold">ABA</text>

                  {/* Flechas de salida masiva de K+ (eflujo osmótico) hacia células anexas */}
                  <path d="M 330 190 L 220 190" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" fill="none" className="flow-dash-elimination" />
                  <text x="270" y="180" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">Salida K⁺ (GORK)</text>
                  
                  <path d="M 530 190 L 640 190" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" fill="none" className="flow-dash-elimination" />
                  <text x="590" y="180" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">Salida K⁺ (GORK)</text>

                  {/* Cartel de aviso de cierre forzado por ABA */}
                  <rect x="250" y="32" width="360" height="22" rx="4" fill="#78350f" opacity="0.9" stroke="#d97706" />
                  <text x="430" y="47" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="bold">
                    SEÑAL ABA ({effectiveABAPct}%): Canales SLAC1 activados ⟶ Eflujo K⁺ ⟶ Cierre de Ostiolo
                  </text>
                </g>
              )}

              {/* ESCUDO ANTIOXIDANTE DE ASCORBATO (APX) & RADICALES LIBRES (ROS) */}
              {effectiveAscorbateSatPct > 50 && (
                <g id="apx-antioxidant-shield" transform="translate(430, 290)">
                  <rect x="-140" y="-12" width="280" height="24" rx="12" fill="#831843" stroke="#f43f5e" strokeWidth="1.5" opacity="0.85" />
                  <text x="0" y="4" textAnchor="middle" fill="#fbcfe8" fontSize="9.5" fontWeight="bold">
                    Escudo APX {effectiveAscorbateSatPct}% sat. {effectiveOxidativeStressIndex > 50 ? `| ⚠️ ROS ${effectiveROSGeneration} µmol/m²s` : '| O₃ ⟶ O₂ + H₂O'}
                  </text>
                </g>
              )}

              {/* Rótulos químicos inferiores en el interior del mesófilo / apoplasto */}
              <g transform="translate(100, 360)">
                <rect x="0" y="0" width="660" height="44" rx="6" fill="#0f172a" stroke="#334155" />
                <text x="15" y="16" fill="#fdba74" fontSize="10" fontWeight="bold">
                  Bioquímica Apoplástica & Balances en Vivo:
                </text>
                <text x="15" y="32" fill="#94a3b8" fontSize="9.5">
                  NO₂ disuelto ⟶ NO₃⁻/NO₂⁻ ⟶ GS/GOGAT (Aminoácidos) | O₃ + Ascorbato ⟶ O₂ + MDHA (Ciclo Asada) | VPD={effectiveVpdKpa} kPa {isTerralActive ? '🔥 ALERTA TERRAL MÁLAGA' : '🌊 Brisa costera'}
                </text>
              </g>
            </g>
          )}

          {/* SIMULACIÓN DE LLUVIA ANIMADA SOBRE LA HOJA SI ESTÁ ACTIVA */}
          {isRaining && (
            <g id="rain-particles">
              {Array.from({ length: 24 }).map((_, idx) => (
                <line
                  key={`rain-${idx}`}
                  x1={50 + (idx * 37) % 820}
                  y1="10"
                  x2={35 + (idx * 37) % 820}
                  y2="32"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="rain-particle"
                  style={{ animationDelay: `${(idx * 0.08).toFixed(2)}s` }}
                />
              ))}
              <rect x="250" y="10" width="420" height="24" rx="4" fill="#0284c7" opacity="0.9" />
              <text x="460" y="26" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                LAVADO PLUVIAL ACTIVO: Eliminando {rainWashoffEfficiencyPct}% de PM hacia el suelo
              </text>
            </g>
          )}

        </svg>

        {/* Leyenda multicolor flotante */}
        <div className="absolute bottom-2 left-3 bg-slate-900/90 border border-slate-800 p-2 rounded flex items-center gap-3 text-[10px] font-mono backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-orange-300">NO₂ Ingesta</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
            <span className="text-pink-300">O₃ Ingesta</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            <span className="text-slate-300">PM Cutícula</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
            <span className="text-sky-300">H₂O Transpiración</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span className="text-emerald-300">BVOCs Emisión</span>
          </div>
        </div>

      </div>

      {/* 4. Panel Científico Físico-Químico: INGESTA vs. ELIMINACIÓN */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
        
        {/* Selector de Pestañas de Proceso */}
        <div className="flex border-b border-slate-800 gap-1 pb-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveProcessTab('intake')}
            className={`px-3 py-1 rounded-t font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeProcessTab === 'intake'
                ? 'bg-orange-950 text-orange-300 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
            1. Ingesta Estomática
          </button>

          <button
            onClick={() => setActiveProcessTab('mesophyll_chemistry')}
            className={`px-3 py-1 rounded-t font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeProcessTab === 'mesophyll_chemistry'
                ? 'bg-purple-950 text-purple-300 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            2. Química Tisular & GS/GOGAT
          </button>

          <button
            onClick={() => setActiveProcessTab('foyer_halliwell_asada')}
            className={`px-3 py-1 rounded-t font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeProcessTab === 'foyer_halliwell_asada'
                ? 'bg-pink-950 text-pink-300 border-b-2 border-pink-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            3. Cinética Foyer-Halliwell-Asada (O₃ & ROS)
          </button>

          <button
            onClick={() => setActiveProcessTab('terral_aba_xylem')}
            className={`px-3 py-1 rounded-t font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeProcessTab === 'terral_aba_xylem'
                ? 'bg-amber-950 text-amber-300 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            4. Terral, Hormona ABA & Cavitación Xilema
          </button>

          <button
            onClick={() => setActiveProcessTab('elimination')}
            className={`px-3 py-1 rounded-t font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeProcessTab === 'elimination'
                ? 'bg-sky-950 text-sky-300 border-b-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
            5. Transpiración & Lavado
          </button>
        </div>

        {/* Contenido de la pestaña 1: INGESTA */}
        {activeProcessTab === 'intake' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
              <h5 className="font-bold text-orange-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Absorción por Estomas (Gases)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Los gases reactivos (<span className="text-orange-300 font-mono">NO₂</span>, <span className="text-pink-300 font-mono">O₃</span>, <span className="text-yellow-300 font-mono">SO₂</span>) ingresan pasivamente por difusión molecular a través de los estomas siguiendo la <strong>Ley de Fick</strong>:
              </p>
              <div className="mt-2 p-1.5 bg-black/60 font-mono text-[10px] text-cyan-300 rounded border border-cyan-900/50">
                J = (C_atm - C_int) / (R_a + R_b + R_st)
              </div>
              <p className="text-slate-400 text-[10px] mt-1.5">
                Flujo actual estimado: <strong className="text-orange-300">{fluxNO2_ug_m2_s} µg/m²s</strong> de NO₂ y <strong className="text-pink-300">{fluxO3_ug_m2_s} µg/m²s</strong> de O₃.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
              <h5 className="font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Adsorción en Cutícula (Partículas PM)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El material particulado (<span className="text-slate-200 font-mono">PM₁₀</span> y <span className="text-slate-200 font-mono">PM₂.₅</span>) no penetra el estoma por tamaño estérico; se retiene físicamente sobre las <strong>ceras epicuticulares</strong> y tricomas foliares mediante impacto inercial y fuerzas electrostáticas.
              </p>
              <div className="mt-2 p-1.5 bg-black/60 font-mono text-[10px] text-slate-300 rounded border border-slate-700">
                Carga retenida: {pmAdsorbedCuticle_ug_m2} µg PM₂.₅/m² de hoja
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
              <h5 className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                <Trees className="w-3.5 h-3.5" /> Adsorción en Corteza & Ramas
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                La corteza rugosa y las lenticelas del tronco actúan como trampas físicas permanentes de micropartículas ricas en metales pesados (Pb, Cu, Zn de frenos y neumáticos), fijándolos en la suberina hasta el desprendimiento de corteza.
              </p>
            </div>
          </div>
        )}

        {/* Contenido de la pestaña 2: QUÍMICA TISULAR & DETOXIFICACIÓN */}
        {activeProcessTab === 'mesophyll_chemistry' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-purple-300 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> Ruta del Nitrógeno: Ciclo GS / GOGAT
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El <span className="text-orange-300 font-mono">NO₂</span> se disuelve en el apoplasto húmedo formando nitrato (<span className="font-mono text-cyan-300">NO₃⁻</span>) y nitrito (<span className="font-mono text-cyan-300">NO₂⁻</span>). En el cloroplasto, la <em>Nitrato Reductasa</em> y <em>Nitrito Reductasa</em> lo reducen a amonio (<span className="font-mono text-emerald-300">NH₄⁺</span>), incorporándose a glutamina y glutamato:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-purple-200 rounded border border-purple-900/50">
                2 NO₂ + H₂O ⟶ NO₂⁻ + NO₃⁻ + 2 H⁺ ⟶ NH₄⁺ ⟶ Aminoácidos (Proteínas)
              </div>
              <p className="text-[10px] text-emerald-400 font-mono">
                Eficiencia de asimilación proteica: {no2AssimilationEfficiencyPct}% (transformación en madera y follaje).
              </p>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-pink-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Detoxificación de Ozono (O₃) por Ascorbato
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El ozono es un gas altamente fitotóxico. Al cruzar el ostiolo, reacciona instantáneamente en el apoplasto con el <strong>ácido ascórbico (Vitamina C)</strong> y las enzimas <em>Ascorbato Peroxidasa (APX)</em> y <em>Superóxido Dismutasa (SOD)</em>, degradándose a agua y oxígeno:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-pink-200 rounded border border-pink-900/50">
                O₃ + Ascorbato ⟶ O₂ + Monodehidroascorbato + H₂O (Ciclo Foyer-Halliwell-Asada)
              </div>
              <p className="text-[10px] text-slate-400">
                Si la dosis supera la capacidad antioxidante (AOT40 {'>'} 18000 µg/m³·h), se produce necrosis foliar y senescencia acelerada.
              </p>
            </div>
          </div>
        )}

        {/* Contenido de la pestaña 3: CINÉTICA FOYER-HALLIWELL-ASADA (O3 & ROS) */}
        {activeProcessTab === 'foyer_halliwell_asada' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-pink-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> 1. Pool Apoplástico de Ascorbato (APX)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El ácido ascórbico (Asc) en la pared celular apoplástica es la primera barrera antioxidante. La enzima <strong>Ascorbato Peroxidasa (APX)</strong> cataliza la reducción rápida del O₃ y H₂O₂ a agua, oxidándose a monodehidroascorbato (MDHA):
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-pink-300 rounded border border-pink-900/50">
                2 Asc + H₂O₂ (vía O₃) ⟶ 2 MDHA + 2 H₂O
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Saturación del Pool APX:</span>
                <strong className={`font-mono ${effectiveAscorbateSatPct > 80 ? 'text-red-400' : 'text-pink-300'}`}>{effectiveAscorbateSatPct}%</strong>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-purple-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" /> 2. Desbordamiento Redox & Generación de ROS
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Cuando la concentración de ozono supera la tasa de regeneración de ascorbato por la MDHAR y DHAR usando NADPH del cloroplasto, el exceso de O₃ reacciona con agua generando especies reactivas de oxígeno:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-purple-200 rounded border border-purple-900/50">
                O₃ + H₂O ⟶ O₂ + 2 •OH (Radical Hidroxilo)
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Tasa de Producción de ROS:</span>
                <strong className="font-mono text-purple-300">{effectiveROSGeneration} µmol/m²s</strong>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-red-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" /> 3. Estrés Oxidativo & Peroxidación Lipídica
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Los radicales •OH atacan los ácidos grasos poliinsaturados de la membrana plasmática de las células oclusivas, alterando los canales iónicos y forzando senescencia celular prematura o necrosis:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-red-300 rounded border border-red-900/50">
                Lipoperoxidación ⟶ Malondialdehído (MDA)
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Índice Estrés Oxidativo:</span>
                <strong className={`font-mono ${effectiveOxidativeStressIndex > 60 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                  {effectiveOxidativeStressIndex}% ({effectiveOxidativeStressIndex > 60 ? 'Alerta Crítica' : 'Tolerancia Normal'})
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de la pestaña 4: DÉFICIT DE VAPOR, TERRAL & HORMONA ABA (XILEMA) */}
        {activeProcessTab === 'terral_aba_xylem' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> 1. Episodios de Terral en Málaga (Física)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El viento de Terral en Málaga se genera por advección de aire continental del NW subsidente a través del valle del Guadalhorce, sufriendo compresión adiabática seca (efecto Föhn, gradiente seco de 1°C/100m).
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-amber-200 rounded border border-amber-900/50">
                VPD = esat(T) · [1 - (HR / 100)] = {effectiveVpdKpa} kPa
              </div>
              <p className="text-[10px] text-slate-400">
                Estado: <strong className={isTerralActive ? 'text-red-400' : 'text-emerald-400'}>{isTerralActive ? `Terral Activo (${terralSeverityPct}% severidad)` : 'Condiciones Estándar de Málaga'}</strong>
              </p>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-yellow-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> 2. Cascada Hormonal de Ácido Abscísico (ABA)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Al elevarse el VPD por encima de 2.0 kPa, las raíces y el mesófilo liberan <strong>ácido abscísico (ABA)</strong> al xilema. El ABA se une a los receptores PYR/PYL/RCAR en las células oclusivas:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-yellow-200 rounded border border-yellow-900/50">
                ABA ⟶ OST1 quinasa ⟶ Apertura de canales SLAC1 ⟶ Eflujo masivo de K⁺ y aniones
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Nivel de Señal ABA:</span>
                <strong className="font-mono text-amber-300">{effectiveABAPct}% ({effectiveABAPct > 50 ? 'Cierre Forzado' : 'Basal'})</strong>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1.5">
              <h5 className="font-bold text-blue-300 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> 3. Seguridad Hidráulica & Riesgo de Cavitación
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                El cierre inducido por ABA protege los vasos leñosos de la tensión negativa extrema (<span className="font-mono text-cyan-300">Ψxilema &lt; -2.2 MPa</span>). Si los estomas permanecieran abiertos en Terral, la transpiración descontrolada causaría embolia por cavitación:
              </p>
              <div className="p-1.5 bg-black/60 font-mono text-[10px] text-cyan-200 rounded border border-cyan-900/50">
                PLC (%) = 100 / [1 + exp(a · (Ψ - P50))]
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Riesgo de Cavitación / Embolia:</span>
                <strong className={`font-mono ${xylemCavitationRiskPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {xylemCavitationRiskPct}% ({xylemCavitationRiskPct > 50 ? 'Riesgo Alto' : 'Xilema Seguro'})
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de la pestaña 5: ELIMINACIÓN, TRANSPIRACIÓN & LAVADO */}
        {activeProcessTab === 'elimination' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1">
              <h5 className="font-bold text-sky-400 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" /> Transpiración de Vapor de Agua (H₂O)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                La eliminación continua de vapor de agua por los estomas refrigera el aire circundante mediante calor latente de evaporación (<span className="font-mono text-sky-300">2.45 kJ/g</span>), reduciendo las temperaturas de Málaga en 1.5 - 3.2°C y desactivando la convección térmica que atrapa contaminantes.
              </p>
              <div className="text-[10px] font-mono text-sky-300 bg-black/40 p-1 rounded">
                Tasa: {transpirationRate} mmol H₂O/m²s
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1">
              <h5 className="font-bold text-emerald-400 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" /> Emisión de BVOCs Termoprotectores
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                A temperaturas {'>'} 28°C, los cloroplastos sintetizan <strong>isopreno</strong> y <strong>monoterpenos</strong> que se eliminan por el ostiolo. Aunque protegen la membrana tilacoidal del árbol, en presencia de altos NOx urbanos pueden participar en la formación secundaria de O₃ y SOA.
              </p>
              <div className="text-[10px] font-mono text-emerald-300 bg-black/40 p-1 rounded">
                Emisión actual: {bvocEmissionRate_ug_m2_h} µg/m²h
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1">
              <h5 className="font-bold text-blue-400 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5" /> Lavado Pluvial (Rain Washoff)
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                La lluvia desaloja mecánicamente el PM adherido a la cutícula cerosa y lo traslada a la escorrentía o al alcorque (fijación en suelo edáfico), regenerando la capacidad de adsorción de la hoja para el siguiente episodio de contaminación.
              </p>
              <div className="text-[10px] font-mono text-blue-300 bg-black/40 p-1 rounded">
                Eficiencia lavado: {rainWashoffEfficiencyPct}%
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
