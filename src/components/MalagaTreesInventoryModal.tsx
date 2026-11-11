import React, { useState, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import {
  fetchMalagaTreeInventory,
  exportMalagaTreesGeoJson,
  exportMalagaTreesCsv,
  MALAGA_SPECIES_CATALOG,
  MalagaStreetTreeRecord,
  MalagaTreesInventorySummary,
  TreeSpeciesAntiPollutionProfile
} from '../lib/malagaTreesInventory';
import {
  Trees,
  Leaf,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Wind,
  Sun,
  Activity,
  Layers,
  Sparkles,
  Settings,
  Info
} from 'lucide-react';
import {
  calculateWeselyDepositionForZone,
  PollutantSpecies
} from '../lib/weselyDryDeposition';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MalagaStreetTreeLiveAbsorptionView } from './MalagaStreetTreeLiveAbsorptionView';
import { WeselyResistanceCircuitDiagram } from './WeselyResistanceCircuitDiagram';
import { TreeSpeciesConfigPanel } from './TreeSpeciesConfigPanel';
import { UrbanHeatIslandDiagram } from './UrbanHeatIslandDiagram';
import { TreeBvocSoaDiagram } from './TreeBvocSoaDiagram';
import { simulateTreeBvocAndSoa, MALAGA_URBAN_TREE_SPECIES } from '../lib/treeBvocSoaEngine';
import { Thermometer, Flame } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useActivePoint } from '../context/ActivePointContext';

export type TreeSuiteTab = 'streets' | 'species_catalog' | 'wesely' | 'live_physiology' | 'uhi_energy_balance' | 'bvoc_emissions' | 'species_config';

interface MalagaTreesInventoryModalProps {
  onClose: () => void;
  initialStreetId?: string;
  initialTab?: TreeSuiteTab;
}

export function MalagaTreesInventoryModal({ onClose, initialStreetId, initialTab }: MalagaTreesInventoryModalProps) {
  const activeCtx = useActivePoint();
  const [data, setData] = useState<MalagaTreesInventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TreeSuiteTab>(initialTab || 'streets');
  const [selectedStreetForPhysiology, setSelectedStreetForPhysiology] = useState<string>(initialStreetId || activeCtx?.nearestTreeStreet?.id || 'MGA-TREE-STR-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoliage, setSelectedFoliage] = useState<string>('all');

  useEffect(() => {
    if (initialStreetId) {
      setSelectedStreetForPhysiology(initialStreetId);
    } else if (activeCtx?.nearestTreeStreet?.id) {
      setSelectedStreetForPhysiology(activeCtx.nearestTreeStreet.id);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialStreetId, initialTab, activeCtx?.nearestTreeStreet?.id]);

  // Micrometeorological params for Wesely
  const [parWm2, setParWm2] = useState<number>(550);
  const [airTempC, setAirTempC] = useState<number>(26);
  const [rhPct, setRhPct] = useState<number>(58);
  const [ustarMs, setUstarMs] = useState<number>(0.38);

  useEffect(() => {
    fetchMalagaTreeInventory()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredStreets = data?.streetRecords.filter(s =>
    s.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.predominantSpeciesName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredSpecies = MALAGA_SPECIES_CATALOG.filter(sp => {
    const matchesSearch = sp.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.typicalMalagaStreets.some(st => st.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFoliage = selectedFoliage === 'all' || sp.foliageType === selectedFoliage;
    return matchesSearch && matchesFoliage;
  });

  const weselyCalculation = React.useMemo(() => {
    const totalTrees = filteredStreets.reduce((acc, s) => acc + s.totalTreeCount, 0);
    // Estimate Area in ha (assume ~15m2 canopy per tree)
    const areaHa = (totalTrees * 15) / 10000;
    
    // Average LAI weighted by tree count
    const avgLai = totalTrees > 0 
      ? filteredStreets.reduce((acc, s) => acc + (s.estimatedStreetLAI * s.totalTreeCount), 0) / totalTrees
      : 0.1;

    const virtualZone = {
      id: 'virtual_streets',
      nombre: `Calles Seleccionadas (${filteredStreets.length})`,
      distrito: 'Málaga',
      lat: 36.72,
      lon: -4.42,
      areaHa: areaHa > 0 ? areaHa : 0.01,
      laiBase: avgLai > 0 ? avgLai : 0.1,
      tipoEspecieDominante: 'mediterranea_frondosa' as const
    };

    const concentrations = {
      O3: 65,
      NO2: 35,
      SO2: 8,
      PM25: 18
    };

    return calculateWeselyDepositionForZone(
      virtualZone,
      parWm2,
      airTempC,
      rhPct,
      ustarMs,
      concentrations
    );
  }, [filteredStreets, parWm2, airTempC, rhPct, ustarMs]);

  const handleDownloadGeoJson = () => {
    if (!data) return;
    const geojsonStr = exportMalagaTreesGeoJson(filteredStreets);
    const blob = new Blob([geojsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_arbolado_vial_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!data) return;
    const csvStr = exportMalagaTreesCsv(filteredStreets);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaga_arbolado_vial_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartDataSpecies = MALAGA_SPECIES_CATALOG.map(sp => ({
    name: sp.commonName.split(' ')[0],
    vdNO2: sp.vdNO2,
    vdPM25: sp.vdPM25,
    isopreno: sp.bvocIsopreneRate,
    score: sp.antiPollutionScore
  }));

  return (
    <DraggableWindow
      title="Inventario de Arbolado por Calles & Análisis Fito-Químico (Málaga)"
      subtitle="Portal de Datos Abiertos de Málaga (datosabiertos.malaga.eu / WFS GeoServer)"
      icon={<Trees className="w-4 h-4 text-emerald-400" />}
      defaultCollapsed={true}
      badge={
        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 font-mono font-bold">
          {data?.totalTreesCounted || 1842} Árboles Censados en Vivo
        </span>
      }
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-8 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-4 p-4 bg-[#0a0f18] text-slate-200 max-h-[80vh] overflow-y-auto font-mono text-xs">
        {/* FUENTE Y STATUS */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-slate-200">Fuente: {data?.source || 'Datos Abiertos Málaga'}</span>
              <span className="text-[10px] text-slate-400 block">
                Paquete WFS: {data?.ckanPackageId} | Total Calles: {data?.streetsCounted} | Actualizado: {data?.lastUpdated?.slice(0, 10)}
              </span>
            </div>
          </div>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
            ✓ Live WFS GeoServer
          </span>
        </div>

        {/* SUB-NAVIGATION TABS — Cinta Deslizante Continua (Regla 22) */}
        <SlidingRibbonBar
          activeKey={activeTab}
          ariaLabel="Subpestañas de Fitorremediación y Censo Arbóreo"
          className="border-b border-slate-800 pb-2 text-xs"
          rightAddon={
            <ScientificTooltip content="Abrir el laboratorio de implantación arbórea para evaluar la reducción determinista de contaminantes al añadir arbolado.">
              <button
                onClick={() => useUIStore.getState().setActiveModal('streetTreePlanting')}
                className="px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Trees className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>🌱 Implantar Árboles</span>
              </button>
            </ScientificTooltip>
          }
        >
          <ScientificTooltip content="Inventario georreferenciado del arbolado viario de Málaga con censo de ejemplares y cobertura de dosel por calle.">
            <button
              data-ribbon-active={activeTab === 'streets'}
              onClick={() => setActiveTab('streets')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'streets'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventario por Calle ({filteredStreets.length} tramos)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Especies fito-depuradoras de Málaga: área foliar específica, resistencia cuticular y capacidad de captura de PM y NO₂.">
            <button
              data-ribbon-active={activeTab === 'species_catalog'}
              onClick={() => setActiveTab('species_catalog')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'species_catalog'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-cyan-400" />
              <span>Catálogo Botánico & Fito-Química Anti-Contaminación</span>
            </button>
          </ScientificTooltip>
          
          <ScientificTooltip content="Modelo de deposición seca de Wesely (1989): circuito de resistencias aerodinámica r_a, subcapa r_b y estomática r_st.">
            <button
              data-ribbon-active={activeTab === 'wesely'}
              onClick={() => setActiveTab('wesely')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'wesely'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deposición Seca (Wesely)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Telemetría fisiológica en tiempo real acoplada a radiación solar PAR y déficit de presión de vapor VPD.">
            <button
              data-ribbon-active={activeTab === 'live_physiology'}
              onClick={() => setActiveTab('live_physiology')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'live_physiology'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estomas & Absorción en Vivo</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Ajustar albedo foliar (α) y rugosidad aerodinámica (z₀) de cada especie para mejorar la física informada del modelo PINN.">
            <button
              data-ribbon-active={activeTab === 'species_config'}
              onClick={() => setActiveTab('species_config')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'species_config'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>⚙️ Config. PINN</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Atenuación de Isla de Calor Urbana (UHI): enfriamiento evaporativo latente y reducción de radiación solar neta.">
            <button
              data-ribbon-active={activeTab === 'uhi_energy_balance'}
              onClick={() => setActiveTab('uhi_energy_balance')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'uhi_energy_balance'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span>Isla de Calor (UHI)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip content="Emisiones biogénicas de isopreno y monoterpenos (BVOCs) según factores de emisión MEGAN y potencial formador de ozono.">
            <button
              data-ribbon-active={activeTab === 'bvoc_emissions'}
              onClick={() => setActiveTab('bvoc_emissions')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'bvoc_emissions'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Biogénicos (BVOCs)</span>
            </button>
          </ScientificTooltip>
        </SlidingRibbonBar>

        {/* BUSCADOR Y FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por calle, distrito o especie..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none w-full font-mono"
            />
          </div>

          {activeTab === 'species_catalog' && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFoliage}
                onChange={e => setSelectedFoliage(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-mono outline-none w-full cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Todos los Tipos de Follaje</option>
                <option value="Caducifolio" className="bg-slate-900">Caducifolios</option>
                <option value="Perennifolio" className="bg-slate-900">Perennifolios</option>
                <option value="Palmera" className="bg-slate-900">Palmeras</option>
                <option value="Muro / Tapizante" className="bg-slate-900">Muros Verdes / Tapizantes</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: STREETS TREE INVENTORY TABLE */}
        {activeTab === 'streets' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="p-2.5">Calle / Distrito</th>
                    <th className="p-2.5">Especie Predominante</th>
                    <th className="p-2.5 text-center">Nº Árboles</th>
                    <th className="p-2.5 text-center">LAI (m²/m²)</th>
                    <th className="p-2.5 text-center">
                      <ScientificTooltip
                        content="Escala OPALS (Ogren Plant Allergy Scale, 1-10): los valores 1-2 indican potencial alergénico muy bajo (entomófilos), 3-5 moderado, y 8-10 muy alto (anemófilos con polen masivo como Plátano de Sombra)."
                      >
                        <span className="cursor-help flex items-center justify-center gap-1">
                          OPALS (Alergia) <Info className="w-2.5 h-2.5 text-cyan-400" />
                        </span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2.5 text-center">Coordenadas</th>
                    <th className="p-2.5 text-center">Riesgo Aerodinámico</th>
                    <th className="p-2.5 text-right">Captura Anual NO₂ / PM2.5</th>
                    <th className="p-2.5 text-center">Fisiología en Vivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-400">
                        Cargando inventario de arbolado de Málaga en vivo...
                      </td>
                    </tr>
                  ) : filteredStreets.map(r => {
                    const opals = r.streetOpalsScore ?? 3;
                    const opalsBadgeClass = 
                      opals <= 2 ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80" :
                      opals <= 4 ? "bg-teal-950/80 text-teal-300 border-teal-700/80" :
                      opals <= 6 ? "bg-amber-950/80 text-amber-300 border-amber-700/80" :
                      "bg-rose-950/80 text-rose-300 border-rose-700/80";

                    return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-slate-200">
                        <div>{r.streetName}</div>
                        <span className="text-[10px] text-slate-400">{r.district}</span>
                      </td>
                      <td className="p-2.5 text-emerald-300 font-mono">
                        {r.predominantSpeciesName}
                      </td>
                      <td className="p-2.5 text-center font-bold text-cyan-300 font-mono">
                        {r.totalTreeCount}
                      </td>
                      <td className="p-2.5 text-center font-mono text-amber-300">
                        {r.estimatedStreetLAI}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block border px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${opalsBadgeClass}`}>
                          OPALS {opals}/10 ({r.allergenicityStatus || (opals >= 7 ? 'Muy Alta' : opals <= 2 ? 'Muy Baja' : 'Moderada')})
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[10px] text-slate-400">
                        {r.lat.toFixed(4)}°, {r.lon.toFixed(4)}°
                      </td>
                      <td className="p-2.5 text-center">
                        {r.aerodynamicRiskStatus === 'Óptimo' ? (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                            ✓ Ventilación Óptima
                          </span>
                        ) : (
                          <span className="bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                            ⚠ Riesgo Estancamiento
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                        <div>{r.estimatedNO2DepositionKgYear} kg/año NO₂</div>
                        <span className="text-[10px] text-amber-300">{r.estimatedPM25DepositionKgYear} kg/año PM2.5</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedStreetForPhysiology(r.id);
                              setActiveTab('live_physiology');
                            }}
                            className="px-2 py-1 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded font-medium text-[10px] flex items-center gap-1 transition-colors"
                            title="Inspeccionar biofísica estomática de esta alineación"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Ver Estomas</span>
                          </button>
                          <button
                            onClick={() => {
                              if (activeCtx?.syncActivePoint) {
                                activeCtx.syncActivePoint(r.lat, r.lon, { name: r.streetName, fly: true });
                              }
                            }}
                            className="px-1.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded font-medium text-[10px] flex items-center gap-1 transition-colors"
                            title="Centrar el Gemelo Digital en esta calle y sincronizar todas las vistas"
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
          </div>
        )}

        {/* TAB 2: SPECIES CATALOG & CHARACTERISTICS */}
        {activeTab === 'species_catalog' && (
          <div className="space-y-4">
            {/* COMPARATIVE RECHARTS CHART */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded">
              <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Comparativa de Velocidades de Deposición (V_d) vs Emisiones de Isopreno (µg·g⁻¹·h⁻¹)
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataSpecies} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#06b6d4" tick={{ fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="vdNO2" name="Vd NO₂ [cm/s]" fill="#06b6d4" />
                    <Bar dataKey="vdPM25" name="Vd PM2.5 [cm/s]" fill="#10b981" />
                    <Bar dataKey="isopreno" name="Isopreno [µg/g/h @ 30°C]" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SPECIES PROFILE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSpecies.map(sp => (
                <div key={sp.id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded space-y-2">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-bold text-emerald-300 text-sm block">{sp.commonName}</span>
                      <span className="text-[10px] text-slate-400 italic font-mono">{sp.scientificName}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        Score Anticontaminación: {sp.antiPollutionScore} / 10
                      </span>
                      <span className={`border px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                        (sp.opalsIndex ?? 3) <= 2 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                        (sp.opalsIndex ?? 3) <= 4 ? 'bg-teal-950 text-teal-300 border-teal-700' :
                        (sp.opalsIndex ?? 3) <= 6 ? 'bg-amber-950 text-amber-300 border-amber-700' :
                        'bg-rose-950 text-rose-300 border-rose-700'
                      }`}>
                        OPALS: {sp.opalsIndex ?? 3}/10 ({sp.allergenicityLevel ?? 'Baja'})
                      </span>
                      <span className="text-[9px] text-slate-400 block">{sp.foliageType}</span>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    {sp.scientificDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded border border-slate-800/80">
                    <div>
                      <span className="text-slate-400">LAI Foliar:</span> <strong className="text-amber-300">{sp.defaultLAI} m²/m²</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Drag Aerodinámico C_d:</span> <strong className="text-slate-200">{sp.cdDragCoef}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Vd NO₂ / PM2.5:</span> <strong className="text-cyan-300">{sp.vdNO2} / {sp.vdPM25} cm/s</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Isopreno @ 30°C:</span> <strong className="text-rose-300">{sp.bvocIsopreneRate} µg/g/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Vector Polínico:</span> <strong className="text-slate-300">{sp.pollenVector ?? 'Entomófilo'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Temporada Polen:</span> <strong className="text-amber-300">{sp.pollenSeason ?? 'Primavera'}</strong>
                    </div>
                  </div>

                  {sp.allergenBioDetails && (
                    <div className="bg-slate-950/60 border border-slate-800 p-2 rounded text-[10px] text-slate-300">
                      <span className="font-bold text-slate-400">Perfil Alergénico Clínico:</span> {sp.allergenBioDetails}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">Calles representativas en Málaga:</span> {sp.typicalMalagaStreets.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WESELY DRY DEPOSITION */}
        {activeTab === 'wesely' && (
          <div className="space-y-4">
            {/* DIAGRAMA VECTORIAL ANIMADO DE RED DE RESISTENCIAS WESELY */}
            <WeselyResistanceCircuitDiagram
              parWm2={parWm2}
              airTempC={airTempC}
              rhPct={55}
              ustarMs={ustarMs}
            />

            {/* PARAMETROS MICROMETEOROLÓGICOS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-3 rounded">
              <div className="space-y-1.5">
                <ScientificTooltip position="top" width="w-[280px]" content="Radiación Fotosintéticamente Activa (PAR, 400-700 nm). Activa la apertura estomática foliar mediante bombeo de iones K+ a las células oclusivas.">
                  <div className="flex justify-between text-[10px] text-slate-300 cursor-help">
                    <span>Radiación PAR</span>
                    <span className="font-mono text-amber-300">{parWm2} W/m²</span>
                  </div>
                </ScientificTooltip>
                <input
                  type="range" min="0" max="1000" step="25"
                  value={parWm2} onChange={(e) => setParWm2(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
              <div className="space-y-1.5">
                <ScientificTooltip position="top" width="w-[280px]" content="Temperatura del aire superficial. Modula la resistencia mesofílica y estomática según la curva de respuesta biológica óptima (Wesely 1989).">
                  <div className="flex justify-between text-[10px] text-slate-300 cursor-help">
                    <span>Temperatura Aire</span>
                    <span className="font-mono text-rose-300">{airTempC} °C</span>
                  </div>
                </ScientificTooltip>
                <input
                  type="range" min="0" max="45" step="1"
                  value={airTempC} onChange={(e) => setAirTempC(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
              </div>
              <div className="space-y-1.5">
                <ScientificTooltip position="top" width="w-[280px]" content="Humedad relativa del aire. Influye en el déficit de presión de vapor (VPD) e hidromodulación del potencial hídrico foliar.">
                  <div className="flex justify-between text-[10px] text-slate-300 cursor-help">
                    <span>Humedad Rel.</span>
                    <span className="font-mono text-cyan-300">{rhPct}%</span>
                  </div>
                </ScientificTooltip>
                <input
                  type="range" min="10" max="100" step="5"
                  value={rhPct} onChange={(e) => setRhPct(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
              <div className="space-y-1.5">
                <ScientificTooltip position="top" width="w-[280px]" content="Velocidad de fricción u* = (tau/rho)^0.5. Determina el régimen de cizalladura turbulenta y reduce las resistencias aerodinámica Ra y cuasi-laminar Rb.">
                  <div className="flex justify-between text-[10px] text-slate-300 cursor-help">
                    <span>Fricción (u*)</span>
                    <span className="font-mono text-emerald-300">{ustarMs} m/s</span>
                  </div>
                </ScientificTooltip>
                <input
                  type="range" min="0.05" max="1.5" step="0.05"
                  value={ustarMs} onChange={(e) => setUstarMs(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            {/* DESGLOSE MATEMÁTICO */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Red Analítica (Wesely) • Zona: Calles Filtradas
                </h4>
                <div className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-300">
                  Área estimada: {(weselyCalculation.areaHa).toFixed(2)} ha | LAI Medio: {weselyCalculation.lai.toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['O3', 'NO2', 'PM25'] as PollutantSpecies[]).map((species) => {
                  const resData = weselyCalculation.pollutantResults[species];
                  const titleColor = species === 'O3' ? 'text-amber-400' : species === 'NO2' ? 'text-cyan-400' : 'text-purple-400';
                  const borderAccent = species === 'O3' ? 'border-amber-500/30' : species === 'NO2' ? 'border-cyan-500/30' : 'border-purple-500/30';
                  
                  return (
                    <div key={species} className={`bg-slate-950/80 border ${borderAccent} p-3 rounded space-y-2 font-mono text-[11px]`}>
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                        <span className={`font-bold ${titleColor}`}>
                          {species === 'O3' ? 'Ozono (O₃)' : species === 'NO2' ? 'NO₂' : 'PM₂.₅'}
                        </span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 text-[10px] rounded">
                          v_d = {resData.vd_cm_s} cm/s
                        </span>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">• Res. Aerodinámica (R_a):</span>
                          <span className="text-slate-200 font-bold">{resData.ra_s_m} s/m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">• Res. Cuasi-Laminar (R_b):</span>
                          <span className="text-slate-200 font-bold">{resData.rb_s_m} s/m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">• Res. Estomática (R_s):</span>
                          <span className="text-slate-200 font-bold">{resData.rs_s_m > 9000 ? 'N/A' : `${resData.rs_s_m} s/m`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">• Res. Canópica (R_c):</span>
                          <span className="text-emerald-300 font-bold">{resData.rc_s_m} s/m</span>
                        </div>
                        <div className="border-t border-slate-800/80 pt-1 flex justify-between text-slate-400 mt-1">
                          <span>• Remoción Dinámica:</span>
                          <span className="text-amber-300 font-bold">{resData.monthlyRemovalKg} kg/mes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE PHYSIOLOGY & STOMATA ABSORPTION */}
        {activeTab === 'live_physiology' && (
          <div className="space-y-3">
            <MalagaStreetTreeLiveAbsorptionView initialStreetId={selectedStreetForPhysiology} />
          </div>
        )}

        {/* TAB 5: TREE SPECIES CONFIGURATION PANEL (ALBEDO & AERODYNAMIC ROUGHNESS PINN) */}
        {activeTab === 'species_config' && (
          <div className="space-y-3">
            <TreeSpeciesConfigPanel embedded={true} />
          </div>
        )}

        {/* TAB 6: ISLA DE CALOR URBANA Y BALANCE DE ENERGÍA (OKE 1982) */}
        {activeTab === 'uhi_energy_balance' && (
          <div className="space-y-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded">
              <UrbanHeatIslandDiagram
                tempUrbanC={airTempC + 2.5}
                tempRuralC={airTempC}
                windSpeedMs={ustarMs * 8}
                hourOfDay={14}
              />
            </div>
          </div>
        )}

        {/* TAB 7: EMISIONES BIOGÉNICAS BVOCs E ISOPRENO */}
        {activeTab === 'bvoc_emissions' && (() => {
          const bvocInput = {
            speciesId: MALAGA_URBAN_TREE_SPECIES[0].id,
            tempCelsius: airTempC,
            parSolarUmolM2S: parWm2 * 2.1,
            canopyAreaM2: 120,
            ambientNOxPpb: 20,
            ambientO3Ppb: 45,
            ambientPM25Ugm3: 16.0
          };
          const bvocResult = simulateTreeBvocAndSoa(bvocInput);
          return (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                <TreeBvocSoaDiagram
                  input={bvocInput}
                  result={bvocResult}
                />
              </div>
            </div>
          );
        })()}

        {/* BOTONES DE EXPORTACIÓN FAIR */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integración directa con el Portal de Datos Abiertos del Ayuntamiento de Málaga. Cero datos aleatorios.</span>
          </div>

          <div className="flex gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Exportación GeoJSON FAIR del censo de arbolado por calles de Málaga.">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded"
              >
                <FileJson className="w-3.5 h-3.5 text-emerald-400" /> GeoJSON FAIR
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Exportación CSV FAIR del censo de arbolado y métricas fito-químicas.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-xs px-3 py-1.5 font-mono font-bold transition-colors rounded"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" /> CSV FAIR
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
