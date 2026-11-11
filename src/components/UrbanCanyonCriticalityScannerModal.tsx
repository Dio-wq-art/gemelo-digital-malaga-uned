import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Wind, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Building2, 
  RefreshCw,
  Info,
  Sliders,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useUIStore } from '../store/uiStore';

interface CanyonSegment {
  id: string;
  name: string;
  coords: [number, number]; // [lat, lng]
  orientationDeg: number; // Azimut de la calle (0-180)
  H: number; // Altura media de cornisa (m)
  W: number; // Ancho entre fachadas (m)
  trafficVehDay: number; // AADT estimado
  heavyDutyPct: number; // % vehículos pesados
  treeCanopyCoverPct: number; // % dosel arbóreo
  district: string;
}

const MALAGA_CANYON_NETWORK: CanyonSegment[] = [
  {
    id: 'larios',
    name: 'Calle Marqués de Larios',
    coords: [36.7198, -4.4214],
    orientationDeg: 0, // N-S
    H: 22.0,
    W: 16.0,
    trafficVehDay: 0, // Peatonal
    heavyDutyPct: 0,
    treeCanopyCoverPct: 0,
    district: 'Centro Histórico'
  },
  {
    id: 'alameda',
    name: 'Alameda Principal',
    coords: [36.7175, -4.4235],
    orientationDeg: 90, // E-O
    H: 26.0,
    W: 42.0,
    trafficVehDay: 32000,
    heavyDutyPct: 14.5,
    treeCanopyCoverPct: 65, // Gran bóveda de ficus
    district: 'Centro Histórico'
  },
  {
    id: 'carreteria',
    name: 'Calle Carretería',
    coords: [36.7235, -4.4220],
    orientationDeg: 110,
    H: 19.5,
    W: 11.5,
    trafficVehDay: 6500,
    heavyDutyPct: 4.2,
    treeCanopyCoverPct: 8,
    district: 'Centro Histórico'
  },
  {
    id: 'parque',
    name: 'Paseo del Parque',
    coords: [36.7188, -4.4140],
    orientationDeg: 80,
    H: 28.0,
    W: 38.0,
    trafficVehDay: 28000,
    heavyDutyPct: 18.0, // Autobuses EMT intensivos
    treeCanopyCoverPct: 75,
    district: 'Centro - Puerto'
  },
  {
    id: 'andalucia',
    name: 'Avenida de Andalucía (Tramo Corte Inglés)',
    coords: [36.7170, -4.4325],
    orientationDeg: 95,
    H: 34.0,
    W: 48.0,
    trafficVehDay: 58000,
    heavyDutyPct: 8.5,
    treeCanopyCoverPct: 15,
    district: 'Cruz de Humilladero'
  },
  {
    id: 'juan_xxiii',
    name: 'Avenida Juan XXIII (Tramo Central)',
    coords: [36.7085, -4.4410],
    orientationDeg: 15,
    H: 28.0,
    W: 24.0,
    trafficVehDay: 44000,
    heavyDutyPct: 9.8,
    treeCanopyCoverPct: 12,
    district: 'Carretera de Cádiz'
  },
  {
    id: 'marmoles',
    name: 'Calle Mármoles',
    coords: [36.7215, -4.4300],
    orientationDeg: 105,
    H: 21.0,
    W: 13.0,
    trafficVehDay: 14500,
    heavyDutyPct: 5.5,
    treeCanopyCoverPct: 5,
    district: 'Bailén-Miraflores'
  },
  {
    id: 'victoria',
    name: 'Calle Victoria',
    coords: [36.7270, -4.4140],
    orientationDeg: 35,
    H: 18.0,
    W: 12.0,
    trafficVehDay: 16000,
    heavyDutyPct: 6.0,
    treeCanopyCoverPct: 10,
    district: 'Centro - Victoria'
  },
  {
    id: 'pablo_picasso',
    name: 'Paseo Marítimo Pablo Ruiz Picasso',
    coords: [36.7190, -4.4020],
    orientationDeg: 80,
    H: 24.0,
    W: 55.0, // Abierto al mar por el Sur
    trafficVehDay: 24000,
    heavyDutyPct: 4.0,
    treeCanopyCoverPct: 18,
    district: 'Málaga Este'
  },
  {
    id: 'atarazanas',
    name: 'Calle Atarazanas / Guillén Sotelo',
    coords: [36.7185, -4.4245],
    orientationDeg: 10,
    H: 20.0,
    W: 13.5,
    trafficVehDay: 8200,
    heavyDutyPct: 7.0,
    treeCanopyCoverPct: 4,
    district: 'Centro Histórico'
  },
  {
    id: 'heredia',
    name: 'Av. Manuel Agustín Heredia',
    coords: [36.7150, -4.4230],
    orientationDeg: 85,
    H: 26.0,
    W: 36.0,
    trafficVehDay: 35000,
    heavyDutyPct: 16.2,
    treeCanopyCoverPct: 10,
    district: 'Centro - Ensanche'
  },
  {
    id: 'cruz_humilladero',
    name: 'Paseo de los Tilos / Cruz Humilladero',
    coords: [36.7120, -4.4380],
    orientationDeg: 120,
    H: 25.0,
    W: 22.0,
    trafficVehDay: 26000,
    heavyDutyPct: 7.4,
    treeCanopyCoverPct: 20,
    district: 'Cruz de Humilladero'
  }
];

interface UrbanCanyonCriticalityScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWindSpeedMs?: number;
  currentWindDirDeg?: number;
}

export const UrbanCanyonCriticalityScannerModal: React.FC<UrbanCanyonCriticalityScannerModalProps> = ({
  isOpen,
  onClose,
  currentWindSpeedMs = 2.4,
  currentWindDirDeg = 135 // Brisa de Levante típica
}) => {
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterRegime, setFilterRegime] = useState<string>('all');
  const [simulatedWindSpeed, setSimulatedWindSpeed] = useState<number>(currentWindSpeedMs);
  const [simulatedWindDir, setSimulatedWindDir] = useState<number>(currentWindDirDeg);

  // Análisis determinista físico para cada segmento
  const analyzedSegments = useMemo(() => {
    return MALAGA_CANYON_NETWORK.map((seg) => {
      const aspectRatio = seg.H / seg.W;
      
      // Ángulo de ataque relativo entre el viento y el eje de la calle (0° = paralelo, 90° = perpendicular)
      let diff = Math.abs(simulatedWindDir - seg.orientationDeg) % 180;
      if (diff > 90) diff = 180 - diff;
      const attackAngleDeg = diff;

      // Determinación estricta del régimen de flujo de Oke (1987)
      let regime: 'isolated' | 'wake' | 'skimming' | 'channeling';
      let regimeLabel = '';
      
      if (attackAngleDeg < 25) {
        regime = 'channeling';
        regimeLabel = 'Flujo Canalizado (Channeling)';
      } else if (aspectRatio < 0.35) {
        regime = 'isolated';
        regimeLabel = 'Rugosidad Aislada (Isolated)';
      } else if (aspectRatio < 0.65) {
        regime = 'wake';
        regimeLabel = 'Interferencia de Estela (Wake)';
      } else {
        regime = 'skimming';
        regimeLabel = 'Rasante Confinado (Skimming Flow)';
      }

      // Factor de ventilación y dispersión (Oke & Vardoulakis 2003)
      // Viento perpendicular a cañón profundo = máxima recirculación y confinamiento
      const sinTheta = Math.sin((attackAngleDeg * Math.PI) / 180);
      const windSpeedFactor = Math.max(0.6, simulatedWindSpeed);
      
      // Índice de Confinamiento de la Contaminación (ICI: 0 - 100)
      let rawICI = 0;
      if (regime === 'channeling') {
        rawICI = Math.min(45, (aspectRatio * 20) / Math.sqrt(windSpeedFactor));
      } else {
        rawICI = (aspectRatio / 1.4) * 60 * sinTheta * (2.8 / windSpeedFactor);
      }
      
      // Corrección por copa de árboles (atrapamiento bajo copa de Grimmond & Oke)
      if (seg.treeCanopyCoverPct > 40 && aspectRatio > 0.6) {
        rawICI *= (1 + (seg.treeCanopyCoverPct / 100) * 0.25);
      }
      
      const ici = Math.min(100, Math.max(5, Math.round(rawICI)));

      // Semáforo municipal preventivo
      let level: 'low' | 'moderate' | 'high' | 'critical';
      let levelLabel = '';
      let badgeColor = '';
      if (ici < 30) {
        level = 'low';
        levelLabel = 'VENTILACIÓN ÓPTIMA';
        badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-600';
      } else if (ici < 55) {
        level = 'moderate';
        levelLabel = 'VENTILACIÓN MODERADA';
        badgeColor = 'bg-amber-950 text-amber-300 border-amber-600';
      } else if (ici < 75) {
        level = 'high';
        levelLabel = 'CONFINAMIENTO ALTO';
        badgeColor = 'bg-orange-950 text-orange-300 border-orange-600';
      } else {
        level = 'critical';
        levelLabel = 'ESTANCAMIENTO CRÍTICO';
        badgeColor = 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse';
      }

      // Estimación determinista de amplificación de NO2 en cota peatonal (1.5m)
      const baseEmissionFactor = (seg.trafficVehDay / 1000) * (1 + (seg.heavyDutyPct / 100) * 3.5);
      const no2AmplificationFactor = Number((1 + (ici / 100) * 2.2).toFixed(2));
      const estimatedNO2ppb = Math.round(15 + baseEmissionFactor * 0.9 * no2AmplificationFactor);

      return {
        ...seg,
        aspectRatio: Number(aspectRatio.toFixed(2)),
        attackAngleDeg: Math.round(attackAngleDeg),
        regime,
        regimeLabel,
        ici,
        level,
        levelLabel,
        badgeColor,
        no2AmplificationFactor,
        estimatedNO2ppb
      };
    }).sort((a, b) => b.ici - a.ici);
  }, [simulatedWindSpeed, simulatedWindDir]);

  // Filtrado de segmentos
  const filteredSegments = useMemo(() => {
    return analyzedSegments.filter((s) => {
      const matchDistrict = filterDistrict === 'all' || s.district === filterDistrict;
      const matchRegime = filterRegime === 'all' || s.regime === filterRegime;
      return matchDistrict && matchRegime;
    });
  }, [analyzedSegments, filterDistrict, filterRegime]);

  // Exportar matriz a CSV
  const handleExportCSV = () => {
    const headers = [
      'id',
      'calle',
      'distrito',
      'lat',
      'lng',
      'orientacion_deg',
      'altura_H_m',
      'ancho_W_m',
      'aspect_ratio_H_W',
      'viento_ataque_deg',
      'regimen_oke',
      'indice_confinamiento_ICI',
      'nivel_critico',
      'amplificacion_NO2',
      'estimado_NO2_ugm3',
      'trafico_IMD'
    ];
    const rows = analyzedSegments.map((s) => [
      s.id,
      `"${s.name}"`,
      `"${s.district}"`,
      s.coords[0],
      s.coords[1],
      s.orientationDeg,
      s.H,
      s.W,
      s.aspectRatio,
      s.attackAngleDeg,
      `"${s.regimeLabel}"`,
      s.ici,
      `"${s.levelLabel}"`,
      s.no2AmplificationFactor,
      s.estimatedNO2ppb,
      s.trafficVehDay
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Malaga_Urban_Canyon_Criticality_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a GeoJSON
  const handleExportGeoJSON = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: analyzedSegments.map((s) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.coords[1], s.coords[0]]
        },
        properties: {
          id: s.id,
          name: s.name,
          district: s.district,
          H: s.H,
          W: s.W,
          aspectRatio: s.aspectRatio,
          attackAngleDeg: s.attackAngleDeg,
          regime: s.regime,
          ici: s.ici,
          level: s.level,
          estimatedNO2: s.estimatedNO2ppb,
          aadt: s.trafficVehDay
        }
      }))
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Malaga_Canyon_Criticality_${new Date().toISOString().slice(0, 10)}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Escáner Predictivo de Cañones Críticos y Confinamiento Urbano"
      subtitle="Algoritmo de clasificación de regímenes de Oke (1987) e Índice de Confinamiento (ICI) en Málaga"
      icon={<ShieldAlert className="w-5 h-5 text-amber-400" />}
      badge={<span className="px-2 py-0.5 text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/50">OKE 1987 + FAIRMODE</span>}
      onClose={onClose}
      className="w-full max-w-5xl max-h-[88vh]"
      headerColorClass="text-amber-400"
      borderColorClass="border-amber-600/60"
    >
      <div className="flex flex-col gap-4 p-4 text-xs font-mono bg-slate-950/95 text-slate-200 overflow-y-auto max-h-[75vh]">
        
        {/* PANEL SUPERIOR: CONTROLES METEOROLÓGICOS Y SÍNTESIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-black/60 border border-slate-800">
          
          {/* Velocidad y Dirección del viento */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Viento Sinóptico Málaga
              </span>
              <ScientificTooltip content="Velocidad del viento a cota de tejado (U_roof) según AEMET / CAMS en la bahía de Málaga.">
                <span className="text-[10px] text-cyan-400">{simulatedWindSpeed.toFixed(1)} m/s ({simulatedWindDir}°)</span>
              </ScientificTooltip>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 w-12">Velocidad:</span>
              <input 
                type="range" 
                min="0.5" 
                max="12.0" 
                step="0.2"
                value={simulatedWindSpeed}
                onChange={(e) => setSimulatedWindSpeed(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-bold">{simulatedWindSpeed.toFixed(1)} m/s</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 w-12">Azimut:</span>
              <input 
                type="range" 
                min="0" 
                max="355" 
                step="5"
                value={simulatedWindDir}
                onChange={(e) => setSimulatedWindDir(parseInt(e.target.value))}
                className="flex-1 accent-amber-500 h-1.5 bg-slate-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-bold">{simulatedWindDir}°</span>
            </div>
          </div>

          {/* Estadísticas globales de criticidad */}
          <div className="flex flex-col justify-center gap-1.5 px-3 border-l border-r border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Semáforo de Confinamiento</div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="p-1 bg-emerald-950/40 border border-emerald-700/40">
                <div className="text-[11px] font-bold text-emerald-400">
                  {analyzedSegments.filter(s => s.level === 'low').length}
                </div>
                <div className="text-[8px] text-emerald-500/80 uppercase">Óptimo</div>
              </div>
              <div className="p-1 bg-amber-950/40 border border-amber-700/40">
                <div className="text-[11px] font-bold text-amber-400">
                  {analyzedSegments.filter(s => s.level === 'moderate').length}
                </div>
                <div className="text-[8px] text-amber-500/80 uppercase">Mod.</div>
              </div>
              <div className="p-1 bg-orange-950/40 border border-orange-700/40">
                <div className="text-[11px] font-bold text-orange-400">
                  {analyzedSegments.filter(s => s.level === 'high').length}
                </div>
                <div className="text-[8px] text-orange-500/80 uppercase">Alto</div>
              </div>
              <div className="p-1 bg-rose-950/40 border border-rose-700/40">
                <div className="text-[11px] font-bold text-rose-400">
                  {analyzedSegments.filter(s => s.level === 'critical').length}
                </div>
                <div className="text-[8px] text-rose-500/80 uppercase">Crítico</div>
              </div>
            </div>
          </div>

          {/* Botones de acción y filtros */}
          <div className="flex flex-col justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="flex-1 bg-black text-[10px] text-slate-300 border border-slate-700 p-1"
              >
                <option value="all">Todos los distritos</option>
                <option value="Centro Histórico">Centro Histórico</option>
                <option value="Carretera de Cádiz">Carretera de Cádiz</option>
                <option value="Cruz de Humilladero">Cruz de Humilladero</option>
                <option value="Centro - Puerto">Centro - Puerto</option>
                <option value="Bailén-Miraflores">Bailén-Miraflores</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ScientificTooltip content="Exportar matriz completa de cañones y factores de confinamiento a formato CSV estandarizado.">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 py-1 px-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  CSV
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Exportar los ejes de cañón urbano con sus métricas microclimáticas en formato GeoJSON abierto.">
                <button
                  onClick={handleExportGeoJSON}
                  className="flex-1 py-1 px-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  GeoJSON
                </button>
              </ScientificTooltip>
            </div>
          </div>
        </div>

        {/* LISTADO Y TABLA DE CAÑONES EVALUADOS */}
        <div className="border border-slate-800 bg-black/40 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[9px] uppercase text-slate-400 tracking-wider">
                <th className="p-2">Cañón Urbano / Vía</th>
                <th className="p-2 text-center">H / W (m)</th>
                <th className="p-2 text-center">Relación H/W</th>
                <th className="p-2 text-center">Ángulo Ataque (θ)</th>
                <th className="p-2">Régimen Oke (1987)</th>
                <th className="p-2 text-center">Índice Confinamiento (ICI)</th>
                <th className="p-2 text-center">Amp. NO₂</th>
                <th className="p-2 text-right">Semáforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[10px]">
              {filteredSegments.map((canyon) => (
                <tr key={canyon.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-2 font-medium text-slate-200">
                    <div>{canyon.name}</div>
                    <div className="text-[8px] text-slate-500">{canyon.district} · Azimut {canyon.orientationDeg}°</div>
                  </td>
                  
                  <td className="p-2 text-center text-slate-400">
                    {canyon.H}m / {canyon.W}m
                  </td>

                  <td className="p-2 text-center font-bold text-slate-300">
                    {canyon.aspectRatio.toFixed(2)}
                  </td>

                  <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                      canyon.attackAngleDeg > 60 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50' 
                        : canyon.attackAngleDeg < 25 
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                    }`}>
                      {canyon.attackAngleDeg}°
                    </span>
                  </td>

                  <td className="p-2">
                    <div className="text-[9px] text-slate-300 font-semibold">{canyon.regimeLabel}</div>
                    <div className="text-[8px] text-slate-500">
                      {canyon.regime === 'skimming' && 'Vórtice recirculante cerrado con acumulación de leeward'}
                      {canyon.regime === 'wake' && 'Vórtices secundarios con arrastre descendente intermitente'}
                      {canyon.regime === 'isolated' && 'Desprendimiento libre sin interferencia de fachada opuesta'}
                      {canyon.regime === 'channeling' && 'Ventilación forzada longitudinal a lo largo del cañón'}
                    </div>
                  </td>

                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            canyon.ici > 75 ? 'bg-rose-500' : canyon.ici > 50 ? 'bg-orange-500' : canyon.ici > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${canyon.ici}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-200">{canyon.ici}</span>
                    </div>
                  </td>

                  <td className="p-2 text-center font-mono font-bold text-amber-400">
                    +{Math.round((canyon.no2AmplificationFactor - 1) * 100)}%
                  </td>

                  <td className="p-2 text-right">
                    <span className={`px-2 py-0.5 text-[8px] font-bold border uppercase tracking-wider ${canyon.badgeColor}`}>
                      {canyon.levelLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTA CIENTÍFICA Y REFERENCIAS */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 text-[9px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-300">Fundamentación Teórica (Oke 1987 & Vardoulakis et al. 2003):</span>{' '}
            El confinamiento de emisiones primarias en cañón urbano depende no linealmente de la relación de aspecto <strong>H/W</strong> y del ángulo de ataque <strong>θ</strong>. Cuando <strong>θ → 90°</strong> y <strong>H/W ≥ 0.65</strong>, se establece el régimen de <em>Skimming Flow</em>, formándose un vórtice estable que aísla la masa de aire de la calle de la corriente sinóptica de tejado, provocando que la concentración en la acera de sotavento (<em>leeward</em>) se multiplique por factores superiores a <strong>2.5×</strong>.
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
};
