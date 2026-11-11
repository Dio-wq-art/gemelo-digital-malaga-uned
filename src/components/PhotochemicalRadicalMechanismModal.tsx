import React, { useState, useMemo } from 'react';
import { Sun, Moon, Zap, Flame, Shield, Download, RefreshCw, BarChart2, Activity, Info, Sliders, Layers } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import {
  evaluatePhotochemicalRadicalMechanism,
  SpeciatedVocPool,
  PhotochemicalMechanismInput
} from '../lib/photochemicalRadicalMechanism';

interface PhotochemicalRadicalMechanismModalProps {
  isOpen: boolean;
  onClose: () => void;
  solarZenithAngleDeg?: number;
  temperatureC?: number;
  relativeHumidityPct?: number;
  pressureHpa?: number;
  uvIndex?: number;
  noPpb?: number;
  no2Ppb?: number;
  o3Ppb?: number;
  coPpb?: number;
  so2Ppb?: number;
}

export const PhotochemicalRadicalMechanismModal: React.FC<PhotochemicalRadicalMechanismModalProps> = ({
  isOpen,
  onClose,
  solarZenithAngleDeg = 35.0,
  temperatureC = 23.5,
  relativeHumidityPct = 62.0,
  pressureHpa = 1013.25,
  uvIndex = 6.5,
  noPpb = 8.5,
  no2Ppb = 28.0,
  o3Ppb = 42.0,
  coPpb = 320.0,
  so2Ppb = 2.4
}) => {
  const [sza, setSza] = useState<number>(solarZenithAngleDeg);
  const [tempC, setTempC] = useState<number>(temperatureC);
  const [rh, setRh] = useState<number>(relativeHumidityPct);
  const [uv, setUv] = useState<number>(uvIndex);
  
  const [no, setNo] = useState<number>(noPpb);
  const [no2, setNo2] = useState<number>(no2Ppb);
  const [o3, setO3] = useState<number>(o3Ppb);
  const [co, setCo] = useState<number>(coPpb);
  const [so2, setSo2] = useState<number>(so2Ppb);

  const [vocPool, setVocPool] = useState<SpeciatedVocPool>({
    isoprenePpb: 0.35,
    monoterpenesPpb: 0.18,
    benzenePpb: 0.42,
    toluenePpb: 1.25,
    xylenesPpb: 0.90,
    alkenesPpb: 1.50,
    formaldehydePpb: 1.95
  });

  const [activeTab, setActiveTab] = useState<'radicals' | 'ohReactivity' | 'ozoneSoa' | 'speciation'>('radicals');

  const mechanismResult = useMemo(() => {
    const input: PhotochemicalMechanismInput = {
      solarZenithAngleDeg: sza,
      temperatureC: tempC,
      relativeHumidityPct: rh,
      pressureHpa,
      uvIndex: uv,
      noPpb: no,
      no2Ppb: no2,
      o3Ppb: o3,
      coPpb: co,
      so2Ppb: so2,
      vocPool
    };
    return evaluatePhotochemicalRadicalMechanism(input);
  }, [sza, tempC, rh, pressureHpa, uv, no, no2, o3, co, so2, vocPool]);

  if (!isOpen) return null;

  const exportGeoJson = () => {
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        title: 'Mecanismo Fotoquímico RACM2 - Gemelo Digital de Málaga',
        timestamp: mechanismResult.timestamp,
        regime: mechanismResult.photochemicalRegime,
        netOzonePpbH: mechanismResult.netOzoneProductionPpbH,
        soaUgm3H: mechanismResult.soaFormationRateUgm3H
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-4.42, 36.72]
          },
          properties: {
            ...mechanismResult.radicals,
            ...mechanismResult.ohReactivity,
            jNo2SecMinus1: mechanismResult.jNo2SecMinus1,
            jO1dSecMinus1: mechanismResult.jO1dSecMinus1,
            lnL0Ratio: mechanismResult.lnL0Ratio
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fotoquimica_racm2_malaga_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = 'timestamp,regime,lnL0Ratio,jNo2,jO1d,ohMoleculesCm3,ho2MoleculesCm3,ro2MoleculesCm3,no3MoleculesCm3,clMoleculesCm3,ohrTotal,ohrNox,ohrCo,ohrBio,ohrAnthro,netOzonePpbH,soaRateUgm3H\n';
    const row = `"${mechanismResult.timestamp}","${mechanismResult.photochemicalRegime}",${mechanismResult.lnL0Ratio},${mechanismResult.jNo2SecMinus1},${mechanismResult.jO1dSecMinus1},${mechanismResult.radicals.ohMoleculesCm3},${mechanismResult.radicals.ho2MoleculesCm3},${mechanismResult.radicals.ro2MoleculesCm3},${mechanismResult.radicals.no3MoleculesCm3},${mechanismResult.radicals.clMoleculesCm3},${mechanismResult.ohReactivity.ohrTotalSecMinus1},${mechanismResult.ohReactivity.ohrNoxSecMinus1},${mechanismResult.ohReactivity.ohrCoSecMinus1},${mechanismResult.ohReactivity.ohrVocBiogenicSecMinus1},${mechanismResult.ohReactivity.ohrVocAnthroSecMinus1},${mechanismResult.netOzoneProductionPpbH},${mechanismResult.soaFormationRateUgm3H}`;
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fotoquimica_racm2_malaga_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DraggableWindow
      title="Mecanismo Fotoquímico Cuasi-Estacionario Avanzado (RACM2 / CB05)"
      onClose={onClose}
      icon={<Zap className="w-4 h-4 text-amber-400" />}
      headerColorClass="text-amber-300"
      borderColorClass="border-amber-800/80"
      className="w-full max-w-4xl max-h-[88vh]"
      defaultCollapsed={true}
    >
      <div className="p-4 space-y-4 text-slate-200 text-xs font-sans">
        {/* Cabecera y Selector de Subpestañas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Cinética de Radicales &amp; Reactividad OH</h3>
              <p className="text-[10px] text-slate-400">
                Modelo acoplado IUPAC / MCM v3.3.1 para la atmósfera urbana y litoral de Málaga
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <ScientificTooltip
              title="Radicales Libres Cuasi-Estacionarios (MCM v3.3.1)"
              content="Concentraciones en estado estacionario de los principales oxidantes atmosféricos: OH (diurno), HO2, RO2 (peroxilo orgánico), NO3 (nocturno) y Cl• (halógenos litorales)."
              formula={`\\frac{d[\\text{OH}]}{dt} = 2 J_{\\text{O}^1\\text{D}} [\\text{O}_3] \\frac{k_{\\text{H}_2\\text{O}}[\\text{H}_2\\text{O}]}{k_{\\text{M}}[\\text{M}]} + k_{\\text{HO}_2+\\text{NO}}[\\text{HO}_2][\\text{NO}] - k_{\\text{OH}}[\\text{OH}] \\approx 0`}
              citation="Master Chemical Mechanism (MCM v3.3.1) / IUPAC"
            >
              <button
                onClick={() => setActiveTab('radicals')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'radicals' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Radicales Libres
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Reactividad Total del Radical Hidroxilo (k_OH)"
              content="Suma ponderada de las tasas de reacción de pérdida de OH frente a todos los sumideros traza (CO, NOx, CH4 y pool de COVs especiados en Málaga)."
              formula={`k_{\\text{OH}} = k_{\\text{CO}}[\\text{CO}] + k_{\\text{NO}_2}[\\text{NO}_2] + k_{\\text{NO}}[\\text{NO}] + \\sum k_{\\text{VOC}_i} [\\text{VOC}_i]`}
              citation="Di Carlo et al. (2004) Science / Whalley et al. (2016)"
            >
              <button
                onClick={() => setActiveTab('ohReactivity')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'ohReactivity' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reactividad OH
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Producción Neta de Ozono P(O3) y Formación de SOA"
              content="Tasa neta de producción fotoquímica de ozono P(O3) y rendimiento de aerosoles orgánicos secundarios (SOA) según la teoría de partición bifásica gas-partícula."
              formula={`P(\\text{O}_3) = k_{\\text{HO}_2+\\text{NO}}[\\text{HO}_2][\\text{NO}] + \\sum k_{\\text{RO}_{2,i}+\\text{NO}}[\\text{RO}_{2,i}][\\text{NO}] - L(\\text{O}_3)`}
              citation="Sillman (1999) / Pankow (1994) / Donahue et al. (2006)"
            >
              <button
                onClick={() => setActiveTab('ozoneSoa')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'ozoneSoa' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                P(O₃) &amp; SOA
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Especiación Química del Pool de COVs"
              content="Desglose del cóctel de Compuestos Orgánicos Volátiles en Málaga: Isopreno y Monoterpenos (biogénicos), Benceno, Tolueno, Xilenos (tráfico) y Formaldehído."
              regulatory="Directiva 2008/50/CE (Control de Precursores de Ozono Anexo X)"
              citation="EMEP/EEA Air Pollutant Emission Inventory Guidebook 2023"
            >
              <button
                onClick={() => setActiveTab('speciation')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'speciation' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Especiación COVs
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Panel de Controles Cinéticos / Parámetros Ambientales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px]">
          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>Ángulo Cenital (SZA):</span>
              <span className="font-mono text-amber-300 font-bold">{sza}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={sza}
              onChange={(e) => setSza(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>Índice UV Solar:</span>
              <span className="font-mono text-amber-300 font-bold">{uv.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={uv}
              onChange={(e) => setUv(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>Temperatura Suelo:</span>
              <span className="font-mono text-cyan-300 font-bold">{tempC.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="5"
              max="42"
              step="0.5"
              value={tempC}
              onChange={(e) => setTempC(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>NO₂ Precursor:</span>
              <span className="font-mono text-rose-300 font-bold">{no2.toFixed(1)} ppb</span>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              step="1"
              value={no2}
              onChange={(e) => setNo2(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        {/* Tab 1: Radicales Libres de Estado Estacionario */}
        {activeTab === 'radicals' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* OH */}
              <ScientificTooltip
                title="Radical Hidroxilo [OH•] (Detergente Atmosférico)"
                content="Principal oxidante diurno troposférico. Se genera por fotólisis del O₃ (producción de O(¹D) y reacción con vapor de agua) y por fotólisis de HONO matutino."
                formula={`\\text{O}_3 + h\\nu(\\lambda < 320\\text{nm}) \\rightarrow \\text{O}_2 + \\text{O}(^1\\text{D}), \\quad \\text{O}(^1\\text{D}) + \\text{H}_2\\text{O} \\rightarrow 2 \\text{OH}^\\bullet`}
                citation="Levy (1971) Nature / IUPAC Gas Kinetics Sub-committee"
              >
                <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg cursor-help">
                  <div className="flex items-center justify-between text-purple-300 font-bold text-[11px] mb-1">
                    <span>[OH•] Hidroxilo</span>
                    <Flame className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-purple-200">
                    {mechanismResult.radicals.ohMoleculesCm3.toExponential(2)}
                  </div>
                  <p className="text-[9.5px] text-purple-300/80 mt-0.5">molec/cm³ (Diurno)</p>
                </div>
              </ScientificTooltip>

              {/* HO2 */}
              <ScientificTooltip
                title="Radical Hidroperoxilo [HO₂•]"
                content="Intermediario clave del ciclo fotoquímico NOx-HOx. Reacciona rápidamente con NO para reciclar OH y oxidar NO a NO₂ sin consumir ozono."
                formula={`\\text{HO}_2^\\bullet + \\text{NO} \\xrightarrow{k_2(T)} \\text{OH}^\\bullet + \\text{NO}_2, \\quad k_2(298\\text{K}) = 8.5 \\times 10^{-12} \\text{ cm}^3/\\text{molec}\\cdot\\text{s}`}
                citation="Seinfeld & Pandis (2016) Atmospheric Chemistry and Physics"
              >
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg cursor-help">
                  <div className="flex items-center justify-between text-amber-300 font-bold text-[11px] mb-1">
                    <span>[HO₂•] Hidroperoxilo</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-amber-200">
                    {mechanismResult.radicals.ho2MoleculesCm3.toExponential(2)}
                  </div>
                  <p className="text-[9.5px] text-amber-300/80 mt-0.5">molec/cm³</p>
                </div>
              </ScientificTooltip>

              {/* RO2 */}
              <ScientificTooltip
                title="Radicales Peroxilo Orgánicos [RO₂•]"
                content="Formados por el ataque de OH a compuestos orgánicos volátiles (isopreno, terpenos, tolueno). Precursores directos de la formación de ozono troposférico."
                formula={`\\text{RH} + \\text{OH}^\\bullet \\xrightarrow{\\text{O}_2} \\text{RO}_2^\\bullet + \\text{H}_2\\text{O}, \\quad \\text{RO}_2^\\bullet + \\text{NO} \\rightarrow \\text{RO}^\\bullet + \\text{NO}_2`}
                citation="Jenkin et al. (2015) Atmos. Chem. Phys."
              >
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg cursor-help">
                  <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px] mb-1">
                    <span>[RO₂•] Peroxilo Org.</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-200">
                    {mechanismResult.radicals.ro2MoleculesCm3.toExponential(2)}
                  </div>
                  <p className="text-[9.5px] text-emerald-300/80 mt-0.5">molec/cm³</p>
                </div>
              </ScientificTooltip>

              {/* NO3 */}
              <ScientificTooltip
                title="Radical Nitrato [NO₃•] (Oxidante Nocturno)"
                content="Principal oxidante nocturno. Se fotoliza rápidamente durante el día por radiación solar visible. Oxida selectivamente alquenos y monoterpenos produciendo nitratos orgánicos."
                formula={`\\text{NO}_2 + \\text{O}_3 \\rightarrow \\text{NO}_3^\\bullet + \\text{O}_2, \\quad \\text{NO}_3^\\bullet + \\text{NO}_2 + \\text{M} \\rightleftharpoons \\text{N}_2\\text{O}_5 + \\text{M}`}
                citation="Wayne et al. (1991) Atmos. Environ. / Brown & Stutz (2012) Chem. Soc. Rev."
              >
                <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg cursor-help">
                  <div className="flex items-center justify-between text-blue-300 font-bold text-[11px] mb-1">
                    <span>[NO₃•] Nitrato</span>
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-blue-200">
                    {mechanismResult.radicals.no3MoleculesCm3.toExponential(2)}
                  </div>
                  <p className="text-[9.5px] text-blue-300/80 mt-0.5">molec/cm³ (Nocturno)</p>
                </div>
              </ScientificTooltip>

              {/* Cl */}
              <ScientificTooltip
                title="Radical Átomo de Cloro [Cl•] (Activación Marina)"
                content="Oxidante de alta reactividad en atmósferas costeras y portuarias (Bahía de Málaga). Se produce al amanecer por fotólisis de ClNO2 acumulado durante la noche."
                formula={`\\text{ClNO}_2 + h\\nu(\\lambda < 460\\text{nm}) \\rightarrow \\text{Cl}^\\bullet + \\text{NO}_2, \\quad \\text{Cl}^\\bullet + \\text{RH} \\rightarrow \\text{R}^\\bullet + \\text{HCl}`}
                citation="Thornton et al. (2010) Nature / Riedel et al. (2014) J. Geophys. Res."
              >
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg cursor-help">
                  <div className="flex items-center justify-between text-cyan-300 font-bold text-[11px] mb-1">
                    <span>[Cl•] Cloro Marino</span>
                    <Sun className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-cyan-200">
                    {mechanismResult.radicals.clMoleculesCm3.toExponential(2)}
                  </div>
                  <p className="text-[9.5px] text-cyan-300/80 mt-0.5">molec/cm³ (Bahía)</p>
                </div>
              </ScientificTooltip>
            </div>

            {/* Tasas de Fotólisis Troposférica */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">Tasas de Fotólisis Espectrales J (s⁻¹)</h4>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-950/70 border border-slate-800 rounded flex justify-between">
                  <span className="text-slate-400">J(NO₂):</span>
                  <span className="text-amber-300 font-bold">{mechanismResult.jNo2SecMinus1} s⁻¹</span>
                </div>
                <div className="p-2 bg-slate-950/70 border border-slate-800 rounded flex justify-between">
                  <span className="text-slate-400">J(O¹D):</span>
                  <span className="text-cyan-300 font-bold">{mechanismResult.jO1dSecMinus1} s⁻¹</span>
                </div>
                <div className="p-2 bg-slate-950/70 border border-slate-800 rounded flex justify-between">
                  <span className="text-slate-400">J(HCHO):</span>
                  <span className="text-purple-300 font-bold">{mechanismResult.jHchoSecMinus1} s⁻¹</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reactividad Total de OH */}
        {activeTab === 'ohReactivity' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-slate-200">Reactividad Total del Radical OH (OHR_total):</span>
                <span className="font-bold font-mono text-base text-amber-300">
                  {mechanismResult.ohReactivity.ohrTotalSecMinus1} s⁻¹
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Óxidos de Nitrógeno (NOx):</span>
                    <span className="font-mono text-rose-300">
                      {mechanismResult.ohReactivity.ohrNoxSecMinus1} s⁻¹ ({((mechanismResult.ohReactivity.ohrNoxSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, (mechanismResult.ohReactivity.ohrNoxSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>CO Monóxido de Carbono:</span>
                    <span className="font-mono text-blue-300">
                      {mechanismResult.ohReactivity.ohrCoSecMinus1} s⁻¹ ({((mechanismResult.ohReactivity.ohrCoSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (mechanismResult.ohReactivity.ohrCoSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>COVs Antropogénicos (BTX, Olefinas):</span>
                    <span className="font-mono text-amber-300">
                      {mechanismResult.ohReactivity.ohrVocAnthroSecMinus1} s⁻¹ ({((mechanismResult.ohReactivity.ohrVocAnthroSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (mechanismResult.ohReactivity.ohrVocAnthroSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>BVOCs Biogénicos (Isopreno, Pineno):</span>
                    <span className="font-mono text-emerald-300">
                      {mechanismResult.ohReactivity.ohrVocBiogenicSecMinus1} s⁻¹ ({((mechanismResult.ohReactivity.ohrVocBiogenicSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (mechanismResult.ohReactivity.ohrVocBiogenicSecMinus1 / mechanismResult.ohReactivity.ohrTotalSecMinus1) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Producción Neta de O3 y Formación de Aerosoles Secundarios (SOA) */}
        {activeTab === 'ozoneSoa' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* O3 Balance */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-amber-200">Balance Fotoquímico de Ozono Troposférico</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Producción P(O₃):</span>
                    <span className="font-mono text-emerald-300 font-bold">+{mechanismResult.ozoneProductionRatePpbH} ppb/h</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Pérdida L(O₃):</span>
                    <span className="font-mono text-rose-300 font-bold">-{mechanismResult.ozoneLossRatePpbH} ppb/h</span>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 font-bold">
                    <span className="text-slate-200">Producción Neta:</span>
                    <span className="font-mono text-amber-300">+{mechanismResult.netOzoneProductionPpbH} ppb/h</span>
                  </div>
                </div>
              </div>

              {/* SOA & Regime */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-cyan-200">Rendimiento SOA &amp; Régimen de Limitación</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tasa Formación SOA:</span>
                    <span className="font-mono text-cyan-300 font-bold">+{mechanismResult.soaFormationRateUgm3H} µg/m³·h</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Ratio Kleinman (L_N / Q):</span>
                    <span className="font-mono text-slate-200 font-bold">{mechanismResult.lnL0Ratio}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5">
                    <span className="text-slate-400">Diagnóstico:</span>
                    <span className="font-bold text-amber-300 text-[10.5px]">{mechanismResult.photochemicalRegime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnóstico Regulatorio / Tesis */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[10.5px] leading-relaxed text-slate-300">
              <span className="font-bold text-amber-300 block mb-1">Guía Metodológica de Sensibilidad:</span>
              {mechanismResult.regimeDescription}
            </div>
          </div>
        )}

        {/* Tab 4: Especiación de Precursores COVs */}
        {activeTab === 'speciation' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Isopreno (C₅H₈):</span>
                <span className="font-mono font-bold text-emerald-300">{vocPool.isoprenePpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Parque de Málaga</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Monoterpenos:</span>
                <span className="font-mono font-bold text-emerald-300">{vocPool.monoterpenesPpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Gibralfaro / Pinares</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Benceno (C₆H₆):</span>
                <span className="font-mono font-bold text-rose-300">{vocPool.benzenePpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Escape Vehicular</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Tolueno (C₇H₈):</span>
                <span className="font-mono font-bold text-rose-300">{vocPool.toluenePpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Tráfico Av. Andalucía</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Xilenos (C₈H₁₀):</span>
                <span className="font-mono font-bold text-rose-300">{vocPool.xylenesPpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Solventes / Combustión</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block text-[10px]">Olefinas Ligeras:</span>
                <span className="font-mono font-bold text-amber-300">{vocPool.alkenesPpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Eteno / Propeno</span>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[10px]">Formaldehído HCHO:</span>
                <span className="font-mono font-bold text-purple-300">{vocPool.formaldehydePpb} ppb</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Oxidación secundaria fotoquímica</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer & FAIR Data Export */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <div className="text-[10px] text-slate-400 font-mono">
            Régimen: {mechanismResult.photochemicalRegime} • L_N/Q: {mechanismResult.lnL0Ratio}
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip content="Exportar diagnóstico fotoquímico RACM2 en formato GeoJSON.">
              <button
                onClick={exportGeoJson}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>GeoJSON</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Exportar matriz de cinética y radicales en formato CSV estructurado.">
              <button
                onClick={exportCsv}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
