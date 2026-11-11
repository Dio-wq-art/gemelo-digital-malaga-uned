import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { exportFairGeoJson, exportFairCsv } from '../lib/fairExport';
import { wgs84ToUtm30N } from '../lib/geodesy';
import {
  MALAGA_SPECIES_CATALOG,
  OFFICIAL_MALAGA_STREET_TREES,
  calculateStreetInterventionPhysics,
  StreetPlantingInterventionResult,
  TreeSpeciesAntiPollutionProfile,
  MalagaStreetTreeRecord
} from '../lib/malagaTreesInventory';
import {
  Trees,
  Leaf,
  MapPin,
  Wind,
  Sun,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  FileSpreadsheet,
  FileJson,
  FlaskConical,
  Info
} from 'lucide-react';

interface StreetTreePlantingInterventionModalProps {
  onClose: () => void;
  initialStreetId?: string;
}

export function StreetTreePlantingInterventionModal({
  onClose,
  initialStreetId = 'MGA-TREE-STR-01'
}: StreetTreePlantingInterventionModalProps) {
  const activePointCtx = useActivePoint();

  // Selección de calle
  const [selectedStreetId, setSelectedStreetId] = useState<string>(initialStreetId);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState<string>('');
  
  // Selección de especie objetivo
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('citrus'); // Default Naranjo
  const [treeCountToPlant, setTreeCountToPlant] = useState<number>(30);
  const [interventionType, setInterventionType] = useState<'replace_predominant' | 'add_new_alignment' | 'fill_vacant_pits'>('add_new_alignment');
  const [treeAgeClass, setTreeAgeClass] = useState<'Joven (<15a)' | 'Maduro (15-50a)' | 'Centenario (>50a)'>('Maduro (15-50a)');

  // Calle actual
  const currentStreetRecord: MalagaStreetTreeRecord = useMemo(() => {
    const found = OFFICIAL_MALAGA_STREET_TREES.find(s => s.id === selectedStreetId);
    if (found) return found;

    // Si hay un punto activo seleccionado desde el mapa Google
    if (activePointCtx?.activePoint) {
      return {
        id: 'CUSTOM-MAP-STREET',
        streetName: activePointCtx.activePoint.name || 'Calle Seleccionada en Google Maps',
        district: activePointCtx.activePoint.neighborhoodName || 'Málaga Centro',
        predominantSpeciesId: 'platanus',
        predominantSpeciesName: 'Plátano de Sombra (Platanus × hispanica)',
        totalTreeCount: 45,
        avgCanopyDiameterM: 7.5,
        avgHeightM: 12.0,
        estimatedStreetLAI: 3.8,
        estimatedNO2DepositionKgYear: 28.5,
        estimatedPM25DepositionKgYear: 42.0,
        aerodynamicRiskStatus: 'Óptimo',
        lat: activePointCtx.location.lat,
        lon: activePointCtx.location.lon
      };
    }

    return OFFICIAL_MALAGA_STREET_TREES[0];
  }, [selectedStreetId, activePointCtx]);

  // Especie objetivo
  const targetSpecies: TreeSpeciesAntiPollutionProfile = useMemo(() => {
    return MALAGA_SPECIES_CATALOG.find(sp => sp.id === selectedSpeciesId) || MALAGA_SPECIES_CATALOG[0];
  }, [selectedSpeciesId]);

  // Variables meteorológicas y de contaminación asimiladas en vivo
  const meteoAQ = useMemo(() => {
    if (activePointCtx) {
      return {
        meteo: {
          tempC: activePointCtx.data.temperatura_malaga || 26.5,
          rhPct: activePointCtx.data.humedad_relativa || 58.0,
          parWm2: Math.max(150, (activePointCtx.data.uv_index || 6) * 155),
          windSpeedMs: (activePointCtx.data.velocidad_viento_km_h || 11.5) / 3.6
        },
        pollution: {
          no2Ugm3: activePointCtx.assimilation.no2PedestrianLevel1_8mUgM3 || activePointCtx.data.no2_satelite_base || 38.5,
          o3Ugm3: activePointCtx.data.ozone || 64.0,
          pm25Ugm3: activePointCtx.data.pm2_5 || 14.5,
          pm10Ugm3: activePointCtx.data.pm10 || 26.0
        }
      };
    }
    return {
      meteo: { tempC: 26.5, rhPct: 58.0, parWm2: 620, windSpeedMs: 3.2 },
      pollution: { no2Ugm3: 38.5, o3Ugm3: 64.0, pm25Ugm3: 14.5, pm10Ugm3: 26.0 }
    };
  }, [activePointCtx]);

  // Cálculo determinista en tiempo real de la física de la intervención
  const result: StreetPlantingInterventionResult = useMemo(() => {
    return calculateStreetInterventionPhysics({
      streetRecord: currentStreetRecord,
      targetSpecies,
      treeCountToPlant,
      interventionType,
      treeAgeClass,
      meteo: meteoAQ.meteo,
      baselinePollution: meteoAQ.pollution
    });
  }, [currentStreetRecord, targetSpecies, treeCountToPlant, interventionType, treeAgeClass, meteoAQ]);

  // Filtrado de especies por búsqueda
  const filteredSpeciesList = useMemo(() => {
    return MALAGA_SPECIES_CATALOG.filter(sp =>
      sp.commonName.toLowerCase().includes(speciesSearchQuery.toLowerCase()) ||
      sp.scientificName.toLowerCase().includes(speciesSearchQuery.toLowerCase()) ||
      sp.foliageType.toLowerCase().includes(speciesSearchQuery.toLowerCase())
    );
  }, [speciesSearchQuery]);

  const utmCurrent = useMemo(() => {
    return wgs84ToUtm30N(currentStreetRecord.lon, currentStreetRecord.lat);
  }, [currentStreetRecord]);

  // Exportación FAIR
  const handleExportGeoJson = () => {
    const geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [currentStreetRecord.lon, currentStreetRecord.lat]
        },
        properties: {
          ...result,
          utm_x_easting_m: Math.round(utmCurrent.x),
          utm_y_northing_m: Math.round(utmCurrent.y),
          utm_crs: "ETRS89 / UTM Zone 30N (EPSG:25830)"
        }
      }]
    };
    exportFairGeoJson(
      `implantacion_arbolado_${result.streetName.replace(/\s+/g, '_')}`,
      geojson,
      `Dictamen Físico de Implantación Arbórea - ${result.streetName} (${result.district})`
    );
  };

  const handleExportCsv = () => {
    const csvData = [{
      calle: result.streetName,
      distrito: result.district,
      especie_objetivo: result.targetSpeciesName,
      num_arboles: result.treeCount,
      lai_base: result.baselineLAI,
      lai_nuevo: result.newLAI,
      no2_base_ugm3: result.baselineNO2ConcUgm3,
      no2_nuevo_ugm3: result.newNO2ConcUgm3,
      delta_no2_ugm3: result.deltaNO2ConcUgm3,
      delta_no2_pct: result.deltaNO2ConcPct,
      pm25_base_ugm3: result.baselinePM25ConcUgm3,
      pm25_nuevo_ugm3: result.newPM25ConcUgm3,
      delta_pm25_ugm3: result.deltaPM25ConcUgm3,
      refrigeracion_c: result.microclimateCoolingDeltaC,
      co2_ton_ano: result.annualCarbonSequestrationTonCo2,
      riesgo_aerodinamico: result.aerodynamicRiskStatus,
      opals_index: result.opalsIndex,
      wgs84_lat: currentStreetRecord.lat,
      wgs84_lon: currentStreetRecord.lon,
      utm_x_m: Math.round(utmCurrent.x),
      utm_y_m: Math.round(utmCurrent.y),
      utm_crs: "EPSG:25830"
    }];
    exportFairCsv(
      `implantacion_arbolado_${result.streetName.replace(/\s+/g, '_')}`,
      csvData,
      `Dictamen Físico de Implantación Arbórea - ${result.streetName}`
    );
  };

  return (
    <DraggableWindow
      title="Laboratorio de Implantación Arbórea y Reacción Física en Vivo"
      subtitle={`Evaluador Mecanístico Cero-Aleatoriedad • Calle: ${result.streetName}`}
      icon={<Trees className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      defaultCollapsed={true}
      initialPositionClass="top-16 right-12"
      className="w-[780px] max-w-[95vw]"
    >
      <div className="p-4 flex flex-col space-y-4 font-sans text-slate-200 text-xs overflow-y-auto max-h-[80vh]">
        
        {/* Banner de Sincronización con Mapa */}
        <div className="bg-slate-950/80 border border-emerald-900/50 p-2.5 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px] flex items-center gap-2">
                <span>{currentStreetRecord.streetName}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded">
                  {currentStreetRecord.district}
                </span>
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono">
                WGS84: {currentStreetRecord.lat.toFixed(4)}°N, {currentStreetRecord.lon.toFixed(4)}°W • <span className="text-cyan-300">UTM 30N: X={Math.round(utmCurrent.x)} m, Y={Math.round(utmCurrent.y)} m</span> • Especie: {currentStreetRecord.predominantSpeciesName}
              </div>
            </div>
          </div>

          <ScientificTooltip position="left" width="w-[280px]" content="Conecta el punto geográfico activo seleccionado en el mapa de Google Híbrido con las ecuaciones deterministas de deposición de Wesely y ventilación de cañón.">
            <div className="text-right">
              <span className="text-[9px] font-mono font-bold text-emerald-400 block uppercase tracking-wider">Cero Aleatoriedad</span>
              <span className="text-[8px] text-slate-500">100% Física Mecanística</span>
            </div>
          </ScientificTooltip>
        </div>

        {/* Selector de Calle e Intervención */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded border border-slate-800">
          
          {/* Columna 1: Calle e Intervención */}
          <div className="flex flex-col space-y-2.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" /> 1. Seleccionar Calle de Málaga
            </label>

            <ScientificTooltip position="bottom" width="w-[300px]" content="Seleccionar la calle de Málaga para asimilar su censo arbóreo oficial, geometría viaria y carga de tráfico base.">
              <select
                value={selectedStreetId}
                onChange={(e) => setSelectedStreetId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {OFFICIAL_MALAGA_STREET_TREES.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.streetName} ({s.district}) - {s.totalTreeCount} ej.
                  </option>
                ))}
              </select>
            </ScientificTooltip>

            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 pt-1">
              <FlaskConical className="w-3 h-3 text-emerald-400" /> 2. Tipo de Intervención
            </label>

            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'add_new_alignment', label: 'Alineación Nueva', tip: 'Añadir una nueva alineación continua de árboles a lo largo de la acera.' },
                { id: 'replace_predominant', label: 'Sustituir Especie', tip: 'Sustituir progresivamente la especie predominante actual por la especie seleccionada.' },
                { id: 'fill_vacant_pits', label: 'Completar Alcorques', tip: 'Completar alcorques vacíos detectados en el inventario municipal de Málaga.' }
              ].map(opt => (
                <ScientificTooltip key={opt.id} position="bottom" width="w-[240px]" content={opt.tip}>
                  <button
                    onClick={() => setInterventionType(opt.id as any)}
                    className={`w-full px-2 py-1.5 text-[9px] font-bold rounded border transition-colors cursor-pointer ${
                      interventionType === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                </ScientificTooltip>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-300 font-bold">Número de Árboles a Implantar:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                {treeCountToPlant} ejemplares
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={treeCountToPlant}
              onChange={(e) => setTreeCountToPlant(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-300 font-bold">Clase de Madurez / Edad:</span>
              <ScientificTooltip position="bottom" width="w-[280px]" content="Clase etaria del arbolado: modula el índice de área foliar (LAI) y la biomasa foliar fotosintéticamente activa.">
                <select
                  value={treeAgeClass}
                  onChange={(e) => setTreeAgeClass(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-[10px] cursor-pointer"
                >
                  <option value="Joven (<15a)">Joven (&lt;15 años) - LAI 55%</option>
                  <option value="Maduro (15-50a)">Maduro (15-50 años) - LAI 100%</option>
                  <option value="Centenario (>50a)">Centenario (&gt;50 años) - LAI 135%</option>
                </select>
              </ScientificTooltip>
            </div>
          </div>

          {/* Columna 2: Selección de Especie Arbórea */}
          <div className="flex flex-col space-y-2.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Leaf className="w-3 h-3 text-emerald-400" /> 3. Red de Especies Arbóreas de Málaga
            </label>

            <input
              type="text"
              placeholder="Buscar especie por nombre común o científico..."
              value={speciesSearchQuery}
              onChange={(e) => setSpeciesSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded px-2.5 py-1 text-xs focus:border-emerald-500 focus:outline-none"
            />

            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredSpeciesList.map(sp => (
                <div
                  key={sp.id}
                  onClick={() => setSelectedSpeciesId(sp.id)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedSpeciesId === sp.id
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">{sp.commonName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                      OPALS: {sp.opalsIndex}
                    </span>
                  </div>
                  <div className="text-[9.5px] italic text-slate-400">{sp.scientificName}</div>
                  <div className="text-[8.5px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                    <span>LAI: {sp.defaultLAI} • Porosidad: {(sp.crownPorosity * 100).toFixed(0)}%</span>
                    <span>Score Anti-Cont: {sp.antiPollutionScore}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOQUE DE REACCIÓN FÍSICA EN VIVO DE LA CONTAMINACIÓN */}
        <div className="bg-slate-950 border border-emerald-900/60 p-3.5 rounded flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Reacción Física de Contaminantes en la Calle en Tiempo Real
            </h3>
            <span className="text-[9px] font-mono text-slate-400">
              Modelo Box Canyon + Wesely Dry Deposition
            </span>
          </div>

          {/* Grid de Contaminantes (NO2, PM2.5, PM10, O3) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            
            {/* NO2 */}
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col space-y-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400">Dióxido de Nitrógeno (NO₂)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500 font-mono text-[10px]">{result.baselineNO2ConcUgm3} µg/m³</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-sm text-white">{result.newNO2ConcUgm3} µg/m³</span>
              </div>
              <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${result.deltaNO2ConcUgm3 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.deltaNO2ConcUgm3 <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{result.deltaNO2ConcUgm3 > 0 ? `+${result.deltaNO2ConcUgm3}` : result.deltaNO2ConcUgm3} µg/m³ ({result.deltaNO2ConcPct}%)</span>
              </div>
            </div>

            {/* PM2.5 */}
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col space-y-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400">Partículas Finas (PM₂.₅)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500 font-mono text-[10px]">{result.baselinePM25ConcUgm3} µg/m³</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-sm text-white">{result.newPM25ConcUgm3} µg/m³</span>
              </div>
              <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${result.deltaPM25ConcUgm3 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.deltaPM25ConcUgm3 <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{result.deltaPM25ConcUgm3 > 0 ? `+${result.deltaPM25ConcUgm3}` : result.deltaPM25ConcUgm3} µg/m³ ({result.deltaPM25ConcPct}%)</span>
              </div>
            </div>

            {/* PM10 */}
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col space-y-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400">Partículas Gruesas (PM₁₀)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500 font-mono text-[10px]">{result.baselinePM10ConcUgm3} µg/m³</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-sm text-white">{result.newPM10ConcUgm3} µg/m³</span>
              </div>
              <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${result.deltaPM10ConcUgm3 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.deltaPM10ConcUgm3 <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{result.deltaPM10ConcUgm3 > 0 ? `+${result.deltaPM10ConcUgm3}` : result.deltaPM10ConcUgm3} µg/m³ ({result.deltaPM10ConcPct}%)</span>
              </div>
            </div>

            {/* O3 */}
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 flex flex-col space-y-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400">Ozono Troposférico (O₃)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500 font-mono text-[10px]">{result.baselineO3ConcUgm3} µg/m³</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-sm text-white">{result.newO3ConcUgm3} µg/m³</span>
              </div>
              <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${result.deltaO3ConcUgm3 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.deltaO3ConcUgm3 <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>{result.deltaO3ConcUgm3 > 0 ? `+${result.deltaO3ConcUgm3}` : result.deltaO3ConcUgm3} µg/m³ ({result.deltaO3ConcPct}%)</span>
              </div>
            </div>
          </div>

          {/* Advertencia de Riesgo Aerodinámico por Estancamiento */}
          {result.stagnationWarningMessage && (
            <div className={`p-2.5 rounded border text-[10px] flex items-start gap-2 ${
              result.aerodynamicRiskStatus === 'Riesgo_Estancamiento'
                ? 'bg-red-950/60 border-red-800/80 text-red-300'
                : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
            }`}>
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  Aviso Físico de Dinámica de Fluidos (Cañón Urbano H/W = {result.canyonHW})
                </span>
                <span>{result.stagnationWarningMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* MÉTRICAS SECUNDARIAS: TASA DE DEPOSICIÓN, CARBONO, REFRIGERACIÓN Y OPALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Tarjeta 1: Depósitos Secos Anualizados */}
          <div className="bg-slate-900/70 p-3 rounded border border-slate-800 flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Depósitos Secos (Wesely 1989)
            </span>
            <div className="text-[10px] space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Absorción NO₂ Anual:</span>
                <span className="text-emerald-400 font-bold">{result.newNO2AbsorptionKgYear} kg/año</span>
              </div>
              <div className="flex justify-between">
                <span>Retención PM₂.₅ Anual:</span>
                <span className="text-emerald-400 font-bold">{result.newPM25DepositionKgYear} kg/año</span>
              </div>
              <div className="flex justify-between">
                <span>Follaje LAI Total:</span>
                <span className="text-white font-bold">{result.newLAI.toFixed(1)} m²/m²</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Microclima y Fijación de Carbono */}
          <div className="bg-slate-900/70 p-3 rounded border border-slate-800 flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> Microclima & Secuestro CO₂
            </span>
            <div className="text-[10px] space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Refrigeración Evapotranspirativa:</span>
                <span className="text-cyan-400 font-bold">{result.microclimateCoolingDeltaC} °C</span>
              </div>
              <div className="flex justify-between">
                <span>Secuestro CO₂ Anual:</span>
                <span className="text-emerald-400 font-bold">+{result.annualCarbonSequestrationTonCo2} t CO₂/año</span>
              </div>
              <div className="flex justify-between">
                <span>Transpiración Hídrica:</span>
                <span className="text-blue-300 font-bold">{(result.transpirationLitersDayTotal / 1000).toFixed(1)} m³/día</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Alergenicidad OPALS & Trade-Off */}
          <div className="bg-slate-900/70 p-3 rounded border border-slate-800 flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Alergenicidad (Escala OPALS)
            </span>
            <div className="text-[10px] space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Índice OPALS (1-10):</span>
                <span className="text-amber-400 font-bold">{result.opalsIndex} / 10 ({result.allergenicityLevel})</span>
              </div>
              <div className="flex justify-between">
                <span>Ventilación Cañón (u_street):</span>
                <span className="text-white font-bold">{result.ventilationVelocityNewMs} m/s (ratio {(result.ventilationRatio * 100).toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Razón Depuración / Alergia:</span>
                <span className="text-emerald-400 font-bold">{result.ecosystemTradeOffRatio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer y Botonera de Exportación Citable FAIR */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="text-[9px] text-slate-500 font-mono">
            Tesis Doctoral • Gemelo Digital de Málaga • Asimilación Sin Aleatoriedad
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="top" width="w-[260px]" content="Exportar los resultados espaciales de la intervención arbórea en formato abierto GeoJSON con coordenadas UTM EPSG:25830.">
              <button
                onClick={handleExportGeoJson}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-emerald-800/60 text-emerald-400 rounded text-[9.5px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileJson className="w-3 h-3" /> GeoJSON
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="top" width="w-[260px]" content="Descargar la ficha de intervención y balance de deposición en formato CSV conforme a principios FAIR.">
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[9.5px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" /> CSV Citable
              </button>
            </ScientificTooltip>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
}
