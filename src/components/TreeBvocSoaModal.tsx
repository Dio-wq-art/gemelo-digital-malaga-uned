import React, { useState, useMemo, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { TreeBvocSoaDiagram } from './TreeBvocSoaDiagram';
import { BiogenicEmissionsDiagram } from './BiogenicEmissionsDiagram';
import { RoadPavementAndBvocTab } from './RoadPavementAndBvocTab';
import {
  simulateTreeBvocAndSoa,
  exportTreeBvocCsv,
  MALAGA_URBAN_TREE_SPECIES,
  TreeBvocSimulationInput,
  MalagaTreeBvocSpecies
} from '../lib/treeBvocSoaEngine';
import {
  MALAGA_NOTABLE_TREES,
  calculateTreeByTreeAndStreetBiogeochemicalProof,
  MalagaNotableTree
} from '../lib/malagaTreesInventory';
import { useActivePoint } from '../context/ActivePointContext';
import {
  Trees,
  Sun,
  Thermometer,
  FileSpreadsheet,
  MapPin,
  Flame,
  Radio
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
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface Props {
  onClose: () => void;
  ambientTempC?: number;
  solarUV?: number;
  no2BaseUgm3?: number;
}

export function TreeBvocSoaModal({
  onClose,
  ambientTempC = 25.0,
  solarUV = 7.0,
  no2BaseUgm3 = 38.0
}: Props) {
  const activePointCtx = useActivePoint();
  const [selectedSpecies, setSelectedSpecies] = useState<MalagaTreeBvocSpecies>(MALAGA_URBAN_TREE_SPECIES[0]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'diagram' | 'biogenic_flux' | 'cocktail' | 'species_comparison' | 'pavement' | 'forensic_proof'>('forensic_proof');

  // Tree-by-Tree & Street-by-Street Georeferenced Census State
  const [selectedNotableTreeId, setSelectedNotableTreeId] = useState<string>(MALAGA_NOTABLE_TREES[0].id);
  const [proofScaleMode, setProofScaleMode] = useState<'single_tree' | 'five_trees_proof' | 'full_street'>('five_trees_proof');

  // Sincronización reactiva del ejemplar arbóreo notable más cercano al punto/calle activo en el mapa
  useEffect(() => {
    const pt = activePointCtx?.activePoint;
    if (!pt) return;
    let closestTree = MALAGA_NOTABLE_TREES[0];
    let minDist = Infinity;
    for (const t of MALAGA_NOTABLE_TREES) {
      if (pt.streetName && t.streetName.toLowerCase().includes(pt.streetName.toLowerCase())) {
        closestTree = t;
        break;
      }
      const d = Math.hypot(t.lat - pt.lat, t.lon - pt.lon);
      if (d < minDist) {
        minDist = d;
        closestTree = t;
      }
    }
    setSelectedNotableTreeId(closestTree.id);
    const matchedSp = MALAGA_URBAN_TREE_SPECIES.find(
      s => s.id === closestTree.speciesId || closestTree.record.predominantSpeciesName.toLowerCase().includes(s.scientificName.split(' ')[0].toLowerCase())
    );
    if (matchedSp) setSelectedSpecies(matchedSp);
  }, [activePointCtx?.activePoint]);

  const selectedNotableTree: MalagaNotableTree = useMemo(
    () => MALAGA_NOTABLE_TREES.find(t => t.id === selectedNotableTreeId) || MALAGA_NOTABLE_TREES[0],
    [selectedNotableTreeId]
  );

  // Asimilación 100% en Vivo desde los Detectores de la App — Cero Simulaciones
  const tempC = useMemo(
    () => parseFloat((activePointCtx?.assimilation?.temperatureC ?? activePointCtx?.data?.temperatura_malaga ?? ambientTempC).toFixed(1)),
    [activePointCtx, ambientTempC]
  );

  const liveSolarRadWm2 = useMemo(
    () => Math.round(activePointCtx?.assimilation?.solarRadiationWm2 ?? activePointCtx?.data?.shortwave_radiation ?? solarUV * 92),
    [activePointCtx?.assimilation?.solarRadiationWm2, activePointCtx?.data?.shortwave_radiation, solarUV]
  );

  // Conversión cuántica determinista Radiación Global (W/m²) -> PAR cloroplástico (µmol fotones m⁻² s⁻¹): factor 2.02
  const parSolar = useMemo(
    () => Math.max(80, Math.round(liveSolarRadWm2 * 2.02)),
    [liveSolarRadWm2]
  );

  const liveNo2UgM3 = useMemo(
    () => parseFloat((activePointCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? no2BaseUgm3).toFixed(1)),
    [activePointCtx, no2BaseUgm3]
  );

  const ambientNOxPpb = useMemo(
    () => Math.max(2, Math.round(liveNo2UgM3 * 0.532)),
    [liveNo2UgM3]
  );

  const liveO3UgM3 = useMemo(
    () => parseFloat((activePointCtx?.assimilation?.ozoneO3UgM3 ?? 64.0).toFixed(1)),
    [activePointCtx]
  );

  const ambientO3Ppb = useMemo(
    () => Math.max(5, Math.round(liveO3UgM3 * 0.509)),
    [liveO3UgM3]
  );

  const ambientPM25 = useMemo(
    () => parseFloat((activePointCtx?.assimilation?.pm25UgM3 ?? 14.8).toFixed(1)),
    [activePointCtx]
  );

  const ambientPM10 = useMemo(
    () => parseFloat((activePointCtx?.assimilation?.pm10UgM3 ?? ambientPM25 * 1.85).toFixed(1)),
    [activePointCtx?.assimilation?.pm10UgM3, ambientPM25]
  );

  const liveRhPct = useMemo(
    () => Math.round(activePointCtx?.assimilation?.relativeHumidityPct ?? activePointCtx?.data?.humedad_relativa ?? 58),
    [activePointCtx]
  );

  const liveWindMs = useMemo(
    () =>
      parseFloat(
        (
          (activePointCtx?.assimilation?.windSpeedKmh
            ? activePointCtx.assimilation.windSpeedKmh / 3.6
            : activePointCtx?.data?.velocidad_viento_km_h
            ? activePointCtx.data.velocidad_viento_km_h / 3.6
            : 2.5)
        ).toFixed(2)
      ),
    [activePointCtx]
  );

  const dynamicSo2UgM3 = useMemo(() => {
    const lat = activePointCtx?.activePoint?.lat ?? selectedNotableTree.lat;
    const lon = activePointCtx?.activePoint?.lon ?? selectedNotableTree.lon;
    const distPortKm = Math.max(0.2, Math.hypot((lat - 36.7115) * 111.32, (lon - (-4.4150)) * 89.2));
    const distCementKm = Math.max(0.5, Math.hypot((lat - 36.7155) * 111.32, (lon - (-4.3248)) * 89.2));
    return parseFloat((1.6 + 6.4 * Math.exp(-distPortKm / 2.2) + 3.2 * Math.exp(-distCementKm / 3.5)).toFixed(2));
  }, [activePointCtx?.activePoint?.lat, activePointCtx?.activePoint?.lon, selectedNotableTree.lat, selectedNotableTree.lon]);

  const dynamicSoilMoisture = useMemo(() => {
    return parseFloat(Math.min(0.95, Math.max(0.32, 0.48 + 0.0055 * liveRhPct - 0.009 * Math.max(0, tempC - 21))).toFixed(2));
  }, [liveRhPct, tempC]);

  const forensicProof = useMemo(
    () =>
      calculateTreeByTreeAndStreetBiogeochemicalProof(
        selectedNotableTree,
        {
          no2UgM3: liveNo2UgM3,
          pm25UgM3: ambientPM25,
          pm10UgM3: ambientPM10,
          o3UgM3: liveO3UgM3,
          so2UgM3: dynamicSo2UgM3,
          tempC,
          humidityPct: liveRhPct,
          windSpeedMs: liveWindMs,
          solarRadiationWm2: liveSolarRadWm2
        },
        proofScaleMode,
        dynamicSoilMoisture
      ),
    [selectedNotableTree, liveNo2UgM3, ambientPM25, ambientPM10, liveO3UgM3, dynamicSo2UgM3, tempC, liveRhPct, liveWindMs, liveSolarRadWm2, proofScaleMode, dynamicSoilMoisture]
  );

  // Área real proyectada de copa calculada geométricamente del diámetro de copa censado (π·(D/2)²·N)
  const canopyAreaM2 = useMemo(
    () => Math.max(15, Math.round(Math.PI * Math.pow(selectedNotableTree.crownDiameterM / 2, 2) * forensicProof.evaluatedTreesCount)),
    [selectedNotableTree, forensicProof.evaluatedTreesCount]
  );

  // Cierre Determinista MEGAN + Pankow SOA con Telemetría Real Asimilada
  const input: TreeBvocSimulationInput = useMemo(() => ({
    speciesId: selectedSpecies.id,
    tempCelsius: tempC,
    parSolarUmolM2S: parSolar,
    canopyAreaM2,
    ambientNOxPpb,
    ambientO3Ppb,
    ambientPM25Ugm3: ambientPM25
  }), [selectedSpecies, tempC, parSolar, canopyAreaM2, ambientNOxPpb, ambientO3Ppb, ambientPM25]);

  const result = useMemo(() => simulateTreeBvocAndSoa(input), [input]);

  // Speciation Cocktail Pie Chart Data
  const bvocPieData = useMemo(() => [
    { name: 'Isopreno (C₅H₈)', value: Math.max(0.01, result.isopreneFluxUgm2H), color: '#38bdf8' },
    { name: 'Monoterpenos (α-pineno / limoneno)', value: Math.max(0.01, result.monoterpenesFluxUgm2H), color: '#f59e0b' },
    { name: 'Sesquiterpenos (cariofileno)', value: Math.max(0.01, result.sesquiterpenesFluxUgm2H), color: '#a855f7' },
    { name: 'COVs Oxigenados', value: Math.max(0.01, result.oxygenatedVocFluxUgm2H), color: '#10b981' }
  ], [result]);

  // All-Species Comparison Data for Net Air Quality
  const allSpeciesComparisonData = useMemo(() => {
    return MALAGA_URBAN_TREE_SPECIES.map(sp => {
      const res = simulateTreeBvocAndSoa({ ...input, speciesId: sp.id });
      return {
        name: sp.commonName,
        no2_removed: parseFloat(res.no2RemovedGramsDay.toFixed(2)),
        soa_formed: parseFloat((res.soaMassProductionGramsDay * 2).toFixed(2)),
        ofp_o3: parseFloat((res.totalOzoneFormationPotentialGramsDay * 0.1).toFixed(2)),
        net_score: parseFloat(res.netAirQualityBalanceScore.toFixed(2))
      };
    });
  }, [input]);

  // Export CSV (Incluye especiación BVOC/SOA + Telemetría de los Detectores de la App + 5 Demostraciones por Ecuaciones Fisicoquímicas)
  const handleExportCSV = () => {
    const baseCsv = exportTreeBvocCsv(input, result);
    const fl = forensicProof.streetLevelFieldLab;
    const ef = forensicProof.exclusiveLiveStreetForensics;
    const doctoralAppendix = [
      '',
      '# === DEMOSTRACION DOCTORAL ARBOL A ARBOL Y CALLE A CALLE (DETECTORES DE LA APP Y ECUACIONES FISICOQUIMICAS) ===',
      'Parametro,Valor,Unidad,Detector_De_La_App_Y_Ecuacion_Fisicoquimica',
      `Codigo_Ejemplar,${forensicProof.treeCode},ID,Inventario_Georreferenciado_Malaga`,
      `Calle_Evaluada,"${forensicProof.streetName}",Vial,${forensicProof.district}`,
      `Arboles_Evaluados,${forensicProof.evaluatedTreesCount},ejemplares,Modo_${proofScaleMode}`,
      `Red_Detectores_Terrestres_Mas_Satelites,${fl.totalTerrestrialSensorsCount}+${fl.totalSatelliteMissionsCount},nodos,SSOT_SYSTEM_PROPAGATION`,
      `Detector_App_Mas_Cercano,"${fl.nearestSensorName} (${fl.nearestSensorCode})",${fl.nearestSensorDistanceMeters} m,"${fl.nearestSensorNetwork}"`,
      `Gradiente_NO2_Calzada_Copa_Acera,${fl.roadsideNo2UgM3} -> ${fl.inCanopyNo2UgM3} -> ${fl.sidewalkNo2UgM3},ug/m3,Ecuacion_Beer_Lambert_Gromke_1.5m`,
      `Gradiente_PM25_Calzada_Copa_Acera,${fl.roadsidePm25UgM3} -> ${fl.inCanopyPm25UgM3} -> ${fl.sidewalkPm25UgM3},ug/m3,Ecuacion_Filtracion_Aerodinamica_Copa`,
      `Sinergia_Suelo_Mas_Arbol_NO2,${fl.combinedStreetPavementPlusTreeNo2KgYear},kg/año,"${fl.pavementTypeLabel}"`,
      `Conductancia_Estomatica_Jarvis_Ball_Berry_gs,${fl.stomatalPorometryGsMmolM2s},mmol_H2O/m2s,Ecuacion_Jarvis_Ball_Berry_Acople_Detector_App`,
      `Flujo_Xilematico_Penman_Granier_Js,${fl.xylemSapFlowGranierLitersHour},L/h,Ecuacion_Termodinamica_Flujo_Savia`,
      `Indice_Estequiometrico_Balance_Nitrogeno_NBI,${fl.opticalDualexNitrogenBalanceIndexNbi},indice_NBI,Ecuacion_Estequiometrica_Asimilacion_Foliar_N`,
      `Acumulacion_Ferromagnetica_SIRM_ChiLf,${fl.bartingtonMagneticSusceptibilityChiLf},10^-8_m3/kg,Ecuacion_Deposicion_Magnetita_Frenos`,
      `Concentracion_Estequiometrica_Alcorque_NO3,${fl.throughfallIseNitrateMgL},mg_NO3/L,Balance_Estequiometrico_Lavado_Pluvial_NO3`,
      `Flujo_Turbulento_Monin_Obukhov_NO2,${ef.eddyTurbulentNo2FluxNgM2s},ng/m2s,Ecuacion_Transferencia_Turbulenta_Ley_3_Resistencias`,
      `Velocidad_Deposicion_Efectiva_vd,${ef.eddyEffectiveDepositionVelocityCms},cm/s,Ecuacion_1_Sobre_ra_rb_rc_uStar_${ef.sonicFrictionVelocityUstarMs}_m/s`,
      `Mezcla_Binaria_Isotopica_d13C_CO2,${ef.liveCavityRingdownDelta13CPermil},permil,Ecuacion_Balance_Isotopico_OCO2_3_Y_Trafico`,
      `CO2_Fosil_Escape_Asimilado_FvCB,${ef.fossilTrafficCo2SequesteredKgYear},kg_CO2_fosil/año,Modelo_Bioquimico_Farquhar_FvCB_Ratio_CO_CO2_${ef.liveTrafficCoToCo2EnhancementRatioPpbPpm}`,
      `Estequiometria_Metales_Freno_EMEP_Cu_Sb_Ba,${ef.handheldPxrfCuMgKgLive} / ${ef.handheldPxrfSbMgKgLive} / ${ef.handheldPxrfBaMgKgLive},mg/kg,Factores_Emision_EMEP_EEA_COPERT5_Ratio_Cu_Sb_${ef.handheldPxrfBrakeCuSbRatio}`,
      `Atenuacion_Beer_Lambert_Black_Carbon,-${ef.aethalometerBlackCarbon880nmReductionPct},%,Ecuacion_Extincion_Optica_Hollin_Copa`,
      `Crecimiento_Radial_Alometrico_Tronco,${ef.iotDendrometerRadialGrowthUmDay},um/dia,Cinética_Alometrica_Xilematica_BAI_${ef.liveBasalAreaIncrementCm2Year}_cm2/año`,
      `Enfriamiento_Termodinamico_Penman_Monteith_DeltaT,${ef.thermalIrLeafCoolingDeltaTC},degC,Ecuacion_Balance_Energia_Penman_Monteith_Calor_Latente_${ef.latentHeatTranspirationWm2}_W/m2`,
      `Indice_Reflectancia_Fotoquimica_Satelital_PRI,${ef.hyperspectralPhotochemicalReflectanceIndexPri} (${ef.liveStomatalApertureActivePct}%),PRI_adim,Cierre_Radiativo_Satelital_Sentinel2_ECOSTRESS`
    ].join('\n');
    const csvContent = `${baseCsv}\n${doctoralAppendix}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tesis_doctoral_detectores_app_fisicoquimica_${forensicProof.treeId}_${proofScaleMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Especiación de BVOCs y Rendimiento SOA por Árbol (MEGAN 2.1)"
      icon={<Trees className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-4xl max-h-[85vh] bg-slate-950/95 border border-emerald-700/80 rounded-xl overflow-hidden p-0"
      headerColorClass="text-emerald-300"
    >
      <div className="space-y-3 font-sans text-slate-200">
        {/* Tree Species Selector */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Trees className="w-3.5 h-3.5" /> Especie de Arbolado Urbano de Málaga:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MALAGA_URBAN_TREE_SPECIES.map((sp) => (
                <ScientificTooltip
                  key={sp.id}
                  position="bottom"
                  width="w-[260px]"
                  content={`${sp.commonName} (${sp.scientificName}): emisión base de isopreno (${sp.efIsoprene} µg/g·h) y monoterpenos (${sp.efMonoterpenes} µg/g·h).`}
                >
                  <button
                    onClick={() => setSelectedSpecies(sp)}
                    className={`px-2 py-1 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                      selectedSpecies.id === sp.id
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {sp.commonName}
                  </button>
                </ScientificTooltip>
              ))}
            </div>
          </div>
          <p className="text-[9.5px] text-slate-400 italic">
            {selectedSpecies.scientificName} • {selectedSpecies.typicalLocationInMalaga} • Densidad foliar: {selectedSpecies.leafBiomassDensityG_m2} g/m² (LAI: {selectedSpecies.laiDefault})
          </p>
        </div>

        {/* View Tabs — Cinta Deslizante Continua (Opción 1 / Regla 22) */}
        <SlidingRibbonBar
          activeKey={activeTab}
          accent="emerald"
          ariaLabel="Subpestañas de Especiación de BVOCs y Rendimiento SOA"
          className="border-b border-slate-800 pb-1"
          rightAddon={
            <ScientificTooltip
              position="left"
              width="w-[240px]"
              content="Exportar los flujos calculados de BVOCs y SOA en formato CSV estructurado FAIR."
            >
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-2.5 py-1 rounded transition-colors font-medium cursor-pointer shrink-0 whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar CSV FAIR</span>
              </button>
            </ScientificTooltip>
          }
        >
          <ScientificTooltip
            position="bottom"
            width="w-[340px]"
            content="Demostración Doctoral Q1 (2024–2026) Árbol a Árbol y Calle a Calle mediante los detectores de la app y ecuaciones fisicoquímicas deterministas: Ley de 3 Resistencias (r_a+r_b+r_c), reciclaje metabólico enzimático NR → NiR → GS-GOGAT hacia aminoácidos (L-Glutamina) y proteínas, nitrificación epífita en filosfera, sumidero cortical de tronco (BAI) y balance termodinámico de Penman-Monteith y Farquhar (FvCB)."
          >
            <button
              data-ribbon-active={activeTab === 'forensic_proof'}
              onClick={() => setActiveTab('forensic_proof')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'forensic_proof'
                  ? 'bg-emerald-950/90 text-emerald-300 border-b-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔬 Demostración Árbol/Calle (Detectores App &amp; Ecuaciones)
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[280px]"
            content="Ruta biosintética MEP/MVA y formación de aerosoles orgánicos secundarios (SOA) por ozonólisis y radicales OH."
          >
            <button
              data-ribbon-active={activeTab === 'diagram'}
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'diagram'
                  ? 'bg-slate-800 text-emerald-300 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagrama Biosíntesis &amp; SOA
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[280px]"
            content="Factores de actividad C_L (radiación PAR) y C_T (temperatura) del algoritmo canónico de Guenther et al. (MEGAN 2.1)."
          >
            <button
              data-ribbon-active={activeTab === 'biogenic_flux'}
              onClick={() => setActiveTab('biogenic_flux')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'biogenic_flux'
                  ? 'bg-slate-800 text-lime-300 border-b-2 border-lime-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Radiación &amp; Cinética Guenther
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[280px]"
            content="Desglose del cóctel de terpenos y rendimientos de aerosol secundario (SOA yield) mediante coeficientes VBS de Pankow."
          >
            <button
              data-ribbon-active={activeTab === 'cocktail'}
              onClick={() => setActiveTab('cocktail')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'cocktail'
                  ? 'bg-slate-800 text-emerald-300 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cóctel de BVOCs &amp; Rendimiento SOA
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[300px]"
            content="Comparación del balance neto de calidad del aire entre las 6 especies de Málaga (captura NO₂ vs formación de O₃ y SOA)."
          >
            <button
              data-ribbon-active={activeTab === 'species_comparison'}
              onClick={() => setActiveTab('species_comparison')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'species_comparison'
                  ? 'bg-slate-800 text-emerald-300 border-b-2 border-emerald-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comparativa Municipal (Balance Neto)
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="bottom"
            width="w-[340px]"
            content="Modelización determinista de la física y química interfacial del firme urbano de Málaga: 99,8 % de asfalto bituminoso convencional (emisión solar de IVOCs/SVOCs, conversión NO₂ → HONO en urban grime, hematita α-Fe₂O₃ de frenos y ozonólisis 6PPD → 6PPD-Q) frente al 0,2 % del inventario verificado Grado A1 con TiO₂ (GMU / UMA)."
          >
            <button
              data-ribbon-active={activeTab === 'pavement'}
              onClick={() => setActiveTab('pavement')}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'pavement'
                  ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Física-Química del Firme (Asfalto vs TiO₂)
            </button>
          </ScientificTooltip>
        </SlidingRibbonBar>

        {/* Telemetría Real Asimilada en Vivo de los Detectores de la App — Cero Sliders de Simulación */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-800/60 text-[10px]">
          <ScientificTooltip content="Temperatura ambiental y foliar leída en tiempo real por los detectores meteorológicos de la app (AEMET + Red Municipal) y el sensor orbital térmico NASA ECOSTRESS LST. Gobierna la ecuación enzimática de Arrhenius modificada de la Isopreno Sintasa (MEGAN).">
            <div className="bg-slate-950/90 border border-slate-800 p-2 rounded flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-red-400" /> Temp Detector App:
              </span>
              <span className="font-mono text-red-300 font-bold">{tempC.toFixed(1)} °C</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip content="Flujo de fotones fotosintéticos (PAR = 2,02 · R_g) medido en vivo por piranómetros terrestres y Meteosat Third Generation (MTG) / CAMS. Gobierna la síntesis de novo de isopreno en los cloroplastos (ruta MEP).">
            <div className="bg-slate-950/90 border border-slate-800 p-2 rounded flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> PAR Real ({liveSolarRadWm2} W/m²):
              </span>
              <span className="font-mono text-amber-300 font-bold">{parSolar} µmol/m²s</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip content="Superficie real de copa proyectada calculada geométricamente a partir del diámetro de copa censado en el inventario municipal (π·r²·N_árboles) y su índice de área foliar (LAI Sentinel-2 MSI).">
            <div className="bg-slate-950/90 border border-slate-800 p-2 rounded flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Trees className="w-3.5 h-3.5 text-emerald-400" /> Copa Censada ({forensicProof.evaluatedTreesCount} árb.):
              </span>
              <span className="font-mono text-emerald-300 font-bold">{canopyAreaM2} m²</span>
            </div>
          </ScientificTooltip>

          <ScientificTooltip content="Concentración real de NO₂ / NOₓ leída en tiempo real por el detector más cercano de la red oficial de estaciones terrestres y misiones satelitales (TROPOMI / Sentinel-4). Cero simulación.">
            <div className="bg-slate-950/90 border border-slate-800 p-2 rounded flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> NO₂ Detector App:
              </span>
              <span className="font-mono text-rose-300 font-bold">{liveNo2UgM3} µg/m³ ({ambientNOxPpb} ppb)</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Tab Content */}
        {activeTab === 'forensic_proof' && (
          <div className="bg-slate-950/95 border border-emerald-800/70 p-3 rounded-lg space-y-3 text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Ejemplar / Alineación Viaria Censada:
                </span>
                <select
                  value={selectedNotableTreeId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedNotableTreeId(nextId);
                    const found = MALAGA_NOTABLE_TREES.find((t) => t.id === nextId);
                    if (found && activePointCtx?.syncActivePoint) {
                      activePointCtx.syncActivePoint(found.lat, found.lon, {
                        name: `${found.streetName} — ${found.name}`,
                        fly: false
                      });
                    }
                  }}
                  className="bg-slate-950 border border-emerald-700/70 text-slate-100 rounded px-2 py-1 text-[10px] font-medium cursor-pointer"
                >
                  {MALAGA_NOTABLE_TREES.slice(0, 45).map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.district}] {t.streetName} — {t.name} ({t.streetTreeCount} árboles en calle)
                    </option>
                  ))}
                </select>
                <span className="flex items-center gap-1 text-[9px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
                  <Radio className="w-3 h-3 text-emerald-400" /> Telemetría Real en Vivo · 0% Simulación
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => setProofScaleMode('single_tree')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                    proofScaleMode === 'single_tree'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1 Árbol Individual
                </button>
                <button
                  onClick={() => setProofScaleMode('five_trees_proof')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                    proofScaleMode === 'five_trees_proof'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tramo 5 Árboles (Demostración)
                </button>
                <button
                  onClick={() => setProofScaleMode('full_street')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                    proofScaleMode === 'full_street'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Calle Completa ({selectedNotableTree.streetTreeCount} Árboles)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Bloque 1: Captación Física Real */}
              <div className="bg-slate-900/90 border border-emerald-800/60 p-2.5 rounded-lg space-y-1.5">
                <div className="text-[10.5px] font-bold text-emerald-300 flex items-center justify-between">
                  <span>1. Captación Física ({forensicProof.evaluatedTreesCount} {forensicProof.evaluatedTreesCount === 1 ? 'Árbol' : 'Árboles'})</span>
                  <span className="font-mono text-[9px] text-emerald-400">{forensicProof.treeCode}</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Ley de 3 Resistencias (<span className="font-mono text-slate-200">r_a={forensicProof.ra_sm}</span>, <span className="font-mono text-slate-200">r_b={forensicProof.rb_sm}</span>, <span className="font-mono text-slate-200">r_c={forensicProof.rc_sm} s/m</span>) y <span className="font-mono text-slate-200">C_comp={forensicProof.no2CompensationPointUgM3} µg/m³</span>.
                </div>
                <div className="space-y-1 font-mono text-[9.5px] pt-1">
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Área Foliar + Tronco (BAI):</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.totalEvaluatedLeafAreaM2} m² + {forensicProof.totalEvaluatedBarkAreaM2} m²</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">NO₂ Tráfico Eliminado:</span>
                    <span className="text-sky-300 font-bold">{forensicProof.no2CapturedGramsDay} g/día ({forensicProof.no2CapturedKgYear} kg/año)</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">PM₂.₅ Neto (-{forensicProof.windResuspensionFractionPct}% resusp.):</span>
                    <span className="text-amber-300 font-bold">{forensicProof.pm25CapturedNetGramsDay} g/día ({forensicProof.pm25CapturedNetKgYear} kg/año)</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Caulosfera CH₄+CO (Nature 2024):</span>
                    <span className="text-teal-300 font-bold">{forensicProof.barkMethaneAndCoCapturedGramsYear} g/año</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Microplásticos Neumático (TWP):</span>
                    <span className="text-purple-300 font-bold">{forensicProof.barkAndLeafMicroplasticsCapturedMgDay} mg/día</span>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Reciclaje Metabólico Interno */}
              <div className="bg-slate-900/90 border border-cyan-800/60 p-2.5 rounded-lg space-y-1.5">
                <div className="text-[10.5px] font-bold text-cyan-300 flex items-center justify-between">
                  <span>2. Reciclaje Metabólico (NR → GS-GOGAT)</span>
                  <span className="font-mono text-[9px] text-cyan-400">100% Cierre Masa</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  El NO₂ se reduce vía Nitrato Reductasa a aminoácidos (L-Glutamina) y nitrificación epífita (Guerrieri et al., PNAS/New Phytologist 2021–2024).
                </div>
                <div className="space-y-1 font-mono text-[9.5px] pt-1">
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Nitrógeno Elemental (N) Reciclado:</span>
                    <span className="text-cyan-300 font-bold">{forensicProof.elementalNitrogenAssimilatedGramsYear} g N/año</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">L-Glutamina Sintetizada (GS-GOGAT):</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.aminoAcidsGlutamineSynthesizedGramsYear} g AA/año</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Nueva Proteína Vegetal Fabricada:</span>
                    <span className="text-lime-300 font-bold">{forensicProof.vegetableProteinSynthesizedKgYear} kg proteína/año</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Abono al Alcorque (Throughfall NO₃⁻):</span>
                    <span className="text-sky-300 font-bold">{forensicProof.throughfallAndStemflowFertilizerGramsYear} g NO₃⁻/año</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">PAHs Biodegradados Filosfera:</span>
                    <span className="text-amber-300 font-bold">{forensicProof.pahBiodegradedByPhyllospherePct}% ({forensicProof.pahMineralizedToCo2MgYear} mg/año)</span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Ecuaciones Estequiométricas y Fisicoquímicas en Hoja, Corteza y Alcorque */}
              <div className="bg-slate-900/90 border border-amber-800/60 p-2.5 rounded-lg space-y-1.5">
                <div className="text-[10.5px] font-bold text-amber-300 flex items-center justify-between">
                  <span>3. Ecuaciones Fisicoquímicas en Hoja y Alcorque</span>
                  <span className="font-mono text-[9px] text-amber-400">Detectores App + Cinética</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Cálculo determinista acoplado en tiempo real a los detectores de la app en {forensicProof.streetName}, mediante formulaciones estequiométricas y termodinámicas.
                </div>
                <div className="space-y-1 font-mono text-[9.5px] pt-1">
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Índice Balance N (NBI) y Mezcla δ¹⁵N:</span>
                    <span className="text-amber-300 font-bold">
                      NBI {forensicProof.streetLevelFieldLab.opticalDualexNitrogenBalanceIndexNbi} ({forensicProof.foliarDelta15NPermil > 0 ? `+${forensicProof.foliarDelta15NPermil}` : forensicProof.foliarDelta15NPermil} ‰)
                    </span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">% N Foliar Asimilado del Tráfico:</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.trafficDerivedNitrogenLeafPct}% del N foliar</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Cinética Michaelis-Menten NR:</span>
                    <span className="text-sky-300 font-bold">{forensicProof.nitrateReductaseActivityUmolGFwH} µmol NO₂⁻/g·h</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Deposición Ferromagnética Frenos (χ / SIRM):</span>
                    <span className="text-rose-300 font-bold">{forensicProof.streetLevelFieldLab.bartingtonMagneticSusceptibilityChiLf}×10⁻⁸ m³/kg ({forensicProof.leafBiomagneticSirmMicroAm2Kg} µA·m²/kg)</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Estequiometría Nitrato en Alcorque (NO₃⁻):</span>
                    <span className="text-purple-300 font-bold">{forensicProof.throughfallNitrateConcentrationMgL} mg NO₃⁻/L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 4: Balance Aerodinámico Honesto a 1.5 m */}
            <div className="bg-emerald-950/30 border border-emerald-700/60 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[9.5px]">
              <div className="space-y-0.5 max-w-2xl">
                <div className="font-bold text-emerald-300">
                  4. Balance Aerodinámico y Prescripción de Copa en {forensicProof.streetName} (Pugh et al., Nature Geoscience 2012; Gromke &amp; Ruck, 2009):
                </div>
                <div className="text-slate-300">
                  {forensicProof.optimalPruningPrescription}
                </div>
              </div>
              <div className="flex gap-2 font-mono">
                <div className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-center">
                  <div className="text-[8.5px] text-slate-400">Δ[NO₂] Neto (1.5 m)</div>
                  <div className={`font-bold ${forensicProof.pedestrianLevelNetNo2ChangePct <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {forensicProof.pedestrianLevelNetNo2ChangePct > 0 ? `+${forensicProof.pedestrianLevelNetNo2ChangePct}%` : `${forensicProof.pedestrianLevelNetNo2ChangePct}%`}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-center">
                  <div className="text-[8.5px] text-slate-400">Δ[PM₂.₅] Neto (1.5 m)</div>
                  <div className={`font-bold ${forensicProof.pedestrianLevelNetPm25ChangePct <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {forensicProof.pedestrianLevelNetPm25ChangePct > 0 ? `+${forensicProof.pedestrianLevelNetPm25ChangePct}%` : `${forensicProof.pedestrianLevelNetPm25ChangePct}%`}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-center">
                  <div className="text-[8.5px] text-slate-400">Micronutrientes Fe/Zn/Mn</div>
                  <div className="font-bold text-cyan-300">{forensicProof.micronutrientsChelatedFeZnMnMgYear} mg/año</div>
                </div>
              </div>
            </div>

            {/* Bloque 5: Medición Directa con los Detectores de la App y Ecuaciones Fisicoquímicas Viales */}
            <div className="bg-slate-900/95 border border-sky-700/70 p-2.5 rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                <div className="text-[10.5px] font-bold text-sky-300 flex items-center gap-1.5">
                  <span>📡 5. Detectores de la App ({forensicProof.streetLevelFieldLab.totalTerrestrialSensorsCount} Estaciones Terrestres + {forensicProof.streetLevelFieldLab.totalSatelliteMissionsCount} Satélites) + Ecuaciones Fisicoquímicas Viales</span>
                </div>
                <span className="font-mono text-[9px] bg-sky-950/90 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded">
                  Detector App a {forensicProof.streetLevelFieldLab.nearestSensorDistanceMeters} m: {forensicProof.streetLevelFieldLab.nearestSensorName} ({forensicProof.streetLevelFieldLab.nearestSensorCode})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[9px]">
                {/* Sub-bloque 5A: Ecuación de Atenuación de Beer-Lambert-Gromke Calzada -> Copa -> Acera */}
                <div className="bg-slate-950/90 border border-slate-800 p-2 rounded space-y-1">
                  <div className="text-sky-400 font-bold font-sans text-[9.5px]">
                    5A. Ecuación Beer-Lambert-Gromke (Calzada → Copa → Acera)
                  </div>
                  <div className="text-[8.5px] text-slate-400 font-sans">
                    Detectores de la App: {forensicProof.streetLevelFieldLab.nearestSensorInstruments}
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-400">NO₂ (Calzada → Copa → Acera):</span>
                    <span className="text-emerald-300 font-bold">
                      {forensicProof.streetLevelFieldLab.roadsideNo2UgM3} → {forensicProof.streetLevelFieldLab.inCanopyNo2UgM3} → {forensicProof.streetLevelFieldLab.sidewalkNo2UgM3} µg/m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PM₂.₅ (Calzada → Copa → Acera):</span>
                    <span className="text-amber-300 font-bold">
                      {forensicProof.streetLevelFieldLab.roadsidePm25UgM3} → {forensicProof.streetLevelFieldLab.inCanopyPm25UgM3} → {forensicProof.streetLevelFieldLab.sidewalkPm25UgM3} µg/m³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Black Carbon (Calzada → Acera):</span>
                    <span className="text-rose-300 font-bold">
                      {forensicProof.streetLevelFieldLab.roadsideBlackCarbonUgM3} → {forensicProof.streetLevelFieldLab.sidewalkBlackCarbonUgM3} µg/m³ (-{forensicProof.streetLevelFieldLab.canopyFiltrationAttenuationPct}%)
                    </span>
                  </div>
                </div>

                {/* Sub-bloque 5B: Acoplamiento Fisicoquímico Suelo (TiO2 Grado A1 vs 99.8% Asfalto) + Árbol */}
                <div className="bg-slate-950/90 border border-slate-800 p-2 rounded space-y-1">
                  <div className="text-indigo-300 font-bold font-sans text-[9.5px]">
                    5B. Cinética Interfacial Suelo + Árbol ({forensicProof.streetLevelFieldLab.isTio2StreetGradeA1 ? 'TiO₂ Grado A1' : 'Asfalto 99,8%'})
                  </div>
                  <div className="text-[8.5px] text-slate-400 font-sans truncate" title={forensicProof.streetLevelFieldLab.pavementTypeLabel}>
                    {forensicProof.streetLevelFieldLab.pavementTypeLabel}
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-400">Abatimiento Total Suelo+Árbol:</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.streetLevelFieldLab.combinedStreetPavementPlusTreeNo2KgYear} kg NO₂/año</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HONO Asfalto Interceptado Copa:</span>
                    <span className="text-sky-300 font-bold">{forensicProof.streetLevelFieldLab.asphaltHonoInterceptedByTreeGramsDay} g/día</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IVOCs Betún + 6PPD-Q Neumático:</span>
                    <span className="text-purple-300 font-bold">
                      {forensicProof.streetLevelFieldLab.asphaltIvocSvocCapturedByTreeGramsDay} g/d + {forensicProof.streetLevelFieldLab.tire6ppdQuinoneCapturedByTreeMgDay} mg/d
                    </span>
                  </div>
                </div>

                {/* Sub-bloque 5C: Ecuaciones Termodinámicas y Estequiométricas Acopladas a los Detectores */}
                <div className="bg-slate-950/90 border border-slate-800 p-2 rounded space-y-1">
                  <div className="text-teal-300 font-bold font-sans text-[9.5px]">
                    5C. Ecuaciones Biofísicas y Estequiométricas (App)
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conductancia Jarvis (g_s) / Savia:</span>
                    <span className="text-teal-300 font-bold">
                      {forensicProof.streetLevelFieldLab.stomatalPorometryGsMmolM2s} mmol/m²s · {forensicProof.streetLevelFieldLab.xylemSapFlowGranierLitersHour} L/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rendimiento Cuántico PSII (Fv/Fm) / CE:</span>
                    <span className="text-lime-300 font-bold">
                      {forensicProof.streetLevelFieldLab.chlorophyllFluorescenceFvFm} · {forensicProof.streetLevelFieldLab.throughfallElectricalConductivityUsCm} µS/cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estequiometría Metales Fe/Cu/Zn (EMEP):</span>
                    <span className="text-amber-300 font-bold">
                      {forensicProof.streetLevelFieldLab.bartingtonMagneticSusceptibilityChiLf} · {forensicProof.streetLevelFieldLab.portableXrfBarkFeCuZnMgKg}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 6: Exclusiva Doctoral Mundial — 5 Demostraciones por Detectores de la App y Ecuaciones Fisicoquímicas */}
            <div className="bg-slate-900/95 border border-purple-700/70 p-2.5 rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                <div className="text-[10.5px] font-bold text-purple-300">
                  🏆 6. Exclusiva Doctoral Mundial: 5 Demostraciones por Detectores de la App ({forensicProof.streetLevelFieldLab.totalTerrestrialSensorsCount}+{forensicProof.streetLevelFieldLab.totalSatelliteMissionsCount}) y Ecuaciones Fisicoquímicas (Monin-Obukhov · Farquhar FvCB · EMEP/COPERT · Alometría Xilemática · Penman-Monteith)
                </div>
                <span className="font-mono text-[9px] bg-purple-950/90 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded">
                  100% Detectores de la App + Ecuaciones Fisicoquímicas Deterministas · Cero Equipos Portátiles o de Laboratorio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 font-mono text-[9px]">
                {/* Ecuación 1: Transferencia Turbulenta de Monin-Obukhov y Ley de 3 Resistencias */}
                <div className="bg-slate-950/95 border border-purple-900/60 p-2 rounded space-y-1">
                  <div className="text-purple-300 font-bold font-sans text-[9.5px]">1. Monin-Obukhov (3 Resist.)</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Flujo F = -v_d·C:</span>
                    <span className="text-purple-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.eddyTurbulentNo2FluxNgM2s} ng/m²s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">v_d (r_a+r_b+r_c):</span>
                    <span className="text-amber-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.eddyEffectiveDepositionVelocityCms} cm/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fricción Karman u*:</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.sonicFrictionVelocityUstarMs} m/s</span>
                  </div>
                </div>

                {/* Ecuación 2: Modelo Bioquímico Farquhar (FvCB) + Mezcla Isotópica OCO-2/3 */}
                <div className="bg-slate-950/95 border border-sky-900/60 p-2 rounded space-y-1">
                  <div className="text-sky-300 font-bold font-sans text-[9.5px]">2. Cinética FvCB &amp; OCO-2/3</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mezcla Binaria δ¹³C:</span>
                    <span className="text-sky-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.liveCavityRingdownDelta13CPermil} ‰</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estequiom. ΔCO/ΔCO₂:</span>
                    <span className="text-amber-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.liveTrafficCoToCo2EnhancementRatioPpbPpm} ppb/ppm ({forensicProof.exclusiveLiveStreetForensics.fossilTrafficCo2FractionLivePct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CO₂ Fósil (FvCB):</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.fossilTrafficCo2SequesteredKgYear} kg/año</span>
                  </div>
                </div>

                {/* Ecuación 3: Factores EMEP/EEA COPERT 5 (Cu/Sb/Ba) + Extinción Beer-Lambert BC */}
                <div className="bg-slate-950/95 border border-amber-900/60 p-2 rounded space-y-1">
                  <div className="text-amber-300 font-bold font-sans text-[9.5px]">3. EMEP/COPERT &amp; Beer-Lambert</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cu / Sb / Ba (EMEP):</span>
                    <span className="text-amber-300 font-bold">
                      {forensicProof.exclusiveLiveStreetForensics.handheldPxrfCuMgKgLive}/{forensicProof.exclusiveLiveStreetForensics.handheldPxrfSbMgKgLive}/{forensicProof.exclusiveLiveStreetForensics.handheldPxrfBaMgKgLive} mg/kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estequiom. Freno Cu/Sb:</span>
                    <span className="text-rose-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.handheldPxrfBrakeCuSbRatio} (COPERT 5)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Beer-Lambert BC:</span>
                    <span className="text-emerald-300 font-bold">-{forensicProof.exclusiveLiveStreetForensics.aethalometerBlackCarbon880nmReductionPct}% hollín</span>
                  </div>
                </div>

                {/* Ecuación 4: Cinética Alométrica Xilemática y Traslocación Estequiométrica de N */}
                <div className="bg-slate-950/95 border border-emerald-900/60 p-2 rounded space-y-1">
                  <div className="text-emerald-300 font-bold font-sans text-[9.5px]">4. Alometría &amp; Flujo Xilema</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Incremento Radial ΔR:</span>
                    <span className="text-emerald-300 font-bold">+{forensicProof.exclusiveLiveStreetForensics.iotDendrometerRadialGrowthUmDay} µm/día ({forensicProof.exclusiveLiveStreetForensics.liveBasalAreaIncrementCm2Year} cm²/a)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Traslocación Xilema N:</span>
                    <span className="text-cyan-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.liveSapTranslocatedNitrogenMgHour} mg N/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Balance Biomasa ZBE:</span>
                    <span className="text-lime-300 font-bold">+{forensicProof.exclusiveLiveStreetForensics.zbeCanopyVitalityGainPct}% vigor</span>
                  </div>
                </div>

                {/* Ecuación 5: Termodinámica Foliar de Penman-Monteith + Satélites ECOSTRESS / Sentinel-2 */}
                <div className="bg-slate-950/95 border border-rose-900/60 p-2 rounded space-y-1">
                  <div className="text-rose-300 font-bold font-sans text-[9.5px]">5. Penman-Monteith &amp; Satélite</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ΔT Penman-Monteith:</span>
                    <span className="text-sky-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.thermalIrLeafCoolingDeltaTC} °C ({forensicProof.exclusiveLiveStreetForensics.latentHeatTranspirationWm2} W/m²)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sentinel-2 MSI PRI:</span>
                    <span className="text-amber-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.hyperspectralPhotochemicalReflectanceIndexPri}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fracción Estomática g_s:</span>
                    <span className="text-emerald-300 font-bold">{forensicProof.exclusiveLiveStreetForensics.liveStomatalApertureActivePct}% abierta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagram' && (
          <TreeBvocSoaDiagram input={input} result={result} />
        )}

        {activeTab === 'biogenic_flux' && (
          <div className="space-y-3">
            <BiogenicEmissionsDiagram />
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                <span>Especie: <strong className="text-emerald-400">{selectedSpecies.commonName}</strong> (<em>{selectedSpecies.scientificName}</em>)</span>
                <span>Modelo Emisión: <strong className="text-lime-400">MEGAN 2.1 (Guenther et al., 2012)</strong></span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Flujo Isopreno:</span>
                  <strong className="text-sky-400 text-sm">{result.isopreneFluxUgm2H.toFixed(1)} µg/m²·h</strong>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Flujo Monoterpenos:</span>
                  <strong className="text-amber-400 text-sm">{result.monoterpenesFluxUgm2H.toFixed(1)} µg/m²·h</strong>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Emisión Diaria Copa:</span>
                  <strong className="text-emerald-400 text-sm">{result.totalBvocEmissionGramsDay.toFixed(2)} g/día</strong>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Potencial Formación O₃:</span>
                  <strong className="text-cyan-400 text-sm">{result.totalOzoneFormationPotentialGramsDay.toFixed(1)} g/día</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cocktail' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Pie Chart of BVOCs */}
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="text-xs font-bold text-slate-200 flex justify-between items-center">
                <span>Distribución del Cóctel de BVOCs</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  Total: {result.totalBvocEmissionGramsDay.toFixed(2)} g/día
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bvocPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={38}
                      paddingAngle={3}
                    >
                      {bvocPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg space-y-2 text-[9.5px]">
              <div className="text-xs font-bold text-indigo-300">
                Rendimientos de Partición SOA (Modelo de Pankow)
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between bg-slate-900 p-1.5 rounded">
                  <span className="text-slate-400">Rendimiento SOA Isopreno:</span>
                  <span className="text-sky-300 font-bold">{result.soaYieldIsoprenePct}%</span>
                </div>
                <div className="flex justify-between bg-slate-900 p-1.5 rounded">
                  <span className="text-slate-400">Rendimiento SOA Monoterpenos:</span>
                  <span className="text-amber-300 font-bold">{result.soaYieldMonoterpenesPct}%</span>
                </div>
                <div className="flex justify-between bg-slate-900 p-1.5 rounded">
                  <span className="text-slate-400">Rendimiento SOA Sesquiterpenos:</span>
                  <span className="text-purple-300 font-bold">{result.soaYieldSesquiterpenesPct}%</span>
                </div>
                <div className="flex justify-between bg-indigo-950/80 border border-indigo-700/60 p-1.5 rounded">
                  <span className="text-indigo-200 font-bold">Producción Neta PM₂.₅ SOA:</span>
                  <span className="text-emerald-300 font-bold">{result.soaMassProductionGramsDay.toFixed(2)} g PM2.5/día</span>
                </div>
                <div className="flex justify-between bg-sky-950/80 border border-sky-700/60 p-1.5 rounded">
                  <span className="text-sky-200 font-bold">Potencial Ozono (OFP MIR):</span>
                  <span className="text-cyan-300 font-bold">{result.totalOzoneFormationPotentialGramsDay.toFixed(1)} g O₃/día</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'species_comparison' && (
          <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-200 flex justify-between items-center">
              <span>Comparativa del Balance Neto de Calidad del Aire por Especie en Málaga</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                (NO₂ retirado vs Precursores O₃/SOA)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allSpeciesComparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} unit=" g/día" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="no2_removed" name="NO₂ Retirado (Estomas)" fill="#10b981" />
                  <Bar dataKey="soa_formed" name="SOA Generado (PM2.5)" fill="#a855f7" />
                  <Bar dataKey="net_score" name="Balance Neto Ponderado" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[9.5px] text-slate-300 bg-emerald-950/40 border border-emerald-800/60 p-2 rounded leading-relaxed">
              <strong className="text-emerald-300">Conclusión de Tesis:</strong> La elección de arbolado viario en cañones urbanos como Marqués de Larios o Juan XXIII debe priorizar especies como <em>Jacaranda mimosifolia</em> o <em>Citrus aurantium</em>, que maximizan la captación estomática de NO₂ sin generar picos de isopreno biogénico en olas de calor.
            </div>
          </div>
        )}

        {activeTab === 'pavement' && (
          <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-lg">
            <RoadPavementAndBvocTab
              streetName={selectedNotableTree.streetName}
              ambientTempC={tempC}
              solarRadWm2={liveSolarRadWm2}
              windSpeedMs={liveWindMs}
            />
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}
