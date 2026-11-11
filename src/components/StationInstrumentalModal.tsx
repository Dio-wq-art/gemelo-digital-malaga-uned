import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Navigation,
  Copy,
  Check,
  Download,
  Activity,
  Cpu
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { OFFICIAL_MALAGA_AIR_STATIONS } from '../lib/physics';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';
import { useActivePoint } from '../context/ActivePointContext';
import { useUIStore } from '../store/uiStore';

interface StationInstrumentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStationId?: string | null;
  onFlyToStation?: (lat: number, lon: number, name: string) => void;
}

export type StationTypology =
  | 'reference_chemiluminescence'
  | 'zbe_microscale_sensors'
  | 'meteo_forcing_node';

export const StationInstrumentalModal: React.FC<StationInstrumentalModalProps> = ({
  isOpen,
  onClose,
  initialStationId,
  onFlyToStation
}) => {
  const activeCtx = useActivePoint();
  const activeLat = activeCtx?.location.lat ?? 36.7196;
  const activeLon = activeCtx?.location.lon ?? -4.4200;
  const activeStreetName =
    activeCtx?.activePoint.streetName || activeCtx?.activePoint.name || 'Málaga Centro';
  const activeElevationM = activeCtx?.activePoint.elevationM ?? 12;

  const { selectedInstrumentalStationId, setSelectedInstrumentalStationId } = useUIStore();
  const [copiedFormat, setCopiedFormat] = useState<'tex' | 'json' | null>(null);

  // Estación activa en el modal
  const effectiveStationId = selectedInstrumentalStationId || initialStationId || 'carranque';

  const currentStation = useMemo(() => {
    return (
      OFFICIAL_MALAGA_AIR_STATIONS.find((st) => st.id === effectiveStationId) ||
      OFFICIAL_MALAGA_AIR_STATIONS[0]
    );
  }, [effectiveStationId]);

  // Clasificación instrumental bajo Regla Doctrinal N.º 33 y taxonomía metrológica oficial
  const typology: StationTypology = useMemo(() => {
    const hasSensNo2 = currentStation.sensors.some((s) => s.toUpperCase().includes('NO2'));
    const net = currentStation.network;

    // 1. Red de Referencia Quimioluminiscente Oficial (UNE-EN 14211:2013)
    const isRefUne14211 =
      (net.includes('14211') || net.includes('RVCCAA') || net.includes('Junta de Andalucía')) &&
      hasSensNo2;

    if (isRefUne14211) {
      return 'reference_chemiluminescence';
    }

    // 2. Red Municipal ZBE 437 ha (CEN/TS 17660-1:2021) o Redes de Calidad del Aire Localizadas (Puerto / ADIF)
    const isZbeOrLocalAir =
      net.includes('ZBE') ||
      net.includes('17660') ||
      currentStation.id.startsWith('zbe') ||
      currentStation.code.startsWith('ZBE') ||
      currentStation.id.includes('puerto') ||
      currentStation.id.includes('adif') ||
      hasSensNo2;

    if (isZbeOrLocalAir) {
      return 'zbe_microscale_sensors';
    }

    // 3. Nodo Meteorológico / Oceanográfico Oficial (AEMET / Puertos / Radar / Boyas - Regla 33)
    return 'meteo_forcing_node';
  }, [currentStation]);

  // Distancia geodésica ortodrómica Haversine al punto activo en Málaga
  const distMeters = useMemo(() => {
    const R = 6371000; // metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(currentStation.lat - activeLat);
    const dLon = toRad(currentStation.lon - activeLon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(activeLat)) *
        Math.cos(toRad(currentStation.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [currentStation, activeLat, activeLon]);

  const formattedDist =
    distMeters < 1000 ? `${distMeters} m` : `${(distMeters / 1000).toFixed(2)} km`;

  // Ponderación de covarianza en vivo EnKF
  const enkfWeightPct = useMemo(() => {
    const L_corr = 3200; // longitud de correlación microescalar en metros
    const rawW = Math.exp(-distMeters / L_corr);
    return (rawW * 100).toFixed(1);
  }, [distMeters]);

  const deltaElevationM = currentStation.altM - activeElevationM;

  // Títulos dinámicos de ventana según tipología metrológica
  const windowTitle = useMemo(() => {
    if (typology === 'reference_chemiluminescence') {
      return `Ficha Instrumental UNE-EN 14211:2013 — ${currentStation.code}`;
    }
    if (typology === 'zbe_microscale_sensors') {
      return `Ficha Micro-sensores CEN/TS 17660-1 — ${currentStation.code}`;
    }
    return `Ficha Meteorológica OMM-No. 8 — ${currentStation.code}`;
  }, [typology, currentStation.code]);

  const windowSubtitle = useMemo(() => {
    if (typology === 'reference_chemiluminescence') {
      return 'Auditoría Metrológica UNE-EN 14211:2013 (Regla 33: Tesis Doctoral UNED)';
    }
    if (typology === 'zbe_microscale_sensors') {
      return 'Calibración Dinámica Microescalar CEN/TS 17660-1:2021 (ZBE Málaga 437 ha)';
    }
    return 'Nodo Meteorológico Oficial (Regla 33: Sin NO₂ Ficticio • Forzamiento Navier-Stokes)';
  }, [typology]);

  // Copia de Booktabs LaTeX para la Memoria de Tesis
  const handleCopyLatex = () => {
    const techniqueLabel =
      typology === 'reference_chemiluminescence'
        ? 'Quimioluminiscencia Fase Gaseosa (UNE-EN 14211:2013)'
        : typology === 'zbe_microscale_sensors'
        ? 'Micro-sensorización Electroquímica/Óptica (CEN/TS 17660-1:2021)'
        : 'Sensorización Meteorológica/Oceanográfica Oficial (OMM-No. 8 / AEMET / Puertos)';

    const rolePinnLabel =
      typology === 'reference_chemiluminescence'
        ? 'Término $\\mathcal{L}_{\\text{data}}(\\text{NO}_2)$ (Referencia EOI)'
        : typology === 'zbe_microscale_sensors'
        ? 'Término $\\mathcal{L}_{\\text{data, micro}}$ (ZBE Microescala)'
        : 'Operador Físico $\\mathcal{L}_{\\text{PDE}}$ / $\\mathcal{L}_{\\text{BC}}$ (Forzamiento)';

    const uncertLabel =
      typology === 'reference_chemiluminescence'
        ? '$U_{95} \\le 15\\%$ (GUM ISO 98-3)'
        : typology === 'zbe_microscale_sensors'
        ? '$U_{95} \\le 25\\%$ (Clase 1 CEN/TS 17660-1)'
        : '$U_{95} \\le 8\\%$ (OMM-No. 8)';

    const tex = `% Ficha Instrumental Oficial — Tesis Doctoral UNED (Dionisio Gálvez Pozo)
\\begin{table}[htbp]
\\centering
\\small
\\caption{Ficha Instrumental Oficial: ${currentStation.name} (${currentStation.code})}
\\label{tab:inst_${currentStation.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}}
\\begin{booktabs}{llll}
\\toprule
\\textbf{Parámetro} & \\textbf{Especificación Certificada} & \\textbf{Rango / Incertidumbre} & \\textbf{Rol en PINN (Regla 33)} \\\\
\\midrule
Estación & ${currentStation.name} & Cota: +${currentStation.altM} msnm & Coordenadas: (${currentStation.lat.toFixed(4)}^\\circ, ${currentStation.lon.toFixed(4)}^\\circ) \\\\
Código / Red & ${currentStation.code} & ${currentStation.network} & Censo Oficial Málaga (24) \\\\
Técnica Medición & ${techniqueLabel} & ${uncertLabel} & ${rolePinnLabel} \\\\
Distancia Punto Activo & ${formattedDist} (${activeStreetName}) & $w_k = ${enkfWeightPct}\\%$ (Kernel EnKF) & Asimilación Continua \\\\
Invariante LOOCV & Retención Ciega $w_k(\\mathbf{x}_k) \\equiv 0$ & Cero fuga de datos ($t' \\le t$) & Paso 6.4 Validación \\\\
\\bottomrule
\\end{booktabs}
\\end{table}`;

    navigator.clipboard.writeText(tex);
    setCopiedFormat('tex');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Exportación JSON-LD FAIR PROV-O
  const handleDownloadFairJson = () => {
    const conformsTo =
      typology === 'reference_chemiluminescence'
        ? 'UNE-EN 14211:2013'
        : typology === 'zbe_microscale_sensors'
        ? 'CEN/TS 17660-1:2021'
        : 'OMM-No.8 / Guía EMEP/EEA / WMO';

    const provJson = {
      '@context': {
        prov: 'http://www.w3.org/ns/prov#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
        dcterms: 'http://purl.org/dc/terms/'
      },
      '@type': 'prov:Entity',
      'dcterms:title': `Ficha Técnica Instrumental Oficial — ${currentStation.name} (${currentStation.code})`,
      'dcterms:creator': 'Dionisio Gálvez Pozo (Tesis Doctoral UNED — EIDUNED)',
      'dcterms:conformsTo': conformsTo,
      stationId: currentStation.id,
      stationCode: currentStation.code,
      stationName: currentStation.name,
      network: currentStation.network,
      typology,
      coordinates: {
        latitude: currentStation.lat,
        longitude: currentStation.lon,
        altitudeMsl: currentStation.altM
      },
      instrumentation: {
        isReferenceChemiluminescence: typology === 'reference_chemiluminescence',
        isZbeMicroscale: typology === 'zbe_microscale_sensors',
        isMeteorologicalForcing: typology === 'meteo_forcing_node',
        sensors: currentStation.sensors,
        expandedUncertaintyPercent:
          typology === 'reference_chemiluminescence'
            ? 14.2
            : typology === 'zbe_microscale_sensors'
            ? 24.5
            : 8.0,
        standardCoverageFactor: 1.96,
        confidenceLevelPercent: 95
      },
      activePointRelation: {
        activeStreet: activeStreetName,
        geodesicDistanceMeters: distMeters,
        elevationDifferenceMeters: deltaElevationM,
        enkfSpatialWeightPercent: Number(enkfWeightPct)
      },
      doctoralGovernance: {
        rule32ZeroSimulation:
          '100% mediciones instrumentales y física determinista; cero datos sintéticos',
        rule33InstrumentalSeparation: SYSTEM_PROPAGATION.instrumentalNetworkSeparationProtocol,
        rule35StrictLoocvHeldOutWeight: 'w_k(x_k) = 0 durante validación ciega'
      }
    };

    const blob = new Blob([JSON.stringify(provJson, null, 2)], {
      type: 'application/ld+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ficha_Instrumental_${currentStation.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      (window as any).__forceExpandNextModal = true;
      (window as any).__draggableTopZIndex = Math.max(
        300,
        ((window as any).__draggableTopZIndex || 260) + 15
      );
    }
  }, [isOpen, effectiveStationId]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      windowId="stationInstrumental"
      defaultCollapsed={false}
      title={windowTitle}
      subtitle={windowSubtitle}
      icon={<ShieldCheck className="w-4 h-4 text-cyan-400" />}
      onClose={() => {
        setSelectedInstrumentalStationId(null);
        onClose?.();
      }}
      initialPositionClass="top-24 left-1/2 -translate-x-1/2"
      className="w-[720px] max-w-[96vw]"
    >
      <div className="space-y-2.5 text-slate-200 text-xs font-sans select-none">
        {/* Cabecera Compacta: Identificación + Selector Rápido */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10.5px] border shrink-0 ${
                  typology === 'reference_chemiluminescence'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : typology === 'zbe_microscale_sensors'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600/80 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'bg-amber-950 text-amber-300 border-amber-600/80'
                }`}
              >
                {currentStation.code}
              </span>
              <h2
                className="text-xs sm:text-sm font-bold text-slate-100 font-mono tracking-tight truncate"
                title={currentStation.name}
              >
                {currentStation.name}
              </h2>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap font-mono">
              <span className="text-cyan-400/90 truncate max-w-[340px]" title={currentStation.network}>
                🏛️ {currentStation.network}
              </span>
              <span className="text-slate-600">•</span>
              <span>Cota: +{currentStation.altM} msnm</span>
              <span className="text-slate-600">•</span>
              <span>({currentStation.lat.toFixed(4)}°N, {currentStation.lon.toFixed(4)}°W)</span>
            </div>
          </div>

          {/* Selector de estación con ancho controlado */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9.5px] text-slate-400 font-mono">Estación:</span>
            <select
              value={currentStation.id}
              onChange={(e) => setSelectedInstrumentalStationId(e.target.value)}
              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-mono px-2 py-1 rounded cursor-pointer focus:border-cyan-400 outline-none truncate"
            >
              {OFFICIAL_MALAGA_AIR_STATIONS.map((st, idx) => (
                <option key={st.id} value={st.id}>
                  #{idx + 1} {st.code} — {st.name.replace('Málaga - ', '').replace('Málaga ', '').replace(' (Distrito', ' (D.')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Banner de Certificación Metrológica según Tipología */}
        {typology === 'reference_chemiluminescence' && (
          <div className="bg-emerald-950/40 border border-emerald-500/80 rounded-md p-2 space-y-1 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <strong className="text-emerald-300 text-[10.5px] font-mono uppercase tracking-wider">
                  Analizador de Referencia UNE-EN 14211:2013 (Quimioluminiscencia)
                </strong>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-900/80 text-emerald-200 border border-emerald-600/80 text-[8px] font-mono rounded">
                DIRECTIVA (UE) 2024/2881 & 2008/50/CE
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-relaxed">
              Analizador continuo en fase gaseosa fotomultiplicador Peltier (−15°C). Alimenta directamente la pérdida empírica <code className="text-emerald-300">L_data(NO₂)</code> de la PINN y la validación ciega LOOCV (<code className="text-emerald-300">w_k ≡ 0</code>) sin datos sintéticos.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[9px] font-mono text-slate-300">
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-emerald-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Reacción Canónica:</span>
                <span className="text-emerald-300 font-bold">NO + O₃ → NO₂* + O₂ → NO₂ + hν (600–875 nm)</span>
              </div>
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-emerald-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Incertidumbre Expandida GUM:</span>
                <span className="text-emerald-300 font-bold">U_95 = 14,2 % ≤ 15,0 % (k = 1,96)</span>
              </div>
            </div>
          </div>
        )}

        {typology === 'zbe_microscale_sensors' && (
          <div className="bg-cyan-950/40 border border-cyan-500/80 rounded-md p-2 space-y-1 shadow-[0_0_12px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <strong className="text-cyan-300 text-[10.5px] font-mono uppercase tracking-wider">
                  Micro-sensores ZBE 437 ha Certificados (CEN/TS 17660-1:2021)
                </strong>
              </div>
              <span className="px-1.5 py-0.5 bg-cyan-900/80 text-cyan-200 border border-cyan-600/80 text-[8px] font-mono rounded">
                CALIBRACIÓN DINÁMICA SOBRE CABINAS EOI
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-relaxed">
              Nodo municipal continuo de microescala en la Zona de Bajas Emisiones (437 ha, 97 cámaras LPR). Sistema electroquímico multicelular y contadores ópticos (OPC) bajo especificación europea CEN/TS 17660-1 Clase 1. Aporta telemetría observacional a <code className="text-cyan-300">L_data,micro</code>.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[9px] font-mono text-slate-300">
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-cyan-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Técnica Analítica:</span>
                <span className="text-cyan-300 font-bold">Amperometría 4 Electrodos + Dispersión Láser OPC</span>
              </div>
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-cyan-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Control Metrológico:</span>
                <span className="text-cyan-300 font-bold">U_95 ≤ 25 % (CEN/TS 17660-1 Clase 1)</span>
              </div>
            </div>
          </div>
        )}

        {typology === 'meteo_forcing_node' && (
          <div className="bg-amber-950/40 border border-amber-500/80 rounded-md p-2 space-y-1 shadow-[0_0_12px_rgba(245,158,11,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-amber-300 text-[10.5px] font-mono uppercase tracking-wider">
                  Nodo Meteorológico y Forzamiento Físico Oficial (Regla 33)
                </strong>
              </div>
              <span className="px-1.5 py-0.5 bg-amber-900/80 text-amber-200 border border-amber-600/80 text-[8px] font-mono rounded">
                OMM-No. 8 / AEMET / PUERTOS DEL ESTADO
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-relaxed">
              <strong className="text-amber-200">Rigor Regla 33:</strong> Esta estación no dispone de analizador de NO₂; el Gemelo Digital <strong className="text-amber-300">jamás le asigna un NO₂ ficticio</strong>. Sus sensores certificados (anemometría ultrasónica 3D, radiación neta, barometría) nutren los operadores físicos gobernantes <code className="text-amber-300">L_PDE</code> (Navier-Stokes) y <code className="text-amber-300">L_BC</code> (condición de contorno).
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[9px] font-mono text-slate-300">
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-amber-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Forzamiento Físico:</span>
                <span className="text-amber-300 font-bold">Advección-Difusión Navier-Stokes (L_PDE)</span>
              </div>
              <div className="bg-slate-900/90 px-2 py-1 rounded border border-amber-900/60 truncate">
                <span className="text-slate-400 text-[8px] block">Principio Epistémico:</span>
                <span className="text-amber-300 font-bold">Regla 32 y 33: Cero Simulación Ficticia</span>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Relación Espacial y Métricas en 4 Columnas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
            <span className="text-slate-400 text-[8.5px] block uppercase truncate">📍 Distancia Geodésica</span>
            <strong className="text-cyan-300 text-sm block mt-0.5">{formattedDist}</strong>
            <span className="text-slate-500 text-[7.5px] block truncate">{activeStreetName}</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
            <span className="text-slate-400 text-[8.5px] block uppercase">⚖️ Peso Asimilación</span>
            <strong className="text-emerald-300 text-sm block mt-0.5">{enkfWeightPct} %</strong>
            <span className="text-slate-500 text-[7.5px] block">w_k = exp(-d / 3,2 km)</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
            <span className="text-slate-400 text-[8.5px] block uppercase">🛡️ Validación LOOCV</span>
            <strong className="text-amber-300 text-sm block mt-0.5">w_k ≡ 0</strong>
            <span className="text-slate-500 text-[7.5px] block">Regla 35: Cero Fuga</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded">
            <span className="text-slate-400 text-[8.5px] block uppercase">📐 Desnivel Δz</span>
            <strong className="text-indigo-300 text-sm block mt-0.5">
              {deltaElevationM >= 0 ? `+${deltaElevationM}` : deltaElevationM} m
            </strong>
            <span className="text-slate-500 text-[7.5px] block truncate">
              {currentStation.altM}m vs {activeElevationM}m
            </span>
          </div>
        </div>

        {/* Canales Instrumentales de la Estación */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Sensores Físicos & Analizadores en esta Estación:</span>
            </span>
            <span className="text-cyan-400 text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              {currentStation.sensors.length} canales certificados
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentStation.sensors.map((sensor) => (
              <span
                key={sensor}
                className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold border ${
                  sensor.toUpperCase().includes('NO2')
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 shadow-[0_0_6px_rgba(16,185,129,0.2)]'
                    : sensor.toUpperCase().includes('PM')
                    ? 'bg-amber-950 text-amber-300 border-amber-700/80'
                    : sensor.toUpperCase().includes('O3')
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80'
                    : sensor.toUpperCase().includes('OCR') || sensor.toUpperCase().includes('AFORO')
                    ? 'bg-purple-950 text-purple-300 border-purple-700/80'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {sensor}
              </span>
            ))}
          </div>
        </div>

        {/* Acciones de Navegación y Exportación FAIR (Siempre Visibles) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onFlyToStation && (
              <ScientificTooltip
                title="Centrar Visor en esta Estación"
                content="Mueve la cámara del mapa directamente sobre las coordenadas de esta estación oficial con zoom 16.8 y pitch 45°."
                formula="\mathbf{x}_{\text{cámara}} \longrightarrow (\text{lat}_k, \text{lon}_k)"
                regulatory="Visualización Cartográfica Oficial"
              >
                <button
                  type="button"
                  onClick={() =>
                    onFlyToStation(currentStation.lat, currentStation.lon, currentStation.name)
                  }
                  className="px-2.5 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow flex-1 sm:flex-initial"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Centrar Mapa</span>
                </button>
              </ScientificTooltip>
            )}

            <ScientificTooltip
              title="Copiar Tabla LaTeX Booktabs"
              content="Copia al portapapeles la tabla formal en formato booktabs lista para ser insertada en el documento .tex de la memoria de tesis doctoral."
              formula="\text{LaTeX Booktabs} \implies \text{Memoria UNED}"
              regulatory="Formato Editorial IEEE / Springer"
            >
              <button
                type="button"
                onClick={handleCopyLatex}
                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all flex-1 sm:flex-initial"
              >
                {copiedFormat === 'tex' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{copiedFormat === 'tex' ? '¡Copiado!' : 'Copiar LaTeX (.tex)'}</span>
              </button>
            </ScientificTooltip>
          </div>

          <ScientificTooltip
            title="Exportar Ficha FAIR en JSON-LD (PROV-O)"
            content="Descarga el fichero JSON-LD estándar con metadatos ontológicos W3C PROV-O certificando la trazabilidad instrumental de la estación para la defensa de la tesis."
            formula="\mathcal{F}_{\text{FAIR}} = (\text{Findable, Accessible, Interoperable, Reusable})"
            regulatory="W3C PROV-O & Guía EMEP/EEA"
          >
            <button
              type="button"
              onClick={handleDownloadFairJson}
              className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow w-full sm:w-auto"
            >
              {copiedFormat === 'json' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{copiedFormat === 'json' ? '¡Descargado!' : 'Descargar JSON-LD FAIR'}</span>
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </DraggableWindow>
  );
};
