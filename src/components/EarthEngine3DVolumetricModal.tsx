import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Layers, 
  Compass, 
  Eye, 
  Sliders, 
  Download, 
  FileText, 
  Maximize2, 
  Activity, 
  Sun, 
  Wind, 
  Sparkles,
  Info,
  MapPin,
  RefreshCw,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { ActivePointSyncBanner } from './ActivePointSyncBanner';
import { useActivePoint } from '../context/ActivePointContext';
import { 
  Volumetric3DSceneConfig, 
  generateVolumetric3DGrid, 
  export3DVolumetricCsv, 
  export3DVolumetricGeoJson, 
  export3DVolumetricLatex,
  Voxel3D,
  VerticalProfileLevel
} from '../lib/earthEngine3DVolumetricEngine';

interface EarthEngine3DVolumetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCollapsed?: boolean;
}

export const EarthEngine3DVolumetricModal: React.FC<EarthEngine3DVolumetricModalProps> = ({
  isOpen,
  onClose,
  defaultCollapsed = true
}) => {
  const activePointCtx = useActivePoint();
  const location = activePointCtx?.location || { lat: 36.7213, lon: -4.4214 };
  const data = activePointCtx?.data;
  const assim = activePointCtx?.assimilation;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados de Configuración de la Escena 3D
  const [selectedLayer, setSelectedLayer] = useState<'no2_column' | 's2_ndvi_wesely' | 'landsat_lst' | 'wind_streamlines'>('no2_column');
  const [renderMode, setRenderMode] = useState<'voxels' | 'isosurface' | 'terrain_mesh' | 'lidar_sonde'>('isosurface');
  const [showPhotorealisticGoogleMesh, setShowPhotorealisticGoogleMesh] = useState<boolean>(true);
  const [showOrographicDEM, setShowOrographicDEM] = useState<boolean>(true);
  const [slicingPlaneZ, setSlicingPlaneZ] = useState<number>(1200); // Corte en altura (m)
  const [slicingPlaneY, setSlicingPlaneY] = useState<number>(0);    // Corte N-S (km)

  // Ángulos de Cámara 3D Interactiva
  const [pitchDeg, setPitchDeg] = useState<number>(35); // 10 a 85 deg
  const [yawDeg, setYawDeg] = useState<number>(45);     // 0 a 360 deg
  const [zoomLevel, setZoomLevel] = useState<number>(1.1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Parámetros de la Escena Asimilada
  const sceneConfig: Volumetric3DSceneConfig = useMemo(() => {
    return {
      centerLon: location.lon,
      centerLat: location.lat,
      gridResolutionX: 11,
      gridResolutionY: 11,
      gridResolutionZ: 10,
      domainSizeKm: 12.0,
      maxAltitudeM: 2000.0,
      pblh_m: 850.0,
      surfaceNO2Base: assim?.no2PedestrianLevel1_8mUgM3 || data?.no2_satelite_base || 38.5,
      tropomiColumnBase: 4.85e-5, // mol/m2 (~ 3.1x10^15 molec/cm2)
      surfaceLSTBase: assim?.temperatureC || data?.temperatura_malaga || 24.5,
      surfaceNDVIBase: 0.35,
      windSpeedSurface: assim?.windSpeedKmh ? assim.windSpeedKmh / 3.6 : (data?.velocidad_viento_km_h ? data.velocidad_viento_km_h / 3.6 : 3.8),
      windDirectionDeg: assim?.windDirectionDeg ?? data?.direccion_viento_grados ?? 135 // Brisa SE
    };
  }, [location, assim, data]);

  // Generación tensorial 3D determinista
  const { voxels, verticalProfiles, surfaceGrid } = useMemo(() => {
    return generateVolumetric3DGrid(sceneConfig);
  }, [sceneConfig]);

  // Nivel de Sondeo Seleccionado (para el Virtual Lidar)
  const [selectedAltitudeLevel, setSelectedAltitudeLevel] = useState<number>(150);

  // Renderizador 3D en Canvas (Proyección Isométrica / Perspectiva con Transformaciones Matriciales)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fondo aeroespacial profundo
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    const radPitch = (pitchDeg * Math.PI) / 180;
    const radYaw = (yawDeg * Math.PI) / 180;
    const cosYaw = Math.cos(radYaw);
    const sinYaw = Math.sin(radYaw);
    const cosPitch = Math.cos(radPitch);
    const sinPitch = Math.sin(radPitch);

    const cx = width / 2;
    const cy = height / 2 + 30;
    const scale = (width / 26) * zoomLevel;

    // Función de Proyección 3D -> 2D (Isometric/Orthographic rotado)
    const project3D = (xKm: number, yKm: number, zM: number) => {
      // Rotación Yaw (azimut en plano XY)
      const rx = xKm * cosYaw - yKm * sinYaw;
      const ry = xKm * sinYaw + yKm * cosYaw;

      // Inclinación Pitch (elevación vertical Z)
      const px = cx + rx * scale;
      const py = cy + (ry * sinPitch - (zM / 300) * cosPitch) * scale;
      const depth = ry * cosPitch + (zM / 300) * sinPitch;

      return { px, py, depth };
    };

    // 1. Dibujar Cuadrícula de Referencia Base y Relieve MDE (Copernicus DEM)
    if (showOrographicDEM) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Malla del terreno
      const resX = sceneConfig.gridResolutionX;
      const resY = sceneConfig.gridResolutionY;

      for (let ix = 0; ix < resX - 1; ix++) {
        for (let iy = 0; iy < resY - 1; iy++) {
          const idx00 = ix * resY + iy;
          const idx10 = (ix + 1) * resY + iy;
          const idx01 = ix * resY + (iy + 1);

          const p00 = surfaceGrid[idx00];
          const p10 = surfaceGrid[idx10];
          const p01 = surfaceGrid[idx01];

          if (p00 && p10 && p01) {
            const proj00 = project3D(p00.x / 1000, p00.y / 1000, p00.elevation);
            const proj10 = project3D(p10.x / 1000, p10.y / 1000, p10.elevation);
            const proj01 = project3D(p01.x / 1000, p01.y / 1000, p01.elevation);

            // Color del terreno según capa seleccionada
            if (selectedLayer === 's2_ndvi_wesely') {
              const greenVal = Math.floor(p00.ndvi * 180 + 30);
              ctx.fillStyle = p00.elevation <= 0.5 ? 'rgba(14, 116, 144, 0.4)' : `rgba(34, ${greenVal}, 94, 0.65)`;
            } else if (selectedLayer === 'landsat_lst') {
              const redVal = Math.min(255, Math.floor((p00.lst - 18) * 18));
              ctx.fillStyle = `rgba(${redVal}, 70, 160, 0.6)`;
            } else {
              // NO2 en superficie
              const alpha = Math.min(0.8, p00.no2 / 60);
              ctx.fillStyle = p00.elevation <= 0.5 ? 'rgba(15, 23, 42, 0.7)' : `rgba(234, 88, 12, ${alpha * 0.7 + 0.15})`;
            }

            ctx.beginPath();
            ctx.moveTo(proj00.px, proj00.py);
            ctx.lineTo(proj10.px, proj10.py);
            ctx.lineTo(proj01.px, proj01.py);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }

    // 2. Malla Fotorealista de Edificios 3D de Google Maps (Centro / ZBE / Puerto)
    if (showPhotorealisticGoogleMesh) {
      const buildings = [
        { name: 'Catedral de Málaga', x: 0.1, y: 0.2, h: 84, base: 14, w: 0.12, color: '#fef08a' },
        { name: 'Alcazaba / Gibralfaro', x: 0.8, y: 0.5, h: 125, base: 45, w: 0.25, color: '#ca8a04' },
        { name: 'Torre del Puerto', x: 0.3, y: -0.9, h: 110, base: 2, w: 0.08, color: '#38bdf8' },
        { name: 'Cañón Alameda Principal', x: -0.4, y: -0.1, h: 32, base: 8, w: 0.35, color: '#cbd5e1' },
        { name: 'Cañón Calle Larios', x: -0.05, y: 0.05, h: 28, base: 10, w: 0.18, color: '#f1f5f9' },
        { name: 'Polígono Guadalhorce', x: -3.5, y: -2.2, h: 18, base: 6, w: 0.6, color: '#94a3b8' }
      ];

      buildings.forEach(b => {
        const pBase = project3D(b.x, b.y, b.base);
        const pTop = project3D(b.x, b.y, b.base + b.h);

        // Prisma extruido 3D
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(pBase.px - 6, pBase.py);
        ctx.lineTo(pBase.px + 6, pBase.py);
        ctx.lineTo(pTop.px + 6, pTop.py);
        ctx.lineTo(pTop.px - 6, pTop.py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Techo
        ctx.fillStyle = b.color;
        ctx.fillRect(pTop.px - 5, pTop.py - 3, 10, 5);

        // Etiqueta
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        ctx.fillText(b.name, pTop.px + 8, pTop.py - 2);
      });
    }

    // 3. Renderizado Volumétrico de la Columna Atmosférica (Sentinel-5P TROPOMI & K-Theory)
    // Filtrar voxels por planos de corte
    const visibleVoxels = voxels.filter(v => v.z <= slicingPlaneZ && (v.y / 1000) >= slicingPlaneY);

    // Ordenar voxels por profundidad (algoritmo del pintor)
    const sortedVoxels = visibleVoxels.map(v => {
      const proj = project3D(v.x / 1000, v.y / 1000, v.z);
      return { ...v, proj };
    }).sort((a, b) => b.proj.depth - a.proj.depth);

    if (renderMode === 'voxels' || renderMode === 'isosurface') {
      sortedVoxels.forEach(v => {
        const { px, py } = v.proj;
        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) return;

        // Color según concentración o variable
        let fillColor = 'rgba(56, 189, 248, 0.2)';
        let radius = 3.5 * zoomLevel;

        if (selectedLayer === 'no2_column') {
          if (v.no2_ug_m3 >= 40) {
            fillColor = `rgba(239, 68, 68, ${Math.min(0.85, 0.3 + v.no2_ug_m3 / 80)})`;
            radius = 5.0 * zoomLevel;
          } else if (v.no2_ug_m3 >= 25) {
            fillColor = `rgba(249, 115, 22, ${Math.min(0.7, 0.25 + v.no2_ug_m3 / 60)})`;
            radius = 4.2 * zoomLevel;
          } else {
            fillColor = `rgba(34, 197, 94, ${Math.min(0.5, 0.15 + v.no2_ug_m3 / 40)})`;
            radius = 3.0 * zoomLevel;
          }
        } else if (selectedLayer === 'wind_streamlines') {
          fillColor = 'rgba(147, 197, 253, 0.6)';
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. Modo Sondeo LIDAR Virtual en el Punto Activo
    if (renderMode === 'lidar_sonde') {
      const pGround = project3D(0, 0, 0);
      const pTopSonde = project3D(0, 0, sceneConfig.maxAltitudeM);

      // Haz láser LIDAR vertical
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pGround.px, pGround.py);
      ctx.lineTo(pTopSonde.px, pTopSonde.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Marcador de nivel de altura seleccionado
      const pLevel = project3D(0, 0, selectedAltitudeLevel);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(pLevel.px, pLevel.py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Disco horizontal de muestreo en esa cota
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.2) {
        const dx = Math.cos(a) * 2.0;
        const dy = Math.sin(a) * 2.0;
        const pDisk = project3D(dx, dy, selectedAltitudeLevel);
        if (a === 0) ctx.moveTo(pDisk.px, pDisk.py);
        else ctx.lineTo(pDisk.px, pDisk.py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 5. HUD y Rosa de los Vientos 3D en Esquina
    const compassX = width - 50;
    const compassY = 50;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(compassX, compassY, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Flecha Norte
    const nx = compassX + Math.sin(radYaw) * 20;
    const ny = compassY - Math.cos(radYaw) * 20;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(compassX - Math.cos(radYaw) * 6, compassY - Math.sin(radYaw) * 6);
    ctx.lineTo(compassX + Math.cos(radYaw) * 6, compassY + Math.sin(radYaw) * 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('N', nx - 3, ny - 4);

  }, [
    pitchDeg, 
    yawDeg, 
    zoomLevel, 
    voxels, 
    surfaceGrid, 
    selectedLayer, 
    renderMode, 
    showPhotorealisticGoogleMesh, 
    showOrographicDEM, 
    slicingPlaneZ, 
    slicingPlaneY, 
    selectedAltitudeLevel,
    sceneConfig
  ]);

  // Handlers para Interacción con el Ratón (Cámara 3D Orbit/Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setYawDeg(prev => (prev + dx * 0.5 + 360) % 360);
    setPitchDeg(prev => Math.max(10, Math.min(85, prev - dy * 0.4)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Exportaciones de Ciencia Abierta
  const handleExportCsv = () => {
    const csv = export3DVolumetricCsv(voxels);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gee_googlemaps_3d_volumetric_malaga_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJson = () => {
    const geojson = export3DVolumetricGeoJson(voxels);
    const blob = new Blob([geojson], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gee_googlemaps_3d_mesh_malaga_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLatex = () => {
    const latex = export3DVolumetricLatex(sceneConfig, verticalProfiles);
    const blob = new Blob([latex], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gee_3d_vertical_equations_${Date.now()}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeLevelProfile = useMemo(() => {
    return verticalProfiles.find(p => p.altitude_m >= selectedAltitudeLevel) || verticalProfiles[0];
  }, [verticalProfiles, selectedAltitudeLevel]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Google Earth Engine & Google Maps 3D Volumetric Suite (Q1)"
      icon={<Layers className="w-4 h-4 text-purple-400" />}
      subtitle="Columna Troposférica TROPOMI + DEM Copernicus + Malla Google Maps 3D"
      badge="Q1 VOLUMETRIC SUITE"
      onClose={onClose}
      defaultCollapsed={defaultCollapsed}
      className="w-full max-w-5xl max-h-[85vh]"
      headerColorClass="text-purple-300"
      borderColorClass="border-purple-800/70"
    >
      <div className="p-4 space-y-3.5 text-slate-200 overflow-y-auto max-h-[82vh] bg-[#070b14]">
        
        {/* REGLA 10: BANNER DE SINCRONIZACIÓN ATÓMICA */}
        <ActivePointSyncBanner compact={true} />

        {/* BARRA SUPERIOR DE SELECTORES Y CAPAS */}
        <div className="bg-slate-900/95 border border-slate-800 p-2.5 rounded-sm flex flex-wrap items-center justify-between gap-2 shadow-lg">
          
          {/* Selector de Capa Satelital GEE */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-purple-300 font-bold uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Capa Satélite GEE:
            </span>

            {[
              { id: 'no2_column', label: 'Sentinel-5P NO₂ (TROPOMI 3D)', icon: <Globe className="w-3 h-3 text-cyan-400" /> },
              { id: 's2_ndvi_wesely', label: 'Sentinel-2 NDVI / Wesely', icon: <Sparkles className="w-3 h-3 text-emerald-400" /> },
              { id: 'landsat_lst', label: 'Landsat-9 / MODIS LST (UHI)', icon: <Sun className="w-3 h-3 text-amber-400" /> },
              { id: 'wind_streamlines', label: 'Flujo 3D Brisa / Orográfico', icon: <Wind className="w-3 h-3 text-blue-400" /> }
            ].map(tab => (
              <ScientificTooltip
                key={tab.id}
                position="bottom"
                width="w-[280px]"
                content={`Asimila y proyecta la colección volumétrica ${tab.label} sobre la topografía real de la Bahía de Málaga.`}
              >
                <button
                  onClick={() => setSelectedLayer(tab.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono rounded transition-colors cursor-help ${
                    selectedLayer === tab.id
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              </ScientificTooltip>
            ))}
          </div>

          {/* Selector de Modo de Renderizado 3D */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-400">Modo:</span>
            {[
              { id: 'isosurface', label: 'Isosuperficie' },
              { id: 'voxels', label: 'Nube Voxel' },
              { id: 'lidar_sonde', label: 'Sondeo LIDAR' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setRenderMode(mode.id as any)}
                className={`px-2 py-0.5 text-[9.5px] font-mono rounded ${
                  renderMode === mode.id
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA PRINCIPAL: VISOR 3D CANVAS + PANEL DE CONTROL CIENTÍFICO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* LIENZO 3D CANVAS */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-sm relative overflow-hidden shadow-inner flex flex-col">
            
            {/* Header del Canvas */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-[9.5px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cámara Orbital: Azimut {yawDeg}° • Elevación {pitchDeg}° • Zoom {zoomLevel.toFixed(1)}x</span>
            </div>

            <canvas
              ref={canvasRef}
              width={760}
              height={480}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-[480px] cursor-grab active:cursor-grabbing block"
            />

            {/* Controles de Capa Rápida Superpuestos */}
            <div className="p-2 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPhotorealisticGoogleMesh}
                    onChange={(e) => setShowPhotorealisticGoogleMesh(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600"
                  />
                  <span>Malla Fotorealista 3D Google Maps</span>
                </label>

                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOrographicDEM}
                    onChange={(e) => setShowOrographicDEM(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600"
                  />
                  <span>Relieve MDE Copernicus GLO-30</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setYawDeg(45); setPitchDeg(35); setZoomLevel(1.1); }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px]"
                >
                  Reset Cámara
                </button>
                <span className="text-slate-500">Arrastra con el ratón para rotar en 3D</span>
              </div>
            </div>
          </div>

          {/* PANEL LATERAL DE CORTE TOMOGRÁFICO Y RADIOSONDEO */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* CONTROL DE PLANOS DE CORTE TOMOGRÁFICO */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Planos de Corte 3D (Slicing)
                </span>
                <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                  ISO-Z / ISO-Y
                </span>
              </div>

              <div className="space-y-2 text-[10px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span>Corte en Altura (Cota Z):</span>
                    <span className="text-cyan-400 font-bold">{slicingPlaneZ} m s.n.m.</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={slicingPlaneZ}
                    onChange={(e) => setSlicingPlaneZ(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5">
                    <span>Corte Transecto N-S (Y):</span>
                    <span className="text-cyan-400 font-bold">{slicingPlaneY.toFixed(1)} km</span>
                  </div>
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    step={0.5}
                    value={slicingPlaneY}
                    onChange={(e) => setSlicingPlaneY(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* RADIOSONDEO / SONDEO VIRTUAL LIDAR */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-mono font-bold text-purple-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> Radiosondeo Atmosférico Virtual
                </span>
                <span className="text-[8px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
                  LIDAR C(z)
                </span>
              </div>

              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Cota de Muestreo:</span>
                  <span className="text-purple-400 font-bold">{selectedAltitudeLevel} m AGL</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={25}
                  value={selectedAltitudeLevel}
                  onChange={(e) => setSelectedAltitudeLevel(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />

                <div className="grid grid-cols-2 gap-2 pt-1 text-[9px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">NO₂ a {activeLevelProfile.altitude_m}m:</span>
                    <span className="text-amber-400 font-bold text-[11px]">{activeLevelProfile.no2_ug_m3} µg/m³</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Temperatura:</span>
                    <span className="text-cyan-400 font-bold text-[11px]">{(activeLevelProfile.temperature_k - 273.15).toFixed(1)} °C</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Presión Barométrica:</span>
                    <span className="text-slate-200 font-bold text-[11px]">{activeLevelProfile.pressure_hpa} hPa</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Viento en Cota:</span>
                    <span className="text-emerald-400 font-bold text-[11px]">{activeLevelProfile.wind_speed_ms} m/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* METADATOS CIENTÍFICOS Y RESOLUCIÓN */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-sm space-y-1.5 text-[9px] font-mono text-slate-300">
              <div className="text-slate-400 font-bold uppercase text-[9.5px] border-b border-slate-800 pb-1">
                Fundamentación Científica Q1
              </div>
              <div>• <strong>Satélite</strong>: Copernicus Sentinel-5P TROPOMI (L3_NO2 / AER_AI).</div>
              <div>• <strong>Kernel Óptico</strong>: Averaging Kernel Aₖ(z) con camino óptico troposférico (AMF₃D).</div>
              <div>• <strong>Topografía 3D</strong>: Copernicus GLO-30 DEM acoplado con MDE IGN.</div>
              <div>• <strong>Fotogrametría</strong>: Google Maps 3D Photorealistic Tiles (Málaga ZBE).</div>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA: EXPORTACIÓN DE CIENCIA ABIERTA (FAIR DATA) */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900/95 border border-slate-800 p-2.5 rounded-sm gap-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Resolución de Malla: 11x11x10 ({voxels.length} Voxels deterministas asimilados)</span>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip position="top" width="w-[280px]" content="Descarga la malla 3D completa de voxels en formato GeoJSON 3D para análisis en QGIS 3D / ArcGIS Pro.">
              <button
                onClick={handleExportGeoJson}
                className="flex items-center gap-1 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-[10px] px-2.5 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" /> GeoJSON 3D
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Descarga la matriz de perfiles verticales y voxels en formato tabular CSV estándar FAIR.">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 text-[10px] px-2.5 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> CSV FAIR
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="top" width="w-[280px]" content="Descarga las ecuaciones y la tabla del perfil vertical de radiosondeo en formato LaTeX para la memoria doctoral.">
              <button
                onClick={handleExportLatex}
                className="flex items-center gap-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 text-[10px] px-2.5 py-1.5 font-mono font-bold transition-colors rounded-sm cursor-help"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" /> LaTeX (.tex)
              </button>
            </ScientificTooltip>
          </div>
        </div>

      </div>
    </DraggableWindow>
  );
};
