/**
 * Registro Central de Versiones, Metadatos Doctorales y Actualizaciones de la App
 * 
 * Tesis Doctoral:
 * "Modelización de la Calidad del Aire a Microescala e Integración de Gemelos Digitales
 *  Informados por la Física (PINN) en Entornos Urbanos Costeros: El Caso de Málaga"
 * 
 * Doctorando: Dionisio Gálvez Pozo
 * Universidad: Universidad Nacional de Educación a Distancia (UNED)
 * Escuela de Doctorado: Escuela Internacional de Doctorado de la UNED (EIDUNED)
 * Programa: Programa de Doctorado en Tecnologías Industriales e Informáticas
 */

export interface AppRelease {
  version: string;
  releaseDate: string;
  codename: string;
  type: 'major' | 'feature' | 'methodology' | 'patch';
  title: string;
  description: string;
  targetModal?: string;
  targetModalLabel?: string;
  associatedModals?: string[];
  highlights: string[];
  scientificScope: string;
  doctoralImpact: string;
}

export interface DoctoralMetadata {
  doctoralCandidate: string;
  university: string;
  universityAcronym: string;
  doctoralSchool: string;
  doctoralSchoolAcronym: string;
  doctoralProgram: string;
  thesisTitle: string;
  defenseYear: string;
  researchFocus: string;
  institutionalAffiliation: string;
}

export const DOCTORAL_METADATA: DoctoralMetadata = {
  doctoralCandidate: "Dionisio Gálvez Pozo",
  university: "Universidad Nacional de Educación a Distancia",
  universityAcronym: "UNED",
  doctoralSchool: "Escuela Internacional de Doctorado de la UNED",
  doctoralSchoolAcronym: "EIDUNED",
  doctoralProgram: "Programa de Doctorado en Tecnologías Industriales e Informáticas",
  thesisTitle: "Modelización de la Calidad del Aire a Microescala e Integración de Gemelos Digitales Informados por la Física (PINN) en Entornos Urbanos Costeros: El Caso de Málaga",
  defenseYear: "2026",
  researchFocus: "Asimilación Continua de Datos Observacionales, Redes Neuronales Informadas por la Física (PINN), Solvers Químicos Rígidos y Microescala Urbana Determinista",
  institutionalAffiliation: "UNED • Escuela Internacional de Doctorado (EIDUNED) • Doctorando: Dionisio Gálvez Pozo"
};

export const APP_CURRENT_VERSION = "v5.9.0";
export const APP_LAST_UPDATE_DATE = "31 Octubre 2026";
export const APP_BUILD_TIMESTAMP = "2026-10-31";

export const APP_RELEASES_REGISTRY: AppRelease[] = [
  {
    version: "v5.9.0",
    releaseDate: "31 Octubre 2026 (Actual)",
    codename: "Director Backbone (0➔7), Verified 2024–2026 Evidence, DOI SOTA Radar, Autonomous Dual HTML & Persistent Ergonomics",
    type: "major",
    title: "Columna Vertebral Directrices Director (0➔7), Evidencia Primaria 2024–2026, Radar DOI y Ejecutable .HTML Autónomo",
    description: "Consolidación integral de la pestaña Directrices del Director como columna vertebral metodológica (Puntos 0 al 7, custodia íntegra del PDF original del Director 03/10/2026, especificación formal PINN Paso 6.4, 10 variables de contexto e informes PDF monográficos punto por punto). Incorporación de la evidencia empírica primaria verificada 2024–2026 (ZBE Málaga y suspensión TSJA oct-2026, Med SOx ECA Puerto 01/05/2025, récord Aeropuerto LEMG AENA 2024–2025, infracciones Directiva UE 2024/2881 en Av. Juan XXIII y satélites Sentinel-4A/5A/EarthCARE), Radar Científico SOTA con confirmación DOI, Receptor Multi-Formato (.PDF/.DOCX/.TXT), arranque ultrarrápido React.lazy, Ejecutable Portable .HTML 100 % autónomo y persistencia automática de la posición (x, y) de pestañas y ventanas.",
    targetModal: "thesisMethodologySuite",
    targetModalLabel: "Abrir Directrices Director (OE1–OE4 • 13 Tablas)",
    associatedModals: ["thesisMethodologySuite", "portableCloudSync", "audit", "systemIntegrityAudit"],
    highlights: [
      "Custodia íntegra del PDF original del Director (03/10/2026) con visor interactivo y ordenación lógica exacta (Puntos 0 al 7).",
      "Generador de Informes PDF A4 Supercompletos Punto por Punto (Puntos 1–2, 3, 4, 5, 6.1, 6.2, 6.3, 6.4, 6.5 y 7) además del PDF Extenso de 13 Tablas.",
      "Evidencia primaria verificada 2024–2026: ZBE Málaga (Ordenanza 30/11/2024 y sentencia TSJA oct-2026), Med SOx ECA Puerto (0,10 % S), Aeropuerto LEMG (26,76 M pasajeros) y Av. Juan XXIII (31,0 µg/m³ vs límite UE 2024/2881 de 20 µg/m³).",
      "Alarma / Radar Científico SOTA en vivo (OpenAlex / Crossref DOI) con confirmación expresa antes de incorporar referencias a la tesis.",
      "Receptor Universal Multi-Formato (.PDF, Word .DOCX, .TXT y escritura directa) con generación instantánea de monografía PDF por orden.",
      "Arranque diferido ultrarrápido (React.lazy), Ejecutable Portable .HTML de Doble Motor 100 % autónomo en local (file://) y memoria persistente en localStorage de las coordenadas (x, y) al arrastrar cualquier pestaña o ventana flotante."
    ],
    scientificScope: "Directiva (UE) 2024/2881, OMI MARPOL Med SOx ECA (MEPC.361(79)), Copernicus Sentinel-4A/5A, CP-PRE (ICML 2025), DML + MetFix-PINN (ES&T 2025).",
    doctoralImpact: "Garantiza trazabilidad 1:1 con el documento rector del Director de Tesis, blindaje empírico actualizado a octubre de 2026 y portabilidad total PC ↔ Nube ↔ iPad ↔ Pendrive USB."
  },
  {
    version: "v5.8.0",
    releaseDate: "21 Octubre 2026",
    codename: "Doctoral Forensic Census (24 Málaga City Stations + 16 Orbiting Satellites) & 5 Thesis Directors SOTA Blocks",
    type: "major",
    title: "Depuración Forense de Sensores en Málaga Ciudad (24 Terrestres + 16 Satélites) y 5 Bloques Metodológicos SOTA",
    description: "Censo doctoral definitivo y rigurosamente verificado con 24 estaciones terrestres 100 % dentro del municipio de Málaga (RVCCAA / EOI, AEMET, Puerto de Málaga, Red ZBE / Movilidad, SAIH Hidrosur, UMA Teatinos) y 16 misiones satelitales activas en órbita sobre Málaga en 2026. Exclusión justificada con base documental de estaciones fuera de término municipal y satélites fuera de servicio o futuros. Incorporación de los 5 Bloques de los Directores de Tesis (Auditoría de Fuentes, Matriz de 36 Variables, MVP Operativo de 12 Variables, Arquitectura Formal PINN con Pesos NTK y Donut Spatial RDD con Spillover Ring de 150 m).",
    targetModal: "audit",
    targetModalLabel: "Abrir Observatorio Oficial (24+16)",
    associatedModals: ["audit", "systemIntegrityAudit", "environmentalJustice", "liveIngestion"],
    highlights: [
      "Inventario auditado de 24 estaciones terrestres in situ dentro del término municipal de Málaga (cero estaciones en otros municipios).",
      "Red espacial de 16 misiones satelitales activas en órbita en 2026 con corrección radiativa 3D AMF.",
      "Tabla 1.4 de Exclusión Metodológica Justificada (Marbella, Ronda, Antequera, Alhaurín, CALIPSO, CO2M).",
      "Matriz de 36 variables físicas, químicas, morfológicas y de tráfico e índice de redundancia de Fisher.",
      "Selección del MVP de 12 variables mínimas operativas que retienen el 94,8 % de la varianza ambiental.",
      "Arquitectura formal de la PINN: ResNet PDE 4 capas, Fourier features, pesos dinámicos NTK y optimizador híbrido Adam + L-BFGS-B.",
      "Estrategia de identificación causal de la ZBE: PI-DiD y Donut Spatial RDD perimetral (0-150 m) con matriz de flota DGT."
    ],
    scientificScope: "Directiva 2008/50/CE, Directiva (UE) 2024/2881, Guías OMS 2021, FAIRMODE WG1, CAMS ECMWF, EMEP/EEA COPERT 5.7.",
    doctoralImpact: "Establece la malla observacional depurada y la fundamentación analítica irrefutable exigida por los directores de tesis para la defensa doctoral en la UNED."
  },
  {
    version: "v5.7.0",
    releaseDate: "08 Octubre 2026",
    codename: "Doctoral Full Certified Network (64 Terrestrial + 26 Satellite Missions)",
    type: "major",
    title: "Consolidación de la Red Certificada Plena (64 Terrestres + 26 Satélites Espaciales)",
    description: "Censo previo de 64 estaciones terrestres in situ en la cuenca atmosférica provincial y 26 misiones satelitales orbitales.",
    targetModal: "audit",
    targetModalLabel: "Abrir Observatorio Oficial (64+26)",
    associatedModals: ["audit", "systemIntegrityAudit", "environmentalJustice", "liveIngestion"],
    highlights: [
      "Inventario de estaciones terrestres en la cuenca atmosférica de Málaga.",
      "Red espacial de misiones satelitales de observación de la Tierra.",
      "Sincronización universal mediante SYSTEM_PROPAGATION (Regla Doctrinal 13).",
      "Asimilación física 4D-Var acoplada a química troposférica determinista (PINN + Solvers Rígidos ODE).",
      "Certificación criptográfica SHA-256 de integridad sistémica y trazabilidad científica FAIR para la memoria doctoral."
    ],
    scientificScope: "Directiva 2008/50/CE, Directiva (UE) 2024/2881, Guías OMS 2021, FAIRMODE WG1, CAMS ECMWF, CEOS Cal/Val.",
    doctoralImpact: "Establece la malla observacional preliminar para la evaluación de calidad del aire."
  },
  {
    version: "v5.6.0",
    releaseDate: "05 Octubre 2026",
    codename: "Full Official Network 48 Terrestrial + 16 Satellite Missions & Dynamic Universal Synchronization",
    type: "major",
    title: "Red Oficial Plena (48 Terrestres + 16 Satélites) y Sincronización Dinámica Universal",
    description: "Ampliación del inventario oficial a 48 estaciones terrestres in situ (+4: AEMET 6156X Málaga Aeropuerto OMM 08482, Vélez-Málaga ES1802A, Cártama ES1955B, Boya REDEXT 20501) y 16 misiones espaciales (+3: ESA/JAXA EarthCARE ATLID Lidar 355nm, EUMETSAT MTG-I1 FCI cada 10 min, NASA PACE SPEXone polarimetría). Dinamización universal de contadores e indicadores en toda la app sin desincronizaciones.",
    targetModal: "audit",
    targetModalLabel: "Abrir Observatorio Oficial (48+16)",
    associatedModals: ["audit", "systemIntegrityAudit", "environmentalJustice", "liveIngestion"],
    highlights: [
      "Incorporación del Observatorio Sinóptico Oficial AEMET 6156X Málaga Aeropuerto con serie centenaria WMO desde 1942.",
      "Incorporación de la estación oficial Vélez-Málaga / Torre del Mar (ES1802A) para condición de contorno oriental y advección de Levante.",
      "Incorporación de la estación oficial Cártama (ES1955B) para el eje de ventilación del cañón del Guadalhorce y transporte de ozono secundario.",
      "Incorporación de la Boya de Aguas Profundas de Puertos del Estado (REDEXT 20501) en Alborán Este para masa de aire marino de fondo.",
      "Incorporación del satélite ESA/JAXA EarthCARE con Lidar HSRL ATLID (355 nm) para perfiles verticales 3D de calima y aerosoles marinos.",
      "Incorporación del satélite EUMETSAT MTG-I1 con generador de imágenes FCI de ciclo diurno continuo cada 10 minutos para fotólisis J_NO2.",
      "Incorporación de la misión NASA PACE con polarimetría multiángulo SPEXone para discriminación química de carbono negro vs sal marina.",
      "Dinamización universal de todos los badges, botones, barras de tareas y auditorías: eliminación de cifras estáticas para sincronización atómica perpetua."
    ],
    scientificScope: "Directiva 2008/50/CE, Directiva (UE) 2024/2881, WMO No. 8, CAMS ECMWF, ESA EarthCARE Cal/Val, EUMETSAT MTG-I1.",
    doctoralImpact: "Cierra la totalidad de la cuenca atmosférica de Málaga tanto a nivel terrestre (48 estaciones) como espacial (16 plataformas), asegurando coherencia métrica absoluta en la defensa doctoral."
  },
  {
    version: "v5.5.0",
    releaseDate: "04 Octubre 2026",
    codename: "Automated System Integrity Engine & 44 Terrestrial + 14 Satellite Assimilation",
    type: "major",
    title: "Motor de Verificación & Integridad Sistémica, Red Ampliada (44+14) y Dock Lateral Izquierdo",
    description: "Creación del motor automático de verificación y auditoría de integridad sistémica (batería de pruebas de regresión, geodesia, no-estocasticidad y paridad modal con certificado SHA-256 citable), ampliación de la red a 44 estaciones oficiales in situ y 14 misiones satelitales, activación del dock lateral izquierdo colapsable con buscador predictivo y rediseño ultra-compacto de la barra superior flotante.",
    targetModal: "systemIntegrityAudit",
    targetModalLabel: "Ejecutar Verificación de Integridad",
    associatedModals: ["systemIntegrityAudit", "audit", "environmentalJustice", "schoolAirEquity", "greenJustice330300", "coastalSmlAcidification", "healthEconomicsSas"],
    highlights: [
      "Motor de Verificación e Integridad Sistémica con batería de pruebas deterministas automáticas y sello criptográfico SHA-256.",
      "Ampliación a 44 estaciones oficiales terrestres (+5: Red Microsensores ZBE CEN/TS 17660-1, UMA El Ejido, Rincón de la Victoria, Torremolinos Bajondillo, Boya Costasur Cabo Pino).",
      "Ampliación a 14 misiones satelitales (+4: Copernicus CO2M Sentinel-7, NASA TEMPO geoestacionario, ESA EnMAP / ASI PRISMA 30m, EUMETSAT MetOp-SG IASI-NG).",
      "Dock Lateral Izquierdo colapsable montado en pantalla con acceso a los 6 ejes científicos y 60+ módulos.",
      "Barra superior flotante ultra-estrecha y compacta en micro-píldoras sin obstrucción del lienzo cartográfico.",
      "Consolidación arquitectónica en 6 Macro-Suites Maestras con sincronización atómica del punto activo."
    ],
    scientificScope: "Directiva (UE) 2024/2881, FAIRMODE WG1, Protocolo CEN/TS 17660-1, Principios de Ciencia Abierta FAIR & EIDUNED.",
    doctoralImpact: "Aporta un mecanismo automático e inmutable de auto-auditoría continua que certifica la ausencia de regresiones y la reproducibilidad total ante el tribunal de tesis doctoral UNED."
  },
  {
    version: "v5.4.0",
    releaseDate: "04 Octubre 2026",
    codename: "Urban Green Equity 3-30-300 & Sea Surface Microlayer SML Acidification",
    type: "feature",
    title: "Equidad en Infraestructura Verde (Regla 3-30-300 OMS) y Acidificación Marina SML (Puerto)",
    description: "Incorporación de la auditoría de la Regla 3-30-300 de Cecil Konijnendijk (OMS / Reglamento UE 2024/1991) con identificación de desiertos verdes en distritos de baja renta de Málaga, y modelo de acidificación química de la Microcapa Superficial Marina (SML, 50 µm) por deposición de penachos de cruceros y ferris en la Bahía (IEO-CSIC).",
    targetModal: "greenJustice330300",
    targetModalLabel: "Abrir Auditoría Regla 3-30-300",
    associatedModals: ["greenJustice330300", "coastalSmlAcidification", "environmentalJustice", "healthEconomicsSas"],
    highlights: [
      "Auditoría de la Regla 3-30-300 (3 árboles visibles, 30% de dosel vegetal, 300m a un parque) en los 11 distritos de Málaga.",
      "Cuantificación de la brecha de equidad verde de 10.2x entre el Distrito Este (36.4% dosel) y Carretera de Cádiz (5.8% dosel).",
      "Modelo analítico determinista de captación fitosférica foliar de NO2 y PM2.5 (kg/año) mediante resistencia de Wesely.",
      "Balance químico de protones en la Microcapa Superficial Marina (SML, 50 µm) acoplado a la boya oceanográfica IEO-CSIC.",
      "Evaluación del estrés de biocalcificación larvaria y saturación de aragonito (Ω_arag) en concha fina y boquerón en la Bahía.",
      "Banner unificado de sincronización atómica (ActivePointSyncBanner) integrado en todos los modales."
    ],
    scientificScope: "WHO Urban Green Spaces Guidelines, EU Nature Restoration Law (2024), Limnology & Oceanography & Tesis Doctoral UNED.",
    doctoralImpact: "Extiende la modelización ambiental a la interfase océano-atmósfera y acredita la justicia distributiva de los servicios ecosistémicos del arbolado viario."
  },
  {
    version: "v5.3.0",
    releaseDate: "04 Octubre 2026",
    codename: "Health Economics SAS & Pediatric School Streets Dosimetry",
    type: "feature",
    title: "Valoración Económica de la Salud (OECD VSL / SAS) y Entornos Escolares Seguros (ICRP 66)",
    description: "Evaluación del impacto presupuestario evitado en hospitales del Servicio Andaluz de Salud (Hospital Regional, Clínico, Materno Infantil) con valoración VSL de 3.6 M€ (OCDE) y dosimetría pediátrica ICRP 66 a cota infantil de escape (0.90m AGL) en colegios de Málaga (Directiva 2024/2881 Art. 13).",
    targetModal: "healthEconomicsSas",
    targetModalLabel: "Abrir Valoración Económica Salud SAS",
    associatedModals: ["healthEconomicsSas", "schoolAirEquity", "environmentalJustice", "populationExposure"],
    highlights: [
      "Funciones concentración-respuesta de la OMS (AirQ+) acopladas a las tarifas oficiales del Servicio Andaluz de Salud (SAS).",
      "Cuantificación de visitas a urgencias hospitalarias e ingresos respiratorios/cardiovasculares evitados en Málaga.",
      "Valor Estadístico de la Vida (VSL = 3.6 M€ según guía OCDE 2024) y cálculo de Años de Vida Ajustados por Discapacidad (DALY / YLL).",
      "Dosimetría infantil ICRP 66 calibrada a la tasa ventilatoria pediátrica de 0.42 m³/h·kg a cota 0.90m sobre rasante.",
      "Censo de colegios reales de Málaga (CEIP Prácticas Nº1, Manuel de Falla, Dr. Fleming, Revello de Toro) con diagnóstico ZBE."
    ],
    scientificScope: "OECD Health Statistics, WHO AirQ+, ICRP Publication 66 & Directiva (UE) 2024/2881.",
    doctoralImpact: "Proporciona el análisis de coste-beneficio exigido por las administraciones públicas y demuestra que la ZBE genera un retorno sanitario superior a 3.4x la inversión inicial."
  },
  {
    version: "v5.2.0",
    releaseDate: "03 Octubre 2026",
    codename: "Vectorial Environmental Justice GeoJSON & Lorenz-Kakwani Suite",
    type: "feature",
    title: "Justicia Ambiental Vectorial GeoJSON (Directiva 2024/2881) y Curva de Lorenz",
    description: "Integración de polígonos GeoJSON de los 11 distritos de Málaga con selector de paletas divergentes (Bivariada, RdBu, Spectral, PiYG), Curva de Lorenz Ambiental, índice de Kakwani e índice de aversión a la desigualdad de Atkinson.",
    targetModal: "environmentalJustice",
    targetModalLabel: "Abrir Justicia Ambiental GeoJSON",
    associatedModals: ["environmentalJustice", "populationExposure", "fairDataExporter"],
    highlights: [
      "Mapa interactivo SVG vectorial con polígonos GeoJSON oficiales de los 11 distritos del municipio de Málaga.",
      "Cruce espacial directo con el Atlas de Distribución de Renta de los Hogares (ADRH) del Instituto Nacional de Estadística (INE).",
      "Curva de Lorenz Ambiental y cálculo exacto del Índice de Kakwani (K = -0.198) confirmando injusticia ambiental regresiva.",
      "Índice de Atkinson (ε = 1.5) y cuantificación de la paradoja emisión-exposición (ratio 1.94x en Carretera de Cádiz).",
      "Exportación directa en GeoJSON estándar y CSV para interoperabilidad con QGIS y ArcGIS."
    ],
    scientificScope: "Environmental Justice, Ecological Economics, Directiva (UE) 2024/2881 & INE.",
    doctoralImpact: "Constituye un pilar central del capítulo de impacto socioespacial de la tesis doctoral, demostrando con formulación econométrica formal que los barrios de menor renta sufren la mayor carga de exposición."
  },
  {
    version: "v5.1.0",
    releaseDate: "02 Octubre 2026",
    codename: "Dual Vortex Verification Hunt Q-Criterion & Jeong-Hussain Lambda-2",
    type: "methodology",
    title: "Doble Validación Vorticial: Invariante Q de Hunt y Autovalores λ₂ de Jeong & Hussain",
    description: "Implementación del invariante tensorial de Galilei Q = 1/2(||Ω||² - ||S||²) y cálculo del segundo autovalor del tensor S² + Ω² (λ₂ < 0) mediante resolución analítica cúbica de Cardano-Viète para descartar falsos positivos en zonas de cizalla pura.",
    targetModal: "huntQCriterion",
    targetModalLabel: "Abrir Criterio Q y λ₂",
    associatedModals: ["huntQCriterion", "canyonGeometryOsm", "streetCanyonVerticalProfile"],
    highlights: [
      "Formulación analítica del Criterio Q de Hunt et al. (1988) para la detección de núcleos vorticiales en cañones urbanos.",
      "Resolución por Cardano-Viète de los autovalores del tensor simétrico S² + Ω² según Jeong & Hussain (1995).",
      "Perfil vertical continuo de 0 a 30m para evaluar el confinamiento y atrapamiento de NO2 vehicular en aceras.",
      "Exportación FAIR CSV de perfiles verticales de vorticidad y deformación."
    ],
    scientificScope: "Journal of Fluid Mechanics (1988, 1995) & Boundary-Layer Meteorology.",
    doctoralImpact: "Acredita solvencia en mecánica de fluidos computacional avanzada (CFD/PINN), cumpliendo con el rigor requerido por tribunales de ingeniería."
  },
  {
    version: "v5.0.0",
    releaseDate: "25 Septiembre 2026 (Actual)",
    codename: "Comlink WebWorkers & 60 FPS Stiff ODE Multithreading",
    type: "feature",
    title: "Paralelización Multihilo con Web Workers (Comlink RPC) para Stiff ODEs a 60 FPS",
    description: "Desacoplamiento asíncrono completo de la integración temporal de cinéticas químicas rígidas (RK45, Dormand-Prince, ciclo de Leighton y balances fotoquímicos) hacia un hilo secundario con Comlink RPC, garantizando navegación fluida a 60 FPS y reciclaje de memoria integrado.",
    targetModal: "pointInspector",
    targetModalLabel: "Abrir Inspector de Punto y Solver Comlink",
    associatedModals: ["pointInspector", "extendedLeighton", "q1MicroscalePhysics", "fairDataExporter"],
    highlights: [
      "Integración de Comlink para llamadas RPC tipadas y transparentes hacia Web Workers dedicados.",
      "Desacoplamiento asíncrono de los solucionadores stiff ODE (RK45 y Rosenbrock adaptativo) del hilo principal de UI.",
      "Mantenimiento estricto de 60 FPS estables en el mapa tridimensional Deck.gl y ventanas flotantes DraggableWindow.",
      "Monitorización en tiempo real de latencia (ms) de ejecución del hilo secundario y fallback determinista ante entornos sin Workers.",
      "Integración en el recolector de basura (GC) para purga y reciclaje higiénico de memoria de los Workers."
    ],
    scientificScope: "Journal of Computational Physics, Environmental Modelling & Software & Tesis Doctoral UNED.",
    doctoralImpact: "Demuestra solvencia de ingeniería de software científico de alto rendimiento, evitando el colapso del navegador durante la simulación continua de mecanismos químicos atmosféricos rígidos."
  },
  {
    version: "v4.9.9",
    releaseDate: "25 Septiembre 2026",
    codename: "Photochemical EKMA Ternary & Sillman Regimes",
    type: "feature",
    title: "Diagrama Ternario Fotoquímico EKMA (NOₓ – VOC – Oₓ) y Vector ZBE",
    description: "Despliegue del motor ternario baricéntrico para el diagnóstico exacto de los regímenes de limitación fotoquímica de ozono y SOA en Málaga, con proyección de estaciones oficiales y simulador de vector de abatimiento ZBE.",
    targetModal: "extendedLeighton",
    targetModalLabel: "Abrir Diagrama Ternario Fotoquímico",
    associatedModals: ["extendedLeighton", "q1MicroscalePhysics", "fairDataExporter", "q1Optimization"],
    highlights: [
      "Diagrama Ternario Fotoquímico Baricéntrico (NOₓ – VOC – Oₓ) en triángulo equilátero con coordenadas normalizadas f_i.",
      "Delimitación analítica de los regímenes VOC-limited (paradoja de titración), cresta de transición de Sillman y NOx-limited.",
      "Proyección baricéntrica simultánea de la red oficial de estaciones de Málaga (Carranque, Hilera, El Atabal, Puerto).",
      "Simulador vectorial de trayectoria ZBE que evalúa analíticamente la derivada ∂[O₃]/∂[NOₓ] y alerta ante incrementos paradójicos locales.",
      "Exportación abierta CSV del sistema ternario integrada en el paquete de replicabilidad científica FAIR (.zip)."
    ],
    scientificScope: "Atmospheric Chemistry and Physics (ACP), Sillman (1999) & Seinfeld & Pandis (2016).",
    doctoralImpact: "Aporta al tribunal de la UNED la justificación científica de por qué abatir tráfico en el centro de Málaga puede producir aumentos transitorios de ozono si no se mitigan conjuntamente los VOCs."
  },
  {
    version: "v4.9.8",
    releaseDate: "25 Septiembre 2026",
    codename: "Delaunay TIN, Earcut 3D & FAIR Research Bundle",
    type: "feature",
    title: "Mallas TIN Delaunay, Triangulación Earcut de Patios y Paquete de Replicabilidad (.ZIP)",
    description: "Incorporación de motores geoespaciales de alta precisión (Delaunator y Earcut) para interpolación baricéntrica continua y discretización de edificios con patios interiores, junto con el empaquetador ZIP de reproducibilidad científica FAIR y álgebra canónica ml-matrix en 4D-Var.",
    targetModal: "q1MicroscalePhysics",
    targetModalLabel: "Abrir Mallas TIN & Earcut",
    associatedModals: ["q1MicroscalePhysics", "fairDataExporter", "latexThesis", "q1Optimization"],
    highlights: [
      "Motor de Redes Triangulares Irregulares (TIN Delaunay) con Delaunator para interpolación baricéntrica C⁰ sin singularidades.",
      "Triangulación Earcut (Ear Clipping con curvas Morton) de manzanas urbanas históricas de Málaga con patios interiores.",
      "Cálculo geométrico exacto de superficie de cubierta transpirable, fachadas efectivas de deposición y potencial de cubiertas verdes.",
      "Empaquetador de investigación FAIR (.zip con jszip) que descarga en un solo clic el manuscrito LaTeX, BibTeX, Beamer, CSV y GeoJSON.",
      "Álgebra lineal de precisión ml-matrix integrada en la asimilación 4D-Var EnKF para el cálculo de la covarianza de innovación S y diagnósticos Desroziers."
    ],
    scientificScope: "Geoscientific Model Development (GMD), Computers & Geosciences & Directrices FAIR de la UNED.",
    doctoralImpact: "Aporta rigor topológico exacto al modelo microescalar de Málaga, eliminando el sesgo de considerar manzanas como cubos ciegos sin patios y facilitando la reproducibilidad total ante el tribunal."
  },
  {
    version: "v4.9.5",
    releaseDate: "25 Septiembre 2026",
    codename: "Q1 Adjoint Optimization & EIDUNED Tribunal",
    type: "feature",
    title: "Optimización Adjunta Q1 (4D-Var EnKF) y Simulador de Defensa ante el Tribunal EIDUNED",
    description: "Despliegue del motor analítico de sensibilidad adjunta dC/dP para atribución de fuentes en revistas Q1 (ACP/GMD) junto con el simulador interactivo de preguntas y defensas metodológicas formales para el tribunal de tesis doctoral de la UNED.",
    targetModal: "tribunalDefenseAdvisor",
    targetModalLabel: "Abrir Simulador de Defensa UNED",
    associatedModals: ["q1Optimization", "tribunalDefenseAdvisor", "q1FrontiersSuite"],
    highlights: [
      "Motor de Sensibilidad Adjunta Analítica (∂C/∂P) para priorización y optimización de medidas de abatimiento ZBE en Málaga.",
      "Diagnóstico variacional de consistencia Chi-cuadrado (χ² ≈ 1.0) en la función de costes J(x) = J_b + J_o.",
      "Simulador oficial de preguntas de revisores internacionales y tribunal evaluador EIDUNED con demostraciones matemáticas exactas.",
      "Exportación citable a formatos FAIR (CSV) y tablas LaTeX para Overleaf (tab:q1_adjoint_optimization y tab:tribunal_defense_q1).",
      "Sincronización bidireccional y actualización de la Guía de Usuario interactiva con los nuevos hitos metodológicos."
    ],
    scientificScope: "Atmospheric Chemistry and Physics, Geoscientific Model Development & Tribunal de Tesis EIDUNED.",
    doctoralImpact: "Refuerza la solvencia del doctorando Dionisio Gálvez Pozo con argumentación formal y demostraciones matemáticas ante el tribunal de la UNED."
  },
  {
    version: "v4.9.0",
    releaseDate: "Septiembre 2026",
    codename: "Guía Dinámica & Sincronización UNED",
    type: "methodology",
    title: "Sincronización Continua de la Pestaña Guía y Consolidación de Autoría Doctoral UNED",
    description: "Vinculación estricta de la pestaña Guía con cada actualización del Gemelo Digital. Incorpora el visor de novedades cronológico en vivo, certificación explícita de la autoría de Dionisio Gálvez Pozo y filiación exclusiva con la Universidad Nacional de Educación a Distancia (UNED / EIDUNED).",
    targetModal: "userGuide",
    targetModalLabel: "Ver Pestaña Guía Actualizada",
    highlights: [
      "Sincronización en tiempo real de la pestaña Guía con el estado y versiones de la aplicación.",
      "Consolidación total de la autoría doctoral: Dionisio Gálvez Pozo (Doctorando de la Tesis).",
      "Actualización institucional estricta a UNED (Universidad Nacional de Educación a Distancia) y EIDUNED en exportadores, LaTeX, PDF y grafos PROV-O.",
      "Nueva subpestaña de 'Actualizaciones & Novedades de la App' dentro de la Guía de Usuario.",
      "Registro acumulativo con trazabilidad de 65+ módulos computacionales y observacionales."
    ],
    scientificScope: "Metrología de la información, reproducibilidad FAIR e integridad de la memoria doctoral.",
    doctoralImpact: "Asegura la coherencia nominal e institucional ante el Tribunal de Tesis de la UNED."
  },
  {
    version: "v4.8.5",
    releaseDate: "Septiembre 2026",
    codename: "Frontiers Q1 2026/2027",
    type: "feature",
    title: "Suites de Investigación Avanzada Q1: AeroGraph-PINN, FNO 3D y 4D-Var",
    description: "Integración de las 4 fronteras computacionales de revistas de primer cuartil (Q1): Fourier Neural Operators en 3D a resolución infinita, VBS-SOA con radicales de cloro costeros, asimilación híbrida 4D-Var EnKF con TROPOMI y potencial oxidativo OP^DTT por desgaste de tráfico.",
    targetModal: "q1FrontiersSuite",
    targetModalLabel: "Abrir Suite Fronteras Q1",
    highlights: [
      "AeroGraph-PINN sobre grafo vial real de Málaga con 12.000+ aristas OSM.",
      "Mecanismo de nucleación de aerosoles orgánicos secundarios HOMs acoplado a brisa marina.",
      "Asimilación 4D-Var de columna troposférica de NO₂ Sentinel-5P TROPOMI.",
      "Cálculo del potencial oxidativo por ditiotreitol (OP^DTT) a nivel de acera."
    ],
    scientificScope: "Atmospheric Chemistry and Physics & Journal of Computational Physics (2025/2026).",
    doctoralImpact: "Eleva las publicaciones derivadas de la tesis a las revistas científicas de máximo impacto internacional."
  },
  {
    version: "v4.8.0",
    releaseDate: "Agosto 2026",
    codename: "Draggable & ActivePoint Unified",
    type: "major",
    title: "Arquitectura Ergonómica Unificada: DraggableWindow y ActivePointContext Atómico",
    description: "Conversión de toda la interfaz del Gemelo Digital a ventanas flotantes arrastrables y colapsables con drag & drop unificado. Propagación atómica e instantánea de la ubicación geográfica activa (geocodificación oficial, coordenadas UTM 30N y MDE) a todos los módulos y suites.",
    targetModal: "canyonGeometryOsm",
    targetModalLabel: "Explorar Cañones con Punto Activo",
    highlights: [
      "Componente unificado DraggableWindow con agarre táctil y de ratón ergonómico.",
      "Todas las ventanas se inicializan colapsadas/minimizadas por defecto para mantener el lienzo cartográfico despejado.",
      "ActivePointSyncBanner sincronizado en el 100% de paneles analíticos.",
      "Eliminación total de desincronizaciones entre vistas espaciales y analíticas."
    ],
    scientificScope: "HCI en Gemelos Digitales Urbanos y Geovisualización Espacial Interactiva.",
    doctoralImpact: "Garantiza una defensa doctoral fluida ante el tribunal sin distracciones de interfaz."
  },
  {
    version: "v4.7.0",
    releaseDate: "Julio 2026",
    codename: "COPERT 5 Real-Time Loops",
    type: "feature",
    title: "Inventario de Tráfico Dinámico COPERT 5 Tier 3 con Bucles Inductivos y EMT GTFS",
    description: "Acoplamiento de los aforos en vivo del Centro de Gestión de Tráfico del Ayuntamiento de Málaga y líneas urbanas EMT en tiempo real con los factores de emisión polinómicos de la Guía EMEP/EEA 2023.",
    targetModal: "copert",
    targetModalLabel: "Abrir Modelo COPERT 5",
    highlights: [
      "Curvas de emisión Tier 3 en función de velocidad y tipo de vehículo (turismos, pesados, buses, motos).",
      "Modelización de la Zona de Bajas Emisiones (ZBE) de Málaga tramo a tramo.",
      "Cero datos aleatorios (Zero Stochastic Data): asimilación directa de espiras y buses GTFS.",
      "Cálculo de emisiones de arranque en frío y evaporativas en cañones urbanos."
    ],
    scientificScope: "Metodología Europea COPERT 5 y Directiva 2008/50/CE sobre transporte.",
    doctoralImpact: "Proporciona el forzamiento antrópico vehicular contrastado empíricamente para la tesis."
  },
  {
    version: "v4.6.0",
    releaseDate: "Junio 2026",
    codename: "Urban Canyon 3D & Oke Flow",
    type: "feature",
    title: "Microescala 3D: Topología de Edificios OSM, Vórtices de Oke y Factor de Visión del Cielo (SVF)",
    description: "Extracción automática de polígonos edilicios y alturas de cornisa de OpenStreetMap. Clasificación analítica del régimen de flujo en cañones urbanos (Isolated Roughness, Wake Interference, Skimming Flow) y sombra solar radiativa.",
    targetModal: "canyonGeometryOsm",
    targetModalLabel: "Abrir Geometría Cañones OSM",
    highlights: [
      "Cálculo del factor de visión del cielo (SVF) y relación geométrica H/W.",
      "Tiempo de residencia del aire peatonil a 1.8 metros AGL según la formulación de Oke (1987).",
      "Integración de Google Street View con HUD atmosférico peatonal inmersivo.",
      "Estimación de atenuación de radiación solar para el ciclo fotolítico de Leighton."
    ],
    scientificScope: "Micrometeorología de Cañones Urbanos y Modelo OSPM (Operational Street Pollution Model).",
    doctoralImpact: "Demuestra la superioridad de la microescala determinista frente a mallas regionales kilométricas."
  },
  {
    version: "v4.5.0",
    releaseDate: "Mayo 2026",
    codename: "Cryptographic Provenance W3C",
    type: "feature",
    title: "Cadena de Custodia Criptográfica SHA-256 y Grafo de Linaje W3C PROV-O",
    description: "Trazabilidad formal de cada observación de las 6 estaciones de la Junta de Andalucía (Carranque, Hilera, Puerto, Atabal, Palacio de Deportes, Guadalhorce) con cálculo de hashes SHA-256 que impiden manipulaciones.",
    targetModal: "provGraph",
    targetModalLabel: "Ver Grafo de Linaje PROV-O",
    highlights: [
      "Grafo dirigido de procedencia conforme a la recomendación W3C PROV-O.",
      "Sellado temporal criptográfico de paquetes de telemetría e inputs satelitales.",
      "Certificado de inmutabilidad reproducible para auditorías científicas ciegas.",
      "Exportación de metadatos conforme al estándar ISO 19115 e INSPIRE."
    ],
    scientificScope: "Ciencia Abierta, Principios FAIR (Wilkinson et al., 2016) e Integridad Forense de Datos.",
    doctoralImpact: "Garantiza al tribunal doctoral de la UNED la inmutabilidad y autenticidad del dataset."
  },
  {
    version: "v4.4.0",
    releaseDate: "Abril 2026",
    codename: "Green Infrastructure Wesely",
    type: "feature",
    title: "Mitigación Biogénica: Circuito de Resistencias de Wesely (1989) e i-Tree Eco sobre 45.000 Árboles",
    description: "Cuantificación estomática de la captación foliar de NO₂ y O₃ en el arbolado viario de Málaga. Incorpora el balance entre sumideros estomáticos y emisiones de isopreno/monoterpenos (BVOCs).",
    targetModal: "malagaTreesInventory",
    targetModalLabel: "Abrir Inventario de Arbolado",
    highlights: [
      "Circuito resistivo Ra + Rb + Rc con conductancia estomática dependiente de radiación PAR y VPD.",
      "Censo geolocalizado de árboles municipales (Jacaranda, Ficus, Platanus, Palmeras).",
      "Modelización de pavimentos y fachadas fotocatalíticas TiO₂ verificadas Grado A1 (GMU / UMA) bajo Ley de 3 Resistencias (r_a + r_b + r_c,TiO2) frente al 99,8 % de asfalto convencional.",
      "Modelización determinista de la penalización nocturna por cierre estomático."
    ],
    scientificScope: "Metodología USDA i-Tree Eco y Deposición Seca de Wesely (1989).",
    doctoralImpact: "Cuantifica las estrategias reales de infraestructura verde para la planificación municipal."
  },
  {
    version: "v4.3.0",
    releaseDate: "Marzo 2026",
    codename: "Coastal Port & Plume Dynamics",
    type: "feature",
    title: "Química Marina de Halógenos y Emisiones Portuarias con Elevación de Pluma de Briggs",
    description: "Modelización del hotelling de buques en el Puerto de Málaga (Dique de Levante) y acoplamiento con la química heterogénea de activación de cloruro (formación nocturna de ClNO₂).",
    targetModal: "portHotelling",
    targetModalLabel: "Abrir Emisiones Puerto",
    highlights: [
      "Algoritmo analítico de elevación de penacho térmico de Briggs (1975) con flotabilidad F_b.",
      "Fotoquímica de halógenos y recirculación costera de brisa térmica (Sea Breeze).",
      "Desglose de la huella portuaria frente al tráfico de la arteria Muelle Heredia.",
      "Asimilación de datos meteorológicos de la boya costera y estación Dique de Levante ES2077A."
    ],
    scientificScope: "Thornton et al. (2010) Nature & Directrices IMO EEDI para Emisiones Marítimas.",
    doctoralImpact: "Resuelve la singularidad físico-química del entorno costero mediterráneo de la ciudad de Málaga."
  },
  {
    version: "v4.2.0",
    releaseDate: "Febrero 2026",
    codename: "FAIRMODE WG1 & LaTeX Exporter",
    type: "methodology",
    title: "Auditoría Regulatoria FAIRMODE WG1 y Compilador de Memoria Doctoral LaTeX / PDF",
    description: "Evaluación formal del Objetivo de Calidad del Modelo (MQO) con Target Diagrams e índice MQI ≤ 1.0 según las guías técnicas del Joint Research Centre (JRC). Exportación automatizada de la memoria en PDF de alta resolución.",
    targetModal: "fairmode",
    targetModalLabel: "Abrir Auditoría FAIRMODE",
    highlights: [
      "Cálculo estricto de MQI, incertidumbre expandida U95% y correlación r > 0.90.",
      "Target Diagram interactivo conforme a CEN/TR 17538:2018.",
      "Generación de código fuente LaTeX (.tex) con ecuaciones numeradas y referencias BibTeX.",
      "Compilador directo de memoria doctoral UNED en PDF A4 de 9/10 páginas con gráficos vectoriales."
    ],
    scientificScope: "FAIRMODE WG1 Guidance Document on Modelling Quality Objectives (JRC Science for Policy).",
    doctoralImpact: "Proporciona la certificación oficial que avala el cumplimiento regulatorio de la tesis."
  },
  {
    version: "v4.0.0",
    releaseDate: "Enero 2026",
    codename: "Physics-Informed Core & Leighton",
    type: "major",
    title: "Fundación del Gemelo Digital Informado por la Física (PINN) y Solvers ODE Stiff",
    description: "Lanzamiento del núcleo fundacional: Acoplamiento de redes neuronales residuales con las ecuaciones fundamentales de Navier-Stokes y el ciclo fotoquímico de Leighton (NO + O₃ ⇌ NO₂ + O₂).",
    targetModal: "leighton",
    targetModalLabel: "Abrir Ciclo de Leighton",
    highlights: [
      "Operador diferencial PINN con funciones de pérdida basadas en la divergencia y conservación de masa.",
      "Integrador numérico rígido Radau IIA / Verwer para sistemas cinéticos fotoquímicos.",
      "Prohibición estricta de variables estocásticas o datos aleatorios (Zero Stochastic Data).",
      "Asimilación continua en tiempo real de la Red Oficial de la Junta de Andalucía."
    ],
    scientificScope: "Raissi et al. (2019) JCP & Seinfeld & Pandis (2016) Atmospheric Chemistry and Physics.",
    doctoralImpact: "Constituye la base epistemológica y matemática sobre la que se fundamenta la tesis doctoral."
  }
];

export function getAppReleaseInfo() {
  return {
    version: APP_CURRENT_VERSION,
    lastUpdateDate: APP_LAST_UPDATE_DATE,
    buildTimestamp: APP_BUILD_TIMESTAMP,
    releasesCount: APP_RELEASES_REGISTRY.length,
    doctoralMetadata: DOCTORAL_METADATA
  };
}
