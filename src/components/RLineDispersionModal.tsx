import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Wind, 
  Car, 
  TrendingDown, 
  Layers, 
  Download, 
  Info, 
  ShieldCheck, 
  ShieldAlert, 
  Sliders, 
  FileText,
  MapPin,
  Maximize2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  calculateRLineDispersion, 
  MALAGA_KEY_TRAFFIC_SEGMENTS, 
  TrafficLineSegment, 
  RLineDispersionResult 
} from '../lib/rlineDispersionEngine';
import Papa from 'papaparse';

interface RLineDispersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dragConstraintsRef?: React.RefObject<any>;
}

export const RLineDispersionModal: React.FC<RLineDispersionModalProps> = ({
  isOpen,
  onClose,
  dragConstraintsRef
}) => {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('alameda_principal');
  const [customWindSpeed, setCustomWindSpeed] = useState<number>(assimilation?.windSpeedMs ?? 2.5);
  const [customWindDir, setCustomWindDir] = useState<number>(assimilation?.windDirectionDeg ?? 180);
  const [customObukhovL, setCustomObukhovL] = useState<number>((assimilation as any)?.moninObukhovLengthL ?? -45);
  const [trafficScale, setTrafficScale] = useState<number>(assimilation?.diurnalTrafficFactor ?? 1.0);

  // Sincronización reactiva inmediata con el punto y tramo viario activo seleccionado en el mapa
  React.useEffect(() => {
    if (activePoint) {
      let bestSeg = MALAGA_KEY_TRAFFIC_SEGMENTS[0];
      let minDist = Infinity;
      for (const seg of MALAGA_KEY_TRAFFIC_SEGMENTS) {
        if (activePoint.streetName && seg.name.toLowerCase().includes(activePoint.streetName.toLowerCase())) {
          bestSeg = seg;
          break;
        }
        const midLat = (seg.lat1 + seg.lat2) / 2;
        const midLon = (seg.lon1 + seg.lon2) / 2;
        const d = Math.hypot(midLat - activePoint.lat, midLon - activePoint.lon);
        if (d < minDist) {
          minDist = d;
          bestSeg = seg;
        }
      }
      setSelectedSegmentId(bestSeg.id);
    }
    if (assimilation) {
      setCustomWindSpeed(Number(Math.max(0.4, assimilation.windSpeedMs).toFixed(1)));
      setCustomWindDir(Math.round(assimilation.windDirectionDeg));
      const lVal = (assimilation as any)?.moninObukhovLengthL;
      if (typeof lVal === 'number' && !Number.isNaN(lVal)) {
        setCustomObukhovL(Math.max(-500, Math.min(500, Math.round(lVal))));
      }
      setTrafficScale(Number(Math.max(0.2, Math.min(2.0, assimilation.diurnalTrafficFactor ?? 1.0)).toFixed(2)));
    }
  }, [activePoint, assimilation]);

  const segment = useMemo(() => {
    const base = MALAGA_KEY_TRAFFIC_SEGMENTS.find(s => s.id === selectedSegmentId) || MALAGA_KEY_TRAFFIC_SEGMENTS[0];
    return {
      ...base,
      emissionRateNOx_ug_m_s: Number((base.emissionRateNOx_ug_m_s * trafficScale).toFixed(2)),
      emissionRatePM25_ug_m_s: Number((base.emissionRatePM25_ug_m_s * trafficScale).toFixed(2)),
      trafficVehiclesPerHour: Math.round(base.trafficVehiclesPerHour * trafficScale)
    };
  }, [selectedSegmentId, trafficScale]);

  const dynamicStreetOrientationDeg = activePoint?.streetBearingDeg ?? activePoint?.orientationDeg ?? 90;
  const dynamicBackgroundNo2 = assimilation?.no2BackgroundUgM3 ?? 18.5;
  const dynamicRoughnessZ0 = Number(Math.max(0.15, Math.min(2.2, (activePoint?.buildingHeightM ?? 18) * 0.055)).toFixed(2));

  const dispersionResult: RLineDispersionResult = useMemo(() => {
    return calculateRLineDispersion(
      segment,
      customWindSpeed,
      customWindDir,
      dynamicStreetOrientationDeg,
      dynamicBackgroundNo2,
      customObukhovL,
      dynamicRoughnessZ0
    );
  }, [segment, customWindSpeed, customWindDir, dynamicStreetOrientationDeg, dynamicBackgroundNo2, customObukhovL, dynamicRoughnessZ0]);

  const handleExportCSV = () => {
    const csvData = dispersionResult.receptors.map(r => ({
      Segmento: dispersionResult.segmentName,
      Distancia_Perpendicular_m: r.x_m,
      Altura_Receptor_m: r.z_m,
      NO2_ug_m3: r.concNO2_ug_m3,
      PM25_ug_m3: r.concPM25_ug_m3,
      Sigma_Y_m: r.sigmaY_m,
      Sigma_Z_m: r.sigmaZ_m,
      Factor_Meandro: r.meanderFactor,
      Clase_Estabilidad: dispersionResult.stabilityClass,
      Velocidad_Viento_ms: dispersionResult.windSpeedMs
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rline_dispersion_${dispersionResult.segmentId}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const features = dispersionResult.receptors.map(r => ({
      type: 'Feature' as const,
      properties: {
        segment: dispersionResult.segmentName,
        distance_m: r.x_m,
        no2_ug_m3: r.concNO2_ug_m3,
        pm25_ug_m3: r.concPM25_ug_m3,
        sigma_z_m: r.sigmaZ_m
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          segment.lon1 + (r.x_m / 111320),
          segment.lat1 + (r.x_m / 111320)
        ]
      }
    }));

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rline_transect_${dispersionResult.segmentId}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Motor de Dispersión Lineal Microescala EPA R-LINE (Snyder et al. 2013)"
      onClose={onClose}
      defaultCollapsed={true}
      dragConstraintsRef={dragConstraintsRef}
    >
      <div className="space-y-4 p-4 text-xs font-sans text-slate-200">
        <ActivePointSyncBanner />

        {/* Barra Superior Informativa y Selectora */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>Integración Analítica Gaussiana de Calzada (Error Function erf)</span>
                <ScientificTooltip content="Modelo analítico determinista para fuentes lineales finitas con corrección de meandro en bajo viento (Venkatram 2004) y dispersión turbulenta superficial (Snyder et al., 2013).">
                  <span className="cursor-help px-1.5 py-0.5 bg-blue-950 border border-blue-700 text-blue-300 font-mono text-[9px] rounded">
                    R-LINE / CALINE4
                  </span>
                </ScientificTooltip>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Decaimiento transversal de NO₂ y PM2.5 desde borde de acera hacia fachada interior.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="bottom" width="w-[260px]" content="Exporta la curva de transecto perpendicular, sigmas gaussianos y concentraciones en receptores a microescala en formato tabular CSV citable.">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono flex items-center gap-1 text-slate-200 rounded transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>CSV (FAIR)</span>
              </button>
            </ScientificTooltip>
            <ScientificTooltip position="bottom" width="w-[260px]" content="Exporta los puntos receptores a lo largo del transecto viario con geometría geográfica georreferenciada en estándar abierto GeoJSON.">
              <button
                onClick={handleExportGeoJSON}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono flex items-center gap-1 text-slate-200 rounded transition-colors"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>GeoJSON</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Panel de Controles Micrometeorológicos y de Calzada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 border border-slate-800 rounded-lg">
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              Tramo Viario de Málaga:
            </label>
            <ScientificTooltip position="bottom" width="w-[280px]" content="Tramos de aforo y tráfico de la red viaria de Málaga con IMD, velocidad media y tasa horaria de emisión de tubo de escape según COPERT 5.">
              <select
                value={selectedSegmentId}
                onChange={(e) => setSelectedSegmentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded font-mono"
              >
                {MALAGA_KEY_TRAFFIC_SEGMENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </ScientificTooltip>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Vel. Viento (u):</span>
              <span className="text-cyan-300">{customWindSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={customWindSpeed}
              onChange={(e) => setCustomWindSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 accent-cyan-500 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Longitud Obukhov L:</span>
              <span className="text-amber-300">{customObukhovL} m</span>
            </div>
            <input
              type="range"
              min="-150"
              max="50"
              step="5"
              value={customObukhovL}
              onChange={(e) => setCustomObukhovL(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 accent-amber-500 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Escala Tráfico / ZBE:</span>
              <span className="text-emerald-300">{Math.round(trafficScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={trafficScale}
              onChange={(e) => setTrafficScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded"
            />
          </div>
        </div>

        {/* Métricas Sintéticas de Impacto en Acera */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
            <div className="text-[10px] font-mono text-slate-400">NO₂ en Acera (x=0m):</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {dispersionResult.curbsideNO2_ug_m3} µg/m³
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Cota 1.5m AGL (Inhalación)</div>
          </div>

          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
            <div className="text-[10px] font-mono text-slate-400">Distancia Semiatenuación (50%):</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {dispersionResult.decayLengthMeters} m
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Desde eje de calzada</div>
          </div>

          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
            <div className="text-[10px] font-mono text-slate-400">Estabilidad Micrometeorológica:</div>
            <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
              Clase {dispersionResult.stabilityClass}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">MOST (Businger-Dyer)</div>
          </div>

          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
            <div className="text-[10px] font-mono text-slate-400">Tasa Emisión Línea q_L:</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
              {segment.emissionRateNOx_ug_m_s} µg/(m·s)
            </div>
            <div className="text-[9px] text-slate-400 mt-1">{segment.trafficVehiclesPerHour} veh/h ({segment.heavyDutyPct}% pesados)</div>
          </div>
        </div>

        {/* Gráfico de Perfil Transversal de Dispersión */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <span>Gradiente Perpendicular de Concentración vs Distancia a Calzada (m)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Directiva 2008/50/CE VLE Horario: 200 µg/m³ • Anual: 40 µg/m³
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispersionResult.receptors} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="x_m" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Distancia perpendicular a acera (m)', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Concentración (µg/m³)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Límite Anual NO2 (40 µg/m³)', fill: '#ef4444', fontSize: 9 }} />
                <Line 
                  type="monotone" 
                  dataKey="concNO2_ug_m3" 
                  name="NO₂ (µg/m³)" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="concPM25_ug_m3" 
                  name="PM2.5 (µg/m³)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 2.5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nota Científica Citable */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Fundamentación Científica y Trazabilidad FAIR:</strong>{' '}
            {dispersionResult.scientificCitation}
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
