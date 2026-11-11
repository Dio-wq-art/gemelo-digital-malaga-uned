import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  Zap, 
  Download, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  Radio, 
  MapPin, 
  Atom, 
  Sparkles, 
  Waves, 
  Flame, 
  Layers, 
  FlaskConical,
  Eye
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { evaluateExtendedPhotochemistry, exportPssCsv, exportPssLatex } from '../lib/extendedLeightonPhotochemistry';
import { computeSpectralRadiationAndPhotolysis, SpectralSimulationOutput } from '../lib/spectralRadiativeModel';
import { simulateCoastalHalogenKinetics, HalogenSimulationResult, HalogenSimulationParameters, exportHalogenCsv, exportHalogenLatex, exportHalogenGeoJson } from '../lib/coastalHalogenChemistry';
import { evaluatePhotochemicalRegime, exportPhotochemicalCsv, exportPhotochemicalLatex } from '../lib/photochemicalRegimeEngine';
import { solveIsorropiaEquilibrium, InorganicAerosolInput, IsorropiaEquilibriumResult } from '../lib/isorropiaInorganicAerosol';
import { LeightonCycleDiagram, LeightonData } from './LeightonCycleDiagram';
import { SpectralRadiationPhotolysisDiagram } from './SpectralRadiationPhotolysisDiagram';
import { RadicalKineticsDiagram } from './RadicalKineticsDiagram';
import { CoastalHalogenProcessDiagram } from './CoastalHalogenProcessDiagram';
import { OzoneEkmaDiagram } from './OzoneEkmaDiagram';
import { PhotochemicalTernaryDiagram } from './PhotochemicalTernaryDiagram';
import { VbsPartitioningEquilibriumDiagram } from './VbsPartitioningEquilibriumDiagram';
import { IsorropiaPhaseDiagram } from './IsorropiaPhaseDiagram';
import { WeselyResistanceCircuitDiagram } from './WeselyResistanceCircuitDiagram';
import { Tio2PhotocatalyticDiagram } from './Tio2PhotocatalyticDiagram';
import { Leaf } from 'lucide-react';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { useLiveZoneTelemetry } from '../hooks/useTelemetry';
import { useActivePoint } from '../context/ActivePointContext';
import { useUIStore } from '../store/uiStore';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';

export type PhotochemistryTab = 
  | 'leighton_photolysis'
  | 'radicals_oxidation'
  | 'coastal_halogens'
  | 'ekma_regimes'
  | 'secondary_aerosols'
  | 'wesely_deposition'
  | 'tio2_photocatalysis';

export interface ExtendedLeightonModalProps {
  onClose: () => void;
  initialTab?: PhotochemistryTab;
}

export function ExtendedLeightonModal({ onClose, initialTab = 'leighton_photolysis' }: ExtendedLeightonModalProps) {
  const activePointCtx = useActivePoint();
  const activePoint = activePointCtx?.activePoint;
  const assimilation = activePointCtx?.assimilation;
  const [activeTab, setActiveTab] = useState<PhotochemistryTab>(initialTab);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES[0]);

  // Telemetría y Parámetros Asimilados
  const [tempC, setTempC] = useState<number>(25);
  const [rhPct, setRhPct] = useState<number>(65);
  const [no2Ppb, setNo2Ppb] = useState<number>(20);
  const [o3Ppb, setO3Ppb] = useState<number>(45);
  const [noPpb, setNoPpb] = useState<number>(10);
  const [vocProxy, setVocProxy] = useState<number>(1.5);
  const [cloudCoverPct, setCloudCoverPct] = useState<number>(0);
  const [pm25, setPm25] = useState<number>(15);
  const [windSpeed, setWindSpeed] = useState<number>(3.0);
  const [svf, setSvf] = useState<number>(0.35); // Sky View Factor (Cañón Urbano)
  const [ekmaSubView, setEkmaSubView] = useState<'ternary' | 'isopleths' | 'dual'>('ternary');

  // Ingestión en vivo mediante React Query
  const { data: telemetryData, isFetching: isIngesting, refetch: handleIngestLiveData } = useLiveZoneTelemetry(activeZone);
  const [ingestionSource, setIngestionSource] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (telemetryData) {
      setTempC(Math.round(telemetryData.meteo.tempC));
      setRhPct(Math.round(telemetryData.meteo.rhPct));
      setWindSpeed(telemetryData.meteo.windSpeedMs);
      setCloudCoverPct(telemetryData.meteo.cloudCoverPct);
      setNo2Ppb(telemetryData.chemistry.no2Ppb);
      setO3Ppb(telemetryData.chemistry.o3Ppb);
      setNoPpb(telemetryData.chemistry.noPpb);
      setPm25(Math.round(telemetryData.chemistry.pm25Ugm3));
      setVocProxy(Number((telemetryData.chemistry.vocProxyPpbC / 10).toFixed(1)));
      setIngestionSource(`${telemetryData.source} • [${activeZone.name}]`);
    }
  }, [telemetryData, activeZone.name]);

  // Sincronización atómica inmediata con el punto activo seleccionado en el mapa (ActivePointContext)
  useEffect(() => {
    if (!activePoint) return;
    // Seleccionar la zona predefinida más cercana geodésicamente al punto activo
    let closestZone = PRESET_ZONES[0];
    let minDist = Infinity;
    for (const z of PRESET_ZONES) {
      const d = Math.hypot(z.lat - activePoint.lat, z.lon - activePoint.lon);
      if (d < minDist) {
        minDist = d;
        closestZone = z;
      }
    }
    setActiveZone(closestZone);
    if (typeof activePoint.svf === 'number') {
      setSvf(Number(activePoint.svf.toFixed(2)));
    }
    if (assimilation) {
      setTempC(Number(assimilation.temperatureC.toFixed(1)));
      setRhPct(Math.round(assimilation.humidityPct));
      setWindSpeed(Number(assimilation.windSpeedMs.toFixed(1)));
      const no2PpbVal = Number((assimilation.no2Ugm3 / 1.88).toFixed(1));
      const o3PpbVal = Number((assimilation.o3Ugm3 / 1.96).toFixed(1));
      setNo2Ppb(no2PpbVal);
      setO3Ppb(o3PpbVal);
      setNoPpb(Number(Math.max(1.2, no2PpbVal * (0.28 + 0.15 * (1 - (assimilation.svf ?? 0.5)))).toFixed(1)));
      setPm25(Number(assimilation.pm25Ugm3.toFixed(1)));
      const trafficFactor = Math.min(3.5, Math.max(0.6, (activePoint.trafficVehiclesDay ?? 12000) / 14000));
      setVocProxy(Number((1.1 * trafficFactor + 0.35 * (assimilation.treeCanopyLai ?? 1.5)).toFixed(2)));
      setIngestionSource(`ActivePoint Sync • [${activePoint.streetName || closestZone.name}]`);
    }
  }, [activePoint, assimilation]);

  // Distancia geodésica a la línea de costa para modulación marina dinámica
  const distCoastKm = useMemo(() => {
    const lat = activePoint?.lat ?? activeZone.lat;
    const lon = activePoint?.lon ?? activeZone.lon;
    const dLatKm = Math.max(0, (lat - 36.7125) * 111.32);
    const dLonKm = Math.max(0, (-4.4200 - lon) * 89.2 * 0.35);
    return Math.max(0.08, Math.hypot(dLatKm, dLonKm));
  }, [activePoint?.lat, activePoint?.lon, activeZone.lat, activeZone.lon]);

  // 1. Evaluación del PSS de Leighton
  const pssState = useMemo(() => {
    return evaluateExtendedPhotochemistry(currentTime, tempC, rhPct, no2Ppb, o3Ppb, noPpb, vocProxy, cloudCoverPct, pm25, windSpeed);
  }, [currentTime, tempC, rhPct, no2Ppb, o3Ppb, noPpb, vocProxy, cloudCoverPct, pm25, windSpeed]);

  const leightonData: LeightonData = useMemo(() => {
    const vocs = vocProxy * 15;
    const nox = noPpb + no2Ppb;
    const vocNox = nox > 0 ? vocs / nox : 0;
    
    return {
      no2_ppb: no2Ppb,
      no_ppb: noPpb,
      o3_ppb: o3Ppb,
      j_no2: pssState.jNo2SecMinus1,
      k3: pssState.k3PpbMin,
      ratio_leighton: pssState.extendedLeightonPhi,
      voc_ppb: vocs,
      voc_nox_ratio: vocNox,
      regimen_ozono: vocNox < 8 ? 'VOC-limitado' : 'NOx-limitado',
      isCortocircuito: pssState.extendedLeightonPhi > 1.1,
      rate_photolysis: pssState.ratePhotolysisPpbMin,
      rate_o3_formation: pssState.ratePhotolysisPpbMin, 
      rate_titration: pssState.rateTitrationPpbMin, 
      rate_ro2_shunt: pssState.rateShuntPpbMin,
      aod: pssState.aod,
      damkohlerNumber: pssState.damkohlerNumber,
      lat: activePoint?.lat ?? activeZone.lat,
      lon: activePoint?.lon ?? activeZone.lon,
      zona_malaga: activePoint?.streetName ? `${activePoint.streetName} (${activePoint.district})` : activeZone.name
    };
  }, [pssState, noPpb, no2Ppb, o3Ppb, vocProxy, activeZone, activePoint]);

  // 2. Modelo de Transferencia Radiativa Espectral SMARTS2 / TUV con presión barométrica e albedo dinámicos
  const spectralSimulation: SpectralSimulationOutput = useMemo(() => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    const szaDeg = Math.min(88, Math.max(10, Math.abs(13 - hours) * 11 + 18));
    const elevM = activePoint?.elevationM ?? 15;
    const dynamicPressureHpa = Number((1013.25 * Math.exp(-elevM / 8434.5)).toFixed(2));
    const dynamicAlbedo = activePoint?.isPedestrian ? 0.24 : 0.14 + 0.06 * svf;
    return computeSpectralRadiationAndPhotolysis({
      aod550: Math.max(0.05, pm25 * 0.015),
      angstromAlpha: 1.25 + 0.15 * Math.exp(-distCoastKm / 3.0),
      singleScatteringAlbedo: 0.90 + 0.04 * (rhPct / 100),
      asymmetryFactor: 0.66 + 0.05 * (rhPct / 100),
      hygroscopicFactor: 1 + (rhPct / 100) * 0.4,
      surfaceAlbedo: Number(dynamicAlbedo.toFixed(2)),
      solarZenithAngleDeg: szaDeg,
      temperatureC: tempC,
      pressureHpa: dynamicPressureHpa,
      totalOzoneDobson: Math.round(302 + 18 * Math.sin(((currentTime.getMonth() + 1 - 3) * Math.PI) / 6))
    });
  }, [currentTime, pm25, rhPct, tempC, activePoint?.elevationM, activePoint?.isPedestrian, svf, distCoastKm]);

  // 3. Simulación de Halógenos Costeros (ClNO2, BrO, Cl•) con decaimiento exponencial costero real
  const halogenParams: HalogenSimulationParameters = useMemo(() => {
    const marineDecay = Math.exp(-distCoastKm / 3.2);
    return {
      tempCelsius: tempC,
      relativeHumidity: rhPct,
      seaSaltAerosolSaUm2Cm3: Number(((95 + windSpeed * 28) * (0.35 + 0.65 * marineDecay)).toFixed(1)),
      chlorideMolarityMolL: Number((1.4 + 2.6 * marineDecay).toFixed(2)),
      nitrateMolarityMolL: Number((0.45 + 0.045 * no2Ppb).toFixed(2)),
      no2Ppb: no2Ppb,
      o3Ppb: o3Ppb,
      solarRadiationWM2: assimilation?.solarRadiationWm2 ?? Math.max(10, (1 - cloudCoverPct / 100) * 850 * Math.sin(Math.PI * Math.max(0, Math.min(1, (currentTime.getHours() - 6) / 14)))),
      isSunriseWindow: currentTime.getHours() >= 6 && currentTime.getHours() <= 10
    };
  }, [tempC, rhPct, windSpeed, no2Ppb, o3Ppb, cloudCoverPct, currentTime, distCoastKm, assimilation?.solarRadiationWm2]);

  const halogenResult: HalogenSimulationResult = useMemo(() => {
    return simulateCoastalHalogenKinetics(halogenParams);
  }, [halogenParams]);

  // 4. Diagnóstico de Régimen Fotoquímico EKMA (MCM v3.3.1) con COVs biogénicos (LAI) y antropogénicos (tráfico) reales
  const ekmaDiagnostics = useMemo(() => {
    const radWm2 = assimilation?.solarRadiationWm2 ?? Math.max(10, (1 - cloudCoverPct / 100) * 750);
    const lai = assimilation?.treeCanopyLai ?? 1.6;
    const dynamicBiogenicVocPpb = Number((6.5 * lai * Math.exp(0.07 * (tempC - 20))).toFixed(1));
    const trafficVehDay = activePoint?.trafficVehiclesDay ?? 14000;
    const dynamicAnthropogenicVocPpb = Number((4.5 + (trafficVehDay / 1800) * (1.2 - 0.4 * svf)).toFixed(1));
    return evaluatePhotochemicalRegime(
      currentTime,
      tempC,
      radWm2,
      no2Ppb,
      noPpb,
      o3Ppb,
      vocProxy * 25,
      dynamicBiogenicVocPpb,
      dynamicAnthropogenicVocPpb,
      cloudCoverPct
    );
  }, [currentTime, tempC, cloudCoverPct, no2Ppb, noPpb, o3Ppb, vocProxy, assimilation?.solarRadiationWm2, assimilation?.treeCanopyLai, activePoint?.trafficVehiclesDay, svf]);

  // 5. Equilibrio Termodinámico de Aerosoles Inorgánicos ISORROPIA-II acoplado a distancia costera y portuaria
  const isorropiaInputs: InorganicAerosolInput = useMemo(() => {
    const marineDecay = Math.exp(-distCoastKm / 3.5);
    return {
      tempCelsius: tempC,
      relativeHumidityPct: rhPct,
      totalAmmoniaUgm3: Number((2.1 + 0.08 * Math.max(0, tempC - 12) + 0.04 * no2Ppb).toFixed(2)),
      totalNitrateUgm3: Number(Math.max(1.0, no2Ppb * 0.21 + pm25 * 0.12).toFixed(2)),
      totalSulfateUgm3: Number((2.2 + 2.4 * marineDecay + pm25 * 0.09).toFixed(2)),
      totalSodiumUgm3: Number(((windSpeed * 0.85 + 0.8) * (0.3 + 0.7 * marineDecay)).toFixed(2)),
      totalChlorideUgm3: Number(((windSpeed * 1.35 + 1.1) * (0.3 + 0.7 * marineDecay)).toFixed(2))
    };
  }, [tempC, rhPct, no2Ppb, pm25, windSpeed, distCoastKm]);

  const isorropiaResult: IsorropiaEquilibriumResult = useMemo(() => {
    return solveIsorropiaEquilibrium(isorropiaInputs);
  }, [isorropiaInputs]);

  // Exportadores
  const handleDownloadCsv = () => {
    let csvStr = '';
    let filename = '';
    if (activeTab === 'ekma_regimes') {
      csvStr = exportPhotochemicalCsv(ekmaDiagnostics);
      filename = `ekma_regimes_malaga_${Date.now()}.csv`;
    } else if (activeTab === 'coastal_halogens') {
      csvStr = exportHalogenCsv(halogenResult);
      filename = `coastal_halogens_clno2_malaga_${Date.now()}.csv`;
    } else {
      csvStr = exportPssCsv(pssState);
      filename = `pss_leighton_malaga_${Date.now()}.csv`;
    }
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLatex = () => {
    let texStr = '';
    let filename = '';
    if (activeTab === 'ekma_regimes') {
      texStr = exportPhotochemicalLatex(ekmaDiagnostics);
      filename = `ekma_regimes_equations_${Date.now()}.tex`;
    } else if (activeTab === 'coastal_halogens') {
      texStr = exportHalogenLatex(halogenResult, halogenParams);
      filename = `coastal_halogens_equations_${Date.now()}.tex`;
    } else {
      texStr = exportPssLatex(pssState);
      filename = `pss_leighton_equation_${Date.now()}.tex`;
    }
    const blob = new Blob([texStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGeoJson = () => {
    const geojsonStr = exportHalogenGeoJson(halogenResult);
    const blob = new Blob([geojsonStr], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coastal_halogens_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Consola Unificada de Cinética y Mecanismos Químicos Atmosféricos"
      subtitle="Resolución Determinista ODEs · Leighton · Radicales · Halógenos · EKMA · Aerosoles VBS/ISORROPIA"
      icon={<Atom className="w-4 h-4 text-indigo-400" />}
      badge={
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 py-0.5 font-mono font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            UTC: {currentTime.toISOString().split('T')[1].split('.')[0]}
          </span>
          <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 px-1.5 py-0.5 font-mono font-bold flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            Asimilación Off-Thread: Leighton PSS
          </span>
        </div>
      }
      onClose={onClose}
      headerColorClass="text-indigo-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-6xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3 p-4 bg-[#0a0f18] text-slate-200">
        
        {/* REGLA 10: BANNER DE SINCRONIZACIÓN ATÓMICA DEL PUNTO ACTIVO */}
        <ActivePointSyncBanner compact={true} />

        {/* BARRA DE ASIMILACIÓN TELEMÉTRICA EN VIVO */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-sm gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Asimilación In Situ de Telemetría Oficial (Red CMAOT & AEMET)
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {ingestionSource ? (
                  <span className="text-emerald-400 font-bold">Fuente Activa: {ingestionSource}</span>
                ) : (
                  "Conectores activos: OpenAQ v3 (Junta de Andalucía), Open-Meteo & Copernicus CAMS"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-sm px-2 py-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
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

            <ScientificTooltip position="bottom" width="w-[320px]" content="Inyecta en un solo clic las mediciones reales de O3, NO2, NO, Temperatura, Humedad y Radiación registradas en tiempo real en la estación seleccionada de Málaga.">
              <button
                onClick={() => handleIngestLiveData()}
                disabled={isIngesting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 font-mono text-[10px] font-bold rounded-sm transition-all shadow-lg hover:shadow-emerald-900/40 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isIngesting ? 'animate-spin' : ''}`} />
                <span>{isIngesting ? "Inyectando Telemetría..." : "Asimilar Telemetría Oficial"}</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* SELECTOR DE SUBPESTAÑAS CIENTÍFICAS — Cinta Deslizante Continua (Opción 1 / Regla 22) */}
        <SlidingRibbonBar
          activeKey={activeTab}
          accent="indigo"
          ariaLabel="Subpestañas de Cinética Fotoquímica y Ciclo de Leighton"
          className="bg-slate-950 p-1.5 border border-slate-800 rounded-sm"
        >
          <ScientificTooltip
            title="1. Ciclo Fotoestacionario de Leighton & Fotólisis Espectral J(λ)"
            content="Resuelve el balance fotoestacionario PSS entre NO, NO2 y O3 mediante la integración espectral de actinometría SMARTS2/TUV (λ = 280 a 700 nm) y cinética Arrhenius k3(T)."
            formula={`\\phi = \\frac{J_{\\text{NO}_2} [\\text{NO}_2]}{k_3(T) [\\text{NO}] [\\text{O}_3]}`}
            regulatory="Directiva 2008/50/CE & Estándares IUPAC / JPL para fotoquímica urbana"
            citation="Leighton, P. A. (1961) Photochemistry of Air Pollution"
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'leighton_photolysis'}
              onClick={() => setActiveTab('leighton_photolysis')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'leighton_photolysis'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Leighton & J(λ)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="2. Capacidad Oxidativa Atmosférica & Radicales OH•, NO₃•, Cl•"
            content="Evalúa el presupuesto de detergentes atmosféricos: producción fotolítica de radicales hidroxilo [OH•], reservorios nocturnos de trióxido de nitrógeno [NO₃•] y ácido nitroso [HONO]."
            formula={`\\text{O}_3 + h\\nu(\\lambda < 320\\text{ nm}) \\rightarrow \\text{O}(^1\\text{D}) + \\text{O}_2, \\quad \\text{O}(^1\\text{D}) + \\text{H}_2\\text{O} \\rightarrow 2\\text{OH}^\\bullet`}
            regulatory="IUPAC Atmospheric Chemistry Data & Guías OMS"
            citation="Seinfeld & Pandis (2016) Atmospheric Chemistry and Physics"
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'radicals_oxidation'}
              onClick={() => setActiveTab('radicals_oxidation')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'radicals_oxidation'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Radicales OH/NO₃</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="3. Química Heterogénea Costera de Halógenos (ClNO₂ & Brisa de Alborán)"
            content="Mecanismo de activación de cloruro de nitrilo sobre el aerosol salino del Mar de Alborán (boyas REDCOS / Sentinel-3) y su impacto en la formación matinal de oxidantes."
            formula={`\\text{N}_2\\text{O}_5 + \\text{NaCl}_{(\\text{aq})} \\xrightarrow{\\gamma} \\text{ClNO}_2 + \\text{NaNO}_3, \\quad \\text{ClNO}_2 + h\\nu \\rightarrow \\text{Cl}^\\bullet + \\text{NO}_2`}
            regulatory="Química heterogénea marina de borde costero"
            citation="Thornton et al. (Nature 2010) & Roberts et al. (2009)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'coastal_halogens'}
              onClick={() => setActiveTab('coastal_halogens')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'coastal_halogens'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-teal-400" />
              <span>3. Halógenos ClNO₂</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="4. Isopletas Empíricas EKMA & Diagramas Ternarios de Sensibilidad"
            content="Diagramas EKMA (Empirical Kinetic Modeling Approach) y superficies ternarias de producción de ozono para clasificar el régimen de control urbano (VOC-limitado vs NOx-limitado)."
            formula={`\\frac{\\partial [\\text{O}_3]}{\\partial [\\text{NO}_x]} = 0 \\implies [\\text{NO}_x]_{\\text{ridge}}`}
            regulatory="Metodología de Planes de Calidad del Aire (EPA / MITECO)"
            citation="Dodge, M. C. (1977) & Sillman (1995)"
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'ekma_regimes'}
              onClick={() => setActiveTab('ekma_regimes')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'ekma_regimes'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>4. Regímenes EKMA</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="5. Aerosoles Secundarios Orgánicos (SOA VBS) & Inorgánicos (ISORROPIA-II)"
            content="Partición termodinámica gas-partícula basada en el modelo de volatilidad por bases (VBS de Donahue) y equilibrio inorgánico de sulfatos, nitratos y amonio ISORROPIA-II."
            formula={`\\xi_i = \\left(1 + \\frac{C_i^*}{C_{\\text{OA}}}\\right)^{-1}, \\quad \\text{ISORROPIA-II}(\\text{SO}_4^{2-}, \\text{NO}_3^-, \\text{NH}_4^+, \\text{Na}^+, \\text{Cl}^-)`}
            regulatory="Modelización de PM2.5 secundario EMEP/EEA Guidebook"
            citation="Donahue et al. (2006) ES&T & Fountoukis & Nenes (2007) ACP"
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'secondary_aerosols'}
              onClick={() => setActiveTab('secondary_aerosols')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'secondary_aerosols'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              <span>5. SOA VBS / SIA</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="6. Deposición Seca Multicapa de Wesely (1989) & Sumideros de Vegetación"
            content="Circuito de resistencias eléctricas aerodinámicas (ra), de subcapa cuasiturbulenta (rb) y estomática/foliar (rc) acoplado al inventario de arbolado de Málaga (Sentinel-2 LAI)."
            formula={`v_d = \\frac{1}{r_a + r_b + r_c}, \\quad r_c = \\left(\\frac{1}{r_{st} + r_m} + \\frac{1}{r_{lu}} + \\frac{1}{r_{dc} + r_{cl}} + \\frac{1}{r_{ac} + r_{gs}}\\right)^{-1}`}
            regulatory="Guía metodológica EMEP/MSC-W para deposición de contaminantes"
            citation="Wesely, M. L. (1989) Atmos. Environ."
            position="bottom"
            width="w-[340px]"
          >
            <button
              data-ribbon-active={activeTab === 'wesely_deposition'}
              onClick={() => setActiveTab('wesely_deposition')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'wesely_deposition'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-lime-400" />
              <span>6. Wesely (1989)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            title="7. Abatimiento Fotocatalítico de NOx por TiO₂ (3 Resistencias r_a+r_b+r_c & Ballari-Brouwers)"
            content="Cinética heterogénea en 2 pasos (NO → NO₂ → NO₃⁻) acoplada a la Ley de Tres Resistencias en Serie (r_a + r_b + r_c,TiO2), Número de Damköhler (Da), Química Costera (Cl⁻/Ca(NO₃)₂) y Cromatografía Iónica en las 8 actuaciones verificadas Grado A1 de Málaga (GMU / FYM La Araña / Breinco)."
            formula={`v_{\\text{dep,TiO}_2} = \\frac{1}{r_a + r_b + r_{c,\\text{TiO}_2}}, \\quad \\text{Da} = \\frac{r_a + r_b}{r_{c,\\text{TiO}_2}}`}
            regulatory="CEN/TS 16980-1 · ISO 22197-1 · Inventario Verificado Grado A1 GMU Málaga"
            citation="Kleffmann (2016); Gallus et al. (2015); Ballari & Brouwers (2013); Monge et al. (2010)"
            position="bottom"
            width="w-[360px]"
          >
            <button
              data-ribbon-active={activeTab === 'tio2_photocatalysis'}
              onClick={() => setActiveTab('tio2_photocatalysis')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'tio2_photocatalysis'
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>7. Fotocatálisis TiO₂</span>
            </button>
          </ScientificTooltip>
        </SlidingRibbonBar>

        {/* PANEL DE MONITOREO: TELEMETRÍA DETERMINISTA ASIMILADA IN SITU (CERO SIMULACIÓN FICTICIA) */}
        <div className="bg-slate-900/80 p-2.5 border border-slate-800 rounded-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800 text-[9.5px] font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>ASIMILACIÓN OBSERVACIONAL IN SITU (RED OFICIAL &amp; SATÉLITES • ZERO STOCHASTIC DATA)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[9px]">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                {ingestionSource || `ActivePoint • [${activePoint?.streetName || activeZone.name}]`}
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                🔒 Telemetría Bloqueada (No Simulador)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* 1. Temp */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[280px]" content="Temperatura ambiente (T_K). Modula la constante Arrhenius k₃(T) = 1.4×10⁻¹² · exp(-1310/T) y la partición Clausius-Clapeyron de aerosoles.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">Temp (°C)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-amber-400 font-bold">{tempC} °C</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, ((tempC - 5) / 40) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">5 – 45 °C</span>
            </div>

            {/* 2. Hum */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[280px]" content="Humedad Relativa (RH %). Modula la hidrólisis heterogénea nocturna de N₂O₅ y el equilibrio termodinámico de sales inorgánicas ISORROPIA-II.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">Hum (%)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-blue-400 font-bold">{rhPct} %</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, ((rhPct - 20) / 80) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">20 – 100 %</span>
            </div>

            {/* 3. NO2 */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[300px]" content="Dióxido de Nitrógeno [NO₂]. Especie fotoactiva fotolizada por radiación UV para generar monóxido de nitrógeno y átomos de oxígeno atómico O(³P).">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">NO₂ (ppb)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-indigo-400 font-bold">{no2Ppb} ppb</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, (no2Ppb / 100) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0 – 100 ppb</span>
            </div>

            {/* 4. O3 */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[300px]" content="Ozono Troposférico [O₃]. Oxidante fotoquímico secundario formado por ciclado fotoestacionario y consumido por titulación con NO en microescala urbana.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">O₃ (ppb)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-emerald-400 font-bold">{o3Ppb} ppb</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, (o3Ppb / 100) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0 – 100 ppb</span>
            </div>

            {/* 5. NO */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[300px]" content="Monóxido de Nitrógeno [NO]. Emisión vehicular directa de tubos de escape en Málaga. Responsable de la titulación local de ozono en cañones cerrados.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">NO (ppb)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-sky-400 font-bold">{noPpb} ppb</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, (noPpb / 60) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0 – 60 ppb</span>
            </div>

            {/* 6. VOC Proxy */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[300px]" content="Proxy de Reactividad de Compuestos Orgánicos Volátiles (VOCs). Genera radicales peróxido RO₂• que provocan el cortocircuito de Leighton (Φ > 1).">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">VOC Proxy</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-rose-400 font-bold">{vocProxy}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, (vocProxy / 4) * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0.1 – 4.0</span>
            </div>

            {/* 7. Nubes */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[280px]" content="Cobertura Nubosa (%). Modula la extinción del flujo actínico solar ultravioleta F(λ) y las frecuencias fotolíticas J_NO2 y J_O1D.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">Nubes (%)</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-slate-300 font-bold">{cloudCoverPct}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, cloudCoverPct))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0 – 100 %</span>
            </div>

            {/* 8. SVF */}
            <div className="flex flex-col gap-1 bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
              <div className="flex justify-between items-center">
                <ScientificTooltip position="top" width="w-[280px]" content="Sky View Factor (SVF). Fracción de cielo visible en el cañón urbano (ej. 0.35 en C/ Larios vs 0.85 en Alameda abierta). Modula la radiación difusa y fotólisis.">
                  <span className="text-[9px] text-slate-400 uppercase font-bold cursor-help">SVF Cañón</span>
                </ScientificTooltip>
                <span className="font-mono text-xs text-amber-300 font-bold">{svf.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, svf * 100))}%` }} />
              </div>
              <span className="text-[7.5px] font-mono text-slate-500 text-right">0.10 – 1.00</span>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN SUBPESTAÑA SELECCIONADA */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-sm p-3 shadow-xl min-h-[460px]">
          
          {/* 1. LEIGHTON & FOTÓLISIS ESPECTRAL */}
          {activeTab === 'leighton_photolysis' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-2/3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                        Equilibrio Fotoestacionario de Leighton (PSS Extendido)
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-slate-800 rounded font-mono text-[9px]">
                      <span className="text-slate-400">NO₂ Predicho PSS:</span>
                      <strong className="text-indigo-400">{pssState.predictedNo2Ppb.toFixed(1)} ppb</strong>
                    </div>
                  </div>
                  <LeightonCycleDiagram data={leightonData} />
                </div>

                <div className="w-full lg:w-1/3 flex flex-col gap-3">
                  <div className={`p-3 border rounded-sm ${!pssState.isNightChemistry ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800 bg-slate-900/40 opacity-60'}`}>
                    <h5 className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-2 border-b border-amber-900/50 pb-1">
                      <Sun className="w-3.5 h-3.5" /> Cinética Diurna PSS
                    </h5>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">J(NO₂) Espectral:</span>
                        <span className="text-amber-300 font-bold">{pssState.jNo2SecMinus1.toExponential(2)} s⁻¹</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">k₃(T) Arrhenius:</span>
                        <span className="text-amber-300 font-bold">{pssState.k3PpbMin} ppb⁻¹min⁻¹</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">Oxidante Total (O_x):</span>
                        <span className="text-emerald-300 font-bold">{pssState.oxTotalPpb} ppb</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ratio Leighton (Φ):</span>
                        <span className={`font-bold ${pssState.extendedLeightonPhi > 1 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {pssState.extendedLeightonPhi}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 border rounded-sm ${pssState.isNightChemistry ? 'border-indigo-500/50 bg-indigo-950/20' : 'border-slate-800 bg-slate-900/40 opacity-60'}`}>
                    <h5 className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1.5 mb-2 border-b border-indigo-900/50 pb-1">
                      <Moon className="w-3.5 h-3.5" /> Cinética Nocturna (N₂O₅)
                    </h5>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">Tasa k_NO₃:</span>
                        <span className="text-indigo-300 font-bold">{pssState.kNo3Formation} ppb⁻¹min⁻¹</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-400">Hidrólisis N₂O₅:</span>
                        <span className="text-indigo-300 font-bold">{pssState.n2o5HydrolysisRate} min⁻¹</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Número de Damköhler:</span>
                        <span className="text-cyan-300 font-bold">{pssState.damkohlerNumber.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODELO DE RADIACIÓN ESPECTRAL COMPLETO */}
              <div className="border border-slate-800 bg-slate-950 p-3 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Perfil de Transferencia Radiativa Espectral SMARTS2 / TUV (λ = 280 a 700 nm)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    J(NO₂) Integrado: <strong className="text-emerald-400">{spectralSimulation.summary.jNO2_s1.toExponential(3)} s⁻¹</strong>
                  </span>
                </div>
                <SpectralRadiationPhotolysisDiagram simulation={spectralSimulation} height={280} />
              </div>

              {/* 5 PILARES DETERMINISTAS DE MICROESCALA Y CINÉTICA DE NO2 (TESIS DOCTORAL) */}
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Cinética Microescalar Determinista de NO₂ (Punto Activo Asimilado)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {activePoint ? activePoint.name : 'Málaga Centro'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {/* 1. Partición Ox Primario/Secundario */}
                  <div className="p-2.5 bg-slate-950/80 border border-emerald-900/40 rounded-sm space-y-1">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold block">1. Partición Ox (Clapp & Jenkin)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-emerald-300">
                        {assimilation?.no2MicroscaleReport?.oxPartition.oxUgM3 ?? (no2Ppb * 1.88 + o3Ppb * 2.0).toFixed(1)} µg/m³
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        O_x Total
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/60 pt-1 flex justify-between">
                      <span>Primario: <strong className="text-amber-300">{assimilation?.no2MicroscaleReport?.oxPartition.primaryPercentage ?? 35}%</strong></span>
                      <span>Secundario: <strong className="text-cyan-300">{assimilation?.no2MicroscaleReport?.oxPartition.secondaryPercentage ?? 65}%</strong></span>
                    </div>
                  </div>

                  {/* 2. Sombra 3D Cañón J_NO2 */}
                  <div className="p-2.5 bg-slate-950/80 border border-amber-900/40 rounded-sm space-y-1">
                    <span className="text-[9px] font-mono text-amber-400 uppercase font-bold block">2. Sombra 3D Cañón (J_NO₂)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-amber-300">
                        -{assimilation?.no2MicroscaleReport?.canyonShading.attenuationPct ?? 32}%
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">Atenuación UV</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                      <span>H/W: <strong className="text-indigo-300">{assimilation?.no2MicroscaleReport?.canyonShading.aspectRatioHw ?? 1.2}</strong> • SVF: <strong className="text-slate-300">{assimilation?.skyViewFactorSvf ?? 0.45}</strong></span>
                    </div>
                  </div>

                  {/* 3. Halógenos Marinos ClNO2 */}
                  <div className="p-2.5 bg-slate-950/80 border border-teal-900/40 rounded-sm space-y-1">
                    <span className="text-[9px] font-mono text-teal-400 uppercase font-bold block">3. Halógenos Marinos (ClNO₂)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-teal-300">
                        {assimilation?.no2MicroscaleReport?.marineHalogens.clno2Ppb ?? 0.24} ppb
                      </span>
                      <span className="text-[9px] font-mono text-teal-400">
                        ×{assimilation?.no2MicroscaleReport?.marineHalogens.morningNoToNo2AccelerationFactor ?? 1.8} vel.
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                      <span>Burst matinal de radicales Cl• (Alborán)</span>
                    </div>
                  </div>

                  {/* 4. Sensibilidad Sillman Satelital */}
                  <div className="p-2.5 bg-slate-950/80 border border-purple-900/40 rounded-sm space-y-1">
                    <span className="text-[9px] font-mono text-purple-400 uppercase font-bold block">4. Sensibilidad Sillman (S5P)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-purple-300">
                        {assimilation?.no2MicroscaleReport?.sillmanSensitivity.ratioHchoNo2 ?? 0.76}
                      </span>
                      <span className="text-[9px] font-mono text-purple-400">HCHO / NO₂</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                      <span className="text-[8.5px] truncate block text-purple-200">
                        {assimilation?.no2MicroscaleReport?.sillmanSensitivity.regimeLabel ?? 'Régimen Limitado por COVs'}
                      </span>
                    </div>
                  </div>

                  {/* 5. Número de Damköhler Urbano */}
                  <div className="p-2.5 bg-slate-950/80 border border-cyan-900/40 rounded-sm space-y-1">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold block">5. Damköhler (Da = τ_t / τ_q)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-cyan-300">
                        Da = {assimilation?.no2MicroscaleReport?.damkohler.damkohlerNumber ?? 1.45}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400">
                        {assimilation?.no2MicroscaleReport?.damkohler.photochemicalEquilibriumPct ?? 76}% eq.
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                      <span>τ_res: <strong className="text-slate-300">{assimilation?.no2MicroscaleReport?.damkohler.tauTransportResSec ?? 48}s</strong> • τ_quím: <strong className="text-slate-300">{assimilation?.no2MicroscaleReport?.damkohler.tauChemicalRelaxSec ?? 35}s</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAPACIDAD OXIDATIVA Y RADICALES */}
          {activeTab === 'radicals_oxidation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Radical Hidroxilo [OH•]</span>
                  <span className="text-base font-mono font-bold text-cyan-300">
                    {((1.2e6 * (1 - cloudCoverPct / 100) * (svf / 0.5) * Math.max(0.1, (o3Ppb / 40)))).toExponential(2)} moléc/cm³
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Detergente atmosférico diurno principal</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Radical Nitrato [NO₃•]</span>
                  <span className="text-base font-mono font-bold text-indigo-300">
                    {(pssState.isNightChemistry ? (15.4 * (no2Ppb / 20) * (o3Ppb / 45)).toFixed(1) : '< 0.1')} ppt
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Oxidante nocturno dominante</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Radical Cloro [Cl•]</span>
                  <span className="text-base font-mono font-bold text-teal-300">
                    {halogenResult.clRadicalProductionFlux.toExponential(2)} moléc/(cm³·s)
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Fotólisis matinal de ClNO₂ marino</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ácido Nitroso [HONO]</span>
                  <span className="text-base font-mono font-bold text-amber-300">
                    {(0.85 * (no2Ppb / 25) * (rhPct / 60)).toFixed(2)} ppb
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Gatillo matinal de radicales OH•</span>
                </div>
              </div>

              <RadicalKineticsDiagram
                ohConcentrationMoleculesCm3={1.2e6 * (1 - cloudCoverPct / 100) * (svf / 0.5) * Math.max(0.1, (o3Ppb / 40))}
                no3ConcentrationPpt={pssState.isNightChemistry ? 15.4 * (no2Ppb / 20) : 0.05}
                clConcentrationMoleculesCm3={1.8e4 * (halogenResult.clno2YieldPhi / 0.8)}
                honoPpb={0.85 * (no2Ppb / 25) * (rhPct / 60)}
                clno2Ppt={halogenResult.clno2ProductionRatePptHour * 4.5}
                svf={svf}
                uvIndex={Math.max(0.1, (1 - cloudCoverPct / 100) * 7.5)}
                isDaytime={!pssState.isNightChemistry}
              />
            </div>
          )}

          {/* 3. HALÓGENOS COSTEROS Y SAL MARINA */}
          {activeTab === 'coastal_halogens' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-900/60 p-2 border border-slate-800 rounded-sm">
                <span className="text-xs font-mono font-bold text-teal-300 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-teal-400" />
                  Mecanismo Heterogéneo Litoral Bertram & Thornton (2009) · Bahía de Málaga
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Rendimiento Φ(ClNO₂): <strong className="text-teal-300 font-bold">{halogenResult.clno2YieldPhi.toFixed(3)}</strong>
                </span>
              </div>
              <CoastalHalogenProcessDiagram
                result={halogenResult}
                params={halogenParams}
                liveTelemetry={telemetryData}
                isIngesting={isIngesting}
                activeZone={activeZone}
                onSelectZone={setActiveZone}
                onRefreshLive={() => handleIngestLiveData()}
              />
            </div>
          )}

          {/* 4. REGÍMENES FOTOQUÍMICOS & EKMA O3/SOA */}
          {activeTab === 'ekma_regimes' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 border rounded-sm ${ekmaDiagnostics.regime === 'voc_limited' ? 'bg-rose-950/30 border-rose-600' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Régimen Fotoquímico O₃</span>
                  <span className={`text-base font-mono font-bold ${ekmaDiagnostics.regime === 'voc_limited' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {ekmaDiagnostics.regimeLabel}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">
                    Ratio VOC/NOx: <strong className="text-white font-bold">{ekmaDiagnostics.vocNoxRatio.toFixed(2)}</strong> (Transición Sillman ~ 5.5 - 8.0)
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sensibilidad Marginal d[O3]/d[NOx]</span>
                  <span className={`text-base font-mono font-bold ${ekmaDiagnostics.dO3_dNOx < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {ekmaDiagnostics.dO3_dNOx.toFixed(3)} ppb/ppb
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">
                    {ekmaDiagnostics.isTitrationParadoxActive ? '⚠️ Paradoja de Titración Activa' : '✓ Régimen Normal de Abatimiento'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Escenario ZBE (-20% NOx, -10% VOC)</span>
                  <span className="text-base font-mono font-bold text-indigo-300">
                    {ekmaDiagnostics.zbeScenario.deltaO3Ppb >= 0 ? `+${ekmaDiagnostics.zbeScenario.deltaO3Ppb.toFixed(1)}` : ekmaDiagnostics.zbeScenario.deltaO3Ppb.toFixed(1)} ppb ({ekmaDiagnostics.zbeScenario.deltaO3Pct >= 0 ? `+${ekmaDiagnostics.zbeScenario.deltaO3Pct.toFixed(1)}` : ekmaDiagnostics.zbeScenario.deltaO3Pct.toFixed(1)}%)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">
                    {ekmaDiagnostics.zbeScenario.technicalVerdict}
                  </span>
                </div>
              </div>

              {/* SELECTOR DE VISTA: DIAGRAMA TERNARIO VS ISOPLETAS 2D EKMA */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2 border border-slate-800 rounded-sm">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Visualización de Sensibilidad Fotoquímica:
                </span>

                <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
                  <ScientificTooltip position="bottom" width="w-[280px]" content="Representación en coordenadas baricéntricas de la partición fotoquímica entre precursores NOₓ, VOCs y oxidantes totales Oₓ.">
                    <button
                      onClick={() => setEkmaSubView('ternary')}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                        ekmaSubView === 'ternary'
                          ? 'bg-emerald-600 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Diagrama Ternario (NOₓ-VOC-Oₓ)
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[300px]" content="Diagrama clásico de isopletas de ozono (EKMA Dodge / US EPA) con cresta de máxima generación y frontera de transición Sillman.">
                    <button
                      onClick={() => setEkmaSubView('isopleths')}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                        ekmaSubView === 'isopleths'
                          ? 'bg-emerald-600 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Isopletas 2D (Dodge / EPA)
                    </button>
                  </ScientificTooltip>

                  <ScientificTooltip position="bottom" width="w-[280px]" content="Visualización simultánea del diagrama ternario baricéntrico y las curvas de isopletas 2D para análisis comparativo doctoral.">
                    <button
                      onClick={() => setEkmaSubView('dual')}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                        ekmaSubView === 'dual'
                          ? 'bg-emerald-600 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Comparativa Dual
                    </button>
                  </ScientificTooltip>
                </div>
              </div>

              {/* RENDERIZADO CONDICIONAL DE LOS DIAGRAMAS */}
              {ekmaSubView === 'ternary' && (
                <PhotochemicalTernaryDiagram
                  noxPpb={noPpb + no2Ppb}
                  vocPpbC={vocProxy * 25}
                  o3Ppb={o3Ppb}
                  no2Ppb={no2Ppb}
                  locationName={activeZone.name}
                />
              )}

              {ekmaSubView === 'isopleths' && (
                <OzoneEkmaDiagram
                  noxPpb={noPpb + no2Ppb}
                  vocPpbC={vocProxy * 25}
                  maxO3Ppb={Math.max(o3Ppb, 75)}
                  regime={ekmaDiagnostics.regime}
                  optimumRatio={ekmaDiagnostics.vocNoxRatio}
                />
              )}

              {ekmaSubView === 'dual' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <PhotochemicalTernaryDiagram
                    noxPpb={noPpb + no2Ppb}
                    vocPpbC={vocProxy * 25}
                    o3Ppb={o3Ppb}
                    no2Ppb={no2Ppb}
                    locationName={activeZone.name}
                  />
                  <OzoneEkmaDiagram
                    noxPpb={noPpb + no2Ppb}
                    vocPpbC={vocProxy * 25}
                    maxO3Ppb={Math.max(o3Ppb, 75)}
                    regime={ekmaDiagnostics.regime}
                    optimumRatio={ekmaDiagnostics.vocNoxRatio}
                  />
                </div>
              )}
            </div>
          )}

          {/* 5. AEROSOLES SECUNDARIOS (VBS SOA + ISORROPIA-II SIA) */}
          {activeTab === 'secondary_aerosols' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                      1. Aerosol Orgánico Secundario (SOA) · Volatility Basis Set (VBS)
                    </span>
                  </div>
                  <VbsPartitioningEquilibriumDiagram
                    airTempC={tempC}
                    totalCoa={pm25 * 0.45}
                    uvA={Math.max(1, (1 - cloudCoverPct / 100) * 45)}
                    bvocPrecursorPpb={vocProxy * 4.5}
                    avocPrecursorPpb={vocProxy * 6.2}
                  />
                </div>

                <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-400" />
                      2. Aerosol Inorgánico Secundario (SIA) · ISORROPIA-II
                    </span>
                  </div>
                  <IsorropiaPhaseDiagram
                    inputs={isorropiaInputs}
                    result={isorropiaResult}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. DEPOSICIÓN SECA MULTICAPA DE WESELY (1989) */}
          {activeTab === 'wesely_deposition' && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950 p-3 rounded-sm">
                <WeselyResistanceCircuitDiagram
                  parWm2={(1 - cloudCoverPct / 100) * 550}
                  airTempC={tempC}
                  rhPct={rhPct}
                  ustarMs={Math.max(0.1, windSpeed * 0.12)}
                  selectedSpecies="O3"
                />
              </div>

              {/* ENLACE DIRECTO AL MÓDULO INTEGRAL DE MICROFÍSICA DEL TERRAL Y DISRUPCIÓN ESTOMÁTICA */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-amber-600/60 rounded-sm">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-mono font-bold text-amber-300 uppercase">
                      Módulo Avanzado: Microfísica del Terral del Guadalhorce (Viento Foehn & VPD)
                    </h5>
                    <p className="text-[10px] text-slate-300">
                      Evaluación determinista del cierre estomático, colapso del sumidero biogénico de NO₂ y aceleración Arrhenius de Leighton.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => useUIStore.getState().setActiveModal('weselyDryDeposition:microfisica_terral')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-600 rounded-sm transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explorar Microfísica del Terral</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. FOTOCATÁLISIS HETEROGÉNEA TIO2 */}
          {activeTab === 'tio2_photocatalysis' && (
            <div className="space-y-3">
              <div className="bg-slate-900/90 border border-cyan-800/60 p-3 rounded-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>INVENTARIO VERIFICADO GRADO A1 EN MÁLAGA (8 ACTUACIONES GMU / UMA • 36.360 m² TiO₂)</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    0,2 % del viario tratado (Carretería-Álamos-Ollerías, Alameda <em>i.active CARGO®</em>, Soho <em>Breinco Air Clean®</em>, Lagunillas, Cobertizo del Conde, Santo Domingo y Fachada GRC Edificio Urban Teatinos) frente al 99,8 % de asfalto convencional SMA 11 y solería pétrea (C/ Marqués de Larios: mármol blanco de Macael sin TiO₂).
                  </p>
                </div>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-1 rounded font-bold">
                  Ley 3 Resistencias (r_a + r_b + r_c,TiO₂) • CEN/TS 16980-1
                </span>
              </div>
              <div className="border border-slate-800 bg-slate-950 p-3 rounded-sm">
                <Tio2PhotocatalyticDiagram
                  uvAIrradianceWm2={Math.max(5, (1 - cloudCoverPct / 100) * 45 * (svf / 0.5))}
                  rhPct={rhPct}
                  windSpeedMs={windSpeed}
                  temperatureC={tempC}
                  initialNoxUgm3={no2Ppb * 1.88}
                />
              </div>
            </div>
          )}

        </div>

        {/* PIE DE PÁGINA Y EXPORTACIÓN FAIR / LATEX */}
        <div className="flex flex-wrap justify-between items-center border-t border-slate-800 pt-3 gap-2">
          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Resolución analítica determinista y ODEs rígidas según estándares IUPAC/JPL & MCM v3.3.1 (Zero stochastic data).</span>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exporta las ecuaciones diferenciales ordinarias completas (ODEs) y el balance de masa en código fuente LaTeX listo para compilar en Overleaf o TeXStudio.">
              <button
                onClick={handleDownloadLatex}
                className="flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-[10px] px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Exportar LaTeX (ODEs de Tesis)
              </button>
            </ScientificTooltip>

            {activeTab === 'coastal_halogens' && (
              <ScientificTooltip position="top" width="w-[280px]" content="Descarga la capa espacial de los transectos de activación de ClNO2 en la Bahía de Málaga en formato estándar GeoJSON 3D para QGIS/ArcGIS.">
                <button
                  onClick={handleDownloadGeoJson}
                  className="flex items-center gap-1.5 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-700 text-[10px] px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" /> GeoJSON Litoral
                </button>
              </ScientificTooltip>
            )}

            <ScientificTooltip position="top" width="w-[280px]" content="Descarga el conjunto de datos cinéticos calculados en formato CSV bajo estándares abiertos de Ciencia Abierta (FAIR Data).">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] px-3 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" /> CSV FAIR
              </button>
            </ScientificTooltip>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
}
