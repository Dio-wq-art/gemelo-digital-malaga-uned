import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': any;
    }
  }
}
import { 
  Building2, 
  Wind, 
  Activity, 
  Layers, 
  Sliders, 
  Download, 
  Sun, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  Maximize2, 
  Info, 
  RotateCcw, 
  Globe, 
  ExternalLink, 
  Sparkles,
  MapPin,
  Car,
  Trees,
  Compass,
  Zap,
  Box,
  Cpu,
  Ruler,
  Scale,
  Footprints,
  HeartPulse,
  Navigation,
  ShieldAlert,
  Flame,
  Volume2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { SolarShadingCanyonTab } from './SolarShadingCanyonTab';
import { LbmCfdSolverTab } from './LbmCfdSolverTab';
import { DeckGl3DTilesInspectorTab } from './DeckGl3DTilesInspectorTab';
import { CanyonMetricMeasurementTab } from './CanyonMetricMeasurementTab';
import { GoogleStreetViewCanyonTab } from './GoogleStreetViewCanyonTab';
import { AirQualityMultiScaleAuditTab } from './AirQualityMultiScaleAuditTab';
import { EarthEngineSatelliteTab } from './EarthEngineSatelliteTab';
import { useUIStore } from '../store/uiStore';
import { loadGoogleMapsScript } from '../lib/googleMapsLoader';

interface GoogleMaps3DCanyonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWindSpeedKmh: number;
  currentWindDirDeg: number;
  currentNO2Base: number;
  currentTemp: number;
  currentSolarUV: number;
}

// Catálogo de cañones urbanos de Málaga georreferenciados con morfología OSM y coordenadas exactas
export interface Canyon3DTarget {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  heading: number;
  tilt: number;
  H: number; // Altura media de edificios (m)
  W: number; // Ancho entre fachadas (m)
  orientationDeg: number; // Azimut del eje de la calle
  dailyVehicles: number;
  lanes: number;
  treeCoverPct: number;
  description: string;
}

export const CANYON_3D_TARGETS: Canyon3DTarget[] = [
  {
    id: 'larios',
    name: 'Calle Marqués de Larios (Centro Histórico)',
    tag: 'Cañón Peatonal Monumental • H/W=1.35',
    lat: 36.7196,
    lng: -4.4218,
    heading: 10,
    tilt: 65,
    H: 22.0,
    W: 16.3,
    orientationDeg: 8,
    dailyVehicles: 800, // Servicio y emergencias
    lanes: 1,
    treeCoverPct: 2,
    description: 'Cañón urbano peatonal del siglo XIX de alta inercia térmica y encajonamiento en régimen de Skimming Flow.'
  },
  {
    id: 'alameda',
    name: 'Alameda Principal (Bulevar Central)',
    tag: 'Bulevar Arbóreo Monumental • H/W=0.62',
    lat: 36.7175,
    lng: -4.4239,
    heading: 260,
    tilt: 60,
    H: 28.0,
    W: 45.0,
    orientationDeg: 260,
    dailyVehicles: 18500,
    lanes: 4,
    treeCoverPct: 35,
    description: 'Gran bulevar con bóveda de Ficus centenarios y carril bus EMT. Alta deposición seca foliar compensatoria.'
  },
  {
    id: 'juan_xxiii',
    name: 'Avenida Juan XXIII (Carretera de Cádiz)',
    tag: 'Cañón Arterial de Alta Densidad • H/W=0.95',
    lat: 36.7085,
    lng: -4.4428,
    heading: 165,
    tilt: 65,
    H: 28.5,
    W: 30.0,
    orientationDeg: 165,
    dailyVehicles: 28000,
    lanes: 6,
    treeCoverPct: 8,
    description: 'Eje arterial norte-sur con intenso tráfico pesado y asimetría acusada de NO₂ en la pared de sotavento.'
  },
  {
    id: 'hilera',
    name: 'Calle Hilera (Polígono Alameda / Estación)',
    tag: 'Cañón de Transición Residencial • H/W=1.10',
    lat: 36.7188,
    lng: -4.4320,
    heading: 275,
    tilt: 62,
    H: 26.5,
    W: 24.0,
    orientationDeg: 95,
    dailyVehicles: 14200,
    lanes: 3,
    treeCoverPct: 12,
    description: 'Cañón de orientación transversal perpendicular a la brisa marina dominante (S/SE), atrapando emisiones matinales.'
  },
  {
    id: 'paseo_parque',
    name: 'Paseo del Parque (Corredor Botánico Litoral)',
    tag: 'Cañón Abierto Marítimo • H/W=0.45',
    lat: 36.7198,
    lng: -4.4150,
    heading: 85,
    tilt: 62,
    H: 22.0,
    W: 48.0,
    orientationDeg: 85,
    dailyVehicles: 21000,
    lanes: 4,
    treeCoverPct: 60,
    description: 'Corredor litoral de alta capacidad flanqueado por el parque botánico y el Puerto de Málaga. Máxima deposición foliar y ventilación de brisa marina.'
  },
  {
    id: 'calle_carreteria',
    name: 'Calle Carretería (Eje Norte Casco Histórico)',
    tag: 'Cañón Perimetral Curvilíneo • H/W=1.22',
    lat: 36.7235,
    lng: -4.4230,
    heading: 95,
    tilt: 68,
    H: 19.5,
    W: 16.0,
    orientationDeg: 95,
    dailyVehicles: 4500,
    lanes: 1,
    treeCoverPct: 5,
    description: 'Trazado medieval perimetral a la antigua muralla con flujo de recirculación helicoidal y dispersión fuertemente amortiguada por la rugosidad de fachadas.'
  },
  {
    id: 'avenida_andalucia',
    name: 'Avenida de Andalucía (Eje Metropolitano Oeste)',
    tag: 'Gran Arteria Urbana • H/W=0.55',
    lat: 36.7169,
    lng: -4.4375,
    heading: 265,
    tilt: 58,
    H: 32.0,
    W: 58.0,
    orientationDeg: 265,
    dailyVehicles: 38000,
    lanes: 8,
    treeCoverPct: 15,
    description: 'Vía colectora de máxima capacidad de tráfico de entrada a la ciudad con dispersión de microescala dominada por la turbulencia inducida por el tráfico.'
  }
];

// Subcomponente robusto para inicializar <gmp-map-3d> con propiedades de objeto nativas
const GoogleMaps3DViewport: React.FC<{
  target: typeof CANYON_3D_TARGETS[0];
  camHeading: number;
  camTilt: number;
  camRange: number;
  showLabels: boolean;
}> = ({ target, camHeading, camTilt, camRange, showLabels }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let mapElement = container.querySelector('gmp-map-3d') as any;
    if (!mapElement) {
      try {
        mapElement = document.createElement('gmp-map-3d');
        mapElement.style.width = '100%';
        mapElement.style.height = '100%';
        container.appendChild(mapElement);
      } catch (e) {
        console.warn("[GoogleMaps3D] Error instanciando gmp-map-3d:", e);
        return;
      }
    }

    try {
      // Asignar objeto LatLngAltitude requerido por la API Web Component de Google Maps 3D
      mapElement.center = {
        lat: target.lat,
        lng: target.lng,
        altitude: Math.round(target.H * 1.2)
      };
      mapElement.heading = camHeading;
      mapElement.tilt = camTilt;
      mapElement.range = camRange;
      mapElement.defaultLabelsDisabled = !showLabels;
    } catch (err) {
      console.warn("[GoogleMaps3D] Ajuste seguro de propiedades de cámara 3D:", err);
    }
  }, [target, camHeading, camTilt, camRange, showLabels]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};

export const GoogleMaps3DCanyonModal: React.FC<GoogleMaps3DCanyonModalProps> = ({
  isOpen,
  onClose,
  currentWindSpeedKmh,
  currentWindDirDeg,
  currentNO2Base,
  currentTemp,
  currentSolarUV
}) => {
  const { setActiveModal } = useUIStore();
  const [selectedCanyonId, setSelectedCanyonId] = useState<string>('larios');
  const [activeTab, setActiveTab] = useState<
    '3d_photogrammetry' | 'metric_measurement' | 'street_view_pedestrian' | 'multiscale_audit' | 'solar_shading' | 'lbm_cfd' | 'deckgl_3dtiles' | 'oke_vortex' | 'vertical_profile' | 'fair_export' | 'earth_engine'
  >('3d_photogrammetry');
  const [wallInspectionLevel, setWallInspectionLevel] = useState<number>(1.5); // Nivel respirable peatonal (m)
  const [customWindAngle, setCustomWindAngle] = useState<number>(currentWindDirDeg);
  const [customWindSpeed, setCustomWindSpeed] = useState<number>(Math.max(1.0, currentWindSpeedKmh / 3.6)); // m/s
  const [customTrafficFactor, setCustomTrafficFactor] = useState<number>(1.0);
  const [renderMode3D, setRenderMode3D] = useState<'satellite_photogrammetry' | 'cfd_mesh' | 'composite'>('satellite_photogrammetry');
  const [is3DExpanded, setIs3DExpanded] = useState(false);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);

  // Estados de control de cámara 3D de alta precisión
  const [camTilt, setCamTilt] = useState<number>(65);
  const [camHeading, setCamHeading] = useState<number>(10);
  const [camRange, setCamRange] = useState<number>(200);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [activeCamPreset, setActiveCamPreset] = useState<'vortex' | 'pedestrian' | 'nadir' | 'canyon_axis'>('vortex');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript().then((loaded) => {
      if (isMounted && loaded) {
        setMapsApiLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const target = useMemo(() => {
    return CANYON_3D_TARGETS.find(t => t.id === selectedCanyonId) || CANYON_3D_TARGETS[0];
  }, [selectedCanyonId]);

  // Actualizar cámara al cambiar de cañón seleccionado
  useEffect(() => {
    setCamTilt(target.tilt);
    setCamHeading(target.heading);
    setCamRange(Math.max(160, Math.round(target.H * 5.5)));
    setIsOrbiting(false);
    setActiveCamPreset('vortex');
  }, [target]);

  // Ciclo de auto-órbita cinemática 360°
  useEffect(() => {
    if (!isOrbiting) return;
    const interval = setInterval(() => {
      setCamHeading(prev => (prev + 0.5) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isOrbiting]);

  const applyCameraPreset = (preset: 'vortex' | 'pedestrian' | 'nadir' | 'canyon_axis') => {
    setIsOrbiting(false);
    setActiveCamPreset(preset);
    if (preset === 'vortex') {
      setCamTilt(65);
      setCamHeading(target.heading);
      setCamRange(Math.max(160, Math.round(target.H * 5.5)));
    } else if (preset === 'pedestrian') {
      setCamTilt(83);
      setCamHeading(target.heading);
      setCamRange(55);
    } else if (preset === 'nadir') {
      setCamTilt(0);
      setCamHeading(0);
      setCamRange(320);
    } else if (preset === 'canyon_axis') {
      setCamTilt(72);
      setCamHeading(target.orientationDeg);
      setCamRange(130);
    }
  };

  // Relación de aspecto H/W y clasificación de régimen de Oke (1987)
  const okeAnalysis = useMemo(() => {
    const hw = target.H / target.W;
    let regime = 'Isolated Roughness Flow';
    let regimeCode: 'IRF' | 'WIR' | 'SF' = 'IRF';
    let kMultiplier = 1.0;

    if (hw < 0.35) {
      regime = 'Flujo de Rugosidad Aislada (Isolated Roughness Flow, H/W < 0.35)';
      regimeCode = 'IRF';
      kMultiplier = 1.05;
    } else if (hw < 0.65) {
      regime = 'Interferencia de Estelas (Wake Interference Flow, 0.35 ≤ H/W < 0.65)';
      regimeCode = 'WIR';
      kMultiplier = 1.25;
    } else {
      regime = 'Flujo Rasante con Vórtice Cavitario (Skimming Flow, H/W ≥ 0.65)';
      regimeCode = 'SF';
      kMultiplier = 1.65;
    }

    // Ángulo de incidencia del viento relativo al cañón |θ_wind - θ_canyon|
    const relativeAngle = Math.abs((customWindAngle - target.orientationDeg + 360) % 180);
    const isPerpendicular = Math.abs(relativeAngle - 90) < 35;
    const isParallel = relativeAngle < 30 || relativeAngle > 150;

    // Intensidad del vórtice cavitario de Oke (m/s)
    const uRooftop = customWindSpeed * Math.pow(target.H / 10, 0.28); // Ley potencial
    const vortexCoreSpeed = isPerpendicular 
      ? uRooftop * 0.38 * Math.min(1.2, hw)
      : uRooftop * 0.15;

    // Asimetría de concentraciones entre paredes: Sotavento (Leeward) vs Barlovento (Windward)
    // Modelo analítico determinista de Kastner-Klein (2001) y Hertel & Berkowicz (1989)
    const leewardFactor = isPerpendicular ? 1.0 + 1.8 * Math.min(1.5, hw) : 1.2;
    const windwardFactor = isPerpendicular ? 1.0 / leewardFactor : 0.95;

    return {
      hw: Number(hw.toFixed(2)),
      regime,
      regimeCode,
      kMultiplier,
      relativeAngle: Math.round(relativeAngle),
      isPerpendicular,
      isParallel,
      uRooftop: Number(uRooftop.toFixed(2)),
      vortexCoreSpeed: Number(vortexCoreSpeed.toFixed(2)),
      leewardFactor: Number(leewardFactor.toFixed(2)),
      windwardFactor: Number(windwardFactor.toFixed(2))
    };
  }, [target, customWindAngle, customWindSpeed]);

  // Perfil vertical analítico de NO2, O3 y velocidad de viento u(z) de 0m a 40m
  const verticalProfileData = useMemo(() => {
    const points: any[] = [];
    const zStep = 1.0;
    const maxZ = Math.max(35, Math.ceil(target.H * 1.3));
    const baseTrafficNO2 = currentNO2Base * customTrafficFactor;

    for (let z = 0.5; z <= maxZ; z += zStep) {
      // Perfil de viento logarítmico z0 = 0.8m (rugosidad urbana)
      const z0 = 0.8;
      const d = target.H * 0.7; // Altura de desplazamiento de plano cero
      let uz = 0.2;
      if (z > d) {
        uz = Math.max(0.2, (customWindSpeed / 0.4) * Math.log((z - d + z0) / z0) * 0.4);
      } else {
        // Dentro de la cavidad: recirculación atenuada
        uz = Math.max(0.1, okeAnalysis.vortexCoreSpeed * Math.sin((Math.PI * z) / target.H));
      }

      // Dispersión vertical exponencial con amortiguación
      const zNorm = z / target.H;
      // En la pared de sotavento: acumulación máxima a baja cota (respirable 1.5 - 3m)
      const leewardNO2 = zNorm <= 1.0 
        ? baseTrafficNO2 * okeAnalysis.leewardFactor * Math.exp(-0.85 * zNorm)
        : baseTrafficNO2 * 0.65 * Math.exp(-0.3 * (zNorm - 1.0));

      const windwardNO2 = zNorm <= 1.0 
        ? baseTrafficNO2 * okeAnalysis.windwardFactor * Math.exp(-0.45 * zNorm)
        : baseTrafficNO2 * 0.65 * Math.exp(-0.3 * (zNorm - 1.0));

      // Titulación fotoquímica del Ozono: mayor NO2 => menor O3 cerca del tubo de escape
      const backgroundO3 = 62.0; // µg/m³
      const titrationO3 = Math.max(8.0, backgroundO3 - (leewardNO2 * 0.42));

      points.push({
        z: Number(z.toFixed(1)),
        uz: Number(uz.toFixed(2)),
        leewardNO2: Number(leewardNO2.toFixed(1)),
        windwardNO2: Number(windwardNO2.toFixed(1)),
        ozone: Number(titrationO3.toFixed(1))
      });
    }
    return points;
  }, [target, currentNO2Base, customTrafficFactor, customWindSpeed, okeAnalysis]);

  // Renderizado gráfico Canvas 2D/3D del corte del cañón y del vórtice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Fondo cielo atmosférico
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#09101f');
    skyGrad.addColorStop(0.65, '#0d1d36');
    skyGrad.addColorStop(1, '#060a12');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Dimensiones proporcionales del cañón en el canvas
    const streetCenterX = width / 2;
    const groundY = height - 50;
    const canyonWidthPx = Math.min(width * 0.52, Math.max(180, target.W * 7.5));
    const canyonHeightPx = canyonWidthPx * (target.H / target.W);
    const rooftopY = groundY - canyonHeightPx;
    const leftWallX = streetCenterX - canyonWidthPx / 2;
    const rightWallX = streetCenterX + canyonWidthPx / 2;

    // 1. Dibujar suelo / calzada
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Líneas de carriles
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(leftWallX, groundY + 12);
    ctx.lineTo(rightWallX, groundY + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Dibujar Edificio Izquierdo (Barlovento o Sotavento según viento)
    const isWindFromLeft = (customWindAngle > 180 && customWindAngle < 360);
    const leftIsLeeward = !isWindFromLeft;

    // Gradiente térmico / fachada izquierda
    const leftGrad = ctx.createLinearGradient(leftWallX - 120, rooftopY, leftWallX, groundY);
    leftGrad.addColorStop(0, '#1e293b');
    leftGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, rooftopY, leftWallX, canyonHeightPx);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, rooftopY, leftWallX, canyonHeightPx);

    // Ventanas representativas del edificio izquierdo
    ctx.fillStyle = '#38bdf822';
    for (let wy = rooftopY + 14; wy < groundY - 14; wy += 22) {
      for (let wx = leftWallX - 100; wx < leftWallX - 15; wx += 26) {
        ctx.fillRect(wx, wy, 16, 12);
      }
    }

    // Edificio Derecho
    const rightGrad = ctx.createLinearGradient(rightWallX, rooftopY, rightWallX + 120, groundY);
    rightGrad.addColorStop(0, '#1e293b');
    rightGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(rightWallX, rooftopY, width - rightWallX, canyonHeightPx);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rightWallX, rooftopY, width - rightWallX, canyonHeightPx);

    // Ventanas del edificio derecho
    for (let wy = rooftopY + 14; wy < groundY - 14; wy += 22) {
      for (let wx = rightWallX + 15; wx < width - 20; wx += 26) {
        ctx.fillRect(wx, wy, 16, 12);
      }
    }

    // 3. Campo de concentración de NO2 en el interior del cañón (Gradiente 2D)
    const no2Grad = ctx.createLinearGradient(
      leftIsLeeward ? leftWallX : rightWallX, 
      groundY, 
      leftIsLeeward ? rightWallX : leftWallX, 
      rooftopY
    );
    no2Grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)'); // Alta concentración roja en sotavento
    no2Grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)'); // Media
    no2Grad.addColorStop(1, 'rgba(16, 185, 129, 0.05)'); // Tejado limpio
    ctx.fillStyle = no2Grad;
    ctx.fillRect(leftWallX, rooftopY, canyonWidthPx, canyonHeightPx);

    // 4. Vórtice de Oke (Óvalo de recirculación)
    const vortexCenterX = streetCenterX;
    const vortexCenterY = rooftopY + canyonHeightPx * 0.52;
    const vortexRadiusX = canyonWidthPx * 0.38;
    const vortexRadiusY = canyonHeightPx * 0.38;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(vortexCenterX, vortexCenterY, vortexRadiusX, vortexRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Flechas indicadoras del sentido de giro del vórtice
    // Si viento viene de izq a dcha => giro horario
    const clockwise = isWindFromLeft;
    ctx.fillStyle = '#38bdf8';
    const arrowAngle = clockwise ? -Math.PI / 2 : Math.PI / 2;
    const arrowX = vortexCenterX;
    const arrowY = vortexCenterY - vortexRadiusY;

    ctx.beginPath();
    if (clockwise) {
      ctx.moveTo(arrowX + 8, arrowY - 4);
      ctx.lineTo(arrowX + 16, arrowY);
      ctx.lineTo(arrowX + 8, arrowY + 4);
    } else {
      ctx.moveTo(arrowX - 8, arrowY - 4);
      ctx.lineTo(arrowX - 16, arrowY);
      ctx.lineTo(arrowX - 8, arrowY + 4);
    }
    ctx.fill();

    // Viento suprayacente sobre los tejados
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const roofWindY = rooftopY - 20;
    if (isWindFromLeft) {
      ctx.moveTo(leftWallX - 40, roofWindY);
      ctx.lineTo(rightWallX + 40, roofWindY);
      ctx.stroke();
      // Flecha
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(rightWallX + 40, roofWindY - 5);
      ctx.lineTo(rightWallX + 52, roofWindY);
      ctx.lineTo(rightWallX + 40, roofWindY + 5);
      ctx.fill();
    } else {
      ctx.moveTo(rightWallX + 40, roofWindY);
      ctx.lineTo(leftWallX - 40, roofWindY);
      ctx.stroke();
      // Flecha
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(leftWallX - 40, roofWindY - 5);
      ctx.lineTo(leftWallX - 52, roofWindY);
      ctx.lineTo(leftWallX - 40, roofWindY + 5);
      ctx.fill();
    }

    // 5. Nivel de inspección respirable
    const inspectY = groundY - (wallInspectionLevel / target.H) * canyonHeightPx;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(leftWallX, inspectY);
    ctx.lineTo(rightWallX, inspectY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiquetas y cotas H y W
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`W = ${target.W} m`, streetCenterX - 25, groundY + 28);
    ctx.fillText(`H = ${target.H} m`, leftWallX - 65, rooftopY + canyonHeightPx / 2);
    ctx.fillText(`u(rooftop) = ${okeAnalysis.uRooftop} m/s`, streetCenterX - 45, rooftopY - 30);

    // Indicador de sotavento / barlovento
    ctx.fillStyle = leftIsLeeward ? '#ef4444' : '#10b981';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(leftIsLeeward ? 'FACHADA SOTAVENTO (LEEEWARD)' : 'FACHADA BARLOVENTO (WINDWARD)', leftWallX - 80, groundY - 8);

    ctx.fillStyle = !leftIsLeeward ? '#ef4444' : '#10b981';
    ctx.fillText(!leftIsLeeward ? 'FACHADA SOTAVENTO (LEEWARD)' : 'FACHADA BARLOVENTO (WINDWARD)', rightWallX + 8, groundY - 8);

  }, [target, customWindAngle, customWindSpeed, okeAnalysis, wallInspectionLevel]);

  // Exportador de datos FAIR (GeoJSON y CSV)
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        dataset: 'Microscale Urban Canyon 3D Profile - Málaga Digital Twin',
        canyon_id: target.id,
        canyon_name: target.name,
        formula: 'Oke (1987) Skimming Flow / Kastner-Klein (2001) / Pankow SOA',
        timestamp: new Date().toISOString(),
        h_meters: target.H,
        w_meters: target.W,
        aspect_ratio_hw: okeAnalysis.hw,
        regime: okeAnalysis.regime,
        wind_speed_ms: customWindSpeed,
        wind_dir_deg: customWindAngle
      },
      features: verticalProfileData.map((pt) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [target.lng, target.lat, pt.z]
        },
        properties: {
          altitude_m: pt.z,
          wind_speed_ms: pt.uz,
          no2_leeward_ug_m3: pt.leewardNO2,
          no2_windward_ug_m3: pt.windwardNO2,
          o3_ug_m3: pt.ozone
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canyon_3d_${target.id}_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = 'altitude_m,wind_speed_ms,no2_leeward_ug_m3,no2_windward_ug_m3,o3_ug_m3\n';
    const rows = verticalProfileData.map(d => `${d.z},${d.uz},${d.leewardNO2},${d.windwardNO2},${d.ozone}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canyon_3d_${target.id}_vertical_profile.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title={`FOTOGRAMETRÍA 3D & CAÑÓN URBANO (OKE 1987) • ${target.name.toUpperCase()}`}
      icon={<Globe className="w-4 h-4 text-emerald-400" />}
      subtitle="Fotogrametría 3D Fotorrealista de Google Maps • Asimetría de Dispersión y Microclima"
      onClose={onClose}
      defaultCollapsed={true}
      className="w-full max-w-5xl max-h-[90vh]"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs font-sans select-none overflow-hidden">
        
        {/* Barra Superior de Navegación de Cañones y Pestañas */}
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          
          {/* Selector de Cañón */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Cañón Urbano:</span>
            <select
              value={selectedCanyonId}
              onChange={(e) => setSelectedCanyonId(e.target.value)}
              className="bg-black/60 border border-slate-700 text-emerald-300 px-2 py-1 text-[11px] font-mono focus:border-emerald-500 outline-none"
            >
              {CANYON_3D_TARGETS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (H/W={(c.H / c.W).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Pestañas de Análisis */}
          <div className="flex flex-wrap items-center gap-1">
            <ScientificTooltip
              content="Inspección fotorrealista tridimensional acoplada al visor satelital de alta resolución ortorrectificada."
            >
              <button
                onClick={() => setActiveTab('3d_photogrammetry')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === '3d_photogrammetry'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Google 3D</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Herramienta de medición métrica tridimensional para calibrar alturas H y anchos W, determinando el régimen de flujo de Oke (1987)."
            >
              <button
                onClick={() => setActiveTab('metric_measurement')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'metric_measurement'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Ruler className="w-3 h-3 text-emerald-400" />
                <span>Medición 3D (H/W)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Inspección a cota de calle (1.8m AGL) con Google Street View: rugosidad superficial (Grimmond & Oke 1999) y dosel arbóreo."
            >
              <button
                onClick={() => setActiveTab('street_view_pedestrian')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'street_view_pedestrian'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Street View Acera</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Auditoría tri-escala: Validación cruzada entre Copernicus CAMS (macro), Estaciones Oficiales (meso) y Cañón Físico (micro)."
            >
              <button
                onClick={() => setActiveTab('multiscale_audit')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'multiscale_audit'
                    ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3 h-3 text-purple-400" />
                <span>Auditoría 3-Escalas</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Abrir Enrutamiento Peatonal de Mínima Exposición (Healthy Eco-Routing) para minimizar la dosis inhalada de NO2 y PM2.5."
            >
              <button
                onClick={() => setActiveModal('healthyRouting')}
                className="px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border bg-emerald-950/60 text-emerald-300 border-emerald-600 hover:bg-emerald-900"
              >
                <HeartPulse className="w-3 h-3 text-emerald-400" />
                <span>Eco-Routing</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Escáner predictivo de cañones críticos en Málaga: Clasificación de regímenes de flujo de Oke (1987) e Índice de Confinamiento (ICI)."
            >
              <button
                onClick={() => setActiveModal('urbanCanyonCriticalityScanner')}
                className="px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border bg-amber-950/60 text-amber-300 border-amber-600 hover:bg-amber-900"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Semáforo Cañones</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Balance radiativo superficial e Isla de Calor Urbana (UHI) en Málaga: Albedo, emisividad y sobrecalentamiento de asfalto/mármol/tejados."
            >
              <button
                onClick={() => setActiveModal('urbanHeatIslandThermalBalance')}
                className="px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border bg-orange-950/60 text-orange-300 border-orange-600 hover:bg-orange-900"
              >
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Isla Calor (UHI)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Correlación bivariante entre Ruido vehicular CNOSSOS-EU (Lden dBA) y Calidad del Aire (NO2 µg/m³) en cañones de Málaga."
            >
              <button
                onClick={() => setActiveModal('acousticAtmosphericCorrelation')}
                className="px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border bg-indigo-950/60 text-indigo-300 border-indigo-600 hover:bg-indigo-900"
              >
                <Volume2 className="w-3 h-3 text-indigo-400" />
                <span>Ruido CNOSSOS</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Efemérides solares precisas con SunCalc en Málaga, sombreado 3D de fachadas y fotólisis diferencial de Leighton J_NO2."
            >
              <button
                onClick={() => setActiveTab('solar_shading')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'solar_shading'
                    ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Solar &amp; Fotólisis</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Integración con Google Earth Engine REST API: Ingesta de datos Sentinel-5P, Landsat 8 y Sentinel-2 para condiciones de contorno."
            >
              <button
                onClick={() => setActiveTab('earth_engine')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'earth_engine'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>GEE Satelital</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Solver de Dinámica de Fluidos Computacional a Microescala Lattice Boltzmann (D2Q9) para Navier-Stokes en el cañón."
            >
              <button
                onClick={() => setActiveTab('lbm_cfd')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'lbm_cfd'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>LBM D2Q9 CFD</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Pipeline WebGL2 con Tile3DLayer de Deck.GL y Tiles3DLoader de @loaders.gl/3d-tiles con planos de corte (clipping)."
            >
              <button
                onClick={() => setActiveTab('deckgl_3dtiles')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'deckgl_3dtiles'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Box className="w-3 h-3 text-emerald-400" />
                <span>3D Tiles (Deck.GL)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Visualización física del vórtice cavitario de recirculación de Oke (1987) y asimetría de concentraciones entre paredes."
            >
              <button
                onClick={() => setActiveTab('oke_vortex')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'oke_vortex'
                    ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Wind className="w-3 h-3 text-purple-400" />
                <span>Vórtice Oke</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Curva vertical analítica u(z), NO2 sotavento/barlovento y titulación fotoquímica del O3."
            >
              <button
                onClick={() => setActiveTab('vertical_profile')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'vertical_profile'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Perfil Vertical</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              content="Descarga citable FAIR en formato GeoJSON y CSV para publicaciones y validación científica."
            >
              <button
                onClick={() => setActiveTab('fair_export')}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                  activeTab === 'fair_export'
                    ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>FAIR</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Parámetros de Control y Telemetría en Vivo */}
        <div className="px-3 py-2 bg-black/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Morfología: <strong className="text-emerald-400">H={target.H}m · W={target.W}m</strong> (H/W={okeAnalysis.hw})
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Régimen: <strong className="text-cyan-400">{okeAnalysis.regimeCode}</strong> ({okeAnalysis.regime.split('(')[0]})
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Viento: <strong className="text-amber-400">{customWindSpeed.toFixed(1)} m/s</strong> ({customWindAngle}°)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Asimetría Sotavento:</span>
            <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-800 text-red-300 font-bold">
              {okeAnalysis.leewardFactor}x
            </span>
            <span className="text-slate-400">Barlovento:</span>
            <span className="px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold">
              {okeAnalysis.windwardFactor}x
            </span>
          </div>
        </div>

        {/* Contenido Principal de las Pestañas */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">

          {/* TAB 1: FOTOGRAMETRÍA 3D Y PERSPECTIVA URBANA */}
          {activeTab === '3d_photogrammetry' && (
            <div className="space-y-3 h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Panel de Contexto Fotorrealista */}
                <div className="md:col-span-2 p-3 bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-slate-200 text-xs">{target.name}</h4>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 border bg-emerald-950 text-emerald-300 border-emerald-700 font-bold">
                      Coordenadas: {target.lat.toFixed(4)}, {target.lng.toFixed(4)}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    {target.description}
                  </p>

                  {/* Fotogrametría Satelital de Google Maps y Visor 3D Interactivo */}
                  <div className={`relative border border-slate-700 bg-black overflow-hidden group transition-all ${
                    is3DExpanded ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col' : 'h-[360px]'
                  }`}>
                    {/* Header para modo pantalla completa */}
                    {is3DExpanded && (
                      <div className="absolute top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-md border-b border-slate-700 px-4 py-2.5 flex justify-between items-center pointer-events-auto">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-emerald-400 animate-pulse" />
                          <div>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                              <span>Google Maps 3D Fotorrealista</span>
                              <span className="text-emerald-400 font-mono text-xs">• {target.name}</span>
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                              H={target.H}m · W={target.W}m · H/W={okeAnalysis.hw} · Régimen: {okeAnalysis.regimeCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIs3DExpanded(false)}
                            className="px-3 py-1 bg-red-950/90 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-700 transition-colors"
                          >
                            Cerrar Pantalla Completa
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Barra de Herramientas Flotante Superior (Presets de Cámara y Órbita) */}
                    <div className={`absolute ${is3DExpanded ? 'top-14' : 'top-2'} right-2 z-10 flex items-center gap-1 bg-black/85 backdrop-blur-sm p-1 border border-slate-700 text-[9px] pointer-events-auto shadow-lg`}>
                      <span className="text-slate-400 font-bold px-1 hidden sm:inline">Cámara:</span>
                      
                      <ScientificTooltip
                        title="Perspectiva Vórtice Oke (Inclinación 65°)"
                        content="Ángulo oblicuo optimizado para visualizar el vórtice de recirculación en régimen rasante (Skimming Flow) y acumulación en fachada sotavento."
                        citation="Oke, T. R. (1987) Boundary Layer Climates"
                        position="bottom"
                      >
                        <button
                          onClick={() => applyCameraPreset('vortex')}
                          className={`px-1.5 py-0.5 font-bold transition-all border cursor-pointer ${
                            activeCamPreset === 'vortex' && !isOrbiting
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          Vórtice
                        </button>
                      </ScientificTooltip>

                      <ScientificTooltip
                        title="Perspectiva Peatonal a Ras de Calle (1.8 m AGL)"
                        content="Cota respiratoria humana oficial para evaluación de exposición y dosimetría de NO₂/PM conforme al Anexo III de la Directiva 2008/50/CE."
                        citation="Directiva 2008/50/CE / Guías OMS 2021"
                        position="bottom"
                      >
                        <button
                          onClick={() => applyCameraPreset('pedestrian')}
                          className={`px-1.5 py-0.5 font-bold transition-all border cursor-pointer ${
                            activeCamPreset === 'pedestrian' && !isOrbiting
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          Peatón
                        </button>
                      </ScientificTooltip>

                      <ScientificTooltip
                        title="Alineación Longitudinal con el Eje de Calle"
                        content="Alinea la cámara paralelamente a la rasante vial para analizar el canalizado advectivo y la penetración del viento frente a las fachadas."
                        position="bottom"
                      >
                        <button
                          onClick={() => applyCameraPreset('canyon_axis')}
                          className={`px-1.5 py-0.5 font-bold transition-all border cursor-pointer ${
                            activeCamPreset === 'canyon_axis' && !isOrbiting
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          Eje Calle
                        </button>
                      </ScientificTooltip>

                      <ScientificTooltip
                        title="Vista Cenital Nadir (0° Inclinación)"
                        content="Perspectiva cenital ortofotográfica para cálculo del factor de visión del cielo (Sky View Factor, SVF) y albedo superficial."
                        citation="Grimmond & Oke (1999)"
                        position="bottom"
                      >
                        <button
                          onClick={() => applyCameraPreset('nadir')}
                          className={`px-1.5 py-0.5 font-bold transition-all border cursor-pointer ${
                            activeCamPreset === 'nadir' && !isOrbiting
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          Cenital
                        </button>
                      </ScientificTooltip>

                      <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

                      {/* Botón Órbita 360° */}
                      <ScientificTooltip
                        content="Rotación orbital cinemática 360° continua para inspección fotogramétrica tridimensional de la morfología del cañón urbano."
                        position="bottom"
                      >
                        <button
                          onClick={() => setIsOrbiting(!isOrbiting)}
                          className={`px-1.5 py-0.5 font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                            isOrbiting
                              ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse'
                              : 'bg-slate-900 text-cyan-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          <RotateCcw className={`w-2.5 h-2.5 ${isOrbiting ? 'animate-spin' : ''}`} />
                          <span>360°</span>
                        </button>
                      </ScientificTooltip>

                      {/* Botón Etiquetas */}
                      <ScientificTooltip
                        content="Conmutar capas de toponimia urbana oficial, numeración postal y nombres de calles en la fotogrametría 3D."
                        position="bottom"
                      >
                        <button
                          onClick={() => setShowLabels(!showLabels)}
                          className={`px-1.5 py-0.5 font-bold transition-all border cursor-pointer ${
                            showLabels
                              ? 'bg-amber-600 text-white border-amber-400'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          Etiquetas
                        </button>
                      </ScientificTooltip>

                      {/* Botón Pantalla Completa */}
                      <ScientificTooltip
                        content={is3DExpanded ? "Salir del modo pantalla completa de fotogrametría 3D." : "Expandir visor 3D a pantalla completa."}
                        position="bottom"
                      >
                        <button 
                          onClick={() => setIs3DExpanded(!is3DExpanded)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </ScientificTooltip>
                    </div>

                    {/* Componente <gmp-map-3d> oficial de Google Maps o Fallback Retina */}
                    {mapsApiLoaded ? (
                      <GoogleMaps3DViewport
                        target={target}
                        camHeading={camHeading}
                        camTilt={camTilt}
                        camRange={camRange}
                        showLabels={showLabels}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={`/api/maps/tiles/y/19/${Math.floor((target.lng + 180) / 360 * Math.pow(2, 19))}/${Math.floor((1 - Math.log(Math.tan(target.lat * Math.PI / 180) + 1 / Math.cos(target.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 19))}?scale=2`}
                          alt="Google Maps High Resolution Satellite Hybrid Tile"
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-2 left-2 bg-black/80 border border-slate-700 px-2 py-1 text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>Cargando Malla 3D Fotorrealista • Vista Satélite Retina 512px</span>
                        </div>
                      </div>
                    )}

                    {/* Barra de Control de Cámara Inferior */}
                    <div className="absolute bottom-1.5 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 bg-black/85 backdrop-blur-sm px-2.5 py-1.5 border border-slate-800 pointer-events-auto text-[9px] font-mono">
                      <div className="flex items-center gap-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-3 h-3 text-emerald-400" />
                          <span>Azimut:</span>
                          <strong className="text-emerald-300">{Math.round(camHeading)}°</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Inclinación:</span>
                          <strong className="text-cyan-300">{Math.round(camTilt)}°</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Distancia:</span>
                          <strong className="text-amber-300">{Math.round(camRange)}m</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="359"
                          value={Math.round(camHeading)}
                          onChange={(e) => {
                            setIsOrbiting(false);
                            setCamHeading(parseInt(e.target.value, 10));
                          }}
                          className="w-20 h-1 bg-slate-800 accent-emerald-500 rounded cursor-pointer"
                          title="Ajuste fino de rotación azimutal"
                        />
                        <span className="text-slate-500 text-[8px] hidden md:inline">
                          Arrastra sobre el modelo para rotar e inclinar libremente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acceso a Google Earth 3D / Maps Directo */}
                  <div className="flex items-center justify-between pt-1 text-[9.5px]">
                    <span className="text-slate-400 italic">
                      Visualización fotorrealista ortorrectificada procesada mediante el proxy seguro del servidor.
                    </span>
                    <a
                      href={`https://www.google.com/maps/@${target.lat},${target.lng},120m/data=!3m1!1e3`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-all font-bold"
                    >
                      <span>Abrir Perspectiva 3D en Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Panel Lateral de Parámetros Microescalares */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <h5 className="font-bold text-slate-200 text-xs">Variables Microescalares</h5>
                  </div>

                  {/* Control de Velocidad de Viento */}
                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Velocidad Viento Tejado u(H):</span>
                      <strong className="text-emerald-400">{customWindSpeed.toFixed(1)} m/s</strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15.0"
                      step="0.5"
                      value={customWindSpeed}
                      onChange={(e) => setCustomWindSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Control de Dirección del Viento */}
                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Dirección Viento:</span>
                      <strong className="text-cyan-400">{customWindAngle}° ({customWindAngle > 180 ? 'Poniente/Brisa' : 'Levante/Terral'})</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      step="5"
                      value={customWindAngle}
                      onChange={(e) => setCustomWindAngle(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Factor de Tráfico */}
                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Volumen Tráfico (Punta/Valle):</span>
                      <strong className="text-amber-400">{(customTrafficFactor * 100).toFixed(0)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={customTrafficFactor}
                      onChange={(e) => setCustomTrafficFactor(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Altura de Inspección en Fachada */}
                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Cota Inspección z:</span>
                      <strong className="text-purple-400">{wallInspectionLevel.toFixed(1)} m s.s.</strong>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max={target.H}
                      step="0.5"
                      value={wallInspectionLevel}
                      onChange={(e) => setWallInspectionLevel(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-purple-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Botón de Reset a Telemetría Real */}
                  <button
                    onClick={() => {
                      setCustomWindSpeed(Math.max(1.0, currentWindSpeedKmh / 3.6));
                      setCustomWindAngle(currentWindDirDeg);
                      setCustomTrafficFactor(1.0);
                      setWallInspectionLevel(1.5);
                    }}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Restablecer a Telemetría Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HERRAMIENTA DE MEDICIÓN MÉTRICA 3D (H y W) */}
          {activeTab === 'metric_measurement' && (
            <CanyonMetricMeasurementTab
              canyon={target}
              currentWindSpeedMs={customWindSpeed}
              currentWindDirDeg={customWindAngle}
              currentNO2Base={currentNO2Base}
            />
          )}

          {/* TAB: GOOGLE STREET VIEW A COTA DE ACERA */}
          {activeTab === 'street_view_pedestrian' && (
            <GoogleStreetViewCanyonTab
              canyon={target}
            />
          )}

          {/* TAB: AUDITORÍA MULTI-ESCALA CALIDAD DEL AIRE (CAMS / ESTACIONES / MICRO) */}
          {activeTab === 'multiscale_audit' && (
            <AirQualityMultiScaleAuditTab
              canyon={target}
              currentWindSpeedMs={customWindSpeed}
              currentWindDirDeg={customWindAngle}
              currentNO2Base={currentNO2Base}
            />
          )}

          {/* TAB: EFEMÉRIDES SOLARES Y FOTÓLISIS DE LEIGHTON (SUNCALC) */}
          {activeTab === 'solar_shading' && (
            <SolarShadingCanyonTab
              canyon={target}
              currentSolarUV={currentSolarUV}
            />
          )}

          {/* TAB: SOLVER CFD MICROESCALA LATTICE BOLTZMANN (LBM D2Q9) */}
          {activeTab === 'lbm_cfd' && (
            <LbmCfdSolverTab
              canyon={target}
              currentWindSpeedKmh={currentWindSpeedKmh}
            />
          )}

          {/* TAB: PIPELINE DECK.GL 3D TILES & OGC CLIPPING */}
          {activeTab === 'deckgl_3dtiles' && (
            <DeckGl3DTilesInspectorTab
              canyon={target}
            />
          )}

          {/* TAB 2: VÓRTICE DE OKE Y ASIMETRÍA DE FACHADAS */}
          {activeTab === 'oke_vortex' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Canvas 2D de Sección Transversal */}
                <div className="md:col-span-2 p-3 bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      <h4 className="font-bold text-slate-200 text-xs">Corte Transversal & Vórtice Cavitario (CFD 2D)</h4>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      Oke (1987) · Kastner-Klein (2001)
                    </span>
                  </div>

                  <div className="border border-slate-800 bg-black flex items-center justify-center p-1">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={290}
                      className="w-full h-auto max-h-[290px]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                    <span>
                      Núcleo del Vórtice: <strong className="text-cyan-300">{okeAnalysis.vortexCoreSpeed} m/s</strong>
                    </span>
                    <span>
                      Régimen: <strong className="text-emerald-300">{okeAnalysis.regime.split('(')[0]}</strong>
                    </span>
                    <span>
                      Ángulo Relativo: <strong className="text-amber-300">{okeAnalysis.relativeAngle}°</strong>
                    </span>
                  </div>
                </div>

                {/* Explicación Física y Teórica */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 space-y-2.5 text-[9.5px]">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <h5 className="font-bold text-slate-200 text-xs">Fundamentación Teórica</h5>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    Cuando el viento incide perpendicularmente sobre el cañón con <code className="text-cyan-300 font-bold">H/W ≥ 0.65</code>, se desprende la capa límite en la cornisa de barlovento y se genera un vórtice cavitario cerrado en régimen de <strong>Skimming Flow</strong>.
                  </p>

                  <div className="p-2 bg-black/60 border border-slate-800 space-y-1.5">
                    <div className="text-slate-400">
                      <strong className="text-red-400">1. Pared de Sotavento (Leeward):</strong> El flujo recirculante arrastra los humos vehiculares contra la pared, concentrando el contaminante en cotas bajas peatonales (factor <strong>{okeAnalysis.leewardFactor}x</strong>).
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-emerald-400">2. Pared de Barlovento (Windward):</strong> Recibe aire descendente relativamente más limpio desde la cota del tejado (factor <strong>{okeAnalysis.windwardFactor}x</strong>).
                    </div>
                  </div>

                  <p className="text-slate-400 italic text-[9px]">
                    Este fenómeno es crítico en la tesis doctoral para explicar por qué las estaciones oficiales a pie de acera (ej. Carranque o Hilera) registran picos dispares según la dirección de la brisa marina.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERFIL VERTICAL DE CONTAMINANTES */}
          {activeTab === 'vertical_profile' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <h4 className="font-bold text-slate-200 text-xs">Gradiente Vertical de NO₂ y O₃ junto a Fachadas (0 a 35 metros)</h4>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span> NO₂ Sotavento
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span> NO₂ Barlovento
                    </span>
                    <span className="flex items-center gap-1 text-sky-400">
                      <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span> O₃ (Titulación)
                    </span>
                  </div>
                </div>

                {/* Gráfico Recharts de Perfil Vertical */}
                <div className="h-[280px] w-full bg-black/60 border border-slate-800 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={verticalProfileData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="z" 
                        stroke="#64748b" 
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        label={{ value: 'Altura z (metros s.s.)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 9 }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        label={{ value: 'Concentración (µg/m³)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', color: '#e2e8f0', fontSize: '10px' }}
                      />
                      <ReferenceLine x={target.H} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Cornisa H=${target.H}m`, fill: '#f59e0b', fontSize: 8 }} />
                      <ReferenceLine x={1.5} stroke="#a855f7" strokeDasharray="2 2" label={{ value: 'Nivel Peatonal 1.5m', fill: '#a855f7', fontSize: 8 }} />
                      
                      <Line type="monotone" dataKey="leewardNO2" stroke="#ef4444" strokeWidth={2} dot={false} name="NO₂ Sotavento" />
                      <Line type="monotone" dataKey="windwardNO2" stroke="#10b981" strokeWidth={2} dot={false} name="NO₂ Barlovento" />
                      <Line type="monotone" dataKey="ozone" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="O₃ Residual" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono pt-1">
                  <div className="p-1.5 bg-black/40 border border-slate-800">
                    <span className="text-slate-500 block">NO₂ a 1.5m (Sotavento):</span>
                    <strong className="text-red-400 text-xs">
                      {verticalProfileData.find(d => d.z >= 1.5)?.leewardNO2 || '--'} µg/m³
                    </strong>
                  </div>
                  <div className="p-1.5 bg-black/40 border border-slate-800">
                    <span className="text-slate-500 block">NO₂ a 1.5m (Barlovento):</span>
                    <strong className="text-emerald-400 text-xs">
                      {verticalProfileData.find(d => d.z >= 1.5)?.windwardNO2 || '--'} µg/m³
                    </strong>
                  </div>
                  <div className="p-1.5 bg-black/40 border border-slate-800">
                    <span className="text-slate-500 block">Titulación O₃ a 1.5m:</span>
                    <strong className="text-sky-400 text-xs">
                      {verticalProfileData.find(d => d.z >= 1.5)?.ozone || '--'} µg/m³
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORTACIÓN FAIR */}
          {activeTab === 'fair_export' && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">Ciencia Abierta y Exportación FAIR (Findable, Accessible, Interoperable, Reusable)</h4>
                  <p className="text-[10px] text-slate-400">
                    Exportación sin datos estocásticos. Trazabilidad completa con normas europeas de modelización microescalar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Exportar GeoJSON */}
                <div className="p-3 bg-black/50 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">Malla Espacial 3D (GeoJSON)</span>
                    <span className="text-[8.5px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                      OGC Standard
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400">
                    Contiene las coordenadas 3D [lon, lat, altitud], campos escalares de NO2 por fachada, gradiente de viento u(z) y atributos morfológicos del cañón.
                  </p>
                  <button
                    onClick={handleExportGeoJSON}
                    className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[9.5px] uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar GeoJSON 3D</span>
                  </button>
                </div>

                {/* Exportar CSV */}
                <div className="p-3 bg-black/50 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">Perfil Vertical Tabular (CSV)</span>
                    <span className="text-[8.5px] px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-700 font-mono">
                      RFC 4180
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400">
                    Tabla de discretización vertical metro a metro para análisis estadístico en R, Python, MATLAB o inclusión en anexos de tesis.
                  </p>
                  <button
                    onClick={handleExportCSV}
                    className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-[9.5px] uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar CSV Tabular</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EARTH ENGINE SATELLITE */}
          {activeTab === 'earth_engine' && target && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 space-y-3">
              <EarthEngineSatelliteTab canyon={target} />
            </div>
          )}

        </div>

      </div>
    </DraggableWindow>
  );
};
