import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trees, 
  MapPin, 
  Wind, 
  Sun, 
  Droplets, 
  Activity, 
  RefreshCw, 
  FileSpreadsheet, 
  FileJson, 
  Layers, 
  Search, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  FlaskConical,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { TreePhysiologyStomataDiagram } from './TreePhysiologyStomataDiagram';
import { 
  OFFICIAL_MALAGA_STREET_TREES, 
  MALAGA_SPECIES_CATALOG, 
  calculateStreetTreeLiveAbsorption, 
  StreetLiveAbsorptionMetrics,
  MalagaStreetTreeRecord,
  TreeSpeciesAntiPollutionProfile,
  exportMalagaTreesGeoJson,
  exportMalagaTreesCsv
} from '../lib/malagaTreesInventory';
import { fetchLiveZoneTelemetry, ZoneLiveTelemetry } from '../lib/liveZoneTelemetry';
import { useActivePoint } from '../context/ActivePointContext';

export interface MalagaStreetTreeLiveAbsorptionViewProps {
  initialStreetId?: string;
  onStreetChange?: (street: MalagaStreetTreeRecord) => void;
}

export const MalagaStreetTreeLiveAbsorptionView: React.FC<MalagaStreetTreeLiveAbsorptionViewProps> = ({
  initialStreetId = 'MGA-TREE-STR-01',
  onStreetChange
}) => {
  const activeCtx = useActivePoint();
  const [selectedStreetId, setSelectedStreetId] = useState<string>(initialStreetId || activeCtx?.nearestTreeStreet?.id || 'MGA-TREE-STR-01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('TODOS');
  const [isStreetScale, setIsStreetScale] = useState<boolean>(true); // true = calle completa; false = árbol unitario
  const [viewMode, setViewMode] = useState<'physiology_diagram' | 'all_streets_ranking'>('physiology_diagram');
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [telemetryTimestamp, setTelemetryTimestamp] = useState<string>('');

  useEffect(() => {
    if (initialStreetId) {
      setSelectedStreetId(initialStreetId);
    }
  }, [initialStreetId]);
  
  // Telemetría en vivo de la calle seleccionada
  const [liveMeteoAQ, setLiveMeteoAQ] = useState<{
    tempC: number;
    rhPct: number;
    parWm2: number;
    windSpeedMs: number;
    uvIndex: number;
    no2Ugm3: number;
    o3Ugm3: number;
    pm25Ugm3: number;
    pm10Ugm3: number;
    so2Ugm3: number;
    stationSource: string;
  }>({
    tempC: 26.5,
    rhPct: 58.0,
    parWm2: 640,
    windSpeedMs: 3.2,
    uvIndex: 6.8,
    no2Ugm3: 38.5,
    o3Ugm3: 64.0,
    pm25Ugm3: 14.5,
    pm10Ugm3: 26.0,
    so2Ugm3: 3.5,
    stationSource: 'Estación de Telemetría Oficial Málaga'
  });

  // Calle y especie seleccionadas
  const selectedStreet = useMemo(() => {
    return OFFICIAL_MALAGA_STREET_TREES.find(s => s.id === selectedStreetId) || OFFICIAL_MALAGA_STREET_TREES[0];
  }, [selectedStreetId]);

  const selectedSpecies = useMemo(() => {
    return MALAGA_SPECIES_CATALOG.find(sp => sp.id === selectedStreet.predominantSpeciesId) || MALAGA_SPECIES_CATALOG[0];
  }, [selectedStreet]);

  // Distritos únicos para filtro
  const districtsList = useMemo(() => {
    const list = Array.from(new Set(OFFICIAL_MALAGA_STREET_TREES.map(s => s.district)));
    return ['TODOS', ...list];
  }, []);

  // Función para cargar telemetría real en vivo de las coordenadas de la calle
  const loadStreetTelemetry = async (street: MalagaStreetTreeRecord) => {
    setIsLoadingTelemetry(true);
    try {
      const tel: ZoneLiveTelemetry = await fetchLiveZoneTelemetry({
        name: street.streetName,
        lat: street.lat,
        lon: street.lon,
        tag: `Arbolado ${street.district}`
      });

      if (tel) {
        setLiveMeteoAQ({
          tempC: tel.meteo.tempC,
          rhPct: tel.meteo.rhPct,
          parWm2: tel.meteo.parWm2 || Math.max(150, tel.meteo.uvIndex * 155),
          windSpeedMs: tel.meteo.windSpeedMs,
          uvIndex: tel.meteo.uvIndex,
          no2Ugm3: tel.chemistry.no2Ugm3,
          o3Ugm3: tel.chemistry.o3Ugm3,
          pm25Ugm3: tel.chemistry.pm25Ugm3,
          pm10Ugm3: tel.chemistry.pm10Ugm3,
          so2Ugm3: tel.chemistry.so2Ugm3 || 3.2,
          stationSource: tel.source || `Malla Urbana (${street.lat.toFixed(3)}°, ${street.lon.toFixed(3)}°)`
        });
        setTelemetryTimestamp(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.warn("Error asimilando telemetría para calle:", err);
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  // Carga automática al cambiar de calle
  useEffect(() => {
    loadStreetTelemetry(selectedStreet);
    if (onStreetChange) {
      onStreetChange(selectedStreet);
    }
  }, [selectedStreetId]);

  // Cálculo de absorción fito-fisiológica determinista acoplada
  const liveAbsorptionMetrics: StreetLiveAbsorptionMetrics = useMemo(() => {
    return calculateStreetTreeLiveAbsorption(
      selectedStreet,
      selectedSpecies,
      {
        tempC: liveMeteoAQ.tempC,
        rhPct: liveMeteoAQ.rhPct,
        parWm2: liveMeteoAQ.parWm2,
        windSpeedMs: liveMeteoAQ.windSpeedMs,
        uvIndex: liveMeteoAQ.uvIndex
      },
      {
        no2Ugm3: liveMeteoAQ.no2Ugm3,
        o3Ugm3: liveMeteoAQ.o3Ugm3,
        pm25Ugm3: liveMeteoAQ.pm25Ugm3,
        pm10Ugm3: liveMeteoAQ.pm10Ugm3,
        so2Ugm3: liveMeteoAQ.so2Ugm3
      }
    );
  }, [selectedStreet, selectedSpecies, liveMeteoAQ]);

  // Calles filtradas para el buscador / selector
  const filteredStreets = useMemo(() => {
    return OFFICIAL_MALAGA_STREET_TREES.filter(st => {
      const matchesText = st.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.predominantSpeciesName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistrict = selectedDistrict === 'TODOS' || st.district === selectedDistrict;
      return matchesText && matchesDistrict;
    });
  }, [searchQuery, selectedDistrict]);

  // Ranking de todas las calles de Málaga calculado en vivo
  const allStreetsRanking = useMemo(() => {
    return OFFICIAL_MALAGA_STREET_TREES.map(st => {
      const sp = MALAGA_SPECIES_CATALOG.find(item => item.id === st.predominantSpeciesId) || MALAGA_SPECIES_CATALOG[0];
      const m = calculateStreetTreeLiveAbsorption(
        st,
        sp,
        {
          tempC: liveMeteoAQ.tempC,
          rhPct: liveMeteoAQ.rhPct,
          parWm2: liveMeteoAQ.parWm2,
          windSpeedMs: liveMeteoAQ.windSpeedMs,
          uvIndex: liveMeteoAQ.uvIndex
        },
        {
          no2Ugm3: liveMeteoAQ.no2Ugm3,
          o3Ugm3: liveMeteoAQ.o3Ugm3,
          pm25Ugm3: liveMeteoAQ.pm25Ugm3,
          pm10Ugm3: liveMeteoAQ.pm10Ugm3,
          so2Ugm3: liveMeteoAQ.so2Ugm3
        }
      );
      return {
        street: st,
        species: sp,
        metrics: m
      };
    }).sort((a, b) => b.metrics.streetNO2AbsorptionGramsHour - a.metrics.streetNO2AbsorptionGramsHour);
  }, [liveMeteoAQ]);

  // Totales de todo el arbolado contabilizado en Málaga en vivo
  const totalMalagaTreesCount = useMemo(() => {
    return OFFICIAL_MALAGA_STREET_TREES.reduce((acc, curr) => acc + curr.totalTreeCount, 0);
  }, []);

  const totalMalagaLiveNO2AbsorptionGramsHour = useMemo(() => {
    return allStreetsRanking.reduce((acc, curr) => acc + curr.metrics.streetNO2AbsorptionGramsHour, 0);
  }, [allStreetsRanking]);

  const totalMalagaLivePM25DepositionGramsHour = useMemo(() => {
    return allStreetsRanking.reduce((acc, curr) => acc + curr.metrics.streetPM25DepositionGramsHour, 0);
  }, [allStreetsRanking]);

  // Exportación FAIR
  const handleExportGeoJson = () => {
    const jsonStr = exportMalagaTreesGeoJson(OFFICIAL_MALAGA_STREET_TREES);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbolado_malaga_absorcion_en_vivo_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = "id,calle,distrito,especie,num_arboles,lai,no2_absorcion_g_h,no2_anual_kg,pm25_dep_g_h,pm25_anual_kg,o3_absorcion_g_h,transpiracion_l_dia,refrigeracion_kw,score_neto,lat,lon\n";
    const rows = allStreetsRanking.map(item => {
      const m = item.metrics;
      return `"${m.streetId}","${m.streetName}","${m.district}","${m.speciesName}",${m.treeCount},${item.street.estimatedStreetLAI},${m.streetNO2AbsorptionGramsHour},${m.streetNO2AbsorptionKgYear},${m.streetPM25DepositionGramsHour},${m.streetPM25DepositionKgYear},${m.streetO3AbsorptionGramsHour},${m.streetTranspirationLitersDay},${m.streetBioclimaticCoolingKW},${m.netPollutantMitigationScore},${item.street.lat},${item.street.lon}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbolado_malaga_absorcion_en_vivo_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-3 font-sans text-slate-200">
      
      {/* 1. CABECERA: SELECTOR DE CALLES DE MÁLAGA & ESTADO DE TELEMETRÍA EN VIVO */}
      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-lg flex flex-col gap-2.5 shadow-md">
        
        {/* Fila 1: Título, Selector de Vista y Exportación */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-950/80 border border-emerald-600 rounded text-emerald-300">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  Arbolado Urbano de Málaga & Absorción Fito-Estomática en Vivo
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Telemetry Acoplada
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Integración de {totalMalagaTreesCount.toLocaleString()} árboles viales reales con telemetría atmosférica continua de Málaga y cinética estomática.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de modo de vista */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-xs">
              <ScientificTooltip content="Vista de biofísica celular y ultraestructura estomática: apertura de ostiolo, ciclo Foyer-Halliwell-Asada, señal hormonal de ABA y riesgo de cavitación del xilema." position="bottom">
                <button
                  onClick={() => setViewMode('physiology_diagram')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === 'physiology_diagram'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Fisiología & Estomas
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Ranking comparativo multiescalar: evalúa la tasa de asimilación neta (kg/año y g/h) de NO₂, O₃ y PM₂.₅ en los viales urbanos inventariados de Málaga." position="bottom">
                <button
                  onClick={() => setViewMode('all_streets_ranking')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                    viewMode === 'all_streets_ranking'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Ranking de Calles ({OFFICIAL_MALAGA_STREET_TREES.length})
                </button>
              </ScientificTooltip>
            </div>

            {/* Botones de Exportación */}
            <div className="flex items-center gap-1">
              <ScientificTooltip content="Exportar matriz de arbolado de Málaga con absorción calculada en tiempo real en formato GeoJSON para QGIS/ArcGIS." position="bottom">
                <button
                  onClick={handleExportGeoJson}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-xs text-emerald-300 font-mono flex items-center gap-1"
                >
                  <FileJson className="w-3 h-3" /> GeoJSON
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Exportar series temporales y balances fitoquímicos en CSV estandarizado (FAIR principles)." position="bottom">
                <button
                  onClick={handleExportCsv}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-xs text-cyan-300 font-mono flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3" /> CSV
                </button>
              </ScientificTooltip>
            </div>
          </div>
        </div>

        {/* Fila 2: Selector Rápido de Calles de Málaga & Telemetría en Vivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center text-xs">
          
          {/* Selector de Calle (Columna 1-6) */}
          <div className="lg:col-span-6 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Seleccionar Calle / Alineación Arbórea de Málaga:
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {selectedStreet.totalTreeCount} árboles en {selectedStreet.district}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStreetId}
                onChange={(e) => setSelectedStreetId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 font-medium rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                {OFFICIAL_MALAGA_STREET_TREES.map((st) => (
                  <option key={st.id} value={st.id} className="bg-slate-950 py-1">
                    {st.streetName} — {st.predominantSpeciesName.split('(')[0]} ({st.totalTreeCount} árboles, {st.district})
                  </option>
                ))}
              </select>

              {/* Botón de recarga de telemetría */}
              <ScientificTooltip content="Re-consultar en vivo la telemetría atmosférica (AEMET / Estaciones de Calidad del Aire de Málaga) para las coordenadas exactas de esta calle." position="bottom">
                <button
                  onClick={() => loadStreetTelemetry(selectedStreet)}
                  disabled={isLoadingTelemetry}
                  className="px-2.5 py-2 bg-cyan-950 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 rounded font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTelemetry ? 'animate-spin text-cyan-400' : ''}`} />
                  <span className="hidden sm:inline">Telemetría</span>
                </button>
              </ScientificTooltip>

              {/* Botón de sincronización con el Gemelo Digital */}
              <ScientificTooltip content="Sincronizar el punto activo global del Gemelo Digital con esta calle para centrar el mapa y actualizar todas las 21 vistas." position="bottom">
                <button
                  onClick={() => {
                    if (activeCtx?.syncActivePoint) {
                      activeCtx.syncActivePoint(selectedStreet.lat, selectedStreet.lon, { name: selectedStreet.streetName, fly: true });
                    }
                  }}
                  className="px-2.5 py-2 bg-emerald-950 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 rounded font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Centrar Mapa</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Telemetría Atmosférica en Vivo de la Calle (Columna 7-12) */}
          <div className="lg:col-span-6 bg-slate-950 p-2 rounded border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Condiciones en Calle:</span>
              <span className="font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                {liveMeteoAQ.tempC.toFixed(1)}°C
              </span>
              <span className="font-mono text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800">
                {liveMeteoAQ.rhPct.toFixed(0)}% HR
              </span>
              <span className="font-mono text-yellow-300 bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-800">
                {liveMeteoAQ.parWm2.toFixed(0)} W/m² PAR
              </span>
              <span className="font-mono text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800">
                {liveMeteoAQ.windSpeedMs.toFixed(1)} m/s Viento
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-orange-300">NO₂: {liveMeteoAQ.no2Ugm3.toFixed(1)} µg/m³</span>
              <span className="text-pink-300">O₃: {liveMeteoAQ.o3Ugm3.toFixed(1)} µg/m³</span>
              <span className="text-slate-300">PM₂.₅: {liveMeteoAQ.pm25Ugm3.toFixed(1)} µg/m³</span>
            </div>
          </div>

        </div>

        {/* Fila 3: Ficha Específica de la Calle Seleccionada & Toggle de Escala */}
        <div className="bg-slate-950/70 p-2 rounded border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-200">
              {selectedStreet.streetName}
            </span>
            <span className="text-slate-400 text-[11px]">
              ({selectedStreet.district} • {selectedStreet.lat.toFixed(4)}°N, {Math.abs(selectedStreet.lon).toFixed(4)}°W)
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded text-[10.5px] font-mono">
              Especie: {selectedSpecies.commonName} (<em>{selectedSpecies.scientificName}</em>)
            </span>
            <span className="bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10.5px]">
              LAI: <strong className="text-cyan-300 font-mono">{selectedStreet.estimatedStreetLAI} m²/m²</strong>
            </span>
            <span className="bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10.5px]">
              Dosel Foliar: <strong className="text-emerald-300 font-mono">{liveAbsorptionMetrics.totalFoliageAreaM2.toLocaleString()} m²</strong>
            </span>
            <span className={`border px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
              (selectedSpecies.opalsIndex ?? 3) <= 2 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
              (selectedSpecies.opalsIndex ?? 3) <= 4 ? 'bg-teal-950 text-teal-300 border-teal-700' :
              (selectedSpecies.opalsIndex ?? 3) <= 6 ? 'bg-amber-950 text-amber-300 border-amber-700' :
              'bg-rose-950 text-rose-300 border-rose-700'
            }`}>
              OPALS: {selectedSpecies.opalsIndex ?? 3}/10 ({selectedSpecies.allergenicityLevel ?? 'Baja'})
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              Pólen: {selectedSpecies.pollenVector ?? 'Entomófilo'} ({selectedSpecies.pollenSeason ?? 'Primavera'})
            </span>
          </div>

          {/* Toggle de Escala: Árbol individual vs Toda la Calle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-xs">
            <ScientificTooltip content="Ver flujos fisiológicos y masa absorbida por un único ejemplar arbóreo representativo de esta calle." position="left">
              <button
                onClick={() => setIsStreetScale(false)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  !isStreetScale 
                    ? 'bg-cyan-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌳 1 Árbol Unitario
              </button>
            </ScientificTooltip>

            <ScientificTooltip content={`Ver el total integrado de todos los ${selectedStreet.totalTreeCount} árboles alineados a lo largo de ${selectedStreet.streetName}.`} position="left">
              <button
                onClick={() => setIsStreetScale(true)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  isStreetScale 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌲🌲 Toda la Calle ({selectedStreet.totalTreeCount} árboles)
              </button>
            </ScientificTooltip>
          </div>

        </div>

      </div>

      {/* 2. TARJETAS DE INDICADORES DE ABSORCIÓN Y TRANSFORMACIÓN EN TIEMPO REAL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
        
        {/* Tarjeta 1: NO2 */}
        <div className="bg-slate-900/90 border border-orange-950/80 p-2.5 rounded-lg flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-orange-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> NO₂ Absorbido
            </span>
            <span className="text-[9px] bg-orange-950/80 text-orange-400 px-1 rounded border border-orange-900">
              Estomático
            </span>
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-orange-400">
              {isStreetScale ? liveAbsorptionMetrics.streetNO2AbsorptionGramsHour : liveAbsorptionMetrics.unitTreeNO2AbsorptionGramsHour} <span className="text-xs font-sans text-slate-400">g/hora</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Equivalente a: <strong className="text-orange-300">{isStreetScale ? liveAbsorptionMetrics.streetNO2AbsorptionKgYear : (liveAbsorptionMetrics.streetNO2AbsorptionKgYear / liveAbsorptionMetrics.treeCount).toFixed(2)} kg/año</strong>
            </div>
          </div>
          <div className="text-[10px] text-emerald-400 border-t border-slate-800 pt-1 flex items-center justify-between">
            <span>Fijación GS/GOGAT:</span>
            <strong className="font-mono">{liveAbsorptionMetrics.no2ProteinFixationRateGramsHour} g N/h</strong>
          </div>
        </div>

        {/* Tarjeta 2: O3 */}
        <div className="bg-slate-900/90 border border-pink-950/80 p-2.5 rounded-lg flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-pink-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> O₃ Neutralizado
            </span>
            <span className="text-[9px] bg-pink-950/80 text-pink-400 px-1 rounded border border-pink-900">
              Apoplasto
            </span>
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-pink-400">
              {isStreetScale ? liveAbsorptionMetrics.streetO3AbsorptionGramsHour : liveAbsorptionMetrics.unitTreeO3AbsorptionGramsHour} <span className="text-xs font-sans text-slate-400">g/hora</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Equivalente a: <strong className="text-pink-300">{isStreetScale ? liveAbsorptionMetrics.streetO3AbsorptionKgYear : (liveAbsorptionMetrics.streetO3AbsorptionKgYear / liveAbsorptionMetrics.treeCount).toFixed(2)} kg/año</strong>
            </div>
          </div>
          <div className="text-[10px] text-pink-300 border-t border-slate-800 pt-1 flex items-center justify-between">
            <span>Degradación APX:</span>
            <strong className="font-mono">{liveAbsorptionMetrics.o3AscorbateDetoxRateGramsHour} g/h</strong>
          </div>
        </div>

        {/* Tarjeta 3: PM2.5 & PM10 */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> PM₂.₅ Retenido
            </span>
            <span className="text-[9px] bg-slate-950 text-slate-400 px-1 rounded border border-slate-800">
              Cuticular
            </span>
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-cyan-300">
              {isStreetScale ? liveAbsorptionMetrics.streetPM25DepositionGramsHour : liveAbsorptionMetrics.unitTreePM25DepositionGramsHour} <span className="text-xs font-sans text-slate-400">g/hora</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Equivalente a: <strong className="text-cyan-300">{isStreetScale ? liveAbsorptionMetrics.streetPM25DepositionKgYear : (liveAbsorptionMetrics.streetPM25DepositionKgYear / liveAbsorptionMetrics.treeCount).toFixed(2)} kg/año</strong>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex items-center justify-between">
            <span>PM₁₀ Retenido:</span>
            <strong className="font-mono text-slate-300">{isStreetScale ? liveAbsorptionMetrics.streetPM10DepositionGramsHour : liveAbsorptionMetrics.unitTreePM10DepositionGramsHour} g/h</strong>
          </div>
        </div>

        {/* Tarjeta 4: Transpiración & Enfriamiento Bioclimático */}
        <div className="bg-slate-900/90 border border-sky-950/80 p-2.5 rounded-lg flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sky-300 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" /> Transpiración H₂O
            </span>
            <span className="text-[9px] bg-sky-950/80 text-sky-400 px-1 rounded border border-sky-900">
              Latente
            </span>
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-sky-400">
              {isStreetScale ? liveAbsorptionMetrics.streetTranspirationLitersDay.toLocaleString() : (liveAbsorptionMetrics.streetTranspirationLitersDay / liveAbsorptionMetrics.treeCount).toFixed(1)} <span className="text-xs font-sans text-slate-400">L/día</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Potencia Térmica: <strong className="text-sky-300">{liveAbsorptionMetrics.streetBioclimaticCoolingKW} kW</strong>
            </div>
          </div>
          <div className="text-[10px] text-sky-300 border-t border-slate-800 pt-1 flex items-center justify-between">
            <span>Conductancia gsw:</span>
            <strong className="font-mono">{liveAbsorptionMetrics.gswMmolM2s} mmol/m²s</strong>
          </div>
        </div>

        {/* Tarjeta 5: Emisión de BVOCs vs Retención Neta */}
        <div className="bg-slate-900/90 border border-emerald-950/80 p-2.5 rounded-lg flex flex-col justify-between space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Score Mitigación
            </span>
            <span className="text-[9px] bg-emerald-950/80 text-emerald-400 px-1 rounded border border-emerald-900">
              Neto
            </span>
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-emerald-400">
              {liveAbsorptionMetrics.netPollutantMitigationScore} <span className="text-xs font-sans text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              BVOCs: <strong className="text-amber-300">{liveAbsorptionMetrics.bvocNetEmissionGramsHour} g/h</strong>
            </div>
          </div>
          <div className="text-[10px] text-emerald-300 border-t border-slate-800 pt-1 flex items-center justify-between">
            <span>Apertura Estomática:</span>
            <strong className="font-mono text-cyan-300">{liveAbsorptionMetrics.stomataAperturePct}%</strong>
          </div>
        </div>

      </div>

      {/* 3. VISTA PRINCIPAL SEGÚN MODO SELECCIONADO */}
      {viewMode === 'physiology_diagram' ? (
        <div className="bg-slate-900/40 rounded-lg">
          <TreePhysiologyStomataDiagram
            currentTempC={liveAbsorptionMetrics.liveTempC}
            currentRhPct={liveAbsorptionMetrics.liveRhPct}
            currentParWm2={liveAbsorptionMetrics.liveParWm2}
            currentNO2Ugm3={liveAbsorptionMetrics.liveNO2Ugm3}
            currentO3Ugm3={liveAbsorptionMetrics.liveO3Ugm3}
            currentPM25Ugm3={liveAbsorptionMetrics.livePM25Ugm3}
            speciesName={`${selectedSpecies.commonName} (${selectedSpecies.scientificName})`}
            isTerralActive={liveAbsorptionMetrics.isTerralActive}
            vpdKpa={liveAbsorptionMetrics.vpdKpa}
            abaHormoneSignalPct={liveAbsorptionMetrics.abaHormoneSignalPct}
            apoplasticAscorbateSaturationPct={liveAbsorptionMetrics.apoplasticAscorbateSaturationPct}
            ozoneOxidativeStressIndex={liveAbsorptionMetrics.ozoneOxidativeStressIndex}
          />
        </div>
      ) : (
        /* VISTA RANKING COMPARATIVO DE TODAS LAS CALLES DE MÁLAGA */
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Auditoría Comparativa de Absorción en Vivo: 25 Avenidas y Calles de Málaga
              </h4>
              <p className="text-[11px] text-slate-400">
                Cálculo simultáneo bajo las condiciones meteorológicas y de calidad del aire actuales de Málaga.
              </p>
            </div>

            {/* Buscador y filtro por distrito */}
            <div className="flex items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar calle o especie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 pl-7 pr-2 py-1.5 rounded text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {districtsList.map(d => (
                  <option key={d} value={d} className="bg-slate-950">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Ranking */}
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 font-mono">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Calle / Distrito</th>
                  <th className="p-2.5">Especie Predominante</th>
                  <th className="p-2.5 text-center">Nº Árboles</th>
                  <th className="p-2.5 text-center">LAI</th>
                  <th className="p-2.5 text-center">
                    <ScientificTooltip content="Índice OPALS de potencial alergénico (1=mínimo, 10=máximo)" position="bottom">
                      <span className="cursor-help">OPALS</span>
                    </ScientificTooltip>
                  </th>
                  <th className="p-2.5 text-right">NO₂ Absorbido (g/h)</th>
                  <th className="p-2.5 text-right">PM₂.₅ Retenido (g/h)</th>
                  <th className="p-2.5 text-right">Transpiración (L/día)</th>
                  <th className="p-2.5 text-center">Score Fitoquímico</th>
                  <th className="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {allStreetsRanking
                  .filter(item => {
                    const matchesText = item.street.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.street.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.street.predominantSpeciesName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesDistrict = selectedDistrict === 'TODOS' || item.street.district === selectedDistrict;
                    return matchesText && matchesDistrict;
                  })
                  .map((item, idx) => {
                    const isSelected = item.street.id === selectedStreetId;
                    return (
                      <tr 
                        key={item.street.id}
                        className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-emerald-950/30 font-semibold' : ''}`}
                      >
                        <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-200">{item.street.streetName}</div>
                          <span className="text-[10px] text-slate-400">{item.street.district}</span>
                        </td>
                        <td className="p-2.5 text-emerald-300 font-mono text-[10.5px]">
                          {item.species.commonName}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-cyan-300">
                          {item.street.totalTreeCount}
                        </td>
                        <td className="p-2.5 text-center font-mono text-amber-300">
                          {item.street.estimatedStreetLAI}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block border px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                            (item.species.opalsIndex ?? 3) <= 2 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80' :
                            (item.species.opalsIndex ?? 3) <= 4 ? 'bg-teal-950/80 text-teal-300 border-teal-700/80' :
                            (item.species.opalsIndex ?? 3) <= 6 ? 'bg-amber-950/80 text-amber-300 border-amber-700/80' :
                            'bg-rose-950/80 text-rose-300 border-rose-700/80'
                          }`}>
                            OPALS {item.species.opalsIndex ?? 3}/10
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-orange-400">
                          <div>{item.metrics.streetNO2AbsorptionGramsHour} g/h</div>
                          <span className="text-[9.5px] text-slate-500 font-normal">{item.metrics.streetNO2AbsorptionKgYear} kg/año</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-cyan-300">
                          <div>{item.metrics.streetPM25DepositionGramsHour} g/h</div>
                          <span className="text-[9.5px] text-slate-500 font-normal">{item.metrics.streetPM25DepositionKgYear} kg/año</span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-sky-300">
                          {item.metrics.streetTranspirationLitersDay.toLocaleString()} L
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            {item.metrics.netPollutantMitigationScore} / 100
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedStreetId(item.street.id);
                                setViewMode('physiology_diagram');
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              {isSelected ? 'Activa' : 'Examinar'}
                            </button>
                            <button
                              onClick={() => {
                                if (activeCtx?.syncActivePoint) {
                                  activeCtx.syncActivePoint(item.street.lat, item.street.lon, { name: item.street.streetName, fly: true });
                                }
                              }}
                              className="px-1.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-[10px] font-medium transition-colors flex items-center gap-1"
                              title="Centrar el Gemelo Digital en esta calle"
                            >
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span>Mapa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Resumen Totalizador */}
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Total Arbolado Visto: <strong className="text-slate-200">{totalMalagaTreesCount.toLocaleString()} árboles</strong></span>
              <span className="text-slate-400">Captura Global NO₂ en Vivo: <strong className="text-orange-400 font-mono">{totalMalagaLiveNO2AbsorptionGramsHour.toFixed(1)} g/h</strong></span>
              <span className="text-slate-400">Retención Global PM₂.₅ en Vivo: <strong className="text-cyan-400 font-mono">{totalMalagaLivePM25DepositionGramsHour.toFixed(1)} g/h</strong></span>
            </div>
            <span className="text-[10.5px] text-slate-400 font-mono">
              Basado en inventario WFS del Ayuntamiento de Málaga y modelos i-Tree / Wesely
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
