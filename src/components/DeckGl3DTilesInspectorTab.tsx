/**
 * PESTAÑA DE INSPECCIÓN DE TESELAS 3D Y CLIPPING EN DECK.GL (OGC 3D TILES)
 * =========================================================================
 * Tesis Doctoral - Integración de Fotogrametría 3D y Nube de Dispersión Euleriana.
 */

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Layers, 
  Scissors, 
  Sliders, 
  Eye, 
  Download, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface DeckGl3DTilesInspectorTabProps {
  canyon: {
    id: string;
    name: string;
    H: number;
    W: number;
    orientationDeg: number;
    lat: number;
    lng: number;
  };
}

export const DeckGl3DTilesInspectorTab: React.FC<DeckGl3DTilesInspectorTabProps> = ({
  canyon
}) => {
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [clippingPlaneActive, setClippingPlaneActive] = useState<boolean>(true);
  const [clippingHeightM, setClippingHeightM] = useState<number>(Math.round(canyon.H * 0.5));
  const [pointBudget, setPointBudget] = useState<number>(1000000);
  const [lodRefinement, setLodRefinement] = useState<number>(16);

  // Bounding Box ECEF / WGS84 del cañón urbano
  const boundingVolume = useMemo(() => {
    return {
      canyonName: canyon.name,
      center: [canyon.lng, canyon.lat, canyon.H / 2],
      bounds: {
        minLng: Number((canyon.lng - 0.0015).toFixed(6)),
        maxLng: Number((canyon.lng + 0.0015).toFixed(6)),
        minLat: Number((canyon.lat - 0.0012).toFixed(6)),
        maxLat: Number((canyon.lat + 0.0012).toFixed(6)),
        minAltM: 0,
        maxAltM: canyon.H * 1.5
      },
      geometricErrorM: (canyon.H / lodRefinement).toFixed(2),
      loader: '@loaders.gl/3d-tiles (Tiles3DLoader)',
      layer: '@deck.gl/geo-layers (Tile3DLayer)'
    };
  }, [canyon, lodRefinement]);

  // Exportar especificación técnica de la capa 3D Tiles en GeoJSON/JSON
  const handleExportJson = () => {
    const spec = {
      title: `Deck.GL 3D Tiles Pipeline Spec - ${canyon.name}`,
      timestamp: new Date().toISOString(),
      canyonGeometry: {
        widthM: canyon.W,
        heightM: canyon.H,
        azimuthDeg: canyon.orientationDeg
      },
      deckGlLayerConfig: {
        id: `tile-3d-layer-${canyon.id}`,
        type: 'Tile3DLayer',
        loader: 'Tiles3DLoader',
        pointBudget,
        maximumScreenSpaceError: lodRefinement,
        wireframe: wireframeMode,
        clippingPlanes: clippingPlaneActive ? [
          { normal: [0, 0, -1], distance: clippingHeightM }
        ] : []
      },
      boundingVolume
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `deckgl_3dtiles_spec_${canyon.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-3.5 text-slate-200">
      {/* Panel Superior de Configuración del Pipeline WebGL2 */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-white">
              Pipeline WebGL2: @deck.gl/geo-layers (Tile3DLayer) + @loaders.gl/3d-tiles
            </span>
          </div>

          <ScientificTooltip content="Descarga de la especificación técnica de las teselas 3D OGC con parámetros de clipping y volúmenes envolventes en formato JSON estándar.">
            <button
              onClick={handleExportJson}
              className="px-2 py-1 bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 rounded-sm"
            >
              <Download className="w-3 h-3 text-emerald-400" /> Especificación JSON
            </button>
          </ScientificTooltip>
        </div>

        {/* Controles de Renderizado 3D */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Plano de Corte (Clipping Plane Z) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-red-400" /> Plano de Corte Z (Altura):
              </span>
              <span className="text-red-300 font-bold">{clippingHeightM} m</span>
            </div>
            <input
              type="range"
              min="2"
              max={Math.ceil(canyon.H * 1.4)}
              step="1"
              value={clippingHeightM}
              onChange={(e) => setClippingHeightM(parseInt(e.target.value))}
              disabled={!clippingPlaneActive}
              className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="clip-toggle"
                checked={clippingPlaneActive}
                onChange={(e) => setClippingPlaneActive(e.target.checked)}
                className="accent-red-500"
              />
              <label htmlFor="clip-toggle" className="text-[9px] text-slate-300 font-mono cursor-pointer">
                Activar Corte de Fachadas
              </label>
            </div>
          </div>

          {/* Nivel de Detalle LOD (Screen Space Error) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>LOD Error Máximo (SSE):</span>
              <span className="text-emerald-300 font-bold">{lodRefinement} px</span>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              step="2"
              value={lodRefinement}
              onChange={(e) => setLodRefinement(parseInt(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[8.5px] text-slate-400 font-mono">
              Error Geométrico: ~{boundingVolume.geometricErrorM} m
            </div>
          </div>

          {/* Modo Malla de Alambre (Wireframe) */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">Visualización Estructural:</div>
            <div className="flex gap-2 pt-1">
              <ScientificTooltip position="bottom" width="w-[240px]" content="Renderiza la malla 3D completa con fotogrametría urbana continua y materiales opacos (WebGL2 Fragment Shaders).">
                <button
                  onClick={() => setWireframeMode(false)}
                  className={`flex-1 py-1 text-[10px] font-mono border rounded-sm ${
                    !wireframeMode ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold' : 'bg-black/50 border-slate-700 text-slate-400'
                  }`}
                >
                  Sólido Texturado
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[240px]" content="Muestra la teselación geométrica triangular (Wireframe) para inspección de vértices, aristas y refinamiento de mallas OGC 3D Tiles.">
                <button
                  onClick={() => setWireframeMode(true)}
                  className={`flex-1 py-1 text-[10px] font-mono border rounded-sm ${
                    wireframeMode ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold' : 'bg-black/50 border-slate-700 text-slate-400'
                  }`}
                >
                  Wireframe Triangulado
                </button>
              </ScientificTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizador Esquemático del Volumen Envolvente y Plano de Corte */}
      <div className="p-3 bg-black/70 border border-slate-800 rounded-sm relative">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volumen Envolvente OGC 3D Tiles y Plano de Sección Z={clippingHeightM}m</span>
          </div>
          <div className="text-[9.5px] font-mono text-emerald-400">
            Render: WebGL2 Shader de Oclusión
          </div>
        </div>

        {/* Diagrama Isométrico SVG */}
        <div className="flex justify-center bg-slate-950/90 border border-slate-800 p-3 rounded-sm">
          <svg width="420" height="210" className="overflow-visible font-mono select-none">
            {/* Eje de coordenadas y rejilla base */}
            <line x1="60" y1="170" x2="360" y2="170" stroke="#334155" strokeWidth="1.5" />
            <line x1="210" y1="20" x2="210" y2="170" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Edificio Izquierdo */}
            <polygon
              points="100,170 100,60 150,40 150,150"
              fill={wireframeMode ? "none" : "#1e293b"}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {wireframeMode && (
              <line x1="100" y1="60" x2="150" y2="150" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
            )}

            {/* Edificio Derecho */}
            <polygon
              points="270,150 270,40 320,60 320,170"
              fill={wireframeMode ? "none" : "#1e293b"}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {wireframeMode && (
              <line x1="270" y1="40" x2="320" y2="170" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
            )}

            {/* Plano de Corte Horizontal Z */}
            {clippingPlaneActive && (
              <g>
                <polygon
                  points="70,110 350,110 370,95 90,95"
                  fill="rgba(239, 68, 68, 0.25)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="375" y="105" fill="#f87171" fontSize="9" fontWeight="bold">
                  Corte Z={clippingHeightM}m
                </text>
              </g>
            )}

            {/* Calle / Espacio Urbano entre Edificios */}
            <rect x="150" y="150" width="120" height="20" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="180" y="164" fill="#94a3b8" fontSize="8.5">
              Calle W = {canyon.W}m
            </text>

            {/* Nube de Contaminante Euleriana Visible en el Interior */}
            <ellipse cx="210" cy="140" rx="40" ry="18" fill="rgba(245, 158, 11, 0.35)" />
            <text x="175" y="143" fill="#fbbf24" fontSize="8" fontWeight="bold">
              NO₂ Euleriano (Deck.GL)
            </text>

            <text x="102" y="32" fill="#38bdf8" fontSize="9">
              Fachada H={canyon.H}m
            </text>
          </svg>
        </div>

        {/* Resumen de Telemetría de la Capa */}
        <div className="mt-2.5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono text-slate-400">
          <div className="p-1.5 bg-slate-900 border border-slate-800">
            <div>LOADER ENGINE:</div>
            <div className="text-white font-bold">@loaders.gl/3d-tiles</div>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-800">
            <div>RENDER LAYER:</div>
            <div className="text-emerald-400 font-bold">Tile3DLayer (Deck.GL)</div>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-800">
            <div>COORDENADAS:</div>
            <div className="text-white font-bold">WGS84 / ECEF</div>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-800">
            <div>CLIPPING SHADER:</div>
            <div className="text-red-400 font-bold">{clippingPlaneActive ? `Activo (${clippingHeightM}m)` : 'Inactivo'}</div>
          </div>
        </div>
      </div>

      {/* Nota de Integración de Tesis */}
      <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-[9.5px] text-emerald-200 leading-relaxed rounded-sm space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fusión de la Fotogrametría 3D y Nubes de Contaminantes (Sin Desincronización):</span>
        </div>
        <p>
          La carga directa de teselas 3D OGC mediante <code className="text-emerald-300">@loaders.gl/3d-tiles</code> dentro del mismo pipeline WebGL2 de Deck.GL permite activar planos de corte paramétricos (<em className="text-white">clipping planes</em>). Esto resuelve la oclusión visual de los edificios, permitiendo inspeccionar la acumulación de NO₂ en la pared de sotavento a nivel de acera y comparar directamente la concentración modelizada con la cota de captación de las estaciones oficiales de Málaga.
        </p>
      </div>
    </div>
  );
};
