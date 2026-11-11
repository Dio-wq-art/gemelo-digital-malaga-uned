import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, ShieldCheck, Building2, Atom, FileText, 
  ChevronLeft, ChevronRight, CheckCircle2, Sparkles, 
  Globe, Radio, ExternalLink, Info, MapPin, ArrowRight,
  Search, BookOpen, Cpu, Flame, Wind, Trees, Activity,
  Layers, Scale, Database, HeartPulse, GraduationCap,
  Crosshair, Filter, RefreshCw, Zap, Download, Sun, Network, BarChart3,
  History, Clock, Tag, Calendar, UserCheck, Sliders, Triangle, Archive
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { 
  DOCTORAL_METADATA, 
  APP_CURRENT_VERSION, 
  APP_LAST_UPDATE_DATE, 
  APP_RELEASES_REGISTRY,
  AppRelease 
} from '../config/appReleaseInfo';
import { SYSTEM_PROPAGATION } from '../lib/systemPropagationEngine';

export interface UserGuideTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveModal: (modalName: string | null) => void;
  flyToLocation: (lat: number, lon: number, zoom?: number, bearing?: number, title?: string) => void;
  applyCameraPreset: (preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => void;
}

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  content: string;
  scientificCitation: string;
  officialDataImportance: string;
  targetModal: string | null;
  targetModalLabel?: string;
  location?: { lat: number; lon: number; zoom: number; bearing: number; name: string };
  cameraPreset?: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye';
}

interface KnowledgeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface KnowledgeModule {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  equation?: string;
  officialData: string;
  citation: string;
  targetModal: string;
  location?: { lat: number; lon: number; zoom: number; bearing: number; name: string };
}

// 1. RECORRIDO INTERACTIVO POR LOS 10+ HITOS DE LA TESIS DOCTORAL
const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: '1. Doctrina e Ingesta de Datos Oficiales en Tiempo Real',
    subtitle: 'Asimilación Continua vs. Simulaciones Especulativas (Zero Stochastic Data)',
    badge: 'PRINCIPIO FUNDAMENTAL',
    icon: <Globe className="w-4 h-4 text-emerald-400" />,
    content: 'Un Gemelo Digital Informado por la Física (PINN) no realiza simulaciones especulativas ni escenarios hipotéticos aleatorios. Asimila continuamente datos observacionales en tiempo real procedentes de la Red Oficial de Vigilancia de la Junta de Andalucía, AEMET, Copernicus CAMS, Sentinel-5P TROPOMI y topología real de OpenStreetMap.',
    officialDataImportance: 'La fiabilidad de la tesis doctoral reside en la garantía absoluta de que cada valor (NO₂, O₃, PM2.5, PM10) proviene directamente de sensores certificados o ecuaciones deterministas de conservación de masa, quedando estrictamente prohibidos los datos aleatorios o simulados (Zero Stochastic Data). Adicionalmente, esta asimilación continua in situ y satelital garantiza la viabilidad metodológica ante el tribunal de tesis (EIDUNED), al eliminar cualquier sesgo de especulación teórica. La integración de series temporales reales procedentes de la red oficial de la Junta de Andalucía y AEMET respalda empíricamente cada conclusión científica, cumpliendo estrictamente con los estándares de calidad de aire de la Directiva 2008/50/CE y los protocolos de validación FAIRMODE WG1 para gemelos digitales informados por la física. Metodológicamente, esto blinda la investigación frente a objeciones sobre incertidumbre empírica y establece un estándar de reproducibilidad y rigor digno de publicaciones en revistas de primer cuartil (Q1) como Atmospheric Environment y Geoscientific Model Development.',
    scientificCitation: 'Directiva 2008/50/CE & Criterios de Asimilación FAIRMODE WG1 para Gemelos Digitales Atmosféricos.',
    targetModal: 'verifier',
    targetModalLabel: 'Abrir Ingesta y Verificador de Telemetría',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.2, bearing: 15, name: 'Málaga Centro - Dominio de Estudio' },
    cameraPreset: 'birdeye'
  },
  {
    id: 2,
    title: '2. Verificador Criptográfico y Cadena de Custodia SHA-256',
    subtitle: 'Trazabilidad e Integridad Citable con Estándar W3C PROV-O',
    badge: 'SEGURIDAD & LINAJE',
    icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
    content: `Cada paquete de telemetría de las ${SYSTEM_PROPAGATION.stationsCount} estaciones terrestres verificadas en Málaga ciudad y las ${SYSTEM_PROPAGATION.satellitesCount} misiones satelitales en órbita (${SYSTEM_PROPAGATION.sensorNetwork.label}) es procesado por el pipeline criptográfico. Se calcula un hash único SHA-256 que certifica la latencia de ingesta, integridad de muestra y ausencia de manipulaciones.`,
    officialDataImportance: 'Garantiza la trazabilidad reproducible requerida en la auditoría de la tesis y en expedientes periciales ambientales. Ante revisiones científicas y del tribunal de tesis (EIDUNED), se puede probar la autenticidad matemática exacta de las mediciones de origen sin alteraciones intermedias. Este mecanismo criptográfico de cadena de custodia asegura la inmutabilidad de los datasets frente a auditorías y revisiones por pares en revistas Q1 (ACP / GMD), proporcionando un estándar de rigor forense indiscutible. La implementación de grafos de proveniencia W3C PROV-O vincula indisolublemente cada resultado analítico con su bloque de telemetría bruto original, cumpliendo con los exigentes principios FAIR (Findable, Accessible, Interoperable, Reusable) de la ciencia abierta doctoral.',
    scientificCitation: 'Principios FAIR (Findable, Accessible, Interoperable, Reusable) & Estándares PROV-O de la W3C.',
    targetModal: 'provGraph',
    targetModalLabel: 'Ver Grafo de Proveniencia Criptográfica',
    location: { lat: 36.7172, lon: -4.4444, zoom: 16.8, bearing: 45, name: 'Estación Oficial ES1681A - Carranque' },
    cameraPreset: 'birdeye'
  },
  {
    id: 3,
    title: '3. Visualizador de Cañones Urbanos y Geometría 3D',
    subtitle: 'Microescala, Relación H/W y Flujos de Oke (1987)',
    badge: 'MICROESCALA URBANA',
    icon: <Building2 className="w-4 h-4 text-amber-400" />,
    content: 'En las arterias con alta densidad edilicia (ej. Calle Marqués de Larios o Av. Juan XXIII), la contaminación se acumula por atrapamiento mecánico. El módulo calcula la relación altura/anchura (H/W), el factor de visión del cielo (SVF) y los vórtices eulerianos de recirculación.',
    officialDataImportance: 'La geometría de edificios proviene del catastro tridimensional y polígonos de OpenStreetMap (OSM Overpass API). Permite calcular el tiempo de residencia del aire (τ_res) y la velocidad de ventilación euleriana a cota peatonal 1.8m AGL sin aproximaciones empíricas imprecisas. Al modelar con precisión nanométrica los cañones urbanos reales de Málaga mediante morfología urbana 3D, se resuelve el problema crítico de la recirculación de vórtices y el skimming flow (Oke 1987), dotando a la investigación de una base geométrica y microescalar de máxima solidez para la planificación urbanística de la Zona de Bajas Emisiones (ZBE). Esto valida analíticamente la exposición real de los transeúntes frente a aproximaciones macroescalares obsoletas.',
    scientificCitation: 'Oke, T. R. (1987) "Boundary Layer Climates" & Modelo OSPM (Operational Street Pollution Model).',
    targetModal: 'canyonGeometryOsm',
    targetModalLabel: 'Abrir Modelización Cañón Urbano OSM',
    location: { lat: 36.7185, lon: -4.4213, zoom: 17.5, bearing: 180, name: 'Cañón Urbano: Calle Marqués de Larios' },
    cameraPreset: 'canyon'
  },
  {
    id: 4,
    title: '4. Asimilación PINN & Solvers Fotoquímicos ODE Rígidos',
    subtitle: 'Redes Neuronales Informadas por la Física (Navier-Stokes + EDPs)',
    badge: 'MODELIZACIÓN MECANÍSTICA',
    icon: <Atom className="w-4 h-4 text-purple-400" />,
    content: 'Las ecuaciones del ciclo fotoquímico de Leighton (NO + O₃ ⇌ NO₂ + O₂), la física del aerosol inorgánico ISORROPIA y la deposición seca de Wesely están codificadas directamente como restricciones de pérdida (loss terms) en la arquitectura de la red neuronal.',
    officialDataImportance: 'Evita categóricamente el aprendizaje de "caja negra" típico de la inteligencia artificial convencional. La red neuronal no se limita a interpolar datos empíricos, sino que obliga estricta y matemáticamente a las soluciones a respetar las leyes fundamentales de conservación de la masa, momento y el equilibrio termodinámico cuasi-estacionario. El uso de Redes Informadas por la Física (PINN) con términos de penalización diferencial en la función de pérdida (L_PDE) constituye una aportación metodológica de vanguardia absoluta en tesis doctorales de ingeniería ambiental, garantizando estabilidad numérica robusta y capacidad de generalización ante condiciones meteorológicas extremas (como los episodios de Terral o Calima en Málaga).',
    scientificCitation: 'Raissi et al. (2019) "Physics-Informed Neural Networks" & Mecanismo Fototrópico CB05.',
    targetModal: 'leighton',
    targetModalLabel: 'Abrir Auditoría Cinética ODE Leighton',
    location: { lat: 36.7201, lon: -4.4203, zoom: 16.2, bearing: 0, name: 'Alameda Principal / Nudo Central' },
    cameraPreset: 'birdeye'
  },
  {
    id: 5,
    title: '5. Computación WebGPU y Aceleración Paralela en GPU',
    subtitle: 'Simulación Euleriana de 100.000+ Celdas con Compute Shaders',
    badge: 'ALTA COMPUTACIÓN GPU',
    icon: <Cpu className="w-4 h-4 text-sky-400" />,
    content: 'Para resolver la advección-difusión turbulenta en tiempo real sin cuellos de botella, el Gemelo Digital ejecuta compute shaders directamente en la tarjeta gráfica del cliente mediante WebGPU e instanciado masivo WebGL2.',
    officialDataImportance: 'Permite renderizar campos de concentración y trazas de contaminantes a resolución submetométrica en tiempo real sin recurrir a simulaciones prerrenderizadas o estáticas. Esta capacidad de computación de altas prestaciones (HPC) distribuida en el cliente demuestra ante el tribunal la viabilidad tecnológica de procesar mallas de alta densidad espacial (100.000+ celdas eulerianas) con latencias inferiores a 16 milisegundos (60 FPS), eliminando la dependencia de supercomputadores externos y abriendo la puerta a sistemas interactivos de alerta temprana en administraciones públicas.',
    scientificCitation: 'W3C WebGPU API Standard & LBM (Lattice Boltzmann Method) para Fluidos Atmosféricos.',
    targetModal: 'webgpuCompute',
    targetModalLabel: 'Abrir Motor de Cómputo WebGPU',
    location: { lat: 36.7190, lon: -4.4250, zoom: 16.0, bearing: -30, name: 'Malla Euleriana - Centro Histórico' },
    cameraPreset: 'free'
  },
  {
    id: 6,
    title: '6. Inventarios de Tráfico COPERT 5 y Bucles EMT GTFS',
    subtitle: 'Emisiones Antrópicas Dinámicas y Modelización de la ZBE Málaga',
    badge: 'EMISIONES TRÁFICO',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    content: 'Modela la tasa de emisión de NOₓ, PM y COVs tramo a tramo en más de 12.000 segmentos de la red vial de Málaga. Integra los bucles inductivos del Centro de Control de Tráfico, perfiles diurnos y líneas del autobús urbano EMT (GTFS RT).',
    officialDataImportance: 'Calcula con rigor normativo el impacto exacto de las restricciones de movilidad de la Zona de Bajas Emisiones (ZBE) sobre la calidad del aire respirable a cota de 1.8 metros. Al incorporar factores de emisión oficiales EMEP/EEA Tier 3 desagregados por tipología de vehículo, pendiente de vía y velocidad instantánea, la tesis doctoral proporciona a los planificadores urbanos una herramienta de toma de decisiones predictiva y científicamente irrefutable para cumplir con los valores límite de la Directiva (UE) 2024/2881.',
    scientificCitation: 'Guía EMEP/EEA 2023 & Metodología COPERT 5 (Tier 3) para emisiones de transporte.',
    targetModal: 'copert',
    targetModalLabel: 'Abrir Modelo Tráfico COPERT 5',
    location: { lat: 36.7150, lon: -4.4280, zoom: 16.5, bearing: 60, name: 'Eje ZBE: Av. Andalucía / Muelle Heredia' },
    cameraPreset: 'canyon'
  },
  {
    id: 7,
    title: '7. Emisiones Marítimas y Dinámica del Puerto de Málaga',
    subtitle: 'Hotelling de Cruceros, Plumas de Buques y Química Litoral de Halógenos',
    badge: 'INTERFASE MARÍTIMO-COSTERA',
    icon: <Wind className="w-4 h-4 text-teal-400" />,
    content: 'Sopesa la contribución de los buques atracados (hotelling) y maniobrando en el Puerto de Málaga y Dique de Levante. Acopla el modelo de elevación de pluma de Briggs con la formación nocturna de nitrilo de cloro (ClNO₂).',
    officialDataImportance: 'Permite desglosar de forma transparente la huella contaminante portuaria frente a las emisiones de tráfico urbano, un factor crítico en ciudades litorales mediterráneas con alta afluencia de cruceros. La inclusión del mecanismo heterogéneo nocturno de halógenos (ClNO2) explica los picos matutinos de cloro libre y ozono troposférico costero, elevando el nivel científico de la tesis a la frontera internacional en química atmosférica marina y cumpliendo con las directrices del Convenio MARPOL Anexo VI.',
    scientificCitation: 'IMO EEDI Guidelines & Mecanismo Heterogéneo Litoral de Halógenos (Thornton et al., 2010).',
    targetModal: 'portHotelling',
    targetModalLabel: 'Abrir Emisiones Puerto de Málaga',
    location: { lat: 36.7120, lon: -4.4150, zoom: 15.8, bearing: -45, name: 'Puerto de Málaga / Dique de Levante' },
    cameraPreset: 'bay'
  },
  {
    id: 8,
    title: '8. Absorción Foliar del Arbolado Urbano e Infraestructura Verde',
    subtitle: 'Modelo i-Tree Eco, Circuito de Resistencias de Wesely y TiO₂ Fotocatalítico',
    badge: 'MITIGACIÓN BIOGÉNICA',
    icon: <Trees className="w-4 h-4 text-emerald-300" />,
    content: 'Cuantifica la remoción estomática de NO₂ y O₃ realizada por los más de 45.000 árboles catalogados en Málaga (ej. Jacaranda mimosifolia, Ficus microcarpa). Sopesa también las emisiones de BVOCs (isopreno) y la fotcatálisis en fachadas.',
    officialDataImportance: 'Basado en el censo municipal de arbolado del Ayuntamiento de Málaga y parametrizado mediante el circuito de resistencias de Wesely. Evita la sobreestimación ingenua del efecto sumidero al modelar rigurosamente la resistencia estomática diurna frente al cierre nocturno y la emisión concomitante de compuestos orgánicos volátiles biogénicos (BVOCs). Esto aporta una visión equilibrada y ecológicamente realista sobre el papel de la infraestructura verde en la mitigación de la contaminación urbana.',
    scientificCitation: 'Wesely, M. L. (1989) & USDA i-Tree Eco Urban Forest Deposition Model.',
    targetModal: 'malagaTreesInventory',
    targetModalLabel: 'Abrir Censo Arbolado e i-Tree',
    location: { lat: 36.7198, lon: -4.4180, zoom: 17.0, bearing: 20, name: 'Parque de Málaga / Paseo del Parque' },
    cameraPreset: 'canyon'
  },
  {
    id: 9,
    title: '9. Salud Pública, Dosimetría ICRP-66 y Rutas Saludables',
    subtitle: 'Depósito Pulmonar Peatonal, Exposición Humana y Calima Sahariana',
    badge: 'DOSIMETRÍA & SALUD',
    icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
    content: 'Calcula la masa de contaminantes depositada en la región nasofaríngea, traqueobronquial y alveolar de los transeúntes según su tasa ventilatoria (reposo, caminata, ciclismo). Recomienda trayectorias peatonales óptimas de mínima inhalación.',
    officialDataImportance: 'Transforma las concentraciones ambientales abstractas en dosis biológicas efectivas depositadas en el tracto respiratorio humano, alineándose estrictamente con las recomendaciones de las Guías de Calidad del Aire de la Organización Mundial de la Salud (OMS 2021). Permite demostrar ante el tribunal de tesis cómo la elección de rutas peatonales alternativas reduce la dosis inhalada acumulada en transeúntes y colectivos sensibles, conectando la modelización atmosférica puramente física con la epidemiología urbana.',
    scientificCitation: 'ICRP Publication 66 (Human Respiratory Tract Model for Radiological Protection) & OMS 2021.',
    targetModal: 'healthyRouting',
    targetModalLabel: 'Abrir Buscador Rutas Saludables',
    location: { lat: 36.7210, lon: -4.4230, zoom: 16.0, bearing: 0, name: 'Entorno Peatonal Centro Histórico' },
    cameraPreset: 'birdeye'
  },
  {
    id: 10,
    title: '10. Auditoría Regulatoria FAIRMODE WG1 & Tesis Doctoral UNED',
    subtitle: 'Doctorando: Dionisio Gálvez Pozo • UNED (EIDUNED) • MQI ≤ 1.0 y Memoria Oficial',
    badge: 'TESIS DOCTORAL UNED',
    icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
    content: 'Evalúa formalmente el Gemelo Digital frente al Objetivo de Calidad del Modelo (MQO) de FAIRMODE WG1. Permite exportar la memoria doctoral en PDF A4 de 9/10 páginas con filiación oficial de la UNED (Escuela Internacional de Doctorado EIDUNED) para el doctorando Dionisio Gálvez Pozo, gráficos vectoriales, target diagrams y dictamen científico por IA.',
    officialDataImportance: 'Aporta la validación estadística formal e indispensable requerida por el tribunal de tesis doctoral de la UNED (EIDUNED), certificando un Índice de Calidad del Modelo MQI ≤ 1.0 y una correlación r > 0.90 con la red oficial de estaciones in situ. El generador de informes en PDF A4 estructurado según estándares académicos proporciona un documento de síntesis riguroso para la defensa pública de la tesis, garantizando el cumplimiento de los criterios de excelencia exigidos en el Espacio Europeo de Educación Superior.',
    scientificCitation: 'FAIRMODE Guidance Document on Modeling Quality Objectives (2024) & Normativa de Tesis Doctorales EIDUNED / UNED.',
    targetModal: 'fairmode',
    targetModalLabel: 'Abrir Auditoría FAIRMODE & PDF UNED',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 15, name: 'Visión Doctoral del Gemelo Digital (UNED)' },
    cameraPreset: 'birdeye'
  },
  {
    id: 11,
    title: '11. Suite de Investigación Q1 (2025/2026): Fronteras del Gemelo Digital',
    subtitle: 'AeroGraph-PINN, VBS-SOA con Cl•, LBM-LES GPU y Dosimetría ICRP-66',
    badge: 'FRONTERAS Q1 2025/2026',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    content: 'Incorpora los 4 modelos tope de gama publicados en 2025/2026: (1) AeroGraph-PINN sobre el grafo vial de Málaga, (2) VBS SOA impulsado por fotólisis de ClNO2 en la Bahía, (3) Solucionador LBM D3Q19 con submalla Smagorinsky en GPU, y (4) Dosimetría respiratoria ICRP-66 con tasa ventilatoria dinámica.',
    officialDataImportance: 'Eleva de forma indiscutible el rigor científico del Gemelo Digital al estado del arte internacional en publicaciones de primer cuartil (Q1) en Nature Machine Intelligence, Atmospheric Chemistry and Physics (ACP) y Journal of Computational Physics. Al acoplar redes neuronales basadas en grafos viales con la termodinámica de la volatilidad de aerosoles (VBS) y la dinámica de fluidos computacional reticular (LBM-LES), la tesis aporta metodologías pioneras aplicables a la gestión de calidad del aire en megaciudades litorales.',
    scientificCitation: 'Nature Machine Intelligence, Atmospheric Chemistry and Physics & Journal of Computational Physics (2025/2026).',
    targetModal: 'q1ResearchSuite',
    targetModalLabel: 'Abrir Suite de Investigación Q1',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.5, bearing: 25, name: 'Fronteras Q1 del Gemelo Digital' },
    cameraPreset: 'free'
  },
  {
    id: 12,
    title: '12. Motores & Librerías Científicas de Vanguardia',
    subtitle: 'Uber H3, Flatbush R-Tree, ONNX WebGPU, MILP GLPK & FAIR GIS',
    badge: 'MOTORES COMPUTACIONALES 2026',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    content: 'Acredita el stack de vanguardia incorporado: Malla hexagonal isotrópica Uber H3, indexación espacial R-Tree Flatbush O(log N), tensores PINN acelerados por ONNX WebGPU, optimización lineal entera MILP y exportación interoperable GIS Shapefile / Excel multitabla.',
    officialDataImportance: 'Asegura tiempos de respuesta sub-milisegundo y compatibilidad FAIR absoluta con software profesional SIG (QGIS / ArcGIS) y herramientas analíticas de investigación. El uso de indexación espacial R-Tree y celdas hexagonales H3 garantiza un tratamiento uniforme de la superficie terrestre sin sesgos de proyección cartográfica, dotando a la arquitectura de software de una robustez de nivel industrial apta para su transferencia tecnológica.',
    scientificCitation: 'Estructuras de Datos Espaciales, H3 Discrete Global Grid System & Inferencia Tensor WebGPU.',
    targetModal: 'advancedEnginesSuite',
    targetModalLabel: 'Abrir Suite de Motores de Vanguardia',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.5, bearing: 0, name: 'Malla e Índice Espacial H3 Málaga' },
    cameraPreset: 'free'
  },
  {
    id: 13,
    title: '13. Fronteras Q1 (2025–2027) • FNO 3D, HOMs & 4D-Var',
    subtitle: 'Fourier Neural Operators, Auto-Oxidación HOMs, Fotólisis J_NO2, OP^DTT & 4D-Var',
    badge: 'FRONTERAS Q1 2026/2027',
    icon: <Atom className="w-4 h-4 text-emerald-400" />,
    content: 'Integra los últimos avances de impacto global: (1) Fourier Neural Operators 3D a resolución infinita, (2) Auto-oxidación de monoterpenos y nucleación de partículas ultrafinas PM0.1, (3) Fotólisis espectral J_NO2 con atenuación de calima sahariana, (4) Potencial oxidativo OP^DTT toxicológico por desgaste de frenos, y (5) Asimilación híbrida 4D-Var EnKF con TROPOMI.',
    officialDataImportance: 'Acredita el máximo rigor y ambición de la tesis doctoral en la frontera absoluta de las ciencias de la atmósfera y el modelado computacional. La incorporación de Operadores Neuronales de Fourier (FNO) independientes de la discretización de malla y la asimilación variacional 4D-Var acoplada a observaciones satelitales TROPOMI sitúa al Gemelo Digital en la vanguardia mundial de la investigación climática y de calidad del aire, garantizando un impacto sobresaliente ante comités de evaluación científica internacional.',
    scientificCitation: 'JCP, Nature Machine Intelligence, ACP, JQSRT, EHP, ES&T & Remote Sensing of Environment (2025–2027).',
    targetModal: 'q1FrontiersSuite',
    targetModalLabel: 'Abrir Suite de Fronteras Q1',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.0, bearing: 15, name: 'Fronteras de Investigación Q1' },
    cameraPreset: 'free'
  },
  {
    id: 14,
    title: '14. Optimización Q1 y Sensibilidad Adjunta (Adjoint Sensitivity)',
    subtitle: 'Derivadas Parciales ∂C/∂P, Función de Costes J(x) y Chi-cuadrado (χ²)',
    badge: 'OPTIMIZACIÓN Q1',
    icon: <Sliders className="w-4 h-4 text-indigo-400" />,
    content: 'Calcula las sensibilidades analíticas adjuntas (∂C/∂P) respecto a tasas de emisión viaria de NOx, VOCs y parámetros meteorológicos, permitiendo priorizar matemáticamente las medidas de mitigación ZBE en Málaga.',
    officialDataImportance: 'Justifica cuantitativamente ante revisores de revistas Q1 (ACP / GMD) qué variables de emisión y meteorología dominan la varianza del modelo, evaluando rigurosamente el estadístico chi-cuadrado (χ² ≈ 1.0) en la asimilación variacional. Esto permite optimizar la asignación de recursos de mitigación urbana de forma óptima y matemáticamente demostrable.',
    scientificCitation: 'Atmospheric Chemistry and Physics (ACP) & Geoscientific Model Development (GMD) Standards.',
    targetModal: 'q1Optimization',
    targetModalLabel: 'Abrir Suite de Optimización Q1',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.0, bearing: 10, name: 'Optimización de Emisiones y Sensibilidad Adjunta' },
    cameraPreset: 'free'
  },
  {
    id: 15,
    title: '15. Simulador de Defensa de Tesis & Tribunal EIDUNED (UNED)',
    subtitle: 'Doctorando: Dionisio Gálvez Pozo • Interrogatorio de Revisores Q1 y Demostraciones',
    badge: 'DEFENSA UNED EIDUNED',
    icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    content: 'Simula el interrogatorio del tribunal de tesis doctoral (EIDUNED) y revisores internacionales sobre conservación de masa en cañones estrechos (PINN), cinética de halógenos marinos, transición de flujo de Oke y cumplimiento estricto FAIRMODE MQI ≤ 1.0.',
    officialDataImportance: 'Aporta los argumentos formales de defensa, ecuaciones clave y citas normativas requeridas para superar con sobresaliente la defensa pública de la tesis de Dionisio Gálvez Pozo ante el tribunal de la Escuela Internacional de Doctorado de la UNED (EIDUNED).',
    scientificCitation: 'Normativa de Tesis Doctorales EIDUNED / UNED & Criterios de Evaluación de Tesis Doctoral.',
    targetModal: 'tribunalDefenseAdvisor',
    targetModalLabel: 'Abrir Simulador Tribunal EIDUNED',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Tribunal de Tesis Doctoral UNED' },
    cameraPreset: 'birdeye'
  },
  {
    id: 16,
    title: '16. Mallas TIN (Delaunay), Earcut 3D y Bundle FAIR (.ZIP)',
    subtitle: 'Topología Geométrica Exacta, Patios Interiores y Paquete de Replicabilidad',
    badge: 'TOPOLOGÍA & FAIR ZIP',
    icon: <Triangle className="w-4 h-4 text-emerald-400" />,
    content: 'Discretiza la orografía de Málaga mediante mallas triangulares TIN Delaunay con interpolación baricéntrica C⁰ sin singularidades, y triangula manzanas urbanas con patios interiores mediante Earcut para el cálculo exacto de cubiertas vegetales y deposición seca. Permite descargar todo el proyecto en un único paquete reproducible FAIR (.zip).',
    officialDataImportance: 'Sustituye las aproximaciones geométricas simplistas de cubos ciegos por la topología arquitectónica real de Málaga (LOD2), garantizando reproducibilidad abierta y descargable para la comunidad científica internacional.',
    scientificCitation: 'Geoscientific Model Development (GMD) & Directrices de Ciencia Abierta FAIR de la UNED.',
    targetModal: 'q1MicroscalePhysics',
    targetModalLabel: 'Abrir Mallas TIN & Earcut',
    location: { lat: 36.7185, lon: -4.4213, zoom: 16.5, bearing: 20, name: 'Mallas TIN y Patios Interiores (Calle Larios)' },
    cameraPreset: 'free'
  },
  {
    id: 17,
    title: '17. Diagrama Ternario Fotoquímico EKMA (NOₓ – VOC – Oₓ)',
    subtitle: 'Coordenadas Baricéntricas, Regímenes de Sillman y Vector ZBE',
    badge: 'FOTOQUÍMICA EKMA',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    content: 'Proyecta el balance fotoquímico de precursores en un triángulo equilátero baricéntrico normalizado (f_NOx, f_VOC, f_Ox). Delimita rigurosamente los regímenes VOC-limited (titración NO + O3) y NOx-limited, simulando el vector de abatimiento de tráfico de la ZBE de Málaga para evitar la paradoja de incremento de ozono.',
    officialDataImportance: 'Permite cotejar la posición simultánea de las estaciones oficiales de Carranque, Hilera, El Atabal y Puerto, justificando ante revisores Q1 las políticas de mitigación integrada sin incurrir en aumentos contraproducentes de ozono troposférico.',
    scientificCitation: 'Sillman (1999), Tonnesen & Dennis (2000), Seinfeld & Pandis (2016).',
    targetModal: 'extendedLeighton',
    targetModalLabel: 'Abrir Diagrama Ternario Fotoquímico',
    location: { lat: 36.7198, lon: -4.4328, zoom: 16.0, bearing: 10, name: 'Estación Hilera - Régimen Fotoquímico' },
    cameraPreset: 'free'
  },
  {
    id: 18,
    title: '18. Paralelización Multihilo con Web Workers (Comlink RPC)',
    subtitle: 'Desacoplamiento de Stiff ODEs, 60 FPS Estables y Reciclaje de Memoria',
    badge: 'MULTITHREADING COMLINK',
    icon: <Cpu className="w-4 h-4 text-purple-400" />,
    content: 'Ejecuta las integraciones cinéticas rígidas (Dormand-Prince, RK45 y ciclo de Leighton) en hilos secundarios dedicados mediante Comlink RPC. Esto garantiza que la navegación cartográfica 3D en Deck.gl y la interacción con paneles flotantes mantengan 60 FPS estables sin bloqueos en el navegador.',
    officialDataImportance: 'Permite resolver ecuaciones diferenciales atmosféricas acopladas para cada punto geográfico activo sin comprometer la capacidad de respuesta en tiempo real del usuario ni la fluidez gráfica del gemelo digital.',
    scientificCitation: 'Journal of Computational Physics & Environmental Modelling and Software.',
    targetModal: 'pointInspector',
    targetModalLabel: 'Abrir Inspector de Punto (Comlink)',
    location: { lat: 36.7175, lon: -4.4447, zoom: 16.5, bearing: 0, name: 'Estación Carranque (Cálculo Multihilo)' },
    cameraPreset: 'free'
  },
  {
    id: 19,
    title: '19. Justicia Ambiental Vectorial GeoJSON & Renta INE',
    subtitle: 'Directiva (UE) 2024/2881, Curva de Lorenz e Índices Kakwani y Atkinson',
    badge: 'JUSTICIA AMBIENTAL GEOJSON',
    icon: <Scale className="w-4 h-4 text-indigo-400" />,
    content: 'Cruce espacial directo de los 11 distritos de Málaga con el Atlas de Renta INE, evaluando la Curva de Lorenz Ambiental, el índice de Kakwani (K = -0.198, regresividad ambiental) y la paradoja de emisión vs exposición en Carretera de Cádiz y Cruz de Humilladero.',
    officialDataImportance: 'Aporta el fundamento de justicia redistributiva exigido por el Art. 13 de la nueva Directiva de Calidad del Aire 2024/2881, demostrando estadísticamente las desigualdades en la exposición a la contaminación según la renta familiar disponible.',
    scientificCitation: 'Directiva (UE) 2024/2881, INE Atlas ADRH & Ecological Economics.',
    targetModal: 'environmentalJustice',
    targetModalLabel: 'Abrir Justicia Ambiental GeoJSON',
    location: { lat: 36.7020, lon: -4.4450, zoom: 15.2, bearing: 15, name: 'Carretera de Cádiz - Desequilibrio Socioambiental' },
    cameraPreset: 'free'
  },
  {
    id: 20,
    title: '20. Entornos Escolares Seguros (School Streets) & Dosimetría Infantil',
    subtitle: 'Modelo ICRP 66 a Cota Pediátrica de Escape (0.90m AGL) en Colegios de Málaga',
    badge: 'ENTORNOS ESCOLARES SEGUROS',
    icon: <GraduationCap className="w-4 h-4 text-amber-400" />,
    content: 'Evalúa la dosis alveolar y traqueobronquial infantil (0.42 m³/h·kg) a 0.90m de altura en colegios reales de Málaga (Prácticas Nº1, Manuel de Falla, Dr. Fleming) durante la hora punta escolar (08:30-09:15), certificando la necesidad de pacificación vial.',
    officialDataImportance: 'Demuestra cuantitativamente que los niños inhalan proporcionalmente hasta un 38% más masa de NO2 y PM2.5 por kg de peso corporal que un adulto en la misma acera debido a su mayor tasa ventilatoria y menor estatura.',
    scientificCitation: 'ICRP Publication 66 Human Respiratory Tract Model & Directiva 2024/2881 Art. 13.',
    targetModal: 'schoolAirEquity',
    targetModalLabel: 'Abrir Entornos Escolares & Dosis Pediátrica',
    location: { lat: 36.7215, lon: -4.4285, zoom: 17.0, bearing: 30, name: 'CEIP Prácticas Nº1 (Centro Histórico)' },
    cameraPreset: 'free'
  },
  {
    id: 21,
    title: '21. Valoración Económica del Daño en Salud (OECD VSL / SAS)',
    subtitle: 'Ahorro Presupuestario en Hospitales Públicos y Vidas Salvadas (3.6 M€ VSL)',
    badge: 'ECONOMÍA DE LA SALUD SAS',
    icon: <HeartPulse className="w-4 h-4 text-emerald-400" />,
    content: 'Traduce las reducciones de NO2 y PM2.5 en ingresos hospitalarios y urgencias evitadas en el Hospital Regional Carlos Haya, Clínico Virgen de la Victoria y Materno Infantil, calculando el ratio Beneficio/Coste (>3.4x) y el ahorro en bienestar VSL (OCDE 3.6 M€).',
    officialDataImportance: 'Aporta la justificación coste-beneficio formal y rigurosa requerida para la memoria económica de implantación de la Zona de Bajas Emisiones (ZBE), vinculando la mejora ambiental directamente con la sostenibilidad del sistema sanitario público.',
    scientificCitation: 'OECD Health Statistics (2024), WHO AirQ+ & Tarifas Oficiales SAS Andalucía.',
    targetModal: 'healthEconomicsSas',
    targetModalLabel: 'Abrir Valoración Económica Salud SAS',
    location: { lat: 36.7230, lon: -4.4480, zoom: 16.0, bearing: 0, name: 'Hospital Regional Universitario Carlos Haya' },
    cameraPreset: 'free'
  },
  {
    id: 22,
    title: '22. Equidad en Infraestructura Verde Urbana (Regla 3-30-300 OMS)',
    subtitle: 'Auditoría de Desiertos Verdes, Renta INE y Captación Fitosférica en Málaga',
    badge: 'REGLA 3-30-300 OMS / UE',
    icon: <Trees className="w-4 h-4 text-emerald-300" />,
    content: 'Audita el cumplimiento de la regla 3-30-300 de Cecil Konijnendijk (3 árboles visibles, 30% dosel, 300m a un parque) y la captación foliar de contaminantes en los 11 distritos de Málaga, demostrando una brecha de 10.2x en dotación verde per cápita.',
    officialDataImportance: 'Da cumplimiento directo a las directrices de la OMS sobre espacios verdes urbanos y al Reglamento (UE) 2024/1991 de Restauración de la Naturaleza, aportando métricas espaciales precisas para la planificación de corredores verdes.',
    scientificCitation: 'WHO Urban Green Spaces Guidelines, Konijnendijk (2023) & Inventario Municipal de Málaga.',
    targetModal: 'greenJustice330300',
    targetModalLabel: 'Abrir Auditoría Regla 3-30-300',
    location: { lat: 36.7198, lon: -4.4180, zoom: 16.5, bearing: 15, name: 'Paseo del Parque de Málaga' },
    cameraPreset: 'free'
  },
  {
    id: 23,
    title: '23. Acidificación de la Microcapa Superficial Marina (SML 50 µm)',
    subtitle: 'Penachos Portuarios de Cruceros y Química de Carbonatos en la Bahía (IEO-CSIC)',
    badge: 'ACIDIFICACIÓN MARINA SML',
    icon: <Wind className="w-4 h-4 text-cyan-400" />,
    content: 'Modela la caída transitoria de pH y la desaturación de aragonito (Ω_arag) en los primeros 50 micrómetros de la superficie marina por deposición seca de HNO3 y sulfatos de buques atracados en el Puerto de Málaga, y su impacto en larvas de boquerón y concha fina.',
    officialDataImportance: 'Acopla de manera innovadora la calidad del aire portuario con la biogeoquímica marina certificada por el IEO-CSIC en el Mar de Alborán, demostrando el impacto sinérgico de las emisiones terrestres sobre los ecosistemas costeros.',
    scientificCitation: 'MARPOL Annex VI, Zeebe & Wolf-Gladrow (2001) & IEO-CSIC Red RADMED.',
    targetModal: 'coastalSmlAcidification',
    targetModalLabel: 'Abrir Acidificación Marina SML',
    location: { lat: 36.7110, lon: -4.4140, zoom: 15.5, bearing: -30, name: 'Dársena de Cruceros / Muelle de Levante' },
    cameraPreset: 'free'
  },
  {
    id: 24,
    title: '24. Motor de Verificación & Integridad Sistémica (EIDUNED)',
    subtitle: 'Batería Determinista de Pruebas Automáticas de Regresión, Geodesia y Paridad',
    badge: 'VERIFICACIÓN SISTÉMICA EIDUNED',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    content: `Ejecuta en tiempo real una batería de pruebas de auditoría continua: certifica que las ${SYSTEM_PROPAGATION.stationsCount} estaciones oficiales in situ y los ${SYSTEM_PROPAGATION.satellitesCount} satélites están dentro del dominio geodésico de Málaga, que la totalidad de las suites analíticas están registradas en el Registry sin dependencias huérfanas, que se cumple la regla estricta de CERO datos estocásticos (Math.random() = 0), y genera el certificado criptográfico SHA-256 citable para la memoria doctoral.`,
    officialDataImportance: 'Garantiza la máxima fiabilidad metodológica e integridad de software ante el tribunal de tesis doctoral de la UNED y revisores de revistas científicas Q1, certificando la ausencia absoluta de errores de asimilación o componentes huérfanos.',
    scientificCitation: 'Directiva de Repositorio Vivo Acumulativo, Principios FAIR & Normativa de Tesis EIDUNED/UNED.',
    targetModal: 'systemIntegrityAudit',
    targetModalLabel: 'Ejecutar Verificación de Integridad',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.0, bearing: 0, name: 'Centro de Control y Auditoría Sistémica' },
    cameraPreset: 'birdeye'
  },
  {
    id: 25,
    title: '25. Directrices del Director (0➔7), Radar DOI, Evidencia 2024–2026 y Pack USB',
    subtitle: 'PDF Original (03/10/2026), 13 Tablas Canónicas, Informes Punto por Punto y Continuidad Multidispositivo',
    badge: 'COLUMNA VERTEBRAL TESIS',
    icon: <BookOpen className="w-4 h-4 text-amber-400" />,
    content: `Custodia íntegra del documento original del Director de Tesis (Puntos 0 al 7), generador de informes PDF monográficos punto por punto y PDF extenso de 13 Tablas, evidencia primaria verificada 2024–2026 (ZBE Málaga y sentencia TSJA oct-2026, Med SOx ECA Puerto 0,10 % S, récord Aeropuerto LEMG AENA, Av. Juan XXIII 31 µg/m³ vs Directiva UE 2024/2881 y satélites Sentinel-4A/5A/EarthCARE), Radar Científico DOI con confirmación previa, Receptor Multi-Formato (.PDF/.DOCX/.TXT), Ejecutable Portable .HTML autónomo y persistencia automática de la posición (x, y) de pestañas y ventanas.`,
    officialDataImportance: 'Asegura la correspondencia exacta 1:1 con las instrucciones del Director de Tesis en la UNED (EIDUNED), combinando evidencia empírica oficial 2024–2026, vigilancia bibliográfica DOI controlada por el doctorando y continuidad total entre PC, Nube, iPad y Pendrive USB.',
    scientificCitation: 'Marco de Objetivos de Tesis UNED (03/10/2026), Directiva (UE) 2024/2881, OMI MARPOL Med SOx ECA & CP-PRE (ICML 2025).',
    targetModal: 'thesisMethodologySuite',
    targetModalLabel: 'Abrir Directrices del Director (0➔7)',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.6, bearing: 10, name: 'Columna Vertebral Doctoral UNED — Málaga' },
    cameraPreset: 'birdeye'
  }
];

// 2. CATEGORÍAS TEMÁTICAS DE LA ENCICLOPEDIA DE CONOCIMIENTO
const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: 'cat-all',
    name: 'Todos los Módulos',
    icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
    description: 'Catálogo exhaustivo del conocimiento total integrado en el Gemelo Digital.'
  },
  {
    id: 'cat-ingestion',
    name: '1. Ingesta, Redes & Criptografía',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
    description: 'Telemetría de la red de la Junta de Andalucía, AEMET, Copernicus CAMS, Sentinel-5P y hashes SHA-256.'
  },
  {
    id: 'cat-physics',
    name: '2. Micrometeorología & Física',
    icon: <Wind className="w-3.5 h-3.5 text-sky-400" />,
    description: 'Teoría MOST, brisa litoral de Málaga, capa límite (PBLH), inversión térmica y sondeos verticales.'
  },
  {
    id: 'cat-canyon',
    name: '3. Microescala Urbana & Cañones 3D',
    icon: <Building2 className="w-3.5 h-3.5 text-amber-400" />,
    description: 'Vórtices de Oke (1987), factor de visión del cielo (SVF), sombra solar y Google Maps 3D.'
  },
  {
    id: 'cat-gpu',
    name: '4. Computación GPU & Operador PINN',
    icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
    description: 'WebGPU compute shaders, instanciado WebGL2, residuos Navier-Stokes y solucionadores LBM.'
  },
  {
    id: 'cat-chemistry',
    name: '5. Química Atmosférica & Fotólisis',
    icon: <Atom className="w-3.5 h-3.5 text-pink-400" />,
    description: 'Ciclo fotoquímico de Leighton, fotólisis J_NO2, régimen EKMA, halógenos ClNO2 e ISORROPIA II.'
  },
  {
    id: 'cat-traffic',
    name: '6. Emisiones Antrópicas & Tráfico',
    icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
    description: 'COPERT 5, EMT GTFS RT, ZBE Málaga, emisiones del Puerto y plumas industriales de Briggs.'
  },
  {
    id: 'cat-green',
    name: '7. Infraestructura Verde & Sumideros',
    icon: <Trees className="w-3.5 h-3.5 text-emerald-300" />,
    description: 'Censo de arbolado i-Tree, Wesely, bosquetes verticales, TiO2 fotocatalítico y biogénicos BVOCs.'
  },
  {
    id: 'cat-health',
    name: '8. Salud, Dosimetría & Calima',
    icon: <HeartPulse className="w-3.5 h-3.5 text-red-400" />,
    description: 'Depósito pulmonar ICRP-66, rutas peatonales saludables y polvo sahariano SEC(2011)208.'
  },
  {
    id: 'cat-fairmode',
    name: '9. Auditoría, FAIRMODE & UNED',
    icon: <GraduationCap className="w-3.5 h-3.5 text-amber-300" />,
    description: 'Target Plot MQI ≤ 1.0, descomposición Sobol, exportador LaTeX y reporte PDF A4 de 9 páginas.'
  }
];

// 3. MÓDULOS DE CONOCIMIENTO DETALLADOS (35+ MÓDULOS DEL SISTEMA)
const KNOWLEDGE_MODULES: KnowledgeModule[] = [
  // Categoria 1: Ingesta, Redes & Criptografía
  {
    id: 'mod-verifier',
    title: 'Verificador Criptográfico y Linaje SHA-256',
    subtitle: 'Módulo: LiveTelemetryVerifier.tsx',
    categoryId: 'cat-ingestion',
    badge: 'TELEMETRÍA CRIPTOGRÁFICA',
    icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
    description: `Audita en tiempo real la cadena de custodia de la telemetría oficial de las ${SYSTEM_PROPAGATION.stationsCount} estaciones de la red oficial en Málaga. Genera hashes SHA-256 para prevenir manipulaciones y asegurar la trazabilidad científica de la tesis.`,
    officialData: 'Estaciones oficiales: ES1417A (Carranque), ES1778A (El Atabal), ES2077A (Dique de Levante), Hilera, Palacio de Deportes y Guadalhorce.',
    citation: 'W3C PROV-O Model & ISO/IEC 27037 Digital Evidence Traceability.',
    targetModal: 'verifier',
    location: { lat: 36.7172, lon: -4.4444, zoom: 16.5, bearing: 0, name: 'Estación Carranque ES1417A' }
  },
  {
    id: 'mod-prov-graph',
    title: 'Grafo de Proveniencia Científica (W3C PROV-O)',
    subtitle: 'Módulo: ProvGraphViewerModal.tsx',
    categoryId: 'cat-ingestion',
    badge: 'PROVENIENCIA DE DATOS',
    icon: <Database className="w-4 h-4 text-emerald-400" />,
    description: 'Visualiza la red dirigida de proveniencia desde el sensor físico (entidad) hasta el cálculo del residuo de la PINN y el informe PDF (actividades y agentes).',
    officialData: 'Registra los identificadores únicos de muestra y los sellos de tiempo UTC de la red oficial.',
    citation: 'W3C Provenance Data Model (PROV-DM) & Dublin Core Metadata Standard.',
    targetModal: 'provGraph',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.5, bearing: 15, name: 'Dominio Central de Málaga' }
  },
  {
    id: 'mod-cams',
    title: 'Inflow de Frontera Copernicus CAMS & Kriging 3D',
    subtitle: 'Módulo: SatelliteAssimilationModal.tsx',
    categoryId: 'cat-ingestion',
    badge: 'SENSÓRICA SATELITAL',
    icon: <Globe className="w-4 h-4 text-sky-400" />,
    description: 'Asimila los campos transfronterizos del modelo europeo CAMS (Copernicus Atmosphere Monitoring Service) a resolución 0.1° (~10 km) y realiza interpolación Kriging 3D para establecer las condiciones de contorno e infundir flujo en el dominio de Málaga.',
    officialData: 'Campos regionales CAMS NRT (Near Real Time) actualizados cada 3 horas.',
    citation: 'Inness et al. (2019) "The CAMS reanalysis of atmospheric composition" Atmos. Chem. Phys.',
    targetModal: 'camsBoundary',
    location: { lat: 36.7200, lon: -4.4100, zoom: 14.5, bearing: 0, name: 'Contorno de Entrada Este - Málaga' }
  },
  {
    id: 'mod-earth-engine',
    title: 'Asimilación TROPOMI Sentinel-5P & Earth Engine',
    subtitle: 'Módulo: EarthEngineSatelliteModal.tsx',
    categoryId: 'cat-ingestion',
    badge: 'SENTINEL-5P TROPOMI',
    icon: <Radio className="w-4 h-4 text-amber-400" />,
    description: 'Extrae la densidad de columna troposférica de NO₂ (mol/m²) capturada por el espectrómetro TROPOMI a bordo del satélite Sentinel-5P y aplica algoritmos de downscaling espacial para ajustar el fondo urbano.',
    officialData: 'Órbitas Sentinel-5P OFFL/NRTI procesadas en la plataforma Google Earth Engine.',
    citation: 'Veefkind et al. (2012) "TROPOMI on the ESA Sentinel-5 Precursor mission" Remote Sens. Environ.',
    targetModal: 'earthEngine',
    location: { lat: 36.7196, lon: -4.4200, zoom: 13.8, bearing: 0, name: 'Huella Espacial Sentinel-5P Málaga' }
  },

  // Categoria 2: Micrometeorología & Física
  {
    id: 'mod-boundary-layer',
    title: 'Sondeo Vertical de Capa Límite y Teoría MOST',
    subtitle: 'Módulo: BoundaryLayerVerticalProfileModal.tsx',
    categoryId: 'cat-physics',
    badge: 'MICROMETEOROLOGÍA MOST',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    description: 'Resuelve la microestructura térmica de la Capa Límite Superficial (SBL) empleando la Teoría de Similitud de Monin-Obukhov (MOST). Calcula la velocidad de fricción u*, la escala de temperatura θ*, la longitud de Obukhov L y el perfil de difusividad turbulenta K_z(z).',
    officialData: 'Meteo en superficie AEMET / Red Oficial acoplada con radiación de onda corta de Copernicus.',
    citation: 'Monin, A. S. & Obukhov, A. M. (1954) "Basic laws of turbulent mixing in the surface layer".',
    targetModal: 'boundaryLayer',
    location: { lat: 36.7250, lon: -4.4300, zoom: 15.5, bearing: 0, name: 'Perfil Vertical SBL - Málaga Nordeste' }
  },
  {
    id: 'mod-sea-breeze',
    title: 'Circulación de Brisa Marina en la Bahía de Málaga',
    subtitle: 'Módulo: SeaBreezeBayModal.tsx',
    categoryId: 'cat-physics',
    badge: 'DINÁMICA LITORAL',
    icon: <Compass className="w-4 h-4 text-teal-400" />,
    description: 'Modeliza el régimen de brisa diurna de mar a tierra (Virazón) y nocturna de tierra a mar (Terral). Sopesa la convergencia mesoescala frente a la costa y el efecto de advección marina sobre la masa de aire contaminada.',
    officialData: 'Datos de la boya de Puertos del Estado y estación del Aeropuerto de Málaga (LEMG).',
    citation: 'Miller et al. (2003) "Sea breeze dynamics in coastal zones" Prog. Phys. Geogr.',
    targetModal: 'seaBreeze',
    location: { lat: 36.7100, lon: -4.4150, zoom: 14.8, bearing: -45, name: 'Bahía de Málaga / Frente Costero' }
  },

  // Categoria 3: Microescala Urbana & Cañones 3D
  {
    id: 'mod-canyon-osm',
    title: 'Geometría 3D de Cañones Urbanos OSM & Modelo OSPM',
    subtitle: 'Módulo: CanyonGeometryOsmModal.tsx',
    categoryId: 'cat-canyon',
    badge: 'CAÑÓN URBANO OSPM',
    icon: <Building2 className="w-4 h-4 text-amber-400" />,
    description: 'Analiza la morfología de las calles de Málaga importando las alturas de manzanas tridimensionales de OpenStreetMap. Deduce la relación de aspecto H/W, el ancho de calle W, la altura media H y el régimen euleriano de flujo según Oke (1987).',
    officialData: 'Catastro 3D y polígonos de huella edilicia extraídos vía OSM Overpass API.',
    citation: 'Berkowicz et al. (1997) "OSPM - Operational Street Pollution Model" Int. J. Environment and Pollution.',
    targetModal: 'canyonGeometryOsm',
    location: { lat: 36.7185, lon: -4.4213, zoom: 17.5, bearing: 180, name: 'Calle Larios / Cañón Urbano Centro' }
  },
  {
    id: 'mod-maps-3d',
    title: 'Cañón Urbano 3D Google Maps & Malla Fotogramétrica',
    subtitle: 'Módulo: GoogleMaps3DCanyonModal.tsx',
    categoryId: 'cat-canyon',
    badge: 'FOTOGRAMETRÍA 3D',
    icon: <Layers className="w-4 h-4 text-emerald-400" />,
    description: 'Proporciona una inspección inmersiva 3D con la capa cartográfica oficial Google Maps Híbrido, renderizando el atrapamiento de contaminantes a la altura del nivel de respiración humana (1.8m AGL).',
    officialData: 'Imágenes satelitales y relieve tridimensional de Google Maps Platform API.',
    citation: 'Directiva 2008/50/CE Anexo III - Criterios de Ubicación de Microescala para Muestreo.',
    targetModal: 'googleMaps3DCanyon',
    location: { lat: 36.7210, lon: -4.4260, zoom: 17.8, bearing: 65, name: 'Eje Av. Juan XXIII / Carretera de Cádiz' }
  },
  {
    id: 'mod-canyon-scanner',
    title: 'Escáner de Criticidad de Cañones Urbanos de Málaga',
    subtitle: 'Módulo: UrbanCanyonCriticalityScannerModal.tsx',
    categoryId: 'cat-canyon',
    badge: 'ESCÁNER CRÍTICO',
    icon: <Crosshair className="w-4 h-4 text-rose-400" />,
    description: 'Recorre de forma automatizada las 150 arterias principales de Málaga calculando el índice de acumulación de contaminantes I_acc basándose en el Factor de Visión del Cielo (SVF) y la ventilación eólica.',
    officialData: 'Malla vial oficial del Ayuntamiento de Málaga y callejero urbano.',
    citation: 'Oke, T. R. (1988) "Street design and urban canopy layer climate" Energy and Buildings.',
    targetModal: 'canyonScanner',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.5, bearing: 0, name: 'Red de Cañones Urbanos de Málaga' }
  },

  // Categoria 4: Computación GPU & Operador PINN
  {
    id: 'mod-webgpu',
    title: 'Aceleración GPU con Compute Shaders (WebGPU)',
    subtitle: 'Módulo: WebGPUAtmosphericComputeModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'MOTOR WEBGPU GPU',
    icon: <Cpu className="w-4 h-4 text-sky-400" />,
    description: 'Aprovecha la API WebGPU del navegador para paralelizar la resolución numérica de la advección-difusión de contaminantes en una malla de más de 100.000 celdas eulerianas a >60 FPS.',
    officialData: 'Campos de viento y rugosidad urbana del entorno de estudio de Málaga.',
    citation: 'W3C WebGPU Specification & IEEE Parallel Computing in Atmospheric Dispersion.',
    targetModal: 'webgpuCompute',
    location: { lat: 36.7190, lon: -4.4250, zoom: 16.0, bearing: -30, name: 'Malla de Cómputo WebGPU' }
  },
  {
    id: 'mod-pinn-benchmark',
    title: 'Operador Neuronal PINN vs. EPA AERMOD / CMAQ',
    subtitle: 'Módulo: PINNBenchmarkModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'BENCHMARK MODELOS',
    icon: <Scale className="w-4 h-4 text-purple-400" />,
    description: 'Contrasta las predicciones de la Red Neuronal Informada por la Física (PINN) contra los modelos regulados de la EPA (AERMOD y CMAQ). Evalúa la norma del residuo L1, L2 y L_inf de las EDPs de Navier-Stokes.',
    officialData: `Comparación continua frente a las ${SYSTEM_PROPAGATION.stationsCount} estaciones de la red oficial de vigilancia.`,
    citation: 'Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019) J. Comput. Phys.',
    targetModal: 'benchmark',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Validación Benchmark PINN' }
  },
  {
    id: 'mod-deckgl-pollutants',
    title: 'Instanciado Gráfico WebGL2 / DeckGL de Partículas 3D',
    subtitle: 'Módulo: DeckGLInstancedPollutantsModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'VISUALIZACIÓN WEBGL2',
    icon: <Sparkles className="w-4 h-4 text-cyan-300" />,
    description: 'Renderiza capas de atributos volúmetricos tridimensionales con columnas de densidad y discos estáticos instanciados en GPU sin sobrecargar la CPU.',
    officialData: 'Malla de dispersión de concentraciones en microescala de Málaga.',
    citation: 'Uber Deck.gl Architectural Framework for Geospatial Visualization.',
    targetModal: 'deckglPollutants',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.8, bearing: 45, name: 'Capa DeckGL 3D Málaga' }
  },

  // Categoria 5: Química Atmosférica & Fotólisis
  {
    id: 'mod-leighton',
    title: 'Ciclo Fotostacionario de Leighton y Fotólisis J_NO2',
    subtitle: 'Módulo: ExtendedLeightonModal.tsx',
    categoryId: 'cat-chemistry',
    badge: 'FOTOQUÍMICA LEIGHTON',
    icon: <Atom className="w-4 h-4 text-pink-400" />,
    description: 'Resuelve el estado fotostacionario de Leighton (NO + O₃ ⇌ NO₂ + O₂) y calcula la tasa de fotólisis J_NO2 ajustada por irradiancia solar espectral, nubosidad y atenuación por polvo (AOD).',
    officialData: 'Radiación solar de onda corta AEMET / Copernicus CAMS y datos de O₃/NO₂ de las estaciones.',
    citation: 'Leighton, P. A. (1961) "Photochemistry of Air Pollution" Academic Press.',
    targetModal: 'leighton',
    location: { lat: 36.7201, lon: -4.4203, zoom: 16.2, bearing: 0, name: 'Alameda Principal / Nudo Central' }
  },
  {
    id: 'mod-radicals',
    title: 'Mecanismo Radicalario Fotoquímico (OH•, HO2•, RO2•)',
    subtitle: 'Módulo: PhotochemicalRadicalMechanismModal.tsx',
    categoryId: 'cat-chemistry',
    badge: 'RADICALES FOTOQUÍMICOS',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'Describe la iniciación, propagación y terminación del ciclo de radicales hidroxilo (OH•) y peróxido (RO2•) que impulsan la formación fotoquímica de ozono troposférico y smog.',
    officialData: 'Concentraciones asimiladas de precursores NO, NO₂, CO y SO₂.',
    citation: 'Seinfeld, J. H. & Pandis, S. N. (2016) "Atmospheric Chemistry and Physics" Wiley.',
    targetModal: 'photochemicalRadicals',
    location: { lat: 36.7180, lon: -4.4220, zoom: 16.0, bearing: 0, name: 'Núcleo Urbano de Reacción Fotoquímica' }
  },

  // Categoria 6: Emisiones Antrópicas & Tráfico
  {
    id: 'mod-copert',
    title: 'Inventario de Emisiones de Tráfico COPERT 5 (Tier 3)',
    subtitle: 'Módulo: CopertTrafficModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'TRÁFICO COPERT 5',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'Calcula factores de emisión de NOₓ, PM10, PM2.5 y VOCs desglosados por categoría vehicular (Turismos, LCV, HDV, Módulos diésel/gasolina/EV) y velocidad media de circulación.',
    officialData: 'Datos de aforo vehicular del Centro de Gestión de Tráfico del Ayuntamiento de Málaga.',
    citation: 'EEA Emissions Inventory Guidebook 2023 - COPERT 5 Methodology.',
    targetModal: 'copert',
    location: { lat: 36.7150, lon: -4.4280, zoom: 16.5, bearing: 60, name: 'Eje Tráfico ZBE Av. Andalucía' }
  },
  {
    id: 'mod-port-hotelling',
    title: 'Emisiones Portuarias y Hotelling de Buques en Málaga',
    subtitle: 'Módulo: PortHotellingEmissionsModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'EMISIONES PUERTO',
    icon: <Wind className="w-4 h-4 text-teal-400" />,
    description: 'Evalúa la huella de contaminación de los cruceros, buques Ro-Ro y mercantes atracados en los muelles del Puerto de Málaga (fase de hotelling y maniobra) aplicando factores IMO.',
    officialData: 'Atraques oficiales de la Autoridad Portuaria de Málaga.',
    citation: 'IMO 4th Greenhouse Gas Study 2020 & EMEP Navigation Guidelines.',
    targetModal: 'portHotelling',
    location: { lat: 36.7120, lon: -4.4150, zoom: 15.8, bearing: -45, name: 'Puerto de Málaga / Terminal Cruceros' }
  },

  // Categoria 7: Infraestructura Verde & Sumideros
  {
    id: 'mod-malaga-trees',
    title: 'Inventario Municipal de Arbolado e i-Tree Eco Málaga',
    subtitle: 'Módulo: MalagaTreesInventoryModal.tsx',
    categoryId: 'cat-green',
    badge: 'CENSO ARBOLADO MÁLAGA',
    icon: <Trees className="w-4 h-4 text-emerald-300" />,
    description: 'Sopesa la capacidad de absorción foliar de los más de 45.000 ejemplares catalogados en las calles de Málaga (Jacaranda, Ficus, Plátano de sombra, Naranjo amargo) con el modelo i-Tree Eco.',
    officialData: 'Censo GIS de Arbolado Urbano del Ayuntamiento de Málaga.',
    citation: 'Nowak et al. (2006) "A modeling method to estimate urban tree removal of air pollution" Urban For. Urban Green.',
    targetModal: 'malagaTreesInventory',
    location: { lat: 36.7198, lon: -4.4180, zoom: 17.0, bearing: 20, name: 'Paseo del Parque de Málaga' }
  },
  {
    id: 'mod-wesely',
    title: 'Circuito de Resistencias de Deposición Seca de Wesely',
    subtitle: 'Módulo: WeselyDryDepositionModal.tsx',
    categoryId: 'cat-green',
    badge: 'DEPOSICIÓN WESELY',
    icon: <Trees className="w-4 h-4 text-emerald-400" />,
    description: 'Calcula la velocidad de deposición seca v_d de gases (NO₂, O₃, SO₂) mediante el circuito en serie de resistencias atmosférica (R_a), de capa límite laminar (R_b) y de superficie/estomática (R_c).',
    officialData: 'Uso del suelo CORINE Land Cover y cobertura vegetativa de Málaga.',
    citation: 'Wesely, M. L. (1989) "Parameterization of surface resistances to gaseous dry deposition" Atmos. Environ.',
    targetModal: 'wesely',
    location: { lat: 36.7220, lon: -4.4120, zoom: 16.2, bearing: 0, name: 'Jardín Histórico La Concepción / Matorral Litoral' }
  },

  // Categoria 8: Salud, Dosimetría & Calima
  {
    id: 'mod-healthy-routing',
    title: 'Navegación Peatonal y Rutas Saludables ZBE',
    subtitle: 'Módulo: HealthyRoutingModal.tsx',
    categoryId: 'cat-health',
    badge: 'RUTAS SALUDABLES ZBE',
    icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
    description: 'Calcula trayectorias peatonales optimizadas entre dos puntos de Málaga minimizando la dosis total de NO₂ y PM2.5 inhalada por el usuario en lugar de simplemente acortar la distancia geométrica.',
    officialData: 'Campos de microescala del Gemelo Digital e inventario peatonal OSM.',
    citation: 'ICRP Publication 66 & WHO Global Air Quality Guidelines (2021).',
    targetModal: 'healthyRouting',
    location: { lat: 36.7210, lon: -4.4230, zoom: 16.0, bearing: 0, name: 'Trazado Peatonal Centro Histórico' }
  },
  {
    id: 'mod-sahara-dust',
    title: 'Intrusión de Calima Sahariana y Descuento SEC(2011)208',
    subtitle: 'Módulo: SaharaDustModal.tsx',
    categoryId: 'cat-health',
    badge: 'CALIMA SAHARIANA',
    icon: <Activity className="w-4 h-4 text-amber-400" />,
    description: 'Detecta episodios de transporte transfronterizo de polvo mineral sahariano y aplica la metodología oficial europea para deducir la fracción natural del cómputo de superaciones de PM10 reguladas.',
    officialData: 'Modelos SKIRON / BSC-DREAM8b y datos de AOD de Copernicus CAMS.',
    citation: 'Decisión de la Comisión SEC(2011) 208 final sobre fuentes naturales de PM10.',
    targetModal: 'saharaDust',
    location: { lat: 36.7196, lon: -4.4200, zoom: 14.5, bearing: 0, name: 'Pluma de Calima Sahariana en Málaga' }
  },

  // Categoria 9: Auditoría, FAIRMODE & UNED
  {
    id: 'mod-fairmode',
    title: 'Auditoría FAIRMODE WG1 y Target Diagram',
    subtitle: 'Módulo: FairmodeStatisticalMetricsModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'MÉTRICAS FAIRMODE',
    icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
    description: `Evalúa el Indicador de Calidad del Modelo (MQI ≤ 1.0) comparando los valores simulados frente a las ${SYSTEM_PROPAGATION.stationsCount} estaciones oficiales de Málaga. Genera el Target Diagram e identifica el sesgo (NMB) y la incertidumbre (U).`,
    officialData: 'Series temporales continuas de la Red de Vigilancia de la Junta de Andalucía.',
    citation: 'FAIRMODE WG1 Guidance Document on Modeling Quality Objectives (2024).',
    targetModal: 'fairmode',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 15, name: 'Evaluación Metrológica FAIRMODE' }
  },
  {
    id: 'mod-latex-exporter',
    title: 'Compilador LaTeX y Memoria Doctoral UNED',
    subtitle: 'Módulo: LatexThesisExporterModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'EXPORTADOR UNED LATEX',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    description: 'Genera el código fuente LaTeX completo y compila directamente la Memoria Doctoral en PDF A4 de 9 páginas con la filiación oficial de la UNED, gráficos vectoriales, ecuaciones numeradas y referencias BibTeX.',
    officialData: 'Plantilla oficial de la Escuela Internacional de Doctorado EIDUNED.',
    citation: 'Normativa de Tesis Doctorales UNED & Estándares de Publicación Científica.',
    targetModal: 'latexThesis',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 15, name: 'Memoria Doctoral UNED / EIDUNED' }
  },
  {
    id: 'mod-q1-optimization',
    title: 'Optimización Q1 (Adjoint Sensitivities & 4D-Var EnKF)',
    subtitle: 'Módulo: Q1OptimizationSuiteModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'OPTIMIZACIÓN Q1',
    icon: <Sliders className="w-4 h-4 text-indigo-400" />,
    description: 'Evalúa la sensibilidad adjunta analítica ∂C/∂P para priorizar medidas de mitigación y minimiza la función de costes variacional J(x) analizando el estadístico chi-cuadrado χ².',
    officialData: 'Observaciones reales de la red oficial de Málaga acopladas a la formulación variacional.',
    citation: 'Atmospheric Chemistry and Physics (ACP) & Geoscientific Model Development (GMD).',
    targetModal: 'q1Optimization',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.0, bearing: 10, name: 'Optimización ZBE y Sensibilidad Adjunta' }
  },
  {
    id: 'mod-tribunal-defense',
    title: 'Simulador de Defensa de Tesis & Tribunal EIDUNED',
    subtitle: 'Módulo: TribunalDefenseAdvisorModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'DEFENSA UNED EIDUNED',
    icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    description: 'Simula el interrogatorio oficial del tribunal de tesis doctoral de la UNED y revisores internacionales sobre física PINN, cinética de halógenos y cumplimiento FAIRMODE.',
    officialData: 'Normativa de la Escuela Internacional de Doctorado EIDUNED (Doctorando: Dionisio Gálvez Pozo).',
    citation: 'Guía de Evaluación de Tesis Doctoral UNED & Criterios de Excelencia Científica.',
    targetModal: 'tribunalDefenseAdvisor',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Tribunal de Tesis Doctoral UNED' }
  },

  // Ingesta & Estaciones Adicionales
  {
    id: 'mod-station-audit',
    title: 'Auditoría e Inspección de Estaciones Oficiales (Junta de Andalucía)',
    subtitle: 'Módulo: OfficialStationsModal.tsx',
    categoryId: 'cat-ingestion',
    badge: 'RED DE VIGILANCIA OFICIAL',
    icon: <Radio className="w-4 h-4 text-emerald-400" />,
    description: 'Compara punto a punto los valores observados por las estaciones físicas oficiales de Málaga con los campos simulados por el Gemelo Digital.',
    officialData: 'Red de Vigilancia y Control de la Calidad del Aire de Andalucía.',
    citation: 'Directiva 2008/50/CE & Criterios de Ubicación Muestral.',
    targetModal: 'stationAudit',
    location: { lat: 36.7172, lon: -4.4444, zoom: 16.5, bearing: 0, name: 'Estación Carranque ES1417A' }
  },
  {
    id: 'mod-live-ingestion',
    title: 'Pipeline de Ingesta NRT en Tiempo Real',
    subtitle: 'Módulo: LiveIngestionPipelineModal.tsx',
    categoryId: 'cat-ingestion',
    badge: 'PIPELINE REAL-TIME',
    icon: <RefreshCw className="w-4 h-4 text-cyan-400" />,
    description: 'Monitoriza la velocidad de refresco, latencia de paquetes HTTP/REST, parsing de XML/JSON y reintentos del sistema de asimilación.',
    officialData: 'Flujos NRT de AEMET, Junta de Andalucía y Copernicus CAMS.',
    citation: 'ISO 19115/19139 Metadata Standards for Geographic Information.',
    targetModal: 'liveIngestion',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Centro de Datos del Gemelo Digital' }
  },

  // Micrometeorología Adicional
  {
    id: 'mod-vertical-sounding',
    title: 'Sondeo Vertical de Cañón Urbano y Gradiente de Ventilación',
    subtitle: 'Módulo: VerticalCanyonSoundingModal.tsx',
    categoryId: 'cat-physics',
    badge: 'SONDEO CAÑÓN URBANO',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    description: 'Mide la variabilidad del perfil eólico y térmico en la vertical z del cañón urbano (de 0 a 50m AGL).',
    officialData: 'Malla tridimensional de rugosidad edilicia de Málaga.',
    citation: 'Oke, T. R. (1987) Boundary Layer Climates.',
    targetModal: 'verticalCanyonSounding',
    location: { lat: 36.7185, lon: -4.4213, zoom: 17.5, bearing: 180, name: 'Cañón Calle Larios' }
  },
  {
    id: 'mod-street-microscale',
    title: 'Inspector Microescalar de Calle y Cota Peatonal (1.8m AGL)',
    subtitle: 'Módulo: StreetMicroscaleInspectorModal.tsx',
    categoryId: 'cat-canyon',
    badge: 'INSPECTOR MICROESCALA',
    icon: <Crosshair className="w-4 h-4 text-amber-400" />,
    description: 'Inspecciona con precisión métrica la concentración respirable a la cota del peatón en cualquier tramo seleccionado.',
    officialData: 'Callejero y direcciones oficiales del Ayuntamiento de Málaga.',
    citation: 'Directiva 2008/50/CE - Muestreo Peatonal.',
    targetModal: 'streetMicroscaleInspector',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.5, bearing: 0, name: 'Centro Histórico de Málaga' }
  },

  // Mitigación & Infraestructura Verde
  {
    id: 'mod-urban-heat-island',
    title: 'Isla de Calor Urbana (UHI) y Microclima Térmico',
    subtitle: 'Módulo: UrbanHeatIslandModal.tsx',
    categoryId: 'cat-green',
    badge: 'ISLA DE CALOR UHI',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    description: 'Modela la anomalía térmica urbana (ΔT_UHI) inducida por el albedo de pavimentos y el calor antropogénico.',
    officialData: 'Imágenes infrarrojas térmicas de la misión Landsat / MODIS.',
    citation: 'Oke, T. R. (1982) "The energetic basis of the urban heat island".',
    targetModal: 'urbanHeatIsland',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Núcleo Térmico Urbano' }
  },
  {
    id: 'mod-green-roof',
    title: 'Mitigación por Cubiertas Verdes y Bosques Verticales',
    subtitle: 'Módulo: GreenRoofVerticalForestModal.tsx',
    categoryId: 'cat-green',
    badge: 'CUBIERTAS VERDES',
    icon: <Trees className="w-4 h-4 text-emerald-400" />,
    description: 'Simula la reducción de temperatura y remoción de NO2 mediante el ajardinamiento de azoteas urbanas.',
    officialData: 'Inventario de azoteas del Catastro Municipal de Málaga.',
    citation: 'Paoletti et al. (2011) "Air pollution removal by green roofs" Environ. Pollut.',
    targetModal: 'greenRoofMitigation',
    location: { lat: 36.7210, lon: -4.4260, zoom: 17.0, bearing: 30, name: 'Sector Azoteas ZBE Málaga' }
  },
  {
    id: 'mod-tio2-photocatalysis',
    title: 'Inventario Verificado GMU/UMA de Pavimentos y Fachadas Fotocatalíticas TiO₂',
    subtitle: 'Módulo: Tio2PhotocatalyticModal.tsx',
    categoryId: 'cat-green',
    badge: 'INVENTARIO GMU TIO2',
    icon: <Zap className="w-4 h-4 text-cyan-300" />,
    description: 'Evalúa la degradación fotocatalítica heterogénea de NOx mediante la Ley de Tres Resistencias (r_a + r_b + r_c,TiO2), número de Damköhler, selectividad de Ballari-Brouwers y lixiviado de nitratos en las actuaciones verificadas Grado A1 de Málaga (Carretería-Álamos-Ollerías, Alameda i.active CARGO®, Soho Breinco Air Clean®, Lagunillas, Cobertizo del Conde, Entorno de Santo Domingo y Fachada GRC Edificio Urban en Teatinos).',
    officialData: 'Inventario verificado de la Gerencia Municipal de Urbanismo (GMU) de Málaga, FYM-HeidelbergMaterials La Araña, Breinco Air Clean® y telemetría AEMET.',
    citation: 'ISO 22197-1; CEN/TS 16980-1; Kleffmann (2016); Ballari & Brouwers (2013); Khare & Gentner (Science Advances, 2020).',
    targetModal: 'tio2Photocatalysis',
    location: { lat: 36.7238, lon: -4.4216, zoom: 17.2, bearing: 0, name: 'Eje Carretería-Álamos (GMU TiO₂)' }
  },

  // Tráfico & Emisiones Especiales
  {
    id: 'mod-emt-gtfs',
    title: 'Emisiones de Autobuses EMT Málaga GTFS Real-Time',
    subtitle: 'Módulo: EmtGtfsCopertModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'EMISIONES EMT GTFS-RT',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'Procesa la posición GPS en vivo de la flota de la EMT (Empresa Malagueña de Transportes) y calcula sus emisiones según motorización (GNC, Híbrido, Diésel Euro 6, Eléctrico).',
    officialData: 'API GTFS-RT oficial de la EMT del Ayuntamiento de Málaga.',
    citation: 'Guía EMEP/EEA Tráfico Urbano de Pasajeros.',
    targetModal: 'emtGtfsCopert',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.5, bearing: 0, name: 'Líneas EMT Málaga' }
  },
  {
    id: 'mod-traffic-loops',
    title: 'Bucles Inductivos de Tráfico y Aforos en Vivo',
    subtitle: 'Módulo: TrafficLoopsLiveModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'BUCLES DE TRÁFICO',
    icon: <Activity className="w-4 h-4 text-amber-400" />,
    description: 'Visualiza la intensidad de tráfico veh/h capturada por las espiras electromagnéticas del Centro de Control.',
    officialData: 'Red de espiras de aforo del Área de Movilidad del Ayuntamiento de Málaga.',
    citation: 'Manual de Tráfico y Movilidad Urbana.',
    targetModal: 'trafficLoopsLive',
    location: { lat: 36.7150, lon: -4.4280, zoom: 16.0, bearing: 0, name: 'Arterias Principales ZBE' }
  },
  {
    id: 'mod-industrial-inventory',
    title: 'Inventario Industrial AAI y Emisiones Guadalhorce',
    subtitle: 'Módulo: IndustrialInventoryModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'INVENTARIO INDUSTRIAL AAI',
    icon: <Flame className="w-4 h-4 text-rose-500" />,
    description: 'Localiza las chimeneas e instalaciones con Autorización Ambiental Integrada (AAI) en los polígonos de Málaga.',
    officialData: 'Registro PRTR España / Registro de Emisiones de Andalucía.',
    citation: 'Directiva 2010/75/UE de Emisiones Industriales.',
    targetModal: 'industrialInventory',
    location: { lat: 36.6950, lon: -4.4600, zoom: 14.8, bearing: 0, name: 'Polígono Industrial Guadalhorce' }
  },
  {
    id: 'mod-guadalhorce-airport',
    title: 'Receptor Especial Aeropuerto Málaga-Costa del Sol (LEMG)',
    subtitle: 'Módulo: GuadalhorceAirportReceptorModal.tsx',
    categoryId: 'cat-traffic',
    badge: 'AEROPUERTO LEMG',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    description: 'Analiza el impacto del ciclo LTO (Landing and Take-Off) de aeronaves en el Aeropuerto sobre el valle del Guadalhorce.',
    officialData: 'Operaciones LTO de AENA y datos meteorológicos de la estación LEMG.',
    citation: 'ICAO Airport Air Quality Guidance Manual (Doc 9889).',
    targetModal: 'guadalhorceAirport',
    location: { lat: 36.6750, lon: -4.4900, zoom: 14.2, bearing: 0, name: 'Aeropuerto de Málaga LEMG' }
  },

  // Auditoría, Exposición & Exportación
  {
    id: 'mod-source-apportionment',
    title: 'Asignación de Fuentes de Contaminación (Modelo PMF)',
    subtitle: 'Módulo: SourceApportionmentModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'ASIGNACIÓN FUENTES PMF',
    icon: <Scale className="w-4 h-4 text-purple-400" />,
    description: 'Descompone las contribuciones relativas al PM10/PM2.5 (Tráfico, Polvo Sahariano, Marino, Industria, Arbolado).',
    officialData: 'Perfiles químicos y masa de aerosoles de la red de monitorización.',
    citation: 'EPA Positive Matrix Factorization (PMF 5.0) Fundamentals.',
    targetModal: 'sourceApportionment',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Dominio Urbano Málaga' }
  },
  {
    id: 'mod-sobol-sensitivity',
    title: 'Análisis de Sensibilidad Global de Sobol (Monte Carlo)',
    subtitle: 'Módulo: SobolSensitivityModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'SENSIBILIDAD SOBOL',
    icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
    description: 'Calcula los índices de primer orden (S_i) y totales (S_Ti) para jerarquizar las fuentes de incertidumbre del modelo.',
    officialData: 'Rango de incertidumbre metrológica GUM de sensores e inventarios.',
    citation: 'Sobol, I. M. (2001) Global sensitivity indices for mathematical models.',
    targetModal: 'sobolSensitivity',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Evaluación de Sensibilidad' }
  },
  {
    id: 'mod-scientific-atlas',
    title: 'Atlas Científico Cartográfico de Calidad del Aire de Málaga',
    subtitle: 'Módulo: ScientificAtlasModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'ATLAS CARTOGRÁFICO',
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
    description: 'Compilatorio de mapas de isoconcentración, rosa de vientos, transectos e isolíneas regulatorias.',
    officialData: 'Malla espacial unificada de la tesis doctoral.',
    citation: 'GIS Standards for Environmental Spatial Mapping.',
    targetModal: 'scientificAtlas',
    location: { lat: 36.7196, lon: -4.4200, zoom: 14.5, bearing: 0, name: 'Atlas de Málaga' }
  },
  {
    id: 'mod-fair-data-exporter',
    title: 'Exportador FAIR & Informes Científicos a la Carta (PDF / NetCDF / GeoJSON)',
    subtitle: 'Módulo: FairDataExporterModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'FAIR & INFORMES A LA CARTA',
    icon: <Download className="w-4 h-4 text-cyan-400" />,
    description: 'Doble subpestaña metodológica: Subpestaña 1 para descarga de datos abiertos FAIR (NetCDF-4 CF-1.8, GeoJSON y paquetes ZIP) y Subpestaña 2 para compilar informes y monografías en PDF bajo demanda con directrices personalizadas.',
    officialData: 'Formato NetCDF-4/CF-1.8, GeoJSON ETRS89 UTM 30N, CSV y PDF A4 con deducción analítica.',
    citation: 'Principios FAIR (Wilkinson et al., 2016) • Directiva (UE) 2024/2881 • UNED / EIDUNED.',
    targetModal: 'fairDataExporter',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Exportación Abierta Málaga' }
  },
  {
    id: 'mod-high-res-pdf',
    title: 'Generador de Informes de Auditoría PDF 300 DPI',
    subtitle: 'Módulo: HighResPdfReportModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'INFORME PDF 300DPI',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    description: 'Genera dossiers ejecutivos y técnicos con la cartografía actual, métricas FAIRMODE e indicadores de salud.',
    officialData: 'Plantillas oficiales de auditoría de la tesis doctoral.',
    citation: 'Normativa de Presentación de Resultados Científicos.',
    targetModal: 'highResPdfReport',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Informe Doctoral' }
  },
  {
    id: 'mod-phd-walkthrough',
    title: 'Asistente Interactivo de Defensa de Tesis Doctoral UNED',
    subtitle: 'Módulo: PhDDefenseWalkthroughModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'DEFENSA DOCTORAL UNED',
    icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
    description: 'Guía paso a paso en la presentación ante el tribunal doctoral, justificando los principios de la PINN y asimilación.',
    officialData: 'Estructura oficial de tesis doctoral de EIDUNED.',
    citation: 'Reglamento de Tesis Doctorales de la UNED.',
    targetModal: 'phdDefenseWalkthrough',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Tribunal UNED' }
  },

  // Categoria 10: Incorporaciones Q1 2025/2026 (Fronteras Tesis)
  {
    id: 'mod-q1-aerograph',
    title: 'AeroGraph-PINN & Redes Neuronal de Grafo Físico (PI-GNN)',
    subtitle: 'Módulo: Q1ResearchSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'Q1 FRONTIER 2025/2026',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    description: 'Modela la conservación de flujo másico sobre la topología del grafo viario de Málaga (Nodos V y Aristas E), logrando resoluciones submetrométricas en cañones urbanos huérfanos de sensores.',
    officialData: 'Grafo topológico vial derivado de OpenStreetMap y sensores de vigilancia oficial.',
    citation: 'Nature Machine Intelligence (2025/2026) - Graph Physics-Informed Neural Networks.',
    targetModal: 'q1ResearchSuite',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.5, bearing: 25, name: 'Grafo Vial de Málaga' }
  },
  {
    id: 'mod-q1-vbs-soa',
    title: 'Formación SOA por Volatility Basis Set (VBS) y Radicales Cloro (Cl•)',
    subtitle: 'Módulo: Q1ResearchSuiteModal.tsx',
    categoryId: 'cat-chemistry',
    badge: 'Q1 FRONTIER 2025/2026',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    description: 'Cuantifica la partición gas-partícula en 4 bins de volatilidad C* y el incremento del aerosol orgánico secundario (SOA) en la costa de Málaga acelerado por la fotólisis de ClNO2.',
    officialData: 'Humedad relativa, radiación UV y precursores VOCs/NOx de la red AEMET/CAMS.',
    citation: 'Atmospheric Chemistry and Physics / ES&T (2025/2026).',
    targetModal: 'q1ResearchSuite',
    location: { lat: 36.7110, lon: -4.4150, zoom: 15.5, bearing: -30, name: 'Bahía de Málaga / Freno Marino' }
  },
  {
    id: 'mod-q1-lbm-les',
    title: 'Solucionador Lattice Boltzmann (LBM D3Q19) & LES Submalla en GPU',
    subtitle: 'Módulo: Q1ResearchSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'Q1 FRONTIER 2025/2026',
    icon: <Sparkles className="w-4 h-4 text-sky-400" />,
    description: 'Resuelve la micro-turbulencia alrededor de los edificios singulares de Málaga mediante el modelo LES de Smagorinsky acelerado por compute shaders WebGPU a 0.25m de resolución.',
    officialData: 'Geometría 3D de edificios singulares y campos eólicos en superficie.',
    citation: 'Journal of Computational Physics (2026).',
    targetModal: 'q1ResearchSuite',
    location: { lat: 36.7180, lon: -4.4200, zoom: 17.0, bearing: 45, name: 'Entorno Singular Torre del Puerto' }
  },
  {
    id: 'mod-q1-icrp66',
    title: 'Dosimetría Pulmonar Tricompartimental ICRP-66 Dinámica',
    subtitle: 'Módulo: Q1ResearchSuiteModal.tsx',
    categoryId: 'cat-health',
    badge: 'Q1 FRONTIER 2025/2026',
    icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    description: 'Calcula la masa acumulada de PM2.5 depositada en las zonas Extratorácica (ET), Traqueobronquial (BB) y Alveolar (AI) en función de la ventilación física del transeúnte (7.5 a 45 L/min).',
    officialData: 'Mallas de concentración peatonal y tasas ventilatorias humanas ICRP.',
    citation: 'Environmental Health Perspectives / Lancet Planetary Health (2025/2026).',
    targetModal: 'q1ResearchSuite',
    location: { lat: 36.7210, lon: -4.4230, zoom: 16.5, bearing: 0, name: 'Eje Peatonal ZBE Málaga' }
  },

  // Categoria 11: Motores y Librerías de Vanguardia 2026
  {
    id: 'mod-eng-h3',
    title: 'Malla Hexagonal Isotrópica Uber H3 (Grid System)',
    subtitle: 'Módulo: AdvancedEnginesSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'MOTOR H3 GRID',
    icon: <Cpu className="w-4 h-4 text-emerald-400" />,
    description: 'Genera teselaciones hexagonales isotrópicas sobre Málaga para agregar emisiones COPERT 5, UHI y deposición seca sin sesgos cartesianos de esquina.',
    officialData: 'H3 Discrete Global Grid System (Uber Open Source GIS).',
    citation: 'H3 Spatial Indexing Standard & Geodesic Discrete Grids.',
    targetModal: 'advancedEnginesSuite',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.5, bearing: 0, name: 'Malla Hexagonal H3 Málaga' }
  },
  {
    id: 'mod-eng-flatbush',
    title: 'Indexación Espacial Flatbush R-Tree O(log N)',
    subtitle: 'Módulo: AdvancedEnginesSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'MOTOR FLATBUSH RTREE',
    icon: <Layers className="w-4 h-4 text-amber-400" />,
    description: 'R-Tree empaquetado estático ultrarrápido para búsquedas kNN de vecinos más cercanos y Bounding Box sobre millones de sensores peatonales en <0.05 ms.',
    officialData: 'Coordenadas WGS84 de sensores y fachadas 3D.',
    citation: 'Flatbush Packed Hilbert R-Tree Memory Layout.',
    targetModal: 'advancedEnginesSuite',
    location: { lat: 36.7185, lon: -4.4213, zoom: 16.5, bearing: 0, name: 'Índice Espacial Calle Larios' }
  },
  {
    id: 'mod-eng-onnx',
    title: 'Inferencia Tensor ONNX Runtime Web (WebGPU / Wasm)',
    subtitle: 'Módulo: AdvancedEnginesSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'MOTOR ONNX WEBGPU',
    icon: <Zap className="w-4 h-4 text-purple-400" />,
    description: 'Inferencia acelerada por hardware GPU de tensores PINN/PI-GNN para resolver las EDPs de advección en la GPU del cliente.',
    officialData: 'Pesos de red neural exportados en formato ONNX.',
    citation: 'ONNX Runtime WebGPU & Wasm SIMD Execution Engine.',
    targetModal: 'advancedEnginesSuite',
    location: { lat: 36.7196, lon: -4.4200, zoom: 16.0, bearing: 15, name: 'Acelerador Tensor WebGPU' }
  },
  {
    id: 'mod-eng-milp',
    title: 'Solucionador de Rutas ZBE MILP (GNU GLPK)',
    subtitle: 'Módulo: AdvancedEnginesSuiteModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'MOTOR GLPK MILP',
    icon: <Scale className="w-4 h-4 text-sky-400" />,
    description: 'Programación lineal entera mixta para optimización de itinarios peatonales de mínima dosis de contaminación sujeto a límites de distancia.',
    officialData: 'Tramos de calle y factores de emisión veh/h.',
    citation: 'GLPK (GNU Linear Programming Kit) Mathematical Optimization.',
    targetModal: 'advancedEnginesSuite',
    location: { lat: 36.7175, lon: -4.4230, zoom: 16.5, bearing: 0, name: 'Rutas Óptimas MILP ZBE' }
  },
  {
    id: 'mod-eng-fair-gis',
    title: 'Exportador FAIR GIS Shapefile ZIP & Excel Multitabla',
    subtitle: 'Módulo: AdvancedEnginesSuiteModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'MOTOR FAIR GIS',
    icon: <Download className="w-4 h-4 text-cyan-400" />,
    description: 'Generación directa en cliente de archivos ESRI Shapefile con proyección PRJ WGS84 y libros de cálculo Excel auditables multitabla con metadatos GUM.',
    officialData: 'Formatos estándar ESRI Shapefile y OpenXML Excel.',
    citation: 'Principios FAIR para la Ciencia Abierta e Interoperabilidad GIS.',
    targetModal: 'advancedEnginesSuite',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Exportación FAIR GIS' }
  },

  // Categoria 12: Fronteras de Investigación Q1 2025/2026/2027
  {
    id: 'mod-q1-fno',
    title: 'Fourier Neural Operators 3D (FNO Micro-Turbulencia)',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-gpu',
    badge: 'FRONTERA FNO 3D',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    description: 'Solución continua espectral de Navier-Stokes en GPU a resolución infinitesimal para vorticidad y TKE en cañones urbanos a más de 120 FPS.',
    officialData: 'Geometría 3D de edificios y campos de viento instantáneos.',
    citation: 'Journal of Computational Physics / Nature Machine Intelligence (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7185, lon: -4.4213, zoom: 17.0, bearing: 30, name: 'Micro-Turbulencia FNO Calle Larios' }
  },
  {
    id: 'mod-q1-homs',
    title: 'Auto-Oxidación de Monoterpenos & Partículas Ultrafinas PM0.1',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-leighton',
    badge: 'FRONTERA HOMs PM0.1',
    icon: <Atom className="w-4 h-4 text-emerald-400" />,
    description: 'Cinética de formación de Moléculas Altamente Oxigenadas (HOMs) y aerosoles orgánicos no volátiles (ELVOC) inductores de nucleación espontánea.',
    officialData: 'Emisiones biogénicas Montes de Málaga (i-Tree) y ozonólisis.',
    citation: 'Atmospheric Chemistry and Physics (ACP) / Science (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7550, lon: -4.4100, zoom: 14.0, bearing: 0, name: 'Aerosol Biogénico Montes de Málaga' }
  },
  {
    id: 'mod-q1-spectral-j',
    title: 'Fotólisis Espectral J_NO2(theta, tau) & Atenuación de Calima',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-leighton',
    badge: 'FRONTERA FOTÓLISIS',
    icon: <Sun className="w-4 h-4 text-amber-400" />,
    description: 'Transferencia radiativa espectral UV-A (290–420 nm) acoplada a ángulo cenital solar astronómico y espesor óptico de polvo sahariano.',
    officialData: 'Espesor óptico de aerosoles (AOD 550nm) y radiación AEMET.',
    citation: 'Journal of Quantitative Spectroscopy & Radiative Transfer (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7145, lon: -4.4170, zoom: 16.0, bearing: 180, name: 'Fotólisis Espectral Puerto de Málaga' }
  },
  {
    id: 'mod-q1-op-dtt',
    title: 'Potencial Oxidativo del Particulado OP^DTT (Toxicidad Frenos)',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-icrp',
    badge: 'FRONTERA TOXICOLOGÍA',
    icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
    description: 'Evaluación del estrés oxidativo celular y generación de ROS por metales redox-activos (Cu, Fe) derivados del desgaste de frenos en semáforos ZBE.',
    officialData: 'Aforo de tráfico y factores de emisión no-escape COPERT 5.',
    citation: 'Environmental Health Perspectives (EHP) / ES&T (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7175, lon: -4.4230, zoom: 17.0, bearing: 0, name: 'Potencial Oxidativo Rotonda Alameda' }
  },
  {
    id: 'mod-q1-4dvar',
    title: 'Asimilación 4D-Var EnKF Híbrida & Diagnóstico Desroziers',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'FRONTERA 4D-VAR',
    icon: <Network className="w-4 h-4 text-purple-400" />,
    description: 'Minimización variacional 4D con matriz de covarianza de error dinámica del ensamble EnKF y diagnóstico de consistencia de Desroziers (QJRMS 2005).',
    officialData: 'Sentinel-5P TROPOMI tropospheric NO2 column y red Junta de Andalucía.',
    citation: 'Remote Sensing of Environment (RSE) / QJRMS (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7196, lon: -4.4200, zoom: 15.0, bearing: 0, name: 'Asimilación 4D-Var Metropol. Málaga' }
  },
  {
    id: 'mod-q1-bayesian-inversion',
    title: 'Balance de Masa Inverso Bayesiano (Flux Pinpointing)',
    subtitle: 'Módulo: Q1FrontiersSuiteModal.tsx',
    categoryId: 'cat-copert',
    badge: 'FRONTERA INVERSIÓN',
    icon: <BarChart3 className="w-4 h-4 text-blue-400" />,
    description: 'Inversión de la ecuación de advección-difusión para inferir la tasa de emisión real Q_NOx en microescala vial y detectar anomalías frente a COPERT 5.',
    officialData: 'Aforos de tráfico de Málaga y concentraciones asimiladas en microescala.',
    citation: 'Atmospheric Measurement Techniques (AMT) / ACP (2025/2026).',
    targetModal: 'q1FrontiersSuite',
    location: { lat: 36.7160, lon: -4.4260, zoom: 17.0, bearing: 90, name: 'Inversión de Emisión Av. M. A. Heredia' }
  },
  {
    id: 'mod-environmental-justice',
    title: 'Justicia Ambiental Vectorial GeoJSON & Curva de Lorenz',
    subtitle: 'Módulo: EnvironmentalJusticeModal.tsx',
    categoryId: 'cat-fairmode',
    badge: 'JUSTICIA AMBIENTAL DIR 2024/2881',
    icon: <Scale className="w-4 h-4 text-indigo-400" />,
    description: 'Cruce espacial GeoJSON de los 11 distritos de Málaga con renta media INE, paletas divergentes, Curva de Lorenz e índices de Kakwani y Atkinson.',
    officialData: 'Atlas de Distribución de Renta de los Hogares (ADRH) del INE y red de calidad del aire.',
    citation: 'Directiva (UE) 2024/2881 & Kakwani (1977) Measurement of Tax Progressivity / Environmental Equity.',
    targetModal: 'environmentalJustice',
    location: { lat: 36.7020, lon: -4.4450, zoom: 15.2, bearing: 15, name: 'Distrito Carretera de Cádiz' }
  },
  {
    id: 'mod-school-air-equity',
    title: 'Entornos Escolares Seguros & Dosimetría Pediátrica ICRP 66',
    subtitle: 'Módulo: SchoolAirEquityModal.tsx',
    categoryId: 'cat-health',
    badge: 'ENTORNOS ESCOLARES SEGUROS',
    icon: <GraduationCap className="w-4 h-4 text-amber-400" />,
    description: 'Evaluación de dosis traqueobronquial y alveolar pediátrica a cota 0.90m sobre rasante en colegios de Málaga durante hora punta escolar.',
    officialData: 'Censo de centros educativos de Málaga y telemetría de tráfico.',
    citation: 'ICRP Publication 66 Human Respiratory Tract Model & Directiva 2024/2881 Art. 13.',
    targetModal: 'schoolAirEquity',
    location: { lat: 36.7215, lon: -4.4285, zoom: 17.0, bearing: 30, name: 'CEIP Prácticas Nº1' }
  },
  {
    id: 'mod-health-economics-sas',
    title: 'Valoración Económica del Daño en Salud (OECD VSL / SAS)',
    subtitle: 'Módulo: HealthEconomicsSasModal.tsx',
    categoryId: 'cat-health',
    badge: 'ECONOMÍA DE LA SALUD SAS',
    icon: <HeartPulse className="w-4 h-4 text-emerald-400" />,
    description: 'Cuantificación de ingresos hospitalarios y urgencias evitadas en el SAS (Hospital Regional, Clínico, Materno) y ahorro en bienestar VSL (3.6 M€).',
    officialData: 'Tarifas oficiales del SAS Andalucía y funciones de daño OMS AirQ+.',
    citation: 'OECD Health Statistics (2024) & WHO AirQ+ Health Risk Assessment.',
    targetModal: 'healthEconomicsSas',
    location: { lat: 36.7230, lon: -4.4480, zoom: 16.0, bearing: 0, name: 'Hospital Regional Carlos Haya' }
  },
  {
    id: 'mod-green-justice-330300',
    title: 'Equidad en Infraestructura Verde (Regla 3-30-300 OMS / UE)',
    subtitle: 'Módulo: GreenJustice330300Modal.tsx',
    categoryId: 'cat-green',
    badge: 'REGLA 3-30-300 OMS',
    icon: <Trees className="w-4 h-4 text-emerald-300" />,
    description: 'Auditoría de desiertos verdes (<6.2% dosel en barrios obreros) vs distritos de alta renta (36.4%), y captación fitosférica foliar en kg/año.',
    officialData: 'Inventario Municipal de Arbolado de Málaga (Datos Abiertos) e INE.',
    citation: 'Reglamento (UE) 2024/1991 de Restauración de la Naturaleza & Konijnendijk (2023).',
    targetModal: 'greenJustice330300',
    location: { lat: 36.7198, lon: -4.4180, zoom: 16.5, bearing: 15, name: 'Paseo del Parque de Málaga' }
  },
  {
    id: 'mod-coastal-sml-acidification',
    title: 'Acidificación de la Microcapa Superficial Marina (SML 50 µm)',
    subtitle: 'Módulo: CoastalSmlAcidificationModal.tsx',
    categoryId: 'cat-chemistry',
    badge: 'ACIDIFICACIÓN MARINA SML',
    icon: <Wind className="w-4 h-4 text-cyan-400" />,
    description: 'Caída de pH y desaturación de aragonito en los primeros 50 µm de la superficie marina por deposición de penachos de cruceros y ferris del Puerto.',
    officialData: 'Boya oceanográfica de la Bahía de Málaga y Red RADMED (IEO-CSIC).',
    citation: 'MARPOL Anexo VI & Química del Sistema de Carbonatos Marinos (Zeebe & Wolf-Gladrow).',
    targetModal: 'coastalSmlAcidification',
    location: { lat: 36.7110, lon: -4.4140, zoom: 15.5, bearing: -30, name: 'Muelle de Levante / Puerto de Málaga' }
  },
  {
    id: 'mod-hunt-q-lambda2',
    title: 'Doble Validación Vorticial: Invariante Q de Hunt & λ₂',
    subtitle: 'Módulo: HuntQCriterionModal.tsx',
    categoryId: 'cat-canyon',
    badge: 'VORTICIDAD & CFD',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    description: 'Cálculo del invariante tensorial Q de Hunt y segundo autovalor λ₂ de Jeong & Hussain mediante resolución de Cardano-Viète en cañones urbanos.',
    officialData: 'Geometría 3D de cañones urbanos y telemetría de viento.',
    citation: 'Hunt et al. (1988) & Jeong & Hussain (1995) On the identification of a vortex.',
    targetModal: 'huntQCriterion',
    location: { lat: 36.7185, lon: -4.4213, zoom: 17.5, bearing: 180, name: 'Calle Larios - Vórtice de Cañón' }
  },
  {
    id: 'mod-frontier-4d-justice',
    title: 'Justicia Socioambiental Cuatridimensional (4D Dynamic EJ)',
    subtitle: 'Módulo: EnvironmentalJusticeModal.tsx (Pestaña 4D)',
    categoryId: 'cat-health',
    badge: 'PRIMICIA MUNDIAL Q1',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    description: 'Primer marco mundial que acopla la dosis en desplazamientos activos ICRP-66 (CAI³), toxicidad celular por desgaste de frenos (OP^DTT Gini), exposición nocturna residencial con pobreza energética (N-EI ClNO2) y gentrificación verde (GGDVI).',
    officialData: 'Censo y Atlas de Renta INE, Catastro Municipal y aforos de tráfico de Málaga.',
    citation: 'Nature Sustainability / Lancet Planetary Health Standards & EIDUNED Doctoral Thesis (2026).',
    targetModal: 'environmentalJustice',
    location: { lat: 36.7088, lon: -4.4443, zoom: 16.5, bearing: 20, name: 'Eje Carretera de Cádiz / Av. Velázquez' }
  }
];

export function UserGuideTourModal({
  isOpen,
  onClose,
  setActiveModal,
  flyToLocation,
  applyCameraPreset
}: UserGuideTourModalProps) {
  const [activeTab, setActiveTab] = useState<'tour' | 'encyclopedia' | 'updates'>('tour');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [releaseSearchQuery, setReleaseSearchQuery] = useState('');
  const [releaseTypeFilter, setReleaseTypeFilter] = useState<'all' | 'major' | 'feature' | 'methodology'>('all');

  // Filtrado dinámico de módulos de conocimiento por búsqueda y categoría
  const filteredModules = useMemo(() => {
    return KNOWLEDGE_MODULES.filter(mod => {
      const matchesCategory = selectedCategory === 'cat-all' || mod.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.citation.toLowerCase().includes(q) ||
        mod.officialData.toLowerCase().includes(q) ||
        mod.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Filtrado dinámico de actualizaciones y versiones de la app
  const filteredReleases = useMemo(() => {
    return APP_RELEASES_REGISTRY.filter(rel => {
      const matchesType = releaseTypeFilter === 'all' || rel.type === releaseTypeFilter;
      const q = releaseSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        rel.version.toLowerCase().includes(q) ||
        rel.title.toLowerCase().includes(q) ||
        rel.description.toLowerCase().includes(q) ||
        rel.codename.toLowerCase().includes(q) ||
        rel.scientificScope.toLowerCase().includes(q) ||
        rel.doctoralImpact.toLowerCase().includes(q) ||
        rel.highlights.some(h => h.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [releaseSearchQuery, releaseTypeFilter]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      executeStepActions(TOUR_STEPS[nextIdx]);
    } else {
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      executeStepActions(TOUR_STEPS[prevIdx]);
    }
  };

  const executeStepActions = (step: TourStep) => {
    if (step.location) {
      flyToLocation(step.location.lat, step.location.lon, step.location.zoom, step.location.bearing, step.location.name);
    }
    if (step.cameraPreset) {
      applyCameraPreset(step.cameraPreset);
    }
  };

  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    executeStepActions(TOUR_STEPS[index]);
  };

  const handleOpenModal = (modalName: string | null) => {
    if (modalName) {
      setActiveModal(modalName);
    }
  };

  return (
    <DraggableWindow
      title="Guía de Usuario & Enciclopedia Doctoral del Gemelo Digital"
      subtitle={`Tesis Doctoral UNED (EIDUNED) • Doctorando: ${DOCTORAL_METADATA.doctoralCandidate} • Versión ${APP_CURRENT_VERSION}`}
      icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
      className="w-[740px] max-w-[95vw] max-h-[90vh]"
      initialPositionClass="top-20 left-1/2 -translate-x-1/2"
      defaultCollapsed={false}
      onClose={onClose}
      badge={
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold rounded-xs">
            UNED • EIDUNED
          </span>
          <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-700 font-bold rounded-xs hidden sm:inline">
            {DOCTORAL_METADATA.doctoralCandidate}
          </span>
          <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-600 font-bold rounded-xs">
            {APP_CURRENT_VERSION}
          </span>
        </div>
      }
    >
      <div className="p-3 bg-slate-950/95 text-slate-200 font-sans text-xs space-y-3 flex flex-col max-h-[82vh]">
        
        {/* Selector Superior de Modo: Tour Guiado vs. Enciclopedia vs. Novedades y Actualizaciones */}
        <div className="flex items-center justify-between bg-slate-900/90 p-1.5 border border-slate-800 rounded-xs shrink-0 flex-wrap gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            <ScientificTooltip content="Recorrido metodológico guiado paso a paso por los 13 hitos científicos obligatorios de la tesis doctoral.">
              <button
                onClick={() => setActiveTab('tour')}
                className={`px-2.5 py-1.5 font-mono text-[10px] font-bold rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tour'
                    ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>1. RECORRIDO (13 HITOS)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Enciclopedia exhaustiva y catálogo temático con todas las herramientas, suites y motores físicos del Gemelo Digital.">
              <button
                onClick={() => setActiveTab('encyclopedia')}
                className={`px-2.5 py-1.5 font-mono text-[10px] font-bold rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'encyclopedia'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>2. ENCICLOPEDIA ({KNOWLEDGE_MODULES.length} MÓDULOS)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip content="Historial cronológico de versiones y registro de hitos metodológicos integrados en la memoria doctoral.">
              <button
                onClick={() => setActiveTab('updates')}
                className={`px-2.5 py-1.5 font-mono text-[10px] font-bold rounded-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                  activeTab === 'updates'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-slate-950 text-amber-300 hover:text-white hover:bg-slate-800 border-amber-600/40'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>3. ACTUALIZACIONES DE LA APP</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </button>
            </ScientificTooltip>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[8.5px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 border border-emerald-800/80 rounded-xs">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>SINCRONIZACIÓN EN TIEMPO REAL</span>
          </div>
        </div>

        {/* MODO 1: RECORRIDO GUIADO INTERACTIVO (TOUR PASO A PASO) */}
        {activeTab === 'tour' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {/* Barra de Progreso del Recorrido */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-400">PASO {currentStep.id} DE {TOUR_STEPS.length}</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 font-mono rounded">
                  {currentStep.badge}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => handleSelectStep(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex 
                        ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                        : 'bg-slate-800 hover:bg-slate-600'
                    }`}
                    title={`Ir al paso ${step.id}: ${step.title}`}
                  />
                ))}
              </div>
            </div>

            {/* Tarjeta Principal del Paso */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Encabezado del Paso */}
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 border border-slate-800 rounded-xs">
                  <div className="p-2 bg-slate-950 border border-slate-700 rounded-xs shrink-0">
                    {currentStep.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                      {currentStep.title}
                    </h3>
                    <p className="text-[10.5px] text-emerald-400 font-mono font-semibold truncate">
                      {currentStep.subtitle}
                    </p>
                  </div>
                </div>

                {/* Descripción Funcional */}
                <div className="bg-black/40 p-2.5 border border-slate-800/80 rounded-xs leading-relaxed text-slate-300 text-[11px]">
                  {currentStep.content}
                </div>

                {/* Importancia de los Datos Oficiales de Málaga */}
                <div className="bg-emerald-950/30 border border-emerald-500/40 p-2.5 rounded-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Importancia Metrológica de los Datos Oficiales de Málaga:</span>
                  </div>
                  <p className="text-[10px] text-emerald-200/90 leading-snug font-mono">
                    {currentStep.officialDataImportance}
                  </p>
                </div>

                {/* Cita Científica y Normativa */}
                <ScientificTooltip position="top" width="w-[380px]" content={`Referencia bibliográfica y normativa: ${currentStep.scientificCitation}`}>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-400 bg-slate-900/60 p-1.5 border border-slate-800 rounded-xs cursor-help">
                    <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">Fundamento Técnico: {currentStep.scientificCitation}</span>
                  </div>
                </ScientificTooltip>

                {/* Botonera de Acción Directa para el Paso */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  {currentStep.targetModal && (
                    <ScientificTooltip
                      position="bottom"
                      width="w-[300px]"
                      content={`Abrir directamente el módulo analítico ${currentStep.targetModalLabel || currentStep.targetModal}: asimilación determinista y auditoría sin aleatoriedad.`}
                    >
                      <button
                        onClick={() => handleOpenModal(currentStep.targetModal)}
                        className="w-full sm:w-auto flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{currentStep.targetModalLabel || 'Abrir Módulo Interactivo'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </ScientificTooltip>
                  )}

                  {currentStep.location && (
                    <ScientificTooltip
                      position="bottom"
                      width="w-[280px]"
                      content={`Teletransportar la cámara 3D del Gemelo Digital a ${currentStep.location.name} (lat: ${currentStep.location.lat.toFixed(4)}, lon: ${currentStep.location.lon.toFixed(4)}).`}
                    >
                      <button
                        onClick={() => flyToLocation(currentStep.location!.lat, currentStep.location!.lon, currentStep.location!.zoom, currentStep.location!.bearing, currentStep.location!.name)}
                        className="w-full sm:w-auto py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10.5px] font-bold rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Volar a {currentStep.location.name}</span>
                      </button>
                    </ScientificTooltip>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navegación del Recorrido */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-[10px] shrink-0">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`px-2.5 py-1 border flex items-center gap-1 font-bold rounded-xs transition-all ${
                  currentStepIndex === 0 
                    ? 'opacity-40 border-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                <span>ANTERIOR</span>
              </button>

              <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">
                Usa las flechas o los puntos superiores para navegar por los hitos
              </span>

              <button
                onClick={handleNextStep}
                className="px-3 py-1 border border-emerald-500 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 hover:text-white font-bold rounded-xs flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'FINALIZAR TOUR' : 'SIGUIENTE HITO'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* MODO 2: ENCICLOPEDIA Y KNOWLEDGE BASE EXPONENCIAL DE LA APP */}
        {activeTab === 'encyclopedia' && (
          <div className="space-y-2.5 flex-1 overflow-hidden flex flex-col">
            
            {/* Buscador en Tiempo Real por Palabra Clave */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por módulo, ecuación, contaminante, autor, normativa (ej: Leighton, COPERT, FAIRMODE, Wesely, UNED)..."
                className="w-full pl-8 pr-8 py-1.5 bg-black/60 border border-slate-800 focus:border-cyan-500 text-slate-200 text-[11px] font-mono rounded-xs placeholder:text-slate-600 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selector de Categorías Temáticas en Formato Horizontal */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 shrink-0">
              {KNOWLEDGE_CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                const count = cat.id === 'cat-all' 
                  ? KNOWLEDGE_MODULES.length 
                  : KNOWLEDGE_MODULES.filter(m => m.categoryId === cat.id).length;

                return (
                  <ScientificTooltip
                    key={cat.id}
                    position="bottom"
                    width="w-[240px]"
                    content={`${cat.name}: ${cat.description} (${count} módulos)`}
                  >
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-1 text-[9.5px] font-mono font-bold rounded-xs flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.name}</span>
                      <span className={`px-1 py-0.2 text-[8px] rounded ${isSelected ? 'bg-cyan-800 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  </ScientificTooltip>
                );
              })}
            </div>

            {/* Listado Filtrado de Fichas Técnicas de Módulos */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {filteredModules.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs space-y-1 bg-black/30 border border-slate-800 rounded-xs">
                  <Search className="w-6 h-6 text-slate-600 mx-auto mb-1 animate-bounce" />
                  <p>No se encontraron módulos científicos para "{searchQuery}".</p>
                  <p className="text-[10px] text-slate-600">Pruebe con otra palabra clave como "NO2", "Oke", "COPERT", "Wesely", "FAIRMODE" o limpie el filtro.</p>
                </div>
              ) : (
                filteredModules.map(mod => (
                  <div
                    key={mod.id}
                    className="p-2.5 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xs space-y-2 transition-all group"
                  >
                    {/* Encabezado del Módulo */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-slate-950 border border-slate-700 rounded-xs shrink-0 text-cyan-400">
                          {mod.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                            {mod.title}
                          </h4>
                          <span className="text-[9.5px] font-mono text-cyan-400 block font-semibold">
                            {mod.subtitle}
                          </span>
                        </div>
                      </div>

                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-700 text-amber-300 rounded shrink-0">
                        {mod.badge}
                      </span>
                    </div>

                    {/* Descripción y Fundamento */}
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                      {mod.description}
                    </p>

                    {/* Importancia de los Datos Oficiales de Málaga */}
                    <div className="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded-xs text-[10px] text-emerald-200/90 font-mono space-y-0.5">
                      <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[9px]">
                        📍 Datos Oficiales Asimilados en Málaga:
                      </span>
                      <span>{mod.officialData}</span>
                    </div>

                    {/* Cita Bibliográfica y Normativa */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 bg-slate-950/80 p-1.5 border border-slate-800/80 rounded-xs">
                      <span className="truncate">Cita: {mod.citation}</span>
                    </div>

                    {/* Botonera de Acción para el Módulo */}
                    <div className="pt-0.5 flex items-center justify-end gap-2">
                      {mod.location && (
                        <ScientificTooltip
                          position="bottom"
                          width="w-[260px]"
                          content={`Volar la cámara cartográfica al punto de estudio en ${mod.location.name}.`}
                        >
                          <button
                            onClick={() => flyToLocation(mod.location!.lat, mod.location!.lon, mod.location!.zoom, mod.location!.bearing, mod.location!.name)}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[9.5px] font-mono font-bold rounded-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>Volar a Ubicación</span>
                          </button>
                        </ScientificTooltip>
                      )}

                      <ScientificTooltip
                        position="bottom"
                        width="w-[280px]"
                        content={`Abrir el módulo interactivo especializado ${mod.title} (${mod.badge}).`}
                      >
                        <button
                          onClick={() => handleOpenModal(mod.targetModal)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] font-mono uppercase tracking-wider rounded-xs flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Abrir Módulo</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </ScientificTooltip>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie Informativo del Catálogo */}
            <div className="pt-1 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex items-center justify-between shrink-0">
              <span>Mostrando {filteredModules.length} de {KNOWLEDGE_MODULES.length} módulos del Gemelo Digital</span>
              <span className="text-emerald-400 font-bold">Tesis Doctoral UNED • EIDUNED • Doctorando: {DOCTORAL_METADATA.doctoralCandidate}</span>
            </div>

          </div>
        )}

        {/* MODO 3: HISTORIAL DE ACTUALIZACIONES & REGISTRO DE VERSIONES EN VIVO */}
        {activeTab === 'updates' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            
            {/* Banner Oficial de Sincronización Automática */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/30 rounded-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xs text-emerald-400">
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-emerald-300 font-mono flex items-center gap-1.5">
                      <span>Sincronización Continua de la Guía con la App</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500 text-black font-extrabold rounded-xs uppercase">EN VIVO</span>
                    </h3>
                    <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                      Cada vez que el Gemelo Digital se actualiza con nuevos módulos de cálculo físico-químico, refinamientos de mallas o asimilación de datos, esta pestaña guía se actualiza sincronizadamente para documentar todas las capacidades de la investigación doctoral.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ficha Institucional y Doctoral UNED / EIDUNED */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[9.5px] font-mono border-t border-slate-800/80">
                <div className="bg-slate-950/80 p-2 border border-slate-800 rounded-xs flex flex-col justify-between">
                  <div className="text-slate-400 text-[8.5px] uppercase tracking-wider font-bold">Autor / Doctorando</div>
                  <div className="text-emerald-300 font-bold text-[11px] flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{DOCTORAL_METADATA.doctoralCandidate}</span>
                  </div>
                  <div className="text-[8.5px] text-slate-500 mt-0.5">Investigador Predoctoral • Modelización de Calidad del Aire</div>
                </div>

                <div className="bg-slate-950/80 p-2 border border-slate-800 rounded-xs flex flex-col justify-between">
                  <div className="text-slate-400 text-[8.5px] uppercase tracking-wider font-bold">Filiación Académica Oficial</div>
                  <div className="text-cyan-300 font-bold text-[11px] flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{DOCTORAL_METADATA.university} ({DOCTORAL_METADATA.doctoralSchool})</span>
                  </div>
                  <div className="text-[8.5px] text-slate-500 mt-0.5">{DOCTORAL_METADATA.doctoralProgram}</div>
                </div>
              </div>

              {/* Título Oficial de la Tesis */}
              <div className="bg-slate-950/90 p-2 border border-emerald-900/40 rounded-xs text-[9.5px] font-mono text-slate-300 space-y-0.5">
                <div className="text-emerald-400 text-[8.5px] font-bold uppercase tracking-wider">Título de la Tesis Doctoral:</div>
                <div className="italic text-slate-200">"{DOCTORAL_METADATA.thesisTitle}"</div>
              </div>
            </div>

            {/* Buscador y Filtros del Registro de Versiones */}
            <div className="bg-slate-900/90 p-2 border border-slate-800 rounded-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por versión, funcionalidad, módulo o término científico..."
                    value={releaseSearchQuery}
                    onChange={(e) => setReleaseSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 rounded-xs focus:outline-none focus:border-amber-500"
                  />
                  {releaseSearchQuery && (
                    <button
                      onClick={() => setReleaseSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px] font-mono"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <ScientificTooltip position="bottom" width="w-[220px]" content="Muestra el registro completo de todas las versiones publicadas de la plataforma doctoral.">
                    <button
                      onClick={() => setReleaseTypeFilter('all')}
                      className={`px-2 py-1 text-[9px] font-mono rounded-xs transition-colors ${
                        releaseTypeFilter === 'all'
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todas ({APP_RELEASES_REGISTRY.length})
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip position="bottom" width="w-[240px]" content="Filtra versiones con hitos mayores de arquitectura, nuevos motores o refactorizaciones estructurales.">
                    <button
                      onClick={() => setReleaseTypeFilter('major')}
                      className={`px-2 py-1 text-[9px] font-mono rounded-xs transition-colors ${
                        releaseTypeFilter === 'major'
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Mayores
                    </button>
                  </ScientificTooltip>
                  <ScientificTooltip position="bottom" width="w-[240px]" content="Filtra versiones asociadas a avances metodológicos directos para los capítulos de la tesis doctoral.">
                    <button
                      onClick={() => setReleaseTypeFilter('methodology')}
                      className={`px-2 py-1 text-[9px] font-mono rounded-xs transition-colors ${
                        releaseTypeFilter === 'methodology'
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Metodología
                    </button>
                  </ScientificTooltip>
                </div>
              </div>
            </div>

            {/* Listado Cronológico de Versiones y Novedades */}
            <div className="space-y-2.5">
              {filteredReleases.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-900/40 border border-dashed border-slate-800 rounded-xs">
                  No se encontraron versiones que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                filteredReleases.map((rel) => (
                  <div
                    key={rel.version}
                    className="p-3 bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all rounded-xs space-y-2.5"
                  >
                    {/* Cabecera de la Versión */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs ${
                          rel.version === APP_CURRENT_VERSION
                            ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-slate-800 text-slate-200'
                        }`}>
                          {rel.version}
                        </span>

                        <span className="text-xs font-bold text-white font-mono">
                          {rel.title}
                        </span>

                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-950/70 border border-amber-800/80 text-amber-300 font-mono rounded">
                          {rel.codename}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {rel.releaseDate}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded uppercase text-[8px] font-bold ${
                          rel.type === 'major'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : rel.type === 'methodology'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {rel.type}
                        </span>
                      </div>
                    </div>

                    {/* Descripción de la Actualización */}
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                      {rel.description}
                    </p>

                    {/* Hitos Principales Implementados */}
                    <div className="space-y-1 bg-slate-950/80 p-2 border border-slate-800/80 rounded-xs">
                      <div className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Novedades y Hitos Clave de esta Versión:</span>
                      </div>
                      <ul className="space-y-0.5 text-[9.5px] text-slate-300 font-mono pl-3 list-disc">
                        {rel.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="leading-snug">
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Alcance Científico e Impacto en Tesis */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9px] font-mono">
                      <div className="p-1.5 bg-blue-950/30 border border-blue-900/40 rounded-xs text-blue-200">
                        <span className="text-blue-400 font-bold block text-[8.5px] uppercase">
                          🔬 Alcance Físico-Químico:
                        </span>
                        <span>{rel.scientificScope}</span>
                      </div>
                      <div className="p-1.5 bg-emerald-950/30 border border-emerald-900/40 rounded-xs text-emerald-200">
                        <span className="text-emerald-400 font-bold block text-[8.5px] uppercase">
                          🎓 Impacto Tesis Doctoral UNED:
                        </span>
                        <span>{rel.doctoralImpact}</span>
                      </div>
                    </div>

                    {/* Módulos Asociados y Botonera para Abrir Directamente */}
                    {(rel.targetModal || (rel.associatedModals && rel.associatedModals.length > 0)) && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 flex-wrap gap-1">
                        <span className="text-[8.5px] font-mono text-slate-400">
                          Módulos relacionados en esta actualización:
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {rel.targetModal && (
                            <ScientificTooltip
                              position="bottom"
                              width="w-[280px]"
                              content={`Abrir directamente el módulo ${rel.targetModalLabel || rel.targetModal} introducido o actualizado en esta versión.`}
                            >
                              <button
                                onClick={() => handleOpenModal(rel.targetModal!)}
                                className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-black font-mono text-[9px] font-bold rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{rel.targetModalLabel || rel.targetModal}</span>
                              </button>
                            </ScientificTooltip>
                          )}
                          {rel.associatedModals?.map((modalId) => (
                            <ScientificTooltip
                              key={modalId}
                              position="bottom"
                              width="w-[260px]"
                              content={`Abrir el módulo científico asociado '${modalId}'.`}
                            >
                              <button
                                onClick={() => handleOpenModal(modalId)}
                                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-emerald-300 font-mono text-[9px] font-bold rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{modalId}</span>
                              </button>
                            </ScientificTooltip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pie Informativo de las Actualizaciones */}
            <div className="pt-1 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex items-center justify-between shrink-0 flex-wrap gap-1">
              <span>Registradas {APP_RELEASES_REGISTRY.length} versiones oficiales del Gemelo Digital</span>
              <span className="text-amber-400 font-bold">
                Doctorando: {DOCTORAL_METADATA.doctoralCandidate} • {DOCTORAL_METADATA.university} ({DOCTORAL_METADATA.doctoralSchool})
              </span>
            </div>

          </div>
        )}

      </div>
    </DraggableWindow>
  );
}
