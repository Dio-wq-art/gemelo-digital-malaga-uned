import React, { useState, useEffect } from 'react';
import { Waves, Thermometer, Wind, Compass, Shield, ArrowUpRight, BarChart2, Radio, MapPin, RefreshCw, Navigation } from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SeaBreezeCirculationDiagram } from './SeaBreezeCirculationDiagram';
import { calculateSeaBreezeDynamics, SeaBreezeParams } from '../lib/seaBreezeModel';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry, ZoneLiveTelemetry } from '../lib/liveZoneTelemetry';
import { useActivePoint } from '../context/ActivePointContext';

export interface SeaBreezeBayModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempLandC: number;
  windSpeedKmh: number;
  windDirDeg: number;
  solarRadWm2: number;
}

const getZoneDistanceToCoastKm = (lat: number, lon: number): number => {
  // Línea costera de la Bahía de Málaga (El Palo, Puerto, Misericordia, Guadalhorce)
  const coastPoints = [
    { lat: 36.718, lon: -4.355 },
    { lat: 36.716, lon: -4.414 },
    { lat: 36.695, lon: -4.444 },
    { lat: 36.665, lon: -4.455 }
  ];
  let minD = Infinity;
  for (const pt of coastPoints) {
    const dLat = (lat - pt.lat) * 111.1;
    const dLon = (lon - pt.lon) * 111.1 * Math.cos(lat * Math.PI / 180);
    const d = Math.sqrt(dLat * dLat + dLon * dLon);
    if (d < minD) minD = d;
  }
  return Number(minD.toFixed(2));
};

export function SeaBreezeBayModal({
  isOpen,
  onClose,
  tempLandC: initialTempLandC,
  windSpeedKmh: initialWindSpeedKmh,
  windDirDeg: initialWindDirDeg,
  solarRadWm2: initialSolarRadWm2
}: SeaBreezeBayModalProps) {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES[0]);
  const [sstOverrideC, setSstOverrideC] = useState<number>(activeCtx?.data?.temperatura_mar_c ?? 21.5); // SST Mar de Alborán (Copernicus Marine)
  const [isFetching, setIsFetching] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<ZoneLiveTelemetry | null>(null);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  const [currentTempLandC, setCurrentTempLandC] = useState<number>(assimilation?.temperatureC ?? initialTempLandC);
  const [currentWindSpeedKmh, setCurrentWindSpeedKmh] = useState<number>(assimilation?.windSpeedKmh ?? initialWindSpeedKmh);
  const [currentWindDirDeg, setCurrentWindDirDeg] = useState<number>(assimilation?.windDirectionDeg ?? initialWindDirDeg);
  const [currentSolarRadWm2, setCurrentSolarRadWm2] = useState<number>(assimilation?.solarRadiationWm2 ?? initialSolarRadWm2);

  // Sincronización reactiva inmediata con el punto activo seleccionado en el mapa (ActivePointContext)
  useEffect(() => {
    if (!activePoint && !assimilation) return;
    if (activePoint) {
      let closestZone = PRESET_ZONES[0];
      let minDist = Infinity;
      for (const z of PRESET_ZONES) {
        const d = Math.hypot(z.lat - activePoint.lat, z.lon - activePoint.lon);
        if (d < minDist) {
          minDist = d;
          closestZone = z;
        }
      }
      setActiveZone(closestZone);
    }
    if (assimilation) {
      setCurrentTempLandC(Number(assimilation.temperatureC.toFixed(1)));
      setCurrentWindSpeedKmh(Number(assimilation.windSpeedKmh.toFixed(1)));
      setCurrentWindDirDeg(Math.round(assimilation.windDirectionDeg));
      setCurrentSolarRadWm2(Math.round(assimilation.solarRadiationWm2 ?? 720));
      setTelemetryFeedback(
        `ActivePoint Sync • [${activePoint?.streetName || 'Málaga'}] T=${assimilation.temperatureC.toFixed(1)}°C, Viento=${assimilation.windSpeedKmh.toFixed(1)}km/h (${Math.round(assimilation.windDirectionDeg)}°), Rad=${Math.round(assimilation.solarRadiationWm2 ?? 720)}W/m²`
      );
    }
  }, [activePoint, assimilation]);

  const handleAssimilateZoneData = async (targetZone: Zone = activeZone) => {
    setIsFetching(true);
    try {
      // 1. Asimilar telemetría meteorológica terrestre de la zona
      const tel = await fetchLiveZoneTelemetry(targetZone);
      setLiveTelemetry(tel);
      setCurrentTempLandC(tel.meteo.tempC);
      setCurrentWindSpeedKmh(tel.meteo.windSpeedKmh);
      setCurrentWindDirDeg(tel.meteo.windDirDeg);
      setCurrentSolarRadWm2(tel.meteo.solarRadWm2);

      // 2. Asimilar telemetría de SST en vivo desde la Boya Costera de Málaga (Puertos del Estado / CMEMS)
      try {
        const buoyRes = await fetch('/api/malaga-open-data/coastal-buoy-telemetry');
        if (buoyRes.ok) {
          const buoyJson = await buoyRes.json();
          if (buoyJson.metrics?.seaSurfaceTemperatureCelsius) {
            setSstOverrideC(buoyJson.metrics.seaSurfaceTemperatureCelsius);
          }
        }
      } catch (err) {
        console.warn("Fallo al consultar boya costera:", err);
      }

      setTelemetryFeedback(`${tel.source} • [${targetZone.lat.toFixed(4)}, ${targetZone.lon.toFixed(4)}] | T=${tel.meteo.tempC}°C, Viento=${tel.meteo.windSpeedKmh}km/h (${tel.meteo.windDirDeg}°), Rad=${tel.meteo.solarRadWm2}W/m²`);
    } catch (e) {
      console.warn("Fallo al asimilar telemetría costera de zona:", e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!activePoint) {
      handleAssimilateZoneData(activeZone);
    }
  }, [activeZone]);

  const [activeTab, setActiveTab] = useState<'regime' | 'mblh_recirculation' | 'zones_penetration'>('regime');

  if (!isOpen) return null;

  const params: SeaBreezeParams = {
    tempLandC: currentTempLandC,
    tempSeaSstC: sstOverrideC,
    windDirectionDeg: currentWindDirDeg,
    windSpeedKmh: currentWindSpeedKmh,
    solarIrradianceWm2: currentSolarRadWm2
  };

  const analysis = calculateSeaBreezeDynamics(params);
  const distanceToCoastKm = assimilation?.distanceToCoastKm ?? getZoneDistanceToCoastKm(activePoint?.lat ?? activeZone.lat, activePoint?.lon ?? activeZone.lon);
  const isFrontReached = analysis.seaBreezeInlandPenetrationKm >= distanceToCoastKm;

  return (
    <DraggableWindow
      title="BRISA DE MAR & DINÁMICA TÉRMICA COSTERA (BAHÍA DE MÁLAGA - COPERNICUS SST)"
      onClose={onClose}
      className="w-[880px] max-h-[88vh]"
      icon={<Waves className="w-4 h-4 text-cyan-400" />}
    >
      <div className="p-4 space-y-4 text-xs font-mono text-slate-200">
        
        {/* BARRA DE ASIMILACIÓN TELEMÉTRICA EN VIVO & SELECCIÓN DE MICRO-ZONA GEOGRÁFICA */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900/95 border border-cyan-500/40 p-2.5 rounded-sm gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5 font-mono">
                Micro-Zona de la Bahía & Telemetría en Vivo
                {isFetching && <span className="text-amber-400 text-[9px] animate-pulse">(Asimilando...)</span>}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {telemetryFeedback ? (
                  <span className="text-cyan-300 font-bold">{telemetryFeedback}</span>
                ) : (
                  "Conectores activos: Open-Meteo & Copernicus Marine Services (SST)"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono">
            <ScientificTooltip position="bottom" width="w-[320px]" content="Selecciona la micro-zona de Málaga para evaluar su distancia a la costa y el impacto del frente de brisa marina.">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-cyan-500/50 rounded-sm px-2.5 py-1.5 cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">Zona:</span>
                <select
                  value={activeZone.name}
                  onChange={(e) => {
                    const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                    if (z) setActiveZone(z);
                  }}
                  className="bg-transparent text-[11px] font-mono text-cyan-300 font-bold outline-none cursor-pointer"
                >
                  {PRESET_ZONES.map(z => (
                    <option key={z.name} value={z.name} className="bg-slate-950 text-slate-200">
                      {z.name} — {z.tag}
                    </option>
                  ))}
                </select>
              </div>
            </ScientificTooltip>

            <ScientificTooltip
              title="Sincronización Mesoescalar de Brisa Marina y Terral"
              position="bottom"
              width="w-[290px]"
              content="Recalcula en vivo el gradiente térmico baroclínico mar-tierra (Bahía de Alborán vs Valle del Guadalhorce), el frente de brisa marina y el régimen adiabático de Terral sobre la zona seleccionada."
              formula="\frac{\partial \Gamma_{\text{breeze}}}{\partial t} = \oint \frac{\nabla \rho \times \nabla p}{\rho^2} \cdot d\mathbf{A} \approx \frac{g}{T_0}\frac{T_{\text{land}} - T_{\text{sea}}}{L_x} H_{\text{breeze}}"
            >
              <button
                onClick={() => handleAssimilateZoneData(activeZone)}
                disabled={isFetching}
                className="px-2.5 py-1.5 bg-cyan-950/80 border border-cyan-500/60 hover:bg-cyan-900 text-cyan-300 text-[10px] font-mono font-bold rounded-sm flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('regime')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'regime'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Régimen Dinámico & Alborán SST</span>
          </button>

          <button
            onClick={() => setActiveTab('mblh_recirculation')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'mblh_recirculation'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Capa Marina (MBLH) & Recirculación</span>
          </button>

          <button
            onClick={() => setActiveTab('zones_penetration')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'zones_penetration'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Penetración en Micro-Zonas</span>
          </button>
        </div>

        {/* TAB 1: REGIME & ALBORAN SST */}
        {activeTab === 'regime' && (
          <div className="space-y-3">
            <ScientificTooltip position="bottom" width="w-[340px]" content="Régimen dinámico acoplado de la Bahía de Málaga: Determina si domina la circulación de brisa marina térmica, terral catabático de poniente o régimen sinóptico forzado.">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded flex items-center justify-between cursor-help">
                <div className="flex items-center gap-3">
                  <Waves className="w-8 h-8 text-cyan-400 animate-pulse" />
                  <div>
                    <div className="font-bold text-cyan-300 text-sm">Régimen Micro-Meteo Costa del Sol</div>
                    <div className="text-[11px] text-slate-300">{analysis.regimeDescription}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Frente de Brisa U_sb</span>
                  <span className="text-base font-bold text-cyan-400">{analysis.seaBreezeFrontVelocityMs} m/s</span>
                </div>
              </div>
            </ScientificTooltip>

            {/* Control Sliders & Inputs */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900 border border-slate-800 rounded">
              <ScientificTooltip position="top" width="w-[280px]" content="Temperatura del dosel urbano en la zona seleccionada asimilada en tiempo real de la estación de telemetría oficial.">
                <div className="space-y-1 cursor-help">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Temp. Zona ({activeZone.name.split(' ')[0]}):</span>
                    <span className="text-amber-300 font-bold">{currentTempLandC}°C</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Telemetría Asimilada en Vivo</div>
                </div>
              </ScientificTooltip>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <ScientificTooltip position="top" width="w-[280px]" content="Temperatura de la Superficie del Mar (SST) capturada en tiempo real desde los satélites Sentinel-3 / Copernicus Marine Service en el Mar de Alborán.">
                    <span className="text-slate-400 cursor-help underline decoration-dotted">SST Mar de Alborán:</span>
                  </ScientificTooltip>
                  <span className="text-cyan-300 font-bold">{sstOverrideC}°C</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="27"
                  step="0.5"
                  value={sstOverrideC}
                  onChange={(e) => setSstOverrideC(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
              </div>

              {/* Terral / Catabatic Drainage Toggle */}
              <ScientificTooltip position="top" width="w-[280px]" content="Activar/Desactivar el régimen de Terral (viento catabático nocturno de drenaje térmico descendente desde los Montes de Málaga h ≈ 850m hacia la costa).">
                <div className="space-y-1 cursor-help">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Régimen Catabático (Terral):</span>
                    <span className="text-amber-300 font-bold">{currentWindDirDeg >= 300 || currentWindDirDeg <= 40 ? 'ON (Terral)' : 'OFF (Brisa)'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={currentWindDirDeg}
                    onChange={(e) => setCurrentWindDirDeg(parseInt(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </ScientificTooltip>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
              <ScientificTooltip position="bottom" width="w-[280px]" content="Diferencia de temperatura entre la masa terrestre urbana y la lámina de agua del Mar de Alborán. Motor del gradiente de presión mesoescala.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Gradiente ΔT (Tierra-Mar)</span>
                  <span className={`text-base font-bold ${analysis.deltaT_C > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {analysis.deltaT_C > 0 ? `+${analysis.deltaT_C}` : analysis.deltaT_C} °C
                  </span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Gradiente mesoescala de presión hidrostática calculado deterministamente por la ecuación de Atkinson.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Gradiente Mesoescala ΔP</span>
                  <span className="text-base font-bold text-emerald-400">{analysis.deltaP_hPa} hPa</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Factor de recirculación de contaminantes de Allwine & Whiteman. Mide la fracción de masa de aire contaminada que regresa a la línea de costa por inversión de brisa.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Recirculación Costera</span>
                  <span className="text-base font-bold text-rose-400">{analysis.recirculationIndexPct}%</span>
                </div>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Altura teórica de la Capa Límite Marina (MBLH), significativamente más baja que la PBL continental, comprimiendo el volumen de mezcla.">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Altura Capa Marina (MBLH)</span>
                  <span className="text-base font-bold text-purple-400">{analysis.marineBoundaryLayerHeightM} m</span>
                </div>
              </ScientificTooltip>
            </div>
          </div>
        )}

        {/* TAB 2: MBLH & RECIRCULATION */}
        {activeTab === 'mblh_recirculation' && (
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-purple-300 text-sm">Compresión de la Capa Límite Marina & Recirculación (Millán et al. 1997)</span>
              <span className="text-cyan-400 font-mono font-bold text-xs">O₃ Costero Adicional: +{analysis.photolyticO3CoastEnrichmentUgm3} µg/m³</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-purple-800/60 rounded space-y-2">
                <span className="text-purple-300 font-bold block text-[11px]">Altura de Mezcla Marina (MBLH)</span>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  En régimen de brisa marina activa, la masa de aire frío y estable del Mar de Alborán restringe fuertemente la mezcla vertical a una altura de <strong className="text-purple-400">{analysis.marineBoundaryLayerHeightM} m</strong> (comparado con &gt;1200m en el interior continental). Esto incrementa la concentración efectiva de precursores en la franja litoral de Málaga.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-rose-800/60 rounded space-y-2">
                <span className="text-rose-300 font-bold block text-[11px]">Índice de Recirculación de Allwine & Whiteman</span>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  El factor de recirculación alcanza un <strong className="text-rose-400">{analysis.recirculationIndexPct}%</strong>. Los contaminantes primarios emitidos durante la mañana son transportados sobre el mar, donde la radiación fotolítica sin interferencias convierte NOₓ y COVs en ozono antes de re-ingresar a la costa.
                </p>
              </div>
            </div>

            {/* Tarjeta de Bloqueo Orográfico de los Montes de Málaga */}
            <div className="p-3 bg-slate-950 border border-amber-800/60 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Bloqueo Orográfico en los Montes de Málaga (Barrera h ≈ 850 m) & Número de Froude
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold text-[10px]">
                  Fr = {analysis.froudeNumberOrographic}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                {analysis.orographicBlockingDescription}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: ZONES INLAND PENETRATION */}
        {activeTab === 'zones_penetration' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-300 font-bold">Estado de Penetración en {activeZone.name}:</span>
                  <span className="text-slate-400 block text-[10px]">Distancia euclídea al litoral: {distanceToCoastKm} km | Alcance del frente: {analysis.seaBreezeInlandPenetrationKm} km</span>
                </div>
              </div>
              <span className={`px-2 py-1 font-bold rounded text-[10px] uppercase border ${
                isFrontReached
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-amber-950 text-amber-300 border-amber-600'
              }`}>
                {isFrontReached ? '✓ Frente Marino Activo' : '⚠ Masa de Aire Interior'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
              <span className="text-emerald-300 font-bold block text-[11px]">Deflexión de Coriolis en Málaga ({analysis.coriolisDeflectionDeg}°/h)</span>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                A la latitud de Málaga (36.72° N), la fuerza de Coriolis (f = 2Ω·sin(ϕ) ≈ 8.7×10⁻⁵ s⁻¹) rota gradualmente la dirección de la brisa hacia la derecha (de Sur-Sudeste a Sudoeste) a lo largo del día, afectando progresivamente a las zonas orientales (El Palo, Malagueta) y posteriormente a las zonas occidentales (Misericordia, Teatinos).
              </p>
            </div>
          </div>
        )}

        {/* Scientific Explanation Box */}
        <ScientificTooltip position="top" width="w-[360px]" content="Mecanismo de Millán et al. (1997) para cuencas del Mediterráneo Occidental: Las brisas térmicas transportan contaminantes primarios mar adentro formando reservorios estratificados que re-ingresan a tierra enriquecidos en ozono fotoquímico.">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-2 cursor-help">
            <div className="text-cyan-400 font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Fundamentación Dinámica de la Bahía de Málaga (Tesis Doctoral)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              La Bahía de Málaga experimenta una interacción acoplada entre el viento sinóptico y las brisas locales. 
              Durante episodios de brisa de mar activa (S-SE), el aire marino frío y estable forma una Capa Límite Marina (MBLH) suprimida (~{analysis.marineBoundaryLayerHeightM}m). 
              Los precursores de NOₓ emitidos por el tráfico de la N-340 y el Puerto de Málaga son transportados mar adentro, donde la irradiancia directa foto-oxidará los precursores a O₃ aceleradamente, incrementando la masa de ozono costero en un estimado de <strong className="text-cyan-300">+{analysis.photolyticO3CoastEnrichmentUgm3} µg/m³</strong> al retornar la brisa por la tarde.
            </p>
          </div>
        </ScientificTooltip>
      </div>
    </DraggableWindow>
  );
}
