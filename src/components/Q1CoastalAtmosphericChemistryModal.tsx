import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Atom, Waves, Sparkles, Activity, ShieldCheck, Download, 
  RefreshCw, Sun, Wind, HeartPulse, MapPin, Compass, Eye,
  AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Database,
  FileText, Droplet, Flame, ArrowUpRight, Scale, Info, CloudRain,
  Building2, Layers, TrendingUp, Zap, Clock, Orbit, Copy, Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  simulateCoastalHalogenKinetics, 
  calculateClNO2YieldPhi,
  calculateBertramThorntonGamma,
  CoastalHalogenPoint,
  MALAGA_COASTAL_HALOGEN_HOTSPOTS 
} from '../lib/coastalHalogenChemistry';
import { 
  simulateUrbanGrimeHono,
  UrbanGrimePoint,
  MALAGA_URBAN_GRIME_HOTSPOTS
} from '../lib/urbanGrimeHonoPhotolysis';
import { 
  simulateMarineInterfacialHalogens,
  MarineIodinePoint,
  MALAGA_BAY_IODINE_HOTSPOTS
} from '../lib/interfacialHalogenMarineIodine';
import { 
  simulateTaroFogAqueousSoa,
  TaroFogPoint,
  MALAGA_TARO_HOTSPOTS
} from '../lib/marineAdvectionFogAqSoa';
import { computeHomsAndUltrafines } from '../lib/homsAutoOxidation';
import { computeOxidativePotential } from '../lib/oxidativePotentialDTT';
import {
  solveCoastalNitratePartitioning,
  generateCoastalNitrateTransect,
  exportCoastalNitrateLatexTable,
  exportCoastalNitrateCsv,
  MALAGA_COASTAL_NITRATE_HOTSPOTS
} from '../lib/coastalSeaSaltNitrateThermodynamics';

export interface Q1CoastalAtmosphericChemistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambientTempC?: number;
  windSpeedMs?: number;
  relativeHumidity?: number;
  no2BaseUgm3?: number;
  o3BaseUgm3?: number;
  pm25BaseUgm3?: number;
  onFlyToLocation?: (lat: number, lon: number, zoom?: number, bearing?: number) => void;
}

export function Q1CoastalAtmosphericChemistryModal({
  isOpen,
  onClose,
  ambientTempC = 24.5,
  windSpeedMs = 4.2,
  relativeHumidity = 62,
  no2BaseUgm3 = 28.4,
  o3BaseUgm3 = 52.1,
  pm25BaseUgm3 = 14.8,
  onFlyToLocation
}: Q1CoastalAtmosphericChemistryModalProps) {
  const activePointCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<'honoGrime' | 'halogens' | 'taroFog' | 'homsOp' | 'seaSaltNitrate' | 'dossier'>('honoGrime');

  // Sincronización con el punto geográfico activo
  const activeStreet = activePointCtx?.activePoint?.nearestStreetName 
    || activePointCtx?.activePoint?.name 
    || (activePointCtx?.activePoint?.neighborhoodName ? `${activePointCtx.activePoint.neighborhoodName}, Málaga` : 'Calle Larios / Centro Histórico');
  
  const curLat = activePointCtx?.location?.lat ?? 36.7213;
  const curLon = activePointCtx?.location?.lon ?? -4.4214;
  const curNo2 = activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? no2BaseUgm3;
  const curO3 = activePointCtx?.assimilation?.ozoneO3UgM3 ?? o3BaseUgm3;
  const curPm25 = activePointCtx?.assimilation?.pm25UgM3 ?? pm25BaseUgm3;
  const curTemp = activePointCtx?.assimilation?.temperatureC ?? ambientTempC;
  const curWind = activePointCtx?.assimilation ? (activePointCtx.assimilation.windSpeedKmh / 3.6) : windSpeedMs;
  const curRelHum = activePointCtx?.assimilation?.relativeHumidityPct ?? relativeHumidity;
  const curRadiation = activePointCtx?.data?.shortwave_radiation ?? 640;

  // Parámetros interactivos deterministas - Sub-módulo 1.A: Grime Urbano & HONO
  const [canyonHwRatio, setCanyonHwRatio] = useState<number>(2.2);
  const [skyViewFactor, setSkyViewFactor] = useState<number>(0.32);
  const [grimeNitrateLoading, setGrimeNitrateLoading] = useState<number>(45.0); // µmol/m²
  const [facadeOrganicFraction, setFacadeOrganicFraction] = useState<number>(0.42);
  const [selectedGrimeSpotId, setSelectedGrimeSpotId] = useState<string>('calle_larios');

  // Parámetros interactivos deterministas - Sub-módulo 1.B: Halógenos Marinos ClNO2 / I2 / HIO3
  const [halogenSubTab, setHalogenSubTab] = useState<'diurnalKinetics' | 'breezeTrafficCoupling' | 'vocReactivityTable' | 'receptorsHotspots'>('diurnalKinetics');
  const [seaSaltSa, setSeaSaltSa] = useState<number>(380); // µm²/cm³
  const [chlorideMolarity, setChlorideMolarity] = useState<number>(1.85); // mol/L
  const [nitrateMolarity, setNitrateMolarity] = useState<number>(0.45); // mol/L
  const [iodideNm, setIodideNm] = useState<number>(85.0); // nM
  const [selectedHalogenSpotId, setSelectedHalogenSpotId] = useState<string>('muelle_uno');
  
  // Parámetros de Acoplamiento Brisa Marina vs. Tráfico (Eje 3 Tesis Doctoral)
  const [breezeSpeedMs, setBreezeSpeedMs] = useState<number>(3.8); // m/s (Brisa diurna de mar a tierra)
  const [terralSpeedMs, setTerralSpeedMs] = useState<number>(2.4); // m/s (Terral nocturno catabático de tierra a mar)
  const [landBreezeDurationH, setLandBreezeDurationH] = useState<number>(7.5); // h (Duración nocturna del transporte offshore)
  const [seaBreezeDurationH, setSeaBreezeDurationH] = useState<number>(8.5); // h (Duración diurna de penetración onshore)
  const [coastalTrafficNoxPpb, setCoastalTrafficNoxPpb] = useState<number>(42.0); // ppb NOx vehicular en fachada litoral
  const [distanceToShoreM, setDistanceToShoreM] = useState<number>(320); // m distancia del receptor al mar

  // Parámetros interactivos deterministas - Sub-módulo 1.C: Nieblas de Advección Litoral (Taró) & aqSOA
  const [taroLwc, setTaroLwc] = useState<number>(0.35); // g/m³
  const [taroDropRadius, setTaroDropRadius] = useState<number>(11.0); // µm
  const [glyoxalPpb, setGlyoxalPpb] = useState<number>(0.45); // ppb
  const [transitionMetalsNgM3, setTransitionMetalsNgM3] = useState<number>(85.0); // ng/m³ Fe + Cu
  const [selectedTaroSpotId, setSelectedTaroSpotId] = useState<string>('puerto_muelle_heredia');

  // Parámetros interactivos deterministas - Sub-módulo 1.D: HOMs & OP^DTT
  const [alphaPinenePpb, setAlphaPinenePpb] = useState<number>(1.55); // ppb
  const [brakeCuNgM3, setBrakeCuNgM3] = useState<number>(36.5); // ng/m³
  const [exhaustFeNgM3, setExhaustFeNgM3] = useState<number>(115.0); // ng/m³
  const [organicCarbonUgm3, setOrganicCarbonUgm3] = useState<number>(2.6); // µg/m³
  const [distanceToIntersectionM, setDistanceToIntersectionM] = useState<number>(20);

  // Parámetros interactivos deterministas - Sub-módulo 1.E: Termodinámica de Aerosol Marino & Partición Gas-Partícula (Pilar A Tesis)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('muelle_uno');
  const [customCoastDistanceM, setCustomCoastDistanceM] = useState<number>(280);
  const [baseSeaSaltNaClUgm3, setBaseSeaSaltNaClUgm3] = useState<number>(11.2);
  const [coastalScenarioPreset, setCoastalScenarioPreset] = useState<'asimilado' | 'levante' | 'terral' | 'inversion'>('asimilado');
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);

  // 1. Simulación Cinética Grime Urbano & HONO
  const grimeHonoResults = useMemo(() => {
    return simulateUrbanGrimeHono({
      tempCelsius: curTemp,
      relativeHumidityPct: curRelHum,
      solarRadiationWm2: curRadiation,
      no2PedestrianUgm3: curNo2,
      canyonHwRatio,
      skyViewFactor,
      grimeNitrateLoadingUmolM2: grimeNitrateLoading,
      facadeOrganicFraction,
      surfaceRoughnessZ0: 1.2
    });
  }, [curTemp, curRelHum, curRadiation, curNo2, canyonHwRatio, skyViewFactor, grimeNitrateLoading, facadeOrganicFraction]);

  // 2. Simulación Cinética ClNO2 + Yodo Interfacial
  const halogenResults = useMemo(() => {
    return simulateCoastalHalogenKinetics({
      tempCelsius: curTemp,
      relativeHumidity: curRelHum,
      seaSaltAerosolSaUm2Cm3: seaSaltSa,
      chlorideMolarityMolL: chlorideMolarity,
      nitrateMolarityMolL: nitrateMolarity,
      no2Ppb: curNo2 / 1.88,
      o3Ppb: curO3 / 2.0,
      solarRadiationWM2: curRadiation,
      isSunriseWindow: true
    });
  }, [curTemp, curRelHum, seaSaltSa, chlorideMolarity, nitrateMolarity, curNo2, curO3, curRadiation]);

  const marineIodineResults = useMemo(() => {
    return simulateMarineInterfacialHalogens({
      seaSurfaceTempC: 22.0,
      seaSalinityPsu: 37.2,
      iodideConcentrationNm: iodideNm,
      ozoneGasPpb: curO3 / 2.0,
      windSpeedMs: curWind,
      solarRadiationWm2: curRadiation,
      no2GasPpb: curNo2 / 1.88
    });
  }, [iodideNm, curO3, curWind, curRadiation, curNo2]);

  // 3. Simulación Niebla de Advección Litoral (Taró) & aqSOA
  const taroResults = useMemo(() => {
    return simulateTaroFogAqueousSoa({
      liquidWaterContentGm3: taroLwc,
      dropletRadiusUm: taroDropRadius,
      ambientTempC: Math.min(curTemp, 18.5),
      relativeHumidityPct: 98.0,
      glyoxalGasPpb: glyoxalPpb,
      methylglyoxalGasPpb: glyoxalPpb * 0.4,
      ammoniumSulfateLoadingUgm3: 4.8,
      transitionMetalsFeCuNgM3: transitionMetalsNgM3,
      solarRadiationWm2: Math.max(10, curRadiation * 0.15)
    });
  }, [taroLwc, taroDropRadius, curTemp, glyoxalPpb, transitionMetalsNgM3, curRadiation]);

  // 4. Simulación Auto-oxidación HOMs y OP^DTT
  const homsResults = useMemo(() => {
    return computeHomsAndUltrafines({
      alphaPinenePpb,
      ozonePpb: curO3 / 2.0,
      temperatureC: curTemp,
      relHumidityPct: curRelHum,
      sunlightRadWm2: curRadiation
    });
  }, [alphaPinenePpb, curO3, curTemp, curRelHum, curRadiation]);

  const opResults = useMemo(() => {
    return computeOxidativePotential({
      pm25ConcentrationUgm3: curPm25,
      brakeWearCuNgM3: brakeCuNgM3,
      exhaustFeNgM3: exhaustFeNgM3,
      organicCarbonUgm3,
      distanceToIntersectionM
    });
  }, [curPm25, brakeCuNgM3, exhaustFeNgM3, organicCarbonUgm3, distanceToIntersectionM]);

  // 5. Simulación Termodinámica de Aerosol Marino y Partición Gas-Partícula (Pilar A Tesis)
  const currentSimTemp = useMemo(() => {
    if (coastalScenarioPreset === 'levante') return 22.0;
    if (coastalScenarioPreset === 'terral') return 40.5;
    if (coastalScenarioPreset === 'inversion') return 11.5;
    return curTemp;
  }, [coastalScenarioPreset, curTemp]);

  const currentSimRh = useMemo(() => {
    if (coastalScenarioPreset === 'levante') return 78.0;
    if (coastalScenarioPreset === 'terral') return 16.0;
    if (coastalScenarioPreset === 'inversion') return 84.0;
    return curRelHum;
  }, [coastalScenarioPreset, curRelHum]);

  const seaSaltResults = useMemo(() => {
    return solveCoastalNitratePartitioning({
      temperatureC: currentSimTemp,
      relativeHumidityPct: currentSimRh,
      ambientNo2Ugm3: curNo2,
      ambientO3Ugm3: curO3,
      solarRadiationWm2: curRadiation,
      distanceToCoastlineM: customCoastDistanceM,
      baseNaClUgm3: baseSeaSaltNaClUgm3
    });
  }, [currentSimTemp, currentSimRh, curNo2, curO3, curRadiation, customCoastDistanceM, baseSeaSaltNaClUgm3]);

  const coastalTransect = useMemo(() => {
    return generateCoastalNitrateTransect(currentSimTemp, currentSimRh, curNo2, curRadiation);
  }, [currentSimTemp, currentSimRh, curNo2, curRadiation]);

  const handleCopyLatexTable = () => {
    const tableLatex = exportCoastalNitrateLatexTable(coastalTransect, currentSimTemp);
    navigator.clipboard.writeText(tableLatex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  const handleDownloadLatexTable = () => {
    const tableLatex = exportCoastalNitrateLatexTable(coastalTransect, currentSimTemp);
    const blob = new Blob([tableLatex], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tabla_termodinamica_nitratos_malaga_${Date.now()}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportación FAIR Integral en formato CSV
  const handleExportCSV = () => {
    const csvContent = [
      `# GEMELO DIGITAL MALAGA - FRONTERA Q1 EN QUIMICA ATMOSFERICA MULTIFASICA URBANO-COSTERA`,
      `# Punto Activo: ${activeStreet} (Lat: ${curLat.toFixed(5)}, Lon: ${curLon.toFixed(5)})`,
      `# Fecha: ${new Date().toISOString()}`,
      `# MODULO 1.A: FOTOLISIS DE GRIME URBANO Y PRESUPUESTO DE HONO`,
      `Hora,Rad_Solar_Wm2,J_HONO_s-1,HONO_ppb,NO2_ppb,P_OH_HONO_10e6,P_OH_O3_10e6,HONO_Share_Pct,Renox_ugm3h`,
      ...grimeHonoResults.diurnalProfile.map(s => 
        `${s.hour},${s.solarRadiationWm2},${s.jHonoPerSec},${s.honoConcentrationPpb},${s.no2ConcentrationPpb},${s.ohProductionFromHono10e6},${s.ohProductionFromO3_10e6},${s.honoContributionToOhPct},${s.renoxificationRateUgm3H}`
      ),
      ``,
      `# MODULO 1.B: QUIMICA INTERFACIAL DE HALOGENOS MARINOS (I2, HOI, ClNO2)`,
      `Parametro,Valor,Unidades`,
      `FlujoInterfacialHOI,${marineIodineResults.hoiSurfaceFluxMolecCm2S},molec/(cm2 s)`,
      `FlujoInterfacialI2,${marineIodineResults.i2SurfaceFluxMolecCm2S},molec/(cm2 s)`,
      `EmisionTotalYodo,${marineIodineResults.totalIodineFluxGramsKm2Day},g I/(km2 dia)`,
      `ConcentracionIO_EstadoEstacionario,${marineIodineResults.steadyStateIOPpt},ppt`,
      `TasaNucleacionHIO3_J1,${marineIodineResults.nucleationRateJ1Cm3S},cm-3 s-1`,
      `DestruccionCataliticaO3,${marineIodineResults.catalyticOzoneLossPpbDay},ppb/dia`,
      `ClNO2_AcumuladoAmanecer,${halogenResults.clno2ProductionRatePptHour},ppt/h`,
      ``,
      `# MODULO 1.C: PROCESAMIENTO ACUOSO EN NIEBLA ADVECCION (TARO) Y aqSOA / BrC`,
      `Parametro,Valor,Unidades`,
      `LWC_Niebla,${taroLwc},g/m3`,
      `ConstanteHenryGlioxal,${taroResults.glyoxalHenryEffectiveMatm},M/atm`,
      `TasaProduccion_aqSOA,${taroResults.aqSoaFormationRateUgm3Hour},ug/(m3 h)`,
      `ProduccionAcidoOxalico,${taroResults.oxalicAcidProductionUgm3Hour},ug/(m3 h)`,
      `AbsorcionBrownCarbon_MAC365,${taroResults.brownCarbonMac365M2G},m2/g`,
      `GananciaNetaPM25_PostEvaporacion,${taroResults.postFogEvaporationPm25GainUgm3},ug/m3`,
      ``,
      `# MODULO 1.D: AUTO-OXIDACION HOMs Y POTENCIAL OXIDATIVO OP^DTT`,
      `Parametro,Valor,Unidades`,
      `ELVOC_Concentracion,${homsResults.elvocConcentrationUgm3},ug/m3`,
      `NucleacionHOMs_J1,${homsResults.nucleationRateJ1Cm3S},cm-3 s-1`,
      `OP_DTT_Volumen,${opResults.opDttVolumeNormNmolMinM3},nmol DTT/(min m3)`,
      `OP_DTT_Masa,${opResults.opDttMassNormPmolMinUg},pmol DTT/(min ug PM2.5)`,
      `OP_AA_AcidoAscorbico,${opResults.opAaAscorbicAcidNormNmolMinM3},nmol AA/(min m3)`,
      `RiesgoCelular,${opResults.cellOxidativeStressRisk},-`,
      ``,
      `# MODULO 1.E: TERMODINAMICA AEROSOL MARINO NaCl-HNO3 & PARTICION DE NITRATO`,
      `Parametro,Valor,Unidades`,
      `TemperaturaSimulada,${currentSimTemp},C`,
      `HumedadRelativaSimulada,${currentSimRh},%`,
      `DistanciaCosta,${customCoastDistanceM},m`,
      `NaCl_Efectivo,${seaSaltResults.effectiveNaClUgm3},ug/m3`,
      `NaNO3_Formado_NoVolatil,${seaSaltResults.sodiumNitrateUgm3},ug/m3`,
      `NH4NO3_Formado_Volatil,${seaSaltResults.ammoniumNitrateUgm3},ug/m3`,
      `HNO3_Gas_Residual,${seaSaltResults.sizeDistribution.hno3GasUgm3},ug/m3`,
      `HCl_Gas_Liberado,${seaSaltResults.sizeDistribution.hclGasReleasedUgm3},ug/m3`,
      `Chloride_Depletion_Pct,${seaSaltResults.chlorideDepletionPct},%`,
      `Epsilon_Partitioning,${seaSaltResults.partitioningFractionEpsilon},-`,
      `Kp_AmmoniumNitrate,${seaSaltResults.kpAmmoniumNitratePpb2},ppb2`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quimica_q1_atmosferica_malaga_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportación FAIR en formato GeoJSON de Receptores
  const handleExportGeoJSON = () => {
    const geoJson = {
      type: "FeatureCollection",
      metadata: {
        title: "Receptores Litorales y de Cañón Urbano de Málaga (Fronteras Q1)",
        source: "Gemelo Digital Informado por la Física - Tesis Doctoral",
        timestamp: new Date().toISOString(),
        chemicalFormulations: [
          "Donaldson & George (2014) Urban Surface Grime Nitrate Photolysis",
          "Carpenter et al. (2013) & Saiz-Lopez (2014) Marine Interfacial Halogens",
          "Ervens et al. (2011) Taro Advection Fog Aqueous SOA (aqSOA)",
          "Bertram & Thornton (2009) ClNO2 Yield",
          "Ehn et al. (2014) Monoterpene Autoxidation (HOMs)",
          "Bates et al. (2019) Oxidative Potential OP^DTT"
        ]
      },
      features: [
        ...grimeHonoResults.malagaHotspots.map(spot => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [spot.lon, spot.lat] },
          properties: {
            category: "Urban Grime / HONO",
            id: spot.id,
            name: spot.name,
            district: spot.district,
            canyonHwRatio: spot.canyonHwRatio,
            skyViewFactor: spot.skyViewFactor,
            grimeNitrateLoadingUmolM2: spot.grimeNitrateLoadingUmolM2,
            daytimeHonoPpb: spot.daytimeHonoPpb,
            morningOhRadicalYieldPct: spot.morningOhRadicalYieldPct,
            facadeType: spot.facadeType
          }
        })),
        ...marineIodineResults.malagaBayHotspots.map(spot => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [spot.lon, spot.lat] },
          properties: {
            category: "Marine Halogen / Iodine",
            id: spot.id,
            name: spot.name,
            iodideMolarityNm: spot.iodideMolarityNm,
            steadyStateIOPpt: spot.steadyStateIOPpt,
            hio3NucleationRateJ1Cm3S: spot.hio3NucleationRateJ1Cm3S,
            ozoneDestructionRatePpbDay: spot.ozoneDestructionRatePpbDay,
            description: spot.description
          }
        })),
        ...taroResults.malagaTaroHotspots.map(spot => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [spot.lon, spot.lat] },
          properties: {
            category: "Taro Fog / aqSOA",
            id: spot.id,
            name: spot.name,
            fogFrequencyDaysPerYear: spot.fogFrequencyDaysPerYear,
            aqSoaYieldUgm3Hour: spot.aqSoaYieldUgm3Hour,
            brownCarbonMac365M2G: spot.brownCarbonMac365M2G,
            pm25MassEnhancementPct: spot.pm25MassEnhancementPct,
            description: spot.description
          }
        }))
      ]
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receptores_quimica_q1_malaga_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="1. Frontera en Química Atmosférica Multifásica Urbana-Costera Q1 • Grime &amp; HONO • Halógenos Marinos • Taró &amp; aqSOA"
      icon={<Waves className="w-4 h-4 text-cyan-400" />}
      subtitle="Fronteras Q1 (ES&T / ACP / Nature Geosci.) • Acoplamiento Mecanístico Multiescala de Málaga"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-5xl max-h-[88vh]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs select-none">
        
        {/* Banner de Sincronización Atómica del Punto Activo (Regla 10) */}
        <ActivePointSyncBanner compact={true} />

        {/* Barra de Pestañas de Navegación Científica con Tooltips */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-1.5">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <ScientificTooltip position="bottom" width="w-[300px]" content="Fotólisis de nitratos en grime urbano sobre fachadas (Donaldson & George 2014) y producción diurna anómala de ácido nitroso (HONO).">
              <button
                onClick={() => setActiveTab('honoGrime')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'honoGrime'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>1.A: Grime Urbano &amp; HONO Diurno</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[320px]" content="Química heterogénea interfacial marino-costera: formación de ClNO₂ nocturno en aerosol salino y foto-liberación matinal de radicales de cloro (Cl•).">
              <button
                onClick={() => setActiveTab('halogens')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'halogens'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>1.B: Halógenos Marinos (I₂ / ClNO₂)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Nieblas de advección litoral (Taró de la Bahía de Málaga): formación de aerosoles secundarios orgánicos en fase acuosa (aqSOA) y Brown Carbon.">
              <button
                onClick={() => setActiveTab('taroFog')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'taroFog'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                <span>1.C: Nieblas Taró &amp; aqSOA / BrC</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Autooxidación de monoterpenos (HOMs/ELVOCs) y potencial oxidativo celular ditiotreitol (OP-DTT) acoplado a metales de frenos y combustión.">
              <button
                onClick={() => setActiveTab('homsOp')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'homsOp'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Atom className="w-3.5 h-3.5 text-emerald-400" />
                <span>1.D: HOMs &amp; Potencial OP^DTT</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[320px]" content="Termodinámica de aerosol marino y partición gas-partícula (ISORROPIA-II modificado): reacción heterogénea irreversible NaCl + HNO3 -> NaNO3 + HCl↑, agotamiento de cloruro y desplazamiento de nitrato a modo grueso PM10.">
              <button
                onClick={() => setActiveTab('seaSaltNitrate')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'seaSaltNitrate'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>1.E: Aerosol Marino &amp; NaCl-HNO₃</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Resumen formal de conclusiones físico-químicas y exportación científica reproducible en GeoJSON y CSV.">
              <button
                onClick={() => setActiveTab('dossier')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'dossier'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Dictamen &amp; Exportación FAIR</span>
              </button>
            </ScientificTooltip>
          </div>

          <div className="flex items-center space-x-1.5">
            <ScientificTooltip content="Exportar series temporales cinéticas de HONO, ClNO₂ y aqSOA en formato CSV citable bajo principios FAIR.">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip content="Exportar receptores costeros y transecto marino-urbano en formato geoespacial estándar GeoJSON.">
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

        {/* Contenido Principal de Pestañas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.A: GRIME URBANO, RENOCIFACIÓN & HONO DIURNO                */}
          {/* ========================================================================= */}
          {activeTab === 'honoGrime' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-amber-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-amber-950 border border-amber-800 text-amber-300">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-amber-200">
                      1.A: Fotólisis Heterogénea de Películas Superficiales (Urban Surface Grime) y Emisión Diurna de HONO
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • ES&T / ACP / Donaldson &amp; George (2014)
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  En los cañones urbanos de Málaga, las fachadas de piedra caliza, hormigón y vidrios acumulan una biopelícula nanométrica de <em>grime</em> enriquecida en nitratos (NO₃⁻) y materia orgánica. La radiación ultravioleta induce la reducción fotocatalítica: <strong>NO₃⁻ (grime) + hν → HONO (g) + NO₂⁻</strong>. En cañones estrechos con bajo SVF (ej. Calle Larios), este flujo superficial sostiene concentraciones diurnas de HONO de hasta 2.5 ppb, aportando entre el <strong>35% y el 55% del pulso matinal de radicales OH•</strong>.
                </p>
              </div>

              {/* Panel de Control y Parámetros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Geometría de Cañón &amp; Carga Grime</span>
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Relación Altura/Anchura (H/W):</span>
                      <span className="font-mono text-amber-300 font-bold">{canyonHwRatio.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.4}
                      max={3.5}
                      step={0.1}
                      value={canyonHwRatio}
                      onChange={(e) => setCanyonHwRatio(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-400">Área reactiva activa = 1 + 2·(H/W)</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Sky View Factor (SVF):</span>
                      <span className="font-mono text-cyan-300 font-bold">{skyViewFactor.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.15}
                      max={0.95}
                      step={0.05}
                      value={skyViewFactor}
                      onChange={(e) => setSkyViewFactor(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Carga Nitrato en Fachadas:</span>
                      <span className="font-mono text-rose-300 font-bold">{grimeNitrateLoading.toFixed(1)} µmol/m²</span>
                    </div>
                    <input
                      type="range"
                      min={5.0}
                      max={80.0}
                      step={2.5}
                      value={grimeNitrateLoading}
                      onChange={(e) => setGrimeNitrateLoading(Number(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Fracción Orgánica f_org:</span>
                      <span className="font-mono text-emerald-300 font-bold">{(facadeOrganicFraction * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.7}
                      step={0.02}
                      value={facadeOrganicFraction}
                      onChange={(e) => setFacadeOrganicFraction(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>

                {/* Métricas Numéricas Principales */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Flujo Superficial de HONO:</span>
                    <div className="text-xl font-mono font-bold text-amber-300">
                      {grimeHonoResults.honoSurfaceFluxNmolM2S} <span className="text-xs text-slate-400">nmol/(m²·s)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Renoxificación neta: {grimeHonoResults.renoxificationFluxUgm2H} µg/(m²·h)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-rose-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">[HONO] Estado Estacionario Peatonal:</span>
                    <div className="text-xl font-mono font-bold text-rose-300">
                      {grimeHonoResults.steadyStateHonoPpb} <span className="text-xs text-slate-400">ppb</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Factor confinamiento cañón: {grimeHonoResults.canyonAccumulationFactor}×</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-cyan-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Fotólisis Matinal J(HONO):</span>
                    <div className="text-xl font-mono font-bold text-cyan-300">
                      {grimeHonoResults.jHonoRatePerSec} <span className="text-xs text-slate-400">s⁻¹</span>
                    </div>
                    <span className="text-[9px] text-slate-400">P(OH•) = {grimeHonoResults.ohRadicalProductionRate} moléc/(cm³·s)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-emerald-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Cuota HONO en Capacidad Oxidativa:</span>
                    <div className="text-xl font-mono font-bold text-emerald-300">
                      {grimeHonoResults.honoShareOfTotalOhProdPct}% <span className="text-xs text-slate-400">de P(OH•)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Tiempo agotamiento grime: {grimeHonoResults.grimeLifetimeHours} h</span>
                  </div>
                </div>
              </div>

              {/* Perfil Diurno y Receptores de Cañón en Málaga */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                    <span>Evolución Diurna del Pulso HONO vs Radiación Solar (00:00 - 24:00)</span>
                    <span className="text-[9px] text-amber-400 font-mono">Perfil Horario</span>
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {grimeHonoResults.diurnalProfile.filter((_, idx) => idx % 2 === 0 || idx === 7 || idx === 8).map(step => (
                      <div key={step.hour} className="flex items-center justify-between bg-slate-950 p-1.5 rounded text-[10px] font-mono border border-slate-800/80">
                        <span className="text-amber-300 font-bold w-12">{step.timeLabel}</span>
                        <span className="text-slate-300">
                          HONO: <strong className="text-rose-400">{step.honoConcentrationPpb}</strong> ppb
                        </span>
                        <span className="text-slate-300">
                          J(HONO): <strong className="text-cyan-400">{step.jHonoPerSec}</strong>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {step.honoContributionToOhPct}% OH•
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                    <span>Receptores de Cañón Urbano y Grime en Málaga</span>
                    <span className="text-[9px] text-cyan-400 font-mono">5 Puntos Críticos</span>
                  </h4>
                  <div className="space-y-1.5">
                    {grimeHonoResults.malagaHotspots.map(spot => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          setSelectedGrimeSpotId(spot.id);
                          setCanyonHwRatio(spot.canyonHwRatio);
                          setSkyViewFactor(spot.skyViewFactor);
                          setGrimeNitrateLoading(spot.grimeNitrateLoadingUmolM2);
                          setFacadeOrganicFraction(spot.organicCarbonGrimeFraction);
                          if (onFlyToLocation) {
                            onFlyToLocation(spot.lat, spot.lon, 16.5, 30);
                          }
                        }}
                        className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between ${
                          selectedGrimeSpotId === spot.id
                            ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[11px] flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{spot.name}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">{spot.facadeType}</p>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <div className="text-rose-300 font-bold">{spot.daytimeHonoPpb} ppb HONO</div>
                          <div className="text-amber-400 text-[9px]">{spot.morningOhRadicalYieldPct}% OH• matinal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.B: HALÓGENOS MARINOS (I2 / HOI / ClNO2 / HIO3)             */}
          {/* ========================================================================= */}
          {activeTab === 'halogens' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-cyan-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      <Waves className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-cyan-200">
                      1.B: Activación Interfacial de Halógenos Marinos (ClNO₂ / I₂ / HOI) &amp; Acoplamiento con Brisa Marina
                    </h3>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • Nature Geosci. / Thornton et al. (Nature 2010) / Bertram &amp; Thornton (2009)
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  En la Bahía de Málaga, la interacción entre el aerosol salino marino (NaCl) y los NOx vehiculares nocturnos genera <strong>cloruro de nitrilo (ClNO₂)</strong> mediante química heterogénea de N₂O₅. Al amanecer, su rápida fotólisis inyecta un <strong>pulso masivo de radicales de cloro (Cl•)</strong> que oxida hidrocarburos hasta <strong>80 veces más rápido que el radical OH•</strong>, acelerando la formación del pico de ozono matinal varias horas antes del mediodía solar.
                </p>

                {/* Selector de Sub-vistas dentro de Halógenos con Tooltips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                  {[
                    { 
                      id: 'diurnalKinetics', 
                      label: '1. Cinética Diurna & Pulso Cl•', 
                      icon: <TrendingUp className="w-3 h-3" />,
                      tip: 'Evolución temporal 24h de ClNO₂, fotólisis J(ClNO₂) y producción del pulso matinal de radicales de cloro [Cl•].'
                    },
                    { 
                      id: 'breezeTrafficCoupling', 
                      label: '2. Brisa Marina vs. Tráfico Litoral', 
                      icon: <Wind className="w-3 h-3" />,
                      tip: 'Acoplamiento físico entre el régimen de brisa marina/terral, la autopista costera MA-20/N-340 y la reactivación interfacial.'
                    },
                    { 
                      id: 'vocReactivityTable', 
                      label: '3. Reactividad Cl• vs OH• en COVs', 
                      icon: <Zap className="w-3 h-3" />,
                      tip: 'Constantes cinéticas k_Cl frente a k_OH para alcanos, alquenos y aromáticos emitidos por tráfico y biogénicos.'
                    },
                    { 
                      id: 'receptorsHotspots', 
                      label: '4. Receptores & Playas de Málaga', 
                      icon: <MapPin className="w-3 h-3" />,
                      tip: 'Puntos críticos georreferenciados (Muelle Uno, La Malagueta, Sacaba Beach, Baños del Carmen, Peñón del Cuervo).'
                    },
                  ].map((subTab) => (
                    <ScientificTooltip
                      key={subTab.id}
                      position="bottom"
                      width="w-[280px]"
                      content={subTab.tip}
                    >
                      <button
                        onClick={() => setHalogenSubTab(subTab.id as any)}
                        className={`px-2.5 py-1 rounded text-[10.5px] font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          halogenSubTab === subTab.id
                            ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-sm'
                            : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {subTab.icon}
                        <span>{subTab.label}</span>
                      </button>
                    </ScientificTooltip>
                  ))}
                </div>
              </div>

              {/* VISTA 1: CINÉTICA DIURNA & PULSO RADICAL CL• */}
              {halogenSubTab === 'diurnalKinetics' && (
                <div className="space-y-3">
                  {/* Panel de Controles y Métricas Clave */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
                      <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span>Precursores de Aerosol Salino</span>
                        <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      </div>

                      <ScientificTooltip
                        title="Área Interfacial de Aerosol Salino (S_a)"
                        content="Superficie específica del aerosol marino generado por oleaje y spray costero en la Bahía de Málaga. Determina la tasa de colisión cinética de N2O5."
                        formula={`S_a = \\int \\pi D_p^2 N(D_p) dD_p`}
                        regulatory="Guías EMEP/EEA 2023 para aerosoles marinos naturales"
                        citation="Bertram & Thornton (2009) Atmos. Chem. Phys."
                      >
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Área Sal Marina (Sₐ):</span>
                            <span className="font-mono text-cyan-300 font-bold">{seaSaltSa} µm²/cm³</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={1200}
                            step={25}
                            value={seaSaltSa}
                            onChange={(e) => setSeaSaltSa(Number(e.target.value))}
                            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                          />
                        </div>
                      </ScientificTooltip>

                      <ScientificTooltip
                        title="Molaridad de Cloruro en Aerosol [Cl⁻]"
                        content="Concentración acuosa de iones cloruro en la fase líquida del aerosol marino (ALWC). Gobierna la selectividad de producción de ClNO2 frente a ácido nítrico."
                        formula={`\\Phi(\\text{ClNO}_2) = \\left(1 + \\frac{[\\text{H}_2\\text{O}]}{483 [\\text{Cl}^-]} \\right)^{-1}`}
                        regulatory="Parámetro IUPAC de Cinética Heterogénea Acuosa"
                        citation="Roberts et al. (2009) & Bertram & Thornton (2009)"
                      >
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Molaridad Cloruro [Cl⁻]:</span>
                            <span className="font-mono text-emerald-300 font-bold">{chlorideMolarity.toFixed(2)} M</span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={5.5}
                            step={0.1}
                            value={chlorideMolarity}
                            onChange={(e) => setChlorideMolarity(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                          />
                        </div>
                      </ScientificTooltip>

                      <ScientificTooltip
                        title="Molaridad de Nitrato en Aerosol [NO₃⁻]"
                        content="Concentración de nitrato en el aerosol (efecto de supresión de nitrato). Compite con el agua y el cloruro en la disociación interfacial del aducto."
                        formula={`\\gamma(\\text{N}_2\\text{O}_5) = A \\left( 1 - \\frac{1}{1 + \\frac{k_1 [\\text{H}_2\\text{O}]}{k_2 [\\text{NO}_3^-]} + \\frac{k_3 [\\text{Cl}^-]}{k_2 [\\text{NO}_3^-]}} \\right)`}
                        regulatory="Bertram & Thornton (2009) Uptake Parameterization"
                        citation="Bertram, T. H. & Thornton, J. A. (2009) ACP"
                      >
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Molaridad Nitrato [NO₃⁻]:</span>
                            <span className="font-mono text-amber-300 font-bold">{nitrateMolarity.toFixed(2)} M</span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={2.5}
                            step={0.05}
                            value={nitrateMolarity}
                            onChange={(e) => setNitrateMolarity(Number(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                          />
                        </div>
                      </ScientificTooltip>
                    </div>

                    {/* 4 Métricas de Cinética de Halógenos */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded bg-slate-950 border border-cyan-900/60 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Tasa Heterogénea k_het &amp; γ(N₂O₅):</span>
                        <div className="text-lg font-mono font-bold text-cyan-300">
                          {halogenResults.kHetPerSec.toExponential(2)} <span className="text-xs text-slate-400">s⁻¹</span>
                        </div>
                        <span className="text-[9px] text-cyan-400 font-mono">
                          γ = {halogenResults.gammaN2O5} • τ(N₂O₅) = {halogenResults.n2o5LifetimeMinutes.toFixed(1)} min
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950 border border-emerald-900/60 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Rendimiento Φ(ClNO₂) &amp; Tasa Formación:</span>
                        <div className="text-lg font-mono font-bold text-emerald-300">
                          {(halogenResults.clno2YieldPhi * 100).toFixed(1)}% <span className="text-xs text-slate-400">({halogenResults.clno2ProductionRatePptHour} ppt/h)</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          Pico Amanecer: ~{(halogenResults.clno2ProductionRatePptHour * 7.5).toFixed(0)} pptv
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950 border border-amber-900/60 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Flujo de Producción de Radicales P(Cl•):</span>
                        <div className="text-lg font-mono font-bold text-amber-300">
                          {halogenResults.clRadicalProductionFlux.toExponential(2)} <span className="text-xs text-slate-400">moléc/(cm³·s)</span>
                        </div>
                        <span className="text-[9px] text-amber-400 font-mono">
                          J(ClNO₂) = {halogenResults.jClNO2PerSec.toExponential(2)} s⁻¹ al alba
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-slate-950 border border-purple-900/60 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Adelanto del Pico Matinal de Ozono:</span>
                        <div className="text-lg font-mono font-bold text-purple-300">
                          +{halogenResults.ozoneEarlyPeakAdvanceMinutes} <span className="text-xs text-slate-400">minutos</span>
                        </div>
                        <span className="text-[9px] text-purple-400 font-mono">
                          Reactividad COV ×{halogenResults.relativeVocReactivityClVsOH.toFixed(1)} vs OH•
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico Recharts: Perfil Temporal Diurno de Halógenos */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-semibold text-slate-200">
                          Simulación Cinética Continua de 24 Horas: Acumulación Nocturna de ClNO₂ &amp; Pulso de Radicales Cl•
                        </h4>
                      </div>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        Bahía de Málaga (00:00 - 24:00 UTC)
                      </span>
                    </div>

                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={halogenResults.diurnalProfile} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 9.5 }} />
                          <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 9.5 }} label={{ value: 'ClNO₂ / N₂O₅ (ppt)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 9 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 9.5 }} label={{ value: '[Cl•] (×10⁴ cm⁻³)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 9 }} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#0891b2', fontSize: '10px', fontFamily: 'monospace' }}
                            formatter={(value: any, name: string) => [`${value}`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="clno2Ppt" name="[ClNO₂] (ppt)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="n2o5Ppt" name="[N₂O₅] (ppt)" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                          <Line yAxisId="right" type="monotone" dataKey="clRadicalConc10e4" name="Pulso [Cl•] (×10⁴ cm⁻³)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} />
                          <Line yAxisId="right" type="monotone" dataKey="ozoneProductionRatePpbHour" name="d[O₃]/dt (ppb/h)" stroke="#10b981" strokeWidth={1.8} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 2: ACOPLAMIENTO BRISA MARINA VS. TRÁFICO LITORAL */}
              {halogenSubTab === 'breezeTrafficCoupling' && (
                <div className="space-y-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-cyan-400" />
                        <span>Celda de Recirculación Térmica Costera (Terral vs. Brisa Marina en la Bahía)</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-cyan-300">
                        Índice de Recirculación Lidar / ERA5
                      </span>
                    </h4>

                    {/* Controles de Brisa Marina */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="flex justify-between text-[10.5px] mb-1">
                          <span className="text-slate-400">Brisa Marina Diurna (u_mar):</span>
                          <span className="font-mono text-cyan-300 font-bold">{breezeSpeedMs.toFixed(1)} m/s</span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={10.0}
                          step={0.1}
                          value={breezeSpeedMs}
                          onChange={(e) => setBreezeSpeedMs(Number(e.target.value))}
                          className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10.5px] mb-1">
                          <span className="text-slate-400">Terral Nocturno (u_tierra):</span>
                          <span className="font-mono text-indigo-300 font-bold">{terralSpeedMs.toFixed(1)} m/s</span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={8.0}
                          step={0.1}
                          value={terralSpeedMs}
                          onChange={(e) => setTerralSpeedMs(Number(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10.5px] mb-1">
                          <span className="text-slate-400">NOx Tráfico Litoral:</span>
                          <span className="font-mono text-amber-300 font-bold">{coastalTrafficNoxPpb.toFixed(0)} ppb</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={120}
                          step={5}
                          value={coastalTrafficNoxPpb}
                          onChange={(e) => setCoastalTrafficNoxPpb(Number(e.target.value))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10.5px] mb-1">
                          <span className="text-slate-400">Distancia a la Costa:</span>
                          <span className="font-mono text-emerald-300 font-bold">{distanceToShoreM} m</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={3500}
                          step={50}
                          value={distanceToShoreM}
                          onChange={(e) => setDistanceToShoreM(Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Diagnóstico Físico de la Recirculación */}
                    {(() => {
                      const netTransportKm = Math.abs(breezeSpeedMs * seaBreezeDurationH * 3.6 - terralSpeedMs * landBreezeDurationH * 3.6);
                      const totalTransportKm = breezeSpeedMs * seaBreezeDurationH * 3.6 + terralSpeedMs * landBreezeDurationH * 3.6;
                      const recirculationIndexRc = Math.max(0, Math.min(1, 1 - (netTransportKm / totalTransportKm)));
                      const clno2AccumulatedDawn = Math.round((coastalTrafficNoxPpb * 14.5 * (seaSaltSa / 400) * (chlorideMolarity / 2.0)));
                      const o3AdvanceHours = (1.2 + recirculationIndexRc * 1.5).toFixed(1);
                      const o3EnhancementUgm3 = (clno2AccumulatedDawn * 0.024 * (1 + recirculationIndexRc)).toFixed(1);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 font-mono text-[10.5px]">
                          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-400">Factor de Recirculación Litoral (Rc):</span>
                            <div className="text-lg font-bold text-cyan-300">
                              {(recirculationIndexRc * 100).toFixed(1)}% <span className="text-xs text-slate-500">({recirculationIndexRc > 0.6 ? 'Alta Retención' : 'Ventilación Abierta'})</span>
                            </div>
                            <span className="text-[8.5px] text-slate-500">
                              Rc = 1 - (L_net / L_total) = 1 - ({netTransportKm.toFixed(1)} km / {totalTransportKm.toFixed(1)} km)
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-400">Acumulación ClNO₂ al Alba:</span>
                            <div className="text-lg font-bold text-emerald-300">
                              {clno2AccumulatedDawn} <span className="text-xs text-slate-400">pptv</span>
                            </div>
                            <span className="text-[8.5px] text-slate-500">
                              Sinergia nocturna: Tráfico litoral → Bahía → N₂O₅ + NaCl
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-400">Incremento &amp; Adelanto O₃:</span>
                            <div className="text-lg font-bold text-purple-300">
                              +{o3EnhancementUgm3} µg/m³ <span className="text-xs text-slate-400">(-{o3AdvanceHours} h)</span>
                            </div>
                            <span className="text-[8.5px] text-slate-500">
                              Pico diurno adelantado a las 11:30 en lugar de las 14:00
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Diagrama de Ciclo Físico */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-cyan-900/40 text-[11px] text-slate-300 space-y-1.5">
                    <h5 className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                      <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mecanismo Físico de la Bahía de Málaga (Tesis Doctoral):</span>
                    </h5>
                    <p className="leading-relaxed text-[10.5px]">
                      <strong>Fase 1 (Noche, 22:00 - 06:00 UTC):</strong> El viento catabático (Terral) transporta las emisiones vehiculares de NOx desde la MA-20 y el Paseo del Parque hacia el mar abierto sobre la Bahía de Málaga. Allí, en la oscuridad, se forma N₂O₅ que reacciona con el spray salino marino produciendo un reservorio masivo de ClNO₂.
                    </p>
                    <p className="leading-relaxed text-[10.5px]">
                      <strong>Fase 2 (Amanecer, 06:30 - 09:30 UTC):</strong> El calentamiento solar invierte la circulación costera a Brisa Marina diurna. La brisa empuja el aire enriquecido con ClNO₂ hacia el interior urbano justo cuando la radiación solar fotoliza el enlace Cl-NO₂, liberando un pulso de radicales Cl• que reacciona violentamente con las emisiones matinales de COVs de la hora punta.
                    </p>
                  </div>
                </div>
              )}

              {/* VISTA 3: MATRIZ CINÉTICA DE REACTIVIDAD CL• VS OH• */}
              {halogenSubTab === 'vocReactivityTable' && (
                <div className="space-y-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-semibold text-slate-200">
                          Constantes de Velocidad de Reacción en Fase Gaseosa a 298 K (k en cm³·moléc⁻¹·s⁻¹)
                        </h4>
                      </div>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        IUPAC Subcommittee on Gas Kinetic Data Evaluation (2024)
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[10.5px] font-mono text-slate-300 text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                            <th className="py-1.5 px-2 font-semibold">Familia / Especie COV</th>
                            <th className="py-1.5 px-2 font-semibold">Fuente en Málaga</th>
                            <th className="py-1.5 px-2 font-semibold text-amber-300">k(Cl•)</th>
                            <th className="py-1.5 px-2 font-semibold text-teal-300">k(OH•)</th>
                            <th className="py-1.5 px-2 font-semibold text-purple-300">Aceleración k_Cl/k_OH</th>
                            <th className="py-1.5 px-2 font-semibold">Destino Químico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">n-Butano (C₄H₁₀)</td>
                            <td className="py-1.5 px-2 text-slate-400">Gasolina / GLP / Tráfico</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">1.9 × 10⁻¹⁰</td>
                            <td className="py-1.5 px-2 text-teal-300">2.4 × 10⁻¹²</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">79.2×</td>
                            <td className="py-1.5 px-2 text-slate-300">Producción ultrarrápida de RO₂•</td>
                          </tr>
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">Propano (C₃H₈)</td>
                            <td className="py-1.5 px-2 text-slate-400">Combustión / Taxis GLP</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">1.4 × 10⁻¹⁰</td>
                            <td className="py-1.5 px-2 text-teal-300">1.1 × 10⁻¹²</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">127.3×</td>
                            <td className="py-1.5 px-2 text-slate-300">Oxidación en microescala</td>
                          </tr>
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">Tolueno (C₇H₈)</td>
                            <td className="py-1.5 px-2 text-slate-400">Escape vehículos / Talleres</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">5.9 × 10⁻¹¹</td>
                            <td className="py-1.5 px-2 text-teal-300">5.6 × 10⁻¹²</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">10.5×</td>
                            <td className="py-1.5 px-2 text-slate-300">Precursor directo de SOA</td>
                          </tr>
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">Isopreno (C₅H₈)</td>
                            <td className="py-1.5 px-2 text-slate-400">Arbolado Parque / MEGAN</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">4.3 × 10⁻¹⁰</td>
                            <td className="py-1.5 px-2 text-teal-300">1.0 × 10⁻¹⁰</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">4.3×</td>
                            <td className="py-1.5 px-2 text-slate-300">Cloro-isopreno y O₃</td>
                          </tr>
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">Benceno (C₆H₆)</td>
                            <td className="py-1.5 px-2 text-slate-400">Gasolina sin plomo</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">1.5 × 10⁻¹¹</td>
                            <td className="py-1.5 px-2 text-teal-300">1.2 × 10⁻¹²</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">12.5×</td>
                            <td className="py-1.5 px-2 text-slate-300">Carcinógeno / Adición anillo</td>
                          </tr>
                          <tr className="hover:bg-slate-850/50">
                            <td className="py-1.5 px-2 font-bold text-slate-200">Metanol (CH₃OH)</td>
                            <td className="py-1.5 px-2 text-slate-400">Tráfico marítimo Puerto</td>
                            <td className="py-1.5 px-2 text-amber-300 font-bold">5.5 × 10⁻¹¹</td>
                            <td className="py-1.5 px-2 text-teal-300">9.0 × 10⁻¹³</td>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">61.1×</td>
                            <td className="py-1.5 px-2 text-slate-300">Generación de formaldehído HCHO</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 4: RECEPTORES & PLAYAS DE MÁLAGA */}
              {halogenSubTab === 'receptorsHotspots' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                    <span>Red de Receptores Litorales &amp; Playas de la Bahía de Málaga</span>
                    <span className="text-[9px] text-cyan-400 font-mono">Georreferenciación WGS84</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {marineIodineResults.malagaBayHotspots.map(spot => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          setSelectedHalogenSpotId(spot.id);
                          setIodideNm(spot.iodideMolarityNm);
                          if (onFlyToLocation) {
                            onFlyToLocation(spot.lat, spot.lon, 16.5, 45);
                          }
                        }}
                        className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between ${
                          selectedHalogenSpotId === spot.id
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[11px] flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{spot.name}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">{spot.description}</p>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <div className="text-purple-300 font-bold">{spot.steadyStateIOPpt} ppt IO</div>
                          <div className="text-emerald-400 text-[9px]">J₁: {spot.hio3NucleationRateJ1Cm3S} cm⁻³s⁻¹</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.C: NIEBLAS DE ADVECCIÓN LITORAL (TARÓ) & aqSOA / BrC       */}
          {/* ========================================================================= */}
          {activeTab === 'taroFog' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-indigo-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                      <CloudRain className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-indigo-200">
                      1.C: Procesamiento Acuoso en Nieblas Litorales de Advección (Taró) y Formación de aqSOA / Brown Carbon
                    </h3>
                  </div>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • ES&T / ACP / Ervens et al. (aqSOA Theory)
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Durante los episodios de <strong>Taró</strong> (niebla de advección marina fría típica de la bahía malagueña en primavera y verano), los dicarbonilos solubles (glioxal y metilglioxal) se particionan masivamente en las microgotas (H* ≈ 3.2×10⁵ M/atm). Las reacciones oscuras de Fenton con trazas de Fe/Cu y la catálisis ácida por sulfato/amonio forman <strong>ácido oxálico y oligómeros de Carbono Pardo (BrC)</strong>. Al disiparse la niebla, estos compuestos no volátiles permanecen como masa sólida irreversible de PM₂.₅.
                </p>
              </div>

              {/* Controles de Taró */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Microfísica &amp; Precursores de Niebla</span>
                    <Droplet className="w-3.5 h-3.5 text-indigo-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Contenido Agua Líquida (LWC):</span>
                      <span className="font-mono text-indigo-300 font-bold">{taroLwc.toFixed(2)} g/m³</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.60}
                      step={0.02}
                      value={taroLwc}
                      onChange={(e) => setTaroLwc(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded"
                    />
                    <span className="text-[9px] text-slate-400">Densidad de gotas: {taroResults.dropletNumberDensityCm3} cm⁻³</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Radio Efectivo Microgotas:</span>
                      <span className="font-mono text-cyan-300 font-bold">{taroDropRadius.toFixed(1)} µm</span>
                    </div>
                    <input
                      type="range"
                      min={6.0}
                      max={18.0}
                      step={0.5}
                      value={taroDropRadius}
                      onChange={(e) => setTaroDropRadius(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Glioxal [CHOCHO] Gaseoso:</span>
                      <span className="font-mono text-amber-300 font-bold">{glyoxalPpb.toFixed(2)} ppb</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.5}
                      step={0.05}
                      value={glyoxalPpb}
                      onChange={(e) => setGlyoxalPpb(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Metales de Transición [Fe+Cu]:</span>
                      <span className="font-mono text-rose-300 font-bold">{transitionMetalsNgM3} ng/m³</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={250}
                      step={5}
                      value={transitionMetalsNgM3}
                      onChange={(e) => setTransitionMetalsNgM3(Number(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>

                {/* Métricas de Taró */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-indigo-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Tasa de Formación de aqSOA:</span>
                    <div className="text-xl font-mono font-bold text-indigo-300">
                      {taroResults.aqSoaFormationRateUgm3Hour} <span className="text-xs text-slate-400">µg/(m³·h)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Ácido oxálico neto: {taroResults.oxalicAcidProductionUgm3Hour} µg/(m³·h)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Absorción Óptica Brown Carbon (BrC):</span>
                    <div className="text-xl font-mono font-bold text-amber-300">
                      {taroResults.brownCarbonMac365M2G} <span className="text-xs text-slate-400">m²/g (MAC₃₆₅)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">ΔAOD UV adicional: +{taroResults.brownCarbonAerosolAodIncrement}</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-emerald-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Ganancia Neta PM₂.₅ Post-Disipación:</span>
                    <div className="text-xl font-mono font-bold text-emerald-300">
                      +{taroResults.postFogEvaporationPm25GainUgm3} <span className="text-xs text-slate-400">µg/m³</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Residuo no volátil orgánico condensado</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-cyan-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Rutas de Reacción Acuosa:</span>
                    <div className="space-y-1 font-mono text-[10px] text-slate-300 mt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fenton / Foto-Oxidación:</span>
                        <span className="text-cyan-300 font-bold">{taroResults.chemicalReactionPathways.fentonPhotoOxidationPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Catálisis Amonio (BrC):</span>
                        <span className="text-amber-300 font-bold">{taroResults.chemicalReactionPathways.ammoniumCatalyzedOligomersPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotspots de Taró */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Receptores Costeros Afectados por el Taró en Málaga</span>
                  <span className="text-[9px] text-indigo-400 font-mono">Zona Portuaria y Paseos Marítimos</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {taroResults.malagaTaroHotspots.map(spot => (
                    <div
                      key={spot.id}
                      onClick={() => {
                        setSelectedTaroSpotId(spot.id);
                        setTaroLwc(spot.liquidWaterContentGm3);
                        setTaroDropRadius(spot.dropletEffectiveRadiusUm);
                        setGlyoxalPpb(spot.glyoxalGasPpb);
                        if (onFlyToLocation) {
                          onFlyToLocation(spot.lat, spot.lon, 16.5, 35);
                        }
                      }}
                      className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between ${
                        selectedTaroSpotId === spot.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[11px] flex items-center space-x-1.5">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>{spot.name}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{spot.description}</p>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <div className="text-indigo-300 font-bold">{spot.aqSoaYieldUgm3Hour} µg/(m³·h)</div>
                        <div className="text-emerald-400 text-[9px]">+{spot.pm25MassEnhancementPct}% PM₂.₅</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.D: HOMs & POTENCIAL OXIDATIVO OP^DTT                       */}
          {/* ========================================================================= */}
          {activeTab === 'homsOp' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-emerald-800/40 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      <Atom className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-emerald-200">
                      1.D: Auto-Oxidación HOMs (PM₀.₁) y Desacoplamiento Toxicológico de Potencial Oxidativo (OP^DTT)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • Science / ES&T / Guías OMS 2021
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Los monoterpenos forestales de Gibralfaro reaccionan con el O₃ generando moléculas orgánicas altamente oxigenadas (HOMs/ELVOC) que nuclean PM₀.₁ ultrafino. En la ZBE, el desgaste de frenos (Cu, Fe) desacopla la masa en microgramos del daño redox celular real (ensayos DTT y Ácido Ascórbico).
                </p>
              </div>

              {/* Controles y Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Fuentes de Terpenos &amp; Frenos</span>
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">α-Pineno / Terpenos:</span>
                      <span className="font-mono text-emerald-300 font-bold">{alphaPinenePpb.toFixed(2)} ppb</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={5.0}
                      step={0.05}
                      value={alphaPinenePpb}
                      onChange={(e) => setAlphaPinenePpb(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Cobre [Cu] de Frenos:</span>
                      <span className="font-mono text-rose-300 font-bold">{brakeCuNgM3} ng/m³</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={2}
                      value={brakeCuNgM3}
                      onChange={(e) => setBrakeCuNgM3(Number(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Hierro [Fe] de Desgaste:</span>
                      <span className="font-mono text-amber-300 font-bold">{exhaustFeNgM3} ng/m³</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={350}
                      step={5}
                      value={exhaustFeNgM3}
                      onChange={(e) => setExhaustFeNgM3(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-emerald-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Concentración ELVOC / HOMs:</span>
                    <div className="text-xl font-mono font-bold text-emerald-300">
                      {homsResults.elvocConcentrationUgm3.toFixed(3)} <span className="text-xs text-slate-400">µg/m³</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Tasa nucleación J₁ = {homsResults.nucleationRateJ1Cm3S.toFixed(3)} cm⁻³s⁻¹</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-rose-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">OP^DTT Normalizado por Volumen:</span>
                    <div className="text-xl font-mono font-bold text-rose-300">
                      {opResults.opDttVolumeNormNmolMinM3.toFixed(2)}{' '}
                      <span className="text-xs text-slate-400">nmol/(min·m³)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Dosis redox respirable por peatón</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-amber-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">OP^AA Ensayo Ácido Ascórbico:</span>
                    <div className="text-xl font-mono font-bold text-amber-300">
                      {opResults.opAaAscorbicAcidNormNmolMinM3.toFixed(2)}{' '}
                      <span className="text-xs text-slate-400">nmol/(min·m³)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Reactividad celular por metales no-escape</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-cyan-900/50 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">Riesgo Fisiológico Celular:</span>
                    <div className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{opResults.cellOxidativeStressRisk}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">ROS intracelular: {opResults.cellularRosRatio}× basal</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.E: TERMODINÁMICA DE AEROSOL MARINO & PARTICIÓN NaCl-HNO3  */}
          {/* ========================================================================= */}
          {activeTab === 'seaSaltNitrate' && (
            <div className="space-y-4">
              {/* Encabezado Científico y Doctrinal */}
              <div className="bg-slate-900/90 border border-blue-800/40 rounded-lg p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-blue-950 border border-blue-800 text-blue-300">
                      <Scale className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-blue-200">
                      1.E: Termodinámica de Aerosol Marino &amp; Partición Gas-Partícula de Nitrato (ISORROPIA-II Modificado)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 • ISORROPIA-II / ACP / Seinfeld &amp; Pandis
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  En la atmósfera costera de Málaga, el aerosol marino fino y grueso (<strong>NaCl</strong>) reacciona de forma heterogénea e irreversible con el ácido nítrico gaseoso procedente de la fotoquímica de las emisiones de tráfico (<strong>NO₂ + OH• → HNO₃</strong>): 
                  <span className="font-mono text-cyan-300 font-bold ml-1">NaCl(p) + HNO₃(g) → NaNO₃(p) + HCl(g)↑</span>. 
                  A diferencia de las ciudades de interior donde el nitrato secundario depende del equilibrio reversible y térmicamente inestable del nitrato amónico (<strong>NH₄NO₃</strong>), en Málaga el nitrato se fija como <strong>NaNO₃ no volátil</strong> en la fracción gruesa (<strong>PM₁₀</strong>), desplazando el cloruro a la fase gas y preservando concentraciones particuladas elevadas incluso bajo episodios de calor extremo o Terral.
                </p>
              </div>

              {/* Controles de Escenarios y Parámetros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Presets Meteorológicos */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Régimen Meteorológico</span>
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setCoastalScenarioPreset('asimilado')}
                      className={`px-2 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border text-left cursor-pointer ${
                        coastalScenarioPreset === 'asimilado'
                          ? 'bg-blue-600/30 text-blue-200 border-blue-500'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      📡 Asimilado en Vivo
                      <div className="text-[9px] text-slate-400 font-sans font-normal">{curTemp.toFixed(1)}°C · {curRelHum.toFixed(0)}% HR</div>
                    </button>

                    <button
                      onClick={() => setCoastalScenarioPreset('levante')}
                      className={`px-2 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border text-left cursor-pointer ${
                        coastalScenarioPreset === 'levante'
                          ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      🌊 Brisa de Levante
                      <div className="text-[9px] text-slate-400 font-sans font-normal">22°C · 78% HR (Húmedo)</div>
                    </button>

                    <button
                      onClick={() => setCoastalScenarioPreset('terral')}
                      className={`px-2 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border text-left cursor-pointer ${
                        coastalScenarioPreset === 'terral'
                          ? 'bg-amber-600/30 text-amber-200 border-amber-500'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      🔥 Terral Guadalhorce
                      <div className="text-[9px] text-slate-400 font-sans font-normal">40.5°C · 16% HR (Seco)</div>
                    </button>

                    <button
                      onClick={() => setCoastalScenarioPreset('inversion')}
                      className={`px-2 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border text-left cursor-pointer ${
                        coastalScenarioPreset === 'inversion'
                          ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      ❄️ Inversión Invernal
                      <div className="text-[9px] text-slate-400 font-sans font-normal">11.5°C · 84% HR (Frío)</div>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                    <div className="flex justify-between">
                      <span>Temperatura de Cálculo:</span>
                      <span className="font-mono font-bold text-amber-300">{currentSimTemp.toFixed(1)} °C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humedad Relativa:</span>
                      <span className="font-mono font-bold text-cyan-300">{currentSimRh.toFixed(1)} %</span>
                    </div>
                    <div className="flex justify-between">
                      <span>K_p(T) Termodinámico NH₄NO₃:</span>
                      <span className="font-mono font-bold text-purple-300">{seaSaltResults.kpAmmoniumNitratePpb2.toFixed(1)} ppb²</span>
                    </div>
                  </div>
                </div>

                {/* Hotspots y Distancia a la Costa */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Receptores Litorales de Málaga</span>
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Punto de Muestreo / Transecto:</span>
                    <select
                      value={selectedHotspotId}
                      onChange={(e) => {
                        const spotId = e.target.value;
                        setSelectedHotspotId(spotId);
                        const spot = MALAGA_COASTAL_NITRATE_HOTSPOTS.find(h => h.id === spotId);
                        if (spot) {
                          setCustomCoastDistanceM(spot.distanceToCoastlineM);
                          setBaseSeaSaltNaClUgm3(spot.seaSaltNaClConcentrationUgm3);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 cursor-pointer"
                    >
                      {MALAGA_COASTAL_NITRATE_HOTSPOTS.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.distanceToCoastlineM} m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Distancia a la Línea de Costa:</span>
                      <span className="font-mono text-cyan-300 font-bold">{customCoastDistanceM} m</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={12000}
                      step={50}
                      value={customCoastDistanceM}
                      onChange={(e) => setCustomCoastDistanceM(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                      <span>Costa (20 m)</span>
                      <span>Decaimiento Bahía</span>
                      <span>Campanillas (12 km)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Carga Base NaCl Marino en Costa:</span>
                      <span className="font-mono text-blue-300 font-bold">{baseSeaSaltNaClUgm3.toFixed(1)} µg/m³</span>
                    </div>
                    <input
                      type="range"
                      min={2.0}
                      max={25.0}
                      step={0.5}
                      value={baseSeaSaltNaClUgm3}
                      onChange={(e) => setBaseSeaSaltNaClUgm3(Number(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Métricas Termodinámicas de Partición */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2.5 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Métricas Clave de Especiación</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">NaNO₃ Grueso Estable</span>
                      <span className="font-mono text-sm font-bold text-blue-300">
                        {seaSaltResults.sodiumNitrateUgm3.toFixed(2)} <span className="text-[9px]">µg/m³</span>
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">NH₄NO₃ Fino Volátil</span>
                      <span className="font-mono text-sm font-bold text-purple-300">
                        {seaSaltResults.ammoniumNitrateUgm3.toFixed(2)} <span className="text-[9px]">µg/m³</span>
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Agotamiento Cloro (%Cl_dep)</span>
                      <span className="font-mono text-sm font-bold text-amber-300">
                        {seaSaltResults.chlorideDepletionPct.toFixed(1)} %
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">HCl Gaseoso Emitido</span>
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        {seaSaltResults.sizeDistribution.hclGasReleasedUgm3.toFixed(2)} <span className="text-[9px]">µg/m³</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fracción Particulada ε(NO₃⁻):</span>
                      <span className="font-mono font-bold text-cyan-300">{seaSaltResults.partitioningFractionEpsilon.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fracción en Modo Grueso PM₁₀:</span>
                      <span className="font-mono font-bold text-blue-300">
                        {((seaSaltResults.sizeDistribution.pm10CoarseNitrateUgm3 / Math.max(0.001, seaSaltResults.sizeDistribution.totalParticulateNitrateUgm3)) * 100).toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NaCl Marino Efectivo:</span>
                      <span className="font-mono font-bold text-slate-200">{seaSaltResults.effectiveNaClUgm3.toFixed(2)} µg/m³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner de Diagnóstico Dinámico y Anomalía Térmica de Málaga */}
              <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                seaSaltResults.isTerralResistanceActive
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase font-mono tracking-wider block text-[10px]">
                    {seaSaltResults.isTerralResistanceActive ? '⚡ Anomalía del Nitrato en Terral / Calor Estival' : '🔬 Diagnóstico Fisicoquímico del Receptor'}
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-200">
                    {seaSaltResults.coastalThermalAnomalyDescription}
                  </p>
                </div>
              </div>

              {/* Gráficos de Partición: Granulometría y Transecto Costa-Interior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Gráfico 1: Especiación Granulométrica de Nitrato */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Especiación Granulométrica en Receptor (µg/m³)
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Modos PM₁, PM₂.₅, PM₁₀ y Gas</span>
                  </div>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'PM₁ Ultra-Fino', valor: seaSaltResults.sizeDistribution.pm1NitrateUgm3, fill: '#a855f7' },
                          { name: 'PM₂.₅ Fino', valor: seaSaltResults.sizeDistribution.pm25FineNitrateUgm3, fill: '#38bdf8' },
                          { name: 'PM₁₀ Grueso (NaNO₃)', valor: seaSaltResults.sizeDistribution.pm10CoarseNitrateUgm3, fill: '#2563eb' },
                          { name: 'HNO₃ Fase Gas', valor: seaSaltResults.sizeDistribution.hno3GasUgm3, fill: '#f59e0b' }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} unit=" µg" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                          formatter={(val: number) => [`${val.toFixed(3)} µg/m³`, 'Concentración']}
                        />
                        <Bar dataKey="valor" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center">
                    Total particulado: <strong className="text-slate-200 font-mono">{seaSaltResults.sizeDistribution.totalParticulateNitrateUgm3.toFixed(2)} µg/m³</strong> | Gas: <strong className="text-amber-300 font-mono">{seaSaltResults.sizeDistribution.hno3GasUgm3.toFixed(2)} µg/m³</strong>
                  </div>
                </div>

                {/* Gráfico 2: Transecto Espacial Bahía de Málaga -> Campanillas */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Transecto Costa → Interior (0 a 12 km)
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Decaimiento NaCl vs NaNO₃</span>
                  </div>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={coastalTransect.map(t => ({
                          distancia: t.locationLabel.split('/')[0].trim(),
                          distM: t.distanceM,
                          nacl: t.naclConcentrationUgm3,
                          nano3: t.nano3CoarseUgm3,
                          nh4no3: t.nh4no3FineUgm3,
                          depletion: t.chlorideDepletionPct
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="distancia" stroke="#94a3b8" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} unit=" µg" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="nacl" name="NaCl Marino" stroke="#38bdf8" fill="#0284c7" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="nano3" name="NaNO₃ Grueso" stroke="#2563eb" fill="#1d4ed8" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="nh4no3" name="NH₄NO₃ Fino" stroke="#c084fc" fill="#9333ea" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center">
                    A sotavento del litoral, la influencia salina desciende de 11.2 a 0.35 µg/m³ restaurando el régimen continental.
                  </div>
                </div>
              </div>

              {/* Panel de Fundamento Teórico y Exportación FAIR */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Ciencia Abierta (FAIR) • Manuscrito de Tesis Doctoral
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLatexTable}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/50 rounded text-xs font-mono transition-colors cursor-pointer"
                    >
                      {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
                      <span>{copiedLatex ? '¡Copiado!' : 'Copiar Tabla LaTeX'}</span>
                    </button>

                    <button
                      onClick={handleDownloadLatexTable}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Descargar .tex</span>
                    </button>

                    <button
                      onClick={() => {
                        const csvStr = exportCoastalNitrateCsv(coastalTransect, {
                          activePoint: activeStreet,
                          tempC: currentSimTemp,
                          rhPct: currentSimRh
                        });
                        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `particion_nitrato_aerosol_marino_malaga_${Date.now()}.csv`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Descargar CSV Transecto</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-1.5 font-sans">
                  <p>
                    <strong>Aportación Inédita para la Tesis Doctoral:</strong> Los inventarios reglamentarios y los modelos fotoquímicos tradicionales (como CMAQ o WRF-Chem en mallas gruesas) suelen asumir que el nitrato secundario urbano en verano se volatiliza por completo debido a las altas temperaturas mediterráneas. Esta formulación a microescala demuestra que <strong>Málaga subvierte esta premisa</strong>: la presencia del spray marino convierte el ácido nítrico gaseoso en <strong>NaNO₃ no volátil en modo grueso (PM₁₀)</strong>, lo que explica experimentalmente por qué los captadores oficiales de la Junta de Andalucía y la red de control de Málaga registran picos de nitrato particulado incluso durante intensas olas de calor estivales y episodios de Terral.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 1.F: DICTAMEN DE TESIS & EXPORTACIÓN FAIR                   */}
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
                      Dictamen de Tesis Doctoral: Síntesis Metodológica y Trazabilidad Q1
                    </h3>
                  </div>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded font-mono font-bold">
                    Criterios FAIR • W3C PROV-O
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                  <p>
                    El presente módulo certifica la integración de la frontera metodológica en química atmosférica multifásica urbana-costera dentro del Gemelo Digital de Málaga, cumpliendo rigurosamente los principios de cero aleatoriedad en datos y modelización mecanicista informada por la física:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[10px]">
                    <li><strong>Módulo 1.A (Grime Urbano &amp; HONO)</strong>: Reducción heterogénea de nitratos en fachadas y pulso matinal de OH• según Donaldson &amp; George (2014) y Stemmler et al. (2006).</li>
                    <li><strong>Módulo 1.B (Halógenos Marinos)</strong>: Emisión interfacial de I₂/HOI y nucleación de HIO₃ en la Bahía de Málaga según Carpenter et al. (Nature Geoscience 2013) y Sipilä et al. (Science 2016).</li>
                    <li><strong>Módulo 1.C (Niebla Taró &amp; aqSOA)</strong>: Partición acuosa de dicarbonilos, formación de ácido oxálico y Brown Carbon absorbente según Ervens et al. (ACP 2011).</li>
                    <li><strong>Módulo 1.D (HOMs &amp; OP^DTT)</strong>: Auto-oxidación rápida de terpenos de Gibralfaro y estrés redox de metales de frenos en la ZBE según Ehn et al. (Nature 2014) y Bates et al. (ES&T 2019).</li>
                    <li><strong>Módulo 1.E (Aerosol Marino &amp; Partición NaCl-HNO₃)</strong>: Desplazamiento heterogéneo irreversible de cloruro por ácido nítrico, formación de NaNO₃ grueso estable frente a evaporación térmica según Seinfeld &amp; Pandis (2006) e ISORROPIA-II (Fountoukis &amp; Nenes 2007).</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Series Temporales (CSV)</span>
                </button>

                <button
                  onClick={handleExportGeoJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors shadow-sm"
                >
                  <Database className="w-4 h-4" />
                  <span>Descargar Receptores Litorales &amp; Cañones (GeoJSON)</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DraggableWindow>
  );
}
