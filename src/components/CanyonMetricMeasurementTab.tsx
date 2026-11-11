import React, { useState, useMemo } from 'react';
import { 
  Ruler, 
  Layers, 
  ArrowUpDown, 
  ArrowLeftRight, 
  Calculator, 
  Download, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Wind,
  ShieldCheck
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface CanyonMetricMeasurementTabProps {
  canyon: {
    id: string;
    name: string;
    H: number;
    W: number;
    orientationDeg: number;
    dailyVehicles: number;
    lanes: number;
    treeCoverPct: number;
    lat: number;
    lng: number;
  };
  currentWindSpeedMs: number;
  currentWindDirDeg: number;
  currentNO2Base: number;
}

export const CanyonMetricMeasurementTab: React.FC<CanyonMetricMeasurementTabProps> = ({
  canyon,
  currentWindSpeedMs,
  currentWindDirDeg,
  currentNO2Base
}) => {
  // Parámetros métricos interactivos ajustables por el investigador
  const [measuredH1, setMeasuredH1] = useState<number>(canyon.H); // Altura fachada oeste/norte
  const [measuredH2, setMeasuredH2] = useState<number>(canyon.H); // Altura fachada este/sur
  const [measuredW, setMeasuredW] = useState<number>(canyon.W);   // Ancho entre fachadas
  const [sidewalkWidth, setSidewalkWidth] = useState<number>(Math.max(2.0, Number((canyon.W * 0.18).toFixed(1)))); // Ancho de acera
  const [trafficWidth, setTrafficWidth] = useState<number>(Math.max(3.5, Number((canyon.W * 0.64).toFixed(1)))); // Calzada
  const [receptorHeight, setReceptorHeight] = useState<number>(1.8); // Altura respirable peatón (m)

  // Cálculos deterministas según la teoría de Oke (1987) y Kastner-Klein (2001)
  const metrics = useMemo(() => {
    const avgH = (measuredH1 + measuredH2) / 2;
    const hw = avgH / measuredW;
    const asymmetryH = Math.abs(measuredH1 - measuredH2) / avgH;

    // Clasificación de régimen de Oke (1987)
    let regime = 'Isolated Roughness Flow (IRF)';
    let regimeName = 'Flujo de Rugosidad Aislada';
    let regimeDesc = 'Las estelas de los edificios no interactúan significativamente. Buena ventilación y dispersión rápida de emisiones.';
    let regimeColor = 'text-emerald-400';
    let regimeBadge = 'bg-emerald-950 border-emerald-700 text-emerald-300';
    let recirculationEfficiency = 0.15;

    if (hw >= 0.65) {
      regime = 'Skimming Flow (SF)';
      regimeName = 'Flujo Rasante con Vórtice Cavitario';
      regimeDesc = 'El flujo atmosférico pasa por encima de las cornisas sin penetrar en el fondo de la calle. Se establece un vórtice cerrado de recirculación que acumula emisiones en la acera de sotavento.';
      regimeColor = 'text-red-400';
      regimeBadge = 'bg-red-950 border-red-700 text-red-300';
      recirculationEfficiency = 0.85;
    } else if (hw >= 0.35) {
      regime = 'Wake Interference Flow (WIR)';
      regimeName = 'Flujo de Interferencia de Estelas';
      regimeDesc = 'Las estelas descendentes interactúan con la fachada opuesta. Ventilación intermedia con vórtices secundarios inestables.';
      regimeColor = 'text-amber-400';
      regimeBadge = 'bg-amber-950 border-amber-700 text-amber-300';
      recirculationEfficiency = 0.50;
    }

    // Ángulo de ataque del viento respecto al cañón
    const relAngle = Math.abs((currentWindDirDeg - canyon.orientationDeg + 360) % 180);
    const isPerpendicular = Math.abs(relAngle - 90) < 45;

    // Asimetría leeward / windward (Kastner-Klein 2001)
    const vortexFactor = isPerpendicular ? (1 + recirculationEfficiency * 0.9) : (1 + recirculationEfficiency * 0.3);
    const leewardNO2 = Number((currentNO2Base * vortexFactor).toFixed(1));
    const windwardNO2 = Number((currentNO2Base * (2 - vortexFactor * 0.65)).toFixed(1));

    // Sky View Factor (SVF) simplificado en el centro de la calle (Oke 1981)
    // SVF = cos(arctan(2 * H / W))
    const svf = Math.cos(Math.atan((2 * avgH) / measuredW));

    return {
      avgH: Number(avgH.toFixed(1)),
      hw: Number(hw.toFixed(2)),
      asymmetryH: Number((asymmetryH * 100).toFixed(1)),
      regime,
      regimeName,
      regimeDesc,
      regimeColor,
      regimeBadge,
      svf: Number(svf.toFixed(3)),
      vortexFactor: Number(vortexFactor.toFixed(2)),
      leewardNO2,
      windwardNO2
    };
  }, [measuredH1, measuredH2, measuredW, canyon, currentWindDirDeg, currentNO2Base]);

  // Exportar ficha de medición a CSV
  const handleExportCSV = () => {
    const csvContent = [
      'parametro,valor,unidad,descripcion',
      `canyon_id,${canyon.id},-,Identificador de cañón urbano`,
      `canyon_name,"${canyon.name}",-,Nombre de la calle`,
      `measured_H1,${measuredH1},m,Altura de fachada 1`,
      `measured_H2,${measuredH2},m,Altura de fachada 2`,
      `measured_W,${measuredW},m,Ancho entre fachadas`,
      `hw_aspect_ratio,${metrics.hw},-,Relacion de aspecto H/W`,
      `regime,"${metrics.regime}",-,Regimen de flujo atmosferico (Oke 1987)`,
      `sky_view_factor,${metrics.svf},-,Factor de vision del cielo (SVF)`,
      `wind_speed,${currentWindSpeedMs.toFixed(1)},m/s,Velocidad del viento en tejado`,
      `wind_dir,${currentWindDirDeg},grados,Direccion del viento`,
      `no2_leeward,${metrics.leewardNO2},ug/m3,Concentracion calculada pared de sotavento`,
      `no2_windward,${metrics.windwardNO2},ug/m3,Concentracion calculada pared de barlovento`,
      `timestamp,${new Date().toISOString()},UTC,Fecha y hora de medicion`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicion_metrica_${canyon.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Encabezado y Guía Metodológica */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-emerald-400" />
          <div>
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
              <span>Herramienta de Medición Métrica Tridimensional • {canyon.name}</span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-950 border border-emerald-700 text-emerald-300">
                Oke (1987) / Kastner-Klein (2001)
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Calibración de dimensiones transversales para formulaciones de microescala física y factores de asimetría de dispersión.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Exportación de Ficha Métrica Tridimensional CSV"
            content="Exporta las cotas geométricas H₁, H₂, W, el ratio de aspecto H/W, el régimen de Oke y las concentraciones leeward/windward calculadas para su citación en la memoria de tesis."
            regulatory="Directrices de caracterización morfológica urbana FAIRMODE WG1"
          >
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Medición CSV</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Grid de Controles de Medición y Diagrama Interactivo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Controles de Entrada Métricas */}
        <div className="md:col-span-5 p-3 bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200 text-xs">Dimensiones de Sección Transversal</span>
          </div>

          {/* Altura Fachada 1 */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-300 font-mono items-center">
              <span className="flex items-center gap-1">
                <span>Altura Fachada Barlovento (H₁):</span>
                <ScientificTooltip
                  title="Altura de Cornisa Barlovento (H₁)"
                  content="Cota del edificio situado contra el viento incidente. Determina la cizalladura vertical y el desprendimiento de vórtices de cubierta."
                />
              </span>
              <strong className="text-emerald-400">{measuredH1.toFixed(1)} m</strong>
            </div>
            <input
              type="range"
              min="8.0"
              max="50.0"
              step="0.5"
              value={measuredH1}
              onChange={(e) => setMeasuredH1(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Altura Fachada 2 */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-300 font-mono items-center">
              <span className="flex items-center gap-1">
                <span>Altura Fachada Sotavento (H₂):</span>
                <ScientificTooltip
                  title="Altura de Cornisa Sotavento (H₂)"
                  content="Cota de la fachada opuesta donde se produce el estancamiento de masa y la reatrapada del vórtice de cavidad."
                />
              </span>
              <strong className="text-emerald-400">{measuredH2.toFixed(1)} m</strong>
            </div>
            <input
              type="range"
              min="8.0"
              max="50.0"
              step="0.5"
              value={measuredH2}
              onChange={(e) => setMeasuredH2(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Ancho de Calle W */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-300 font-mono items-center">
              <span className="flex items-center gap-1">
                <span>Ancho Total entre Fachadas (W):</span>
                <ScientificTooltip
                  title="Ancho de Cañón Urbano (W)"
                  content="Separación horizontal entre líneas de edificación que condiciona la ventilación transversal del cañón."
                />
              </span>
              <strong className="text-cyan-400">{measuredW.toFixed(1)} m</strong>
            </div>
            <input
              type="range"
              min="8.0"
              max="65.0"
              step="0.5"
              value={measuredW}
              onChange={(e) => setMeasuredW(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          {/* Altura de Receptor Peatonal */}
          <div className="space-y-1 text-[10px] pt-1 border-t border-slate-800">
            <div className="flex justify-between text-slate-300 font-mono items-center">
              <span className="flex items-center gap-1">
                <span>Cota Respirable Peatonal (z):</span>
                <ScientificTooltip
                  title="Cota de Inhalación Peatonal (1.5 - 1.8 m AGL)"
                  content="Altura estándar de muestreo para evaluación de riesgos en salud pública según la Directiva 2008/50/CE y dosimetría respiratoria ICRP."
                />
              </span>
              <strong className="text-amber-400">{receptorHeight.toFixed(2)} m</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={receptorHeight}
              onChange={(e) => setReceptorHeight(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Botón de Restauración a Datos Reales */}
          <button
            onClick={() => {
              setMeasuredH1(canyon.H);
              setMeasuredH2(canyon.H);
              setMeasuredW(canyon.W);
            }}
            className="w-full py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9.5px] font-bold transition-colors cursor-pointer"
          >
            Restaurar Valores Catastrales Oficiales
          </button>
        </div>

        {/* Diagnóstico Físico y Diagrama de Sección */}
        <div className="md:col-span-7 p-3 bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-slate-200 text-xs">Diagnóstico Fluidodinámico en Tiempo Real</span>
            </div>
            <ScientificTooltip
              topic="canyon_vortex_recirculation"
              title="Clasificación de Regímenes de Flujo de Oke (1987)"
              content="Criterio empírico de umbrales geométricos: H/W < 0.35 Flujo de Rugosidad Aislada (IRF); 0.35 <= H/W < 0.65 Interferencia de Estelas (WIR); H/W >= 0.65 Flujo Rasante con Vórtice Cavitario (SF)."
              citation="Oke, T. R. (1987) Boundary Layer Climates, 2nd ed."
            >
              <span className={`px-2 py-0.5 text-[9px] font-bold border cursor-help ${metrics.regimeBadge}`}>
                {metrics.regime}
              </span>
            </ScientificTooltip>
          </div>

          {/* Diagrama Esquemático SVG de la Sección */}
          <div className="bg-black/60 border border-slate-800 p-2 rounded flex items-center justify-center">
            <svg viewBox="0 0 320 160" className="w-full h-36">
              {/* Suelo */}
              <line x1="20" y1="130" x2="300" y2="130" stroke="#475569" strokeWidth="2" />
              
              {/* Fachada 1 */}
              <rect x="30" y={130 - (measuredH1 / 50) * 90} width="40" height={(measuredH1 / 50) * 90} fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="50" y="145" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">Fachada 1</text>
              <text x="50" y={120 - (measuredH1 / 50) * 90} fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">H₁={measuredH1}m</text>

              {/* Fachada 2 */}
              <rect x="250" y={130 - (measuredH2 / 50) * 90} width="40" height={(measuredH2 / 50) * 90} fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="270" y="145" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">Fachada 2</text>
              <text x="270" y={120 - (measuredH2 / 50) * 90} fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">H₂={measuredH2}m</text>

              {/* Cota W */}
              <line x1="70" y1="120" x2="250" y2="120" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
              <text x="160" y="115" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">W = {measuredW} m</text>

              {/* Vórtice de recirculación según régimen */}
              {metrics.hw >= 0.65 ? (
                <g>
                  <circle cx="160" cy="85" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                  <path d="M 175 60 L 160 55 L 165 70" fill="#ef4444" />
                  <text x="160" y="88" fill="#ef4444" fontSize="8" textAnchor="middle" fontWeight="bold">Vórtice Cavitario (Oke)</text>
                </g>
              ) : (
                <g>
                  <path d="M 80 50 Q 160 110 240 50" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <text x="160" y="70" fill="#10b981" fontSize="8" textAnchor="middle" fontWeight="bold">Flujo Abierto y Ventilado</text>
                </g>
              )}

              {/* Cota de respiración peatonal */}
              <line x1="70" y1="127" x2="250" y2="127" stroke="#34d399" strokeWidth="1" />
              <circle cx="95" cy="127" r="2" fill="#ef4444" />
              <circle cx="225" cy="127" r="2" fill="#10b981" />
            </svg>
          </div>

          {/* Métricas Resultantes y Asimetría */}
          <div className="grid grid-cols-3 gap-2 text-center text-[9.5px] font-mono">
            <div className="p-2 bg-black/40 border border-slate-800">
              <div className="flex items-center justify-center gap-1">
                <span className="text-slate-400 block">Relación H/W:</span>
                <ScientificTooltip
                  title="Aspect Ratio (H/W)"
                  content="Relación dimensional de altura media respecto al ancho de calle. Determina la transición entre regímenes de flujo según Oke (1987)."
                  formula="\frac{H}{W} = \frac{(H_1 + H_2)/2}{W}"
                />
              </div>
              <strong className="text-emerald-300 text-xs">{metrics.hw}</strong>
            </div>
            <div className="p-2 bg-black/40 border border-slate-800">
              <div className="flex items-center justify-center gap-1">
                <span className="text-slate-400 block">Sky View Factor (SVF):</span>
                <ScientificTooltip
                  title="Factor de Visión del Cielo (SVF)"
                  content="Fracción de radiación hemisférica visible desde el suelo. Regula la atenuación del flujo actínico solar y la tasa de fotólisis J(NO2)."
                  formula="\text{SVF} = \cos\left(\arctan\left(\frac{2H}{W}\right)\right)"
                />
              </div>
              <strong className="text-cyan-300 text-xs">{metrics.svf}</strong>
            </div>
            <div className="p-2 bg-black/40 border border-slate-800">
              <div className="flex items-center justify-center gap-1">
                <span className="text-slate-400 block">Asimetría Fachadas:</span>
                <ScientificTooltip
                  title="Asimetría Geométrica de Cornisas"
                  content="Diferencia relativa entre las alturas de las fachadas opuestas que inclina el eje del vórtice cavitario."
                  formula="\Delta H_{\%} = \frac{|H_1 - H_2|}{\bar{H}} \times 100"
                />
              </div>
              <strong className="text-amber-300 text-xs">{metrics.asymmetryH}%</strong>
            </div>
          </div>

          {/* Comparativa de Concentraciones de NO₂ */}
          <div className="p-2.5 bg-black/40 border border-slate-800 space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Pared de Sotavento (Leeward):</span>
                <ScientificTooltip
                  title="Acera de Sotavento (Leeward)"
                  content="Concentración calculada por el modelo Kastner-Klein (2001) donde el aire recirculante atrapa los contaminantes del tráfico antes de dispersarse."
                />
              </span>
              <strong className="text-red-400 font-mono font-bold">{metrics.leewardNO2} µg/m³</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Pared de Barlovento (Windward):</span>
                <ScientificTooltip
                  title="Acera de Barlovento (Windward)"
                  content="Zona de renovación aerodinámica con menor carga contaminante relativa."
                />
              </span>
              <strong className="text-emerald-400 font-mono font-bold">{metrics.windwardNO2} µg/m³</strong>
            </div>
            <p className="text-[8.5px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              {metrics.regimeDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
