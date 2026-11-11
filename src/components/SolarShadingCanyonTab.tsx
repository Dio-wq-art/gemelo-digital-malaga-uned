/**
 * PESTAÑA DE EFEMÉRIDES SOLARES Y FOTÓLISIS DE LEIGHTON EN CAÑONES 3D
 * =================================================================
 * Tesis Doctoral - Modelización de Calidad del Aire a Microescala en Málaga.
 */

import React, { useState, useMemo } from 'react';
import { 
  Sun, 
  Clock, 
  Calendar, 
  Download, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Compass
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';
import { calculateSolarCanyonShading, CanyonGeometry, SolarCanyonState } from '../utils/solarShadingCanyon';

interface SolarShadingCanyonTabProps {
  canyon: {
    id: string;
    name: string;
    H: number;
    W: number;
    orientationDeg: number;
    lat: number;
    lng: number;
  };
  currentSolarUV: number;
}

export const SolarShadingCanyonTab: React.FC<SolarShadingCanyonTabProps> = ({
  canyon,
  currentSolarUV
}) => {
  // Estado de simulación temporal: hora seleccionada (0 a 24) o tiempo real
  const [selectedHour, setSelectedHour] = useState<number>(() => new Date().getHours() + new Date().getMinutes() / 60);
  const [selectedSeason, setSelectedSeason] = useState<'today' | 'summer_solstice' | 'winter_solstice' | 'equinox'>('today');
  const [userUvIndex, setUserUvIndex] = useState<number>(Math.max(1, currentSolarUV || 5.5));
  const [isLiveClock, setIsLiveClock] = useState<boolean>(false);

  // Fecha calculada según la estación seleccionada
  const simulationDate = useMemo(() => {
    const d = new Date();
    if (selectedSeason === 'summer_solstice') {
      d.setMonth(5); // Junio
      d.setDate(21);
    } else if (selectedSeason === 'winter_solstice') {
      d.setMonth(11); // Diciembre
      d.setDate(21);
    } else if (selectedSeason === 'equinox') {
      d.setMonth(8); // Septiembre
      d.setDate(21);
    }
    const hours = Math.floor(selectedHour);
    const minutes = Math.floor((selectedHour - hours) * 60);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }, [selectedSeason, selectedHour]);

  // Cálculo físico determinista del sombreado y fotólisis
  const solarState: SolarCanyonState = useMemo(() => {
    return calculateSolarCanyonShading(
      {
        H: canyon.H,
        W: canyon.W,
        orientationDeg: canyon.orientationDeg,
        lat: canyon.lat,
        lng: canyon.lng
      },
      simulationDate,
      userUvIndex
    );
  }, [canyon, simulationDate, userUvIndex]);

  // Simulación del ciclo diurno completo (24 horas) para exportación FAIR y gráfico
  const diurnalProfile = useMemo(() => {
    const points: any[] = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const d = new Date(simulationDate);
      const hours = Math.floor(h);
      const minutes = Math.floor((h - hours) * 60);
      d.setHours(hours, minutes, 0, 0);
      const res = calculateSolarCanyonShading(
        {
          H: canyon.H,
          W: canyon.W,
          orientationDeg: canyon.orientationDeg,
          lat: canyon.lat,
          lng: canyon.lng
        },
        d,
        userUvIndex
      );
      points.push({
        hour: h,
        solarAltitude: res.solarAltitudeDeg,
        ghi: res.ghiWm2,
        dni: res.dniWm2,
        floorShadowPct: res.floorShadowFraction * 100,
        jNo2Sunlit: res.jNo2SunlitFacade,
        jNo2Shaded: res.jNo2ShadedFacade,
        jNo2Street: res.jNo2StreetFloor,
        asymmetry: res.photolysisAsymmetryRatio
      });
    }
    return points;
  }, [canyon, simulationDate, userUvIndex]);

  // Exportación FAIR en CSV
  const handleExportCsv = () => {
    const headers = [
      'Hora_Local',
      'Altitud_Solar_Deg',
      'Acimut_Solar_Deg',
      'GHI_W_m2',
      'DNI_W_m2',
      'Sombra_Calzada_Pct',
      'Fachada_Sotavento_Soleada_Pct',
      'Fachada_Barlovento_Soleada_Pct',
      'J_NO2_Soleada_s_1',
      'J_NO2_Sombra_s_1',
      'J_NO2_Calzada_s_1',
      'Ratio_Asimetria_J',
      'Prod_O3_Est_ppb_h'
    ];

    const rows = diurnalProfile.map(p => [
      p.hour.toFixed(1),
      p.solarAltitude.toFixed(2),
      canyon.orientationDeg.toFixed(1),
      p.ghi.toFixed(1),
      p.dni.toFixed(1),
      p.floorShadowPct.toFixed(1),
      (solarState.leewardFacadeSunlitFraction * 100).toFixed(1),
      (solarState.windwardFacadeSunlitFraction * 100).toFixed(1),
      p.jNo2Sunlit.toExponential(4),
      p.jNo2Shaded.toExponential(4),
      p.jNo2Street.toExponential(4),
      p.asymmetry.toFixed(2),
      (p.jNo2Sunlit * 3600 * 35 * 0.35).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `solar_shading_leighton_${canyon.id}_${simulationDate.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportación FAIR en GeoJSON
  const handleExportGeoJson = () => {
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        title: `Sombreado 3D y Fotólisis Leighton - ${canyon.name}`,
        canyonId: canyon.id,
        timestamp: simulationDate.toISOString(),
        solarAltitudeDeg: solarState.solarAltitudeDeg,
        solarAzimuthDeg: solarState.solarAzimuthDeg,
        skyViewFactor: solarState.skyViewFactor,
        methodology: "Oke (1988) + SunCalc + Leighton Photolysis J_NO2 (Dickerson 1982)"
      },
      features: [
        {
          type: "Feature",
          properties: {
            tipo: "Eje_Central_Calzada",
            nombre: canyon.name,
            anchura_m: canyon.W,
            altura_edificios_m: canyon.H,
            sombra_calzada_pct: solarState.floorShadowFraction * 100,
            j_no2_calzada_s_1: solarState.jNo2StreetFloor
          },
          geometry: {
            type: "Point",
            coordinates: [canyon.lng, canyon.lat]
          }
        },
        {
          type: "Feature",
          properties: {
            tipo: "Fachada_Oeste_Sotavento",
            iluminacion_pct: solarState.leewardFacadeSunlitFraction * 100,
            j_no2_s_1: solarState.leewardFacadeSunlitFraction > 0 ? solarState.jNo2SunlitFacade : solarState.jNo2ShadedFacade
          },
          geometry: {
            type: "Point",
            coordinates: [canyon.lng - 0.0001, canyon.lat]
          }
        },
        {
          type: "Feature",
          properties: {
            tipo: "Fachada_Este_Barlovento",
            iluminacion_pct: solarState.windwardFacadeSunlitFraction * 100,
            j_no2_s_1: solarState.windwardFacadeSunlitFraction > 0 ? solarState.jNo2SunlitFacade : solarState.jNo2ShadedFacade
          },
          geometry: {
            type: "Point",
            coordinates: [canyon.lng + 0.0001, canyon.lat]
          }
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `canyon_solar_geojson_${canyon.id}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Coordenadas normalizadas para el SVG del cañón 2D
  const svgWidth = 440;
  const svgHeight = 220;
  const groundY = 180;
  const scale = 3.4; // px por metro
  const buildingWidth = 70;
  const canyonWidthPx = canyon.W * scale;
  const buildingHeightPx = canyon.H * scale;
  const leftBuildingX = (svgWidth - canyonWidthPx) / 2 - buildingWidth;
  const rightBuildingX = leftBuildingX + buildingWidth + canyonWidthPx;
  const leftWallX = leftBuildingX + buildingWidth;
  const rightWallX = rightBuildingX;
  const roofY = groundY - buildingHeightPx;

  // Cálculo visual del trazado del rayo de sombra
  const apparentZenith = solarState.apparentSolarZenithDeg;
  const shadowFloorWidthPx = Math.min(canyonWidthPx, (solarState.floorShadowLengthM * scale));

  return (
    <div className="space-y-4 text-slate-200">
      {/* Barra Superior de Control Solar */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-bold text-xs text-white">
              Efemérides Solares &amp; Sombreado 3D de Fachadas (Málaga: 36.72°N, -4.42°W)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip content="Descarga de series temporales horarias de radiación solar y constantes de fotólisis J_NO2 en formato CSV estándar.">
              <button
                onClick={handleExportCsv}
                className="px-2 py-1 bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-amber-400" /> CSV
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Exportación espacial en GeoJSON de las fachadas del cañón urbano con atributos de irradiancia y fotólisis.">
              <button
                onClick={handleExportGeoJson}
                className="px-2 py-1 bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-emerald-400" /> GeoJSON
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Controles de Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Selector de Estación */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-400" /> Estación Astronómica:
              <ScientificTooltip
                title="Declinación Solar Astronómica (δ_s)"
                formula="\sin\alpha_s = \sin\phi\sin\delta_s + \cos\phi\cos\delta_s\cos\omega_h"
                normative="Algoritmo Astronómico NOAA / Michalsky (1988)"
                content="Modifica la declinación solar δ_s (±23.44° en solsticios, 0° en equinoccios) para evaluar el régimen de sombreado geométrico estacional del cañón urbano."
              />
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value as any)}
              className="w-full bg-black/80 border border-slate-700 text-[11px] p-1 text-white font-mono"
            >
              <option value="today">Fecha Actual ({new Date().toLocaleDateString('es-ES')})</option>
              <option value="summer_solstice">Solsticio de Verano (21 Junio - Cenit Máximo)</option>
              <option value="winter_solstice">Solsticio de Invierno (21 Dic - Sombras Largas)</option>
              <option value="equinox">Equinoccio (21 Septiembre)</option>
            </select>
          </div>

          {/* Selector Horario */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Hora Local:
                <ScientificTooltip
                  title="Ángulo Horario Solar (ω_h) y Proyección de Sombra"
                  formula="L_{\text{shadow}} = H \cdot \frac{|\sin(\gamma_s - \theta_{\text{street}})|}{\tan\alpha_s}"
                  normative="Oke (1988) Street Canyon Geometry"
                  content="Controla el ángulo horario solar y el acimut relativo respecto al eje axial de la calle para resolver qué fachada (barlovento o sotavento) recibe irradiancia directa."
                />
              </span>
              <span className="text-amber-300 font-bold">
                {Math.floor(selectedHour).toString().padStart(2, '0')}:{Math.floor((selectedHour % 1) * 60).toString().padStart(2, '0')} UTC+2
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="22"
              step="0.25"
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Índice UV de Referencia */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" /> Radiación UV:
                <ScientificTooltip
                  title="Flujo Actínico UV-A (320–420 nm) y Fotodisociación"
                  formula="J_{\text{NO}_2} = \int_{290\text{ nm}}^{420\text{ nm}} \sigma_{\text{NO}_2}(\lambda)\,\phi_{\text{NO}_2}(\lambda)\,F_{\text{act}}(\lambda)\,d\lambda"
                  normative="Madronich (1987) TUV Model • Dickerson et al. (1982)"
                  content="Índice de radiación ultravioleta incidente en el tope del dosel urbano que modula directamente el flujo actínico espectral."
                />
              </span>
              <span className="text-amber-400 font-bold">{userUvIndex.toFixed(1)} UV-I</span>
            </div>
            <input
              type="range"
              min="1"
              max="11"
              step="0.5"
              value={userUvIndex}
              onChange={(e) => setUserUvIndex(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Diagrama 2D Interactivo de la Sección del Cañón con Sombra Solar Proyectada */}
      <div className="p-3 bg-black/70 border border-slate-800 rounded-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Sección Transversal 3D • {canyon.name} (H={canyon.H}m, W={canyon.W}m, Azimut={canyon.orientationDeg}°)</span>
          </div>
          <div className="text-[9.5px] font-mono text-slate-400">
            Altitud Solar: <strong className="text-amber-400">{solarState.solarAltitudeDeg}°</strong> | Acimut: <strong className="text-amber-400">{solarState.solarAzimuthDeg}°</strong>
          </div>
        </div>

        {/* SVG de Sombreado Dinámico */}
        <div className="flex justify-center bg-slate-950/90 border border-slate-800/80 p-2 relative rounded-sm">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible font-mono select-none">
            {/* Cielo */}
            <rect x="0" y="0" width={svgWidth} height={groundY} fill={solarState.solarAltitudeDeg > 5 ? "#061325" : "#020617"} />

            {/* Suelo del Cañón */}
            <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#0f172a" />
            <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#334155" strokeWidth="2" />

            {/* Edificio Izquierdo (Oeste / Sotavento) */}
            <rect
              x={leftBuildingX}
              y={roofY}
              width={buildingWidth}
              height={buildingHeightPx}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Fachada Iluminada o en Sombra (Izquierda) */}
            {solarState.leewardFacadeSunlitFraction > 0 ? (
              <rect
                x={leftWallX - 3}
                y={roofY}
                width={3}
                height={buildingHeightPx * solarState.leewardFacadeSunlitFraction}
                fill="#f59e0b"
                className="animate-pulse"
              />
            ) : null}

            {/* Edificio Derecho (Este / Barlovento) */}
            <rect
              x={rightBuildingX}
              y={roofY}
              width={buildingWidth}
              height={buildingHeightPx}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Fachada Iluminada o en Sombra (Derecha) */}
            {solarState.windwardFacadeSunlitFraction > 0 ? (
              <rect
                x={rightWallX}
                y={roofY}
                width={3}
                height={buildingHeightPx * solarState.windwardFacadeSunlitFraction}
                fill="#f59e0b"
                className="animate-pulse"
              />
            ) : null}

            {/* Zona de Sombra Proyectada en el Suelo */}
            {solarState.solarAltitudeDeg > 0 && shadowFloorWidthPx > 0 ? (
              <rect
                x={leftWallX}
                y={groundY - 4}
                width={shadowFloorWidthPx}
                height={4}
                fill="#1e1b4b"
                stroke="#6366f1"
                strokeWidth="1"
              />
            ) : null}

            {/* Zona Soleada en el Suelo */}
            {solarState.solarAltitudeDeg > 0 && (canyonWidthPx - shadowFloorWidthPx) > 0 ? (
              <rect
                x={leftWallX + shadowFloorWidthPx}
                y={groundY - 4}
                width={canyonWidthPx - shadowFloorWidthPx}
                height={4}
                fill="#fbbf24"
              />
            ) : null}

            {/* Rayo Solar Proyectado */}
            {solarState.solarAltitudeDeg > 2 ? (
              <line
                x1={leftWallX}
                y1={roofY}
                x2={leftWallX + shadowFloorWidthPx}
                y2={groundY}
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.75"
              />
            ) : null}

            {/* Sol Esquemático */}
            {solarState.solarAltitudeDeg > 1 ? (
              <g transform={`translate(${Math.max(30, Math.min(svgWidth - 30, leftWallX - 40)), Math.max(25, roofY - 25)})`}>
                <circle cx="0" cy="0" r="10" fill="#f59e0b" />
                <circle cx="0" cy="0" r="14" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                <text x="18" y="4" fill="#fef08a" fontSize="9" fontWeight="bold">
                  Sol ({solarState.solarAltitudeDeg.toFixed(0)}°)
                </text>
              </g>
            ) : (
              <text x={svgWidth / 2 - 30} y={roofY - 20} fill="#64748b" fontSize="10">
                Noche / Ocaso
              </text>
            )}

            {/* Etiquetas de Cotas y Dimensiones */}
            <text x={leftWallX + canyonWidthPx / 2 - 25} y={groundY + 18} fill="#94a3b8" fontSize="9">
              W = {canyon.W}m
            </text>
            <text x={leftBuildingX - 4} y={roofY + buildingHeightPx / 2} fill="#94a3b8" fontSize="9" textAnchor="end">
              H = {canyon.H}m
            </text>
            <text x={leftBuildingX + 5} y={roofY - 6} fill="#38bdf8" fontSize="8.5">
              Fachada Oeste (Sotavento)
            </text>
            <text x={rightBuildingX + 5} y={roofY - 6} fill="#38bdf8" fontSize="8.5">
              Fachada Este (Barlovento)
            </text>
          </svg>
        </div>

        {/* Leyenda de Sombra y Fotólisis */}
        <div className="mt-2 flex flex-wrap justify-between items-center text-[9px] font-mono text-slate-400 gap-2 border-t border-slate-800 pt-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-2 bg-amber-400"></span>
            <span>Soleado (Fotólisis J_NO2 Máxima)</span>
            <span className="inline-block w-3 h-2 bg-indigo-900 border border-indigo-600"></span>
            <span>Sombra (Fotólisis reducida al SVF difuso)</span>
          </div>
          <div>
            Sombra en Calzada: <strong className="text-amber-300">{(solarState.floorShadowFraction * 100).toFixed(0)}%</strong> ({solarState.floorShadowLengthM.toFixed(1)}m de {canyon.W}m)
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de Radiación y Fotólisis de Leighton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <ScientificTooltip
          position="top"
          title="Constante de Fotólisis en Fachada Soleada (J_NO₂,sun)"
          formula="\text{NO}_2 + h\nu\,(\lambda < 420\,\text{nm}) \xrightarrow{J_{\text{NO}_2,\text{sun}}} \text{NO} + \text{O}(^3P)"
          normative="Leighton (1961) Photochemistry of Air Pollution"
          content={`Tasa de fotodisociación de NO₂ en la pared iluminada por radiación directa más reflexión múltiple de cavidad (${solarState.jNo2SunlitFacade.toExponential(3)} s⁻¹).`}
        >
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-1 cursor-help">
            <div className="text-[9px] font-mono text-slate-400">J_NO2 FACHADA SOLEADA</div>
            <div className="text-sm font-bold font-mono text-amber-400">
              {solarState.jNo2SunlitFacade.toExponential(3)} <span className="text-[9px] font-normal text-slate-400">s⁻¹</span>
            </div>
            <div className="text-[8.5px] text-slate-400">
              Descomposición fotoquímica rápida de NO₂
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Constante de Fotólisis en Sombra (J_NO₂,shade)"
          formula="J_{\text{NO}_2,\text{shade}} \approx J_{\text{NO}_2,\text{dif}} \cdot \psi_{\text{SVF}}"
          normative="Kwak & Baik (2012) Atmos. Environ."
          content={`Tasa de fotólisis atenuada en la zona sombreada del cañón (${solarState.jNo2ShadedFacade.toExponential(3)} s⁻¹), gobernada exclusivamente por la radiación difusa de Rayleigh ponderada por el Sky View Factor.`}
        >
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-1 cursor-help">
            <div className="text-[9px] font-mono text-slate-400">J_NO2 FACHADA EN SOMBRA</div>
            <div className="text-sm font-bold font-mono text-blue-400">
              {solarState.jNo2ShadedFacade.toExponential(3)} <span className="text-[9px] font-normal text-slate-400">s⁻¹</span>
            </div>
            <div className="text-[8.5px] text-slate-400">
              Inhibición por oclusión de cornisa urbana
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Cociente de Asimetría Fotoquímica Transversal"
          formula="\mathcal{A}_J = \frac{J_{\text{NO}_2,\text{sunlit}}}{J_{\text{NO}_2,\text{shaded}}}"
          normative="Garmory et al. (2009) Atmos. Environ."
          content={`Contraste químico transversal entre ambas aceras del cañón (${solarState.photolysisAsymmetryRatio.toFixed(1)}×), generador de desequilibrio fotoestacionario de Leighton dentro del vórtice de recirculación.`}
        >
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-1 cursor-help">
            <div className="text-[9px] font-mono text-slate-400">ASIMETRÍA FOTOQUÍMICA</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {solarState.photolysisAsymmetryRatio.toFixed(1)}x
            </div>
            <div className="text-[8.5px] text-slate-400">
              Relación J_soleado / J_sombra (Leighton)
            </div>
          </div>
        </ScientificTooltip>

        <ScientificTooltip
          position="top"
          title="Factor de Visión de Cielo (Sky View Factor ψ_SVF)"
          formula="\psi_{\text{SVF}} = \cos\left(\arctan\left(\frac{2H}{W}\right)\right)"
          normative="Oke (1988) Energy and Buildings"
          content={`Fracción hemisférica de bóveda celeste visible desde el eje de la calzada (${solarState.skyViewFactor.toFixed(3)}) para H=${canyon.H} m y W=${canyon.W} m.`}
        >
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-1 cursor-help">
            <div className="text-[9px] font-mono text-slate-400">SKY VIEW FACTOR (SVF)</div>
            <div className="text-sm font-bold font-mono text-purple-300">
              {solarState.skyViewFactor.toFixed(3)}
            </div>
            <div className="text-[8.5px] text-slate-400">
              Apertura al cielo visible (Oke, 1988)
            </div>
          </div>
        </ScientificTooltip>
      </div>

      {/* Nota Científica Doctrinal */}
      <div className="p-2.5 bg-blue-950/40 border border-blue-800 text-[9.5px] text-blue-200 leading-relaxed rounded-sm space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-blue-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Fundamento Doctrinal de la Fotólisis en Cañones Urbanos (Directiva 2008/50/CE &amp; EMEP):</span>
        </div>
        <p>
          En cañones estrechos con relación de aspecto H/W ≥ 1.0 (como Calle Marqués de Larios), la asimetría de iluminación crea dos regímenes químicos simultáneos: en la pared iluminada la fotólisis solar rápida (J_NO₂ ≈ 8×10⁻³ s⁻¹) disocia el NO₂ regenerando ozono local (O₃), mientras que en la pared en sombra la ausencia de fotólisis directa atrapa el NO₂ emitido por los vehículos sin descomponerse, incrementando los picos de exposición peatonal.
        </p>
      </div>
    </div>
  );
};
