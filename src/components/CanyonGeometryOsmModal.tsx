import React, { useState, useMemo } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  MALAGA_STREET_CANYONS_GEOMETRY,
  calculateStreetVortexDynamics,
  exportCanyonGeometryGeoJson,
  exportCanyonGeometryCsv,
  exportCanyonOkeLatex,
  StreetCanyonGeometryProfile
} from '../lib/canyonGeometryOsm';
import { useActivePoint } from '../context/ActivePointContext';
import {
  Building2,
  Wind,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  RotateCw,
  Compass,
  Sliders,
  Search,
  Filter,
  Layers,
  Activity,
  ArrowUpDown,
  BookOpen,
  Info
} from 'lucide-react';
import { CanyonOkeFlowRegimeDiagram } from './CanyonOkeFlowRegimeDiagram';

interface CanyonGeometryOsmModalProps {
  onClose: () => void;
}

export function CanyonGeometryOsmModal({ onClose }: CanyonGeometryOsmModalProps) {
  const activeCtx = useActivePoint();
  const [canyons] = useState<StreetCanyonGeometryProfile[]>(MALAGA_STREET_CANYONS_GEOMETRY);
  const [activeTab, setActiveTab] = useState<'visual' | 'catalog' | 'model' | 'theory'>('visual');
  
  // Custom calculator state initialized from active point
  const activeH = activeCtx?.activePoint?.H ?? 22.5;
  const activeW = activeCtx?.activePoint?.W ?? 11.2;
  const activeU = activeCtx?.assimilation?.windSpeedKmh ? activeCtx.assimilation.windSpeedKmh / 3.6 : 3.5;
  const activeStreet = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Calle Marqués de Larios';

  const [customH, setCustomH] = useState<number>(activeH);
  const [customW, setCustomW] = useState<number>(activeW);
  const [uRoof, setURoof] = useState<number>(activeU);
  const [windAngleRel, setWindAngleRel] = useState<number>(90); // 90° = perpendicular
  const [selectedStreetName, setSelectedStreetName] = useState<string>(activeStreet);

  // Filter & Search state for catalog
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regimeFilter, setRegimeFilter] = useState<'ALL' | 'SKIMMING' | 'WAKE' | 'ISOLATED'>('ALL');
  const [sortField, setSortField] = useState<'aspectRatioHW' | 'airResidenceTimeSec' | 'airChangesPerHourACH' | 'leewardToWindwardPollutantRatio'>('aspectRatioHW');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const customDynamics = useMemo(() => {
    return calculateStreetVortexDynamics(customH, customW, uRoof, windAngleRel);
  }, [customH, customW, uRoof, windAngleRel]);

  const handleSelectStreetInVisual = (streetName: string) => {
    const c = canyons.find(st => st.streetName === streetName);
    if (c) {
      setCustomH(c.avgBuildingHeightM);
      setCustomW(c.streetWidthM);
      setSelectedStreetName(streetName);
    }
  };

  const filteredCanyons = useMemo(() => {
    return canyons
      .filter(c => {
        const matchesQuery = c.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.district.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
        if (regimeFilter === 'SKIMMING') return c.regimeCode === 'SKIMMING_FLOW';
        if (regimeFilter === 'WAKE') return c.regimeCode === 'WAKE_INTERFERENCE';
        if (regimeFilter === 'ISOLATED') return c.regimeCode === 'ISOLATED_ROUGHNESS';
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [canyons, searchQuery, regimeFilter, sortField, sortAsc]);

  const handleDownloadGeoJson = () => {
    const str = exportCanyonGeometryGeoJson(canyons);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canyons_geometry_malaga_oke_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const str = exportCanyonGeometryCsv(canyons);
    const blob = new Blob([str], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canyons_geometry_malaga_oke_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLatex = () => {
    const str = exportCanyonOkeLatex(canyons);
    const blob = new Blob([str], { type: 'application/x-latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canyons_oke_regime_tesis_malaga_${new Date().toISOString().slice(0, 10)}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      windowId="canyonGeometryOsm"
      title="Hidrodinámica de Cañón Urbano & Clasificación de Oke (1987)"
      subtitle="Relación de Aspecto H/W, Dinámica del Vórtice de Cavidad, Tasa de Ventilación y Asimetría Peatonal"
      icon={<Building2 className="w-4 h-4 text-amber-400" />}
      badge={
        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.5 font-mono font-bold">
          📍 {selectedStreetName} • H/W: {(customH / Math.max(1, customW)).toFixed(2)}
        </span>
      }
      onClose={onClose}
      headerColorClass="text-amber-400"
      borderColorClass="border-slate-700"
      className="w-full max-w-5xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3 p-4 bg-[#0a0f18] text-slate-200 max-h-[82vh] overflow-y-auto font-mono text-xs">
        {/* TAB BAR NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <ScientificTooltip
              title="Regímenes de Flujo de Oke (1987)"
              content="Clasificación aerodinámica de vórtices según la relación H/W y L/W: Isolated Roughness (H/W < 0.3), Wake Interference (0.3 ≤ H/W < 0.65) y Skimming Flow (H/W ≥ 0.65)."
              citation="Oke, T.R. (1987) Boundary Layer Climates"
            >
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" /> Régimen de Oke & Vórtice 2D
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Topología Urbana 3D OSM de Málaga"
              content="Inventario exhaustivo de 16 cañones urbanos representativos de Málaga con geometría extraída de OpenStreetMap y modelos digitales de elevación Copernicus."
              citation="OpenStreetMap 3D / Copernicus DEM"
            >
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Catálogo Cañones Málaga ({canyons.length})
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Modelo Analítico de Ventilación Urbana"
              content="Cálculo del tiempo de residencia τ = V / Q_exch, renovaciones por hora (ACH) y transferencia de masa turbulenta a través del plano del tejado."
              citation="Salizzoni et al. (2009) / Soulhac et al. (2011)"
            >
              <button
                onClick={() => setActiveTab('model')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'model'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Modelo Analítico & Ventilación
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Marco Teórico y Formulación para la Tesis"
              content="Bases epistemológicas, formulación matemática de Navier-Stokes en microescala urbana y justificación doctoral ante el tribunal EIDUNED."
              citation="Directiva 2008/50/CE / EIDUNED"
            >
              <button
                onClick={() => setActiveTab('theory')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'theory'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Marco Teórico Tesis
              </button>
            </ScientificTooltip>
          </div>

          <div className="text-[10px] text-slate-400 hidden sm:block">
            Calle activa: <strong className="text-amber-300">{selectedStreetName}</strong>
          </div>
        </div>

        {/* TAB 1: VISUAL REGIME & VORTEX DIAGRAM */}
        {activeTab === 'visual' && (
          <div className="space-y-3">
            <CanyonOkeFlowRegimeDiagram
              initialH={customH}
              initialW={customW}
              initialUroof={uRoof}
              onSelectStreet={handleSelectStreetInVisual}
            />

            {/* SUMMARY STATS STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded text-[10.5px]">
              <ScientificTooltip
                title="Régimen Aerodinámico Clasificado"
                content="Identifica el patrón de circulación del fluido según el criterio de Oke (1987) para el cañón seleccionado."
                citation="Oke (1987)"
              >
                <div className="cursor-help">
                  <span className="text-slate-400 block text-[9px]">Régimen Clasificado:</span>
                  <strong className={customDynamics.regimeCode === 'SKIMMING_FLOW' ? 'text-rose-400' : customDynamics.regimeCode === 'WAKE_INTERFERENCE' ? 'text-amber-400' : 'text-emerald-400'}>
                    {customDynamics.regimeLabel.split('(')[0]}
                  </strong>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                title="Tiempo de Residencia del Aire (τ)"
                content="Tiempo promedio que una masa de aire o contaminante primario permanece dentro del volumen del cañón antes de ser ventilado hacia la capa límite superficial."
                citation="Salizzoni et al. (2009)"
              >
                <div className="cursor-help">
                  <span className="text-slate-400 block text-[9px]">Tiempo Residencia Aire:</span>
                  <strong className="text-amber-300">{customDynamics.tauResSec} s</strong> ({customDynamics.tauResMin} min)
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                title="Renovaciones de Aire por Hora (ACH)"
                content="Tasa de intercambio volumétrico de aire por convección forzada y turbulenta a través de la interfaz del tejado (Canyon Roof Level)."
                citation="Soulhac et al. (2011)"
              >
                <div className="cursor-help">
                  <span className="text-slate-400 block text-[9px]">Renovaciones de Aire:</span>
                  <strong className="text-emerald-300">{customDynamics.achPerHour} ACH</strong>
                </div>
              </ScientificTooltip>

              <ScientificTooltip
                title="Razón de Asimetría Sotavento / Barlovento"
                content="Factor de concentración diferencial debido al vórtice rasante atrapado, que acumula contaminantes en la acera de sotavento frente a la de barlovento."
                citation="Vardoulakis et al. (2003)"
              >
                <div className="cursor-help">
                  <span className="text-slate-400 block text-[9px]">Asimetría Sotavento/Barlovento:</span>
                  <strong className="text-rose-300">{customDynamics.ratioLeeward}x C_wind</strong>
                </div>
              </ScientificTooltip>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG OF MALAGA STREET CANYONS */}
        {activeTab === 'catalog' && (
          <div className="space-y-3">
            {/* Search, Filter & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar calle o distrito en Málaga..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 w-full focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Regime Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10px] mr-1">Régimen:</span>
                <ScientificTooltip content="Mostrar todos los cañones urbanos catalogados en la malla de Málaga sin filtrar por régimen.">
                  <button
                    onClick={() => setRegimeFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'ALL' ? 'bg-amber-500/30 text-amber-300 border border-amber-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Todos ({canyons.length})
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Régimen rasante (Skimming Flow, H/W ≥ 0.65, Oke 1987): vórtice confinado con acumulación crítica en sotavento.">
                  <button
                    onClick={() => setRegimeFilter('SKIMMING')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'SKIMMING' ? 'bg-rose-950 text-rose-300 border border-rose-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Skimming
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Régimen de estelas (Wake Interference Flow, 0.3 ≤ H/W < 0.65, Oke 1987): interacción turbulenta entre edificios.">
                  <button
                    onClick={() => setRegimeFilter('WAKE')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'WAKE' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Estelas
                  </button>
                </ScientificTooltip>
                <ScientificTooltip content="Régimen de rugosidad aislada (Isolated Roughness Flow, H/W < 0.3, Oke 1987): ventilación abierta sin vórtice estacionario.">
                  <button
                    onClick={() => setRegimeFilter('ISOLATED')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'ISOLATED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Aislado
                  </button>
                </ScientificTooltip>
              </div>

              {/* Sort field */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10px]">Ordenar:</span>
                <select
                  value={sortField}
                  onChange={e => setSortField(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-200"
                >
                  <option value="aspectRatioHW">Relación H/W</option>
                  <option value="airResidenceTimeSec">Tiempo Residencia (τ_res)</option>
                  <option value="airChangesPerHourACH">Renovación (ACH)</option>
                  <option value="leewardToWindwardPollutantRatio">Asimetría Sotavento</option>
                </select>
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="p-1 bg-slate-950 border border-slate-700 rounded text-slate-300 hover:text-white"
                  title="Cambiar orden"
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Table of Canyons */}
            <div className="bg-slate-900/90 border border-slate-800 rounded overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 font-mono">
                    <th className="p-2.5">Calle / Distrito</th>
                    <th className="p-2.5 text-center">H / W (m)</th>
                    <th className="p-2.5 text-center">Relación H/W</th>
                    <th className="p-2.5 text-center">Régimen de Oke</th>
                    <th className="p-2.5 text-center">τ_res (s)</th>
                    <th className="p-2.5 text-center">ACH (h⁻¹)</th>
                    <th className="p-2.5 text-center">Asimetría C_lee</th>
                    <th className="p-2.5 text-center">Ventilabilidad</th>
                    <th className="p-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[10.5px]">
                  {filteredCanyons.map(c => (
                    <tr key={c.streetId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{c.streetName}</span>
                          <span className="text-[9px] text-slate-400 font-normal">({c.district})</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal font-sans line-clamp-1">
                          {c.criticalHotspotNote}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono text-slate-300">
                        {c.avgBuildingHeightM}m / {c.streetWidthM}m
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-amber-300">
                        {c.aspectRatioHW}
                      </td>
                      <td className="p-2 text-center">
                        {c.regimeCode === 'SKIMMING_FLOW' ? (
                          <span className="bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Skimming
                          </span>
                        ) : c.regimeCode === 'WAKE_INTERFERENCE' ? (
                          <span className="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Estela
                          </span>
                        ) : (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Aislado
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono text-amber-300 font-bold">
                        {c.airResidenceTimeSec} s
                      </td>
                      <td className="p-2 text-center font-mono text-emerald-300 font-bold">
                        {c.airChangesPerHourACH}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-rose-300">
                        {c.leewardToWindwardPollutantRatio}x
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-cyan-300">
                        {c.ventilationCapacityScore}/10
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => {
                            setCustomH(c.avgBuildingHeightM);
                            setCustomW(c.streetWidthM);
                            setSelectedStreetName(c.streetName);
                            setActiveTab('visual');
                          }}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded text-[9.5px] transition-colors"
                        >
                          Simular 2D
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DETAILED ANALYTICAL MODEL & FORMULAS */}
        {activeTab === 'model' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Left Column: Interactive Parametric Controls */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-md space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <Sliders className="w-3.5 h-3.5" /> Parámetros de Entrada del Cañón Urbano
                </h4>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Altura Media de Cornisa H:</span>
                    <strong className="text-amber-300 font-mono">{customH} m</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="0.5"
                    value={customH}
                    onChange={e => setCustomH(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Ancho entre Fachadas W:</span>
                    <strong className="text-cyan-300 font-mono">{customW} m</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="0.5"
                    value={customW}
                    onChange={e => setCustomW(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Velocidad del Viento en Cornisa U_roof:</span>
                    <strong className="text-emerald-300 font-mono">{uRoof} m/s</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={uRoof}
                    onChange={e => setURoof(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Ángulo Viento vs Eje de Calle θ:</span>
                    <strong className="text-purple-300 font-mono">{windAngleRel}° (90° = Perpendicular)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={windAngleRel}
                    onChange={e => setWindAngleRel(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Column: Mathematical Cascade of Results */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-md space-y-2 text-[11px]">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <Activity className="w-3.5 h-3.5" /> Cascada Hidrodinámica Calculada
                </h4>

                <div className="space-y-1.5 bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. Relación de Aspecto H/W:</span>
                    <span className="font-bold text-amber-300">{customDynamics.aspectRatioHW}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. Sky View Factor (SVF):</span>
                    <span className="font-bold text-slate-200">{customDynamics.skyViewFactorSVF}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. Viento Perpendicular U_perp:</span>
                    <span className="font-bold text-sky-300">{customDynamics.uPerpMs} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4. Turbulencia Vertical en Tejado σ_w:</span>
                    <span className="font-bold text-cyan-300">{customDynamics.sigmaWMs} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">5. Flujo Volumétrico Intercambio q_exch:</span>
                    <span className="font-bold text-emerald-300">{customDynamics.qExchM2s} m²/s·m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">6. Tiempo de Residencia del Aire τ_res:</span>
                    <span className="font-bold text-amber-400">{customDynamics.tauResSec} s ({customDynamics.tauResMin} min)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">7. Renovaciones Horarias (ACH):</span>
                    <span className="font-bold text-emerald-400">{customDynamics.achPerHour} h⁻¹</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">8. Velocidad del Vórtice V_vortex:</span>
                    <span className="font-bold text-sky-400">{customDynamics.vVortexMs} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">9. Asimetría Acera Sotavento/Barlovento:</span>
                    <span className="font-bold text-rose-400">{customDynamics.ratioLeeward}x</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                  <strong className="text-amber-400 block mb-0.5">Diagnóstico para la Calidad del Aire Peatonal:</strong>
                  {customDynamics.verdict}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCTORAL THESIS THEORETICAL FRAMEWORK */}
        {activeTab === 'theory' && (
          <div className="space-y-3 text-[11px] leading-relaxed text-slate-300 bg-slate-900/60 p-3.5 rounded border border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase border-b border-slate-800 pb-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" /> Fundamentación Micrometeorológica: Criterio de Oke (1987)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60">
                <strong className="text-emerald-300 block text-xs mb-1">1. Isolated Roughness Flow (H/W &lt; 0.30)</strong>
                <p className="text-[10px] text-slate-300">
                  La distancia entre edificios opuestos es muy amplia respecto a su altura. Las estelas generadas a sotavento no alcanzan la fachada de barlovento, permitiendo que la capa límite superficial penetre hasta la cota del asfalto. Dispersión gaussiana directa.
                </p>
              </div>

              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60">
                <strong className="text-amber-300 block text-xs mb-1">2. Wake Interference Flow (0.30 ≤ H/W &lt; 0.65)</strong>
                <p className="text-[10px] text-slate-300">
                  El espacio entre fachadas disminuye y la estela descendente choca contra la fachada del edificio opuesto antes de reorganizarse el flujo. Se intensifica la turbulencia mecánica intermedia sin formarse aún un vórtice cerrado estacionario.
                </p>
              </div>

              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60">
                <strong className="text-rose-300 block text-xs mb-1">3. Skimming Flow (H/W ≥ 0.65)</strong>
                <p className="text-[10px] text-slate-300">
                  El flujo superior sobrevuela las cornisas sin penetrar directamente en el cañón. Por cizalla viscosa y arrastre turbulento se genera un vórtice secundario cerrado en la cavidad. La acera de sotavento acumula hasta 3 o 4 veces más contaminantes que la de barlovento.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-[10.5px]">
              <div className="font-bold text-slate-200">Ecuaciones Canónicas Implementadas en el Gemelo Digital:</div>
              <div className="font-mono text-cyan-300">
                • Viento perpendicular: U_perp = U_roof · |sin(θ_wind - θ_street)|<br />
                • Fluctuación turbulenta (Yamartino & Wiegand): σ_w = 0.10 · U_perp + 0.15 [m/s]<br />
                • Tiempo de residencia: τ_res = H / σ_w [s] &nbsp;|&nbsp; Renovación: ACH = 3600 / τ_res [h⁻¹]<br />
                • Factor de asimetría de aceras: C_lee / C_wind = 1.0 + 1.35 · (H/W)¹·²⁵
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              <strong>Referencias Bibliográficas Clave:</strong>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                <li>Oke, T. R. (1987). <em>Boundary Layer Climates</em>. Routledge, London.</li>
                <li>Yamartino, R. J., & Wiegand, G. (1986). Development and evaluation of simple models for the flow, turbulence and pollutant concentration fields within an urban street canyon. <em>Atmospheric Environment</em>, 20(11), 2137-2156.</li>
                <li>Soulhac, L., Perkins, R. J., & Salizzoni, P. (2008). Flow in a street canyon for any outward wind direction. <em>Atmospheric Environment</em>, 42(1), 29-44.</li>
                <li>Vardoulakis, S., et al. (2003). Modelling air quality in street canyons: a review. <em>Atmospheric Environment</em>, 37(2), 155-182.</li>
              </ul>
            </div>
          </div>
        )}

        {/* BOTTOM EXPORT & ACTION BAR */}
        <div className="flex flex-wrap justify-between items-center border-t border-slate-800 pt-3 gap-2">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ciencia Abierta & Exportación FAIR: GeoJSON cartográfico, matriz CSV y memoria LaTeX citable.</span>
          </span>

          <div className="flex items-center gap-2">
            <ScientificTooltip content="Descargar deducción analítica de Navier-Stokes, regímenes de Oke y tablas geométricas en formato LaTeX compilable.">
              <button
                onClick={handleDownloadLatex}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-700 text-xs px-3 py-1.5 font-mono font-bold rounded transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" /> LaTeX (.tex)
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Descargar capa espacial georreferenciada GeoJSON con polígonos de canopia urbana y relaciones H/W.">
              <button
                onClick={handleDownloadGeoJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 font-mono font-bold rounded transition-colors cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-400" /> GeoJSON FAIR
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Descargar matriz tabular de cañones urbanos en formato CSV conforme a principios FAIR.">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 text-xs px-3 py-1.5 font-mono font-bold rounded transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" /> CSV FAIR
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
}
