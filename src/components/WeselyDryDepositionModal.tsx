import React, { useState, useEffect, useMemo } from 'react';
import {
  Leaf, Sun, Wind, Download, FileJson, FileSpreadsheet, ShieldCheck, TreeDeciduous,
  Droplets, Layers, MapPin, Flame, AlertTriangle, Copy, Check, Info, Thermometer,
  Gauge, Activity, Compass, ArrowDownRight, RefreshCw, Sparkles, BookOpen, BarChart3,
  Scale, SunDim, Building, TrendingUp, TrendingDown, Scissors
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import {
  calculateWeselyDryDepositionSummary,
  exportWeselyGeoJson,
  exportWeselyCsv,
  PollutantSpecies,
  calculateTerralCanopyDisruptionSummary,
  generateTerralDisruptionLatex,
  exportTerralDisruptionCsv,
  MALAGA_TREE_SPECIES_WESELY_PROFILES,
  computeCanopyAerodynamicTrapping,
  computeCalleLariosAwningsImpact,
  generateCanopyParadojaLatex,
  exportCanopyParadojaCsv,
  CanopyAerodynamicTrappingResult,
  CalleLariosAwningResult,
} from '../lib/weselyDryDeposition';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry } from '../lib/liveZoneTelemetry';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ReferenceLine, AreaChart, Area } from 'recharts';
import { WeselyResistanceCircuitDiagram } from './WeselyResistanceCircuitDiagram';

export interface WeselyDryDepositionModalProps {
  onClose: () => void;
  initialTab?: 'modelo_wesely' | 'microfisica_terral' | 'paradoja_dosel_toldos' | 'especies_arboleas';
}

export function WeselyDryDepositionModal({ onClose, initialTab = 'modelo_wesely' }: WeselyDryDepositionModalProps) {
  const [activeTab, setActiveTab] = useState<'modelo_wesely' | 'microfisica_terral' | 'paradoja_dosel_toldos' | 'especies_arboleas'>(initialTab);
  const activeCtx = useActivePoint();
  const [activeZone, setActiveZone] = useState<Zone>(
    PRESET_ZONES.find(z => z.tag.includes("LAI") || z.name.includes("Parque")) || PRESET_ZONES[1] || PRESET_ZONES[0]
  );
  const [parWm2, setParWm2] = useState<number>(550); // Mediodía solar
  const [airTempC, setAirTempC] = useState<number>(26);
  const [rhPct, setRhPct] = useState<number>(58);
  const [ustarMs, setUstarMs] = useState<number>(0.38);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [copiedParadojaLatex, setCopiedParadojaLatex] = useState(false);

  // Estado para la subpestaña de la Paradoja del Dosel Arbóreo y Toldos de Calle Larios
  const [canyonStreet, setCanyonStreet] = useState<'Paseo del Parque' | 'Alameda Principal' | 'Calle Hilera' | 'Calle Cuarteles' | 'Calle Carretería' | 'Calle Marqués de Larios'>('Paseo del Parque');
  const [canyonH, setCanyonH] = useState<number>(14);
  const [canyonW, setCanyonW] = useState<number>(32);
  const [trafficEmission, setTrafficEmission] = useState<number>(140);
  const [windRoofSpeed, setWindRoofSpeed] = useState<number>(3.2);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('platanus_hispanica');

  const handleSelectCanyonStreet = (street: typeof canyonStreet) => {
    setCanyonStreet(street);
    if (street === 'Paseo del Parque') {
      setCanyonH(14); setCanyonW(32); setTrafficEmission(140); setSelectedSpeciesId('platanus_hispanica');
    } else if (street === 'Alameda Principal') {
      setCanyonH(20); setCanyonW(36); setTrafficEmission(180); setSelectedSpeciesId('ficus_nitida');
    } else if (street === 'Calle Hilera') {
      setCanyonH(22); setCanyonW(16); setTrafficEmission(160); setSelectedSpeciesId('platanus_hispanica');
    } else if (street === 'Calle Cuarteles') {
      setCanyonH(20); setCanyonW(15); setTrafficEmission(190); setSelectedSpeciesId('jacaranda_mimosifolia');
    } else if (street === 'Calle Carretería') {
      setCanyonH(16); setCanyonW(11); setTrafficEmission(95); setSelectedSpeciesId('citrus_aurantium');
    } else if (street === 'Calle Marqués de Larios') {
      setCanyonH(21); setCanyonW(16); setTrafficEmission(40); setSelectedSpeciesId('citrus_aurantium');
    }
  };

  // Asimilación en vivo de micrometeorología de deposición ante cambio de zona
  useEffect(() => {
    let isMounted = true;
    fetchLiveZoneTelemetry(activeZone).then(tel => {
      if (!isMounted) return;
      setParWm2(tel.meteo.parWm2);
      setAirTempC(tel.meteo.tempC);
      setRhPct(tel.meteo.rhPct);
      setUstarMs(tel.meteo.ustarMs);
      setTelemetryFeedback(`${tel.source} • PAR=${tel.meteo.parWm2} W/m², T=${tel.meteo.tempC}°C, RH=${tel.meteo.rhPct}%, u*=${tel.meteo.ustarMs} m/s`);
    }).catch(err => console.warn(err));
    return () => { isMounted = false; };
  }, [activeZone]);

  // Sincronización reactiva instantánea cuando cambia el punto o calle activa en el mapa (ActivePointContext)
  useEffect(() => {
    const pt = activeCtx?.activePoint;
    const assim = activeCtx?.assimilation;
    if (!pt && !assim) return;

    if (pt) {
      setCanyonH(Math.round(pt.buildingHeightM ?? pt.H ?? 18));
      setCanyonW(Math.round(pt.canyonWidthM ?? pt.W ?? 18));
      const baseQ = pt.isPedestrian ? 15 : Math.max(35, Math.round((pt.trafficVehiclesDay ?? 14000) / 110));
      setTrafficEmission(baseQ);
    }
    if (assim) {
      setAirTempC(Number(assim.temperatureC.toFixed(1)));
      setRhPct(Math.round(assim.humidityPct));
      const rad = assim.solarRadiationWm2 ?? 580;
      setParWm2(Math.max(40, Math.round(rad * 0.48 * (0.4 + 0.6 * (assim.svf ?? 0.55)))));
      const windMs = Math.max(0.5, assim.windSpeedMs ?? 2.8);
      setWindRoofSpeed(Number(windMs.toFixed(1)));
      const hw = pt?.aspectRatioHw ?? assim.aspectRatioHw ?? 1.1;
      const dynamicUstar = Number(Math.max(0.12, windMs * (0.095 + 0.025 * Math.min(2.5, hw))).toFixed(2));
      setUstarMs(dynamicUstar);
      const streetLabel = pt?.streetName || pt?.name || 'Punto Activo';
      setTelemetryFeedback(
        `ActivePoint Sync (${streetLabel}): T=${assim.temperatureC.toFixed(1)}°C, RH=${Math.round(assim.humidityPct)}%, PAR=${Math.round(rad * 0.48)} W/m², u*=${dynamicUstar} m/s`
      );
    }
  }, [activeCtx?.activePoint, activeCtx?.assimilation]);

  // Si hay datos meteorológicos en el contexto del punto activo, permitir sincronización directa manual
  const applyActivePointMeteo = () => {
    const assim = activeCtx?.assimilation;
    if (assim) {
      setAirTempC(Number(assim.temperatureC.toFixed(1)));
      setRhPct(Math.round(assim.humidityPct));
      setUstarMs(parseFloat(Math.max(0.12, assim.windSpeedMs * 0.11).toFixed(2)));
      const streetName = activeCtx?.activePoint?.streetName ?? activeCtx?.activePoint?.name ?? 'Málaga Centro';
      setTelemetryFeedback(`Asimilado de Punto Activo (${streetName}): T=${assim.temperatureC.toFixed(1)}°C, RH=${Math.round(assim.humidityPct)}%`);
    }
  };

  const setLevanteScenario = () => {
    setAirTempC(24);
    setRhPct(68);
    setParWm2(550);
    setUstarMs(0.35);
    setTelemetryFeedback('Escenario: Brisa Marina de Levante (Málaga costera típica, humedad moderada-alta)');
  };

  const setTerralExtremeScenario = () => {
    setAirTempC(41.5);
    setRhPct(18);
    setParWm2(750);
    setUstarMs(0.48);
    setTelemetryFeedback('Escenario: Terral Extremo del Guadalhorce (Compresión adiabática Foehn, T>41°C, RH<20%)');
  };

  // Cálculo del sumario clásico de Wesely
  const summary = useMemo(() => {
    return calculateWeselyDryDepositionSummary(parWm2, airTempC, rhPct, ustarMs);
  }, [parWm2, airTempC, rhPct, ustarMs]);

  // Cálculo de la microfísica del Terral y disrupción canópica con NO2 y O3 reales del punto activo
  const terralDisruption = useMemo(() => {
    const concNO2 = activeCtx?.assimilation?.no2Ugm3 ?? activeCtx?.data?.no2_satelite_base ?? 38;
    const concO3 = activeCtx?.assimilation?.o3Ugm3 ?? activeCtx?.data?.ozone ?? 75;
    return calculateTerralCanopyDisruptionSummary(parWm2, airTempC, rhPct, ustarMs, concNO2, concO3);
  }, [parWm2, airTempC, rhPct, ustarMs, activeCtx?.assimilation?.no2Ugm3, activeCtx?.assimilation?.o3Ugm3, activeCtx?.data?.no2_satelite_base, activeCtx?.data?.ozone]);

  // Cálculo de la Paradoja del Dosel Urbano (LAI crítico)
  const canopyTrappingResult = useMemo(() => {
    const species = MALAGA_TREE_SPECIES_WESELY_PROFILES.find(s => s.speciesId === selectedSpeciesId) || MALAGA_TREE_SPECIES_WESELY_PROFILES[1];
    return computeCanopyAerodynamicTrapping({
      streetName: canyonStreet,
      canyonH,
      canyonW,
      windSpeedRoofMs: windRoofSpeed,
      trafficEmissionNOx_ug_m_s: trafficEmission,
      backgroundNO2_ugm3: activeCtx?.data?.no2_satelite_base ?? 22,
      speciesProfile: species,
      tempC: airTempC,
      rhPct,
      parWm2,
    });
  }, [canyonStreet, canyonH, canyonW, windRoofSpeed, trafficEmission, selectedSpeciesId, airTempC, rhPct, parWm2, activeCtx]);

  // Cálculo de los Toldos de Calle Larios
  const lariosAwningResult = useMemo(() => {
    return computeCalleLariosAwningsImpact({
      windSpeedMs: windRoofSpeed * 0.75,
      ambientTempC: airTempC,
      solarRadWm2: parWm2 * 1.4,
      baselineNO2Ugm3: activeCtx?.data?.no2_satelite_base ?? 28,
    });
  }, [windRoofSpeed, airTempC, parWm2, activeCtx]);

  const chartData = useMemo(() => {
    return summary.zones.map((z) => ({
      name: z.zoneName.split('(')[0].trim(),
      O3: z.pollutantResults.O3.monthlyRemovalKg,
      NO2: z.pollutantResults.NO2.monthlyRemovalKg,
      PM25: z.pollutantResults.PM25.monthlyRemovalKg,
      vdO3: z.pollutantResults.O3.vd_cm_s,
    }));
  }, [summary]);

  const terralSpeciesChartData = useMemo(() => {
    return terralDisruption.speciesComparisons.map((c) => ({
      name: c.species.commonName.split('/')[0].trim(),
      vdLevante: c.vdLevanteNO2_cm_s,
      vdTerral: c.vdTerralNO2_cm_s,
      caidaPct: c.vdDropPct,
    }));
  }, [terralDisruption]);

  const handleDownloadGeoJson = () => {
    const jsonStr = exportWeselyGeoJson(summary);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wesely_deposicion_seca_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvStr = exportWeselyCsv(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wesely_deposicion_seca_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTerralCsv = () => {
    const csvStr = exportTerralDisruptionCsv(terralDisruption);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terral_disrupcion_estomatica_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    const latexStr = generateTerralDisruptionLatex(terralDisruption);
    navigator.clipboard.writeText(latexStr);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  const handleCopyParadojaLatex = () => {
    const latexStr = generateCanopyParadojaLatex(canopyTrappingResult, lariosAwningResult);
    navigator.clipboard.writeText(latexStr);
    setCopiedParadojaLatex(true);
    setTimeout(() => setCopiedParadojaLatex(false), 2500);
  };

  const handleDownloadParadojaCsv = () => {
    const csvStr = exportCanopyParadojaCsv(canopyTrappingResult, lariosAwningResult);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paradoja_dosel_toldos_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTerral = terralDisruption.diagnostics.isTerralActive;

  return (
    <DraggableWindow
      windowId="weselyDryDeposition"
      title="Deposición Seca en Vegetación Urbana (Modelo de Wesely 1989)"
      subtitle={`Parque de Málaga, Alameda, Gibralfaro • Punto: ${activeCtx?.activePoint?.name ?? activeZone.name}`}
      icon={<Leaf className="w-4 h-4 text-emerald-400" />}
      badge={
        isTerral ? (
          <span className="text-[9px] bg-amber-950/90 text-amber-300 border border-amber-600 px-2 py-0.5 font-mono font-bold flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3 text-amber-400" />
            TERRAL DEL GUADALHORCE ACTIVO • Cierre {100 - terralDisruption.diagnostics.stomatalAperturePct}%
          </span>
        ) : (
          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 font-mono font-bold">
            Remoción O₃: {summary.totalMonthlyRemovalKg.O3} kg/mes | NO₂: {summary.totalMonthlyRemovalKg.NO2} kg/mes
          </span>
        )
      }
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-6 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[82vh] overflow-y-auto">
        
        {/* NAVEGACIÓN POR SUBPESTAÑAS TEMÁTICAS */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-sm border border-slate-800 text-xs font-mono font-bold">
            <ScientificTooltip
              topic="wesely_model_overview"
              content="Red analítica de resistencias en serie de Wesely (1989): R_a (aerodinámica), R_b (capa cuasi-laminar) y R_c (canópica foliar)."
            >
              <button
                onClick={() => setActiveTab('modelo_wesely')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all ${
                  activeTab === 'modelo_wesely'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/70 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Red Resistencias Wesely</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              topic="terral_microphysics_malaga"
              content="Primicia Tesis: Viento catabático del NW/Guadalhorce, calentamiento adiabático (>40°C), desplome de humedad (<20%), déficit VPD (>4 kPa) y cierre estomático que desactiva el sumidero de NO2."
            >
              <button
                onClick={() => setActiveTab('microfisica_terral')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all ${
                  activeTab === 'microfisica_terral'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600 shadow-sm'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Microfísica Terral (Foehn & VPD)</span>
                {isTerral && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              topic="canopy_trapping_paradox"
              content="Primicia Tesis 2025: Paradoja del arbolado en cañón. Competición analítica entre sumidero estomático de Wesely y resistencia aerodinámica de copa. Cálculo del punto de corte LAI_crit y microfísica de toldos de Calle Larios."
            >
              <button
                onClick={() => setActiveTab('paradoja_dosel_toldos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all ${
                  activeTab === 'paradoja_dosel_toldos'
                    ? 'bg-violet-950/80 text-violet-300 border border-violet-500 shadow-sm'
                    : 'text-slate-400 hover:text-violet-200 hover:bg-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-violet-400" />
                <span>Paradoja Dosel (LAI_crit) & Toldos Larios</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              topic="malaga_urban_trees"
              content="Parámetros ecofisiológicos certificados de la flora urbana de Málaga: Jacaranda, Plátano de sombra, Ficus microcarpa, Palmera canaria y Naranjo amargo."
            >
              <button
                onClick={() => setActiveTab('especies_arboleas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all ${
                  activeTab === 'especies_arboleas'
                    ? 'bg-teal-950/80 text-teal-300 border border-teal-600 shadow-sm'
                    : 'text-slate-400 hover:text-teal-200 hover:bg-slate-900'
                }`}
              >
                <TreeDeciduous className="w-3.5 h-3.5 text-teal-400" />
                <span>Especies Arbóreas</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* PALETAS DE CONMUTACIÓN DE ESCENARIO RÁPIDO */}
          <div className="flex items-center gap-1.5">
            <ScientificTooltip content="Restaura condiciones costeras estándar de brisa marina de Levante (24°C, 68% RH, VPD 0.96 kPa).">
              <button
                onClick={setLevanteScenario}
                className="text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors"
              >
                <Droplets className="w-3 h-3 text-cyan-400" /> Levante (Brisa)
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Activa el escenario extremo de Terral del Guadalhorce (41.5°C, 18% RH, VPD 6.42 kPa, compresión adiabática Foehn).">
              <button
                onClick={setTerralExtremeScenario}
                className="text-[10px] font-mono font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors"
              >
                <Flame className="w-3 h-3 text-amber-400" /> Terral Extremo
              </button>
            </ScientificTooltip>

            {activeCtx?.data && (
              <ScientificTooltip content="Sincroniza con las condiciones meteorológicas del punto activo seleccionado en el mapa.">
                <button
                  onClick={applyActivePointMeteo}
                  className="text-[10px] font-mono font-bold bg-slate-950 hover:bg-slate-900 text-emerald-300 border border-emerald-800 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" /> Pto. Activo
                </button>
              </ScientificTooltip>
            )}
          </div>
        </div>

        {/* BARRA DE SELECCIÓN DE ZONA Y TELEMETRÍA DE SUMIDERO VERDE */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-sm px-2 py-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={activeZone.name}
                onChange={(e) => {
                  const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                  if (z) setActiveZone(z);
                }}
                className="bg-transparent text-[10px] font-mono text-slate-300 font-bold outline-none cursor-pointer appearance-none pr-4"
              >
                {PRESET_ZONES.map(z => (
                  <option key={z.name} value={z.name} className="bg-slate-900">{z.name} ({z.tag})</option>
                ))}
              </select>
            </div>

            <ScientificTooltip position="bottom" width="w-[320px]" content="Asimila en tiempo real la radiación fotosintética (PAR), temperatura y velocidad de fricción (u*) de la zona seleccionada para calcular la resistencia estomática y la tasa de deposición foliar neta.">
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider cursor-help">
                Asimilación In Situ de Sumidero Foliar
              </span>
            </ScientificTooltip>
          </div>

          {telemetryFeedback && (
            <span className="text-[9px] text-emerald-300 font-mono bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-sm">
              {telemetryFeedback}
            </span>
          )}
        </div>

        {/* CONTROLES METEOROLÓGICOS Y FISIOLÓGICOS COMUNES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <Sun className="w-3.5 h-3.5" /> Radiación PAR
              </span>
              <span className="font-mono text-amber-300 font-bold">{parWm2} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="25"
              value={parWm2}
              onChange={(e) => setParWm2(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 mt-1">Apertura fotosintética diurna</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <Thermometer className="w-3.5 h-3.5" /> Temperatura Canopia
              </span>
              <span className={`font-mono font-bold ${airTempC >= 38 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {airTempC} °C
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="0.5"
              value={airTempC}
              onChange={(e) => setAirTempC(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 mt-1">
              {airTempC >= 40 ? 'Estrés térmico extremo (>40°C)' : 'Rango térmico vegetativo'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-sky-400">
                <Droplets className="w-3.5 h-3.5" /> Humedad Relativa
              </span>
              <span className={`font-mono font-bold ${rhPct <= 20 ? 'text-amber-400' : 'text-sky-300'}`}>
                {rhPct} %
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              step="1"
              value={rhPct}
              onChange={(e) => setRhPct(parseFloat(e.target.value))}
              className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 mt-1">
              {rhPct <= 25 ? 'Desecación Foehn severa' : 'Humedad moderada mediterránea'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                <Wind className="w-3.5 h-3.5" /> Fricción u*
              </span>
              <span className="font-mono text-cyan-300 font-bold">{ustarMs} m/s</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.02"
              value={ustarMs}
              onChange={(e) => setUstarMs(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 mt-1">Cizalladura de capa límite</span>
          </div>
        </div>

        {/* -------------------- SUBPESTAÑA 1: MODELO WESELY TRADICIONAL -------------------- */}
        {activeTab === 'modelo_wesely' && (
          <div className="space-y-4 animate-fadeIn">
            <WeselyResistanceCircuitDiagram
              parWm2={parWm2}
              airTempC={airTempC}
              rhPct={rhPct}
              ustarMs={ustarMs}
            />

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Red Analítica de Resistencias en Serie (Wesely 1989) • Zona: <span className="text-white">{activeZone.name}</span>
                </h4>
                <ScientificTooltip position="left" width="w-[320px]" content="Formulación analítica de analogía eléctrica: v_d = 1 / (R_a + R_b + R_c). R_a = Aerodinámica, R_b = Capa Límite Foliar Cuasi-Laminar, R_c = Canópica.">
                  <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded cursor-help">
                    v_d = 1 / (R_a + R_b + R_c) + v_g
                  </span>
                </ScientificTooltip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['O3', 'NO2', 'PM25'] as PollutantSpecies[]).map((species) => {
                  const currentZoneCalc = summary.zones.find(z => z.zoneName.includes(activeZone.name.split(' ')[0])) || summary.zones[0];
                  const resData = currentZoneCalc.pollutantResults[species];
                  const titleColor = species === 'O3' ? 'text-amber-400' : species === 'NO2' ? 'text-cyan-400' : 'text-purple-400';
                  const borderAccent = species === 'O3' ? 'border-amber-500/30' : species === 'NO2' ? 'border-cyan-500/30' : 'border-purple-500/30';

                  return (
                    <div key={species} className={`bg-slate-950/80 border ${borderAccent} p-3 rounded space-y-2 font-mono text-[11px]`}>
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                        <span className={`font-bold ${titleColor}`}>Especie: {species === 'O3' ? 'Ozono (O₃)' : species === 'NO2' ? 'NO₂' : 'PM₂.₅'}</span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 text-[10px] rounded">
                          v_d = {resData.vd_cm_s} cm/s
                        </span>
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-300">
                        <ScientificTooltip position="bottom" width="w-[280px]" content="Resistencia Aerodinámica R_a (s/m) en la capa límite superficial urbana. R_a = ln(z_ref / z_0) / (k * u_*)">
                          <div className="flex justify-between cursor-help">
                            <span className="text-slate-400">• Resistencia Aerodinámica (R_a):</span>
                            <span className="text-slate-200 font-bold">{resData.ra_s_m} s/m</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[280px]" content="Resistencia Cuasi-Laminar de Capa Límite Foliar R_b (s/m). R_b = [2 / (k * u_*)] * (Sc / Pr)^(2/3)">
                          <div className="flex justify-between cursor-help">
                            <span className="text-slate-400">• Resistencia Cuasi-Laminar (R_b):</span>
                            <span className="text-slate-200 font-bold">{resData.rb_s_m} s/m</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[280px]" content="Resistencia Estomática Foliar R_s (s/m) modulada por PAR, temperatura y déficit de presión de vapor Tetens VPD (Jarvis-Stewart 1976).">
                          <div className="flex justify-between cursor-help">
                            <span className="text-slate-400">• Resistencia Estomática (R_s):</span>
                            <span className="text-slate-200 font-bold">{resData.rs_s_m > 9000 ? 'N/A (Partículas)' : `${resData.rs_s_m} s/m`}</span>
                          </div>
                        </ScientificTooltip>

                        <ScientificTooltip position="bottom" width="w-[280px]" content="Resistencia Canópica Total R_c (s/m) integrada por combinación en paralelo de resistencias estomática, mesofílica y cuticular.">
                          <div className="flex justify-between cursor-help">
                            <span className="text-slate-400">• Resistencia Canópica (R_c):</span>
                            <span className="text-emerald-300 font-bold">{resData.rc_s_m} s/m</span>
                          </div>
                        </ScientificTooltip>

                        <div className="border-t border-slate-800/80 pt-1 flex justify-between text-slate-400">
                          <span>• Flujo de Deposición Neta:</span>
                          <span className="text-amber-300 font-bold">{resData.dryFluxUgm2s} µg/(m²·s)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Remoción Mensual de Contaminantes por Zona Vegetada de Málaga (kg/mes)
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#10b981" tick={{ fontSize: 10 }} unit="kg" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="O3" name="Ozono (O₃) [kg/mes]" fill="#f59e0b" />
                    <Bar dataKey="NO2" name="NO₂ [kg/mes]" fill="#06b6d4" />
                    <Bar dataKey="PM25" name="PM₂.₅ [kg/mes]" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- SUBPESTAÑA 2: MICROFÍSICA DEL TERRAL DE MÁLAGA -------------------- */}
        {activeTab === 'microfisica_terral' && (
          <div className="space-y-4 animate-fadeIn">
            <div className={`p-3.5 rounded-sm border ${
              isTerral
                ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-start gap-2.5">
                <Flame className={`w-5 h-5 mt-0.5 shrink-0 ${isTerral ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                      Veredicto Microfísico del Terral del Guadalhorce (Viento Foehn)
                    </h4>
                    <span className={`text-[9px] px-2 py-0.5 font-mono font-bold rounded ${
                      terralDisruption.diagnostics.terralSeverity === 'extremo' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                      terralDisruption.diagnostics.terralSeverity === 'severo' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                      terralDisruption.diagnostics.terralSeverity === 'moderado' ? 'bg-yellow-950 text-yellow-300 border border-yellow-700' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      RÉGIMEN: {terralDisruption.diagnostics.terralSeverity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-sans text-slate-200">
                    {terralDisruption.scientificVerdict}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-mono">
                  <span>Déficit Vapor (VPD)</span>
                  <ScientificTooltip content="Ecuación de Tetens: e_s(T) = 0.61078 exp(17.27 T / (T+237.3)). VPD = e_s - e_a. Superar 3.0 kPa causa cierre estomático irreversible en vegetación mediterránea para evitar la embolia de xilema.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-mono font-bold ${
                    terralDisruption.diagnostics.vpdKpa > 3.0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {terralDisruption.diagnostics.vpdKpa}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">kPa</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1 font-mono">
                  <div className="flex justify-between">
                    <span>e_s(sat):</span> <span>{terralDisruption.diagnostics.esKpa} kPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span>e_a(act):</span> <span>{terralDisruption.diagnostics.eaKpa} kPa</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-mono">
                  <span>Apertura Estomática</span>
                  <ScientificTooltip content="Conductancia estomática foliar según Jarvis-Stewart (1976). Modulada por f(VPD) y f(T). Cuando el Terral desploma la humedad a menos del 20%, los estomas cierran más del 90%.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-mono font-bold ${
                    terralDisruption.diagnostics.stomatalAperturePct < 15 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {terralDisruption.diagnostics.stomatalAperturePct}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">remanente</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1 font-mono">
                  <div className="flex justify-between">
                    <span>Factor f(VPD):</span> <span>{terralDisruption.diagnostics.fVpd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Factor f(Temp):</span> <span>{terralDisruption.diagnostics.fTemp}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-mono">
                  <span>Cinética Arrhenius</span>
                  <ScientificTooltip content="Aceleración de la reacción bimolecular k(NO+O3) = 2.07e-12 exp(-1400/T). A 42°C se acelera más de un 40% respecto a 20°C, convirtiendo el NO primario vehicular en NO2 en escasos segundos a nivel de acera.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-cyan-400">
                    +{((terralDisruption.diagnostics.leightonAccelerationRatio - 1) * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">vs 20°C</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1 font-mono">
                  <div className="flex justify-between">
                    <span>k(T):</span> <span>{terralDisruption.diagnostics.arrheniusRateK.toExponential(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratio k(T)/k₂₀:</span> <span>x{terralDisruption.diagnostics.leightonAccelerationRatio}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-mono">
                  <span>Altura PBLH Convectiva</span>
                  <ScientificTooltip content="Altura de la capa límite atmosférica urbana (PBLH). Durante el Terral, el fuerte calentamiento sensible eleva la capa de mezcla por encima de 1800 m, pero la inhibición del sumidero foliar mantiene altas concentraciones en cañón.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-purple-400">
                    {terralDisruption.diagnostics.pblhHeightM}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">m cota</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1 font-mono">
                  <div className="flex justify-between">
                    <span>Régimen:</span> <span>Convectivo Foehn</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Déficit NO₂:</span> <span>-{terralDisruption.totalMonthlyPenaltyKgNO2} kg/mes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 font-mono uppercase flex items-center gap-2">
                  <TreeDeciduous className="w-4 h-4 text-amber-400" /> Disrupción de Velocidad de Deposición v_d(NO₂) por Especie Arbórea
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Comparación: Levante (24°C, 68% RH) vs Terral ({airTempC}°C, {rhPct}% RH)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="p-2">Especie Urbana</th>
                      <th className="p-2">Calles Típicas</th>
                      <th className="p-2 text-right">v_d Levante (cm/s)</th>
                      <th className="p-2 text-right">v_d Terral (cm/s)</th>
                      <th className="p-2 text-right">Caída v_d (%)</th>
                      <th className="p-2 text-right">R_sto Terral (s/m)</th>
                      <th className="p-2 text-center">Estado Fisiológico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {terralDisruption.speciesComparisons.map((c) => (
                      <tr key={c.species.speciesId} className="hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-slate-200">
                          {c.species.commonName}
                          <div className="text-[9px] text-slate-400 italic font-normal">{c.species.scientificName}</div>
                        </td>
                        <td className="p-2 text-[10px] text-slate-400">
                          {c.species.typicalStreets.slice(0, 2).join(', ')}
                        </td>
                        <td className="p-2 text-right text-cyan-300 font-bold">
                          {c.vdLevanteNO2_cm_s.toFixed(3)}
                        </td>
                        <td className="p-2 text-right text-amber-300 font-bold">
                          {c.vdTerralNO2_cm_s.toFixed(3)}
                        </td>
                        <td className="p-2 text-right text-rose-400 font-bold">
                          -{c.vdDropPct.toFixed(1)}%
                        </td>
                        <td className="p-2 text-right text-slate-300">
                          {c.rsTerral_s_m.toFixed(0)} s/m
                        </td>
                        <td className="p-2 text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            c.physiologicalStatus.includes('Completo') ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                            c.physiologicalStatus.includes('Moderado') ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                            'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          }`}>
                            {c.physiologicalStatus.split('(')[0].trim()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Comparativa de Velocidad de Deposición v_d(NO₂) (cm/s) ante el Terral
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={terralSpeciesChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#f59e0b" tick={{ fontSize: 10 }} unit=" cm/s" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="vdLevante" name="Levante (24°C, 68% RH) [cm/s]" fill="#06b6d4" />
                    <Bar dataKey="vdTerral" name="Terral del Guadalhorce [cm/s]" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center border-t border-slate-800 pt-3 gap-2">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Formulación analítica Tetens + Jarvis-Stewart (1976) + Arrhenius IUPAC. Cero aleatoriedad.</span>
              </div>

              <div className="flex items-center gap-2">
                <ScientificTooltip content="Copia el código LaTeX listo para compilar con la tabla comparativa de impacto del Terral para incluir en la memoria de tesis o presentación Beamer.">
                  <button
                    onClick={handleCopyLatex}
                    className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-pointer"
                  >
                    {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedLatex ? '¡Copiado a LaTeX!' : 'Copiar Tabla LaTeX Terral'}</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip content="Descarga el conjunto de datos de disrupción canópica del Terral en formato CSV bajo estándares FAIR.">
                  <button
                    onClick={handleDownloadTerralCsv}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> CSV FAIR Terral
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- SUBPESTAÑA 3: PARADOJA DEL DOSEL & TOLDOS LARIOS (PRIMICIA MUNDIAL) -------------------- */}
        {activeTab === 'paradoja_dosel_toldos' && (
          <div className="space-y-4 animate-fadeIn">
            {/* BANNER DOCTRINAL DE LA PARADOJA (ROTTERDAM-ATENAS 2025) */}
            <div className="p-3.5 rounded-sm border bg-violet-950/30 border-violet-600/60 text-violet-200 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <Scale className="w-5 h-5 mt-0.5 text-violet-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-violet-300">
                      Paradoja del Dosel Urbano: Competición entre Sumidero Wesely y Bloqueo de Vórtice
                    </h4>
                    <span className="text-[9px] bg-violet-950 text-violet-300 border border-violet-700 px-1.5 py-0.2 rounded font-mono font-bold">
                      Frontera Q1 (2025)
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed mt-1">
                    En cañones urbanos estrechos a profundos (<strong>H/W ≥ 0.8</strong>), las copas densas de los árboles actúan como un medio poroso que frena la recirculación del vórtice de Oke, reduciendo la ventilación (<strong>ACH</strong>) más de lo que sus hojas absorben por deposición seca. Esta suite calcula el <strong>Punto de Inflexión Crítico (LAI_crít)</strong> específico de Málaga y analiza el confinamiento inducido por las lonas textiles estivales de Calle Larios.
                  </p>
                </div>
              </div>
            </div>

            {/* SELECTOR DE CAÑÓN REAL DE MÁLAGA Y PARÁMETROS */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-violet-300 font-mono uppercase flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-violet-400" /> Configuración de Cañón Real de Málaga
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Cañón Predefinido:</span>
                  <select
                    value={canyonStreet}
                    onChange={(e) => handleSelectCanyonStreet(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 text-violet-300 text-xs px-2 py-1 rounded font-mono font-bold outline-none cursor-pointer"
                  >
                    <option value="Paseo del Parque">Paseo del Parque (H=14m, W=32m, Plátanos)</option>
                    <option value="Alameda Principal">Alameda Principal (H=20m, W=36m, Ficus)</option>
                    <option value="Calle Hilera">Calle Hilera - Centro (H=22m, W=16m, Tráfico)</option>
                    <option value="Calle Cuarteles">Calle Cuarteles - Perchel (H=20m, W=15m, Jacarandas)</option>
                    <option value="Calle Carretería">Calle Carretería (H=16m, W=11m, Cañón Estrecho)</option>
                    <option value="Calle Marqués de Larios">Calle Marqués de Larios (H=21m, W=16m, Toldos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Altura Edificios (H):</span>
                    <span className="text-violet-300 font-bold">{canyonH} m</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="35"
                    step="1"
                    value={canyonH}
                    onChange={(e) => setCanyonH(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Ancho Calle (W):</span>
                    <span className="text-violet-300 font-bold">{canyonW} m</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="45"
                    step="1"
                    value={canyonW}
                    onChange={(e) => setCanyonW(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Viento en Tejado (U_roof):</span>
                    <span className="text-cyan-300 font-bold">{windRoofSpeed} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.2"
                    value={windRoofSpeed}
                    onChange={(e) => setWindRoofSpeed(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Especie Arbórea:</span>
                  </div>
                  <select
                    value={selectedSpeciesId}
                    onChange={(e) => setSelectedSpeciesId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-teal-300 text-[11px] p-1 rounded font-mono outline-none cursor-pointer"
                  >
                    {MALAGA_TREE_SPECIES_WESELY_PROFILES.map(s => (
                      <option key={s.speciesId} value={s.speciesId}>
                        {s.commonName} (LAI: {s.defaultLAI})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CUADRÍCULA DE MÉTRICAS DIAGNÓSTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 uppercase flex justify-between">
                  <span>Relación Aspecto H/W</span>
                  <ScientificTooltip content="Relación de aspecto del cañón H/W. Determina el régimen de recirculación de Oke (1987). H/W >= 0.65 confina el vórtice de flujo rasante (Skimming Flow), maximizando el riesgo de atrapamiento aerodinámico.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-violet-300">{canopyTrappingResult.aspectRatioHW}</span>
                  <span className="text-[10px] text-slate-400">H/W</span>
                </div>
                <div className="text-[9px] text-violet-400 font-bold truncate">
                  {canopyTrappingResult.flowRegime.split('(')[0].trim()}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 uppercase flex justify-between">
                  <span>Umbral Crítico (LAI_crit)</span>
                  <ScientificTooltip content="Índice de Área Foliar Crítico donde la curva de concentración alcanza su mínimo dC/dLAI = 0. Superar este valor implica que la resistencia al escape generada por el árbol supera a su capacidad de absorción foliar.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">{canopyTrappingResult.laiCritical}</span>
                  <span className="text-[10px] text-slate-400">m²/m²</span>
                </div>
                <div className="text-[9px] text-slate-300 flex justify-between border-t border-slate-800/80 pt-1">
                  <span>LAI actual: <strong className="text-amber-400">{canopyTrappingResult.laiCurrent}</strong></span>
                  <span>{canopyTrappingResult.isCurrentlyTrapping ? '⚠️ Excedido' : '✓ Óptimo'}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 uppercase flex justify-between">
                  <span>Impacto Neto NO₂ Acera</span>
                  <ScientificTooltip content="Diferencia neta en la concentración de NO2 a nivel de acera respecto a una calle idéntica sin arbolado. Valores positivos demuestran la Paradoja de Atrapamiento.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${canopyTrappingResult.currentNetDeltaUgm3 > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {canopyTrappingResult.currentNetDeltaUgm3 > 0 ? `+${canopyTrappingResult.currentNetDeltaUgm3}` : canopyTrappingResult.currentNetDeltaUgm3}
                  </span>
                  <span className="text-[10px] text-slate-400">µg/m³</span>
                </div>
                <div className="text-[9px] text-slate-300 border-t border-slate-800/80 pt-1 flex justify-between">
                  <span>Sin árboles: {canopyTrappingResult.pedestrianConcNoTreesUgm3}</span>
                  <span>Actual: <strong className="text-white">{canopyTrappingResult.pedestrianConcCurrentUgm3}</strong></span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 uppercase flex justify-between">
                  <span>Pérdida de Ventilación</span>
                  <ScientificTooltip content="Porcentaje de reducción en la tasa de renovación de aire (ACH) provocado por el arrastre aerodinámico de la copa del árbol en el vórtice del cañón urbano.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </ScientificTooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-400">-{canopyTrappingResult.ventilationPenaltyPct}%</span>
                  <span className="text-[10px] text-slate-400">ACH</span>
                </div>
                <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1">
                  Arrastre Darcy-Forchheimer en copa
                </div>
              </div>
            </div>

            {/* GRÁFICO RECHARTS DE LA CURVA DE CONCENTRACIÓN FRENTE A LAI */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-violet-300 uppercase font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-violet-400" /> Curva Mecanística: Concentración Peatonal de NO₂ vs Índice de Área Foliar (LAI)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {canopyTrappingResult.streetName} • Especie: {canopyTrappingResult.selectedSpecies.commonName}
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={canopyTrappingResult.curvePoints} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="lai" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'LAI (m²/m²)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#a855f7" tick={{ fontSize: 10 }} domain={['auto', 'auto']} unit=" µg/m³" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <ReferenceLine x={canopyTrappingResult.laiCritical} stroke="#10b981" strokeDasharray="4 4" label={{ value: `LAI_crit = ${canopyTrappingResult.laiCritical}`, fill: '#10b981', fontSize: 10, position: 'top' }} />
                    <ReferenceLine x={canopyTrappingResult.laiCurrent} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `LAI Actual = ${canopyTrappingResult.laiCurrent}`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={canopyTrappingResult.pedestrianConcNoTreesUgm3} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Sin Árboles', fill: '#94a3b8', fontSize: 10, position: 'left' }} />
                    <Line type="monotone" dataKey="cPedestrianUgm3" name="NO₂ Peatonal (µg/m³)" stroke="#c084fc" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Zona Sub-Crítica (LAI &lt; LAI_crit): Domina el secuestro biológico de Wesely.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Zona Hiper-Crítica (LAI &gt; LAI_crit): Domina el atrapamiento aerodinámico de Oke.</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN ESPECIAL: MICROFÍSICA DE LOS TOLDOS TEXTILES DE CALLE LARIOS */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                  <SunDim className="w-4 h-4 text-amber-400" /> Caso de Estudio Málaga: Microfísica de Toldos Textiles Estivales en Calle Larios
                </h4>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 rounded">
                  H/W = {canopyTrappingResult.aspectRatioHW} • Velas Ancladas a 7.5m
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Escenario 1: Sin toldos */}
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-cyan-300">Escenario Despejado (Sin Toldos)</span>
                    <span className="text-[10px] text-slate-400">Radiación Libre</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Transmitancia UV Solar:</span>
                      <span className="text-white font-bold">{lariosAwningResult.noAwning.uvTransmittancePct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Fotólisis Leighton J_NO₂:</span>
                      <span className="text-amber-300 font-bold">{lariosAwningResult.noAwning.jNO2_s1} s⁻¹</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Temperatura Mármol Suelo:</span>
                      <span className="text-rose-400 font-bold">{lariosAwningResult.noAwning.pavementTempC} °C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Tasa Renovación Aire (ACH):</span>
                      <span className="text-cyan-300">{lariosAwningResult.noAwning.ach_s1} s⁻¹</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">• Tiempo Residencia Aire (τ):</span>
                      <span className="text-slate-200 font-bold">{lariosAwningResult.noAwning.airResidenceTimeSec} s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• NO₂ Peatonal Resultante:</span>
                      <span className="text-cyan-300 font-bold">{lariosAwningResult.noAwning.pedestrianNO2Ugm3} µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* Escenario 2: Con toldos estivales */}
                <div className="bg-slate-950/80 border border-amber-600/40 p-3 rounded space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center border-b border-amber-800/60 pb-1.5">
                    <span className="font-bold text-amber-300">Escenario Con Toldos Estivales</span>
                    <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-700">Lonas Microperforadas</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Transmitancia UV Solar:</span>
                      <span className="text-amber-300 font-bold">{lariosAwningResult.withAwning.uvTransmittancePct}% (-{lariosAwningResult.photochemicalShieldingPct}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Fotólisis Leighton J_NO₂:</span>
                      <span className="text-slate-400 font-bold">{lariosAwningResult.withAwning.jNO2_s1} s⁻¹ (Inhibida)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Temperatura Mármol Suelo:</span>
                      <span className="text-emerald-400 font-bold">{lariosAwningResult.withAwning.pavementTempC} °C (-{lariosAwningResult.coolingBenefitDegC}°C)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Tasa Renovación Aire (ACH):</span>
                      <span className="text-amber-400">{lariosAwningResult.withAwning.ach_s1} s⁻¹</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">• Tiempo Residencia Aire (τ):</span>
                      <span className="text-amber-400 font-bold">{lariosAwningResult.withAwning.airResidenceTimeSec} s (x{lariosAwningResult.ventilationTrapFactor})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• NO₂ Peatonal Resultante:</span>
                      <span className="text-rose-400 font-bold">{lariosAwningResult.withAwning.pedestrianNO2Ugm3} µg/m³ (+{lariosAwningResult.netNO2DeltaUgm3} µg/m³)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded text-[11px] font-sans text-slate-300 leading-relaxed">
                <span className="font-bold font-mono text-amber-300 block mb-1">
                  Veredicto del Compromiso Bioclimático (Trade-off):
                </span>
                {lariosAwningResult.bioclimaticTradeOffVerdict}
              </div>
            </div>

            {/* VEREDICTO DOCTORAL Y EXPORTACIONES FAIR */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-sm space-y-2">
              <h5 className="text-xs font-bold font-mono text-violet-300 flex items-center gap-1.5 uppercase">
                <BookOpen className="w-4 h-4 text-violet-400" /> Dictamen Mecanístico para la Memoria de Tesis
              </h5>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {canopyTrappingResult.doctoralVerdict}
              </p>
            </div>

            <div className="flex flex-wrap justify-between items-center border-t border-slate-800 pt-3 gap-2">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Formulación analítica Darcy-Forchheimer + Oke (1987) + Soulhac (2008). Cero aleatoriedad.</span>
              </div>

              <div className="flex items-center gap-2">
                <ScientificTooltip content="Copia el bloque de código LaTeX listo para compilar con las tablas comparativas de LAI_crit y Toldos de Calle Larios para la memoria de tesis o presentación Beamer.">
                  <button
                    onClick={handleCopyParadojaLatex}
                    className="flex items-center gap-1.5 bg-violet-950/80 hover:bg-violet-900 text-violet-200 border border-violet-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-pointer"
                  >
                    {copiedParadojaLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
                    <span>{copiedParadojaLatex ? '¡Copiado a LaTeX!' : 'Copiar Tabla LaTeX Paradoja'}</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip content="Descarga el conjunto de datos de la curva de concentración de NO2 y compromiso de toldos en formato CSV bajo estándares FAIR.">
                  <button
                    onClick={handleDownloadParadojaCsv}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> CSV FAIR Paradoja
                  </button>
                </ScientificTooltip>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- SUBPESTAÑA 4: ESPECIES ARBÓREAS DE MÁLAGA -------------------- */}
        {activeTab === 'especies_arboleas' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-teal-300 font-mono uppercase flex items-center gap-2">
                  <TreeDeciduous className="w-4 h-4 text-teal-400" /> Catálogo Fisiológico de la Masa Arbórea de Málaga
                </h4>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Parámetros certificados de resistencia estomática mínima (r_min), resistencia cuticular (r_cut) e Índice de Área Foliar (LAI).
                </p>
              </div>
              <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-700 px-2 py-0.5 font-mono font-bold">
                {MALAGA_TREE_SPECIES_WESELY_PROFILES.length} Especies Clave
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MALAGA_TREE_SPECIES_WESELY_PROFILES.map((tree) => (
                <div key={tree.speciesId} className="bg-slate-950/80 border border-slate-800 p-3 rounded-sm space-y-2 font-mono text-[11px]">
                  <div className="border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-teal-300 text-xs">{tree.commonName}</span>
                    <div className="text-[10px] text-slate-400 italic">{tree.scientificName}</div>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo de Follaje:</span>
                      <span className="text-slate-200">{tree.foliageType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LAI Base (m²/m²):</span>
                      <span className="text-emerald-300 font-bold">{tree.defaultLAI}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">r_min estomática:</span>
                      <span className="text-cyan-300 font-bold">{tree.rMinStomatal_s_m} s/m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">r_cut cuticular:</span>
                      <span className="text-amber-300">{tree.rCuticular_s_m} s/m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resistencia Mesófilo:</span>
                      <span className="text-slate-200">{tree.mesophyllResistance_s_m} s/m</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-1.5 text-[9px] text-slate-400">
                    <span className="font-bold text-slate-300">Calles típicas:</span> {tree.typicalStreets.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA COMÚN Y EXPORTACIONES GENERALES FAIR */}
        {activeTab === 'modelo_wesely' && (
          <div className="flex justify-between items-center border-t border-slate-800 pt-3">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Formulación de Wesely (1989) e i-Tree Canopy. Cero datos aleatorios.</span>
            </div>

            <div className="flex gap-2">
              <ScientificTooltip position="top" width="w-[280px]" content="Exportación FAIR en formato GeoJSON de los polígonos de zonas verdes con velocidades de deposición Vd calculadas por contaminante.">
                <button
                  onClick={handleDownloadGeoJson}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-emerald-400" /> GeoJSON Wesely
                </button>
              </ScientificTooltip>

              <ScientificTooltip position="top" width="w-[280px]" content="Exportación tabular CSV del balance de sumidero biológico de O3, NO2 y PM2.5 según el modelo de resistencias eléctricas de Wesely.">
                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" /> CSV FAIR Science
                </button>
              </ScientificTooltip>
            </div>
          </div>
        )}

      </div>
    </DraggableWindow>
  );
}
