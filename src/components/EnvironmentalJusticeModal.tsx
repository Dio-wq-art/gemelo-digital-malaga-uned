import React, { useState, useMemo, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Scale, 
  ShieldCheck, 
  Download, 
  Activity, 
  Sliders, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Coins, 
  HeartHandshake, 
  Building2,
  MapPin,
  Layers,
  Palette,
  Eye,
  FileJson,
  Info,
  ArrowLeftRight,
  School,
  Compass,
  HeartPulse,
  Flame,
  Car,
  Navigation
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { computeEnvironmentalJusticeAnalysis } from '../lib/environmentalJustice';
import { MALAGA_RAW_SCHOOLS } from '../lib/schoolAirEquity';
import { MALAGA_COASTAL_SML_ZONES } from '../lib/coastalSmlAcidification';
import { computeOxidativePotential } from '../lib/oxidativePotentialDTT';
import { 
  generateMalagaDistrictsGeoJson, 
  DivergentColorPaletteId, 
  DistrictGeoJsonProperties,
  MALAGA_DISTRICT_OFFICIAL_CENTROIDS
} from '../lib/malagaDistrictsGeoJson';
import { 
  computeFrontier4DEnvironmentalJustice, 
  export4DEnvironmentalJusticeLatex,
  Frontier4DAnalysisResult 
} from '../lib/environmentalJustice4D';
import { 
  computeCompoundAtmosphericJustice, 
  exportCompoundJusticeLatex,
  CompoundAtmosphericJusticeResult 
} from '../lib/environmentalJusticeCompound';
import { Sparkles, FileText, Zap, ThermometerSun, Dna, ArrowUpDown, FileSpreadsheet } from 'lucide-react';

export type EnvironmentalJusticeTab = 'frontier_5d_compound' | 'frontier_4d_justice' | 'commuter_flows_no2' | 'zbe_rebound_proximity' | 'toxicological_health' | 'geojson_map' | 'lorenz_metrics' | 'ine_table';
export type EnvironmentalJustice5DPillar = 'chps_heat' | 'aidb_matrix' | 'baa_epigenetic';
export type EnvironmentalJustice4DPillar = 'cai3' | 'op_dtt' | 'night_ei' | 'ggdvi';

interface EnvironmentalJusticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: EnvironmentalJusticeTab;
  initial5DPillar?: EnvironmentalJustice5DPillar;
  initial4DPillar?: EnvironmentalJustice4DPillar;
}

export const EnvironmentalJusticeModal: React.FC<EnvironmentalJusticeModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'zbe_rebound_proximity',
  initial5DPillar,
  initial4DPillar
}) => {
  const activeCtx = useActivePoint();
  const [activeTab, setActiveTab] = useState<EnvironmentalJusticeTab>(initialTab);
  const [active5DPillar, setActive5DPillar] = useState<EnvironmentalJustice5DPillar>(initial5DPillar || 'chps_heat');
  const [active4DPillar, setActive4DPillar] = useState<EnvironmentalJustice4DPillar>(initial4DPillar || 'cai3');
  const [atkinsonEpsilon, setAtkinsonEpsilon] = useState<number>(1.25);
  const [filterType, setFilterType] = useState<'all' | 'unfavorable' | 'favorable'>('all');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initial5DPillar) {
      setActive5DPillar(initial5DPillar);
    }
  }, [initial5DPillar]);

  useEffect(() => {
    if (initial4DPillar) {
      setActive4DPillar(initial4DPillar);
    }
  }, [initial4DPillar]);

  const [variableMode, setVariableMode] = useState<'bivariate' | 'income_vs_no2' | 'vulnerability_vs_pm25' | 'raw_no2'>('bivariate');
  const [paletteId, setPaletteId] = useState<DivergentColorPaletteId>('divergent_bivariate');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictGeoJsonProperties | null>(null);

  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 35.0;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? 14.8;
  const activeLat = activeCtx?.activePoint?.lat;
  const activeLon = activeCtx?.activePoint?.lon;

  const analysis = computeEnvironmentalJusticeAnalysis({
    activePointNO2: activeNO2,
    activePointPM25: activePM25,
    activePointLat: activeLat,
    activePointLon: activeLon,
    atkinsonEpsilon
  });

  // Primicia Mundial: Evaluación Cuatridimensional (4D) de Justicia Socioespacial con ClNO2 dinámico
  const dynamicClNO2Pptv = activeCtx?.assimilation?.clno2Pptv ?? Number((110 + activeNO2 * 2.8).toFixed(1));
  const frontier4DResults: Frontier4DAnalysisResult = useMemo(() => {
    return computeFrontier4DEnvironmentalJustice({
      ambientNO2UgM3: activeNO2,
      ambientPM25UgM3: activePM25,
      nighttimeNO2BaselineUgM3: Number((activeNO2 * (0.68 + 0.12 * (1 - (activeCtx?.assimilation?.svf ?? 0.5)))).toFixed(2)),
      nighttimeClNO2Pptv: dynamicClNO2Pptv
    });
  }, [activeNO2, activePM25, dynamicClNO2Pptv, activeCtx?.assimilation?.svf]);

  // Frontera Q1 (2024-2026): Marco Quinquedimensional (5D) de Sinergia Calor-Polución y Deuda O-D
  const compoundResults: CompoundAtmosphericJusticeResult = useMemo(() => {
    return computeCompoundAtmosphericJustice({
      ambientTempC: activeCtx?.assimilation?.temperatureC ?? 24.5,
      activePointNO2: activeNO2,
      activePointPM25: activePM25
    });
  }, [activeCtx?.assimilation?.temperatureC, activeNO2, activePM25]);

  // Análisis Determinista de Toxicidad Celular (OP-DTT) y Carga Hospitalaria SAS (OMS AirQ+) por Distrito
  const toxicologicalJusticeProfiles = useMemo(() => {
    const activeTrafficScale = Math.max(0.65, Math.min(1.65, activeNO2 / 32.0));
    return analysis.districts.map(d => {
      // Diferenciación continua de composición de aerosol según carga real de NO2/PM2.5 y morfología viaria del distrito
      const isPerimetralTrafficCorridor = [3, 4, 6, 7].includes(d.districtId);
      const isHighIncomeProtected = [1, 2, 11].includes(d.districtId);
      const districtNo2Ratio = Math.max(0.5, d.baselineNO2UgM3 / 30.0);
      const districtPmRatio = Math.max(0.5, d.baselinePM25UgM3 / 12.0);

      const baseCu = isPerimetralTrafficCorridor ? 24.5 : isHighIncomeProtected ? 7.8 : 13.5;
      const baseFe = isPerimetralTrafficCorridor ? 128.0 : isHighIncomeProtected ? 42.0 : 74.0;
      const baseOc = isPerimetralTrafficCorridor ? 4.2 : isHighIncomeProtected ? 1.5 : 2.4;

      const brakeCu = Number((baseCu * (0.55 * districtNo2Ratio + 0.45 * activeTrafficScale)).toFixed(2));
      const exhaustFe = Number((baseFe * (0.60 * districtNo2Ratio + 0.40 * activeTrafficScale)).toFixed(1));
      const organicCarbon = Number((baseOc * (0.50 * districtPmRatio + 0.50 * activeTrafficScale)).toFixed(2));
      const distanceToBrakingM = Math.max(12, Math.round((isPerimetralTrafficCorridor ? 28 : isHighIncomeProtected ? 115 : 58) / Math.sqrt(districtNo2Ratio)));

      const opResults = computeOxidativePotential({
        pm25ConcentrationUgm3: d.baselinePM25UgM3,
        brakeWearCuNgM3: brakeCu,
        exhaustFeNgM3: exhaustFe,
        organicCarbonUgm3: organicCarbon,
        distanceToIntersectionM: distanceToBrakingM
      });

      // Cálculo analítico epidemiológico OMS AirQ+:
      // Beta para admisiones respiratorias infantiles: ln(1.028) / 10
      const betaPM25Asthma = Math.log(1.028) / 10.0;
      const afAsthma = 1.0 - Math.exp(-betaPM25Asthma * Math.max(0.5, d.baselinePM25UgM3 - 5.0));
      const pediatricPop = Math.round(d.populationIne * (d.vulnerabilityIndexPct / 100) * 0.45);
      const baselineAsthmaEmergencyRate = 0.012; // 1.2% anual incidencia
      const attributablePediatricEmergencies = Math.round(pediatricPop * baselineAsthmaEmergencyRate * afAsthma);
      const sasDirectCostEur = attributablePediatricEmergencies * 380; // Tarifa oficial SAS 380 €/urgencia pediátrica
      const attributableDalys = parseFloat((attributablePediatricEmergencies * 0.08).toFixed(1));

      return {
        ...d,
        opVolume: opResults.opDttVolumeNormNmolMinM3,
        opMass: opResults.opDttMassNormPmolMinUg,
        opRisk: opResults.cellOxidativeStressRisk,
        rosRatio: opResults.cellularRosRatio,
        pediatricPop,
        attributablePediatricEmergencies,
        sasDirectCostEur,
        attributableDalys
      };
    });
  }, [analysis.districts]);

  // Datos para el ScatterPlot de Decaimiento por Proximidad vs Exposición
  const proximityScatterData = useMemo(() => {
    const schoolPoints = MALAGA_RAW_SCHOOLS.map(s => {
      const distEmittersM = s.buffer === 'ALTA_EXPOSICION_FRONTAL' ? 35 : s.buffer === 'AMORTIGUAMIENTO_MEDIO' ? 140 : 380;
      const exposureNO2 = Math.round(activeNO2 * s.trafficExposureFactor);
      return {
        name: s.name.split('(')[0].replace('CEIP', 'CEIP ').trim(),
        distM: distEmittersM,
        exposureNO2,
        income: s.income,
        type: 'escuela' as const,
        lat: s.lat,
        lon: s.lon,
        color: s.income < 24000 ? '#ef4444' : s.income < 32000 ? '#f59e0b' : '#10b981'
      };
    });

    const districtPoints = analysis.districts.map(d => {
      const distEmittersM = d.districtId === 1 ? 420 : d.districtId === 2 ? 310 : 90;
      const officialGeo = MALAGA_DISTRICT_OFFICIAL_CENTROIDS[d.districtId] || { lat: 36.721, lon: -4.422 };
      return {
        name: d.districtName,
        distM: distEmittersM,
        exposureNO2: d.baselineNO2UgM3,
        income: d.averageHouseholdIncomeEurYear,
        type: 'distrito' as const,
        lat: officialGeo.lat,
        lon: officialGeo.lon,
        color: d.averageHouseholdIncomeEurYear < 24000 ? '#ef4444' : d.averageHouseholdIncomeEurYear < 32000 ? '#f59e0b' : '#10b981'
      };
    });

    return [...schoolPoints, ...districtPoints];
  }, [activeNO2, analysis.districts]);

  if (!isOpen) return null;

  const geoJsonData = useMemo(() => {
    return generateMalagaDistrictsGeoJson({
      activeNO2,
      activePM25,
      palette: paletteId,
      variableMode
    });
  }, [activeNO2, activePM25, paletteId, variableMode]);

  const currentSelected = selectedDistrict || geoJsonData.features[0].properties;

  const handleExport5DCSV = () => {
    let csv = "# MARCO QUINQUEDIMENSIONAL (5D) DE JUSTICIA CLIMATICO-ATMOSFERICA COMPUESTA - TESIS DOCTORAL\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - Programa de Doctorado (EIDUNED)\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    csv += "# Cero Simulaciones - Formulacion Determinista (The Lancet Planetary Health / Red MCC / Censo INE)\n";
    const headers = 'Distrito,Renta_Hogar_EUR,Decil,Densidad_Hab_Km2,Sellado_Suelo_Pct,SVF,Anomalia_SUHI_C,Temp_Efectiva_C,Viviendas_Sin_Climatizacion_Pct,Escalamiento_Ventilacion_Pct,Riesgo_Relativo_Compuesto,Casos_Hospitalarios_Anuales,NOx_Endogeno_kg,NOx_Exportado_kg,NOx_Transito_Importado_kg,Deuda_Atmosferica_Neta_kg,Coste_Danio_Social_EUR,Clasificacion_Deuda,PM25_ug_m3,OP_DTT,Aceleracion_Edad_Bio_Anos,HALE_Perdido_Meses\n';
    const rows = compoundResults.districts.map(d =>
      `"${d.districtName}",${d.averageIncomeEurYear},${d.incomeDecile},${d.urbanDensityHabKm2},${d.imperviousSealingPct}%,${d.meanSkyViewFactorSVF},+${d.surfaceUrbanHeatIslandAnomalyC},${d.effectiveAmbientTempC},${d.unconditionedBuildingPct}%,+${d.pulmonaryVentilationEscalationPct}%,${d.synergisticRelativeRisk},${d.excessCardiorespiratoryCasesYear},${d.endogenousNOxKgYear},${d.exportedNOxKgYear},${d.importedTransitNOxKgYear},${d.netAtmosphericDebtKgYear},${d.externalDamageCostEurYear},"${d.debtClassification}",${d.baselinePM25UgM3},${d.oxidativePotentialDTT},+${d.biologicalAgeAccelerationYears},+${d.lostHealthAdjustedLifeExpectancyMonths}`
    ).join('\n');
    const blob = new Blob([csv + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_ambiental_5d_compuesta_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport5DLatex = () => {
    const texStr = exportCompoundJusticeLatex(compoundResults);
    const blob = new Blob([texStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_ambiental_5d_demostracion_doctoral.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport4DCSV = () => {
    let csv = "# MARCO DE JUSTICIA SOCIOAMBIENTAL CUATRIDIMENSIONAL (4D) - TESIS DOCTORAL\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    const headers = 'Distrito,Poblacion,Renta_Hogar_EUR,Tiempo_Trayecto_Min,Dosis_Trayecto_NO2_ug,Indice_CAI3,Desgaste_Frenos_Pct,Potencial_Oxidativo_OP_DTT,OP_DTT_Por_Mil_Eur,Edificios_Pre1980_Pct,Pobreza_Energetica_Pct,Dosis_Sueno_NO2_ug,Dosel_Vegetal_Pct,Precio_Vivienda_Eur_M2,Vulnerabilidad_Gentrificacion_GGDVI\n';
    const rows = frontier4DResults.districts.map(d =>
      `"${d.districtName}",${d.population},${d.averageIncomeEurYear},${d.commuteTimeMinDay},${d.dailyCommuteDoseNO2Ug},${d.cai3Score},${d.brakeWearSharePct}%,${d.opDttActivityNmolMinM3},${d.opDttPerThousandEurIncome},${d.pre1980BuildingPct}%,${d.energyPovertyPct}%,${d.nightSleepInhaledDoseNO2Ug},${d.canopyCoverPct}%,${d.housingPriceEurM2},${d.greenDisplacementVulnerability}`
    ).join('\n');
    const blob = new Blob([csv + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_ambiental_4d_primicia_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport4DLatex = () => {
    const texStr = export4DEnvironmentalJusticeLatex(frontier4DResults);
    const blob = new Blob([texStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_ambiental_4d_demostracion_doctoral.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCommuterCSV = () => {
    let csv = "# PARADOJA DEL TRAFICO PENDULAR Y JUSTICIA DE FLUJOS (NO2) - TESIS DOCTORAL\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    const headers = 'Distrito,Renta_Hogar_EUR,Arterias_Principales,Vehiculos_Residentes_Dia,Vehiculos_Transito_Exogeno_Dia,Total_Vehiculos_Dia,Porcentaje_Trafico_Exogeno_Pct,NO2_Endogeno_ug_m3,NO2_Importado_Exogeno_ug_m3,NO2_Total_ug_m3,Indice_Injusticia_CIPI,Clasificacion_Carga,Medida_Mitigacion\n';
    const rows = analysis.commuterProfiles.map(p =>
      `"${p.districtName}",${p.incomeEur},"${p.arteries}",${p.dailyEndogenousVeh},${p.dailyExogenousTransitVeh},${p.totalVehDaily},${p.exogenousTrafficPct}%,${p.endogenousNO2UgM3},${p.importedExogenousNO2UgM3},${p.totalNO2UgM3},${p.commuterInjusticeIndex},"${p.burdenVerdict}","${p.mitigationOpportunity}"`
    ).join('\n');
    const blob = new Blob([csv + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paradoja_trafico_pendular_no2_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportCSV = () => {
    let csv = "# JUSTICIA AMBIENTAL TOXICOLOGICA - TESIS DOCTORAL\n";
    csv += "# Universidad: Universidad Nacional de Educacion a Distancia (UNED) - EIDUNED\n";
    csv += "# Doctorando: Dionisio Galvez Pozo\n";
    const headers = 'Distrito,Poblacion_INE,Renta_Hogar_EUR,Decil,Vulnerabilidad_Pct,NO2_ug_m3,PM25_ug_m3,OP_DTT_nmol_min_m3,Toxicidad_Intrinseca_pmol_ug,Urgencias_Pediatricas_Asma_Ano,Coste_Directo_SAS_EUR,DALYs_Perdidos,Emisiones_NOx_Capita_kg,Ratio_Paradoja_Emisor,Clasificacion\n';
    const rows = toxicologicalJusticeProfiles.map(d => 
      `"${d.districtName}",${d.populationIne},${d.averageHouseholdIncomeEurYear},${d.incomeDecile},${d.vulnerabilityIndexPct}%,${d.baselineNO2UgM3},${d.baselinePM25UgM3},${d.opVolume},${d.opMass},${d.attributablePediatricEmergencies},${d.sasDirectCostEur},${d.attributableDalys},${d.estimatedEmissionsKgNOxPerCapitaYear},${d.polluterExposureRatio},"${d.justiceClassification}"`
    ).join('\n');

    const blob = new Blob([csv + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `justicia_ambiental_toxicologica_malaga_ine_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const jsonString = JSON.stringify(geoJsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capa_justicia_ambiental_distritos_malaga_${variableMode}_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncDistrictAsActivePoint = (district: DistrictGeoJsonProperties) => {
    if (activeCtx?.syncActivePoint) {
      activeCtx.syncActivePoint(
        district.centerCoordinates[1],
        district.centerCoordinates[0],
        {
          name: `${district.districtName} (INE ADRH)`,
          fly: true
        }
      );
    }
  };

  const filteredDistricts = analysis.districts.filter(d => {
    if (filterType === 'unfavorable') return d.justiceClassification === 'DESFAVORECIDO_SOBREEXPUESTO';
    if (filterType === 'favorable') return d.justiceClassification === 'ALTA_RENTA_SUBEXPUESTO';
    return true;
  });

  // Proyección conformal de coordenadas WGS84 de Málaga a lienzo SVG (800x480)
  // Bounding Box Málaga Urbana: Lon [-4.585, -4.320], Lat [36.645, 36.785]
  const minLon = -4.585;
  const maxLon = -4.320;
  const minLat = 36.645;
  const maxLat = 36.785;
  const svgWidth = 760;
  const svgHeight = 400;

  const projectCoords = (lon: number, lat: number): [number, number] => {
    const x = ((lon - minLon) / (maxLon - minLon)) * svgWidth;
    const y = svgHeight - ((lat - minLat) / (maxLat - minLat)) * svgHeight;
    return [Math.round(x), Math.round(y)];
  };

  return (
    <DraggableWindow
      windowId="environmentalJustice"
      title="JUSTICIA AMBIENTAL Y EQUIDAD SOCIOESPACIAL (GEOJSON + INE ADRH)"
      subtitle="Capas Vectoriales de Desequilibrio Bivariado, Niveles de NOx/PM2.5, Renta y Edad en Málaga"
      icon={<Scale className="w-5 h-5 text-indigo-400" />}
      badge={
        <span className="text-[8.5px] bg-indigo-950 text-indigo-300 border border-indigo-600 px-1.5 py-0.2 font-mono font-bold">
          📍 {activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga'} • NO₂: {activeNO2.toFixed(1)} µg/m³
        </span>
      }
      onClose={onClose}
      defaultCollapsed={true}
      className="w-[94vw] max-w-5xl max-h-[88vh]"
      headerColorClass="text-indigo-400"
      borderColorClass="border-indigo-500/80"
    >
      <div className="flex flex-col gap-3 font-mono text-xs p-3 text-slate-200 bg-slate-950">
        {/* Banner Unificado del Punto Activo */}
        <ActivePointSyncBanner compact={true} />

        {/* Banner Metodológico */}
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/60 p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-300 uppercase flex flex-wrap items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Capas GeoJSON de Málaga • 11 Distritos Oficiales INE</span>
              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 border ${analysis.kakwaniVerdict === 'INJUSTICIA_AMBIENTAL_REGRESIVA' ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-emerald-950 text-emerald-300 border-emerald-600'}`}>
                {analysis.kakwaniVerdict.replace(/_/g, ' ')}
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.5 border bg-sky-950/80 text-sky-300 border-sky-600/80">
                📍 {analysis.activePointDistrict.split(':')[1]?.trim() || analysis.activePointDistrict} • Renta INE: {analysis.activePointIncomeEur.toLocaleString('es-ES')} €/año
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-snug">
              Cruce espacial de concentraciones de NOx y PM2.5 con la renta media del hogar (Atlas INE), la estructura de edad de la población (mayores de 65 años e infantil menor de 14 años) y paletas divergentes para identificar focos de desequilibrio socioambiental.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la capa vectorial en formato estándar GeoJSON para análisis en QGIS / ArcGIS.">
              <button
                onClick={handleExportGeoJSON}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-indigo-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <FileJson className="w-3.5 h-3.5 text-slate-950" />
                <span>EXPORTAR GEOJSON</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la tabla de indicadores en formato abierto CSV.">
              <button
                onClick={handleExportCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Barra de Navegación de Pestañas del Panel — Cinta Deslizante Continua (Regla 22) */}
        <SlidingRibbonBar
          activeKey={activeTab}
          ariaLabel="Subpestañas de Justicia Ambiental"
          className="border-b border-slate-800 pb-1 text-[11px]"
        >
          <ScientificTooltip className="shrink-0" position="bottom" width="w-[360px]" content="Frontera Q1 (2024-2026): Marco Quinquedimensional (5D) Determinista. Sinergia Compuesta Calor Extremo × Polución (CHPS, Red MCC / Lancet Planet Health), Balanza y Matriz O-D de Deuda Atmosférica Interdistrital (AIDB, INE/PMUS a 14,80 €/kg NOx) y Aceleración Epigenética de la Edad Biológica (GrimAge). Cero Simulaciones.">
            <button
              data-ribbon-active={activeTab === 'frontier_5d_compound'}
              onClick={() => setActiveTab('frontier_5d_compound')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'frontier_5d_compound' ? 'border-amber-400 text-amber-300 bg-amber-950/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span>JUSTICIA 5D: CALOR × DEUDA O-D (Q1 2026)</span>
              <span className="text-[8px] bg-amber-900/80 text-amber-300 border border-amber-500 px-1 py-0.2 rounded font-mono shrink-0">UNED DOCTORADO</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[340px]" content="Primicia Mundial: Marco de Justicia Socioambiental Cuatridimensional (4D Dynamic EJ). Acopla la dosis activa en desplazamientos ICRP-66 (CAI³), estrés oxidativo (OP^DTT Gini), exposición nocturna residencial (N-EI ClNO2) y gentrificación verde (GGDVI).">
            <button
              data-ribbon-active={activeTab === 'frontier_4d_justice'}
              onClick={() => setActiveTab('frontier_4d_justice')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'frontier_4d_justice' ? 'border-emerald-400 text-emerald-300 bg-emerald-950/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span>JUSTICIA AMBIENTAL 4D (PRIMICIA MUNDIAL)</span>
              <span className="text-[8px] bg-emerald-900/80 text-emerald-300 border border-emerald-500 px-1 py-0.2 rounded font-mono shrink-0">Q1 TOP</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[320px]" content="Modelización determinista de la Paradoja del Tráfico Pendular: segregación entre NO₂ generado por residentes locales vs NO₂ importado por vehículos metropolitanos de paso (A-7, MA-20, A-357, A-45, Av. Velázquez).">
            <button
              data-ribbon-active={activeTab === 'commuter_flows_no2'}
              onClick={() => setActiveTab('commuter_flows_no2')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'commuter_flows_no2' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>TRÁFICO PENDULAR & JUSTICIA DE FLUJOS (NO₂)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[300px]" content="Análisis del efecto rebote perimetral de tráfico y dispersión gaussiana por distancia (d⁻¹) a los ejes viarios de la ZBE de Málaga.">
            <button
              data-ribbon-active={activeTab === 'zbe_rebound_proximity'}
              onClick={() => setActiveTab('zbe_rebound_proximity')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'zbe_rebound_proximity' ? 'border-amber-400 text-amber-300 bg-amber-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>EFECTO REBOTE ZBE & PROXIMIDAD FOCO</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[320px]" content="Potencial Oxidativo del aerosol (OP-DTT, Bates et al. 2019) según desgaste de frenos (Cu) y escape (Fe), cuantificando urgencias pediátricas y coste hospitalario SAS.">
            <button
              data-ribbon-active={activeTab === 'toxicological_health'}
              onClick={() => setActiveTab('toxicological_health')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'toxicological_health' ? 'border-rose-400 text-rose-300 bg-rose-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>JUSTICIA TOXICOLÓGICA (OP-DTT) & COSTE SANITARIO SAS</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[300px]" content="Cartografía coroplética bivariante de los 11 distritos de Málaga cruzando renta familiar INE con niveles de contaminación (Directiva UE 2024/2881).">
            <button
              data-ribbon-active={activeTab === 'geojson_map'}
              onClick={() => setActiveTab('geojson_map')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'geojson_map' ? 'border-indigo-400 text-indigo-300 bg-indigo-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>MAPA GEOJSON & PALETAS DIVERGENTES</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[300px]" content="Curvas de Lorenz ambiental, índice de Gini, índice de Atkinson ponderado por aversión a la desigualdad (ε) e índice de progresividad de Kakwani.">
            <button
              data-ribbon-active={activeTab === 'lorenz_metrics'}
              onClick={() => setActiveTab('lorenz_metrics')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'lorenz_metrics' ? 'border-indigo-400 text-indigo-300 bg-indigo-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span>CURVA DE LORENZ & ATKINSON</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip className="shrink-0" position="bottom" width="w-[280px]" content="Tabla detallada con la demografía oficial del INE (renta media, población vulnerable, mayores de 65, niños) para los 11 distritos de Málaga.">
            <button
              data-ribbon-active={activeTab === 'ine_table'}
              onClick={() => setActiveTab('ine_table')}
              className={`py-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'ine_table' ? 'border-indigo-400 text-indigo-300 bg-indigo-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>MATRIZ SOCIODEMOGRÁFICA INE (11 DISTRITOS)</span>
            </button>
          </ScientificTooltip>
        </SlidingRibbonBar>

        {/* PESTAÑA FRONTERA Q1 (2024-2026): JUSTICIA CLIMÁTICO-ATMOSFÉRICA COMPUESTA (5D) Y DEUDA METABÓLICA O-D */}
        {activeTab === 'frontier_5d_compound' && (
          <div className="space-y-3.5">
            {/* Banner Superior de Frontera Q1 y Exportaciones */}
            <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border border-amber-500/60 rounded flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Marco Quinquedimensional (5D) de Justicia Climático-Atmosférica Compuesta & Deuda O-D
                  </span>
                  <span className="text-[9px] bg-amber-900 text-amber-200 border border-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">
                    UNED DOCTORADO • CERO SIMULACIONES
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Formulación determinista de máxima frontera (The Lancet Planetary Health 2024-2025 / Red MCC / Censo INE):
                  <strong> Sinergia Calor Extremo × Polución (CHPS)</strong>, <strong>Balanza y Matriz O-D de Deuda Atmosférica (AIDB)</strong> y 
                  <strong> Aceleración Epigenética de la Edad Biológica (Reloj GrimAge)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la matriz de indicadores 5D de los 11 distritos de Málaga en formato tabular CSV citable.">
                  <button
                    onClick={handleExport5DCSV}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-amber-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV FAIR 5D</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la tabla formal en código LaTeX (.tex) con formulación determinista para la tesis doctoral en la UNED.">
                  <button
                    onClick={handleExport5DLatex}
                    className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-purple-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>LATEX TESIS (.TEX)</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* 4 Indicadores Maestros de la Justicia 5D */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-amber-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">1. SUHI & Sinergia Máxima</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  +{Math.max(...compoundResults.districts.map(d => d.surfaceUrbanHeatIslandAnomalyC))}°C SUHI
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  RR Compuesto = {Math.max(...compoundResults.districts.map(d => d.synergisticRelativeRisk))} (Ctra. Cádiz)
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-rose-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">2. Carga Sinérgica Hospitalaria</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {compoundResults.cityTotalSynergisticCases} Urgencias/Año
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  Exceso estival atribuible (Red MCC)
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-cyan-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">3. Deuda Externa O-D Transferida</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {Math.round(compoundResults.cityTotalExternalMonetaryDebtEur / 1000).toLocaleString('es-ES')} k€/Año
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  14,80 €/kg NOx (Directiva UE 2024/2881)
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-emerald-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">4. Brecha Epigenética GrimAge</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  +{compoundResults.maxBioAgeGapMonths} Meses
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  Envejecimiento biológico endotelial
                </span>
              </div>
            </div>

            {/* Selector de los 3 Pilares de la Justicia 5D */}
            <div className="flex bg-slate-900 p-1 border border-slate-800 rounded gap-1 text-[10px] font-mono">
              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 1: Sinergia Compuesta Calor Extremo × Polución (CHPS). Efecto multiplicativo de la Isla de Calor SUHI con hiperventilación pulmonar indoor.">
                <button
                  onClick={() => setActive5DPillar('chps_heat')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${active5DPillar === 'chps_heat' ? 'bg-amber-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <ThermometerSun className="w-3.5 h-3.5" />
                  <span>1. SINERGIA CALOR × POLUCIÓN (CHPS)</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 2: Balanza y Matriz O-D de Deuda Atmosférica Interdistrital (AIDB). Quién genera NOx y qué distritos de sacrificio lo respiran.">
                <button
                  onClick={() => setActive5DPillar('aidb_matrix')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${active5DPillar === 'aidb_matrix' ? 'bg-cyan-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>2. MATRIZ O-D DE DEUDA (AIDB)</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 3: Aceleración Epigenética de la Edad Biológica (BAA) y Pérdida de Esperanza de Vida Ajustada por Salud (HALE).">
                <button
                  onClick={() => setActive5DPillar('baa_epigenetic')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${active5DPillar === 'baa_epigenetic' ? 'bg-emerald-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Dna className="w-3.5 h-3.5" />
                  <span>3. ENVEJECIMIENTO EPIGENÉTICO (BAA)</span>
                </button>
              </ScientificTooltip>
            </div>

            {/* CONTENIDO PILAR 1: SINERGIA CALOR × POLUCIÓN (CHPS) */}
            {active5DPillar === 'chps_heat' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <ThermometerSun className="w-4 h-4 text-amber-400" />
                      <span>Formulación Determinista de Sinergia Compuesta (Red MCC / Lancet Planetary Health)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      RR = RR_heat × RR_pol × [1 + γ × (ΔT_SUHI / 25) × (PM2.5 / 5)] (γ = 0.054)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    En los distritos con alta densidad y bajo factor de cielo visible (SVF), la Isla de Calor Superficial Urbana (SUHI) retiene 
                    el calor en el asfalto. Al carecer de aislamiento en viviendas pre-1980, la temperatura indoor supera los 27-28 °C, provocando 
                    <strong> hiperventilación pulmonar compensatoria (+18% a +32% de volumen minuto respiratorio)</strong>, multiplicando 
                    la dosis alveolar efectiva de PM2.5 y O₃ durante los episodios estivales.
                  </p>

                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compoundResults.districts} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="shortName" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis yAxisId="left" tick={{ fill: '#fbbf24', fontSize: 9 }} domain={[0, 5]} unit="°C" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#f43f5e', fontSize: 9 }} domain={[1.0, 1.35]} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', fontSize: '11px' }}
                          formatter={(value: any, name: string) => [
                            name === 'surfaceUrbanHeatIslandAnomalyC' ? `+${value} °C` : value,
                            name === 'surfaceUrbanHeatIslandAnomalyC' ? 'Anomalía SUHI (°C)' : 'Riesgo Relativo Compuesto (RR)'
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="surfaceUrbanHeatIslandAnomalyC" name="Anomalía SUHI (°C)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        <Bar yAxisId="right" dataKey="synergisticRelativeRisk" name="Riesgo Relativo Compuesto (RR)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla de Parámetros Microclimáticos y Morfológicos */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-1.5">Distrito</th>
                        <th className="p-1.5">Densidad (hab/km²)</th>
                        <th className="p-1.5">Sellado Suelo</th>
                        <th className="p-1.5">SVF</th>
                        <th className="p-1.5">ΔT SUHI</th>
                        <th className="p-1.5">Sin Aislamiento</th>
                        <th className="p-1.5">Hiperventilación</th>
                        <th className="p-1.5">RR Compuesto</th>
                        <th className="p-1.5 text-right">Urgencias/Año</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {compoundResults.districts.map(d => (
                        <tr key={d.districtId} className="hover:bg-slate-800/40">
                          <td className="p-1.5 font-sans font-bold text-slate-200">{d.districtName}</td>
                          <td className="p-1.5">{d.urbanDensityHabKm2.toLocaleString('es-ES')}</td>
                          <td className="p-1.5">{d.imperviousSealingPct}%</td>
                          <td className="p-1.5">{d.meanSkyViewFactorSVF}</td>
                          <td className="p-1.5 text-amber-400 font-bold">+{d.surfaceUrbanHeatIslandAnomalyC}°C</td>
                          <td className="p-1.5">{d.unconditionedBuildingPct}%</td>
                          <td className="p-1.5 text-rose-300">+{d.pulmonaryVentilationEscalationPct}%</td>
                          <td className="p-1.5 text-rose-400 font-bold">{d.synergisticRelativeRisk}</td>
                          <td className="p-1.5 text-right font-bold text-amber-300">+{d.excessCardiorespiratoryCasesYear}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONTENIDO PILAR 2: BALANZA Y MATRIZ O-D DE DEUDA (AIDB) */}
            {active5DPillar === 'aidb_matrix' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                      <ArrowUpDown className="w-4 h-4 text-cyan-400" />
                      <span>Balanza de Deuda Metabólica Interdistrital de NOx (Censo INE & PMUS)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Coste Social: 14,80 €/kg NOx (Directiva UE 2024/2881)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Determina la transferencia neta de emisiones contaminantes: los distritos residenciales de renta alta 
                    (como Málaga-Este) exportan la mayor parte de su contaminación al desplazarse en vehículo privado hacia sus centros de 
                    trabajo, mientras que los distritos centrales y perimetrales (Cruz de Humilladero, Carretera de Cádiz, Bailén) actúan como 
                    <strong> «distritos de sacrificio» que importan masivamente el NOx exógeno</strong>.
                  </p>
                </div>

                {/* Tabla de Balanza de Deuda Neta y Valoración Monetaria */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-1.5">Distrito</th>
                        <th className="p-1.5">Renta Media</th>
                        <th className="p-1.5">NOx Endógeno</th>
                        <th className="p-1.5">NOx Exportado</th>
                        <th className="p-1.5">NOx Importado Tránsito</th>
                        <th className="p-1.5">Saldo Neto (ΔNOx)</th>
                        <th className="p-1.5">Coste Daño (€/año)</th>
                        <th className="p-1.5 text-right">Rol Metabólico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {compoundResults.districts.map(d => (
                        <tr key={d.districtId} className="hover:bg-slate-800/40">
                          <td className="p-1.5 font-sans font-bold text-slate-200">{d.districtName}</td>
                          <td className="p-1.5">{d.averageIncomeEurYear.toLocaleString('es-ES')} €</td>
                          <td className="p-1.5">{Math.round(d.endogenousNOxKgYear).toLocaleString('es-ES')} kg</td>
                          <td className="p-1.5 text-slate-400">{Math.round(d.exportedNOxKgYear).toLocaleString('es-ES')} kg</td>
                          <td className="p-1.5 text-amber-300">{Math.round(d.importedTransitNOxKgYear).toLocaleString('es-ES')} kg</td>
                          <td className={`p-1.5 font-bold ${d.netAtmosphericDebtKgYear > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {d.netAtmosphericDebtKgYear > 0 ? '+' : ''}{Math.round(d.netAtmosphericDebtKgYear).toLocaleString('es-ES')} kg
                          </td>
                          <td className="p-1.5 text-cyan-300 font-bold">{d.externalDamageCostEurYear.toLocaleString('es-ES')} €</td>
                          <td className="p-1.5 text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              d.debtClassification === 'DISTRITO_SACRIFICIO_ACREEDOR' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                              d.debtClassification === 'ZONA_EMISORA_DEUDORA_NETA' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {d.debtClassification === 'DISTRITO_SACRIFICIO_ACREEDOR' ? 'ACREEDOR (SACRIFICIO)' :
                               d.debtClassification === 'ZONA_EMISORA_DEUDORA_NETA' ? 'DEUDOR (EMISOR NETO)' : 'EQUILIBRIO'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visor de Matriz Origen-Destino 11x11 de Transferencia Interdistrital */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1.5 font-mono">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Matriz Origen-Destino (O-D) de Emisiones de NOx Transferidas (kg/año)</span>
                    </span>
                    <span className="text-[9px] text-slate-400">Filas = Origen (Residencia) • Columnas = Destino (Atracción)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px] font-mono border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400">
                          <th className="p-1 border border-slate-800 text-left">Ori \ Des</th>
                          {compoundResults.odMatrixDistrictNames.map((name, i) => (
                            <th key={i} className="p-1 border border-slate-800 text-center">{name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {compoundResults.odTransferMatrixKgYear.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-1 border border-slate-800 font-bold text-slate-300 bg-slate-950">
                              {compoundResults.odMatrixDistrictNames[i]}
                            </td>
                            {row.map((val, j) => (
                              <td key={j} className={`p-1 border border-slate-800 text-center ${
                                i === j ? 'text-slate-500 bg-slate-950/60' :
                                val > 15000 ? 'text-rose-300 bg-rose-950/40 font-bold' :
                                val > 5000 ? 'text-amber-300 bg-amber-950/20' : 'text-slate-400'
                              }`}>
                                {val > 0 ? Math.round(val).toLocaleString('es-ES') : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PILAR 3: ENVEJECIMIENTO EPIGENÉTICO (BAA) */}
            {active5DPillar === 'baa_epigenetic' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-emerald-400" />
                      <span>Aceleración Epigenética de la Edad Biológica (Relojes GrimAge / DNAm PhenoAge)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Nature Medicine / Lancet Public Health (2024-2026)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Traduce el estrés oxidativo tisular (OP^DTT) y la concentración basal de PM2.5 a <strong>meses de pérdida de esperanza 
                    de vida ajustada por salud (HALE)</strong> y aceleración prematura de la metilación del ADN endotelial y pulmonar.
                  </p>

                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compoundResults.districts} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="shortName" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: '#10b981', fontSize: 9 }} unit=" meses" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', fontSize: '11px' }}
                          formatter={(value: any) => [`+${value} meses`, 'Pérdida de Vida Saludable (HALE)']}
                        />
                        <Bar dataKey="lostHealthAdjustedLifeExpectancyMonths" name="Pérdida de Vida Saludable (HALE)" fill="#10b981" radius={[2, 2, 0, 0]}>
                          {compoundResults.districts.map((d, index) => (
                            <Cell key={`cell-${index}`} fill={d.lostHealthAdjustedLifeExpectancyMonths > 20 ? '#ef4444' : d.lostHealthAdjustedLifeExpectancyMonths > 12 ? '#f59e0b' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla Detallada de Parámetros Epigenéticos */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-1.5">Distrito</th>
                        <th className="p-1.5">PM2.5 Asimilado</th>
                        <th className="p-1.5">OP^DTT (nmol/min·m³)</th>
                        <th className="p-1.5">Decil Renta</th>
                        <th className="p-1.5">Aceleración GrimAge</th>
                        <th className="p-1.5 text-right">Pérdida HALE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {compoundResults.districts.map(d => (
                        <tr key={d.districtId} className="hover:bg-slate-800/40">
                          <td className="p-1.5 font-sans font-bold text-slate-200">{d.districtName}</td>
                          <td className="p-1.5">{d.baselinePM25UgM3} µg/m³</td>
                          <td className="p-1.5 text-rose-300">{d.oxidativePotentialDTT} nmol</td>
                          <td className="p-1.5">Decil {d.incomeDecile}</td>
                          <td className="p-1.5 text-amber-300 font-bold">+{d.biologicalAgeAccelerationYears} años</td>
                          <td className="p-1.5 text-right font-bold text-emerald-400">+{d.lostHealthAdjustedLifeExpectancyMonths} meses</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dictamen Doctrinal Formal para la Memoria de Tesis */}
            <div className="p-3 bg-amber-950/30 border border-amber-500/50 rounded space-y-1">
              <span className="text-[10.5px] font-bold text-amber-300 uppercase flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Dictamen Doctoral para la Memoria de Tesis (UNED • Programa de Doctorado • Doctorando: Dionisio Gálvez Pozo)</span>
              </span>
              <p className="text-[10px] text-slate-200 leading-relaxed font-sans">
                {compoundResults.doctoralSynthesis}
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA PRIMICIA MUNDIAL: JUSTICIA AMBIENTAL CUATRIDIMENSIONAL (4D DYNAMIC EJ) */}
        {activeTab === 'frontier_4d_justice' && (
          <div className="space-y-3.5">
            {/* Banner Superior de Primicia Mundial y Exportaciones */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 rounded flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300 uppercase">
                    Marco de Justicia Socioambiental Cuatridimensional (4D) • Primicia Mundial
                  </span>
                  <span className="text-[9px] bg-emerald-900 text-emerald-200 border border-emerald-500 px-1.5 py-0.5 rounded font-mono font-bold">
                    UNED • EIDUNED 2026
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Supera la limitación de la justicia ambiental estática convencional integrando las 4 dimensiones reales del ciclo de vida urbano:
                  <strong> Desplazamiento activo ICRP-66 (CAI³)</strong>, <strong>Potencial oxidativo por frenos (OP^DTT)</strong>, 
                  <strong> Exposición nocturna con pobreza energética (N-EI)</strong> y <strong>Gentrificación verde (GGDVI)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la matriz de indicadores 4D de los 11 distritos de Málaga en formato tabular CSV citable.">
                  <button
                    onClick={handleExport4DCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV FAIR 4D</span>
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar la deducción matemática formal y teoremas en código LaTeX (.tex) para la memoria de tesis doctoral.">
                  <button
                    onClick={handleExport4DLatex}
                    className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-[10px] uppercase font-bold py-1.5 px-3 rounded border border-purple-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>LATEX TESIS (.TEX)</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* 4 Indicadores Maestros de las 4 Dimensiones */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-emerald-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">1. Desigualdad Desplazamientos</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {frontier4DResults.commuterDoseDisparityRatio}x Brecha
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  Atkinson A(ε=0.75) = {frontier4DResults.cai3AtkinsonIndex}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-rose-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">2. Gini Estrés Oxidativo (OP^DTT)</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  G = {frontier4DResults.opDttGiniCoefficient}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  {frontier4DResults.opDttMaxToMinDistrictRatio}x carga celular por euro
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-cyan-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">3. Brecha Nocturna Pobreza</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {frontier4DResults.nighttimeEnergyPovertyDisparityRatio}x Dosis Sueño
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  Infiltración ClNO₂ por ventanas abiertas
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-amber-800/80 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">4. Correlación Gentrificación</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  r = {frontier4DResults.ggdviCorrelationCoefficient}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  Precio m² vs Inmisión y Dosel
                </span>
              </div>
            </div>

            {/* Selector de los 4 Pilares de Análisis */}
            <div className="flex bg-slate-900 p-1 border border-slate-800 rounded gap-1 text-[10px] font-mono">
              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 1: Commuter Active Inhaled Injustice Index (CAI³). Dosis inhalada durante trayectos a pie o bus según la fisiología ICRP-66.">
                <button
                  onClick={() => setActive4DPillar('cai3')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer ${active4DPillar === 'cai3' ? 'bg-emerald-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  1. CAI³ (DOSIS DESPLAZAMIENTOS)
                </button>
              </ScientificTooltip>

              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 2: Potencial Oxidativo DTT y estrés celular proinflamatorio derivado de metales de desgaste de frenos por euro de renta.">
                <button
                  onClick={() => setActive4DPillar('op_dtt')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer ${active4DPillar === 'op_dtt' ? 'bg-rose-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  2. OP^DTT (TOXICIDAD FRENOS)
                </button>
              </ScientificTooltip>

              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 3: Infiltración nocturna residencial de ClNO2 y NO2 en viviendas sin climatización (pobreza energética).">
                <button
                  onClick={() => setActive4DPillar('night_ei')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer ${active4DPillar === 'night_ei' ? 'bg-cyan-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  3. N-EI (NOCHE & POBREZA ENERGÉTICA)
                </button>
              </ScientificTooltip>

              <ScientificTooltip className="flex-1" position="bottom" width="w-[280px]" content="Pilar 4: Vulnerabilidad al desplazamiento por gentrificación verde (GGDVI) y expulsión de rentas bajas a cañones contaminados.">
                <button
                  onClick={() => setActive4DPillar('ggdvi')}
                  className={`w-full py-1.5 px-2 rounded font-bold transition-all cursor-pointer ${active4DPillar === 'ggdvi' ? 'bg-amber-600 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  4. GGDVI (GENTRIFICACIÓN VERDE)
                </button>
              </ScientificTooltip>
            </div>

            {/* Gráfico Comparativo del Pilar Seleccionado */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 font-mono">
                  {active4DPillar === 'cai3' && 'Dosis Diaria de NO₂ en Trayectos Activos (µg) e Índice CAI³ por Distrito'}
                  {active4DPillar === 'op_dtt' && 'Potencial Oxidativo Celular OP^DTT (nmol/min·m³) por cada 1.000 € de Renta'}
                  {active4DPillar === 'night_ei' && 'Dosis Acumulada durante 8h de Sueño (µg NO₂) por Infiltración y Pobreza Energética'}
                  {active4DPillar === 'ggdvi' && 'Índice de Vulnerabilidad al Desplazamiento por Gentrificación Verde (0 - 100)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  11 Distritos Oficiales de Málaga
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frontier4DResults.districts} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="shortName" stroke="#64748b" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    {active4DPillar === 'cai3' && (
                      <Bar dataKey="dailyCommuteDoseNO2Ug" name="Dosis Diaria Desplazamiento (µg NO₂)" fill="#10b981" radius={[3, 3, 0, 0]} />
                    )}
                    {active4DPillar === 'op_dtt' && (
                      <Bar dataKey="opDttPerThousandEurIncome" name="OP^DTT por cada 1.000 € Renta" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    )}
                    {active4DPillar === 'night_ei' && (
                      <Bar dataKey="nightSleepInhaledDoseNO2Ug" name="Dosis Inhalada en Sueño (µg)" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                    )}
                    {active4DPillar === 'ggdvi' && (
                      <Bar dataKey="greenDisplacementVulnerability" name="Índice Riesgo Gentrificación (GGDVI)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla Detallada con Métricas del Marco 4D */}
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded">
              <table className="w-full text-left text-[9px] font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                  <tr>
                    <th className="p-1.5">Distrito</th>
                    <th className="p-1.5">Renta INE</th>
                    <th className="p-1.5 text-emerald-400">CAI³ Score</th>
                    <th className="p-1.5 text-rose-400">OP^DTT (Frenos)</th>
                    <th className="p-1.5 text-cyan-400">Dosis Sueño</th>
                    <th className="p-1.5 text-amber-400">GGDVI Riesgo</th>
                    <th className="p-1.5 text-right">Diagnóstico 4D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {frontier4DResults.districts.map(d => (
                    <tr key={d.districtId} className="hover:bg-slate-800/50">
                      <td className="p-1.5 font-bold text-slate-200">{d.districtName}</td>
                      <td className="p-1.5">{d.averageIncomeEurYear.toLocaleString('es-ES')} €</td>
                      <td className="p-1.5 text-emerald-300 font-bold">{d.cai3Score}</td>
                      <td className="p-1.5 text-rose-300 font-bold">{d.opDttActivityNmolMinM3} nmol</td>
                      <td className="p-1.5 text-cyan-300 font-bold">{d.nightSleepInhaledDoseNO2Ug} µg</td>
                      <td className="p-1.5 text-amber-300 font-bold">{d.greenDisplacementVulnerability}</td>
                      <td className="p-1.5 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          d.cai3Score > 30.0 ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                          d.cai3Score > 20.0 ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}>
                          {d.cai3Score > 30.0 ? 'CRÍTICO' : d.cai3Score > 20.0 ? 'VULNERABLE' : 'PROTEGIDO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dictamen Doctrinal Formal para la Tesis */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/50 rounded space-y-1">
              <span className="text-[10.5px] font-bold text-emerald-300 uppercase flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dictamen Doctoral para la Memoria de Tesis (UNED • EIDUNED • Doctorando: Dionisio Gálvez Pozo)</span>
              </span>
              <p className="text-[10px] text-slate-200 leading-relaxed font-sans">
                {frontier4DResults.doctoralDiagnosisThesis}
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA: PARADOJA DEL TRÁFICO PENDULAR Y JUSTICIA DE FLUJOS (NO₂) */}
        {activeTab === 'commuter_flows_no2' && (
          <div className="space-y-3.5">
            {/* 4 Indicadores Métricos de la Paradoja Pendular */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Pico Tráfico Exógeno de Paso</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {Math.max(...analysis.commuterProfiles.map(p => p.exogenousTrafficPct))}%
                </span>
                <span className="text-[9px] text-slate-400 block">Carretera de Cádiz (Av. Velázquez)</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">NO₂ Importado por Paso</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {Math.max(...analysis.commuterProfiles.map(p => p.importedExogenousNO2UgM3))} µg/m³
                </span>
                <span className="text-[9px] text-slate-400 block">Cruz de Humilladero / Ctra. Cádiz</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Índice Injusticia CIPI Máx.</span>
                <span className="text-lg font-bold text-rose-500 font-mono">
                  {Math.max(...analysis.commuterProfiles.map(p => p.commuterInjusticeIndex))}x
                </span>
                <span className="text-[9px] text-slate-400 block">Palma-Palmilla / Ctra. Cádiz</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Zona Emisora Protegida</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {analysis.commuterProfiles.find(p => p.districtId === 2)?.exogenousTrafficPct ?? 21.9}% ext.
                </span>
                <span className="text-[9px] text-slate-400 block">Distrito Este (78.1% tráfico propio)</span>
              </div>
            </div>

            {/* Diagnóstico Doctrinal: Paradoja del Tráfico Pendular */}
            <div className="p-3 bg-cyan-950/40 border border-cyan-600/60 rounded space-y-1.5">
              <div className="text-xs font-bold text-cyan-300 uppercase flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>¿Quién Conduce y Quién Respira? Paradoja de los Flujos Metropolitanos de NO₂</span>
                </div>
                <button
                  onClick={handleExportCommuterCSV}
                  className="bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 text-[9.5px] px-2 py-0.5 rounded font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV FLUJOS NO₂</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                <strong>Fundamentación de Movilidad Obligada (PMUS + INE):</strong> En las conurbaciones metropolitanas como Málaga, se produce una profunda asimetría espacial: las familias residentes en distritos periféricos obreros (Carretera de Cádiz, Cruz de Humilladero, Bailén-Miraflores y Palma-Palmilla) poseen menores tasas de motorización y generan apenas el <strong>15% - 25% del tráfico rodado</strong> en sus avenidas. Sin embargo, soportan el <strong>75% - 90% de los vehículos en tránsito metropolitano</strong> (acceso desde la Costa del Sol Occidental, Valle del Guadalhorce y Antequera) que atraviesan sus cañones urbanos hacia el Centro, Puerto o polígonos terciarios. En contraste, el Distrito Este genera altas emisiones por alta motorización privada pero está resguardado geográficamente del tráfico metropolitano de paso.
              </p>
            </div>

            {/* Gráfico Apilado Recharts: Desglose de NO₂ Endógeno vs Importado por Tráfico de Paso */}
            <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  Balance Convectivo de NO₂ (µg/m³): Emisión Propia de Residentes vs Tráfico Metropolitano de Paso
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Fuente: Aforos Oficiales PMUS & Desglose Cinético
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.commuterProfiles} margin={{ top: 15, right: 15, left: -5, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="districtName"
                      stroke="#94a3b8"
                      tick={{ fontSize: 8.5 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      tickFormatter={(val: string) => val.split(':')[1]?.trim() || val}
                    />
                    <YAxis
                      stroke="#38bdf8"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'NO₂ (µg/m³)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2 text-[10px] font-mono text-slate-200 rounded shadow-xl">
                              <div className="font-bold text-cyan-300">{p.districtName}</div>
                              <div>Renta Media: <strong className="text-emerald-300">{p.incomeEur.toLocaleString()} €</strong></div>
                              <div className="border-t border-slate-800 pt-1 mt-1 text-slate-300">
                                Total Aforo: <strong>{p.totalVehDaily.toLocaleString()} veh/día</strong>
                              </div>
                              <div className="text-rose-400">Tráfico de Paso Exógeno: {p.dailyExogenousTransitVeh.toLocaleString()} ({p.exogenousTrafficPct}%)</div>
                              <div className="text-cyan-300">Tráfico Residente Propio: {p.dailyEndogenousVeh.toLocaleString()} ({ (100 - p.exogenousTrafficPct).toFixed(1) }%)</div>
                              <div className="border-t border-slate-800 pt-1 mt-1">
                                <span className="text-amber-400 font-bold">NO₂ Importado por Paso: {p.importedExogenousNO2UgM3} µg/m³</span>
                              </div>
                              <div className="text-slate-400">NO₂ Generado por Vecinos: {p.endogenousNO2UgM3} µg/m³</div>
                              <div className="text-indigo-400 font-bold mt-1">Índice Injusticia CIPI: {p.commuterInjusticeIndex}x</div>
                              <div className="text-[8.5px] text-cyan-200 mt-1 italic">
                                Corredor: {p.arteries}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                    <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Objetivo UE 2030 (20 µg)', fill: '#22c55e', fontSize: 9, position: 'insideTopRight' }} />
                    <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Límite Actual 2008 (40 µg)', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                    <Bar dataKey="endogenousNO2UgM3" stackId="no2" name="NO₂ Generado por Residentes (µg/m³)" fill="#0284c7" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="importedExogenousNO2UgM3" stackId="no2" name="NO₂ Importado por Tráfico de Paso (µg/m³)" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matriz Científica de Corredores y Movilidad Obligada */}
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
              <table className="w-full text-left text-[9px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1 px-1">Distrito Oficial</th>
                    <th className="py-1 px-1">Vías Arteriales Receptoras</th>
                    <th className="py-1 px-1 text-right">Renta INE</th>
                    <th className="py-1 px-1 text-right">Aforo Total</th>
                    <th className="py-1 px-1 text-right text-rose-300">% Tráfico Paso</th>
                    <th className="py-1 px-1 text-right text-amber-300">NO₂ Paso</th>
                    <th className="py-1 px-1 text-right text-cyan-300">NO₂ Propio</th>
                    <th className="py-1 px-1 text-right text-indigo-300">CIPI (x)</th>
                    <th className="py-1 px-1">Veredicto Doctrinal</th>
                    <th className="py-1 px-1 text-emerald-300">Medida Mitigadora</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.commuterProfiles.map((p) => (
                    <tr key={p.districtId} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="py-1 px-1 font-bold text-slate-200">{p.districtName}</td>
                      <td className="py-1 px-1 text-slate-400 font-sans max-w-[150px] truncate" title={p.arteries}>{p.arteries}</td>
                      <td className="py-1 px-1 text-right text-slate-300 font-mono">{p.incomeEur.toLocaleString()} €</td>
                      <td className="py-1 px-1 text-right text-slate-300 font-mono">{p.totalVehDaily.toLocaleString()}</td>
                      <td className="py-1 px-1 text-right font-mono font-bold text-rose-400">{p.exogenousTrafficPct}%</td>
                      <td className="py-1 px-1 text-right font-mono text-amber-300 font-bold">{p.importedExogenousNO2UgM3} µg</td>
                      <td className="py-1 px-1 text-right font-mono text-cyan-300">{p.endogenousNO2UgM3} µg</td>
                      <td className="py-1 px-1 text-right font-mono text-indigo-300 font-bold">{p.commuterInjusticeIndex}x</td>
                      <td className="py-1 px-1">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${
                          p.burdenVerdict === 'CORREDOR_SACRIFICIO_METROPOLITANO'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                            : p.burdenVerdict === 'ZONA_PROTEGIDA_EMISORA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                            : p.burdenVerdict === 'RECEPTOR_TRAFICO_PASO'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.burdenVerdict.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-1 px-1 text-emerald-400 text-[8.5px] font-sans">{p.mitigationOpportunity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA PRINCIPAL: EFECTO REBOTE ZBE Y DIAGRAMA DE DECAIMIENTO POR PROXIMIDAD */}
        {activeTab === 'zbe_rebound_proximity' && (
          <div className="space-y-3.5">
            {/* 4 Indicadores Métricos del Efecto Rebote ZBE */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Interior ZBE (Centro/Soho)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">-24.2% NO₂</span>
                <span className="text-[9px] text-slate-400 block">Zona pacificada de alta renta</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold text-rose-300">Desvío Perimetral</span>
                <span className="text-lg font-bold text-rose-400 font-mono">+14.6% NO₂</span>
                <span className="text-[9px] text-slate-400 block">Arterias de barrios obreros</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Ratio Inequidad Carga</span>
                <span className="text-lg font-bold text-amber-400 font-mono">2.3x</span>
                <span className="text-[9px] text-slate-400 block">Carga soportada vs renta baja</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Incremento Aforo Perimetral</span>
                <span className="text-lg font-bold text-sky-400 font-mono">+18.4% Veh/h</span>
                <span className="text-[9px] text-slate-400 block">Tráfico sin distintivo desviado</span>
              </div>
            </div>

            {/* Diagnóstico Breve del Efecto Rebote ZBE */}
            <div className="p-3 bg-amber-950/40 border border-amber-600/60 rounded space-y-1.5">
              <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>¿Quién Paga el Coste de la Desviación del Tráfico de la ZBE de Málaga?</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                <strong>Análisis de Injusticia Redistributiva:</strong> La restricción vehicular en el Centro Histórico y Soho mejora significativamente la calidad del aire local, pero provoca un <em>efecto frontera / derrame (spillover)</em>. Los vehículos sin distintivo o de itinerario interurbano se desvían masivamente por la corona perimetral (Eugenio Gross, Mármoles, Martínez Maldonado, Paseo de los Tilos, Avenida Velázquez). Esto concentra el incremento de NO₂ en distritos residenciales de renta media-baja (Bailén-Miraflores, Cruz de Humilladero, Carretera de Cádiz) con alta densidad de escuelas y cañones urbanos profundos (H/W &gt; 1.2).
              </p>
            </div>

            {/* Diagrama 2D: Exposición Acumulada vs Proximidad al Foco Emisor */}
            <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Diagrama 2D: Proximidad al Foco Emisor Perimetral (m) vs Concentración de NO₂ (µg/m³)
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Rojo = Renta &lt;24k€ | Ámbar = Renta 24k-32k€ | Verde = Renta &gt;32k€
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 20, bottom: 25, left: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      type="number"
                      dataKey="distM"
                      name="Distancia al Foco"
                      unit="m"
                      stroke="#94a3b8"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Distancia a la Vía Perimetral / Emisor (metros)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="exposureNO2"
                      name="NO₂ Inhalado"
                      unit="µg/m³"
                      stroke="#fbbf24"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'NO₂ (µg/m³)', angle: -90, position: 'insideLeft', fill: '#fbbf24', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey="income" range={[60, 240]} name="Renta" unit="€" />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2 text-[10px] font-mono text-slate-200 rounded shadow-xl">
                              <div className="font-bold text-amber-300">{data.name}</div>
                              <div>Distancia al Emisor: <strong className="text-cyan-300">{data.distM} metros</strong></div>
                              <div>Concentración NO₂: <strong className="text-rose-400">{data.exposureNO2} µg/m³</strong></div>
                              <div>Renta Media Hogar: <strong className="text-emerald-300">{data.income.toLocaleString()} €/año</strong></div>
                              <div className="text-[8px] text-slate-400 border-t border-slate-800 pt-1 mt-1">
                                {data.distM < 100 && data.income < 24000 ? '⚠️ ANOMALÍA: SOBREEXPOSICIÓN CRÍTICA EN RENTA BAJA' : 'Cercanía al Foco'}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={20} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: 'Objetivo UE 2030 (20 µg)', fill: '#38bdf8', fontSize: 9, position: 'insideTopRight' }} />
                    <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Límite Directiva 2008 (40 µg)', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                    <Scatter name="Receptores Sensibles y Distritos" data={proximityScatterData}>
                      {proximityScatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[9px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                <span>Puntos por encima de la línea sufren sobre-exposición acumulada por efecto cañón H/W o tráfico desviado.</span>
                <span className="text-amber-300 font-bold">Datos Asimilados en Tiempo Real</span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: JUSTICIA TOXICOLÓGICA (OP-DTT) Y CARGA SANITARIA SAS */}
        {activeTab === 'toxicological_health' && (
          <div className="space-y-3.5">
            {/* 4 Indicadores Toxicológicos y Sanitarios */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Toxicidad Redox Máxima</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {Math.max(...toxicologicalJusticeProfiles.map(d => d.opVolume))} nmol
                </span>
                <span className="text-[9px] text-slate-400 block">DTT / (min · m³) en ejes obreros</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold text-amber-300">Coste Directo SAS Asma</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {toxicologicalJusticeProfiles.reduce((acc, d) => acc + d.sasDirectCostEur, 0).toLocaleString()} €
                </span>
                <span className="text-[9px] text-slate-400 block">Urgencias pediátricas atribuibles</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">DALYs Pediátricos</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {toxicologicalJusticeProfiles.reduce((acc, d) => acc + d.attributableDalys, 0).toFixed(1)} Años
                </span>
                <span className="text-[9px] text-slate-400 block">Pérdida por asma infantil (AirQ+)</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Brecha de Toxicidad Intrínseca</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">3.2x</span>
                <span className="text-[9px] text-slate-400 block">pmol DTT/µg: Obrero vs Renta Alta</span>
              </div>
            </div>

            {/* Banner Científico Metodológico */}
            <div className="p-3 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/50 rounded space-y-1.5">
              <div className="text-xs font-bold text-rose-300 uppercase flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>Justicia Toxicológica: La Falacia de Evaluar Solo Masa de PM2.5 (Potencial Oxidativo DTT)</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                <strong>Fundamentación Físico-Química para el Tribunal:</strong> La normativa europea tradicional evalúa exclusivamente la concentración másica gravimétrica (µg/m³ de PM2.5), asumiendo erróneamente que todas las partículas tienen idéntica toxicidad. En Málaga, el particulado de barrios costeros residenciales (Distrito Este, El Limonar) contiene una alta fracción de aerosol marino inocuo (NaCl/SO₄ natural), mientras que en los distritos de menor renta y alta densidad viaria (Carretera de Cádiz, Cruz de Humilladero, Bailén-Miraflores) el aerosol está saturado de metales de transición de desgaste de frenos (Cobre Cu, Hierro Fe) y quinonas de escape diésel. Esto triplica su <em>Potencial Oxidativo intrínseco (OP^DTT)</em>, desencadenando estrés oxidativo celular y multiplicando las urgencias hospitalarias pediátricas.
              </p>
            </div>

            {/* Gráfico Comparativo: OP-DTT Redox vs Coste Hospitalario SAS por Distrito */}
            <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Toxicidad Celular OP^DTT (nmol/(min·m³)) y Coste Hospitalario SAS (€/año) por Distrito
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Modelizado mediante OMS AirQ+ 2021 & Tarifas SAS
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toxicologicalJusticeProfiles} margin={{ top: 15, right: 15, left: -5, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="districtName"
                      stroke="#94a3b8"
                      tick={{ fontSize: 8.5 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      tickFormatter={(val: string) => val.split(':')[1]?.trim() || val}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#fb7185"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'OP^DTT (nmol/(min·m³))', angle: -90, position: 'insideLeft', fill: '#fb7185', fontSize: 9 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#fbbf24"
                      tick={{ fontSize: 9 }}
                      label={{ value: 'Coste SAS (€)', angle: 90, position: 'insideRight', fill: '#fbbf24', fontSize: 9 }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2 text-[10px] font-mono text-slate-200 rounded shadow-xl">
                              <div className="font-bold text-amber-300">{d.districtName}</div>
                              <div>Renta Media Hogar: <strong className="text-emerald-300">{d.averageHouseholdIncomeEurYear.toLocaleString()} €</strong></div>
                              <div>PM2.5 Asimilado: <strong className="text-slate-200">{d.baselinePM25UgM3} µg/m³</strong></div>
                              <div className="text-rose-400 font-bold">Actividad Redox OP^DTT: {d.opVolume} nmol/(min·m³)</div>
                              <div className="text-amber-300">Toxicidad Intrínseca: {d.opMass} pmol DTT/µg</div>
                              <div className="border-t border-slate-800 pt-1 mt-1 text-sky-300">
                                Urgencias Asma Infantil: <strong>{d.attributablePediatricEmergencies} altas/año</strong> ({d.sasDirectCostEur.toLocaleString()} € SAS)
                              </div>
                              <div className="text-[8.5px] text-slate-400 font-bold uppercase mt-1">
                                Clasificación Celular: {d.opRisk}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="opVolume" name="Toxicidad Redox OP^DTT" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="right" dataKey="sasDirectCostEur" name="Coste Urgencias Asma SAS (€)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla Detallada por Distrito */}
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
              <table className="w-full text-left text-[9px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1 px-1">Distrito Oficial</th>
                    <th className="py-1 px-1">Renta INE</th>
                    <th className="py-1 px-1">PM2.5</th>
                    <th className="py-1 px-1 text-rose-300">OP^DTT Vol.</th>
                    <th className="py-1 px-1 text-amber-300">OP Intrínseco</th>
                    <th className="py-1 px-1 text-sky-300">Urg. Pediátricas</th>
                    <th className="py-1 px-1 text-emerald-300">Coste SAS</th>
                    <th className="py-1 px-1">Riesgo Celular</th>
                  </tr>
                </thead>
                <tbody>
                  {toxicologicalJusticeProfiles.map((d) => (
                    <tr key={d.districtId} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="py-1 px-1 font-bold text-slate-200">{d.districtName}</td>
                      <td className="py-1 px-1 text-slate-300 font-mono">{d.averageHouseholdIncomeEurYear.toLocaleString()} €</td>
                      <td className="py-1 px-1 text-slate-300">{d.baselinePM25UgM3} µg</td>
                      <td className="py-1 px-1 text-rose-400 font-bold font-mono">{d.opVolume} nmol</td>
                      <td className="py-1 px-1 text-amber-300 font-mono">{d.opMass} pmol/µg</td>
                      <td className="py-1 px-1 text-sky-300 font-bold">{d.attributablePediatricEmergencies} casos</td>
                      <td className="py-1 px-1 text-emerald-400 font-mono">{d.sasDirectCostEur.toLocaleString()} €</td>
                      <td className="py-1 px-1">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${
                          d.opRisk.includes('Crítico') || d.opRisk.includes('Alto')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {d.opRisk.split('(')[0].trim()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 1: VISOR CARTOGRÁFICO GEOJSON Y PALETAS DIVERGENTES */}
        {activeTab === 'geojson_map' && (
          <div className="space-y-3">
            {/* Controles de Capa GeoJSON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-2.5 border border-slate-800 rounded">
              <div className="space-y-1">
                <span className="text-[10.5px] text-slate-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Variable Cartografiada (Capa Vectorial):
                </span>
                <select
                  value={variableMode}
                  onChange={(e) => setVariableMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-[10.5px] rounded p-1.5 font-mono cursor-pointer"
                >
                  <option value="bivariate">Índice Bivariado: Renta + Vulnerabilidad + NOx/PM2.5</option>
                  <option value="income_vs_no2">Desequilibrio Renta Hogar (€) vs Exposición NO₂</option>
                  <option value="vulnerability_vs_pm25">Población Vulnerable (Edad &gt;65 y &lt;14) vs PM2.5</option>
                  <option value="raw_no2">Concentración de NO₂ Bruta (µg/m³)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10.5px] text-slate-300 font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  Paleta de Color Divergente:
                </span>
                <select
                  value={paletteId}
                  onChange={(e) => setPaletteId(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-[10.5px] rounded p-1.5 font-mono cursor-pointer"
                >
                  <option value="divergent_bivariate">Bivariada Doctrinal (Carmesí/Rojo &lt;-&gt; Neutro &lt;-&gt; Teal/Cian)</option>
                  <option value="divergent_rdbu">RdBu Divergente Clásica (Rojo &lt;-&gt; Blanco &lt;-&gt; Azul)</option>
                  <option value="divergent_spectral">Spectral Divergente (Carmesí &lt;-&gt; Amarillo &lt;-&gt; Azul Marino)</option>
                  <option value="divergent_piyg">PiYG Divergente (Rosa Fucsia &lt;-&gt; Neutro &lt;-&gt; Verde)</option>
                </select>
              </div>
            </div>

            {/* Lienzo Cartográfico SVG GeoJSON */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Plano Vectorial Distrital de Málaga (WGS84 • 11 Distritos INE)</span>
                </span>
                <span className="text-[9px] text-slate-400">
                  * Haz clic en cualquier distrito para seleccionarlo y sincronizar el punto activo
                </span>
              </div>

              <div className="w-full flex justify-center bg-black/60 rounded border border-slate-900 p-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto max-h-[360px]"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                >
                  {/* Polígonos de los Distritos */}
                  {geoJsonData.features.map((feature) => {
                    const coords = feature.geometry.coordinates[0];
                    const pathData = coords
                      .map((coord, idx) => {
                        const [px, py] = projectCoords(coord[0], coord[1]);
                        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
                      })
                      .join(' ') + ' Z';

                    const [labelX, labelY] = projectCoords(
                      feature.properties.centerCoordinates[0],
                      feature.properties.centerCoordinates[1]
                    );

                    const isSelected = currentSelected.districtId === feature.properties.districtId;

                    return (
                      <g key={feature.properties.districtId} className="cursor-pointer group">
                        <path
                          d={pathData}
                          fill={feature.properties.colorHex}
                          fillOpacity={isSelected ? 0.95 : 0.75}
                          stroke={isSelected ? '#ffffff' : '#1e293b'}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                          onClick={() => setSelectedDistrict(feature.properties)}
                          className="transition-all duration-200 hover:fill-opacity-100 hover:stroke-indigo-300"
                        />
                        {/* Etiqueta de Texto */}
                        <text
                          x={labelX}
                          y={labelY - 5}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                        >
                          {feature.properties.shortName}
                        </text>
                        <text
                          x={labelX}
                          y={labelY + 6}
                          fill="#f8fafc"
                          fontSize="8"
                          textAnchor="middle"
                          pointerEvents="none"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                        >
                          {feature.properties.no2ConcentrationUgM3} µg
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Leyenda Divergente */}
              <div className="mt-3 p-2 bg-slate-900 border border-slate-800 rounded flex flex-col sm:flex-row items-center justify-between gap-2 text-[9.5px]">
                <span className="font-bold text-slate-300 uppercase">
                  Escala Divergente de Desequilibrio:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold">DESEQUILIBRIO SEVERO (Alta Polución + Baja Renta)</span>
                  <div className="flex h-3 w-36 rounded overflow-hidden border border-slate-700">
                    <div className="flex-1 bg-[#991b1b]" />
                    <div className="flex-1 bg-[#dc2626]" />
                    <div className="flex-1 bg-[#f87171]" />
                    <div className="flex-1 bg-[#cbd5e1]" />
                    <div className="flex-1 bg-[#38bdf8]" />
                    <div className="flex-1 bg-[#0284c7]" />
                    <div className="flex-1 bg-[#0f766e]" />
                  </div>
                  <span className="text-teal-400 font-bold">VENTAJA AMBIENTAL (Baja Polución + Alta Renta)</span>
                </div>
              </div>
            </div>

            {/* Ficha Detallada del Distrito Seleccionado */}
            {currentSelected && (
              <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-600/50 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{currentSelected.districtName}</span>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono border ${currentSelected.injusticeClass === 'DESEQUILIBRIO_SEVERO' ? 'bg-rose-950 text-rose-300 border-rose-700' : currentSelected.injusticeClass === 'VENTAJOSO_SUBEXPUESTO' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {currentSelected.injusticeClass.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-300">
                    <span>👥 Población: <strong>{currentSelected.population.toLocaleString()} hab.</strong></span>
                    <span>💶 Renta Hogar: <strong>{currentSelected.averageIncomeEurYear.toLocaleString()} €</strong> (Decil {currentSelected.incomeDecile})</span>
                    <span>👶 Infancia &lt;14: <strong>{currentSelected.childPct}%</strong></span>
                    <span>👴 Mayores &gt;65: <strong>{currentSelected.elderlyPct}%</strong></span>
                    <span className="text-indigo-300">💨 NO₂: <strong>{currentSelected.no2ConcentrationUgM3} µg/m³</strong></span>
                    <span className="text-amber-300">🌫️ PM2.5: <strong>{currentSelected.pm25ConcentrationUgM3} µg/m³</strong></span>
                  </div>
                </div>

                <ScientificTooltip position="top" width="w-[280px]" content="Fijar este distrito como el punto activo de asimilación unificado en todo el Gemelo Digital.">
                  <button
                    onClick={() => handleSyncDistrictAsActivePoint(currentSelected)}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[10px] font-bold py-2 px-3 rounded border border-indigo-400 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>SINCRONIZAR PUNTO ACTIVO</span>
                  </button>
                </ScientificTooltip>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CURVA DE LORENZ & MÉTRICAS (KAKWANI / ATKINSON) */}
        {activeTab === 'lorenz_metrics' && (
          <div className="space-y-3">
            {/* 4 Indicadores Clave */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Índice de Kakwani</span>
                <span className={`text-lg font-bold font-mono ${analysis.kakwaniIndex < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {analysis.kakwaniIndex}
                </span>
                <span className="text-[9px] text-slate-400 block">K &lt; 0: Injusticia regresiva</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Índice de Atkinson</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{analysis.atkinsonIndex}</span>
                <span className="text-[9px] text-slate-400 block">Aversión ética ε = {atkinsonEpsilon.toFixed(2)}</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Gini Ambiental</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{analysis.giniEnvironmental}</span>
                <span className="text-[9px] text-slate-400 block">vs Gini Renta INE: {analysis.giniIncome}</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Directiva 2024/2881</span>
                <span className="text-[11px] font-bold text-emerald-300 font-mono block truncate">
                  {analysis.directive2024Compliance === 'CONFORME_DIRECTIVA_2024/2881' ? '✓ CONFORME' : '⚠️ MITIGACIÓN RD 1052'}
                </span>
                <span className="text-[9px] text-slate-400 block">Art. 13 Grupos Vulnerables</span>
              </div>
            </div>

            {/* Slider Atkinson */}
            <div className="bg-slate-900 p-3 border border-slate-800 rounded space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Parámetro de Aversión Social a la Inequidad Ambiental (ε de Atkinson):
                </span>
                <span className="text-indigo-300 font-bold text-sm">{atkinsonEpsilon.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="2.00"
                step="0.05"
                value={atkinsonEpsilon}
                onChange={(e) => setAtkinsonEpsilon(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] text-slate-400">
                <span>0.50 (Baja sensibilidad social)</span>
                <span>1.25 (Estándar Unión Europea / OMS)</span>
                <span>2.00 (Máxima aversión ética rawlsiana)</span>
              </div>
            </div>

            {/* Gráfico Curva de Lorenz Ambiental */}
            <div className="bg-black/90 p-3 border border-slate-800 rounded space-y-2">
              <span className="text-xs font-bold text-indigo-300 block">
                Curva de Lorenz Ambiental: % Población Acumulada por Renta vs % Exposición Acumulada a NO₂
              </span>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.lorenzCurvePoints} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="cumulativePopPct" stroke="#94a3b8" tick={{ fontSize: 9 }} label={{ value: '% Población Acumulada (Ordenada por Renta Menor a Mayor)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#818cf8" tick={{ fontSize: 9 }} label={{ value: '% Exposición Dosis NO₂', angle: -90, position: 'insideLeft', fill: '#818cf8', fontSize: 10 }} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                    <Line type="monotone" dataKey="lineOfEquality" name="Línea de Equidad Perfecta (45°)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="cumulativeExposurePct" name="Curva Real de Lorenz Ambiental" stroke="#818cf8" strokeWidth={2.5} dot={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: MATRIZ SOCIODEMOGRÁFICA INE (11 DISTRITOS) */}
        {activeTab === 'ine_table' && (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded p-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-1">
              <span className="text-xs font-bold text-slate-200">
                Cruce Socioambiental por Distritos Municipales (INE ADRH + Telemetría Asimilada)
              </span>
              <div className="flex gap-1 text-[9px]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'all' ? 'bg-indigo-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  TODOS (11)
                </button>
                <button
                  onClick={() => setFilterType('unfavorable')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'unfavorable' ? 'bg-rose-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  SOBREEXPUESTOS
                </button>
                <button
                  onClick={() => setFilterType('favorable')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterType === 'favorable' ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  SUBEXPUESTOS
                </button>
              </div>
            </div>
            <table className="w-full text-left text-[9px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-1 px-1">Distrito</th>
                  <th className="py-1 px-1">Población</th>
                  <th className="py-1 px-1">Renta Hogar</th>
                  <th className="py-1 px-1 text-indigo-300">NO₂</th>
                  <th className="py-1 px-1 text-rose-300">
                    <ScientificTooltip position="bottom" content="Ruido estratégico nocturno L_night (dBA) procedente del Mapa de Ruido de Málaga.">
                      <span>Ruido L_night</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1 px-1 text-emerald-300">
                    <ScientificTooltip position="bottom" content="Índice de Cubierta Vegetal / Canopia Urbana (NDVI %) en el distrito.">
                      <span>Canopia %</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1 px-1 text-amber-300">
                    <ScientificTooltip position="bottom" content="Factor de incremento perimetral de NO₂ por desvío vehicular de la ZBE (%).">
                      <span>Rebound ZBE</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1 px-1 text-sky-300">
                    <ScientificTooltip position="bottom" content="Dosis inhalada horaria por niño a 0.90m AGL (ICRP 66) en µg/h.">
                      <span>Dosis Niños</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1 px-1 text-teal-300">
                    <ScientificTooltip position="bottom" content="Evaluación de cumplimiento frente al límite anual de 20 µg/m³ de la Directiva (UE) 2024/2881 (2030).">
                      <span>Directiva 2030</span>
                    </ScientificTooltip>
                  </th>
                  <th className="py-1 px-1">Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.map((d) => (
                  <tr key={d.districtId} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="py-1 px-1 font-bold text-slate-200">{d.districtName}</td>
                    <td className="py-1 px-1 text-slate-400">{d.populationIne.toLocaleString()}</td>
                    <td className="py-1 px-1 text-slate-300 font-mono">{d.averageHouseholdIncomeEurYear.toLocaleString()} €</td>
                    <td className="py-1 px-1 text-indigo-400 font-bold">{d.baselineNO2UgM3} µg</td>
                    <td className="py-1 px-1 text-rose-300 font-mono">{d.nightNoiseDba} dBA</td>
                    <td className="py-1 px-1 text-emerald-300 font-mono">{d.treeCanopyPct}%</td>
                    <td className="py-1 px-1 text-amber-300 font-mono font-bold">{d.zbePerimeterReboundFactor > 0 ? `+${d.zbePerimeterReboundFactor}%` : `${d.zbePerimeterReboundFactor}%`}</td>
                    <td className="py-1 px-1 text-sky-300 font-mono">{d.childHourlyNO2DoseUg} µg/h</td>
                    <td className="py-1 px-1">
                      <span className={`px-1 py-0.5 rounded text-[7.5px] font-mono ${d.directive2030Compliance === 'CONFORME_2030' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                        {d.directive2030Compliance === 'CONFORME_2030' ? '✓ CONFORME' : '⚠️ > 20 µg'}
                      </span>
                    </td>
                    <td className="py-1 px-1">
                      <span className={`px-1 py-0.5 rounded text-[8px] font-mono ${d.justiceClassification === 'DESFAVORECIDO_SOBREEXPUESTO' ? 'bg-rose-950 text-rose-300 border border-rose-800' : d.justiceClassification === 'ALTA_RENTA_SUBEXPUESTO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'}`}>
                        {d.justiceClassification === 'DESFAVORECIDO_SOBREEXPUESTO' ? 'DESFAVORECIDO' : d.justiceClassification === 'ALTA_RENTA_SUBEXPUESTO' ? 'ALTA RENTA' : 'EQUILIBRADO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Diagnóstico Doctoral para la Defensa de Tesis */}
        <div className="p-3 bg-indigo-950/30 border border-indigo-600/40 rounded space-y-1">
          <span className="text-[10.5px] font-bold text-indigo-300 uppercase flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-indigo-400" />
            <span>Conclusión Doctrinal para el Capítulo de Justicia Ambiental</span>
          </span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            {analysis.doctoralConclusion}
          </p>
        </div>
      </div>
    </DraggableWindow>
  );
};
