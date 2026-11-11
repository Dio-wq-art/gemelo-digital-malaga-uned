import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Wind, Activity, ShieldCheck, Download, 
  RefreshCw, Sun, Compass, MapPin, Eye,
  AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Database,
  FileText, Droplet, Flame, ArrowUpRight, Scale, Info, CloudRain,
  Building2, Layers, Cpu, CornerUpRight, Zap, Triangle, Network, Box
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  computeFnoMicroscaleTurbulence,
  FnoSimulationParams
} from '../lib/fnoFourierNeuralOperator';
import { 
  simulateCoastalTiblCatabatic,
  CoastalTiblParameters
} from '../lib/coastalTiblCatabaticCoupling';
import { 
  simulateActinic3dPhotolysis,
  Actinic3dParameters
} from '../lib/actinic3dShadowPhotolysis';
import {
  defaultMalagaTinEngine,
  triangulateBuildingWithCourtyards,
  MALAGA_HISTORIC_BLOCKS_COURTYARD_SAMPLE,
  CourtyardBuildingFootprint
} from '../lib/tinAndEarcutSpatialEngine';

export interface Q1MicroscaleAtmosphericPhysicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambientTempC?: number;
  windSpeedMs?: number;
  relativeHumidity?: number;
  no2BaseUgm3?: number;
  o3BaseUgm3?: number;
  onFlyToLocation?: (lat: number, lon: number, zoom?: number, bearing?: number) => void;
}

export function Q1MicroscaleAtmosphericPhysicsModal({
  isOpen,
  onClose,
  ambientTempC = 24.5,
  windSpeedMs = 4.2,
  relativeHumidity = 62,
  no2BaseUgm3 = 28.4,
  o3BaseUgm3 = 52.1,
  onFlyToLocation
}: Q1MicroscaleAtmosphericPhysicsModalProps) {
  const activePointCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'fno' | 'tibl' | 'actinic' | 'tin_earcut' | 'dossier'>('fno');

  // Sincronización con el punto activo
  const activeStreet = activePointCtx?.activePoint?.nearestStreetName 
    || activePointCtx?.activePoint?.name 
    || (activePointCtx?.activePoint?.neighborhoodName ? `${activePointCtx.activePoint.neighborhoodName}, Málaga` : 'Calle Larios / Centro Histórico');
  
  const curLat = activePointCtx?.location?.lat ?? 36.7213;
  const curLon = activePointCtx?.location?.lon ?? -4.4214;
  const curNo2 = activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? no2BaseUgm3;
  const curO3 = activePointCtx?.assimilation?.ozoneO3UgM3 ?? o3BaseUgm3;
  const curTemp = activePointCtx?.assimilation?.temperatureC ?? ambientTempC;
  const curWind = activePointCtx?.assimilation ? (activePointCtx.assimilation.windSpeedKmh / 3.6) : windSpeedMs;
  const curRadiation = activePointCtx?.data?.shortwave_radiation ?? 620;

  // Parámetros interactivos 2.A: FNO 3D & Helmholtz-Hodge
  const [buildingHeightM, setBuildingHeightM] = useState<number>(22.0);
  const [canyonWidthM, setCanyonWidthM] = useState<number>(12.0);
  const [spectralModesK, setSpectralModesK] = useState<number>(24);
  const [windAngleDeg, setWindAngleDeg] = useState<number>(90); // 90° = transversal al cañón

  // Parámetros interactivos 2.B: TIBL & Drenaje Catabático
  const [distanceToCoastM, setDistanceToCoastM] = useState<number>(850);
  const [seaSurfaceTempC, setSeaSurfaceTempC] = useState<number>(21.5);
  const [sensibleHeatFluxWm2, setSensibleHeatFluxWm2] = useState<number>(180);
  const [catabaticActive, setCatabaticActive] = useState<boolean>(false);

  // Parámetros interactivos 2.C: Flujo Actínico 3D & Sombras
  const [solarZenithDeg, setSolarZenithDeg] = useState<number>(38);
  const [solarAzimuthDeg, setSolarAzimuthDeg] = useState<number>(180);
  const [streetOrientationDeg, setStreetOrientationDeg] = useState<number>(0); // 0 = Norte-Sur
  const [facadeAlbedo, setFacadeAlbedo] = useState<number>(0.35);

  // Parámetros interactivos 2.D: Mallas TIN (Delaunay) & Earcut OSM
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('MGA-BLQ-LARIOS-01');
  const [customBuildingHeight, setCustomBuildingHeight] = useState<number>(22.0);

  // 1. Simulación FNO Navier-Stokes
  const fnoResults = useMemo(() => {
    return computeFnoMicroscaleTurbulence({
      inletWindSpeedMs: curWind,
      windDirectionDeg: windAngleDeg,
      buildingHeightM,
      canyonWidthM,
      spectralModesK,
      pedestrianHeightM: 1.8
    });
  }, [curWind, windAngleDeg, buildingHeightM, canyonWidthM, spectralModesK]);

  // 2. Simulación TIBL & Catabático
  const tiblResults = useMemo(() => {
    return simulateCoastalTiblCatabatic({
      distanceInlandM: distanceToCoastM,
      landSurfaceTempC: curTemp,
      seaSurfaceTempC,
      windSpeedCoastMs: Math.max(1.0, curWind),
      windDirectionDeg: 180, // Brisa marina del Sur
      sensibleHeatFluxWm2: catabaticActive ? -25 : sensibleHeatFluxWm2,
      marineLapseRateKm: 0.006,
      isNocturnalCatabaticActive: catabaticActive
    });
  }, [distanceToCoastM, curTemp, seaSurfaceTempC, curWind, sensibleHeatFluxWm2, catabaticActive]);

  // 3. Simulación Actínica 3D
  const actinicResults = useMemo(() => {
    return simulateActinic3dPhotolysis({
      canyonWidthM,
      buildingHeightM,
      streetOrientationDeg,
      solarZenithAngleDeg: solarZenithDeg,
      solarAzimuthDeg,
      topOfCanopyRadiationWm2: curRadiation,
      facadeAlbedo,
      pavementAlbedo: 0.14,
      baseNo2Ppb: curNo2 / 1.88
    });
  }, [canyonWidthM, buildingHeightM, streetOrientationDeg, solarZenithDeg, solarAzimuthDeg, curRadiation, facadeAlbedo, curNo2]);

  // 4. Malla TIN Delaunay e Interpolación Baricéntrica (Delaunator)
  const tinInterpolation = useMemo(() => {
    return defaultMalagaTinEngine.interpolatePoint(curLon, curLat);
  }, [curLon, curLat]);

  const tinTriangles = useMemo(() => {
    return defaultMalagaTinEngine.getTriangles();
  }, []);

  // 5. Triangulación Earcut de Manzanas con Patios Interiores
  const currentBuilding = useMemo(() => {
    return MALAGA_HISTORIC_BLOCKS_COURTYARD_SAMPLE.find(b => b.buildingId === selectedBuildingId) 
      || MALAGA_HISTORIC_BLOCKS_COURTYARD_SAMPLE[0];
  }, [selectedBuildingId]);

  const earcutResult = useMemo(() => {
    return triangulateBuildingWithCourtyards({
      ...currentBuilding,
      heightM: customBuildingHeight
    });
  }, [currentBuilding, customBuildingHeight]);

  const handleExportTinGeoJSON = () => {
    const geoJson = defaultMalagaTinEngine.toGeoJson();
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `malla_tin_delaunay_malaga_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportación FAIR CSV
  const handleExportCSV = () => {
    const csvContent = [
      `# GEMELO DIGITAL MALAGA - FRONTERA Q1 EN FISICA Y DINAMICA ATMOSFERICA A MICROESCALA`,
      `# Punto Activo: ${activeStreet} (Lat: ${curLat.toFixed(5)}, Lon: ${curLon.toFixed(5)})`,
      `# Fecha: ${new Date().toISOString()}`,
      `# MODULO 2.A: FNO 3D NAVIER-STOKES Y VORTICIDAD SOLENOIDAL`,
      `xNorm,zNorm,u_ms,w_ms,VelMag_ms,Psi_m2s,OmegaY_s-1,TKE_m2s2`,
      ...fnoResults.streamlineGrid.map(pt => 
        `${pt.xNorm},${pt.zNorm},${pt.uVelocityMs},${pt.wVelocityMs},${pt.velocityMagnitudeMs},${pt.streamfunctionPsi},${pt.vorticityOmegaY},${pt.tkeM2S2}`
      ),
      ``,
      `# MODULO 2.B: TRANSECTO TIBL COSTERO (GARRATT & VENKATRAM)`,
      `Distancia_m,TIBL_h_m,MIBL_h_m,z0_m,uStar_ms,Confinamiento_pct,Zona`,
      ...tiblResults.transectProfile.map(s => 
        `${s.distanceInlandM},${s.tiblHeightM},${s.miblHeightM},${s.effectiveRoughnessZ0},${s.surfaceFrictionVelocityUstarMs},${s.plumeConfinementIndexPct},"${s.zoneLabel}"`
      ),
      ``,
      `# MODULO 2.C: TRANSECTO TRANSVERSAL DE FOTOLISIS 3D`,
      `xPos_m,EnSombra,SVF,F_Total_Wm2,J_NO2_s-1,J_HONO_s-1,Tau_NO2_s,dO3_dt_ppbh`,
      ...actinicResults.sidewalkTransect.map(st => 
        `${st.xPositionM},${st.isShaded},${st.skyViewFactor},${st.totalActinicFluxWm2},${st.jNo2PerSec},${st.jHonoPerSec},${st.no2PhotolyticLifetimeSec},${st.o3ProductionRatePpbH}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fisica_microescala_q1_malaga_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportación FAIR GeoJSON
  const handleExportGeoJSON = () => {
    const geoJson = {
      type: "FeatureCollection",
      metadata: {
        title: "Perfiles Físicos Microescalares de Málaga (Fronteras Q1)",
        source: "Gemelo Digital Informado por la Física - Tesis Doctoral",
        timestamp: new Date().toISOString(),
        physicsFormulations: [
          "Li et al. (2021) Fourier Neural Operator (FNO-3D)",
          "Helmholtz-Hodge Solenoidal Projection (div u = 0)",
          "Garratt (1990) & Venkatram (1977) Coastal TIBL",
          "Madronich (1987) 3D Actinic Shadow Photolysis"
        ]
      },
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [curLon, curLat] },
          properties: {
            receptorName: activeStreet,
            canyonHwRatio: fnoResults.canyonAspectHwRatio,
            flowRegime: fnoResults.flowRegimeLabel,
            maxVorticityS1: fnoResults.maxVorticityS1,
            recirculationVelocityMs: fnoResults.recirculationVelocityMs,
            pedestrianACH: fnoResults.pedestrianAirExchangeRateAch,
            tiblHeightM: tiblResults.tiblHeightAtReceptorM,
            fumigationRisk: tiblResults.fumigationRiskLevel,
            shadowCoverPct: actinicResults.shadowCoverPct,
            photolysisAsymmetryRatio: actinicResults.photolysisAsymmetryRatio
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perfil_fisico_q1_malaga_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="2. Frontera en Física Atmosférica y Dinámica a Microescala Q1 • FNO 3D • TIBL Costera • Fotólisis Actínica 3D"
      icon={<Wind className="w-4 h-4 text-sky-400" />}
      subtitle="Fronteras Q1 (JCP / Boundary-Layer Meteorol. / Nature Mach. Intell.) • Acoplamiento Mecanístico"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-5xl max-h-[88vh]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none">
        
        {/* Banner de Sincronización Atómica del Punto Activo (Regla 10) */}
        <ActivePointSyncBanner compact={true} />

        {/* Barra de Navegación con Tooltips Científicos */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-1.5">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <ScientificTooltip position="bottom" width="w-[300px]" content="Operadores Neuronales de Fourier 3D (FNO, Li et al. 2021) acoplados a proyección Helmholtz-Hodge (∇·u = 0) para resolver turbulencia en cañones urbanos a < 10 ms.">
              <button
                onClick={() => setActiveTab('fno')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'fno'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>2.A: FNO 3D &amp; Navier-Stokes Incompresible</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[320px]" content="Thermal Internal Boundary Layer (TIBL, Garratt 1990) inducida por el frente de brisa marina y drenaje catabático nocturno desde los Montes de Málaga.">
              <button
                onClick={() => setActiveTab('tibl')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'tibl'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>2.B: TIBL Costera &amp; Vientos Catabáticos</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Campo de radiación actínica 3D (Madronich 1987) resolviendo sombras arrojadas por cornisas y reflexión difusa en fachadas (albedo α).">
              <button
                onClick={() => setActiveTab('actinic')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'actinic'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>2.C: Campo Actínico 3D &amp; Sombras</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Mallas TIN topográficas (Delaunay/Delaunator) y triangulación volumétrica 3D Earcut de edificios OpenStreetMap en Málaga.">
              <button
                onClick={() => setActiveTab('tin_earcut')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'tin_earcut'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Triangle className="w-3.5 h-3.5 text-emerald-400" />
                <span>2.D: Malla TIN (Delaunay) &amp; Earcut 3D</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Memoria metodológica de física microescalar y exportación de datos FAIR en GeoJSON y CSV.">
              <button
                onClick={() => setActiveTab('dossier')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'dossier'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Dictamen Físico FAIR</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center space-x-1.5">
            <ScientificTooltip content="Exportar mallas de velocidad del viento, transectos TIBL y campos FNO en formato CSV citable bajo principios FAIR.">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Exportar geometrías de transectos microescalares y receptores en formato espacial estándar GeoJSON.">
              <button
                onClick={handleExportGeoJSON}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>GeoJSON</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Contenido de Pestañas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2.A: FNO 3D & HELMHOLTZ-HODGE                                 */}
          {/* ========================================================================= */}
          {activeTab === 'fno' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-sky-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-sky-950 border border-sky-800 text-sky-300">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-sky-200">
                      2.A: Operador Neuronal de Fourier (FNO-3D) con Proyección Incompresible de Helmholtz-Hodge (∇·u = 0)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • JCP / ICLR / Nature Mach. Intell. (2025/2026)
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  El FNO resuelve en el dominio espectral las ecuaciones de Navier-Stokes promediadas por Reynolds (RANS) en menos de 10 ms. Mediante la descomposición proyectiva de Helmholtz-Hodge (<strong>u_solenoidal = u - ∇Δ⁻¹(∇·u)</strong>), se garantiza la conservación estricta de masa (residuo de divergencia ~ 10⁻⁷), capturando la formación del vórtice de cavidad de Oke y la ventilación a cota de 1.8 m.
                </p>
              </div>

              {/* Controles FNO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Geometría &amp; Modos Espectrales</span>
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Altura Edificios (H):</span>
                      <span className="font-mono text-sky-300 font-bold">{buildingHeightM} m</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={45}
                      step={1}
                      value={buildingHeightM}
                      onChange={(e) => setBuildingHeightM(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Anchura Cañón (W):</span>
                      <span className="font-mono text-cyan-300 font-bold">{canyonWidthM} m</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={40}
                      step={1}
                      value={canyonWidthM}
                      onChange={(e) => setCanyonWidthM(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-400">H/W = {(buildingHeightM / canyonWidthM).toFixed(2)}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Modos de Fourier K:</span>
                      <span className="font-mono text-purple-300 font-bold">{spectralModesK} modos</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      step={8}
                      value={spectralModesK}
                      onChange={(e) => setSpectralModesK(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-400">Resolución de malla: {fnoResults.gridResolutionCm} cm</span>
                  </div>
                </div>

                {/* Métricas de Inferencia y Vórtice */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-sky-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Régimen de Flujo Oke (1988):</span>
                    <div className="text-sm font-mono font-bold text-sky-300">
                      {fnoResults.flowRegimeLabel}
                    </div>
                    <span className="text-[9px] text-slate-400">Vorticidad máxima: {fnoResults.maxVorticityS1} s⁻¹</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-emerald-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Velocidad Inferencia FNO:</span>
                    <div className="text-xl font-mono font-bold text-emerald-300">
                      {fnoResults.inferenceLatencyMs} <span className="text-xs text-slate-400">ms ({fnoResults.inferenceFps} FPS)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Residuo ∇·u: {fnoResults.divergenceResidualL2.toExponential(1)}</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Ventilación Peatonal (1.8m):</span>
                    <div className="text-xl font-mono font-bold text-amber-300">
                      {fnoResults.pedestrianVentilationVelocityMs} <span className="text-xs text-slate-400">m/s</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Recirculación en cavidad: {fnoResults.recirculationVelocityMs} m/s</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-indigo-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Tasa de Renovación (ACH):</span>
                    <div className="text-xl font-mono font-bold text-indigo-300">
                      {fnoResults.pedestrianAirExchangeRateAch} <span className="text-xs text-slate-400">renov/hora</span>
                    </div>
                    <span className="text-[9px] text-slate-400">TKE k = {fnoResults.tkeM2S2} m²/s²</span>
                  </div>
                </div>
              </div>

              {/* Visualizador Espectral del Vórtice de Cañón */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Campo Vectorial Solenoidal y Función de Corriente Ψ(x, z) [Malla Espectral 9×9]</span>
                  <span className="text-[9px] text-sky-400 font-mono">Conservación de Masa</span>
                </h4>
                
                <div className="grid grid-cols-9 gap-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                  {fnoResults.streamlineGrid.map((pt, idx) => (
                    <div 
                      key={idx} 
                      className="p-1 rounded bg-slate-900/60 border border-slate-800/80 text-[8px] font-mono text-center flex flex-col items-center justify-center"
                      title={`x=${pt.xNorm}, z=${pt.zNorm} | u=${pt.uVelocityMs} m/s, w=${pt.wVelocityMs} m/s | Ψ=${pt.streamfunctionPsi} m²/s`}
                    >
                      <span className="text-sky-300 font-bold">{pt.velocityMagnitudeMs}</span>
                      <span className="text-slate-400 text-[7px]">{pt.vorticityOmegaY > 0 ? `+${pt.vorticityOmegaY}` : pt.vorticityOmegaY}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>← Fachada Sotavento (Leeward)</span>
                  <span>Base Peatonal (z = 0m)</span>
                  <span>Fachada Barlovento (Windward) →</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2.B: TIBL COSTERA & CATABÁTICOS                                */}
          {/* ========================================================================= */}
          {activeTab === 'tibl' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-teal-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-teal-950 border border-teal-800 text-teal-300">
                      <Layers className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-teal-200">
                      2.B: Dinámica de la Capa Límite Térmica Interna Costera (TIBL) y Drenaje Catabático de los Montes
                    </h3>
                  </div>
                  <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • Boundary-Layer Meteorol. / Garratt (1990) &amp; Venkatram
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Al advectarse el aire marítimo sobre la trama urbana de Málaga, el salto de rugosidad (z₀ = 0.0002m → 1.2m) y el flujo de calor sensible generan una <strong>Capa Límite Térmica Interna (TIBL)</strong> en expansión parabólica. Si una pluma elevada (ej. buques en el Puerto) penetra en la TIBL, se produce <strong>fumigación costera crítica</strong>. De noche, el viento catabático descendente de los Montes de Málaga confina los contaminantes en una inversión térmica de &lt;70 m.
                </p>
              </div>

              {/* Controles TIBL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Parámetros Litorales &amp; Catabáticos</span>
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Distancia a la Línea de Costa:</span>
                      <span className="font-mono text-teal-300 font-bold">{distanceToCoastM} m</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={4500}
                      step={50}
                      value={distanceToCoastM}
                      onChange={(e) => setDistanceToCoastM(Number(e.target.value))}
                      className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">SST Mar de Alborán:</span>
                      <span className="font-mono text-cyan-300 font-bold">{seaSurfaceTempC.toFixed(1)} °C</span>
                    </div>
                    <input
                      type="range"
                      min={14.0}
                      max={26.0}
                      step={0.5}
                      value={seaSurfaceTempC}
                      onChange={(e) => setSeaSurfaceTempC(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-400">ΔT (Tierra - Mar) = {(curTemp - seaSurfaceTempC).toFixed(1)} °C</span>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={catabaticActive}
                        onChange={(e) => setCatabaticActive(e.target.checked)}
                        className="rounded accent-teal-500"
                      />
                      <span className="text-slate-200 font-medium">Activar Drenaje Catabático Nocturno (Montes)</span>
                    </label>
                  </div>
                </div>

                {/* Métricas TIBL */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-teal-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Altura TIBL Térmica h_i(x):</span>
                    <div className="text-xl font-mono font-bold text-teal-300">
                      {tiblResults.tiblHeightAtReceptorM} <span className="text-xs text-slate-400">m</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Capa mecánica h_m: {tiblResults.miblHeightAtReceptorM} m</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-rose-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Riesgo de Fumigación de Plumas:</span>
                    <div className={`text-sm font-bold uppercase ${
                      tiblResults.fumigationRiskLevel === 'critico_fumigacion' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {tiblResults.fumigationRiskLevel}
                    </div>
                    <span className="text-[9px] text-slate-400">{tiblResults.fumigationDescription}</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-cyan-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Viento Catabático (Montes):</span>
                    <div className="text-xl font-mono font-bold text-cyan-300">
                      {tiblResults.catabaticWindSpeedMs} <span className="text-xs text-slate-400">m/s</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Inversión térmica a {tiblResults.catabaticInversionHeightM} m</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-indigo-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Transición de Rugosidad:</span>
                    <div className="text-xl font-mono font-bold text-indigo-300">
                      z₀: 0.0002 → 1.2 <span className="text-xs text-slate-400">m</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Frenado aerodinámico urbano</span>
                  </div>
                </div>
              </div>

              {/* Transecto Litoral de la TIBL */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Transecto Costa-Interior: Crecimiento de la TIBL h_i(x) según Garratt &amp; Venkatram</span>
                  <span className="text-[9px] text-teal-400 font-mono">0 a 5.000 m</span>
                </h4>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {tiblResults.transectProfile.map(step => (
                    <div key={step.distanceInlandM} className="flex items-center justify-between bg-slate-950 p-1.5 rounded text-[10px] font-mono border border-slate-800/80">
                      <span className="text-teal-300 font-bold w-16">{step.distanceInlandM} m</span>
                      <span className="text-slate-300 w-36 truncate">{step.zoneLabel}</span>
                      <span className="text-cyan-400 font-bold">h_i = {step.tiblHeightM} m</span>
                      <span className="text-indigo-300">h_m = {step.miblHeightM} m</span>
                      <span className="text-amber-400 font-bold">{step.plumeConfinementIndexPct}% Confinado</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2.C: CAMPO ACTÍNICO 3D & SOMBRAS                              */}
          {/* ========================================================================= */}
          {activeTab === 'actinic' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-amber-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-amber-950 border border-amber-800 text-amber-300">
                      <Sun className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-amber-200">
                      2.C: Campo Micro-Radiativo Actínico 3D y Fotólisis Asimétrica con Sombras de Fachada
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • Atmos. Environ. / Madronich &amp; Kwok
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  La heterogeneidad 3D de las fachadas urbanas proyecta sombras que modulan radicalmente el flujo actínico total <strong>F_total = F_dir + F_diff·SVF + F_refl·(1-SVF)·albedo</strong>. Esto genera una marcada <strong>asimetría química transversal</strong>: en la acera soleada la fotólisis de NO₂ y HONO se dispara (disminuyendo el tiempo de vida τ_NO₂ a &lt;120 s y catalizando la formación de O₃), mientras que en la acera sombría el NO₂ se acumula sin fotodegradarse.
                </p>
              </div>

              {/* Controles de Fotólisis 3D */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Posición Solar &amp; Albedo</span>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Ángulo Cenital Solar (SZA):</span>
                      <span className="font-mono text-amber-300 font-bold">{solarZenithDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      step={2}
                      value={solarZenithDeg}
                      onChange={(e) => setSolarZenithDeg(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Albedo Medio Fachada:</span>
                      <span className="font-mono text-cyan-300 font-bold">{facadeAlbedo.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.10}
                      max={0.55}
                      step={0.05}
                      value={facadeAlbedo}
                      onChange={(e) => setFacadeAlbedo(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Orientación del Cañón:</span>
                      <span className="font-mono text-emerald-300 font-bold">{streetOrientationDeg}° (N-S)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={15}
                      value={streetOrientationDeg}
                      onChange={(e) => setStreetOrientationDeg(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>

                {/* Métricas Fotolíticas 3D */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">J(NO₂) Acera Soleada vs Sombra:</span>
                    <div className="text-base font-mono font-bold text-amber-300">
                      {actinicResults.sunnySidewalkJNo2PerSec} vs <span className="text-slate-400">{actinicResults.shadedSidewalkJNo2PerSec} s⁻¹</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Asimetría fotolítica: {actinicResults.photolysisAsymmetryRatio}×</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-indigo-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Cobertura de Sombra en Calzada:</span>
                    <div className="text-xl font-mono font-bold text-indigo-300">
                      {actinicResults.shadowCoverPct}% <span className="text-xs text-slate-400">({actinicResults.shadowLengthM} m)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Longitud transversal arrojada</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-cyan-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Tiempo de Vida τ(NO₂) al Sol:</span>
                    <div className="text-xl font-mono font-bold text-cyan-300">
                      {actinicResults.sunnyNo2LifetimeSec} <span className="text-xs text-slate-400">segundos</span>
                    </div>
                    <span className="text-[9px] text-slate-400">En sombra: {actinicResults.shadedNo2LifetimeSec} s</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-emerald-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Aceleración d[O₃]/dt al Sol:</span>
                    <div className="text-xl font-mono font-bold text-emerald-300">
                      +{actinicResults.sidewalkTransect[actinicResults.sidewalkTransect.length - 1]?.o3ProductionRatePpbH || 4.2} <span className="text-xs text-slate-400">ppb/h</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Régimen fotoquímico acera barlovento</span>
                  </div>
                </div>
              </div>

              {/* Transecto Transversal de Acera a Acera */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Transecto Transversal: Flujo Actínico Total, J(NO₂) y d[O₃]/dt de Fachada a Fachada</span>
                  <span className="text-[9px] text-amber-400 font-mono">11 Puntos a cota 1.8m</span>
                </h4>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {actinicResults.sidewalkTransect.map(st => (
                    <div 
                      key={st.xPositionM} 
                      className={`flex items-center justify-between p-1.5 rounded text-[10px] font-mono border ${
                        st.isShaded 
                          ? 'bg-slate-950/80 border-slate-800 text-slate-400' 
                          : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      }`}
                    >
                      <span className="font-bold w-14">{st.xPositionM} m {st.isShaded ? '🌑' : '☀️'}</span>
                      <span>SVF: {st.skyViewFactor}</span>
                      <span>F_act: <strong className={st.isShaded ? 'text-slate-300' : 'text-amber-300'}>{st.totalActinicFluxWm2}</strong> W/m²</span>
                      <span>J(NO₂): <strong className={st.isShaded ? 'text-slate-300' : 'text-cyan-300'}>{st.jNo2PerSec}</strong></span>
                      <span className="font-bold text-emerald-400">+{st.o3ProductionRatePpbH} ppb/h O₃</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2.D: MALLAS TIN DELAUNAY Y EARCUT 3D                            */}
          {/* ========================================================================= */}
          {activeTab === 'tin_earcut' && (
            <div className="space-y-4">
              {/* Encabezado Teórico-Científico */}
              <div className="bg-slate-900/90 border border-emerald-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      <Triangle className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-emerald-200">
                      Mallas Triangulares TIN (Delaunator) y Discretización de Manzanas con Patios (Earcut)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                    Topología Geométrica Exacta
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sustitución de mallas regulares raster por <strong>Redes Triangulares Irregulares (TIN Delaunay)</strong> para interpolación baricéntrica continua <strong>C⁰</strong> sin singularidades en la orografía de Málaga, acoplada a la triangulación <strong>Earcut</strong> de huellas urbanas con patios interiores para el cómputo exacto de áreas de deposición y cubiertas vegetales.
                </p>
              </div>

              {/* Grid 2 Columnas: TIN Delaunay (Izquierda) + Earcut Courtyards (Derecha) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Columna Izquierda: Delaunay TIN Interpolator */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Network className="w-3.5 h-3.5 text-sky-400" />
                      <span>Malla TIN Delaunay de Málaga ({tinTriangles.length} Triángulos)</span>
                    </div>
                    <button
                      onClick={handleExportTinGeoJSON}
                      className="flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>GeoJSON</span>
                    </button>
                  </div>

                  {/* Estado Baricéntrico del Punto Activo */}
                  <div className="p-2.5 rounded bg-slate-950 border border-sky-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Punto Activo Seleccionado:</span>
                      <strong className="text-sky-300 truncate max-w-[200px]">{activeStreet}</strong>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center font-mono">
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">λ₁ (Peso A)</span>
                        <span className="text-xs font-bold text-sky-300">{(tinInterpolation.weights[0] * 100).toFixed(1)}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">λ₂ (Peso B)</span>
                        <span className="text-xs font-bold text-sky-300">{(tinInterpolation.weights[1] * 100).toFixed(1)}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">λ₃ (Peso C)</span>
                        <span className="text-xs font-bold text-sky-300">{(tinInterpolation.weights[2] * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
                      <div className="flex justify-between bg-slate-900/60 p-1.5 rounded">
                        <span className="text-slate-400">NO₂ Baricéntrico:</span>
                        <strong className="text-amber-300">{tinInterpolation.interpolatedNO2.toFixed(1)} µg/m³</strong>
                      </div>
                      <div className="flex justify-between bg-slate-900/60 p-1.5 rounded">
                        <span className="text-slate-400">O₃ Baricéntrico:</span>
                        <strong className="text-emerald-300">{tinInterpolation.interpolatedO3.toFixed(1)} µg/m³</strong>
                      </div>
                      <div className="flex justify-between bg-slate-900/60 p-1.5 rounded">
                        <span className="text-slate-400">Cota MDE Estimada:</span>
                        <strong className="text-cyan-300">{tinInterpolation.interpolatedElevation.toFixed(0)} m s.n.m.</strong>
                      </div>
                      <div className="flex justify-between bg-slate-900/60 p-1.5 rounded">
                        <span className="text-slate-400">Gradiente |∇C|:</span>
                        <strong className="text-purple-300">{tinInterpolation.gradientMagnitude.toFixed(2)} µg/m³/km</strong>
                      </div>
                    </div>
                  </div>

                  {/* Lista Compacta de Triángulos TIN */}
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Nodos y Vértices de la Malla:</span>
                    {tinTriangles.map((tri, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-1.5 rounded text-[10px] font-mono border ${
                          tinInterpolation.triangleIndex === idx 
                            ? 'bg-sky-950/70 border-sky-500/80 text-sky-200 font-bold' 
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-12">Δ-{idx + 1} {tinInterpolation.triangleIndex === idx ? '🎯' : ''}</span>
                        <span className="truncate max-w-[180px]">{tri.nodes[0].name.split(' ')[0]} - {tri.nodes[1].name.split(' ')[0]} - {tri.nodes[2].name.split(' ')[0]}</span>
                        <span className="text-slate-300">{tri.areaKm2.toFixed(2)} km²</span>
                        <span className="text-amber-400">{((tri.nodes[0].no2BaseUgM3 + tri.nodes[1].no2BaseUgM3 + tri.nodes[2].no2BaseUgM3)/3).toFixed(1)} µg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Derecha: Earcut Manzanas con Patios */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Triangulación Earcut (Manzanas OSM con Patios)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      {earcutResult.triangleCount} Triángulos 3D
                    </span>
                  </div>

                  {/* Selector de Manzana */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="text-slate-400 font-mono block mb-1">Manzana Histórica:</label>
                      <select
                        value={selectedBuildingId}
                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {MALAGA_HISTORIC_BLOCKS_COURTYARD_SAMPLE.map(b => (
                          <option key={b.buildingId} value={b.buildingId}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-mono block mb-1">Altura de Cornisa H ({customBuildingHeight} m):</label>
                      <input
                        type="range"
                        min="12"
                        max="40"
                        step="0.5"
                        value={customBuildingHeight}
                        onChange={(e) => setCustomBuildingHeight(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Resultados de Geometría Earcut */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">Cubierta Neta (Sin Patios):</span>
                      <strong className="text-base text-emerald-300 font-bold">{earcutResult.roofAreaM2.toLocaleString()} m²</strong>
                      <span className="text-[8px] text-slate-500 block">Base transpirable calculada</span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">Área de Patios Descontada:</span>
                      <strong className="text-base text-amber-300 font-bold">{earcutResult.courtyardAreaM2.toLocaleString()} m²</strong>
                      <span className="text-[8px] text-slate-500 block">Agujeros triangulados (Holes)</span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">Fachadas Efectivas (Wesely):</span>
                      <strong className="text-base text-cyan-300 font-bold">{earcutResult.facadeAreaM2.toLocaleString()} m²</strong>
                      <span className="text-[8px] text-slate-500 block">Perímetro int. + ext. × H</span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">Potencial Cubiertas Verdes:</span>
                      <strong className="text-base text-purple-300 font-bold">{earcutResult.greenRoofPotentialM2.toLocaleString()} m²</strong>
                      <span className="text-[8px] text-slate-500 block">85% aprovechable libre</span>
                    </div>
                  </div>

                  {/* Justificación Científica para la Tesis */}
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 leading-snug">
                    <strong className="text-slate-300 block mb-0.5">Rigor Metodológico EIDUNED:</strong>
                    El algoritmo de <em>Ear Clipping</em> con curvas de Morton (Z-order) evita la sobreestimación de área de cubierta en edificios del centro histórico de Málaga al restar rigurosamente los huecos de patios de luces, proporcionando la base geométrica para el cálculo de sumideros biogénicos y deposición seca.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2.E: DICTAMEN CIENTÍFICO FAIR                                  */}
          {/* ========================================================================= */}
          {activeTab === 'dossier' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-purple-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-purple-950 border border-purple-800 text-purple-300">
                      <FileText className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-purple-200">
                      Dictamen de Tesis Doctoral: Síntesis de Dinámica y Física Microescalar Q1
                    </h3>
                  </div>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded font-mono font-bold">
                    Criterios FAIR • W3C PROV-O
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                  <p>
                    El presente módulo certifica la integración de la frontera metodológica en dinámica de fluidos y física microescalar dentro del Gemelo Digital de Málaga:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[10px]">
                    <li><strong>Módulo 2.A (FNO-3D &amp; Helmholtz-Hodge)</strong>: Solución instantánea (&lt;10 ms) del campo RANS con incompresibilidad estricta ∇·u = 0 y clasificación del régimen de Oke (1988).</li>
                    <li><strong>Módulo 2.B (TIBL Costera &amp; Vientos Catabáticos)</strong>: Crecimiento parabólico de la capa térmica interna (Garratt 1990) y confinamiento por brisas catabáticas nocturnas de los Montes de Málaga.</li>
                    <li><strong>Módulo 2.C (Campo Actínico 3D)</strong>: Asimetría fotolítica transversal inducida por sombras arrojadas de fachadas y albedo (Madronich 1987).</li>
                    <li><strong>Módulo 2.D (Mallas TIN Delaunay &amp; Earcut 3D)</strong>: Interpolación baricéntrica C⁰ libre de singularidades con Delaunator y discretización poligonal de manzanas con patios de luces mediante Ear Clipping.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Mallas y Perfiles Físicos (CSV)</span>
                </button>

                <button
                  onClick={handleExportTinGeoJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                >
                  <Triangle className="w-4 h-4" />
                  <span>Descargar Malla TIN Delaunay (GeoJSON)</span>
                </button>

                <button
                  onClick={handleExportGeoJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                >
                  <Database className="w-4 h-4" />
                  <span>Descargar Receptores Microescalares (GeoJSON)</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DraggableWindow>
  );
}
