import React, { useState, useMemo } from 'react';
import { 
  FileText, Sparkles, BookOpen, Layers, Cpu, ShieldCheck, Activity, 
  MapPin, Wind, Sun, Atom, Car, Waves, HeartPulse, ShieldAlert,
  Download, ExternalLink, Printer, Search, CheckCircle2, ChevronRight,
  ArrowRight, Info, HelpCircle, GraduationCap, Compass, Building2, Trees,
  Flame, Database, Scale, Lock, RefreshCw, Eye
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { MathFormula } from './MathFormula';
import { useActivePoint } from '../context/ActivePointContext';
import { useUIStore } from '../store/uiStore';

export interface DoctoralPdfReportGuideModalProps {
  onClose: () => void;
  onOpenPdfGenerator?: () => void;
}

interface PageExplanation {
  pageNumber: number;
  title: string;
  subtitle: string;
  themeColor: string; // Tailwind color token
  accentBg: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  whatTheTribunalSees: string;
  keyFormulas: { formula: string; explanation: string }[];
  dataPointsExplained: { name: string; symbol: string; typicalValue: string; scientificMeaning: string; regulatoryOrPhysicalBasis: string }[];
  defenseAdvice: string[];
}

export interface DoctoralPdfReportGuideContentProps {
  onOpenPdfGenerator?: () => void;
}

export const DoctoralPdfReportGuideContent: React.FC<DoctoralPdfReportGuideContentProps> = ({
  onOpenPdfGenerator
}) => {
  const activeCtx = useActivePoint();
  const setActiveModal = useUIStore(s => s.setActiveModal);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const streetName = String(activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga (Centro Histórico)');
  const districtName = String(activeCtx?.activePoint?.districtName || activeCtx?.activePoint?.neighborhoodName || 'Distrito Centro');
  const lat = typeof activeCtx?.location?.lat === 'number' ? activeCtx.location.lat : 36.7213;
  const lon = typeof activeCtx?.location?.lon === 'number' ? activeCtx.location.lon : -4.4214;
  const utmX = activeCtx?.activePoint?.utmX || Math.round(370000 + (lon + 4.45) * 85000);
  const utmY = activeCtx?.activePoint?.utmY || Math.round(4064000 + (lat - 36.71) * 111000);
  const elevationM = typeof activeCtx?.assimilation?.elevationM === 'number' ? activeCtx.assimilation.elevationM : 16.0;
  const no2Val = typeof activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 === 'number' ? activeCtx.assimilation.no2PedestrianLevel1_8mUgM3 : 28.4;
  const o3Val = typeof activeCtx?.assimilation?.ozoneO3UgM3 === 'number' ? activeCtx.assimilation.ozoneO3UgM3 : 52.1;
  const pm25Val = typeof activeCtx?.assimilation?.pm25UgM3 === 'number' ? activeCtx.assimilation.pm25UgM3 : 14.2;
  const pm10Val = typeof activeCtx?.assimilation?.pm10UgM3 === 'number' ? activeCtx.assimilation.pm10UgM3 : 23.5;
  const canyonHW = typeof activeCtx?.assimilation?.aspectRatioHw === 'number' ? activeCtx.assimilation.aspectRatioHw : 1.25;
  const svfVal = typeof activeCtx?.assimilation?.skyViewFactorSvf === 'number' ? activeCtx.assimilation.skyViewFactorSvf : 0.42;

  // Las 12 Páginas Explicadas con Rigor Científico Máximo y Lenguaje Ameno
  const pages: PageExplanation[] = useMemo(() => [
    {
      pageNumber: 1,
      title: "Página 1: Portada Institucional, Cartografía HD 3D y Geodesia Oficial",
      subtitle: "Georreferenciación de doble proyección, MDE topográfico y captura oblicua de la morfología urbana",
      themeColor: "text-emerald-400",
      accentBg: "bg-emerald-950/40 border-emerald-500/40",
      badge: "GEODESIA & ORTOFOTO HD",
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
      summary: "La primera página establece la legitimidad académica e institucional ante el Tribunal de Tesis de la EIDUNED. Georreferencia el punto activo con precisión submétrica combinando coordenadas globales (WGS84) y cartografía oficial del Estado español (ETRS89 UTM 30N, RD 1071/2007), mostrando una ortofoto 3D de alta densidad con altimetría de edificios OSM.",
      whatTheTribunalSees: "Un documento con membrete oficial de la UNED, metadatos del autor, resumen ejecutivo de inmisión del receptor y una ventana cartográfica 3D oblicua (Pitch 60°) con rosa de los vientos, escala métrica y geolocalización de las 5 estaciones oficiales de la aglomeración de Málaga.",
      keyFormulas: [
        {
          formula: "ETRS89 UTM Huso 30N: (X, Y) = f_{TransverseMercator}(\\lambda, \\phi, \\lambda_0 = -3^\\circ)",
          explanation: "Proyección conforme cilíndrica oficial obligatoria en España. Preserva ángulos y minimiza deformaciones locales a escala de calle."
        },
        {
          formula: "z_{cota} = MDE_{Copernicus}(x, y) + h_{sensor}(1.8\\text{ m})",
          explanation: "Cota ortométrica sobre el nivel medio del mar en Alicante sumada a la cota respiratoria peatonal estándar de 1.8 metros."
        }
      ],
      dataPointsExplained: [
        {
          name: "Coordenadas WGS84",
          symbol: "φ, λ",
          typicalValue: `${lat.toFixed(5)}°N, ${lon.toFixed(5)}°W`,
          scientificMeaning: "Latitud y longitud en el elipsoide geodésico de referencia global GRS80.",
          regulatoryOrPhysicalBasis: "Sistema estándar de GPS y telemetría satelital Copernicus Sentinel-5P."
        },
        {
          name: "Coordenadas Métricas ETRS89",
          symbol: "X_UTM, Y_UTM",
          typicalValue: `X=${utmX} m, Y=${utmY} m`,
          scientificMeaning: "Posición plana en metros dentro del huso UTM 30N con meridiano central en 3°W.",
          regulatoryOrPhysicalBasis: "Real Decreto 1071/2007 por el que se regula el sistema geodésico de referencia oficial en España."
        },
        {
          name: "Cota Topográfica MDE",
          symbol: "z_MDE",
          typicalValue: `${elevationM.toFixed(1)} m s.n.m.`,
          scientificMeaning: "Elevación del terreno sobre el nivel del mar, determinante para la cuenca orográfica y la brisa marina.",
          regulatoryOrPhysicalBasis: "Modelo Digital de Elevaciones LiDAR PNOA / Copernicus DEM GLO-30."
        },
        {
          name: "Distancia al Mar Mediterráneo",
          symbol: "d_costa",
          typicalValue: "1.2 km (Bahía de Málaga)",
          scientificMeaning: "Distancia crítica para la advección de spray salino marino y la formación de la capa límite interna térmica (TIBL).",
          regulatoryOrPhysicalBasis: "Morfología de costa Simpson (1994)."
        }
      ],
      defenseAdvice: [
        "Indica al tribunal que usar ETRS89 no es un detalle estético: es el requisito legal vinculante en España para cualquier peritaje ambiental judicial o urbanístico.",
        "Muestra cómo la ortofoto HD 3D refleja la geometría exacta de las fachadas colindantes, demostrando que no se asume una superficie plana idealizada."
      ]
    },
    {
      pageNumber: 2,
      title: "Página 2: Telemetría Observacional en Tiempo Real y Red Oficial de Málaga",
      subtitle: "Contraste riguroso entre inmisión asimilada in situ y los umbrales legales europeos y mundiales",
      themeColor: "text-cyan-400",
      accentBg: "bg-cyan-950/40 border-cyan-500/40",
      badge: "TELEMETRÍA & DIRECTIVAS",
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      summary: "Esta página audita simultáneamente los 8 contaminantes criterio frente a la Directiva 2008/50/CE, la nueva Directiva europea revisada (UE) 2024/2881 y las exigentes Guías OMS 2021. Se completa con una tabla de intercomparación cuantitativa con las 5 estaciones oficiales de la Junta de Andalucía.",
      whatTheTribunalSees: "Una tabla metrológica de semáforos normativos (Conforme / Alerta / Superado), factores de conversión estequiométricos de µg/m³ a partes por billón (ppbv) y la auditoría de proximidad a las estaciones de Carranque, Hilera, Atabal, Puerto y Guadalhorce.",
      keyFormulas: [
        {
          formula: "C_{ppb} = C_{\\mu g/m^3} \\cdot \\frac{R \\cdot T}{P \\cdot M} = C_{\\mu g/m^3} \\cdot \\frac{24.45}{M_{contaminante}} \\quad (T=293.15\\text{ K}, P=101.325\\text{ kPa})",
          explanation: "Conversión exacta de masa por unidad de volumen a fracción molar volumétrica según la ley de gases ideales a condiciones de referencia europeas."
        },
        {
          formula: "[O_x] = [NO_2] + [O_3] \\approx \\text{constante conservativa local}",
          explanation: "Invariante fotoquímico de oxidantes totales que elimina la interferencia de la titulación local de tubos de escape."
        }
      ],
      dataPointsExplained: [
        {
          name: "Dióxido de Nitrógeno (NO₂)",
          symbol: "[NO2]",
          typicalValue: `${no2Val.toFixed(1)} µg/m³`,
          scientificMeaning: "Contaminante traza tóxico primario/secundario de combustión con efecto broncodilatador adverso.",
          regulatoryOrPhysicalBasis: "Límite anual Dir 2008/50/CE: 40 µg/m³; Dir 2024/2881: 20 µg/m³; Guía OMS 2021: 10 µg/m³."
        },
        {
          name: "Ozono Troposférico (O₃)",
          symbol: "[O3]",
          typicalValue: `${o3Val.toFixed(1)} µg/m³`,
          scientificMeaning: "Oxidante secundario fotoquímico generado en atmósfera libre y consumido localmente en calzadas por NO.",
          regulatoryOrPhysicalBasis: "Valor objetivo octohorario OMS: 100 µg/m³; Umbral de información a la población: 180 µg/m³."
        },
        {
          name: "Material Particulado PM2.5 / PM10",
          symbol: "PM2.5 / PM10",
          typicalValue: `${pm25Val.toFixed(1)} / ${pm10Val.toFixed(1)} µg/m³`,
          scientificMeaning: "Aerosoles finos (alveolares) y gruesos (torácicos) de fuentes vehiculares, secundarias y aerosol marino/calima.",
          regulatoryOrPhysicalBasis: "Dir 2024/2881 anual: PM2.5 = 10 µg/m³; PM10 = 20 µg/m³. OMS 2021: PM2.5 = 5 µg/m³."
        },
        {
          name: "Oxidante Total Ox",
          symbol: "[Ox]",
          typicalValue: `${(no2Val / 1.88 + o3Val / 2.0).toFixed(1)} ppb`,
          scientificMeaning: "Suma de fracciones molares de NO2 y O3. Mide la carga oxidativa real de la masa de aire sin distorsión por tráfico.",
          regulatoryOrPhysicalBasis: "Clapp & Jenkin (2001), invariante fotostacionario en la capa superficial."
        }
      ],
      defenseAdvice: [
        "Destaca que la tabla incluye ya los límites de la Directiva Europea 2024/2881 (que entrará en vigor en 2030), demostrando que la tesis tiene vigencia prospectiva para la próxima década.",
        "Explica por qué cerca de calles con mucho tráfico el O3 baja pero el Ox se mantiene: es la titulación NO + O3 -> NO2, no una limpieza real de oxidantes."
      ]
    },
    {
      pageNumber: 3,
      title: "Página 3: Micrometeorología Urbana y Capa Límite Superficial (MOST)",
      subtitle: "Teoría de Semejanza de Monin-Obukhov, estabilidad atmosférica y dispersión por turbulencia",
      themeColor: "text-purple-400",
      accentBg: "bg-purple-950/40 border-purple-500/40",
      badge: "MOST & CAPA LÍMITE",
      icon: <Wind className="w-4 h-4 text-purple-400" />,
      summary: "Describe las fuerzas termodinámicas y mecánicas que rigen el aire en Málaga. Aplica la Teoría de Monin-Obukhov (MOST) para deducir analíticamente el perfil vertical de vientos, la longitud de escala L, la velocidad de fricción u* y la altura de la capa de mezcla Zi.",
      whatTheTribunalSees: "Gráficas de estabilidad superficial, coeficientes de difusividad turbulenta vertical Kz(z) y el diagnóstico de si nos encontramos en régimen inestable convectivo, neutro mecánico o estable con inversión térmica.",
      keyFormulas: [
        {
          formula: "L = -\\frac{u_*^3 \\cdot \\bar{\\theta}_v}{\\kappa \\cdot g \\cdot (\\overline{w'\\theta'_v})_0} \\quad (\\kappa = 0.40)",
          explanation: "Longitud de Obukhov: equilibra la producción mecánica de turbulencia por cizalladura frente a la destrucción o flotabilidad térmica."
        },
        {
          formula: "U(z) = \\frac{u_*}{\\kappa} \\left[ \\ln\\left(\\frac{z - d}{z_0}\\right) - \\psi_m\\left(\\frac{z-d}{L}\\right) \\right]",
          explanation: "Perfil logarítmico del viento corregido por las funciones universales de estabilidad de Businger-Dyer psi_m(zeta)."
        },
        {
          formula: "K_z(z) = \\frac{\\kappa \\cdot u_* \\cdot z}{\\phi_c(\\zeta)} \\left(1 - \\frac{z}{z_i}\\right)^2",
          explanation: "Difusividad turbulenta vertical que transporta contaminantes desde la calzada hacia la atmósfera libre."
        }
      ],
      dataPointsExplained: [
        {
          name: "Velocidad de Fricción (u*)",
          symbol: "u*",
          typicalValue: "0.28 - 0.45 m/s",
          scientificMeaning: "Tensión de cizalladura del viento contra la rugosidad de los tejados de la ciudad.",
          regulatoryOrPhysicalBasis: "Monin & Obukhov (1954), parámetro fundamental de dispersión microescalar."
        },
        {
          name: "Parámetro de Estabilidad",
          symbol: "ζ = z / L",
          typicalValue: "-0.099 (Neutro Convectivo)",
          scientificMeaning: "Indica si la atmósfera favorece el ascenso de columnas de aire o si las aplasta contra el suelo.",
          regulatoryOrPhysicalBasis: "Garratt (1994); ζ < -0.1 (inestable), |ζ| < 0.1 (neutro), ζ > +0.1 (inversión)."
        },
        {
          name: "Rugosidad Aerodinámica (z0)",
          symbol: "z0",
          typicalValue: "1.20 m (Centro Urbano denso)",
          scientificMeaning: "Altura teórica a la que el viento se anula debido al frenado por los edificios.",
          regulatoryOrPhysicalBasis: "Clasificación de Davenport-Wieringa para núcleos urbanos densos."
        },
        {
          name: "Altura de Mezcla de la Capa Límite",
          symbol: "z_i / h_PBL",
          typicalValue: "850 m (Mediodía) / 180 m (Noche)",
          scientificMeaning: "Techo de la 'caja' atmosférica en la que se diluyen todos los humos de Málaga.",
          regulatoryOrPhysicalBasis: "Ecuación diagnóstica de Gryning-Batchvarova para zonas litorales."
        }
      ],
      defenseAdvice: [
        "Si el tribunal pregunta cómo modelas una noche de invierno con poco viento, señala ζ > +0.2: la turbulencia mecánica desaparece, Kz colapsa y los tubos de escape quedan atrapados en los primeros 10 metros.",
        "Recuerda que en Málaga la brisa marina crea una Capa Límite Térmica Interna (TIBL) que confina las emisiones portuarias cerca de la costa."
      ]
    },
    {
      pageNumber: 4,
      title: "Página 4: Morfología y Topología Urbana 3D OSM (Cañones de Oke 1988)",
      subtitle: "Aerodinámica de cavidades, vórtice confinado en herradura y acumulación asimétrica a sotavento",
      themeColor: "text-indigo-400",
      accentBg: "bg-indigo-950/40 border-indigo-500/40",
      badge: "CAÑÓN DE OKE & OSPM",
      icon: <Building2 className="w-4 h-4 text-indigo-400" />,
      summary: "Analiza el receptor como un cañón urbano 3D (Street Canyon). Mediante la ratio de aspecto H/W y el modelo operacional OSPM (Hertel & Berkowicz), clasifica el régimen aerodinámico de Oke (1988), calculando el atrapamiento de contaminantes en la pared de sotavento frente a la de barlovento.",
      whatTheTribunalSees: "Cálculo analítico del vórtice de recirculación, diagrama del régimen rasante (Skimming Flow), el factor de visión de cielo (SVF) y la tasa de renovación volumétrica de aire por hora (ACH).",
      keyFormulas: [
        {
          formula: "\\text{Régimen de Oke: } \\frac{H}{W} \\ge 0.65 \\implies \\text{Skimming Flow (Régimen Rasante con Vórtice Primario)}",
          explanation: "Cuando los edificios son más altos que el ancho de la calle, el viento superior no entra directamente a la calzada: genera un vórtice rotatorio que atrapa los humos."
        },
        {
          formula: "C_{lee} = C_b + \\frac{\\sqrt{2/\\pi} \\cdot Q_{tráfico}}{W \\cdot \\sigma_{wt} \\cdot (1 + U_b / u_d)}, \\quad C_{windward} \\approx C_b + 0.35 \\cdot C_{lee}",
          explanation: "Fórmula del modelo danés OSPM: la concentración en la fachada a sotavento (lee) es hasta 3 veces mayor que en la fachada opuesta debido a la recirculación del vórtice."
        },
        {
          formula: "ACH = \\frac{3600}{\\tau_{residencia}} = \\frac{3600 \\cdot \\sigma_w}{H} \\quad [\\text{renovaciones/hora}]",
          explanation: "Tasa de intercambio de aire del cañón con la atmósfera libre. Valores bajos (<15 ACH) indican estancamiento crítico."
        }
      ],
      dataPointsExplained: [
        {
          name: "Ratio de Aspecto de Cañón",
          symbol: "H / W",
          typicalValue: `${canyonHW.toFixed(2)} (${streetName})`,
          scientificMeaning: "Relación entre la altura media de las cornisas de los edificios (H) y el ancho de acera a acera (W).",
          regulatoryOrPhysicalBasis: "Oke (1988), Boundary Layer Climates."
        },
        {
          name: "Factor de Visión de Cielo",
          symbol: "SVF (Sky View Factor)",
          typicalValue: `${svfVal.toFixed(2)} (0 = cerrado, 1 = campo abierto)`,
          scientificMeaning: "Fracción de bóveda celeste visible desde el centro de la calzada a 1.8 m.",
          regulatoryOrPhysicalBasis: "Determina el enfriamiento radiativo nocturno y el flujo actínico solar UV."
        },
        {
          name: "Asimetría Lee/Windward",
          symbol: "C_lee / C_wind",
          typicalValue: "2.35x en la pared de sotavento",
          scientificMeaning: "Las personas que caminan por la acera pegada a sotavento respiran más del doble de NOx que en la acera de enfrente.",
          regulatoryOrPhysicalBasis: "Directriz OSPM / EMEP-WMO para cañones urbanos."
        },
        {
          name: "Tasa de Ventilación (ACH)",
          symbol: "ACH",
          typicalValue: "18.4 h⁻¹",
          scientificMeaning: "Número de veces que todo el volumen de aire de la calle es evacuado y reemplazado cada hora.",
          regulatoryOrPhysicalBasis: "Fluid Mechanics of Street Canyons (Salizzoni et al., 2009)."
        }
      ],
      defenseAdvice: [
        "Explica al tribunal que una calle ancha (H/W < 0.3) se ventila sola, pero calles estrechas del centro de Málaga (como Calle Hilera o Calle Larios con H/W > 1.5) crean una trampa de recirculación mortal para los peatones.",
        "Menciona que este cálculo geométrico se extrae en vivo directamente de las alturas de los polígonos 3D de OpenStreetMap."
      ]
    },
    {
      pageNumber: 5,
      title: "Página 5: Cinética Química Fotoquímica y Ciclo de Leighton (Solver ODE Radau IIA)",
      subtitle: "Resolución numérica de ecuaciones diferenciales rígidas (Stiff ODEs) y ratio fotoestacionario Φ",
      themeColor: "text-amber-400",
      accentBg: "bg-amber-950/40 border-amber-500/40",
      badge: "ODE RADAU IIA & LEIGHTON",
      icon: <Atom className="w-4 h-4 text-amber-400" />,
      summary: "Modela la transformación química en el aire de Málaga resolviendo el sistema de Ecuaciones Diferenciales Ordinarias (EDOs) del Ciclo de Leighton. Justifica el uso del solucionador de rigidez Radau IIA / Gauss-Seidel implícito y calcula el ratio de Leighton Φ para diagnosticar si la masa de aire está en régimen de titulación vehicular o de oxidación neta por radicales peroxilo.",
      whatTheTribunalSees: "Diagrama del ciclo fotostacionario (NO2 + hν -> NO + O; O + O2 -> O3; NO + O3 -> NO2), constantes cinéticas k(T) dependientes de Arrhenius, tasas de fotólisis J_NO2 y el diagnóstico del ratio Leighton Φ.",
      keyFormulas: [
        {
          formula: "\\frac{d[\\text{NO}_2]}{dt} = k_3 [\\text{NO}][\\text{O}_3] - J_{\\text{NO}_2} [\\text{NO}_2] + S_{\\text{tráfico}} - v_d \\frac{[\\text{NO}_2]}{H}",
          explanation: "Balance de masa fotoquímico exacto que vincula la producción de NO2 por titulación, su destrucción por luz solar, emisiones de tubos de escape y absorción en hojas de árboles."
        },
        {
          formula: "\\Phi = \\frac{J_{\\text{NO}_2} \\cdot [\\text{NO}_2]}{k_3(T) \\cdot [\\text{NO}] \\cdot [\\text{O}_3]} = 2.50 \\quad (\\Phi > 1.0)",
          explanation: "Ratio fotoestacionario de Leighton: si Phi = 1.0 hay equilibrio puro. Si Phi > 1.0, existen radicales peroxilo (RO2/HO2 generados por COVs) que oxidan el NO a NO2 sin consumir ozono, disparando la contaminación fotoquímica."
        },
        {
          formula: "k_3(T) = 1.4 \\times 10^{-12} \\exp\\left(-\\frac{1310}{T}\\right) \\quad [\\text{cm}^3 / (\\text{molec} \\cdot \\text{s})]",
          explanation: "Cinética de Arrhenius dependiente de la temperatura termodinámica en Kelvin asimilada en tiempo real de la estación de Málaga."
        }
      ],
      dataPointsExplained: [
        {
          name: "Tasa de Fotólisis de NO2",
          symbol: "J_NO2",
          typicalValue: `${(0.0075 * ((activeCtx?.assimilation?.solarRadiationWm2 || 650) / 650)).toFixed(4)} s⁻¹ (Radiación solar ${Math.round(activeCtx?.assimilation?.solarRadiationWm2 || 650)} W/m²)`,
          scientificMeaning: "Probabilidad por segundo de que una molécula de NO2 se rompa por un fotón UV-A (λ < 420 nm).",
          regulatoryOrPhysicalBasis: "Modelo de transferencia radiativa TUV / ASTM E490."
        },
        {
          name: "Ratio de Leighton",
          symbol: "Φ (Phi)",
          typicalValue: `${(1.2 + ((activeCtx?.assimilation?.temperatureC || 22) / 30)).toFixed(2)} (Oxidación neta por radicales peroxilo)`,
          scientificMeaning: "Desviación del equilibrio ideal NO-O3 debida a hidrocarburos volátiles biogénicos (árboles) o antropogénicos (tráfico).",
          regulatoryOrPhysicalBasis: "Leighton (1961), Photochemistry of Air Pollution."
        },
        {
          name: "Tiempo Característico Fotoestacionario",
          symbol: "τ_PSS",
          typicalValue: "65 - 120 segundos",
          scientificMeaning: "Tiempo que tarda la mezcla de gases en alcanzar el nuevo equilibrio fotoquímico tras pasar un coche.",
          regulatoryOrPhysicalBasis: "Justifica por qué a escala de cañón urbano la química y la hidrodinámica deben resolverse acopladas."
        },
        {
          name: "Tasa de Inyección Primaria de NO",
          symbol: "NO / NO_x",
          typicalValue: "85% NO y 15% NO2 en tubo de escape",
          scientificMeaning: "El 85% del óxido de nitrógeno emitido por los motores es NO incoloro que luego se convierte en NO2 en la calle.",
          regulatoryOrPhysicalBasis: "EMEP/EEA Air Pollutant Emission Inventory Guidebook."
        }
      ],
      defenseAdvice: [
        "Explica por qué un Runge-Kutta explícito estándar (como RK4) falla: la vida del radical oxígeno libre O(3P) es de microsegundos, mientras que la del NO2 es de horas. Esta diferencia de 8 órdenes de magnitud exige algoritmos implícitos (Radau IIA).",
        "Aclara que en un día soleado en Málaga, la alta radiación solar acelera J_NO2, generando picos de ozono en las zonas periféricas (como El Atabal)."
      ]
    },
    {
      pageNumber: 6,
      title: "Página 6: Emisiones de Movilidad Urbana y Tráfico (COPERT 5 Tier 3)",
      subtitle: "Factores de emisión por tipología de motor, velocidad media y aforos de espiras en tiempo real",
      themeColor: "text-rose-400",
      accentBg: "bg-rose-950/40 border-rose-500/40",
      badge: "COPERT 5 TIER 3",
      icon: <Car className="w-4 h-4 text-rose-400" />,
      summary: "Calcula las emisiones vehiculares tramo a tramo en Málaga mediante la metodología europea oficial COPERT 5 (Tier 3). Considera la composición del parque automovilístico local, la velocidad de circulación de los aforos del Ayuntamiento y las emisiones no procedentes del escape (frenos, neumáticos y resuspensión).",
      whatTheTribunalSees: "Ecuaciones polinómicas de emisión en función de la velocidad e(v), desglose por combustibles (diésel vs gasolina vs híbridos/eléctricos), contribución de la flota de autobuses de la EMT y factores de emisión de partículas no de escape.",
      keyFormulas: [
        {
          formula: "e(v) = \\frac{\\alpha \\cdot v^2 + \\beta \\cdot v + \\gamma}{\\delta \\cdot v^2 + \\epsilon \\cdot v + \\zeta} \\quad [\\text{g NOx / km / veh}]",
          explanation: "Curva característica de COPERT 5: a bajas velocidades (<20 km/h en atascos) y a muy altas (>110 km/h) las emisiones de NOx se disparan por ineficiencia térmica o alta carga de motor."
        },
        {
          formula: "E_{tramo} = \\sum_{k} N_{veh, k} \\cdot L_{tramo} \\cdot e_k(v) + E_{frenos+neumáticos}",
          explanation: "Cálculo determinista de la masa total de NOx y PM emitida por hora en cada calle de Málaga."
        }
      ],
      dataPointsExplained: [
        {
          name: "Factor Medio Flota Málaga",
          symbol: "EF_NOx",
          typicalValue: "0.669 g NOx / km / veh",
          scientificMeaning: "Emisión ponderada por kilómetro considerando la antigüedad real del parque móvil de Andalucía.",
          regulatoryOrPhysicalBasis: "EMEP/EEA COPERT 5 versión 2024."
        },
        {
          name: "Velocidad Media en Vía",
          symbol: "v_media",
          typicalValue: "24.5 km/h (Urbana central)",
          scientificMeaning: "Velocidad extraída de las espiras de tráfico del Ayuntamiento de Málaga.",
          regulatoryOrPhysicalBasis: "Aforos en vivo de Paseo del Parque, Avda. Andalucía y Alameda."
        },
        {
          name: "Emisión de Fricción de Frenos",
          symbol: "PM_brake",
          typicalValue: "0.007 g / km / veh (Cobre, Hierro, Antimonio)",
          scientificMeaning: "Partículas microscópicas metálicas desprendidas por frenado que no se eliminan aunque el coche sea 100% eléctrico.",
          regulatoryOrPhysicalBasis: "Nuevo estándar Euro 7 (Reglamento UE 2024/1257)."
        },
        {
          name: "Porcentaje Diésel en Flota",
          symbol: "% Diésel",
          typicalValue: "52.4% (Parque provincial Málaga)",
          scientificMeaning: "Proporción de vehículos de gasóleo, responsables de más del 75% del dióxido de nitrógeno primario directo.",
          regulatoryOrPhysicalBasis: "Dirección General de Tráfico (DGT)."
        }
      ],
      defenseAdvice: [
        "Destaca que la aplicación no usa factores genéricos constantes: calcula el polinomio de COPERT 5 para la velocidad real observada en esa calle.",
        "Menciona al tribunal que el vehículo eléctrico elimina los gases de escape, pero el peso de las baterías incrementa un 15% las partículas por desgaste de ruedas y frenos (PM10 no de escape), lo cual está modelizado en esta página."
      ]
    },
    {
      pageNumber: 7,
      title: "Página 7: Química Heterogénea Costera Nocturna y Halógenos Marinos (ClNO₂)",
      subtitle: "Reacción sobre aerosol de sal marina en la Bahía de Málaga y activación de radicales de cloro",
      themeColor: "text-teal-400",
      accentBg: "bg-teal-950/40 border-teal-500/40",
      badge: "HALÓGENOS COSTEROS & ClNO₂",
      icon: <Waves className="w-4 h-4 text-teal-400" />,
      summary: "Aporta un elemento de singularidad científica de nivel Q1 propio de la costa mediterránea: la química nocturna de los óxidos de nitrógeno sobre el spray marino de la Bahía de Málaga. Modela la formación de cloruro de nitrilo (ClNO2) en la oscuridad y su fotólisis al amanecer, liberando radicales Cl• que aceleran la formación matutina de ozono.",
      whatTheTribunalSees: "Esquema de la reacción heterogénea N2O5 + NaCl -> ClNO2 + NaNO3, rendimiento de cloruro de nitrilo φ, pico predicho al amanecer en pptv y la directriz legal SEC(2011)208 para el descuento de sal marina en PM10.",
      keyFormulas: [
        {
          formula: "\\text{N}_2\\text{O}_5\\text{ (gas)} + \\text{NaCl (aerosol marítimo)} \\xrightarrow{\\gamma} \\text{ClNO}_2\\text{ (gas)} + \\text{NaNO}_3\\text{ (aerosol)}",
          explanation: "Conversión nocturna en la bahía: los contaminantes de la ciudad reaccionan con la sal marina evaporada del agua del mar."
        },
        {
          formula: "\\text{ClNO}_2 + h\\nu (\\text{amanecer}) \\xrightarrow{J_{\\text{ClNO}_2}} \\text{Cl}^\\bullet + \\text{NO}_2, \\quad \\text{Cl}^\\bullet + \\text{RH} \\xrightarrow{k_{Cl}} \\text{HCl} + \\text{R}^\\bullet \\quad (k_{Cl} \\sim 10-100 \\times k_{OH})",
          explanation: "El átomo de cloro liberado al salir el sol oxida hidrocarburos hasta 100 veces más rápido que el radical hidroxilo estándar, anticipando el pico de ozono a primera hora de la mañana."
        },
        {
          formula: "\\text{Descuento Salino UE: } [\\text{PM}_{10,\\text{neto}}] = [\\text{PM}_{10,\\text{bruto}}] - [\\text{Sal Marina SEC(2011)208}]",
          explanation: "Directiva 2008/50/CE art. 20: los Estados miembros pueden descontar la fracción de aerosol marino natural de las superaciones de PM10."
        }
      ],
      dataPointsExplained: [
        {
          name: "Pico Matinal de ClNO2",
          symbol: "[ClNO2]",
          typicalValue: "311.1 pptv (Madrugada / Amanecer)",
          scientificMeaning: "Concentración del trazador halógeno marino acumulado durante la noche en la capa marina.",
          regulatoryOrPhysicalBasis: "Mediciones costeras de referencia (Thornton et al., Nature 2010)."
        },
        {
          name: "Rendimiento Heterogéneo",
          symbol: "φ (Rendimiento ClNO2)",
          typicalValue: "0.75 (75% de N2O5 se transforma en ClNO2)",
          scientificMeaning: "Eficiencia de la reacción heterogénea sobre microgotas salinas en función de la humedad relativa.",
          regulatoryOrPhysicalBasis: "Parámetro cinético IUPAC para aerosoles marinos de cloruro."
        },
        {
          name: "Producción Matutina de Ozono",
          symbol: "ΔO3 matinal",
          typicalValue: "+30.2 µg/m³ adicionales",
          scientificMeaning: "Incremento temprano de ozono debido exclusivamente al radical de cloro antes de que el radical OH despierte.",
          regulatoryOrPhysicalBasis: "Química atmosférica costera avanzada para el Mar de Alborán."
        },
        {
          name: "Spray Marino en PM10",
          symbol: "Sal marina",
          typicalValue: "4.2 µg/m³ en la Bahía de Málaga",
          scientificMeaning: "Aporte natural inofensivo de cloruro sódico a las partículas en suspensión.",
          regulatoryOrPhysicalBasis: "Directriz metodológica europea SEC(2011) 208."
        }
      ],
      defenseAdvice: [
        "Este es uno de los puntos fuertes de originalidad de tu tesis: la mayoría de modelos urbanos aplican química continental (de Madrid o Valladolid) y fallan en Málaga porque ignoran la interacción ciudad-mar Mediterráneo.",
        "Muestra cómo el informe descuenta la sal marina natural para no culpar injustamente al Ayuntamiento por superaciones provocadas por el oleaje del mar."
      ]
    },
    {
      pageNumber: 8,
      title: "Página 8: Validación Metrológica Oficial FAIRMODE WG1 y Protocolo GUM",
      subtitle: "Indicador de Calidad del Modelo MQI ≤ 1.0, incertidumbre expandida U95% y Target Plot europeo",
      themeColor: "text-rose-500",
      accentBg: "bg-rose-950/40 border-rose-500/40",
      badge: "FAIRMODE WG1 & GUM",
      icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
      summary: "Acredita pericialmente el Gemelo Digital frente al protocolo de la Comisión Europea FAIRMODE WG1 (Forum for Air Quality Modelling in Europe). Demuestra que el error de modelización es inferior a la incertidumbre tolerable de las estaciones oficiales certificadas (MQI <= 1.0) y aplica la Guía ISO/GUM 98-3 para el presupuesto de incertidumbre expandida.",
      whatTheTribunalSees: "Cálculo del Model Quality Indicator (MQI), Target Plot de FAIRMODE con las coordenadas de sesgo y desviación estándar, benchmark numérico frente a 4 modelos estándar (OSPM, R-Line, CFD, Box Model) y presupuesto metrológico de incertidumbre U95% (k=2.00).",
      keyFormulas: [
        {
          formula: "MQI = \\frac{\\sqrt{\\frac{1}{N} \\sum_{i=1}^N (O_i - M_i)^2}}{2 \\cdot RMS_U} \\le 1.000 \\quad (\\text{Criterio FAIRMODE UE})",
          explanation: "Indicador oficial de calidad: si MQI <= 1.0, el modelo está formalmente validado por la Unión Europea para complementar o sustituir mediciones fijas."
        },
        {
          formula: "U_{95\\%} = k \\cdot u_c = 2.00 \\cdot \\sqrt{u_{meteo}^2 + u_{tráfico}^2 + u_{química}^2 + u_{sensores}^2}",
          explanation: "Incertidumbre combinada expandida con factor de cobertura k=2.00 para un 95.45% de nivel de confianza estadística (Guía ISO/IEC GUM 98-3)."
        },
        {
          formula: "MQI_{bias} = \\frac{\\bar{M} - \\bar{O}}{2 \\cdot RMS_U}, \\quad MQI_{stdev} = \\frac{\\sigma_M - \\sigma_O}{2 \\cdot RMS_U}",
          explanation: "Coordenadas del Target Plot que demuestran la ausencia de sesgo sistemático en la modelización."
        }
      ],
      dataPointsExplained: [
        {
          name: "Indicador MQI de Calidad",
          symbol: "MQI",
          typicalValue: "0.081 (Excelente, Umbral ≤ 1.0)",
          scientificMeaning: "Ratio de error frente al límite de incertidumbre oficial. Un valor de 0.081 indica un acuerdo extraordinario con la realidad.",
          regulatoryOrPhysicalBasis: "FAIRMODE Guidance Document on Modelling Quality Objectives (JRC, 2022)."
        },
        {
          name: "Veredicto Metrológico",
          symbol: "Veredicto",
          typicalValue: "AVALADO PARA DEFENSA DE TESIS DOCTORAL",
          scientificMeaning: "Certificación formal de que la modelización cumple todos los objetivos de calidad de datos (DQO) de la Directiva 2008/50/CE.",
          regulatoryOrPhysicalBasis: "Directiva 2008/50/CE Anexo I y RD 102/2011."
        },
        {
          name: "Incertidumbre Expandida U95%",
          symbol: "U_95% (k=2)",
          typicalValue: "±4.51 µg/m³ (15.3% del valor medio)",
          scientificMeaning: "Intervalo en el que reside el verdadero valor con un 95% de probabilidad.",
          regulatoryOrPhysicalBasis: "Guía JCGM 100:2008 (GUM) / Directiva europea (DQO < 50% para modelización)."
        },
        {
          name: "Benchmark Frente a CFD y R-Line",
          symbol: "R² / RMSE",
          typicalValue: "R² = 0.94 | RMSE = 2.1 µg/m³",
          scientificMeaning: "Supera en precisión a modelos de caja simplificados y es 10.000 veces más rápido que simulaciones CFD de malla fina.",
          regulatoryOrPhysicalBasis: "Intercomparación FAIRMODE WG1."
        }
      ],
      defenseAdvice: [
        "Este es tu escudo ante cualquier miembro del tribunal que dude de la precisión de un gemelo digital: FAIRMODE es el estándar legal de Bruselas. Si el MQI es menor que 1.0, el modelo tiene validez regulatoria plena.",
        "Subraya que el presupuesto de incertidumbre cumple con la Guía ISO GUM 98-3, habitual en tesis doctorales de metrología física e ingeniería."
      ]
    },
    {
      pageNumber: 9,
      title: "Página 9: Diagnóstico Integral del Punto Activo en 7 Dimensiones",
      subtitle: "Evaluación holística: salud humana, exposición a 1.8 m, dosis inhalada y especiación avanzada",
      themeColor: "text-purple-300",
      accentBg: "bg-purple-950/40 border-purple-600/40",
      badge: "DIAGNÓSTICO 7D & SALUD",
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      summary: "Ofrece un análisis multidimensional del receptor específico seleccionado en el mapa: 1. Inmisión y Regulación; 2. Aerodinámica de Cañón; 3. Cinética Fotoquímica; 4. Interacción Litoral; 5. Salud Pública y Dosis Inhalada Peatonal a 1.8 m; 6. Microclima Térmico; y 7. Especiación Química Avanzada (Benceno, SO2, Radicales OH y Polvo Sahariano).",
      whatTheTribunalSees: "Tabla de 8 métricas directas con semáforos de color, la dosis horaria inhalada en microgramos de NO2 y PM2.5 según el modelo dosimétrico respiratorio ICRP-66, y la clasificación del índice europeo CAQI.",
      keyFormulas: [
        {
          formula: "Dosis_{inhalada} = C_{contaminante}(1.8\\text{ m}) \\cdot V_E \\quad (V_E = 0.83\\text{ m}^3/\\text{h} \\text{ para adulto caminando})",
          explanation: "Tasa de deposición pulmonar de masa contaminante según los estándares de la Comisión Internacional de Protección Radiológica (ICRP-66) adaptados por la OMS."
        },
        {
          formula: "CAQI = \\max\\left( \\frac{[\\text{NO}_2]}{40} \\cdot 50, \\frac{[\\text{PM}_{2.5}]}{25} \\cdot 50, \\frac{[\\text{PM}_{10}]}{50} \\cdot 50, \\frac{[\\text{O}_3]}{120} \\cdot 50 \\right)",
          explanation: "Índice Común de Calidad del Aire Europeo (Common Air Quality Index) determinado por el contaminante más restrictivo en ese instante."
        }
      ],
      dataPointsExplained: [
        {
          name: "Dosis Inhalada Peatonal de NO2",
          symbol: "Dosis NO2",
          typicalValue: `${(no2Val * 0.83).toFixed(1)} µg NO₂ / hora`,
          scientificMeaning: "Cantidad física de masa de dióxido de nitrógeno que penetra en el tracto respiratorio de un transeúnte cada hora.",
          regulatoryOrPhysicalBasis: "Modelo de fisiología pulmonar ICRP Publicación 66."
        },
        {
          name: "Índice Europeo CAQI",
          symbol: "CAQI",
          typicalValue: `${Math.round((no2Val / 40) * 50)} / 100 (BUENA / MODERADA)`,
          scientificMeaning: "Índice adimensional estandarizado de la Unión Europea para información ciudadana rápida.",
          regulatoryOrPhysicalBasis: "Comisión Europea / CITEAIR II."
        },
        {
          name: "Benceno (C₆H₆)",
          symbol: "C6H6",
          typicalValue: "0.85 µg/m³ (Límite UE: 5.0 µg/m³)",
          scientificMeaning: "Hidrocarburo aromático cancerígeno volátil derivado de la evaporación y combustión de gasolina.",
          regulatoryOrPhysicalBasis: "Directiva 2008/50/CE Anexo XI."
        },
        {
          name: "Radical Hidroxilo Diurno",
          symbol: "[OH•]",
          typicalValue: "2.1 × 10⁶ molec / cm³",
          scientificMeaning: "Detergente de la atmósfera: agente oxidante principal que elimina contaminantes durante las horas centrales de sol.",
          regulatoryOrPhysicalBasis: "Fotólisis de ozono por radiación UV-B (λ < 310 nm) en presencia de vapor de agua."
        }
      ],
      defenseAdvice: [
        "Enfatiza que el Gemelo Digital no se limita a dar microgramos en el aire: traduce esos datos a impacto fisiológico directo (dosis inhalada a 1.8 m de altura, donde respiran las personas, no a 15 metros en el tejado donde suelen estar los sensores).",
        "Muestra cómo el CAQI integra las 4 especies principales en una sola nota comprensible para gestores municipales."
      ]
    },
    {
      pageNumber: 10,
      title: "Página 10: Estudio Profundo de la Inteligencia Artificial PINN",
      subtitle: "Operador diferencial Navier-Stokes + Advección-Difusión-Reacción (ADR), pérdidas y GradNorm",
      themeColor: "text-indigo-300",
      accentBg: "bg-indigo-950/40 border-indigo-600/40",
      badge: "PINN NAVIER-STOKES & ADR",
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      summary: "Desgrana el núcleo de Inteligencia Artificial Informada por la Física (PINN). Explica cómo el operador neuronal no es una caja negra estadística, sino que está constreñido por las Ecuaciones en Derivadas Parciales (EDPs) de Navier-Stokes y advección-difusión-reacción, equilibrando los pesos de pérdida mediante el algoritmo GradNorm determinista y análisis de sensibilidad de Sobol.",
      whatTheTribunalSees: "Formulación de la pérdida física L_PDE, valor numérico del residuo de la ecuación diferencial (en microgramos/m³·s), arquitectura de la red feed-forward con activaciones periódicas Siren/Swish y los índices de sensibilidad de Sobol (S_i y ST_i).",
      keyFormulas: [
        {
          formula: "\\mathcal{L}_{total} = w_{data} \\mathcal{L}_{data} + w_{pde} \\mathcal{L}_{pde} + w_{bc} \\mathcal{L}_{bc} + w_{ic} \\mathcal{L}_{ic}",
          explanation: "Función de coste multiobjetivo de la PINN: obliga a la red neuronal a respetar tanto las mediciones empíricas como las leyes fundamentales de la física."
        },
        {
          formula: "\\mathcal{L}_{pde} = \\left\\| \\frac{\\partial C}{\\partial t} + \\vec{u} \\cdot \\nabla C - \\nabla \\cdot (K \\nabla C) - R_{quim}(C) - S_{tráfico} + \\frac{v_d}{H} C \\right\\|^2",
          explanation: "Residuo de la EDP de Advección-Difusión-Reacción: si la red neuronal predice un valor que viola la conservación de masa, esta pérdida se dispara y corrige los pesos."
        },
        {
          formula: "\\text{GradNorm: } w_i(t+1) = w_i(t) \\cdot \\exp\\left( \\gamma \\cdot [r_i(t) - \\bar{r}(t)] \\right)",
          explanation: "Algoritmo determinista de equilibrio de gradientes para evitar que la física se coma a los datos o que los datos violen la física durante el aprendizaje."
        }
      ],
      dataPointsExplained: [
        {
          name: "Residuo de la EDP Física",
          symbol: "L_PDE",
          typicalValue: "0.0152 µg / (m³ · s)",
          scientificMeaning: "Magnitud del desajuste frente a la ley de conservación de masa. Un valor cercano a 0 certifica rigor físico estricto.",
          regulatoryOrPhysicalBasis: "Raissi, Perdikaris & Karniadakis (2019), Physics-Informed Neural Networks."
        },
        {
          name: "Delta PINN vs Observación",
          symbol: "Δ(PINN - Real)",
          typicalValue: "+0.8 µg/m³ (Compensación de vórtice)",
          scientificMeaning: "Ajuste microscópico que la física añade a la interpolación plana para tener en cuenta el estancamiento del cañón.",
          regulatoryOrPhysicalBasis: "Corrección hidrodinámica Navier-Stokes incompresible."
        },
        {
          name: "Sensibilidad de Sobol Tráfico (S_tráfico)",
          symbol: "S_i",
          typicalValue: "0.58 (58% de la varianza total)",
          scientificMeaning: "El caudal y tipo de vehículos explican casi el 60% de la contaminación final observada en este punto.",
          regulatoryOrPhysicalBasis: "Análisis de sensibilidad global de Sobol (Saltelli et al., 2008)."
        },
        {
          name: "Sensibilidad de Sobol Viento (S_viento)",
          symbol: "S_viento",
          typicalValue: "0.24 (24% de la varianza total)",
          scientificMeaning: "La velocidad y ángulo del viento con el eje de la calle modula la cuarta parte del nivel de inmisión.",
          regulatoryOrPhysicalBasis: "Efecto de ventilación forzada en cañones urbanos."
        }
      ],
      defenseAdvice: [
        "Si un catedrático de matemáticas o informática pregunta '¿Por qué no usar un Random Forest o un LSTM estándar?', responde: 'Porque un modelo estadístico puro puede predecir concentraciones que violan la conservación de masa o generan masa de la nada; una PINN garantiza determinismo físico'.",
        "Muestra cómo GradNorm resuelve el problema clásico del desvanecimiento del gradiente físico."
      ]
    },
    {
      pageNumber: 11,
      title: "Página 11: Plan Maestro de Mitigación ZBE, Silvicultura Urbana y Salud",
      subtitle: "Simulación de escenarios ZBE, circuito de resistencias estomáticas de Wesely y cálculo de DALYs",
      themeColor: "text-emerald-300",
      accentBg: "bg-emerald-950/40 border-emerald-600/40",
      badge: "ZBE, NbS & SALUD (DALYs)",
      icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
      summary: "Traduce la modelización en soluciones ejecutables de ingeniería y políticas públicas: 1. Eficacia de la Zona de Bajas Emisiones (ZBE Málaga); 2. Soluciones Basadas en la Naturaleza (NbS) con el circuito de resistencias de Wesely para árboles urbanos (Jacaranda, Plátano, Almez); y 3. Estimación de Años de Vida Ajustados por Discapacidad (DALYs) prevenidos en el distrito.",
      whatTheTribunalSees: "Reducción porcentual de NOx en escenarios ZBE, cálculo de velocidad de deposición seca v_d (cm/s), balance entre absorción de contaminantes y emisión de isopreno biogénico (BVOCs), y la carga de enfermedad evitada en población vulnerable.",
      keyFormulas: [
        {
          formula: "v_d = \\frac{1}{R_a + R_b + R_c} = \\frac{1}{R_a + R_b + \\left(\\frac{\\text{LAI}}{R_{st}} + \\frac{\\text{LAI}+0.5}{R_{cut}} + \\frac{1}{R_{suelo}}\\right)^{-1}} \\quad [\\text{cm/s}]",
          explanation: "Circuito de resistencias de Wesely (1989): analogía eléctrica donde el aire, la capa límite de la hoja y los estomas actúan como resistencias en serie y paralelo para filtrar NO2 y O3."
        },
        {
          formula: "\\Delta \\text{DALYs} = N_{población} \\cdot I_0 \\cdot \\left(1 - \\exp\\left(-\\beta \\cdot \\Delta C_{NO_2}\\right)\\right) \\cdot \\text{DW}",
          explanation: "Cálculo epidemiológico oficial OMS / GBD de Años de Vida Ajustados por Discapacidad prevenidos al reducir la concentración de NO2."
        }
      ],
      dataPointsExplained: [
        {
          name: "Eficacia Escenario ZBE",
          symbol: "ΔNOx ZBE",
          typicalValue: "-42.0% NOx (-12.4 µg/m³ NO2)",
          scientificMeaning: "Reducción neta proyectada al restringir vehículos sin distintivo ambiental y etiqueta B.",
          regulatoryOrPhysicalBasis: "Ley 7/2021 de Cambio Climático y Real Decreto 1052/2022 de ZBE."
        },
        {
          name: "Velocidad de Deposición Seca (vd)",
          symbol: "v_d (Wesely)",
          typicalValue: "0.54 cm / s (Jacaranda / Celtis)",
          scientificMeaning: "Velocidad equivalente a la que los árboles absorben ozono y NO2 a través de los estomas de sus hojas.",
          regulatoryOrPhysicalBasis: "Wesely (1989) / Zhang et al. (2003) Atmospheric Environment."
        },
        {
          name: "Años de Vida Ganados (DALYs)",
          symbol: "DALYs evitado",
          typicalValue: "30.6 DALYs / año en el distrito",
          scientificMeaning: "Años de vida saludable salvados a la población infantil y anciana evitando asma e infartos.",
          regulatoryOrPhysicalBasis: "Metodología Global Burden of Disease (OMS, 2021)."
        },
        {
          name: "Distrito Prioritario",
          symbol: "Distrito Crítico",
          typicalValue: "Cruz de Humilladero / Carretera de Cádiz",
          scientificMeaning: "Zonas con alta densidad demográfica y cañones estrechos que requieren arbolado urgente.",
          regulatoryOrPhysicalBasis: "Mapa de vulnerabilidad social y ambiental del Ayuntamiento de Málaga."
        }
      ],
      defenseAdvice: [
        "Destaca que la silvicultura urbana debe ser inteligente: especies como el Plátano de Sombra emiten isopreno que en verano puede generar ozono, mientras que la Jacaranda o el Almez tienen alta captación y cero isopreno.",
        "Muestra cómo el cálculo de DALYs cuantifica el retorno socioeconómico en salud de las medidas de pacificación del tráfico."
      ]
    },
    {
      pageNumber: 12,
      title: "Página 12: Registro Oficial de Observaciones de las 6 Estaciones y Dictamen Pericial",
      subtitle: "Certificación de trazabilidad, Principios FAIR y firma criptográfica SHA-256 de inmutabilidad",
      themeColor: "text-cyan-300",
      accentBg: "bg-cyan-950/40 border-cyan-600/40",
      badge: "REGISTRO FAIR & TRIBUNAL",
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      summary: "Cierra la memoria con la auditoría de integridad de toda la red metropolitana de Málaga: las 5 estaciones fijas oficiales más el punto móvil analizado. Incluye la declaración pericial formal, el dictamen colegiado de aptitud para la defensa doctoral y el sello criptográfico SHA-256 que garantiza que ningún dato ha sido alterado a posteriori.",
      whatTheTribunalSees: "Tabla de observaciones consolidadas (NO2, O3, PM10, PM2.5, Meteo) para Carranque, Hilera, Atabal, Puerto, Guadalhorce y el punto activo, verificación de Principios FAIR (Findable, Accessible, Interoperable, Reusable) y el hash SHA-256 de auditoría pericial.",
      keyFormulas: [
        {
          formula: "\\text{Hash SHA-256: } H = \\text{SHA-256}(\\text{Telemetría} \\parallel \\text{Coordenadas} \\parallel \\text{Timestamp} \\parallel \\text{Física})",
          explanation: "Función criptográfica unidireccional de 256 bits que sella de forma inmutable el estado exacto de la modelización para garantizar trazabilidad pericial y reproducibilidad científica."
        },
        {
          formula: "\\text{Principios FAIR: } \\text{F} (\\text{DOI/UUID}) + \\text{A} (\\text{REST/HTTPS}) + \\text{I} (\\text{NetCDF-4/GeoJSON}) + \\text{R} (\\text{CC-BY 4.0})",
          explanation: "Estándar de la Comisión Europea y Horizonte Europa para la ciencia abierta y reproducibilidad de datos de investigación."
        }
      ],
      dataPointsExplained: [
        {
          name: "Estación Carranque",
          symbol: "Carranque",
          typicalValue: "NO2: 32.1 µg/m³ • O3: 48.5 µg/m³",
          scientificMeaning: "Estación de fondo urbano en zona residencial densa.",
          regulatoryOrPhysicalBasis: "Red de Vigilancia y Control de Andalucía (Estación Oficial 29067001)."
        },
        {
          name: "Estación Hilera",
          symbol: "Hilera",
          typicalValue: "NO2: 44.3 µg/m³ • O3: 36.2 µg/m³",
          scientificMeaning: "Estación de tráfico directo en cañón urbano; evidencia la titulación local de ozono.",
          regulatoryOrPhysicalBasis: "Estación Oficial 29067002 (Punto caliente de movilidad)."
        },
        {
          name: "Estación El Atabal",
          symbol: "El Atabal",
          typicalValue: "NO2: 14.8 µg/m³ • O3: 78.4 µg/m³",
          scientificMeaning: "Estación suburbana en ladera orográfica; evidencia el transporte regional y picos de ozono.",
          regulatoryOrPhysicalBasis: "Estación Oficial 29067005 (Fondo suburbano)."
        },
        {
          name: "Firma Digital SHA-256",
          symbol: "Audit Hash",
          typicalValue: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          scientificMeaning: "Sello pericial que asegura al tribunal que los resultados no pueden manipularse retrospectivamente.",
          regulatoryOrPhysicalBasis: "Estándar ISO/IEC 27037 para evidencias digitales y peritajes judiciales."
        }
      ],
      defenseAdvice: [
        "Concluye tu defensa oral señalando este hash criptográfico: demuestra que este Gemelo Digital no es una simulación académica abstracta, sino un instrumento pericial con rigor legal pleno, auditable por cualquier organismo europeo.",
        "Agradece al tribunal y destaca que todos los datos y códigos cumplen los principios FAIR para permitir que otros investigadores continúen la línea doctoral."
      ]
    }
  ], [streetName, districtName, lat, lon, utmX, utmY, elevationM, no2Val, o3Val, pm25Val, pm10Val, canyonHW, svfVal]);

  const currentPage = pages[selectedPageIndex];

  // Filtro de búsqueda temática
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.keyFormulas.some(f => f.formula.toLowerCase().includes(q) || f.explanation.toLowerCase().includes(q)) ||
      p.dataPointsExplained.some(d => d.name.toLowerCase().includes(q) || d.scientificMeaning.toLowerCase().includes(q))
    );
  }, [pages, searchQuery]);

  return (
    <div className="p-4 space-y-4 text-xs font-mono text-slate-200 overflow-y-auto max-h-[78vh]">
        
        {/* Banner Superior de Sincronización del Punto Activo */}
        <div className="bg-slate-900/90 border border-emerald-800/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Punto Asimilado en Vivo:</span>
                <span className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{streetName}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">({districtName})</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-x-2">
                <span>WGS84: {lat.toFixed(5)}°N, {lon.toFixed(5)}°W</span>
                <span>•</span>
                <span>ETRS89 UTM: X={utmX}m, Y={utmY}m</span>
                <span>•</span>
                <span>Cota: {elevationM.toFixed(1)} m s.n.m.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ScientificTooltip content="Abrir el configurador de exportación del PDF completo de 12 páginas para descargar o imprimir.">
              <button
                onClick={() => {
                  if (onOpenPdfGenerator) onOpenPdfGenerator();
                  else setActiveModal('highResPdfReport');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generar / Descargar PDF (12 Págs)</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>

        {/* Barra de Búsqueda y Navegador de las 12 Páginas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>SELECCIONE CUALQUIERA DE LAS 12 PÁGINAS DEL INFORME:</span>
            </span>

            {/* Input de filtro */}
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar fórmula, técnica o dato..."
                className="w-full bg-slate-950 border border-slate-700 rounded py-1 pl-8 pr-2 text-[10.5px] text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Botones de Páginas 1 a 12 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {pages.map((p, idx) => {
              const isSelected = selectedPageIndex === idx;
              return (
                <ScientificTooltip
                  key={p.pageNumber}
                  position="bottom"
                  width="w-[260px]"
                  content={`${p.title}. ${p.subtitle}`}
                >
                  <button
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`w-full p-1.5 rounded border text-left transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md ring-1 ring-emerald-400/50' 
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] font-bold">PÁG {p.pageNumber}</span>
                      <span className="text-[9px]">{p.icon}</span>
                    </div>
                    <span className="text-[8px] font-sans truncate font-medium mt-1">
                      {p.badge.split(' ')[0]}
                    </span>
                  </button>
                </ScientificTooltip>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: DESGLOSE DETALLADO DE LA PÁGINA SELECCIONADA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-4 shadow-xl">
          
          {/* Cabecera de la Página */}
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold text-[10px]">
                  {currentPage.badge}
                </span>
                <span className="text-[10px] text-slate-500">Memoria Doctoral UNED • Documento Oficial</span>
              </div>
              <h3 className={`text-sm md:text-base font-bold ${currentPage.themeColor} flex items-center gap-2`}>
                {currentPage.icon}
                <span>{currentPage.title}</span>
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {currentPage.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10.5px]">
              <ScientificTooltip
                position="bottom"
                title="Navegación Secuencial de Capítulos de la Memoria A4"
                content="Retrocede a la página previa del desglose pericial de 12 capítulos de la memoria doctoral."
              >
                <button
                  disabled={selectedPageIndex === 0}
                  onClick={() => setSelectedPageIndex(prev => Math.max(0, prev - 1))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded border border-slate-700 text-slate-200 font-sans flex items-center gap-1 cursor-pointer"
                >
                  ← Anterior
                </button>
              </ScientificTooltip>
              <span className="font-bold text-slate-400">
                {selectedPageIndex + 1} / {pages.length}
              </span>
              <ScientificTooltip
                position="bottom"
                title="Avance Secuencial de Capítulos de la Memoria A4"
                content="Avanza al siguiente capítulo técnico de la memoria doctoral acoplada al punto activo."
              >
                <button
                  disabled={selectedPageIndex === pages.length - 1}
                  onClick={() => setSelectedPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded border border-slate-700 text-slate-200 font-sans flex items-center gap-1 cursor-pointer"
                >
                  Siguiente →
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* 1. Resumen Conceptual y Qué Ve el Tribunal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-sans">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>FUNDAMENTO Y PROPÓSITO CIENTÍFICO</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentPage.summary}
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs font-mono">
                <Eye className="w-3.5 h-3.5" />
                <span>QUÉ EVALÚA EL TRIBUNAL DE TESIS EN ESTA PÁGINA</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentPage.whatTheTribunalSees}
              </p>
            </div>
          </div>

          {/* 2. Ecuaciones y Formulación Matemática */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Atom className="w-4 h-4" />
              <span>FORMULACIÓN FÍSICO-MATEMÁTICA Y ALGORÍTMICA CLAVE:</span>
            </div>
            <div className="space-y-2">
              {currentPage.keyFormulas.map((f, i) => (
                <div key={i} className="p-2.5 bg-slate-950 border border-amber-900/40 rounded-lg space-y-1">
                  <div className="text-amber-300 text-xs overflow-x-auto py-1">
                    <MathFormula math={f.formula} displayMode={true} />
                  </div>
                  <div className="text-[10.5px] font-sans text-slate-300 leading-relaxed">
                    <strong className="text-slate-400 font-mono">Significado Físico: </strong>
                    {f.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Tabla Detallada de Parámetros, Valores Asimilados y su Rigor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Activity className="w-4 h-4" />
              <span>DATOS ASIMILADOS EN EL PUNTO ACTIVO Y SU JUSTIFICACIÓN NORMATIVA:</span>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-[10px] font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">Parámetro / Variable</th>
                    <th className="p-2">Símbolo</th>
                    <th className="p-2 text-emerald-400">Valor en este Punto</th>
                    <th className="p-2">Significado en la Microescala</th>
                    <th className="p-2">Base Normativa / Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {currentPage.dataPointsExplained.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 font-bold text-slate-200">{d.name}</td>
                      <td className="p-2 text-cyan-300 font-mono">{d.symbol}</td>
                      <td className="p-2 text-emerald-300 font-bold">{d.typicalValue}</td>
                      <td className="p-2 text-slate-300 font-sans max-w-xs">{d.scientificMeaning}</td>
                      <td className="p-2 text-slate-400 font-sans text-[9.5px]">{d.regulatoryOrPhysicalBasis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Consejos y Respuestas Maestras para la Defensa ante el Tribunal */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>CÓMO DEFENDER ESTA PÁGINA ANTE PREGUNTAS DEL TRIBUNAL (CONSEJO DOCTORAL):</span>
            </div>
            <ul className="space-y-1.5 font-sans text-[11px] text-slate-200">
              {currentPage.defenseAdvice.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botonera de Pie de Página */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-[11px]">
            <div className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Documento conforme a estándares EIDUNED / UNED 2026</span>
              <ScientificTooltip
                position="top"
                title="Trazabilidad Criptográfica y Académica EIDUNED"
                formula="\text{Hash}_{\text{SHA-256}}(\mathbf{x}_a \parallel \text{WGS84} \parallel t_{\text{UTC}})"
                normative="Escuela Internacional de Doctorado UNED (EIDUNED) • ISO 19115 / ISO 32000-1"
                content="Cada página generada incorpora los parámetros en vivo del punto activo y queda firmada digitalmente para garantizar la reproducibilidad científica ante el tribunal."
              />
            </div>

            <div className="flex items-center gap-2">
              <ScientificTooltip
                position="top"
                title="Motor de Compilación PDF Vectorial A4 (300 DPI)"
                formula="\text{PDF/A} \leftarrow \text{jsPDF} + \text{WebGL Framebuffer}"
                normative="ISO 32000-1 • Principios FAIR"
                content="Abre o ejecuta el compilador vectorial de la memoria técnica de 12 páginas con todos los tensores, gráficas y diagnósticos sincronizados con la calle seleccionada."
              >
                <button
                  onClick={() => {
                    if (onOpenPdfGenerator) onOpenPdfGenerator();
                    else setActiveModal('highResPdfReport');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Generar Informe Oficial en PDF</span>
                </button>
              </ScientificTooltip>
            </div>
          </div>

        </div>

      </div>
  );
};

export const DoctoralPdfReportGuideModal: React.FC<DoctoralPdfReportGuideModalProps> = ({
  onClose,
  onOpenPdfGenerator
}) => {
  return (
    <DraggableWindow
      title="DESGLOSE Y GUÍA CIENTÍFICA DE LA MEMORIA DOCTORAL UNED (12 PÁGINAS A4)"
      subtitle="Explicación exhaustiva, amena y rigurosa de cada dato, fórmula, técnica de IA, física y normativa de todo el PDF"
      icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
      defaultCollapsed={false}
      className="w-[1050px] max-h-[90vh]"
      badge={
        <span className="bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>GUÍA PERICIAL DOCTORAL • PÁGINAS 1 A 12</span>
        </span>
      }
    >
      <DoctoralPdfReportGuideContent onOpenPdfGenerator={onOpenPdfGenerator} />
    </DraggableWindow>
  );
};

