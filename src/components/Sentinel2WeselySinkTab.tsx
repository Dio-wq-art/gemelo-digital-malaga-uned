import React, { useState } from 'react';
import { 
  Leaf, 
  Trees, 
  Sun, 
  Thermometer, 
  Wind, 
  Activity, 
  Download, 
  ShieldCheck, 
  DollarSign, 
  Info,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  MALAGA_GREEN_SINKS, 
  GreenCanopyDepositionProfile, 
  calculateWeselyCanopyDeposition, 
  GreenSinkDepositionResult 
} from '../lib/earthEngineDownscaling';
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

interface Sentinel2WeselySinkTabProps {
  onFlyToSink?: (lat: number, lon: number) => void;
}

export const Sentinel2WeselySinkTab: React.FC<Sentinel2WeselySinkTabProps> = ({
  onFlyToSink
}) => {
  const [selectedSinkId, setSelectedSinkId] = useState<string>('parque_malaga');
  const [solarRad, setSolarRad] = useState<number>(650); // W/m2
  const [tempC, setTempC] = useState<number>(24.0);      // °C
  const [uStar, setUStar] = useState<number>(0.35);      // m/s velocidad de fricción

  const activeSink = MALAGA_GREEN_SINKS.find(s => s.id === selectedSinkId) || MALAGA_GREEN_SINKS[0];

  const result: GreenSinkDepositionResult = calculateWeselyCanopyDeposition(
    activeSink,
    solarRad,
    tempC,
    uStar,
    32.0, // NO2 ug/m3
    72.0, // O3 ug/m3
    14.5  // PM2.5 ug/m3
  );

  // Datos comparativos de remoción para los sumideros verdes de Málaga
  const comparisonData = MALAGA_GREEN_SINKS.map(s => {
    const res = calculateWeselyCanopyDeposition(s, solarRad, tempC, uStar);
    return {
      name: s.name.split('(')[0].trim(),
      id: s.id,
      ndvi: s.sentinel2Ndvi,
      lai: s.calculatedLai,
      no2_kg_ha: res.no2.annualRemovalKgHaYear,
      o3_kg_ha: res.o3.annualRemovalKgHaYear,
      pm25_kg_ha: res.pm25.annualRemovalKgHaYear,
      total_kg_year: res.totalAnnualRemovalKgYear,
      avoided_cost: res.avoidedHealthCostEurYear
    };
  });

  const exportCSV = () => {
    const headers = 'ID,Nombre,Ubicacion,Lat,Lon,Area_Ha,Especies,Sentinel2_NDVI,Calculated_LAI,Vd_NO2_cms,Flux_NO2_ug_m2_s,Remocion_NO2_kg_ha_año,Vd_O3_cms,Flux_O3_ug_m2_s,Remocion_O3_kg_ha_año,Vd_PM25_cms,Flux_PM25_ug_m2_s,Remocion_PM25_kg_ha_año,Remocion_Total_kg_año,Ahorro_Salud_EUR_año\n';
    const rows = MALAGA_GREEN_SINKS.map(s => {
      const res = calculateWeselyCanopyDeposition(s, solarRad, tempC, uStar);
      return `${s.id},"${s.name}","${s.location}",${s.lat},${s.lon},${s.areaHa},"${s.dominantSpecies}",${s.sentinel2Ndvi},${s.calculatedLai},${res.no2.vdCmS},${res.no2.fluxRemovalUgM2S},${res.no2.annualRemovalKgHaYear},${res.o3.vdCmS},${res.o3.fluxRemovalUgM2S},${res.o3.annualRemovalKgHaYear},${res.pm25.vdCmS},${res.pm25.fluxRemovalUgM2S},${res.pm25.annualRemovalKgHaYear},${res.totalAnnualRemovalKgYear},${res.avoidedHealthCostEurYear}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sentinel2_Wesely_Sumideros_Verdes_Malaga_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Encabezado Doctrinal */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
              <span>Sentinel-2 MSI (10m) & Circuito de Deposición Seca de Wesely (1989)</span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-950 border border-emerald-700 text-emerald-300">
                SUMIDERO BIOGÉNESIS URBANA
              </span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            Cuantificación analítica de la tasa de absorción estomática y remoción de aerosoles finos mediante la red de resistencias aerodinámica (Ra), subcapa laminar (Rb) y dosel foliar (Rc) parametrizada con NDVI y LAI de alta resolución sobre Málaga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScientificTooltip
            title="Exportación Matriz de Deposición Seca CSV"
            content="Descarga el dataset con trazabilidad FAIR de resistencias aerodinámica, laminar y foliar (Ra, Rb, Rc), velocidades de deposición Vd y flujos de remoción para los sumideros verdes de Málaga."
            position="bottom"
          >
            <button
              onClick={exportCSV}
              className="self-start md:self-auto px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Matriz Deposición (CSV)</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>

      {/* Controles Ambientales y Radiomiméticos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 border border-slate-800">
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-amber-300 flex items-center gap-1">
              <Sun className="w-3 h-3" />
              <span>Radiación Solar (Apertura Estomática)</span>
              <ScientificTooltip
                title="Irradiancia Solar de Onda Corta (K_solar)"
                content="Determina la apertura fotoactiva de los estomas vegetales. A mayor radiación (hasta la saturación), la resistencia estomática rs disminuye y la captación de gases reactivos se maximiza."
                formula="r_{s} = r_{s,\min} \cdot \left(1 + \left(\frac{200}{K_{\text{solar}} + 0.1}\right)^2\right)"
                position="top"
              />
            </span>
            <strong className="text-white">{solarRad} W/m²</strong>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="25"
            value={solarRad}
            onChange={(e) => setSolarRad(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>50 W/m² (Noche / Nublado)</span>
            <span>1000 W/m² (Pleno Sol Verano)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-rose-300 flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              <span>Temperatura Foliar / Aire</span>
              <ScientificTooltip
                title="Respuesta Térmica Estomática de Wesely"
                content="Modula la conductancia estomática con una curva en campana que penaliza tanto las bajas temperaturas como el estrés térmico estival (>35°C), provocando cierre estomático preventivo en especies mediterráneas."
                formula="f(T) = \frac{T - T_{\min}}{T_{\text{opt}} - T_{\min}} \cdot \left(\frac{T_{\max} - T}{T_{\max} - T_{\text{opt}}}\right)^{\frac{T_{\max}-T_{\text{opt}}}{T_{\text{opt}}-T_{\min}}}"
                position="top"
              />
            </span>
            <strong className="text-white">{tempC}°C</strong>
          </div>
          <input
            type="range"
            min="10"
            max="42"
            step="0.5"
            value={tempC}
            onChange={(e) => setTempC(parseFloat(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>10°C (Invernizo)</span>
            <span>42°C (Estrés Térmico)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-cyan-300 flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>Velocidad de Fricción (u*)</span>
              <ScientificTooltip
                title="Velocidad de Fricción Turbulenta (u*)"
                content="Escala de velocidad de la turbulencia mecánica generada por el cizallamiento superficial. Gobierna directamente la resistencia aerodinámica Ra y la resistencia laminar cuasi-laminar Rb."
                formula="R_a = \frac{\ln(z/z_0) - \Psi_H}{\kappa u_*}, \quad R_b = \frac{2}{\kappa u_*} \left(\frac{Sc}{Pr}\right)^{2/3}"
                position="top"
              />
            </span>
            <strong className="text-white">{uStar} m/s</strong>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.80"
            step="0.05"
            value={uStar}
            onChange={(e) => setUStar(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
            <span>0.10 m/s (Brisa Calma)</span>
            <span>0.80 m/s (Turbulencia Fuerte)</span>
          </div>
        </div>
      </div>

      {/* Selector de Sumideros Verdes de Málaga */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 uppercase flex items-center gap-1">
          <span>Sumidero Verde:</span>
          <ScientificTooltip
            title="Inventario Georreferenciado de Sumideros Verdes de Málaga"
            content="Polígonos arbóreos oficiales caracterizados con teledetección multiespectral Sentinel-2 y el Catálogo Municipal de Biodiversidad de Málaga."
            position="bottom"
          />
        </span>
        {MALAGA_GREEN_SINKS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSinkId(s.id)}
            className={`px-2.5 py-1 text-[9.5px] font-mono whitespace-nowrap transition-all border ${
              selectedSinkId === s.id
                ? 'bg-emerald-900/70 border-emerald-500 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.name.split('(')[0]}
          </button>
        ))}
      </div>

      {/* Desglose de Resistencias y Captación del Sumidero Activo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Panel Izquierdo: Circuito Eléctrico Análogo de Wesely */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5" />
                <span>{activeSink.name} • {activeSink.areaHa} ha</span>
                <ScientificTooltip
                  topic="wesely_dry_deposition"
                  title="Parámetros Estructurales del Dosel"
                  content={`Especies dominantes: ${activeSink.dominantSpecies}. Superficie: ${activeSink.areaHa} ha.`}
                  position="top"
                />
              </h4>
              <p className="text-[9.5px] text-slate-400 font-mono">
                {activeSink.dominantSpecies}
              </p>
            </div>
            {onFlyToSink && (
              <button
                onClick={() => onFlyToSink(activeSink.lat, activeSink.lon)}
                className="text-[9px] font-mono px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>Ver en Google Maps</span>
              </button>
            )}
          </div>

          {/* Métricas Satelitales Sentinel-2 */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
            <ScientificTooltip
              title="Índice de Vegetación de Diferencia Normalizada (NDVI)"
              content="Calculado a partir de las bandas B4 (Rojo, 665 nm) y B8 (Infrarrojo Cercano, 842 nm) del sensor Sentinel-2 MSI a 10m de resolución espacial."
              formula="\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}"
              position="top"
            >
              <div className="p-2 bg-slate-950 border border-slate-800 cursor-help hover:border-emerald-500/50 transition-colors">
                <span className="text-slate-400 block text-[8.5px]">Sentinel-2 NDVI</span>
                <strong className="text-emerald-400 text-xs">{activeSink.sentinel2Ndvi}</strong>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              title="Índice de Área Foliar (LAI - Leaf Area Index)"
              content="Metros cuadrados de superficie foliar unilateral por metro cuadrado de suelo. Derivado alométricamente del NDVI Sentinel-2 para copas arbóreas mediterráneas."
              formula="\text{LAI} = \alpha \cdot \exp(\beta \cdot \text{NDVI})"
              position="top"
            >
              <div className="p-2 bg-slate-950 border border-slate-800 cursor-help hover:border-cyan-500/50 transition-colors">
                <span className="text-slate-400 block text-[8.5px]">Leaf Area Index (LAI)</span>
                <strong className="text-cyan-400 text-xs">{result.laiUsed} m²/m²</strong>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              title="Coste Social de la Salud Evitado (EEA / OMS)"
              content="Valoración económica del beneficio en salud pública por reducción de hospitalizaciones y mortalidad atribuible a la absorción foliar de NO2, O3 y PM2.5."
              formula="\text{Ahorro} = \sum (\Delta M_i \cdot C_{v,i})"
              regulatory="Metodología de Costes Externos de la Calidad del Aire (Directiva (UE) 2016/2284)"
              position="top"
            >
              <div className="p-2 bg-slate-950 border border-slate-800 cursor-help hover:border-amber-500/50 transition-colors">
                <span className="text-slate-400 block text-[8.5px]">Beneficio Salud Evitado</span>
                <strong className="text-amber-400 text-xs">{result.avoidedHealthCostEurYear.toLocaleString()} €/año</strong>
              </div>
            </ScientificTooltip>
          </div>

          {/* Tabla de Resistencias y Tasas por Contaminante */}
          <div className="overflow-x-auto">
            <table className="w-full text-[9.5px] font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-1.5 text-left">Contaminante</th>
                  <th className="p-1.5 text-right">
                    <ScientificTooltip
                      title="Resistencia Aerodinámica (Ra)"
                      content="Oposición al transporte turbulento en la capa límite superficial gobernada por u* y la estabilidad de Monin-Obukhov."
                      formula="R_a = \frac{\ln(z/z_0) - \Psi_H}{\kappa u_*}"
                      position="top"
                    >
                      <span className="cursor-help">Ra (s/m)</span>
                    </ScientificTooltip>
                  </th>
                  <th className="p-1.5 text-right">
                    <ScientificTooltip
                      title="Resistencia Subcapa Cuasi-Laminar (Rb)"
                      content="Resistencia por difusión molecular a través de la fina capa límite de aire quieto pegada a las hojas."
                      formula="R_b = \frac{2}{\kappa u_*} \left(\frac{Sc}{Pr}\right)^{2/3}"
                      position="top"
                    >
                      <span className="cursor-help">Rb (s/m)</span>
                    </ScientificTooltip>
                  </th>
                  <th className="p-1.5 text-right">
                    <ScientificTooltip
                      title="Resistencia del Dosel Foliar (Rc)"
                      content="Resistencia biológica y de superficie que integra la vía estomática (rs), cuticular (rcut) y del suelo (rg)."
                      formula="\frac{1}{R_c} = \frac{\text{LAI}}{r_s + r_m} + \frac{\text{LAI}}{r_{\text{cut}}} + \frac{1}{r_g}"
                      position="top"
                    >
                      <span className="cursor-help">Rc (s/m)</span>
                    </ScientificTooltip>
                  </th>
                  <th className="p-1.5 text-right text-emerald-300">
                    <ScientificTooltip
                      title="Velocidad de Deposición Seca (Vd)"
                      content="Inverso de la suma de resistencias en serie del circuito eléctrico análogo de Wesely (1989)."
                      formula="v_d = \frac{1}{R_a + R_b + R_c}"
                      position="top"
                    >
                      <span className="cursor-help">Vd (cm/s)</span>
                    </ScientificTooltip>
                  </th>
                  <th className="p-1.5 text-right text-amber-300">
                    <ScientificTooltip
                      title="Tasa Específica de Remoción Anual"
                      content="Masa neta de contaminante absorbida o impactada por hectárea de cobertura foliar por año."
                      formula="F = v_d \cdot C \cdot 31536 \quad [\text{kg ha}^{-1}\text{ año}^{-1}]"
                      regulatory="Guía EMEP/EEA & Modelo de Deposición Seca de Wesely (1989)"
                      position="top"
                    >
                      <span className="cursor-help">kg/(ha·año)</span>
                    </ScientificTooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                <tr className="hover:bg-slate-900/60">
                  <td className="p-1.5 text-purple-300 font-bold">Dióxido Nitrógeno (NO₂)</td>
                  <td className="p-1.5 text-right text-slate-400">{result.no2.raSm}</td>
                  <td className="p-1.5 text-right text-slate-400">{result.no2.rbSm}</td>
                  <td className="p-1.5 text-right text-slate-300">{result.no2.rcSm}</td>
                  <td className="p-1.5 text-right text-emerald-400 font-bold">{result.no2.vdCmS}</td>
                  <td className="p-1.5 text-right text-amber-400 font-bold">{result.no2.annualRemovalKgHaYear}</td>
                </tr>
                <tr className="hover:bg-slate-900/60">
                  <td className="p-1.5 text-cyan-300 font-bold">Ozono Troposférico (O₃)</td>
                  <td className="p-1.5 text-right text-slate-400">{result.o3.raSm}</td>
                  <td className="p-1.5 text-right text-slate-400">{result.o3.rbSm}</td>
                  <td className="p-1.5 text-right text-slate-300">{result.o3.rcSm}</td>
                  <td className="p-1.5 text-right text-emerald-400 font-bold">{result.o3.vdCmS}</td>
                  <td className="p-1.5 text-right text-amber-400 font-bold">{result.o3.annualRemovalKgHaYear}</td>
                </tr>
                <tr className="hover:bg-slate-900/60">
                  <td className="p-1.5 text-rose-300 font-bold">Partículas Finas (PM₂.₅)</td>
                  <td className="p-1.5 text-right text-slate-400">{result.pm25.raSm}</td>
                  <td className="p-1.5 text-right text-slate-400">{result.pm25.rbSm}</td>
                  <td className="p-1.5 text-right text-slate-300">{result.pm25.rcSm}</td>
                  <td className="p-1.5 text-right text-emerald-400 font-bold">{result.pm25.vdCmS}</td>
                  <td className="p-1.5 text-right text-amber-400 font-bold">{result.pm25.annualRemovalKgHaYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-[9.5px] font-mono flex items-center justify-between text-emerald-200">
            <span>Remoción Anual Neta del Sumidero ({activeSink.name}):</span>
            <strong className="text-emerald-300 text-xs">{result.totalAnnualRemovalKgYear.toLocaleString()} kg/año eliminados</strong>
          </div>
        </div>

        {/* Panel Derecho: Gráfico Comparativo entre Sumideros de Málaga */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>Capacidad de Remoción Foliar en Málaga</span>
              <span className="text-[9px] font-mono text-emerald-300 font-normal">kg/(ha·año)</span>
            </h4>
            <p className="text-[9px] text-slate-400 font-mono mb-2">
              Absorción estomática y captación aerodinámica de NO₂ y O₃
            </p>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 8 }} 
                    angle={-25} 
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#475569', fontSize: 10 }}
                    formatter={(val: any, name: string) => [
                      `${val} kg/(ha·año)`,
                      name === 'no2_kg_ha' ? 'Remoción NO₂' : name === 'o3_kg_ha' ? 'Remoción O₃' : 'Remoción PM₂.₅'
                    ]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    wrapperStyle={{ fontSize: 9, paddingBottom: 6 }} 
                  />
                  <Bar dataKey="no2_kg_ha" name="NO₂" fill="#a855f7" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="o3_kg_ha" name="O₃" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pm25_kg_ha" name="PM₂.₅" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 mt-2 flex items-center justify-between">
            <span>Resistencia estomática Rc = f(LAI, K_solar, T)</span>
            <span className="text-emerald-400 font-bold">Wesely (1989) • EMEP/EEA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
