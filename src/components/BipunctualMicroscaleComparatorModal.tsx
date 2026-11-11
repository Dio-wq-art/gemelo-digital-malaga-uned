import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  MapPin, 
  Building2, 
  Activity, 
  Wind, 
  Atom, 
  HeartPulse, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Share2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { assimilatePointInRealtime } from '../lib/spatialAssimilation';
import { wgs84ToUtm30N } from '../lib/geodesy';

interface BipunctualComparatorPreset {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  archetype: string;
  typicalH: number;
  typicalW: number;
}

const COMPARISON_PRESETS: BipunctualComparatorPreset[] = [
  {
    id: 'larios',
    name: 'Calle Marqués de Larios',
    district: 'Centro Histórico',
    lat: 36.7202,
    lon: -4.4214,
    archetype: 'Cañón Profundo Peatonal Comercial (Oke: Skimming Flow)',
    typicalH: 22.0,
    typicalW: 14.0
  },
  {
    id: 'andalucia',
    name: 'Avenida de Andalucía',
    district: 'Cruz de Humilladero',
    lat: 36.7165,
    lon: -4.4350,
    archetype: 'Arteria de Tráfico Pesado / Cañón Intermedio',
    typicalH: 25.0,
    typicalW: 42.0
  },
  {
    id: 'parque',
    name: 'Paseo del Parque',
    district: 'Centro / Litoral',
    lat: 36.7185,
    lon: -4.4150,
    archetype: 'Bulevar Botánico Abierto (Alta Deposición Wesely)',
    typicalH: 12.0,
    typicalW: 45.0
  },
  {
    id: 'atabal',
    name: 'El Atabal / Montes de Málaga',
    district: 'Puerto de la Torre',
    lat: 36.7410,
    lon: -4.4680,
    archetype: 'Fondo Periurbano (Alto O₃, Baja Titración)',
    typicalH: 8.0,
    typicalW: 24.0
  },
  {
    id: 'puerto',
    name: 'Muelle de Levante / Puerto',
    district: 'Zona Portuaria',
    lat: 36.7120,
    lon: -4.4140,
    archetype: 'Foco de Emisión Pesada Marítima (SO₂ & Cruceros)',
    typicalH: 10.0,
    typicalW: 65.0
  },
  {
    id: 'pta',
    name: 'Parque Tecnológico de Andalucía',
    district: 'Campanillas',
    lat: 36.7320,
    lon: -4.5530,
    archetype: 'Campus Periurbano Tecnológico Disperso',
    typicalH: 14.0,
    typicalW: 38.0
  }
];

interface BipunctualMicroscaleComparatorModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onNavigateToPoint?: (lat: number, lon: number, name: string) => void;
}

export const BipunctualMicroscaleComparatorModal: React.FC<BipunctualMicroscaleComparatorModalProps> = ({
  isOpen = true,
  onClose,
  onNavigateToPoint
}) => {
  const activePointCtx = useActivePoint();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('parque');
  const [copiedType, setCopiedType] = useState<'csv' | 'latex' | null>(null);

  if (!isOpen || !activePointCtx) return null;

  const { activePoint, assimilation, data, location, syncActivePoint } = activePointCtx;

  // Punto A: Punto Activo actual del sistema
  const latA = location?.lat || 36.7213;
  const lonA = location?.lon || -4.4214;
  const utmA = useMemo(() => wgs84ToUtm30N(lonA, latA), [latA, lonA]);

  const nameA = activePoint?.name || 'Punto Activo A';
  const districtA = activePoint?.districtName || activePoint?.neighborhoodName || 'Málaga';

  const no2A = assimilation?.no2PedestrianLevel1_8mUgM3 ?? (data.no2_satelite_base || 24.5);
  const noA = assimilation?.noEstimatedUgM3 ?? Math.max(1.5, no2A * 0.28);
  const o3A = assimilation?.ozoneO3UgM3 ?? (data.ozone || 48.0);
  const pm25A = assimilation?.pm25UgM3 ?? (data.pm2_5 || 8.5);
  const pm10A = assimilation?.pm10UgM3 ?? (data.pm10 || 18.0);
  const so2A = 4.2;

  const hwA = assimilation?.aspectRatioHw ?? 1.45;
  const hA = hwA >= 1.0 ? 22.0 : 14.0;
  const wA = hwA > 0 ? hA / hwA : 14.5;
  const regimeA = hwA >= 0.65 ? 'Skimming Flow (Rasante)' : hwA >= 0.30 ? 'Wake Interference' : 'Isolated Roughness';
  const achA = Number(((Math.max(0.5, ((data.velocidad_viento_km_h || 12) / 3.6) * 0.45) * wA * 3600) / (hA * wA)).toFixed(1));

  const phiLeightonA = useMemo(() => {
    const tk = (data.temperatura_malaga || 23.5) + 273.15;
    const k3 = 1.4e-12 * Math.exp(-1310 / tk) * ((101325 / (8.314 * tk)) * 6.022e23 * 1e-15);
    const jNo2 = Math.max(0.001, ((data.shortwave_radiation || 650) / 800) * 0.0065);
    return Number(((jNo2 * Math.max(0.5, no2A / 1.88)) / (k3 * Math.max(0.5, noA / 1.23) * Math.max(1.0, o3A / 2.00))).toFixed(2));
  }, [data, no2A, noA, o3A]);

  const dosisA = Number((no2A * 0.83).toFixed(1));

  // Punto B: Seleccionado del listado de presets
  const selectedPreset = useMemo(() => {
    return COMPARISON_PRESETS.find(p => p.id === selectedPresetId) || COMPARISON_PRESETS[0];
  }, [selectedPresetId]);

  const stateB = useMemo(() => {
    return assimilatePointInRealtime(selectedPreset.lat, selectedPreset.lon, data, {
      name: selectedPreset.name,
      districtName: selectedPreset.district
    });
  }, [selectedPreset, data]);

  const latB = selectedPreset.lat;
  const lonB = selectedPreset.lon;
  const utmB = useMemo(() => wgs84ToUtm30N(lonB, latB), [latB, lonB]);
  const nameB = selectedPreset.name;
  const districtB = selectedPreset.district;

  const no2B = stateB?.no2PedestrianLevel1_8mUgM3 ?? 18.0;
  const noB = stateB?.noEstimatedUgM3 ?? 4.0;
  const o3B = stateB?.ozoneO3UgM3 ?? 55.0;
  const pm25B = stateB?.pm25UgM3 ?? 7.0;
  const pm10B = stateB?.pm10UgM3 ?? 15.0;
  const so2B = selectedPreset.id === 'puerto' ? 14.5 : 3.8;

  const hB = selectedPreset.typicalH;
  const wB = selectedPreset.typicalW;
  const hwB = wB > 0 ? hB / wB : 0.45;
  const regimeB = hwB >= 0.65 ? 'Skimming Flow (Rasante)' : hwB >= 0.30 ? 'Wake Interference' : 'Isolated Roughness';
  const achB = Number(((Math.max(0.5, ((data.velocidad_viento_km_h || 12) / 3.6) * 0.45) * wB * 3600) / (hB * wB)).toFixed(1));

  const phiLeightonB = useMemo(() => {
    const tk = (data.temperatura_malaga || 23.5) + 273.15;
    const k3 = 1.4e-12 * Math.exp(-1310 / tk) * ((101325 / (8.314 * tk)) * 6.022e23 * 1e-15);
    const jNo2 = Math.max(0.001, ((data.shortwave_radiation || 650) / 800) * 0.0065);
    return Number(((jNo2 * Math.max(0.5, no2B / 1.88)) / (k3 * Math.max(0.5, noB / 1.23) * Math.max(1.0, o3B / 2.00))).toFixed(2));
  }, [data, no2B, noB, o3B]);

  const dosisB = Number((no2B * 0.83).toFixed(1));

  // Diferenciales (B - A)
  const deltaNO2 = Number((no2B - no2A).toFixed(1));
  const pctNO2 = Number((((no2B - no2A) / Math.max(0.1, no2A)) * 100).toFixed(1));

  const deltaO3 = Number((o3B - o3A).toFixed(1));
  const pctO3 = Number((((o3B - o3A) / Math.max(0.1, o3A)) * 100).toFixed(1));

  const deltaPM25 = Number((pm25B - pm25A).toFixed(1));
  const deltaDosis = Number((dosisB - dosisA).toFixed(1));
  const pctDosis = Number((((dosisB - dosisA) / Math.max(0.1, dosisA)) * 100).toFixed(1));

  // Exportación
  const generateCsv = () => {
    const headers = 'Variable,Punto_A,Punto_B,Delta_B_menos_A,Pct_Variacion';
    const rows = [
      `Nombre,"${nameA}","${nameB}",---,---`,
      `Distrito,"${districtA}","${districtB}",---,---`,
      `WGS84_Lat,${latA.toFixed(5)},${latB.toFixed(5)},${(latB - latA).toFixed(5)},---`,
      `WGS84_Lon,${lonA.toFixed(5)},${lonB.toFixed(5)},${(lonB - lonA).toFixed(5)},---`,
      `UTM30N_X_m,${utmA.x.toFixed(1)},${utmB.x.toFixed(1)},${(utmB.x - utmA.x).toFixed(1)},---`,
      `UTM30N_Y_m,${utmA.y.toFixed(1)},${utmB.y.toFixed(1)},${(utmB.y - utmA.y).toFixed(1)},---`,
      `Canyon_H_m,${hA.toFixed(1)},${hB.toFixed(1)},${(hB - hA).toFixed(1)},---`,
      `Canyon_W_m,${wA.toFixed(1)},${wB.toFixed(1)},${(wB - wA).toFixed(1)},---`,
      `Canyon_HW,${hwA.toFixed(2)},${hwB.toFixed(2)},${(hwB - hwA).toFixed(2)},---`,
      `Ventilacion_ACH_h_inv,${achA},${achB},${(achB - achA).toFixed(1)},---`,
      `NO2_ug_m3,${no2A.toFixed(1)},${no2B.toFixed(1)},${deltaNO2},${pctNO2}%`,
      `O3_ug_m3,${o3A.toFixed(1)},${o3B.toFixed(1)},${deltaO3},${pctO3}%`,
      `PM25_ug_m3,${pm25A.toFixed(1)},${pm25B.toFixed(1)},${deltaPM25},---`,
      `SO2_ug_m3,${so2A.toFixed(1)},${so2B.toFixed(1)},${(so2B - so2A).toFixed(1)},---`,
      `Phi_Leighton,${phiLeightonA},${phiLeightonB},${(phiLeightonB - phiLeightonA).toFixed(2)},---`,
      `Dosis_NO2_ug_h,${dosisA},${dosisB},${deltaDosis},${pctDosis}%`
    ];
    return `${headers}\n${rows.join('\n')}\n`;
  };

  const generateLatex = () => {
    return `% -------------------------------------------------------------
% TABLA COMPARATIVA BIPUNTUAL DE MICROESCALA (TESIS DOCTORAL)
% Contraste de Cañones Urbanos y Calidad del Aire en Málaga
% -------------------------------------------------------------
\\begin{table}[htbp]
\\centering
\\small
\\caption{Contraste Microescalar y Cinético: ${nameA} (Punto A) vs ${nameB} (Punto B)}
\\label{tab:comparativa_${latA.toFixed(3)}_${latB.toFixed(3)}}
\\begin{tabular}{lrrrr}
\\hline
\\textbf{Parámetro Microescalar} & \\textbf{Punto A (In Situ)} & \\textbf{Punto B (${nameB})} & \\textbf{Diferencial $\\Delta$} & \\textbf{Variación} \\\\
\\hline
Aspect Ratio $H/W$ (Oke 1987) & ${hwA.toFixed(2)} & ${hwB.toFixed(2)} & ${(hwB - hwA).toFixed(2)} & --- \\\\
Régimen Fluidodinámico & \\multicolumn{2}{c}{${regimeA} vs ${regimeB}} & --- & --- \\\\
Tasa de Ventilación $\\text{ACH}$ ($\\text{h}^{-1}$) & ${achA} & ${achB} & ${(achB - achA).toFixed(1)} & --- \\\\
\\hline
Concentración $[\\text{NO}_2]$ ($\\mu\\text{g/m}^3$) & ${no2A.toFixed(1)} & ${no2B.toFixed(1)} & ${deltaNO2 > 0 ? `+${deltaNO2}` : deltaNO2} & ${pctNO2}\\% \\\\
Concentración $[\\text{O}_3]$ ($\\mu\\text{g/m}^3$) & ${o3A.toFixed(1)} & ${o3B.toFixed(1)} & ${deltaO3 > 0 ? `+${deltaO3}` : deltaO3} & ${pctO3}\\% \\\\
Aerosol Fino $[\\text{PM}_{2.5}]$ ($\\mu\\text{g/m}^3$) & ${pm25A.toFixed(1)} & ${pm25B.toFixed(1)} & ${deltaPM25 > 0 ? `+${deltaPM25}` : deltaPM25} & --- \\\\
Dióxido de Azufre $[\\text{SO}_2]$ ($\\mu\\text{g/m}^3$) & ${so2A.toFixed(1)} & ${so2B.toFixed(1)} & ${(so2B - so2A).toFixed(1)} & --- \\\\
\\hline
Ratio de Leighton $\\Phi$ & ${phiLeightonA} & ${phiLeightonB} & ${(phiLeightonB - phiLeightonA).toFixed(2)} & --- \\\\
Dosis Peatonal Inhalada ($\\mu\\text{g NO}_2/\\text{h}$) & ${dosisA} & ${dosisB} & ${deltaDosis > 0 ? `+${deltaDosis}` : deltaDosis} & ${pctDosis}\\% \\\\
\\hline
\\end{tabular}
\\end{table}`;
  };

  const handleCopy = (type: 'csv' | 'latex') => {
    const content = type === 'csv' ? generateCsv() : generateLatex();
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadCsv = () => {
    const content = generateCsv();
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparador_${nameA.replace(/\s+/g, '_')}_vs_${nameB.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSwapPoints = () => {
    // Sincronizar el Punto B en el contexto global convirtiéndolo en Punto A
    syncActivePoint(latB, lonB, { name: nameB, fly: true });
  };

  return (
    <DraggableWindow
      title="COMPARADOR MICROESCALAR BIPUNTUAL (PUNTO A vs PUNTO B)"
      subtitle="Contraste simultáneo de cañones urbanos, cinética de Leighton, ventilación y dosis inhalada"
      icon={<ArrowLeftRight className="w-4 h-4 text-cyan-400" />}
      onClose={onClose}
      className="w-full max-w-4xl max-h-[90vh]"
      initialPositionClass="top-12 left-1/2 -translate-x-1/2"
      defaultCollapsed={false}
    >
      <div className="p-4 overflow-y-auto max-h-[78vh] space-y-4 font-sans text-slate-200">
        
        {/* Selector de Presets Emblemáticos de Málaga para Punto B */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-md space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Seleccionar Arquetipo Urbano para Punto B:</span>
            </div>

            <div className="flex items-center gap-2">
              <ScientificTooltip content="Promover el Punto B seleccionado para que sea el nuevo Punto Activo Principal en todo el Gemelo Digital y mapa 3D.">
                <button
                  onClick={handleSwapPoints}
                  className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 rounded text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                  <span>Fijar B como Activo Principal</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1">
            {COMPARISON_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <ScientificTooltip
                  key={preset.id}
                  content={`${preset.name} (${preset.district}): H/W = ${(preset.typicalH / preset.typicalW).toFixed(2)}. ${preset.archetype}`}
                >
                  <button
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`w-full p-2 rounded text-left transition-all border cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-500/50' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold truncate">{preset.name}</div>
                    <div className="text-[8.5px] opacity-75 truncate">{preset.district}</div>
                    <div className="text-[7.5px] font-mono text-cyan-400 mt-1">H/W: {(preset.typicalH / preset.typicalW).toFixed(2)}</div>
                  </button>
                </ScientificTooltip>
              );
            })}
          </div>
        </div>

        {/* Tarjetas Comparativas de Cabecera A vs B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Tarjeta Punto A */}
          <div className="bg-slate-950/80 border-2 border-sky-600/50 p-3 rounded-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-sky-900/60 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-900/80 border border-sky-500 text-sky-200 flex items-center justify-center font-bold text-xs">
                  A
                </span>
                <div>
                  <div className="text-[9px] font-mono text-sky-400 uppercase font-bold">PUNTO ACTIVO IN SITU</div>
                  <div className="text-xs font-bold text-slate-100">{nameA}</div>
                </div>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400">
                <div>WGS84: {latA.toFixed(4)}°, {lonA.toFixed(4)}°</div>
                <div>UTM: {utmA.x.toFixed(0)}, {utmA.y.toFixed(0)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">NO₂</div>
                <div className="text-sm font-bold text-sky-300">{no2A.toFixed(1)} <span className="text-[8px] font-normal">µg</span></div>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">O₃</div>
                <div className="text-sm font-bold text-teal-300">{o3A.toFixed(1)} <span className="text-[8px] font-normal">µg</span></div>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">Aspecto H/W</div>
                <div className="text-sm font-bold text-amber-300">{hwA.toFixed(2)}</div>
              </div>
            </div>

            <div className="text-[9.5px] font-mono text-slate-400 mt-2 bg-slate-900/50 p-1.5 rounded flex items-center justify-between">
              <span>Oke: <strong className="text-slate-200">{regimeA}</strong></span>
              <span>Ventilación: <strong className="text-cyan-300">{achA} h⁻¹</strong></span>
            </div>
          </div>

          {/* Tarjeta Punto B */}
          <div className="bg-slate-950/80 border-2 border-teal-600/50 p-3 rounded-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-teal-900/60 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-900/80 border border-teal-500 text-teal-200 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <div>
                  <div className="text-[9px] font-mono text-teal-400 uppercase font-bold">PUNTO DE CONTRASTE</div>
                  <div className="text-xs font-bold text-slate-100">{nameB}</div>
                </div>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-400">
                <div>WGS84: {latB.toFixed(4)}°, {lonB.toFixed(4)}°</div>
                <div>UTM: {utmB.x.toFixed(0)}, {utmB.y.toFixed(0)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">NO₂</div>
                <div className="text-sm font-bold text-sky-300">{no2B.toFixed(1)} <span className="text-[8px] font-normal">µg</span></div>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">O₃</div>
                <div className="text-sm font-bold text-teal-300">{o3B.toFixed(1)} <span className="text-[8px] font-normal">µg</span></div>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <div className="text-[8.5px] text-slate-400 uppercase">Aspecto H/W</div>
                <div className="text-sm font-bold text-amber-300">{hwB.toFixed(2)}</div>
              </div>
            </div>

            <div className="text-[9.5px] font-mono text-slate-400 mt-2 bg-slate-900/50 p-1.5 rounded flex items-center justify-between">
              <span>Oke: <strong className="text-slate-200">{regimeB}</strong></span>
              <span>Ventilación: <strong className="text-cyan-300">{achB} h⁻¹</strong></span>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Contraste Bipuntual y Diferenciales */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Matriz de Contraste y Variación Relativa (Δ = B - A)</span>
            </h3>

            <div className="flex items-center gap-2">
              <ScientificTooltip content="Copiar tabla en formato CSV con todas las variables pareadas.">
                <button
                  onClick={() => handleCopy('csv')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9.5px] font-mono flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                >
                  {copiedType === 'csv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'csv' ? '¡Copiado!' : 'Copiar CSV'}</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Copiar código LaTeX \begin{table} de la comparativa.">
                <button
                  onClick={() => handleCopy('latex')}
                  className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded text-[9.5px] font-mono flex items-center gap-1 cursor-pointer transition-colors border border-amber-800/80"
                >
                  {copiedType === 'latex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'latex' ? '¡LaTeX!' : 'Copiar LaTeX'}</span>
                </button>
              </ScientificTooltip>

              <ScientificTooltip content="Descargar archivo CSV compatible con Pandas, R y Excel.">
                <button
                  onClick={handleDownloadCsv}
                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[9.5px] font-mono flex items-center gap-1 cursor-pointer transition-colors border border-emerald-800/80"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Descargar CSV</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10.5px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[9.5px]">
                  <th className="py-1 px-2">VARIABLE</th>
                  <th className="py-1 px-2 text-sky-400">PUNTO A ({nameA.slice(0, 18)})</th>
                  <th className="py-1 px-2 text-teal-400">PUNTO B ({nameB.slice(0, 18)})</th>
                  <th className="py-1 px-2 text-right">DIFERENCIAL (Δ)</th>
                  <th className="py-1 px-2 text-right">VARIACIÓN %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-slate-300">NO₂ (Dióxido de Nitrógeno)</td>
                  <td className="py-1.5 px-2 font-bold text-sky-300">{no2A.toFixed(1)} µg/m³</td>
                  <td className="py-1.5 px-2 font-bold text-teal-300">{no2B.toFixed(1)} µg/m³</td>
                  <td className={`py-1.5 px-2 font-bold text-right ${deltaNO2 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaNO2 > 0 ? `+${deltaNO2}` : deltaNO2} µg
                  </td>
                  <td className={`py-1.5 px-2 font-bold text-right ${pctNO2 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pctNO2 > 0 ? `+${pctNO2}%` : `${pctNO2}%`}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-slate-300">O₃ (Ozono Troposférico)</td>
                  <td className="py-1.5 px-2 font-bold text-sky-300">{o3A.toFixed(1)} µg/m³</td>
                  <td className="py-1.5 px-2 font-bold text-teal-300">{o3B.toFixed(1)} µg/m³</td>
                  <td className={`py-1.5 px-2 font-bold text-right ${deltaO3 <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {deltaO3 > 0 ? `+${deltaO3}` : deltaO3} µg
                  </td>
                  <td className={`py-1.5 px-2 font-bold text-right ${pctO3 <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {pctO3 > 0 ? `+${pctO3}%` : `${pctO3}%`}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-slate-300">PM₂.₅ (Aerosoles Finos)</td>
                  <td className="py-1.5 px-2 font-bold text-sky-300">{pm25A.toFixed(1)} µg/m³</td>
                  <td className="py-1.5 px-2 font-bold text-teal-300">{pm25B.toFixed(1)} µg/m³</td>
                  <td className={`py-1.5 px-2 font-bold text-right ${deltaPM25 <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaPM25 > 0 ? `+${deltaPM25}` : deltaPM25} µg
                  </td>
                  <td className="py-1.5 px-2 font-bold text-right text-slate-400">
                    {pm25A > 0 ? `${(((pm25B - pm25A) / pm25A) * 100).toFixed(1)}%` : '---'}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 text-slate-400">SO₂ (Dióxido de Azufre)</td>
                  <td className="py-1.5 px-2 text-slate-300">{so2A.toFixed(1)} µg/m³</td>
                  <td className="py-1.5 px-2 text-slate-300">{so2B.toFixed(1)} µg/m³</td>
                  <td className="py-1.5 px-2 text-right text-slate-400">
                    {(so2B - so2A) > 0 ? `+${(so2B - so2A).toFixed(1)}` : (so2B - so2A).toFixed(1)} µg
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">---</td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-amber-400">Aspect Ratio Oke (H/W)</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{hwA.toFixed(2)}</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{hwB.toFixed(2)}</td>
                  <td className="py-1.5 px-2 font-bold text-right text-amber-400">
                    {(hwB - hwA) > 0 ? `+${(hwB - hwA).toFixed(2)}` : (hwB - hwA).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">---</td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-cyan-400">Tasa de Ventilación (ACH)</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{achA} h⁻¹</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{achB} h⁻¹</td>
                  <td className={`py-1.5 px-2 font-bold text-right ${(achB - achA) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(achB - achA) > 0 ? `+${(achB - achA).toFixed(1)}` : (achB - achA).toFixed(1)} h⁻¹
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">---</td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-1.5 px-2 font-bold text-emerald-400">Ratio Leighton Φ</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{phiLeightonA}</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200">{phiLeightonB}</td>
                  <td className="py-1.5 px-2 text-right text-slate-300">
                    {(phiLeightonB - phiLeightonA) > 0 ? `+${(phiLeightonB - phiLeightonA).toFixed(2)}` : (phiLeightonB - phiLeightonA).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400">---</td>
                </tr>

                <tr className="hover:bg-slate-900/40 bg-purple-950/20">
                  <td className="py-1.5 px-2 font-bold text-purple-300">Dosis Peatonal ICRP-66</td>
                  <td className="py-1.5 px-2 font-bold text-purple-200">{dosisA} µg NO₂/h</td>
                  <td className="py-1.5 px-2 font-bold text-purple-200">{dosisB} µg NO₂/h</td>
                  <td className={`py-1.5 px-2 font-bold text-right ${deltaDosis <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaDosis > 0 ? `+${deltaDosis}` : deltaDosis} µg/h
                  </td>
                  <td className={`py-1.5 px-2 font-bold text-right ${pctDosis <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pctDosis > 0 ? `+${pctDosis}%` : `${pctDosis}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Síntesis Científica para la Tesis */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded space-y-1.5 text-[10.5px] font-sans">
          <div className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Conclusión Analítica para la Memoria Doctoral:</span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            {deltaNO2 < 0 ? (
              <>
                El tránsito peatonal por <strong>{nameB}</strong> reduce la exposición humana a dióxido de nitrógeno en un <strong>{Math.abs(pctNO2)}%</strong> respecto a <strong>{nameA}</strong> ({no2B.toFixed(1)} vs {no2A.toFixed(1)} µg/m³), disminuyendo la dosis inhalada horaria en <strong>{Math.abs(deltaDosis)} µg NO₂/h</strong> según la formulación ICRP-66.
              </>
            ) : (
              <>
                <strong>{nameB}</strong> presenta una mayor acumulación de NO₂ (+{pctNO2}%) debido a {hwB >= 0.65 ? 'la formación de un vórtice de cavidad cerrado (Oke Skimming Flow)' : 'mayor densidad de combustión primaria'}, elevando la dosis horaria inhalada en <strong>+{deltaDosis} µg NO₂/h</strong>.
              </>
            )}
            {' '}
            {deltaO3 > 0 ? (
              <>
                No obstante, en {nameB} se observa un incremento del ozono troposférico (+{pctO3}%), atribuible a una menor titración por NO vehicular y mayor penetración solar diurna (SVF superior).
              </>
            ) : (
              <>
                El ozono se mantiene inferior en {nameB} debido a la titración acelerada con monóxido de nitrógeno fresco (NO + O₃ → NO₂ + O₂).
              </>
            )}
          </p>
        </div>

      </div>
    </DraggableWindow>
  );
};
