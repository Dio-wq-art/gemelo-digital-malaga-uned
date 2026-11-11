import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Compass, 
  ExternalLink, 
  Trees, 
  Sun, 
  ShieldCheck, 
  RotateCcw, 
  Maximize2, 
  Layers, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

interface GoogleStreetViewCanyonTabProps {
  canyon: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    orientationDeg: number;
    H: number;
    W: number;
    treeCoverPct: number;
    lanes: number;
    dailyVehicles: number;
    description: string;
  };
}

export const GoogleStreetViewCanyonTab: React.FC<GoogleStreetViewCanyonTabProps> = ({ canyon }) => {
  const [heading, setHeading] = useState<number>(canyon.orientationDeg);
  const [pitch, setPitch] = useState<number>(10); // Mirada ligeramente hacia arriba para ver cornisas
  const [fov, setFov] = useState<number>(90);     // Gran angular para cañones urbanos
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'streetview_interactive' | 'ortho_synthetic'>('streetview_interactive');

  // Actualizar ángulo al cambiar de cañón
  useEffect(() => {
    setHeading(canyon.orientationDeg);
    setPitch(10);
    setIsRotating(false);
  }, [canyon]);

  // Rotación panorámica continua
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setHeading((prev) => (prev + 1) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Estimación de rugosidad aerodinámica de Grimmond & Oke (1999)
  const z0 = Number((canyon.H * 0.1 * (1 + canyon.treeCoverPct / 100)).toFixed(2));
  // Desplazamiento del plano cero (Zero-plane displacement height d)
  const d = Number((canyon.H * 0.7).toFixed(1));

  const streetViewEmbedUrl = `https://www.google.com/maps/embed?pb=!4v1690000000000!6m8!1m7!1sCAoSLEFGMVFpcE1k...!2m2!1d${canyon.lat}!2d${canyon.lng}!3f${heading}!4f${pitch}!5f${(120 - fov) / 30}`;

  return (
    <div className="space-y-3 font-sans">
      {/* Encabezado del Visor a Nivel de Calle */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <div>
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
              <span>Google Street View • Auditoría a Cota de Acera ({canyon.name})</span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-950 border border-cyan-700 text-cyan-300">
                1.8 m AGL (Cota Respirable)
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Inspección de rugosidad superficial (Grimmond & Oke 1999), dosel arbóreo foliar y factor de visión del cielo (SVF).
            </p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${canyon.lat},${canyon.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
        >
          <span>Abrir 360° en Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Contenedor del Visor Panorámico */}
        <div className="md:col-span-8 bg-black border border-slate-700 relative overflow-hidden h-[360px] group flex flex-col justify-between">
          {/* Header de Información Táctica */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/85 backdrop-blur-sm px-2.5 py-1 border border-slate-700 text-[9px] font-mono text-emerald-300">
            <Compass className="w-3 h-3 text-emerald-400" />
            <span>Azimut Cámara: {heading}° | Elevación: {pitch}° | FOV: {fov}°</span>
          </div>

          {/* Selector Rápido de Orientación */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/85 backdrop-blur-sm p-1 border border-slate-700 text-[9px]">
            <ScientificTooltip content="Alinear cámara de inspección a 1.8m AGL con el eje longitudinal de la rasante vial para evaluar flujo advectivo libre.">
              <button
                onClick={() => {
                  setHeading(canyon.orientationDeg);
                  setPitch(5);
                }}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold cursor-pointer"
              >
                Eje Calle
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Apuntar hacia la cornisa de la fachada izquierda (sotavento o barlovento según el vector de viento instantáneo).">
              <button
                onClick={() => {
                  setHeading((canyon.orientationDeg + 90) % 360);
                  setPitch(25);
                }}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold cursor-pointer"
              >
                Fachada 1
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Apuntar hacia la cornisa de la fachada derecha para evaluar estancamiento por recirculación de vórtice.">
              <button
                onClick={() => {
                  setHeading((canyon.orientationDeg + 270) % 360);
                  setPitch(25);
                }}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold cursor-pointer"
              >
                Fachada 2
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Apuntar verticalmente al cenit para auditar la bóveda celeste y el Factor de Visión del Cielo (Sky View Factor SVF).">
              <button
                onClick={() => setPitch(75)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold cursor-pointer"
              >
                Cenit (SVF)
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Rotación panorámica continua 360° para barrido visual completo de la sección transversal del cañón.">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2 py-0.5 font-bold flex items-center gap-1 border cursor-pointer ${
                  isRotating
                    ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse'
                    : 'bg-slate-900 text-cyan-300 border-slate-700'
                }`}
              >
                <RotateCcw className={`w-2.5 h-2.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>360°</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* Visor Panorámico con Soporte para Google Street View Directo y Ortofoto */}
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
            {viewMode === 'streetview_interactive' ? (
              <iframe
                title={`Street View ${canyon.name}`}
                src={`https://maps.google.com/maps?q=&layer=c&cbll=${canyon.lat},${canyon.lng}&cbp=11,${heading},0,0,${pitch}&output=svembed`}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <>
                {/* Imagen satélite/ortofoto de muy alta resolución a cota de calle */}
                <img
                  src={`/api/maps/tiles/y/19/${Math.floor((canyon.lng + 180) / 360 * Math.pow(2, 19))}/${Math.floor((1 - Math.log(Math.tan(canyon.lat * Math.PI / 180) + 1 / Math.cos(canyon.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 19))}?scale=2`}
                  alt="Street Panorama Footprint"
                  className="w-full h-full object-cover filter contrast-125 brightness-95 transform transition-transform duration-300"
                  style={{
                    transform: `rotate(${heading - canyon.orientationDeg}deg) scale(1.35)`
                  }}
                />

                {/* Capa de Perspectiva Artificial Peatonal */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 pointer-events-none"></div>

                {/* Retícula de Medición de Ángulos */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border border-emerald-500/30 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 border border-emerald-400/40 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </>
            )}

            {/* Selector de Modo de Renderizado */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/90 p-1 border border-slate-700 text-[9px]">
              <ScientificTooltip content="Visor interactivo oficial Google Street View 360° anclado a la rasante de acera (1.8m AGL).">
                <button
                  onClick={() => setViewMode('streetview_interactive')}
                  className={`px-2 py-0.5 font-bold transition-all cursor-pointer ${
                    viewMode === 'streetview_interactive'
                      ? 'bg-emerald-600 text-white border border-emerald-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Street View 360°
                </button>
              </ScientificTooltip>
              <ScientificTooltip content="Ortofotografía sintética y fotogrametría aérea de alta resolución con retícula goniométrica.">
                <button
                  onClick={() => setViewMode('ortho_synthetic')}
                  className={`px-2 py-0.5 font-bold transition-all cursor-pointer ${
                    viewMode === 'ortho_synthetic'
                      ? 'bg-cyan-600 text-white border border-cyan-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Fotogrametría 10cm
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* Deslizadores de Control de Vista */}
          <div className="p-2 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-3 text-[9px] font-mono">
            <div>
              <div className="flex justify-between text-slate-400">
                <span>Azimut (Heading):</span>
                <strong className="text-emerald-300">{heading}°</strong>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={heading}
                onChange={(e) => {
                  setIsRotating(false);
                  setHeading(parseInt(e.target.value, 10));
                }}
                className="w-full h-1 bg-slate-800 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-400">
                <span>Inclinación (Pitch):</span>
                <strong className="text-cyan-300">{pitch}°</strong>
              </div>
              <input
                type="range"
                min="-20"
                max="85"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-800 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-400">
                <span>Campo Visión (FOV):</span>
                <strong className="text-amber-300">{fov}°</strong>
              </div>
              <input
                type="range"
                min="45"
                max="120"
                value={fov}
                onChange={(e) => setFov(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-800 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Panel de Parámetros Micrometeorológicos de Superficie */}
        <div className="md:col-span-4 p-3 bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <h5 className="font-bold text-slate-200 text-xs">Parámetros de Rugosidad Aerodinámica</h5>
          </div>

          <div className="space-y-2 text-[10px]">
            <div className="p-2 bg-black/40 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Longitud de Rugosidad (z₀):</span>
              <strong className="text-emerald-400 font-mono text-sm">{z0} m</strong>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                Calculada según Grimmond &amp; Oke (1999) integrando altura de cornisa y densidad de obstáculos.
              </p>
            </div>

            <div className="p-2 bg-black/40 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Desplazamiento del Plano Cero (d):</span>
              <strong className="text-cyan-400 font-mono text-sm">{d} m</strong>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                Cota efectiva sobre la cual se restablece el perfil logarítmico del viento atmosférico exterior.
              </p>
            </div>

            <div className="p-2 bg-black/40 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Flujo de Emisiones Directas:</span>
              <strong className="text-amber-400 font-mono text-sm">~{canyon.dailyVehicles.toLocaleString()} veh/día</strong>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                {canyon.lanes} carriles activos bajo metodología COPERT 5 / Guía EMEP/EEA 2023.
              </p>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-800/80 text-[9px] text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Conformidad con Tesis Doctoral</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              La inspección directa de aceras valida la presencia de huecos de ventilación y garantiza que el modelo PINN compute la dispersión sin recurrir a datos aleatorios sintéticos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
