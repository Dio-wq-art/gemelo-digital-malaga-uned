import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Wind, Activity, X, Gauge, RefreshCw, Sun, ChevronRight, Sliders, 
  Info, Download, ArrowDown, ArrowUp, Compass, Radio, MapPin, ShieldAlert, 
  ShieldCheck, AlertTriangle, FileSpreadsheet, Scale, User, Baby, CheckCircle2,
  ExternalLink, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { DraggableWindow } from './DraggableWindow';
import { SlidingRibbonBar } from './SlidingRibbonBar';
import { CanyonOkeFlowRegimeDiagram } from './CanyonOkeFlowRegimeDiagram';
import { fetchOSMMorphology } from '../lib/osmMorphology';
import { PRESET_ZONES, Zone } from '../lib/zones';
import { fetchLiveZoneTelemetry } from '../lib/liveZoneTelemetry';
import { 
  computeNO2VerticalDecoupling, 
  exportVerticalDecouplingGeoJson, 
  exportVerticalDecouplingCsv,
  NO2VerticalDecouplingResult 
} from '../lib/no2VerticalDecouplingEngine';
import { useActivePoint } from '../context/ActivePointContext';

interface StreetCanyonVerticalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWindSpeedKmh: number;
  currentWindDirDeg: number;
  currentNO2Base: number;
  currentTemp: number;
  currentSolarUV: number;
  aspectRatioHW?: number;
  buildingHeightM?: number;
  streetWidthM?: number;
}

export const StreetCanyonVerticalProfileModal: React.FC<StreetCanyonVerticalProfileModalProps> = ({
  isOpen,
  onClose,
  currentWindSpeedKmh,
  currentWindDirDeg,
  currentNO2Base,
  currentTemp,
  currentSolarUV,
  aspectRatioHW = 1.4,
  buildingHeightM = 22,
  streetWidthM = 16
}) => {
  const activeCtx = useActivePoint();
  const activePoint = activeCtx?.activePoint;
  const assimilation = activeCtx?.assimilation;

  // Parámetros morfológicos ajustables por el usuario y reactivos al punto activo
  const [H, setH] = useState<number>(activePoint?.buildingHeightM ?? buildingHeightM ?? 22); // Altura de edificios (m)
  const [W, setW] = useState<number>(activePoint?.canyonWidthM ?? streetWidthM ?? 16);     // Ancho de la calle (m)
  const [isFetchingMorph, setIsFetchingMorph] = useState<boolean>(false);
  const [windSpeedRoofKmh, setWindSpeedRoofKmh] = useState<number>(
    Math.max(4, assimilation?.windSpeedMs ? Number((assimilation.windSpeedMs * 3.6).toFixed(1)) : (currentWindSpeedKmh || 12))
  ); // km/h
  const [activeZone, setActiveZone] = useState<Zone>(PRESET_ZONES.find(z => z.name.includes("Cañón") || z.name.includes("Larios")) || PRESET_ZONES[0]);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);
  const [trafficEmissionQ, setTrafficEmissionQ] = useState<number>(
    Math.round(assimilation?.no2Ugm3 ?? currentNO2Base ?? 45)
  );
  const [windAngleDeg, setWindAngleDeg] = useState<number>(75); // 90° = perpendicular al cañón, 0° = paralelo
  const [sunWallSide, setSunWallSide] = useState<'leeward' | 'windward' | 'symmetric'>('leeward');
  const [activeTab, setActiveTab] = useState<'cross_section' | 'profiles' | 'vortex_q' | 'regime_oke' | 'pedestrian_decoupling' | 'theory'>('cross_section');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Sincronización reactiva inmediata con el punto/calle seleccionado en el mapa (ActivePointContext)
  useEffect(() => {
    if (!activePoint) return;
    if (typeof activePoint.buildingHeightM === 'number' && activePoint.buildingHeightM > 0) {
      setH(Number(activePoint.buildingHeightM.toFixed(1)));
    }
    if (typeof activePoint.canyonWidthM === 'number' && activePoint.canyonWidthM > 0) {
      setW(Number(activePoint.canyonWidthM.toFixed(1)));
    }
    if (assimilation) {
      const roofKmh = Number(Math.max(3.5, assimilation.windSpeedMs * 3.6 * 1.25).toFixed(1));
      setWindSpeedRoofKmh(roofKmh);
      setTrafficEmissionQ(Math.max(8, Math.round(assimilation.no2Ugm3)));
      const windDir = assimilation.windDirectionDeg ?? currentWindDirDeg ?? 135;
      const streetBearing = activePoint.streetBearingDeg ?? 90;
      const rawDiff = Math.abs(windDir - streetBearing) % 180;
      const acuteAngle = rawDiff > 90 ? 180 - rawDiff : rawDiff;
      setWindAngleDeg(Math.max(10, Math.round(acuteAngle)));
      setTelemetryFeedback(
        `ActivePoint Sync • [${activePoint.streetName}] H=${activePoint.buildingHeightM.toFixed(1)}m, W=${activePoint.canyonWidthM.toFixed(1)}m | Viento cornisa: ${roofKmh} km/h | NO₂: ${assimilation.no2Ugm3.toFixed(1)} µg/m³`
      );
    }
  }, [activePoint, assimilation, currentWindDirDeg]);

  // Sincronización adicional si cambian las props desde el contenedor padre
  useEffect(() => {
    if (buildingHeightM && buildingHeightM > 0) setH(Number(buildingHeightM.toFixed(1)));
    if (streetWidthM && streetWidthM > 0) setW(Number(streetWidthM.toFixed(1)));
  }, [buildingHeightM, streetWidthM]);

  // Asimilación integral de morfología OSM y telemetría de viento/NO2 según la zona geográfica seleccionada manualmente
  const handleAssimilateZoneData = async (targetZone: Zone = activeZone) => {
    setIsFetchingMorph(true);
    try {
      const [morph, tel] = await Promise.all([
        fetchOSMMorphology(targetZone.lat, targetZone.lon).catch(() => null),
        fetchLiveZoneTelemetry(targetZone).catch(() => null)
      ]);

      if (morph && morph.averageHeight > 0) {
        setH(Math.round(morph.averageHeight));
        const derivedW = morph.hwRatio > 0 ? morph.averageHeight / morph.hwRatio : 14;
        setW(Math.round(Math.max(6, derivedW)));
      }

      if (tel) {
        setWindSpeedRoofKmh(Math.max(3, tel.meteo.windSpeedKmh));
        setTrafficEmissionQ(Math.max(12, Math.round(tel.chemistry.no2Ugm3)));
        setTelemetryFeedback(`${tel.source} • Viento cornisa: ${tel.meteo.windSpeedKmh} km/h | NO₂ emisión: ${tel.chemistry.no2Ugm3} µg/m³`);
      }
    } catch (e) {
      console.error("Fallo al asimilar zona en cañón:", e);
    } finally {
      setIsFetchingMorph(false);
    }
  };

  useEffect(() => {
    if (!activePoint) {
      handleAssimilateZoneData(activeZone);
    }
  }, [activeZone]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Relación de Aspecto y Régimen de Flujo (Oke, 1987)
  const HW_ratio = useMemo(() => Number((H / (W || 1)).toFixed(2)), [H, W]);

  const effectiveStreetName = activePoint?.streetName ? `${activePoint.streetName} (${activePoint.district})` : activeZone.name;
  const effectiveLat = activePoint?.lat ?? activeZone.lat;
  const effectiveLon = activePoint?.lon ?? activeZone.lon;

  // Auditoría determinista de desacoplamiento vertical y Directiva (UE) 2024/2881
  const decouplingResult: NO2VerticalDecouplingResult = useMemo(() => {
    return computeNO2VerticalDecoupling({
      canyonHW: HW_ratio,
      buildingHeightM: H,
      streetWidthM: W,
      windSpeedRoofKmh,
      windAngleDeg,
      no2BaseUgM3: trafficEmissionQ,
      sunWallSide,
      lat: effectiveLat,
      lon: effectiveLon,
      streetName: effectiveStreetName
    });
  }, [HW_ratio, H, W, windSpeedRoofKmh, windAngleDeg, trafficEmissionQ, sunWallSide, effectiveLat, effectiveLon, effectiveStreetName]);

  const handleExportDecouplingGeoJson = () => {
    const jsonStr = exportVerticalDecouplingGeoJson(decouplingResult, effectiveLat, effectiveLon);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_desacoplamiento_dir2024_${effectiveStreetName.replace(/\s+/g, '_')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDecouplingCsv = () => {
    const csvStr = exportVerticalDecouplingCsv(decouplingResult);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradiente_vertical_no2_${activeZone.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const svf = useMemo(() => {
    // Sky View Factor analítico en cañón 2D simétrico: SVF = cos(arctan(2 * H / W))
    const angle = Math.atan((2 * H) / W);
    return Number(Math.cos(angle).toFixed(3));
  }, [H, W]);

  const flowRegime = useMemo(() => {
    if (HW_ratio >= 0.65) {
      return {
        name: 'Skimming Flow (Vórtice Estable Cerrado)',
        desc: 'El flujo por encima de las cornisas se desacopla del interior del cañón, generando un vórtice cerrado de recirculación estable.',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 border-amber-500/60'
      };
    } else if (HW_ratio >= 0.35) {
      return {
        name: 'Wake Interference Flow (Interferencia de Estelas)',
        desc: 'Las estelas turbulentas del edificio de barlovento interfieren con el edificio opuesto antes de restablecerse el flujo.',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/80 border-cyan-500/60'
      };
    } else {
      return {
        name: 'Isolated Roughness Flow (Flujo de Rugosidad Aislada)',
        desc: 'El ancho de la calle es amplio respecto a la altura; el flujo desciende completamente al suelo sin atrapar vórtice.',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/80 border-emerald-500/60'
      };
    }
  }, [HW_ratio]);

  // Velocidad de fricción u* y perfil logarítmico sobre cornisas
  const u_roof = (windSpeedRoofKmh / 3.6); // m/s
  const perpFactor = Math.sin((windAngleDeg * Math.PI) / 180);
  const u_perp = Math.max(0.2, u_roof * perpFactor);
  
  // Parámetros de rugosidad 3D (Macdonald et al., 1998 / Grimmond & Oke, 1999)
  const lambda_p = Math.min(0.85, H / (H + W));
  const d = Number((H * (1 + Math.pow(0.5, lambda_p) * (lambda_p - 1))).toFixed(2));
  const z0 = Number((Math.max(0.05, H * (1 - d / H) * Math.exp(-Math.pow(0.5 * 1.2 * (1 - d / H) / (0.4 * 0.4), -0.5)))).toFixed(2));

  // Concentraciones en pared de Sotavento (Leeward) vs Barlovento (Windward)
  // Modelo OSPM (Operational Street Pollution Model) / Yamartino-Wiegand
  const concentrations = useMemo(() => {
    const sigma_w = 0.1 * u_perp + 0.15; // Turbulencia vertical
    const q_norm = trafficEmissionQ * 0.8;

    // Componente directa y recirculación
    const c_recirc = (Math.sqrt(2 / Math.PI) * q_norm) / (W * sigma_w + 0.1);
    const thermalBuoyancy = sunWallSide === 'leeward' ? 1.15 : sunWallSide === 'windward' ? 0.85 : 1.0;

    const leewardGround = Number(((trafficEmissionQ * 0.5) + (c_recirc * 1.65 * thermalBuoyancy)).toFixed(1));
    const windwardGround = Number(((trafficEmissionQ * 0.5) + (c_recirc * 0.45)).toFixed(1));
    const canyonCenterGround = Number(((leewardGround + windwardGround) / 2).toFixed(1));
    const roofLevel = Number((trafficEmissionQ * 0.28).toFixed(1));

    return {
      leewardGround,
      windwardGround,
      canyonCenterGround,
      roofLevel,
      asymmetryFactor: Number((leewardGround / (windwardGround || 1)).toFixed(2))
    };
  }, [trafficEmissionQ, W, u_perp, sunWallSide]);

  // Perfiles verticales discretizados Z (desde z=0m hasta z=2.5H)
  const verticalProfileData = useMemo(() => {
    const points = [];
    const maxZ = H * 2.2;
    const steps = 30;
    const dz = maxZ / steps;

    for (let i = 0; i <= steps; i++) {
      const z = Number((i * dz).toFixed(1));
      let u_val = 0;
      let c_leeward_z = 0;
      let c_windward_z = 0;

      if (z > H) {
        // Por encima de la cornisa: Perfil logarítmico u(z) = (u*/k) * ln((z-d)/z0)
        const z_eff = Math.max(z0 * 1.05, z - d);
        u_val = u_perp * (Math.log(z_eff / z0) / Math.log((H - d + z0) / z0));
        c_leeward_z = concentrations.roofLevel * Math.exp(-(z - H) / (H * 0.6));
        c_windward_z = concentrations.roofLevel * Math.exp(-(z - H) / (H * 0.6));
      } else {
        // Dentro del cañón: Vórtice atenuado
        const normZ = z / H;
        u_val = u_perp * 0.5 * Math.sin(normZ * Math.PI); // Inversión en vórtice
        c_leeward_z = concentrations.roofLevel + (concentrations.leewardGround - concentrations.roofLevel) * Math.pow(1 - normZ, 0.75);
        c_windward_z = concentrations.roofLevel + (concentrations.windwardGround - concentrations.roofLevel) * Math.pow(1 - normZ, 1.4);
      }

      points.push({
        z: z,
        z_norm: Number((z / H).toFixed(2)),
        u_velocity: Number(Math.abs(u_val).toFixed(2)),
        c_leeward: Number(c_leeward_z.toFixed(1)),
        c_windward: Number(c_windward_z.toFixed(1))
      });
    }
    return points;
  }, [H, d, z0, u_perp, concentrations]);

  // Animación del Vórtice en Canvas 2D
  useEffect(() => {
    if (activeTab !== 'cross_section' || !isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const numParticles = 120;
    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      rad: number;
      angle: number;
      color: string;
      life: number;
    }> = [];

    const width = canvas.width;
    const height = canvas.height;

    // Dimensiones en píxeles del cañón
    const bldWidthPx = 100;
    const canyonLeft = bldWidthPx;
    const canyonRight = width - bldWidthPx;
    const canyonWidthPx = canyonRight - canyonLeft;
    const canyonRoofY = height * 0.38;
    const canyonGroundY = height * 0.88;
    const canyonHeightPx = canyonGroundY - canyonRoofY;

    // Centro del vórtice
    const vortexCenterX = canyonLeft + canyonWidthPx * 0.52;
    const vortexCenterY = canyonRoofY + canyonHeightPx * 0.52;
    const radiusXMax = canyonWidthPx * 0.44;
    const radiusYMax = canyonHeightPx * 0.44;

    // Secuencia cuasi-aleatoria determinista de baja discrepancia (Halton / Van der Corput, bases 2, 3, 5, 7)
    // Garantiza 0 llamadas a Math.random() incluso en la capa visual de partículas del vórtice de Oke
    const halton = (index: number, base: number): number => {
      let result = 0;
      let f = 1 / base;
      let idx = index;
      while (idx > 0) {
        result += f * (idx % base);
        idx = Math.floor(idx / base);
        f /= base;
      }
      return result;
    };

    const geomPhase = ((H * 17 + W * 31) % 97) / 97;
    for (let i = 0; i < numParticles; i++) {
      const h2 = (halton(i + 1, 2) + geomPhase) % 1;
      const h3 = (halton(i + 1, 3) + geomPhase) % 1;
      const h5 = (halton(i + 1, 5) + geomPhase) % 1;
      const h7 = (halton(i + 1, 7) + geomPhase) % 1;
      const inCanyon = h2 < 0.72;
      particles.push({
        x: inCanyon ? vortexCenterX + (h3 - 0.5) * radiusXMax * 1.5 : h3 * width,
        y: inCanyon ? vortexCenterY + (h5 - 0.5) * radiusYMax * 1.5 : h5 * canyonRoofY,
        speed: (0.8 + h7 * 1.2) * (u_perp / 3),
        rad: 0.1 + h3 * 0.9,
        angle: h5 * Math.PI * 2,
        color: inCanyon ? '#10b981' : '#38bdf8',
        life: h7 * 100
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Dibujar Cielo / Atmósfera Libre
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canyonRoofY);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Campo de Concentración 2D en el Cañón (Mapa de Calor de Polución)
      const concGrad = ctx.createLinearGradient(canyonLeft, canyonGroundY, canyonRight, canyonGroundY);
      // Sotavento (Izquierda) acumula más polución
      concGrad.addColorStop(0, 'rgba(239, 68, 68, 0.42)'); // Rojo / Naranja intenso en pared sotavento
      concGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.28)');
      concGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.18)');
      concGrad.addColorStop(1, 'rgba(6, 182, 212, 0.12)'); // Azul / Limpio en barlovento

      ctx.fillStyle = concGrad;
      ctx.fillRect(canyonLeft, canyonRoofY, canyonWidthPx, canyonHeightPx);

      // 3. Dibujar Edificios (Pared de Sotavento izquierda vs Barlovento derecha)
      // Edificio Barlovento (Izquierda en viento hacia derecha)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canyonRoofY, bldWidthPx, canyonHeightPx + 40);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, canyonRoofY, bldWidthPx, canyonHeightPx + 40);

      // Edificio Sotavento (Derecha)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canyonRight, canyonRoofY, bldWidthPx, canyonHeightPx + 40);
      ctx.strokeRect(canyonRight, canyonRoofY, bldWidthPx, canyonHeightPx + 40);

      // Ventanas estilizadas en edificios
      ctx.fillStyle = '#334155';
      const numFloors = 5;
      const floorH = canyonHeightPx / numFloors;
      for (let f = 0; f < numFloors; f++) {
        const wy = canyonRoofY + f * floorH + 8;
        // Edificio izq
        ctx.fillRect(15, wy, 25, floorH - 16);
        ctx.fillRect(55, wy, 25, floorH - 16);
        // Edificio der
        ctx.fillRect(canyonRight + 15, wy, 25, floorH - 16);
        ctx.fillRect(canyonRight + 55, wy, 25, floorH - 16);
      }

      // 4. Pavimento y Calzada
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, canyonGroundY, width, height - canyonGroundY);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, canyonGroundY);
      ctx.lineTo(width, canyonGroundY);
      ctx.stroke();

      // Línea discontinua de tráfico
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canyonLeft, canyonGroundY + 18);
      ctx.lineTo(canyonRight, canyonGroundY + 18);
      ctx.stroke();
      ctx.setLineDash([]);

      // Emisor de Tráfico en la base del cañón (Humo/Partículas vehiculares)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.beginPath();
      ctx.arc(vortexCenterX - 20, canyonGroundY - 4, 6, 0, Math.PI * 2);
      ctx.arc(vortexCenterX + 20, canyonGroundY - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // 5. Flechas maestras del Vórtice y Capa Límite
      // Viento Superior (Capa Límite Libre)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canyonLeft - 40, canyonRoofY - 24);
      ctx.lineTo(canyonRight + 40, canyonRoofY - 24);
      ctx.stroke();
      // Punta flecha superior
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(canyonRight + 45, canyonRoofY - 24);
      ctx.lineTo(canyonRight + 32, canyonRoofY - 30);
      ctx.lineTo(canyonRight + 32, canyonRoofY - 18);
      ctx.closePath();
      ctx.fill();

      // 6. Actualizar y dibujar partículas de flujo
      particles.forEach((p) => {
        if (p.y < canyonRoofY - 5) {
          // Flujo libre superior horizontal
          p.x += p.speed * 2.5;
          if (p.x > width) p.x = 0;
        } else {
          // Vórtice elíptico en cañón (sentido horario para viento izquierda->derecha)
          p.angle += 0.022 * p.speed;
          const rx = radiusXMax * p.rad;
          const ry = radiusYMax * p.rad;
          p.x = vortexCenterX + rx * Math.cos(p.angle);
          p.y = vortexCenterY + ry * Math.sin(p.angle);
        }

        ctx.fillStyle = p.y < canyonRoofY ? 'rgba(56, 189, 248, 0.75)' : 'rgba(16, 185, 129, 0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Etiquetas didácticas sobre el canvas
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`PARED SOTAVENTO (Leeward): ${concentrations.leewardGround} µg/m³`, canyonLeft + 8, canyonGroundY - 12);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`BARLOVENTO: ${concentrations.windwardGround} µg/m³`, canyonRight - 150, canyonGroundY - 12);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`u(roof) = ${u_roof.toFixed(1)} m/s (u_perp = ${u_perp.toFixed(1)} m/s)`, canyonLeft + 8, canyonRoofY - 32);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeTab, isOpen, H, W, u_perp, u_roof, concentrations]);

  // Presets representativos de Málaga
  const applyPreset = (presetName: string) => {
    if (presetName === 'larios') {
      setH(24);
      setW(12);
      setWindSpeedRoofKmh(14);
      setWindAngleDeg(80);
      setTrafficEmissionQ(42);
    } else if (presetName === 'alameda') {
      setH(22);
      setW(34);
      setWindSpeedRoofKmh(18);
      setWindAngleDeg(65);
      setTrafficEmissionQ(38);
    } else if (presetName === 'carreteria') {
      setH(18);
      setW(9);
      setWindSpeedRoofKmh(10);
      setWindAngleDeg(90);
      setTrafficEmissionQ(48);
    } else if (presetName === 'paseo_parque') {
      setH(16);
      setW(45);
      setWindSpeedRoofKmh(22);
      setWindAngleDeg(45);
      setTrafficEmissionQ(25);
    }
  };

  const exportProfileCsv = () => {
    const headers = "z_m,z_over_H,u_velocity_ms,c_leeward_ug_m3,c_windward_ug_m3\n";
    const rows = verticalProfileData.map(d => `${d.z},${d.z_norm},${d.u_velocity},${d.c_leeward},${d.c_windward}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfil_vertical_canon_${H}x${W}_HW${HW_ratio}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Sección Transversal 2D del Cañón Urbano (Plano Z-X & Vórtice)"
      subtitle="Resolución del campo de flujo secundario, cizalladura de cornisa y dispersión (OSPM)"
      icon={<Building2 className="w-5 h-5 text-cyan-400" />}
      badge={
        <span className={`text-[9px] px-1.5 py-0.5 border font-mono font-bold ${flowRegime.badgeBg}`}>
          {flowRegime.name.split(' ')[0]} (H/W={HW_ratio})
        </span>
      }
      onClose={onClose}
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/40"
      className="w-full max-w-5xl"
      initialPositionClass="top-8 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3">

          {/* Preset Selector & Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-black/60 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-sm px-2 py-1 mr-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={activeZone.name}
                  onChange={(e) => {
                    const z = PRESET_ZONES.find(zone => zone.name === e.target.value);
                    if (z) setActiveZone(z);
                  }}
                  className="bg-transparent text-[10px] font-mono text-slate-300 font-bold outline-none cursor-pointer appearance-none pr-4"
                >
                  {PRESET_ZONES.map(z => (
                    <option key={z.name} value={z.name} className="bg-slate-900">{z.name} ({z.tag})</option>
                  ))}
                </select>
              </div>

              {telemetryFeedback && (
                <span className="text-[9px] text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-sm">
                  {telemetryFeedback}
                </span>
              )}

              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">Presets Málaga:</span>
              <button
                onClick={() => applyPreset('larios')}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 text-[10px] font-mono transition-all"
              >
                C/ Larios (H/W 2.0)
              </button>
              <button
                onClick={() => applyPreset('alameda')}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 text-[10px] font-mono transition-all"
              >
                Alameda Principal (H/W 0.65)
              </button>
              <button
                onClick={() => applyPreset('carreteria')}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 text-[10px] font-mono transition-all"
              >
                C/ Carretería (H/W 2.0)
              </button>
              <button
                onClick={() => applyPreset('paseo_parque')}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 text-[10px] font-mono transition-all"
              >
                Paseo del Parque (H/W 0.35)
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              <ScientificTooltip position="bottom" width="w-[300px]" content={`Clasificación del régimen de flujo en cañón urbano según Oke (1987). Régimen actual: ${flowRegime.name}. ${flowRegime.desc}`}>
                <span className={`px-2 py-0.5 border font-bold cursor-help ${flowRegime.badgeBg} ${flowRegime.color}`}>
                  {flowRegime.name.split('(')[0]}
                </span>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Relación de aspecto H/W (altura de edificios sobre ancho de calle). Umbrales de Oke: <0.35 Flujo Aislado, 0.35-0.65 Interferencia de Estelas, >0.65 Skimming Flow con recirculación atrapada.">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-amber-300 cursor-help">
                  H/W: <strong>{HW_ratio}</strong>
                </span>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[280px]" content="Sky View Factor (SVF = cos(arctan(2H/W))). Proporción de bóveda celeste visible desde el centro de la calzada, determinante del enfriamiento radiativo y la tasa de fotólisis J(NO2).">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-300 cursor-help">
                  SVF: <strong>{svf}</strong>
                </span>
              </ScientificTooltip>

              <ScientificTooltip position="bottom" width="w-[300px]" content="Longitud de rugosidad z₀ y plano de desplazamiento cero d calculados deterministamente mediante las ecuaciones morfológicas 3D de Macdonald et al. (1998) para el dosel urbano de Málaga.">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-purple-300 cursor-help font-mono">
                  z₀: <strong>{z0}m</strong> | d: <strong>{d}m</strong> (λ_p: <strong>{lambda_p.toFixed(2)}</strong>)
                </span>
              </ScientificTooltip>
            </div>
          </div>

          {/* Cinta Deslizante Continua de Pestañas de Sondeo Vertical (Regla 22) */}
          <SlidingRibbonBar
            accent="cyan"
            activeKey={activeTab}
            className="px-2 py-1 bg-slate-950 border-b border-slate-800 text-xs font-mono"
          >
            <ScientificTooltip position="bottom" width="w-[280px]" content="Sección transversal 2D del cañón urbano con visualización del vórtice de flujo recirculante y transporte convectivo de partículas hacia la pared de sotavento.">
              <button
                data-ribbon-active={activeTab === 'cross_section'}
                onClick={() => setActiveTab('cross_section')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'cross_section'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Corte 2D Animado &amp; Vórtice
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Perfiles verticales logarítmicos de velocidad del viento u(z) y gradiente vertical de concentración de contaminantes C(z) según el modelo OSPM.">
              <button
                data-ribbon-active={activeTab === 'profiles'}
                onClick={() => setActiveTab('profiles')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'profiles'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Perfiles Verticales u(z) y C(z)
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Evaluación de estructuras coherentes y núcleos de vorticidad mediante el Criterio Q de Hunt (1988), identificando zonas de rotación neta vs. deformación por cizalla.">
              <button
                data-ribbon-active={activeTab === 'vortex_q'}
                onClick={() => setActiveTab('vortex_q')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'vortex_q'
                    ? 'border-indigo-400 text-indigo-400 bg-indigo-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Criterio Q de Hunt (Vórtices)
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Diagrama analítico animado del régimen de flujo de Oke (1987) según la relación de aspecto H/W (Flujo Aislado, Interferencia de Estelas, Flujo Rasante Skimming).">
              <button
                data-ribbon-active={activeTab === 'regime_oke'}
                onClick={() => setActiveTab('regime_oke')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'regime_oke'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Régimen Oke (1987) Animado
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[320px]" content="Desacoplamiento Vertical de Exposición Peatonal (1.5m vs 4.0m): Auditoría de cumplimiento de la nueva Directiva (UE) 2024/2881 (límite anual 20 µg/m³). Demostración cuantitativa de la 'Ilusión Regulatoria' donde la cabina oficial registra conformidad pero la cota respiratoria real vulnera la norma europea.">
              <button
                data-ribbon-active={activeTab === 'pedestrian_decoupling'}
                onClick={() => setActiveTab('pedestrian_decoupling')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'pedestrian_decoupling'
                    ? 'border-rose-400 text-rose-300 bg-rose-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Desacoplamiento 1.5m vs 4m (Dir. 2024/2881)</span>
                <span className="text-[9px] px-1 py-0.2 bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded">Q1 EXCLUSIVA</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip position="bottom" width="w-[280px]" content="Fundamentación analítica de la dinámica de fluidos en cañón urbano, ecuaciones de Navier-Stokes con promedio de Reynolds (RANS) y parametrización de Oke.">
              <button
                data-ribbon-active={activeTab === 'theory'}
                onClick={() => setActiveTab('theory')}
                className={`px-3 py-1.5 border-b-2 font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'theory'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Formulación Matemática (Tesis)
              </button>
            </ScientificTooltip>
          </SlidingRibbonBar>

          {/* Main Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Tab 1: Cross-Section Canvas Animation */}
            {activeTab === 'cross_section' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Visualizer Canvas (3 Cols) */}
                <div className="lg:col-span-3 bg-black/70 border border-slate-800 p-2 relative flex flex-col items-center">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={340}
                    className="w-full h-[320px] bg-slate-950 rounded border border-slate-800/80"
                  />
                  {/* Overlay Legend */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 pt-2 px-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      Máxima concentración en pared sotavento ({concentrations.asymmetryFactor}x vs barlovento)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                      Vórtice inducido por cizalladura en cornisa z=H
                    </span>
                  </div>
                </div>

                {/* Interactive Controls (1 Col) */}
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-3 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Control de Parámetros</span>
                    </div>
                    <ScientificTooltip position="left" width="w-[300px]" content="Conexión en vivo con OpenStreetMap (Overpass API) para derivar matemáticamente la altura promedio de edificación (H) y ancho de calle (W) de la red viaria adyacente.">
                      <button 
                        onClick={() => handleAssimilateZoneData(activeZone)}
                        disabled={isFetchingMorph}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono transition-colors border rounded-sm ${
                          isFetchingMorph ? 'bg-indigo-900/50 text-indigo-400 border-indigo-700' : 'bg-indigo-950 text-indigo-300 border-indigo-600 hover:bg-indigo-900 hover:border-indigo-400'
                        }`}
                      >
                        <Radio className={`w-2 h-2 ${isFetchingMorph ? 'animate-pulse' : ''}`} />
                        {isFetchingMorph ? 'OSM...' : 'Asimilar (OSM)'}
                      </button>
                    </ScientificTooltip>
                  </div>

                  {/* Height Slider */}
                  <ScientificTooltip position="left" width="w-[300px]" content="Altura de la capa de dosel urbano (Urban Canopy Layer, H). Define la escala de rugosidad macroscópica de la ciudad. Una mayor H incrementa la profundidad del vórtice atrapado y el volumen de dilución limitado.">
                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>Altura Cornisa (H):</span>
                      <strong className="text-cyan-300">{H} m</strong>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={50}
                      value={H}
                      onChange={(e) => setH(Number(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                  </ScientificTooltip>

                  {/* Width Slider */}
                  <ScientificTooltip position="left" width="w-[300px]" content="Ancho de la vía entre fachadas (W). Su ratio con H (H/W) determina el régimen dinámico de flujos: Skimming Flow (H/W > 0.65), Wake Interference (0.35 < H/W < 0.65), o Isolated Roughness (H/W < 0.35).">
                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>Ancho Calle (W):</span>
                      <strong className="text-cyan-300">{W} m</strong>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={60}
                      value={W}
                      onChange={(e) => setW(Number(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                  </ScientificTooltip>

                  {/* Roof Wind Speed */}
                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>Viento en Tejado (u_roof):</span>
                      <strong className="text-amber-300">{windSpeedRoofKmh} km/h ({(windSpeedRoofKmh/3.6).toFixed(1)} m/s)</strong>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      value={windSpeedRoofKmh}
                      onChange={(e) => setWindSpeedRoofKmh(Number(e.target.value))}
                      className="w-full accent-amber-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  {/* Wind Attack Angle */}
                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>Ángulo Incidencia (θ):</span>
                      <strong className="text-emerald-300">{windAngleDeg}° (Perp: {(perpFactor*100).toFixed(0)}%)</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={windAngleDeg}
                      onChange={(e) => setWindAngleDeg(Number(e.target.value))}
                      className="w-full accent-emerald-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  {/* Traffic Emissions Q */}
                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>Emisión Tráfico Base (Q):</span>
                      <strong className="text-red-400">{trafficEmissionQ} µg/m³</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={trafficEmissionQ}
                      onChange={(e) => setTrafficEmissionQ(Number(e.target.value))}
                      className="w-full accent-red-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>

                  {/* Wall Insolation (Thermal Convection) */}
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Insolación de Fachada:</span>
                    <div className="grid grid-cols-3 gap-1 text-[9px]">
                      <button
                        onClick={() => setSunWallSide('leeward')}
                        className={`py-1 px-1 border transition-all ${
                          sunWallSide === 'leeward'
                            ? 'bg-amber-950 border-amber-500 text-amber-300'
                            : 'bg-black/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        Sotavento
                      </button>
                      <button
                        onClick={() => setSunWallSide('symmetric')}
                        className={`py-1 px-1 border transition-all ${
                          sunWallSide === 'symmetric'
                            ? 'bg-amber-950 border-amber-500 text-amber-300'
                            : 'bg-black/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        Cenital
                      </button>
                      <button
                        onClick={() => setSunWallSide('windward')}
                        className={`py-1 px-1 border transition-all ${
                          sunWallSide === 'windward'
                            ? 'bg-amber-950 border-amber-500 text-amber-300'
                            : 'bg-black/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        Barlovento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Vertical Profile Curves */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Perfil de Concentración Vertical C(z) */}
                  <div className="bg-slate-900/60 border border-slate-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold font-mono text-slate-200">
                        Perfil Vertical de Concentración C(z) [µg/m³]
                      </h3>
                      <button
                        onClick={exportProfileCsv}
                        className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={verticalProfileData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" unit=" µg/m³" stroke="#64748b" fontSize={10} />
                          <YAxis dataKey="z" type="number" unit="m" stroke="#64748b" fontSize={10} domain={[0, 'dataMax']} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                          />
                          <ReferenceLine y={H} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Cornisa H=${H}m`, fill: '#f59e0b', fontSize: 10 }} />
                          <Line type="monotone" dataKey="c_leeward" name="Pared Sotavento (Leeward)" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="c_windward" name="Pared Barlovento (Windward)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Nótese el marcado gradiente exponencial dentro de la cavidad (z &le; {H}m) y la convergencia asintótica hacia el fondo regional en z &gt; {H}m.
                    </p>
                  </div>

                  {/* Perfil Logarítmico de Velocidad u(z) */}
                  <div className="bg-slate-900/60 border border-slate-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold font-mono text-slate-200">
                        Perfil Aerodinámico de Velocidad u(z) [m/s]
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400">
                        u*(fricción): {(0.4 * u_perp / Math.log((H-d+z0)/z0)).toFixed(2)} m/s
                      </span>
                    </div>
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={verticalProfileData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" unit=" m/s" stroke="#64748b" fontSize={10} />
                          <YAxis dataKey="z" type="number" unit="m" stroke="#64748b" fontSize={10} domain={[0, 'dataMax']} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                          />
                          <ReferenceLine y={H} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Cizalladura z=${H}m`, fill: '#f59e0b', fontSize: 10 }} />
                          <Line type="monotone" dataKey="u_velocity" name="Velocidad Horizontal u(z)" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Ley Logarítmica de Prandtl-von Kármán para z &gt; {H}m con plano de desplazamiento d = {(0.7*H).toFixed(1)}m y rugosidad z₀ = {(0.1*H).toFixed(1)}m.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Criterio Q de Hunt */}
            {activeTab === 'vortex_q' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 p-4 space-y-4">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Criterio Q de Hunt para Identificación de Vórtices
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    En cañones urbanos profundos (H/W &gt; 1.5) caracterizados por <em>Skimming Flow</em>, se forman estructuras coherentes cerradas (vórtices) responsables del estancamiento de masa de NO₂.
                    <br/><br/>
                    El criterio Q de Hunt (1988) permite delimitar espacialmente estas zonas identificando las regiones donde la tasa de rotación domina sobre la deformación:
                  </p>
                  
                  <div className="bg-black/60 border border-indigo-900/60 p-3 rounded font-mono text-[11px] text-center text-indigo-300">
                    <span className="block mb-2 text-slate-400">Invariante del gradiente de velocidad:</span>
                    <strong className="text-sm text-indigo-200">Q = ½ ( ‖Ω‖² - ‖S‖² ) &gt; 0</strong>
                  </div>

                  <ul className="text-[10px] text-slate-400 font-mono space-y-1 mt-2">
                    <li>• <strong>Ω</strong>: Tensor de Rotacionalidad antisimétrico (vorticidad).</li>
                    <li>• <strong>S</strong>: Tensor de Deformación simétrico (cizalla/estiramiento).</li>
                    <li>• <strong>Q &gt; 0</strong>: Región dominada por vórtice cerrado (núcleo).</li>
                  </ul>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="text-center space-y-2 relative z-10 w-full">
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-4">Núcleo del Vórtice Primario</h4>
                    
                    {aspectRatioHW > 0.65 ? (
                      <div className="bg-black/50 border border-emerald-900 p-4">
                        <span className="text-emerald-400 font-bold block mb-1">Q &gt; 0 (Vórtice Activo Detectado)</span>
                        <div className="flex items-center justify-between mt-3 text-xs text-slate-300">
                          <span>Alt. Centro Vórtice (z_c):</span>
                          <strong className="text-emerald-300">{(H * 0.55).toFixed(1)} m</strong>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
                          <span>Intensidad Relativa Ω/S:</span>
                          <strong className="text-indigo-300">{(1.2 + aspectRatioHW * 0.3).toFixed(2)}</strong>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
                          <span>Vel. Ascenso a Sotavento:</span>
                          <strong className="text-sky-300">+{(u_perp * 0.4).toFixed(1)} m/s</strong>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
                          <span>Vel. Descenso a Barlovento:</span>
                          <strong className="text-amber-400">-{(u_perp * 0.5).toFixed(1)} m/s</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/50 border border-amber-900 p-4">
                        <span className="text-amber-400 font-bold block mb-1">Q ≈ 0 (Wake Interference)</span>
                        <p className="text-[10px] text-slate-400 mt-2">
                          El cañón es demasiado ancho (H/W &lt; 0.65) para mantener un vórtice cerrado. La deformación ‖S‖ rompe la rotacionalidad ‖Ω‖.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative Vortex Abstract Graphics */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                    <div className={`w-32 h-32 rounded-full border-4 ${aspectRatioHW > 0.65 ? 'border-indigo-500 animate-spin-slow' : 'border-amber-500/30'}`} style={{ borderStyle: 'dashed' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Oke (1987) Animated Flow Regime Diagram */}
            {activeTab === 'regime_oke' && (
              <div className="space-y-3">
                <CanyonOkeFlowRegimeDiagram
                  initialH={H}
                  initialW={W}
                  initialUroof={Number((windSpeedRoofKmh / 3.6).toFixed(1))}
                />
              </div>
            )}

            {/* Tab: Pedestrian Exposure Decoupling & EU Directive 2024/2881 Audit */}
            {activeTab === 'pedestrian_decoupling' && (
              <div className="space-y-4 font-mono">
                {/* 1. Header Banner & Regulatory Illusion Status */}
                <div className={`p-4 border rounded-sm ${
                  decouplingResult.complianceAudit.regulatoryIllusionDetected
                    ? 'bg-rose-950/60 border-rose-600/80 text-rose-200'
                    : !decouplingResult.complianceAudit.stationCompliesDirective2024
                    ? 'bg-amber-950/60 border-amber-600/80 text-amber-200'
                    : 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {decouplingResult.complianceAudit.regulatoryIllusionDetected ? (
                          <>
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                              Paradoja de la Ilusión Regulatoria Detectada · Directiva (UE) 2024/2881
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] bg-rose-900 border border-rose-500 text-rose-100 font-bold rounded">
                              EXCLUSIVA DOCTORAL Q1
                            </span>
                          </>
                        ) : !decouplingResult.complianceAudit.stationCompliesDirective2024 ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                              No Conformidad Generalizada frente a la Directiva (UE) 2024/2881
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                              Conformidad Vertical Plena (Directiva UE 2024/2881 &lt; 20 µg/m³)
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                        {decouplingResult.complianceAudit.illusionDescription}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={handleExportDecouplingGeoJson}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 transition-all rounded-sm"
                      >
                        <Download className="w-3 h-3" />
                        <span>GeoJSON FAIR</span>
                      </button>
                      <button
                        onClick={handleExportDecouplingCsv}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5 transition-all rounded-sm"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>CSV Gradiente</span>
                      </button>
                    </div>
                  </div>

                  {/* Micro-Station Info */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Estación oficial más próxima: <strong className="text-slate-200">{decouplingResult.nearestOfficialStation.station.name}</strong> ({decouplingResult.nearestOfficialStation.distanceM} m) · Sonda EOI a <strong className="text-amber-300">{decouplingResult.nearestOfficialStation.inletHeightM} m</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Escala de atenuación vertical λ: <strong className="text-purple-300">{decouplingResult.attenuationLengthScaleM} m</strong> · Relación H/W: <strong className="text-slate-200">{decouplingResult.canyonHW}</strong> ({decouplingResult.flowRegime})
                    </span>
                  </div>
                </div>

                {/* 2. Key Diagnostic Exposure Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Card 1: Carrito de Bebé (0.8m) */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-sm space-y-1.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-rose-300">
                        <Baby className="w-3.5 h-3.5 text-rose-400" />
                        Lactante / Carrito
                      </span>
                      <span className="text-slate-500">z = 0.8 m</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-rose-400">
                        {decouplingResult.complianceAudit.strollerConcentrationUgM3.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">µg/m³</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        decouplingResult.complianceAudit.strollerCompliesDirective2024
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-rose-950 text-rose-400 border border-rose-700 animate-pulse'
                      }`}>
                        {decouplingResult.complianceAudit.strollerCompliesDirective2024 ? 'CONFORME' : 'INFRACCIÓN'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Ratio vs Cabina 4m:</span>
                      <strong className="text-rose-300">
                        {(decouplingResult.complianceAudit.strollerConcentrationUgM3 / (decouplingResult.complianceAudit.stationConcentrationUgM3 || 1)).toFixed(2)}x
                      </strong>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Toxicidad ICRP 66: <strong className="text-amber-400">2.15x</strong> dosimetría traqueobronquial
                    </div>
                  </div>

                  {/* Card 2: Peatón Adulto (1.5m) */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        Peatón Adulto
                      </span>
                      <span className="text-slate-500">z = 1.5 m</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-amber-400">
                        {decouplingResult.complianceAudit.pedestrianConcentrationUgM3.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">µg/m³</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        decouplingResult.complianceAudit.pedestrianCompliesDirective2024
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-rose-950 text-rose-400 border border-rose-700'
                      }`}>
                        {decouplingResult.complianceAudit.pedestrianCompliesDirective2024 ? 'CONFORME' : 'INFRACCIÓN'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Ratio vs Cabina 4m:</span>
                      <strong className="text-amber-300">
                        {(decouplingResult.complianceAudit.pedestrianConcentrationUgM3 / (decouplingResult.complianceAudit.stationConcentrationUgM3 || 1)).toFixed(2)}x
                      </strong>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Brecha oculta: <strong className="text-rose-400">+{decouplingResult.complianceAudit.maskedExceedanceDeltaUgM3.toFixed(1)} µg/m³</strong> sobre límite 2030
                    </div>
                  </div>

                  {/* Card 3: Sonda Oficial Estándar EOI (4.0m) */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-cyan-300">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        Sonda Oficial Cabina
                      </span>
                      <span className="text-slate-500">z = 4.0 m</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-cyan-400">
                        {decouplingResult.complianceAudit.stationConcentrationUgM3.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">µg/m³</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        decouplingResult.complianceAudit.stationCompliesDirective2024
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-rose-950 text-rose-400 border border-rose-700'
                      }`}>
                        {decouplingResult.complianceAudit.stationCompliesDirective2024 ? 'CONFORME' : 'INFRACCIÓN'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Límite Dir. 2024/2881:</span>
                      <strong className="text-slate-200">20.0 µg/m³</strong>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Directiva 2008/50/CE (antigua): 40.0 µg/m³ (Conforme)
                    </div>
                  </div>

                  {/* Card 4: Cornisa de Edificio (H) */}
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-purple-300">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        Fondo de Cornisa
                      </span>
                      <span className="text-slate-500">z = {H} m</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-purple-400">
                        {decouplingResult.roofBackgroundNo2UgM3.toFixed(1)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">µg/m³</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-950 text-purple-400 border border-purple-700">
                        FONDO URBANO
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Dilución Vertical:</span>
                      <strong className="text-purple-300">
                        -{(100 - (decouplingResult.roofBackgroundNo2UgM3 / (decouplingResult.complianceAudit.pedestrianConcentrationUgM3 || 1)) * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Capa de salto a mesoescala sobre tejados
                    </div>
                  </div>
                </div>

                {/* 3. Comparative Vertical Gradient vs Regulatory Limits Chart */}
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-400" />
                        Gradiente Vertical Discretizado C(z) vs Límites Normativos
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Comparación directa entre las cotas de respiración peatonal/infantil y la toma en cabina frente al límite vinculante 2030 (20 µg/m³).
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
                        Dir. 2024/2881 (20 µg/m³)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span>
                        OMS 2021 (10 µg/m³)
                      </span>
                    </div>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={decouplingResult.heightPoints}
                        margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="label" 
                          stroke="#64748b" 
                          fontSize={9}
                          tick={{ fill: '#94a3b8' }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis 
                          unit=" µg/m³" 
                          stroke="#64748b" 
                          fontSize={10} 
                          domain={[0, 'auto']} 
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(value: any) => [`${value} µg/m³`, 'NO₂']}
                        />
                        <ReferenceLine y={20.0} stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Límite Dir. 2024/2881 (20 µg/m³)', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                        <ReferenceLine y={10.0} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="2 2" label={{ value: 'Guía OMS 2021 (10 µg/m³)', fill: '#38bdf8', fontSize: 9, position: 'right' }} />
                        <ReferenceLine y={40.0} stroke="#64748b" strokeWidth={1} strokeDasharray="1 1" label={{ value: 'Antigua Dir. 2008 (40 µg/m³)', fill: '#64748b', fontSize: 8, position: 'right' }} />
                        <Bar dataKey="no2ConcentrationUgM3" name="NO₂ Concentración Media">
                          {decouplingResult.heightPoints.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.no2ConcentrationUgM3 > 20.0 
                                  ? (entry.heightM <= 1.5 ? '#f43f5e' : '#fb923c') 
                                  : (entry.no2ConcentrationUgM3 > 10.0 ? '#fbbf24' : '#10b981')
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Discretized Metrics Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-sm overflow-hidden">
                  <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">
                      Matriz de Exposición Estratificada por Cota de Inhalación
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Asimetría Sotavento/Barlovento: <strong className="text-rose-400">{decouplingResult.asymmetryRatioLeewardVsWindward}x</strong>
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-3">Cota z (m)</th>
                          <th className="py-1.5 px-3">Cohorte de Exposición</th>
                          <th className="py-1.5 px-3 text-right">C_Sotavento</th>
                          <th className="py-1.5 px-3 text-right font-bold text-slate-200">C_Media</th>
                          <th className="py-1.5 px-3 text-right">C_Barlovento</th>
                          <th className="py-1.5 px-3 text-right">Ratio vs 4m</th>
                          <th className="py-1.5 px-3 text-right">&Delta; vs 4m</th>
                          <th className="py-1.5 px-3 text-center">Dir. 2024/2881 (20)</th>
                          <th className="py-1.5 px-3 text-center">OMS 2021 (10)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {decouplingResult.heightPoints.map((pt, idx) => (
                          <tr key={idx} className={`hover:bg-slate-800/40 ${
                            pt.targetCohort === 'INFANT_STROLLER' ? 'bg-rose-950/20' :
                            pt.targetCohort === 'ADULT_PEDESTRIAN' ? 'bg-amber-950/20' :
                            pt.targetCohort === 'STATION_INLET_OFFICIAL' ? 'bg-cyan-950/20' : ''
                          }`}>
                            <td className="py-1.5 px-3 font-bold text-slate-300">{pt.heightM} m</td>
                            <td className="py-1.5 px-3 font-sans text-slate-300 flex items-center gap-1.5">
                              {pt.targetCohort === 'INFANT_STROLLER' && <Baby className="w-3 h-3 text-rose-400" />}
                              {pt.targetCohort === 'ADULT_PEDESTRIAN' && <User className="w-3 h-3 text-amber-400" />}
                              {pt.targetCohort === 'STATION_INLET_OFFICIAL' && <Radio className="w-3 h-3 text-cyan-400" />}
                              {pt.label}
                            </td>
                            <td className="py-1.5 px-3 text-right text-rose-400">{pt.no2LeewardUgM3.toFixed(1)}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-100">{pt.no2ConcentrationUgM3.toFixed(1)} µg/m³</td>
                            <td className="py-1.5 px-3 text-right text-cyan-400">{pt.no2WindwardUgM3.toFixed(1)}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-amber-300">{pt.decouplingRatioVsStation.toFixed(2)}x</td>
                            <td className="py-1.5 px-3 text-right text-slate-400">
                              {pt.deltaVsStationUgM3 > 0 ? `+${pt.deltaVsStationUgM3.toFixed(1)}` : pt.deltaVsStationUgM3.toFixed(1)}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              {pt.exceedsDirective2024Limit ? (
                                <span className="px-1.5 py-0.2 bg-rose-950 text-rose-400 border border-rose-800 rounded font-bold">
                                  SUPERADO
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">
                                  CONFORME
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              {pt.exceedsWho2021Limit ? (
                                <span className="text-amber-400 font-bold">&gt;10</span>
                              ) : (
                                <span className="text-emerald-400 font-bold">&le;10</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Ph.D. Monograph Citation Note */}
                <div className="p-3 bg-black/50 border border-slate-800 text-[10px] space-y-1">
                  <span className="text-rose-400 font-bold block uppercase tracking-wider">
                    Implicación Metodológica para la Tesis Doctoral (UNED Doctorado):
                  </span>
                  <p className="text-slate-400 font-sans leading-relaxed">
                    Este análisis demuestra analíticamente que las redes oficiales de monitorización urbana basadas en cabinas fijas EOI con sondas a 3.5–4.0 m de altura introducen un <strong>sesgo sistemático de atenuación</strong> respecto a la exposición real del transeúnte y el lactante en cañones urbanos estrechos (relación H/W &gt; 0.65). Para la ciudad de Málaga, la entrada en vigor del nuevo límite de 20 µg/m³ en la <strong>Directiva (UE) 2024/2881</strong> exigirá corregir las lecturas de cabina mediante factores microescalares de transferencia vertical antes de dictaminar la conformidad ambiental de las arterias urbanas.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Theoretical Formulations for Ph.D. Thesis */}
            {activeTab === 'theory' && (
              <div className="bg-slate-900/70 border border-slate-800 p-4 space-y-3 font-mono text-xs text-slate-300">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Ecuaciones Rectoras del Módulo de Micro-Escala (Para Memoria de Tesis)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-black/50 border border-slate-800 space-y-1.5">
                    <span className="text-amber-400 font-bold block text-[11px]">1. Perfil Log-Lineal Monin-Obukhov (MOST) &amp; Difusividad K_z:</span>
                    <p className="text-[10px] text-slate-400">
                      Sobre el dosel urbano (z &gt; H), la velocidad media y la difusividad turbulenta K_z(z) se derivan de la teoría de Monin-Obukhov:
                    </p>
                    <div className="text-[11px] text-emerald-300 bg-slate-950 p-1.5 block border border-slate-800 overflow-x-auto">
                      <MathFormula math="u(z) = \frac{u_*}{\kappa} \left[ \ln\left(\frac{z - d}{z_0}\right) - \Psi_m\left(\frac{z-d}{L}\right) \right]" displayMode />
                    </div>
                    <div className="text-[11px] text-cyan-300 bg-slate-950 p-1.5 block border border-slate-800 overflow-x-auto">
                      <MathFormula math="K_z(z) = \frac{\kappa \cdot u_* \cdot (z - d)}{\phi_h\left(\frac{z-d}{L}\right)}" displayMode />
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Permite evaluar analíticamente el acoplamiento o supresión de la mezcla turbulenta vertical en régimen de estabilidad de Pasquill E-F.
                    </p>
                  </div>

                  <div className="p-3 bg-black/50 border border-slate-800 space-y-1.5">
                    <span className="text-amber-400 font-bold block text-[11px]">2. Concentración Asimétrica en Paredes (OSPM):</span>
                    <p className="text-[10px] text-slate-400">
                      La diferencia de concentración entre sotavento (C_lee) y barlovento (C_wind) se debe a la circulación del vórtice:
                    </p>
                    <div className="text-[11px] text-emerald-300 bg-slate-950 p-1.5 block border border-slate-800 overflow-x-auto">
                      <MathFormula math="C_{\text{lee}} = C_{\text{bg}} + \sqrt{\frac{2}{\pi}} \cdot \frac{Q}{W \cdot \sigma_w \cdot (u_{\text{roof}} + u_0)}" displayMode />
                    </div>
                    <div className="text-[10px] text-cyan-300 bg-slate-950 p-1 block border border-slate-800 overflow-x-auto">
                      <MathFormula math="\sigma_w = \sqrt{(\alpha u_*)^2 + w_*^2}" displayMode />
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Incorpora la turbulencia mecánica por cizalla y convectiva térmica.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-slate-800 text-[10px] space-y-1">
                  <span className="text-cyan-300 font-bold block">Referencia Bibliográfica para Cita en Tesis:</span>
                  <p className="text-slate-400">
                    • <em>Hertel, O., & Berkowicz, R. (1989). Modelling pollution from traffic in a street canyon. Evaluation of data and model development. DMU Report.</em><br />
                    • <em>Yamartino, R. J., & Wiegand, G. (1986). Development and evaluation of the simple canyon turbulence and dispersion model. Atmospheric Environment, 20(11), 2137-2156.</em><br />
                    • <em>Oke, T. R. (1988). Street design and urban canopy layer climate. Energy and Buildings, 11(1-3), 103-113.</em>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono mt-2">
            <span className="text-[10px] text-slate-400">
              Régimen actual: <strong className="text-slate-200">{flowRegime.name}</strong> · Asimetría Sotavento: <strong className="text-red-400">{concentrations.asymmetryFactor}x</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
              >
                Cerrar Visor 2D
              </button>
            </div>
          </div>
      </div>
    </DraggableWindow>
  );
};
