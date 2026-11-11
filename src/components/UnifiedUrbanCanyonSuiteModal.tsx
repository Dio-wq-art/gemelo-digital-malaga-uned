import React, { useState, useMemo, useEffect } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SlidingRibbonBar, TableHorizontalScrollContainer } from './SlidingRibbonBar';
import {
  Building2,
  Wind,
  Layers,
  Activity,
  Maximize2,
  ShieldCheck,
  MapPin,
  Search,
  ArrowUpDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Compass,
  Sliders,
  RotateCw
} from 'lucide-react';
import { useActivePoint } from '../context/ActivePointContext';

// Subcomponents & Utilities
import { CanyonOkeFlowRegimeDiagram } from './CanyonOkeFlowRegimeDiagram';
import { StreetCanyonVerticalProfileModal } from './StreetCanyonVerticalProfileModal';
import { SolarShadingCanyonTab } from './SolarShadingCanyonTab';
import { GoogleStreetViewCanyonTab } from './GoogleStreetViewCanyonTab';
import { UrbanCanyonMitigationDiagramModal } from './UrbanCanyonMitigationDiagramModal';
import {
  MALAGA_STREET_CANYONS_GEOMETRY,
  calculateStreetVortexDynamics,
  exportCanyonGeometryGeoJson,
  exportCanyonGeometryCsv,
  exportCanyonOkeLatex,
  StreetCanyonGeometryProfile
} from '../lib/canyonGeometryOsm';
import { Sun, Leaf, Eye } from 'lucide-react';

export type CanyonSuiteTab = 'regimes' | 'catalog' | 'vertical_profile' | 'solar_shading' | 'mitigation' | 'street_view';

export interface UnifiedUrbanCanyonSuiteModalProps {
  onClose: () => void;
  defaultTab?: CanyonSuiteTab;
  data?: any;
  location?: { lat: number; lon: number };
  flyToLocation?: (lat: number, lon: number, zoom?: number, pitch?: number) => void;
  applyCameraPreset?: (preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => void;
}

export const UnifiedUrbanCanyonSuiteModal: React.FC<UnifiedUrbanCanyonSuiteModalProps> = ({
  onClose,
  defaultTab = 'regimes',
  data,
  location,
  flyToLocation,
  applyCameraPreset
}) => {
  const [activeTab, setActiveTab] = useState<CanyonSuiteTab>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const activePointCtx = useActivePoint();
  const activePoint = activePointCtx?.activePoint;
  const assimilation = activePointCtx?.assimilation;

  const [canyons] = useState<StreetCanyonGeometryProfile[]>(MALAGA_STREET_CANYONS_GEOMETRY);
  const [selectedCanyonIndex, setSelectedCanyonIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regimeFilter, setRegimeFilter] = useState<'ALL' | 'SKIMMING' | 'WAKE' | 'ISOLATED'>('ALL');
  const [sortField, setSortField] = useState<'aspectRatioHW' | 'airResidenceTimeSec' | 'airChangesPerHourACH' | 'leewardToWindwardPollutantRatio'>('aspectRatioHW');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Geometry parameters dynamically linked to ActivePointContext
  const buildingHeight = activePoint?.buildingHeightM ?? activePoint?.H ?? 18.5;
  const streetWidth = activePoint?.canyonWidthM ?? activePoint?.W ?? 14.8;
  const canyonAspect = activePoint?.aspectRatioHw ?? Number((buildingHeight / Math.max(3, streetWidth)).toFixed(2));
  const windSpeed = assimilation?.windSpeedMs ?? (data?.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : 3.2);

  const [customH, setCustomH] = useState<number>(buildingHeight);
  const [customW, setCustomW] = useState<number>(streetWidth);
  const [customU, setCustomU] = useState<number>(windSpeed);

  // Sincronización reactiva cuando el usuario selecciona cualquier calle o punto en el mapa
  useEffect(() => {
    if (!activePoint) return;
    const hVal = Number((activePoint.buildingHeightM ?? activePoint.H ?? 18.5).toFixed(1));
    const wVal = Number((activePoint.canyonWidthM ?? activePoint.W ?? 14.8).toFixed(1));
    const uVal = Number((assimilation?.windSpeedMs ?? windSpeed).toFixed(1));
    setCustomH(hVal);
    setCustomW(wVal);
    setCustomU(uVal);

    // Buscar si la calle activa coincide o está próxima a algún cañón del catálogo
    let bestIdx = 0;
    let minDist = Infinity;
    canyons.forEach((c, idx) => {
      if (activePoint.streetName && c.streetName.toLowerCase().includes(activePoint.streetName.toLowerCase())) {
        bestIdx = idx;
        minDist = -1;
      } else if (minDist >= 0) {
        const d = Math.hypot((c.lat || 36.72) - activePoint.lat, (c.lon || -4.42) - activePoint.lon);
        if (d < minDist) {
          minDist = d;
          bestIdx = idx;
        }
      }
    });
    setSelectedCanyonIndex(bestIdx);
  }, [activePoint, assimilation?.windSpeedMs, canyons, windSpeed]);

  const selectedCanyon = canyons[selectedCanyonIndex] || canyons[0];

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
      windowId="unifiedUrbanCanyonSuite"
      title="SUITE METODOLÓGICA DE CAÑONES URBANOS 3D & MICROFÍSICA (OKE 1987 / OSPM)"
      subtitle="Relación de Aspecto H/W, Dinámica del Vórtice Cavitario, Tasa de Ventilación ACH y Asimetría Peatonal"
      icon={<Building2 className="w-4 h-4 text-cyan-400" />}
      badge={
        <span className="text-[8.5px] bg-cyan-950 text-cyan-300 border border-cyan-600 px-1.5 py-0.2 font-mono font-bold">
          📍 {activePoint?.nearestStreetName || activePoint?.name || 'Málaga'} • H/W: {canyonAspect.toFixed(2)}
        </span>
      }
      onClose={onClose}
      className="w-[95vw] max-w-[1100px] max-h-[85vh]"
      defaultCollapsed={true}
    >
      <div className="flex flex-col gap-3 font-mono text-[11px] p-2 text-slate-200">
        {/* Cinta Deslizante Continua de las 6 Pestañas de Cañones Urbanos (Regla 22) */}
        <SlidingRibbonBar
          accent="cyan"
          activeKey={activeTab}
          className="bg-black/60 p-1 border border-slate-800 rounded-sm"
        >
          <ScientificTooltip position="bottom" width="w-[320px]" content="Clasificación hidrodinámica de Oke (1987) de regímenes de flujo según la relación de aspecto H/W: Flujo aislado (H/W < 0.3), Interferencia de estelas (0.3 <= H/W < 0.65) y Flujo de cavidad rasante Skimming Flow (H/W >= 0.65).">
            <button
              data-ribbon-active={activeTab === 'regimes'}
              onClick={() => setActiveTab('regimes')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'regimes'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>1. REGÍMENES DE OKE (1987)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content={`Catálogo topológico oficial de los ${canyons.length} cañones urbanos críticos de Málaga con exportación directa GeoJSON, CSV y tablas LaTeX para la tesis doctoral.`}>
            <button
              data-ribbon-active={activeTab === 'catalog'}
              onClick={() => setActiveTab('catalog')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>2. CATÁLOGO CAÑONES MÁLAGA ({canyons.length})</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Perfilador de sondeo vertical de concentraciones OSPM / Berkowicz desde el asfalto (0m) hasta la cornisa (50m) con efecto de recirculación en sotavento.">
            <button
              data-ribbon-active={activeTab === 'vertical_profile'}
              onClick={() => setActiveTab('vertical_profile')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'vertical_profile'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>3. SONDEO VERTICAL (OSPM)</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Efemérides solares horarias, cálculo astronómico de sombras en fachadas y atenuación de la fotólisis del NO2 por envolventes urbanas.">
            <button
              data-ribbon-active={activeTab === 'solar_shading'}
              onClick={() => setActiveTab('solar_shading')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'solar_shading'
                  ? 'bg-yellow-950 text-yellow-300 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>4. SOMBREADO SOLAR</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Mitigación microclimática mediante Soluciones Basadas en la Naturaleza (NbS), cubiertas vegetales intensivas y deposición de contaminantes.">
            <button
              data-ribbon-active={activeTab === 'mitigation'}
              onClick={() => setActiveTab('mitigation')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'mitigation'
                  ? 'bg-lime-950 text-lime-300 border-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>5. MITIGACIÓN NbS</span>
            </button>
          </ScientificTooltip>

          <ScientificTooltip position="bottom" width="w-[320px]" content="Inspección fotorrealista a cota peatonal de calle (1.8m AGL) con ángulo de visión, cornisas y arbolado viario.">
            <button
              data-ribbon-active={activeTab === 'street_view'}
              onClick={() => setActiveTab('street_view')}
              className={`px-2.5 py-1 text-[9.5px] font-bold uppercase transition-all flex items-center gap-1.5 rounded-sm border cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'street_view'
                  ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>6. STREET VIEW (1.8m)</span>
            </button>
          </ScientificTooltip>

          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-400 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-sm shrink-0 whitespace-nowrap">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-300">{activePoint?.name || 'Calle Activa'}</span>
            <span>(H/W: {canyonAspect.toFixed(2)})</span>
          </div>
        </SlidingRibbonBar>

        {/* Tab 1: Regímenes de Oke */}
        {activeTab === 'regimes' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <CanyonOkeFlowRegimeDiagram
                initialH={customH}
                initialW={customW}
                initialUroof={customU}
                onSelectStreet={(street) => {
                  const found = canyons.find(c => c.streetName === street);
                  if (found) {
                    setCustomH(found.avgBuildingHeightM);
                    setCustomW(found.streetWidthM);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Catálogo de Cañones con Exportación */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-3 bg-slate-950 p-3 border border-slate-800 rounded-sm">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cañón en Málaga..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 w-full focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10px]">Régimen:</span>
                <ScientificTooltip position="bottom" width="w-[240px]" content={`Ver los ${canyons.length} cañones urbanos de Málaga sin filtro de régimen.`}>
                  <button
                    onClick={() => setRegimeFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'ALL' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Todos ({canyons.length})
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[280px]" content="Régimen Skimming Flow (H/W ≥ 0.65, Oke 1987): flujo rasante con vórtice cavitario cerrado y atrapamiento de contaminantes en sotavento.">
                  <button
                    onClick={() => setRegimeFilter('SKIMMING')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'SKIMMING' ? 'bg-rose-950 text-rose-300 border border-rose-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Skimming
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[280px]" content="Régimen Wake Interference (0.30 ≤ H/W < 0.65, Oke 1987): interacción entre la estela del edificio de barlovento y el de sotavento.">
                  <button
                    onClick={() => setRegimeFilter('WAKE')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'WAKE' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Estela
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[280px]" content="Régimen Isolated Roughness (H/W < 0.30, Oke 1987): flujo de rugosidad aislada con ventilación libre y dispersión inmediata.">
                  <button
                    onClick={() => setRegimeFilter('ISOLATED')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${regimeFilter === 'ISOLATED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Aislado
                  </button>
                </ScientificTooltip>
              </div>

              {/* Action Downloads */}
              <div className="flex items-center gap-1">
                <ScientificTooltip position="bottom" width="w-[240px]" content="Descargar la colección GeoJSON 3D de los cañones urbanos de Málaga para visualización en SIG.">
                  <button
                    onClick={handleDownloadGeoJson}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 rounded text-[9.5px] cursor-pointer"
                  >
                    <FileJson className="w-3 h-3" /> GeoJSON
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[240px]" content="Descargar la matriz morfométrica y de ventilación ACH en formato CSV estandarizado.">
                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 rounded text-[9.5px] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> CSV
                  </button>
                </ScientificTooltip>

                <ScientificTooltip position="bottom" width="w-[240px]" content="Descargar tabla en LaTeX booktabs lista para el cuerpo de la tesis doctoral.">
                  <button
                    onClick={handleDownloadLatex}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950 text-purple-300 border border-purple-700 hover:bg-purple-900 rounded text-[9.5px] cursor-pointer"
                  >
                    <FileText className="w-3 h-3" /> LaTeX
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
                    <th className="p-2">Calle / Distrito</th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[200px]" content="Altura media de cornisa (H) y anchura de calzada (W) en metros.">
                        <span className="cursor-help">H / W (m)</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[220px]" content="Relación de aspecto geométrica adimensional H/W (Oke 1987).">
                        <span className="cursor-help">Relación H/W</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[240px]" content="Clasificación hidrodinámica del flujo de aire en el cañón según Oke (1987).">
                        <span className="cursor-help">Régimen</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[240px]" content="Tiempo medio de residencia del aire en el volumen del cañón urbano en segundos.">
                        <span className="cursor-help">τ_res (s)</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[240px]" content="Air Changes per Hour (ACH): renovaciones de aire por hora por ventilación turbulenta.">
                        <span className="cursor-help">ACH (h⁻¹)</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-center">
                      <ScientificTooltip position="top" width="w-[260px]" content="Ratio de concentración asimétrica entre la fachada de sotavento (leeward) y barlovento (windward).">
                        <span className="cursor-help">Asimetría C_lee</span>
                      </ScientificTooltip>
                    </th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[10px]">
                  {filteredCanyons.map(c => (
                    <tr key={c.streetId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 font-bold text-slate-200">
                        <div>{c.streetName}</div>
                        <div className="text-[8.5px] text-slate-400 font-normal">({c.district})</div>
                      </td>
                      <td className="p-2 text-center text-slate-300">
                        {c.avgBuildingHeightM}m / {c.streetWidthM}m
                      </td>
                      <td className="p-2 text-center font-bold text-amber-300">
                        {c.aspectRatioHW}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border ${
                          c.regimeCode === 'SKIMMING_FLOW'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : c.regimeCode === 'WAKE_INTERFERENCE'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        }`}>
                          {c.regimeCode === 'SKIMMING_FLOW' ? 'Skimming' : c.regimeCode === 'WAKE_INTERFERENCE' ? 'Estela' : 'Aislado'}
                        </span>
                      </td>
                      <td className="p-2 text-center text-amber-300 font-bold">
                        {c.airResidenceTimeSec} s
                      </td>
                      <td className="p-2 text-center text-emerald-300 font-bold">
                        {c.airChangesPerHourACH}
                      </td>
                      <td className="p-2 text-center text-rose-300 font-bold">
                        {c.leewardToWindwardPollutantRatio}x
                      </td>
                      <td className="p-2 text-right">
                        <ScientificTooltip
                          position="left"
                          width="w-[280px]"
                          content="Cargar la geometría (H y W) de este cañón de Málaga en el motor de regímenes de flujo de Oke (1987) y estimar su vórtice de recirculación."
                          citation="Oke (1987) Boundary Layer Climates"
                        >
                          <button
                            onClick={() => {
                              setCustomH(c.avgBuildingHeightM);
                              setCustomW(c.streetWidthM);
                              setActiveTab('regimes');
                            }}
                            className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded text-[9px] transition-colors cursor-pointer"
                          >
                            Simular ➔
                          </button>
                        </ScientificTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: OSPM Vertical Profile */}
        {activeTab === 'vertical_profile' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <StreetCanyonVerticalProfileModal
                isOpen={true}
                onClose={() => {}}
                currentWindSpeedKmh={data?.velocidad_viento_km_h || 12}
                currentWindDirDeg={data?.direccion_viento_grados || 135}
                currentNO2Base={data?.no2_satelite_base || 35}
                currentTemp={data?.temperatura_malaga || 22}
                currentSolarUV={data?.uv_index || 5}
                aspectRatioHW={canyonAspect}
                buildingHeightM={buildingHeight}
                streetWidthM={streetWidth}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Sombreado Solar & Efemérides (Dinámico con el Punto Activo) */}
        {activeTab === 'solar_shading' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <SolarShadingCanyonTab
                canyon={{
                  id: activePoint?.streetName ? `active_${activePoint.streetName.toLowerCase().replace(/\s+/g, '_')}` : selectedCanyon.streetId,
                  name: activePoint?.streetName || selectedCanyon.streetName,
                  H: customH,
                  W: customW,
                  orientationDeg: activePoint?.streetBearingDeg ?? selectedCanyon.streetOrientationDeg ?? 90,
                  lat: activePoint?.lat ?? selectedCanyon.lat ?? 36.7213,
                  lng: activePoint?.lon ?? selectedCanyon.lon ?? -4.4214
                }}
                currentSolarUV={assimilation?.solarRadiationWm2 ? Math.max(1, Math.round(assimilation.solarRadiationWm2 / 115)) : (data?.uv_index || 5)}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Mitigación NbS & Cubiertas Vegetales (Dinámico con el Punto Activo) */}
        {activeTab === 'mitigation' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <UrbanCanyonMitigationDiagramModal
                onClose={() => {}}
                initialQuadrantId="centro_alameda"
                ambientTemp={assimilation?.temperatureC ?? data?.temperatura_malaga ?? 24.5}
                ambientNO2={assimilation?.no2Ugm3 ?? data?.no2_satelite_base ?? 46.0}
                ambientWind={customU}
              />
            </div>
          </div>
        )}

        {/* Tab 6: Street View a Cota Peatonal (1.8m) (Dinámico con el Punto Activo) */}
        {activeTab === 'street_view' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
              <GoogleStreetViewCanyonTab
                canyon={{
                  id: activePoint?.streetName ? `sv_${activePoint.streetName.toLowerCase().replace(/\s+/g, '_')}` : selectedCanyon.streetId,
                  name: activePoint?.streetName || selectedCanyon.streetName,
                  lat: activePoint?.lat ?? selectedCanyon.lat ?? 36.7213,
                  lng: activePoint?.lon ?? selectedCanyon.lon ?? -4.4214,
                  orientationDeg: activePoint?.streetBearingDeg ?? selectedCanyon.streetOrientationDeg ?? 90,
                  H: customH,
                  W: customW,
                  treeCoverPct: Math.min(85, Math.max(5, Math.round((assimilation?.treeCanopyLai ?? 1.5) * 18))),
                  lanes: activePoint?.isPedestrian ? 0 : Math.max(1, Math.min(6, Math.round(customW / 6.5))),
                  dailyVehicles: activePoint?.isPedestrian ? 0 : (activePoint?.trafficVehiclesDay ?? 14500),
                  description: `${activePoint?.streetName || selectedCanyon.streetName} (${activePoint?.district || selectedCanyon.district}) • H=${customH.toFixed(1)}m, W=${customW.toFixed(1)}m`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
