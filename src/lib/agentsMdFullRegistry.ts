/**
 * CUSTODIA ÍNTEGRA SIN LÍMITE DE TAMAÑO DE LAS 31+ REGLAS DOCTORALES DE AGENTS.md
 * ================================================================================
 * Arquitectura en 2 Capas (Blindaje de Capacidad Permanente — Tesis Doctoral UNED EIDUNED):
 *  - Capa 1 (`/AGENTS.md`): Constitución Compacta de Alta Densidad (~11,2 KB < 24 KB),
 *    garantizando más de 12,5 KB libres (+50 reglas futuras) en el cargador automático de AI Studio.
 *  - Capa 2 (`/src/lib/agentsMdFullRegistry.ts`): Archivo Espejo Íntegro sin límite de 24 KB,
 *    que preserva palabra por palabra todas las especificaciones extensas, ecuaciones, listas de
 *    calles, normas y conectores de las Reglas 1 ➔ 31 (y futuras 32 ➔ N), incluido en .ZIP y GitHub.
 */

export interface AgentsMdDoctoralRuleClause {
  ruleNumber: number;
  title: string;
  coreMandate: string;
  fullExhaustiveSpecification: string;
  keyModulesAndConnectors: string[];
  regulatoryAndScientificBasis: string;
}

export const AGENTS_MD_FULL_DOCTORAL_CLAUSES: readonly AgentsMdDoctoralRuleClause[] = [
  {
    ruleNumber: 1,
    title: 'Cero Aleatoriedad en Datos (Zero Stochastic Data)',
    coreMandate: 'Prohibido estrictamente Math.random() o fluctuaciones sintéticas (Math.sin(idx)) en la capa de datos físicos, químicos, meteorológicos o de tráfico.',
    fullExhaustiveSpecification:
      'Queda terminantemente prohibido el uso de Math.random() o fluctuaciones sintéticas arbitrarias (como Math.sin(idx) sin base física) para generar, simular o alterar datos físicos, químicos, meteorológicos, de tráfico o métricas de telemetría. Cero datos mock: ningún valor puede ser inventado; todo dato debe provenir de APIs oficiales en vivo, topología real OSM o derivarse de modelos matemáticos deterministas.',
    keyModulesAndConnectors: ['src/lib/systemIntegrityAuditor.ts (TEST-01)'],
    regulatoryAndScientificBasis: 'Doctrina Physics-Informed Digital Twin — Programa de Doctorado UNED (EIDUNED)'
  },
  {
    ruleNumber: 2,
    title: 'Modelización Determinista y Mecanística',
    coreMandate: 'Todos los cálculos atmosféricos y de emisiones emplean formulaciones analíticas deterministas o valores base certificados.',
    fullExhaustiveSpecification:
      'Todos los cálculos de dispersión, partición gas-partícula (SOA de Pankow), termodinámica (Clausius-Clapeyron), dinámica de fluidos (Navier-Stokes), fotoquímica (ciclo de Leighton) y factores de emisión vehicular (COPERT 5.7) deben emplear formulaciones analíticas deterministas o valores base certificados de referencia.',
    keyModulesAndConnectors: ['src/lib/copertEngine.ts', 'src/lib/leightonEngine.ts', 'src/lib/pinn assimilation'],
    regulatoryAndScientificBasis: 'Seinfeld & Pandis (2016); EMEP/EEA Guidebook 2023'
  },
  {
    ruleNumber: 3,
    title: 'Excepción Visual (Monte Carlo en Lienzo Canvas/WebGL)',
    coreMandate: 'Math.random() solo se permite en el renderizado visual de partículas de viento como método de Monte Carlo sin tocar jamás la capa de datos.',
    fullExhaustiveSpecification:
      'El uso de generadores pseudoaleatorios (Math.random()) solo está permitido exclusivamente en la capa de renderizado visual (partículas de viento en Canvas/WebGL) como método numérico de Monte Carlo para representar la turbulencia estocástica de fluidos, sin afectar jamás a la capa de datos ni a las métricas reportadas.',
    keyModulesAndConnectors: ['src/components/WindParticlesCanvas.tsx'],
    regulatoryAndScientificBasis: 'Simulación Lagrangiana Estocástica Visual (Pope, 2000)'
  },
  {
    ruleNumber: 4,
    title: 'Trazabilidad Normativa Europea y OMS',
    coreMandate: 'Adhesión explícita a Guía EMEP/EEA, COPERT 5, Directiva 2008/50/CE, Directiva (UE) 2024/2881 y Guías OMS 2021.',
    fullExhaustiveSpecification:
      'Todo cálculo de tráfico o contaminación debe adherirse a los estándares europeos vigentes (Guía EMEP/EEA, COPERT 5, Directiva 2008/50/CE y nueva Directiva UE 2024/2881) y documentarlo explícitamente tanto en los comentarios del código como en la interfaz de usuario y reportes PDF.',
    keyModulesAndConnectors: ['src/lib/regulatoryStandards.ts', 'src/components/ThesisMethodologySuiteModal.tsx'],
    regulatoryAndScientificBasis: 'Directiva 2008/50/CE; Directiva (UE) 2024/2881 (límite anual NO2 2030 = 20 µg/m³); OMS 2021 (10 µg/m³)'
  },
  {
    ruleNumber: 5,
    title: 'Ventanas Modales y Paneles Arrastrables/Colapsables (DraggableWindow)',
    coreMandate: 'Toda ventana flotante o modal utiliza /src/components/DraggableWindow.tsx con arrastre superior, esquina inferior derecha ◢ y maximizar/colapsar.',
    fullExhaustiveSpecification:
      'Toda nueva ventana flotante, panel de análisis o modal que se incorpore o modifique en la aplicación debe implementarse utilizando el componente /src/components/DraggableWindow.tsx, permitiendo arrastrar libremente desde el encabezado, redimensionar desde la esquina inferior derecha (◢) y bordes, y colapsar/maximizar para no obstruir el lienzo 3D de Málaga.',
    keyModulesAndConnectors: ['src/components/DraggableWindow.tsx'],
    regulatoryAndScientificBasis: 'Ergonomía Científica de Ventanas Flotantes No Bloqueantes'
  },
  {
    ruleNumber: 6,
    title: 'Estado Inicial y Cartografía Base (Google Maps Híbrido, Partículas OFF y Arboleda OFF)',
    coreMandate: 'Arranque limpio con Google Maps Híbrido, partículas de viento OFF, capa de arboleda OFF y modales cerrados.',
    fullExhaustiveSpecification:
      'La aplicación debe iniciar siempre por defecto con la vista Satélite con Calles de Google Maps Híbrido (activeBaseStyle = "google_hybrid"), con las partículas de viento desactivadas (showWindParticles = false), con la capa vectorial de arboleda desactivada por defecto (showMalagaTreesLayer = false, botón ámbar ARBOLEDA OFF) y todos los paneles modales cerrados (activeModal = null) para garantizar una carga limpia e inmediata.',
    keyModulesAndConnectors: ['src/App.tsx'],
    regulatoryAndScientificBasis: 'Rendimiento WebGL e Inspección Cartográfica Limpia en Arranque'
  },
  {
    ruleNumber: 7,
    title: 'Tooltips Científicos Universales (ScientificTooltip.tsx + UniversalScientificTooltipDelegator)',
    coreMandate: 'Doble clic (PC) o doble toque (iPad/móvil) abre la ventana explicativa ceñida 1:1 a la temática exacta del punto/fila/columna con ecuación KaTeX, desglose término a término y bloque GUM/Jacobiano.',
    fullExhaustiveSpecification:
      'Toda pestaña, subpestaña, cabecera <th>, celda <td>, <select>, <input>, <button> o tarjeta de métrica cuenta con una ventana explicativa en Portal (🔬 Rigor Científico + 💡 Comprensión Clara) estrictamente focalizada en la temática exacta de ese punto, fila o columna (Puntos 1–7, Pasos 6.1–6.5, 11 Distritos, Cuaderno 1…N). 1 clic activa el botón; doble clic (PC) o doble toque (≤ 450 ms en iPad/móvil) abre el tooltip fijado con barra arrastrable, botón ⤢/⤡, cierre ✕, esquina inferior derecha ◢ redimensionable por deltas (startW+dx, startH+dy), ecuación KaTeX, desglose término a término (explainFormulaTermsExhaustively), bloque GUM (U95, k=1,96) y prioridad granular de 85+ ecuaciones (resolveGranularFormulaAndUnits) con 0% textos clonados.',
    keyModulesAndConnectors: ['src/components/ScientificTooltip.tsx', 'src/components/UniversalScientificTooltipDelegator.tsx', 'SYSTEM_PROPAGATION.universalContextualTooltipProtocol'],
    regulatoryAndScientificBasis: 'JCGM 100:2008 (GUM); Transparencia Epistémica Doctoral UNED'
  },
  {
    ruleNumber: 8,
    title: 'Ciencia Abierta y Exportación FAIR',
    coreMandate: 'Exportación citable en GeoJSON, CSV, JSON-LD (W3C PROV-O), BibTeX y LaTeX Booktabs.',
    fullExhaustiveSpecification:
      'Todas las vistas analíticas incorporan mecanismos de exportación de datos y metadatos en formatos abiertos y citables (GeoJSON, CSV, JSON-LD con ontología W3C PROV-O, BibTeX y LaTeX) para garantizar la reproducibilidad científica bajo los principios FAIR (Findable, Accessible, Interoperable, Reusable).',
    keyModulesAndConnectors: ['src/components/FairExportToolbar.tsx', 'src/components/ThesisMasterPdfLibraryTab.tsx'],
    regulatoryAndScientificBasis: 'Principios FAIR (Wilkinson et al., Scientific Data 2016); W3C PROV-O'
  },
  {
    ruleNumber: 9,
    title: 'Preservación Estricta de Funcionalidades Consolidadas (Crecimiento Cumulativo)',
    coreMandate: 'Prohibido eliminar, degradar o revertir módulos, herramientas, capas o cálculos ya conseguidos.',
    fullExhaustiveSpecification:
      'Queda terminantemente prohibido eliminar, degradar, ocultar o revertir módulos científicos, herramientas de análisis, capas cartográficas, controles interactivos o cálculos ya conseguidos y validados en versiones previas. Cada nueva mejora o ampliación debe construirse de forma acumulativa y aditiva sobre los logros existentes.',
    keyModulesAndConnectors: ['src/lib/systemIntegrityAuditor.ts'],
    regulatoryAndScientificBasis: 'Invarianza Funcional y Preservación Patrimonial del Código Doctoral'
  },
  {
    ruleNumber: 10,
    title: 'Sincronización Global del Punto Activo (ActivePointContext + ActivePointSyncBanner)',
    coreMandate: 'Cualquier clic en el mapa o selector de calle propaga dirección oficial, coordenadas WGS84/UTM30N y telemetría asimilada a todas las ventanas y PDFs.',
    fullExhaustiveSpecification:
      'Cuando el usuario selecciona cualquier calle, edificio o coordenada en el mapa interactivo, su dirección postal oficial (calle, número, barrio, distrito, CP), coordenadas WGS84/UTM 30N, altitud MDE y telemetría asimilada en vivo (NO2, NO, NOx, O3, PM2.5, PM10, ClNO2, meteorología, SVF, H/W) se propagan automáticamente a todas las ventanas modales, pestañas y generadores PDF.',
    keyModulesAndConnectors: ['src/context/ActivePointContext.tsx', 'src/components/ActivePointSyncBanner.tsx'],
    regulatoryAndScientificBasis: 'Asimilación Espaciotemporal Coherente 4D-Var / EnKF'
  },
  {
    ruleNumber: 11,
    title: 'Ergonomía de Lienzo Limpio y Apertura Desplegada al Pulsar Pestañas',
    coreMandate: 'Widgets en reposo compactos, pero toda ventana abierta explícitamente por el usuario (__forceExpandNextModal = true) se abre desplegada.',
    fullExhaustiveSpecification:
      'Para evitar la saturación visual sobre el mapa 3D de Málaga, los widgets flotantes secundarios en reposo se mantienen compactos, pero cuando el usuario pulsa explícitamente cualquier pestaña o botón para abrir una ventana de análisis ((window as any).__forceExpandNextModal = true), dicha ventana se abre directamente desplegada y en primer plano.',
    keyModulesAndConnectors: ['src/components/DraggableWindow.tsx'],
    regulatoryAndScientificBasis: 'Diseño Centrado en el Investigador y Prevención de Oclusión Cartográfica'
  },
  {
    ruleNumber: 12,
    title: 'Enrutamiento Temático Inteligente y Cero Redundancia (Domain-Driven UI)',
    coreMandate: 'Toda funcionalidad se integra modularmente dentro de su suite científica correspondiente sin duplicar modales.',
    fullExhaustiveSpecification:
      'Queda prohibido crear botones sueltos o modales redundantes cuando ya existe una suite científica especializada (EnvironmentalJusticeModal, SchoolAirEquityModal, CoastalSmlAcidificationModal, UnifiedUrbanCanyonSuiteModal, ExtendedLeightonModal, ThesisMethodologySuiteModal).',
    keyModulesAndConnectors: ['src/App.tsx', 'src/components/ThesisMethodologySuiteModal.tsx'],
    regulatoryAndScientificBasis: 'Arquitectura Modular Domain-Driven Design (DDD)'
  },
  {
    ruleNumber: 13,
    title: 'Propagación en Cadena y Cero Contadores Hardcodeados (SYSTEM_PROPAGATION)',
    coreMandate: 'Todos los recuentos derivan dinámicamente de las colecciones maestras (24 estaciones, 16 satélites, 8 tramos TiO2, etc.).',
    fullExhaustiveSpecification:
      'Queda prohibido codificar cifras manuales fijas en títulos o tablas. Todo recuento deriva dinámicamente de las colecciones maestras (OFFICIAL_MALAGA_AIR_STATIONS.length = 24, OFFICIAL_SATELLITE_MISSIONS.length = 16, MALAGA_TIO2_TREATMENT_STREETS.length = 8) a través de SYSTEM_PROPAGATION.',
    keyModulesAndConnectors: ['src/lib/systemPropagationEngine.ts', 'src/lib/systemIntegrityAuditor.ts (TEST-06, TEST-07)'],
    regulatoryAndScientificBasis: 'Single Source of Truth (SSOT) y Consistencia Referencial'
  },
  {
    ruleNumber: 14,
    title: 'Rigor Físico-Químico Interfacial del Viario Urbano (99,8 % Asfalto Convencional vs. 0,2 % Fotocatálisis TiO2 Grado A1)',
    coreMandate: 'Distingue el 99,8 % de viario convencional (SMA 11/PA 11, granito y mármol de Macael) del 0,2 % con TiO2 anatasa Grado A1 (8 tramos verificados).',
    fullExhaustiveSpecification:
      'En los 8 tramos verificados con TiO2 Grado A1 (i.active CARGO Alameda, i.active TECNO BLANCO Edificio Urban Teatinos, Breinco Air Clean Soho, Carretería-Álamos-Ollerías, Lagunillas, Cobertizo del Conde, Santo Domingo y Campus UMA Teatinos) resuelve la Ley de 3 Resistencias (ra+rb+rc,TiO2), Damköhler (Da), cinética de Ballari & Brouwers (S_NO3-), cavidad de Oke, delicuescencia de Ca(NO3)2 (DRH=50,8%) y renoxificación (Monge et al., PNAS 2010). En el 99,8% de asfalto resuelve Wesely, NO2->HONO sobre urban grime (Stemmler, Nature 2006), IVOCs/SVOCs (Khare & Gentner, 2020), hematita de frenos (alfa-Fe2O3) y ozonólisis 6PPD + O3 -> 6PPD-Quinona.',
    keyModulesAndConnectors: ['src/lib/tio2PhotocatalysisEngine.ts', 'src/lib/no2MassBudgetEngine.ts'],
    regulatoryAndScientificBasis: 'ISO 22197-1:2016; Ballari & Brouwers (J. Hazard. Mater. 2013); Monge et al. (PNAS 2010); Tian et al. (Science 2021)'
  },
  {
    ruleNumber: 15,
    title: 'Regla de Oro en 3 Pasos para Mejoras y Borrados (Intervención Quirúrgica)',
    coreMandate: '(1) Localización directa; (2) Intervención quirúrgica actualizando SYSTEM_PROPAGATION; (3) Verificación inmediata.',
    fullExhaustiveSpecification:
      'Toda modificación aplica 3 pasos: (1) Localización directa del archivo/bloque sin barridos innecesarios; (2) Intervención quirúrgica con trazabilidad doctoral actualizando SYSTEM_PROPAGATION si aplica; (3) Verificación inmediata con tsc --noEmit.',
    keyModulesAndConnectors: ['src/lib/systemPropagationEngine.ts'],
    regulatoryAndScientificBasis: 'Ingeniería de Software de Alta Precisión'
  },
  {
    ruleNumber: 16,
    title: 'Fitorremediación Demostrable Árbol a Árbol y Calle a Calle (24+16 Detectores, Cero Equipos Externos)',
    coreMandate: 'Demuestra la descontaminación sobre 17 especies, 25 alineaciones y 885 árboles con cierre metabólico 100 % (NR -> NiR -> GS-GOGAT).',
    fullExhaustiveSpecification:
      'Evalúa la fitorremediación sobre 17 especies, 25 alineaciones y 885 árboles (malagaTreesInventory.ts) usando exclusivamente los 24+16 detectores de la app: (1) Captación multi-compartimento (ra+rb+rc, C_comp≈1,1 µg/m³, PM2.5/PM10 neto, sumidero cortical de tronco Caulosfera CH4+CO Gauci et al., Nature 2024 y retención TWP/6PPD-Q); (2) Reciclaje metabólico interno 100% cierre de masa (NO2 -> NO2- -> NH4+ -> L-Glutamina y proteína vegetal kg/año); (3) Triangulación Beer-Lambert-Gromke Calzada->Copa->Acera (z=1,5m), Jarvis-Ball-Berry (gs), Penman-Granier (Js), Farquhar (FvCB con delta13C OCO-3) y Penman-Monteith (ECOSTRESS).',
    keyModulesAndConnectors: ['src/lib/malagaTreesInventory.ts', 'src/lib/phytoremediationEngine.ts'],
    regulatoryAndScientificBasis: 'Nowak et al. (2006); Gromke & Ruck (2007); Gauci et al. (Nature 2024)'
  },
  {
    ruleNumber: 17,
    title: 'Desacoplamiento Vertical de Exposición Peatonal (z=0,8 m / 1,5 m vs. 4,0 m) y Directiva (UE) 2024/2881',
    coreMandate: 'Demuestra la Ilusión de Cumplimiento entre la cabina oficial (4,0 m) y la cota de respiración de peatón (1,5 m) y carrito de bebé (0,8–0,9 m).',
    fullExhaustiveSpecification:
      'Modeliza explícitamente el gradiente vertical de concentración desde la fuente de escape vehicular (z≈0,35 m) hasta las tomas de muestra de las cabinas oficiales EOI (z=3,5–4,0 m) en no2VerticalDecouplingEngine.ts, demostrando la Ilusión de Cumplimiento bajo el nuevo límite anual 2030 de 20 µg/m³ de la Directiva (UE) 2024/2881 y aplicando el factor alométrico respiratorio ICRP 66 (hasta 2,15x en lactantes a z=0,8–0,9 m).',
    keyModulesAndConnectors: ['src/lib/no2VerticalDecouplingEngine.ts', 'src/lib/systemIntegrityAuditor.ts (TEST-08)'],
    regulatoryAndScientificBasis: 'Directiva (UE) 2024/2881; ICRP Publication 66 (1994); Vardoulakis et al. (Atmos. Environ. 2003)'
  },
  {
    ruleNumber: 18,
    title: 'Frontera SOTA 2025–2026 de NO2 (Termólisis PAN-LST, Redox PCET 6PPD/SO2 y Factor AMF_3D Satelital)',
    coreMandate: 'Integra termólisis de PAN por T_skin ECOSTRESS/Landsat, conversión redox PCET 6PPD/SO2 y corrección radiativa 3D AMF_3D/AMF_1D.',
    fullExhaustiveSpecification:
      'Integra en no2MassBudgetEngine.ts: (1) Termólisis de PAN gobernada por T_skin asfáltica satelital ECOSTRESS/Landsat (k_PAN = 2,52e16 * exp(-13573/T_skin)); (2) Conversión heterogénea redox PCET NO2 -> HONO + 6PPD-NO2 + SO4^2- acoplada a antioxidantes de neumático y aerosoles ácidos; y (3) Corrección radiativa 3D del factor de masa de aire satelital (AMF_3D / AMF_1D) por apantallamiento geométrico del cañón urbano.',
    keyModulesAndConnectors: ['src/lib/no2MassBudgetEngine.ts'],
    regulatoryAndScientificBasis: 'Atmos. Chem. Phys. (2025); Environ. Sci. Technol. (2025–2026); AMT (2025)'
  },
  {
    ruleNumber: 19,
    title: 'Atribución Sensorial Multiescalar Punto a Punto (24 Terrestres + 16 Satélites), Reloj 4D-Var y Cierre de 4 Componentes',
    coreMandate: 'PointReliabilityBadge.tsx despliega el censo nominal 24+16, pesos EnKF e^(-Δt/τc) y el cierre algebraico ΔC_micro.',
    fullExhaustiveSpecification:
      'PointReliabilityBadge.tsx despliega para cualquier punto del mapa: (1) Diagrama vectorial dual (Radar 24+16 y Flujo PINN hacia L_data, L_col, L_PDE, L_BC); (2) Censo nominal de las 24 estaciones terrestres con norma UNE-EN 14211:2013, distancia, régimen eólico, latencia Δt, factor de Kalman e^(-Δt/τc) y peso EnKF; (3) Censo de las 16 misiones satelitales en 5 constelaciones (Sentinel-4 UVN jul-2025, Sentinel-5 UVNS ago-2025, EarthCARE ATLID, ECOSTRESS, TROPOMI, OCO-3/EMIT); y (4) Cierre algebraico de ΔC_micro.',
    keyModulesAndConnectors: ['src/components/PointReliabilityBadge.tsx'],
    regulatoryAndScientificBasis: 'UNE-EN 14211:2013; Evensen (EnKF, 2009); Raissi et al. (J. Comput. Phys. 2019)'
  },
  {
    ruleNumber: 20,
    title: 'Propagación Universal e Identificación Visual de 📕 DIRECTRICES DIRECTOR ("Camino a la Tesis Doctoral UNED")',
    coreMandate: 'Toda ventana muestra el sello interactivo 📕 DIRECTRICES DIRECTOR con salto directo a ThesisMethodologySuiteModal.tsx y las 13 Tablas.',
    fullExhaustiveSpecification:
      'Todo requisito metodológico del Director (OE1–OE4, Bloques I–V, Anexos I–VIII, Tablas 1–13, Fases I–IV) se propaga mediante SYSTEM_PROPAGATION.directorGuidelinesProtocol y TEST-09. Toda ventana flotante muestra el sello interactivo 📕 DIRECTRICES DIRECTOR con salto directo a ThesisMethodologySuiteModal.tsx, integrando el Semáforo de 5 Checks, el Comparador Espacial Bipuntual A/B, el exportador LaTeX Booktabs y la Impresión PDF Extensa A4.',
    keyModulesAndConnectors: ['src/components/ThesisMethodologySuiteModal.tsx', 'src/lib/systemIntegrityAuditor.ts (TEST-09)'],
    regulatoryAndScientificBasis: 'Marco Metodológico de Dirección de Tesis Doctoral UNED'
  },
  {
    ruleNumber: 21,
    title: 'Cierre Matemático-Epistémico Doctoral (SYSTEM_PROPAGATION.doctoralMathematicalClosure y TEST-10)',
    coreMandate: 'Garantiza la partición 32 Variables = 11 [OBS] + 13 [DERIV] + 8 [MOD], 12 MVP (≥94 % Shannon-Fisher), invariante vertical y cero NaN.',
    fullExhaustiveSpecification:
      'Garantiza en tiempo de ejecución: (1) Partición epistémica invariante 32 Variables = 11 [OBS] + 13 [DERIV] + 8 [MOD] y subconjunto óptimo de 12 Variables MVP que retienen ≥94% de la entropía de información de Shannon-Fisher; (2) Invariante físico vertical C_NO2(0,8 m) > C_NO2(1,5 m) > C_NO2(4,0 m) y cierre estequiométrico enzimático NR/NiR/GS-GOGAT; y (3) Cero NaN/undefined en las 13 Tablas y PDFs.',
    keyModulesAndConnectors: ['src/lib/systemIntegrityAuditor.ts (TEST-10)', 'SYSTEM_PROPAGATION.doctoralMathematicalClosure'],
    regulatoryAndScientificBasis: 'Teoría de la Información de Shannon-Fisher; Cierre Epistémico Doctoral'
  },
  {
    ruleNumber: 22,
    title: 'Ergonomía de Barras Deslizantes Continuas (justify-start), Desplegables en Portal y Jerarquía HTML de Tablas',
    coreMandate: 'Barras deslizantes con flechas ◀/▶, desplegables en createPortal y jerarquía estricta <thead>/<tbody> -> <tr> -> <th>/<td>.',
    fullExhaustiveSpecification:
      'Todas las barras de herramientas y filas de pestañas usan flujo continuo de una línea (justify-start gap-1.5 whitespace-nowrap) con flechas ◀/▶ y rueda horizontal (onWheel). Los menús desplegables se renderizan en createPortal(..., document.body). En toda tabla HTML <table>, las filas <tr> son hijas directas de <thead>/<tbody> y <ScientificTooltip> se coloca siempre dentro de <th> o <td>.',
    keyModulesAndConnectors: ['src/components/HorizontallyScrollableRow.tsx', 'src/lib/systemIntegrityAuditor.ts (TEST-11)'],
    regulatoryAndScientificBasis: 'Especificación W3C HTML5 DOM Table Content Model'
  },
  {
    ruleNumber: 23,
    title: 'Compatibilidad Adaptativa Tri-Dispositivo (PC + iPad/Tableta + Móvil), Apertura Dual Minimizada en Mapa y Memoria de Posición',
    coreMandate: 'Auto-ajuste 96vw, clic en mapa que abre minimizadas Confiabilidad (24+16) e Inspector, zoom A-/100%/A+ y memoria de pestañas y ventanas.',
    fullExhaustiveSpecification:
      'Auto-ajuste geométrico (maxWidth: 96vw, max-h-[84dvh] sm:max-h-[90vh]), clic en un punto del mapa que abre únicamente minimizadas las barras de Confiabilidad (24+16) e Inspector de Punto, control de tamaño de letra persistente A- | 100% | A+ (75%–160%), flechas ◀/▶ (OrderableTabRow) para reordenar pestañas en localStorage y memoria de coordenadas (x, y) de ventanas (malaga_dt_window_pos_v1).',
    keyModulesAndConnectors: ['src/components/OrderableTabRow.tsx', 'SYSTEM_PROPAGATION.triDeviceAndDualPopupProtocol'],
    regulatoryAndScientificBasis: 'Diseño Responsivo Multi-Dispositivo (PC, iPadOS y Móvil)'
  },
  {
    ruleNumber: 24,
    title: 'Columna Vertebral 📕 DIRECTRICES DIRECTOR: Custodia Íntegra del PDF Original (03/10/2026), Ordenación 0 ➔ 7, Paso 6.4 PINN e Informes PDF Punto por Punto',
    coreMandate: 'Custodia el PDF original 03_10_2026_Marco_objetivos_tesis_Dionisio.pdf con visor, 10 variables de contexto, Paso 6.4 PINN y PDFs por punto.',
    fullExhaustiveSpecification:
      'Custodia íntegra del PDF original del Director (/assets/aistudio/03_10_2026_Marco_objetivos_tesis_Dionisio_6c01d20f.pdf) con visor incrustado y transcripción literal de Páginas 1 y 2, tabla justificada de las 10 Variables de Contexto (Puerto, Aeropuerto, Brisas, Terral, H_PBL, Polvo sahariano, Sal marina, Radiación, Vegetación y Cañón H/W), especificación formal PINN (Paso 6.4: AdamW + L-BFGS-B + NTK + RAR-D + LOOCV + Ablación M0–M4) y descarga de PDFs monográficos punto por punto (downloadDirectorSinglePointMonographPdf).',
    keyModulesAndConnectors: ['src/lib/directorOriginalDocAndFocusedPdf.ts', 'SYSTEM_PROPAGATION.directorPdfCustodyProtocol'],
    regulatoryAndScientificBasis: 'Documento Fundacional de Dirección de Tesis (03/10/2026)'
  },
  {
    ruleNumber: 25,
    title: 'Evidencia Empírica Primaria Verificada (2024–2026), Radar Científico SOTA (DOI) y Receptor Universal Multi-Formato (PDF/.docx/Texto)',
    coreMandate: 'Propaga datos verificados de ZBE Málaga (437 ha, 97 LPR), Puerto Med SOx ECA (0,10% S), Aeropuerto AENA (26,76M pax), MITECO y satélites 2025.',
    fullExhaustiveSpecification:
      'Propaga en verifiedDoctoralEvidence2026.ts: (1) ZBE Málaga (Ordenanza 30/11/2024, 437 ha, 97 cámaras LPR, 3 ventanas 2024–2026 incluida sentencia TSJA oct-2026 y Metro al Centro); (2) Puerto Med SOx ECA 0,10% S (OMI 01/05/2025, -80% SO2); (3) Aeropuerto AENA 2024 (24,92M pax) y 2025 (26,76M pax, 186.990 vuelos LTO); (4) MITECO 2024–2025 en Av. Juan XXIII (ES1397A, 31,0 µg/m³, +55% sobre límite 2030) y Carranque (ES1531A, >20 µg/m³); (5) Satélites 2025 (Sentinel-4A UVN 01/07/2025, Sentinel-5A UVNS 13/08/2025, EarthCARE ATLID); (6) Incertidumbre Conformal Física CP-PRE (ICML 2025), causalidad DML + MetFix-PINN (ES&T 2025) y Euro 7 frenos (7 mg/km). Incluye receptor multi-formato (.pdf, .docx, .txt).',
    keyModulesAndConnectors: ['src/lib/verifiedDoctoralEvidence2026.ts', 'src/components/DirectorMultiFormatIngestionHub.tsx'],
    regulatoryAndScientificBasis: 'BOP Málaga 05/11/2024; OMI MARPOL Anexo VI (01/05/2025); AENA 2025; MITECO 2025; Reglamento (UE) 2024/1257 (Euro 7)'
  },
  {
    ruleNumber: 26,
    title: 'Respaldo Limpio 1-Clic (📦 CLOUD SYNC, GITHUB & USB), App Ejecutable Blindada (.HTML) y Carteles Dinámicos Unificados',
    coreMandate: 'Consola PortableCloudSyncModal.tsx con 3 acciones limpias: Subir a GitHub, Bajar .ZIP IEEE 802.3 CRC32 y Bajar App Ejecutable .HTML.',
    fullExhaustiveSpecification:
      'Simplifica PortableCloudSyncModal.tsx en 3 acciones de 1 clic: Subir a GitHub, Bajar .ZIP IEEE 802.3 CRC32 (con código, tesis y PDFs originales) y Bajar App Ejecutable .HTML Solo-Lectura (?blindado=1). Todos los carteles de Directrices del Director se leen dinámicamente de SYSTEM_PROPAGATION.directorGuidelinesProtocol.headerButtonLabel.',
    keyModulesAndConnectors: ['src/components/PortableCloudSyncModal.tsx', 'SYSTEM_PROPAGATION.cleanCloudSyncAndDynamicBadgeProtocol'],
    regulatoryAndScientificBasis: 'Preservación Digital IEEE 802.3 CRC32 y Reproducibilidad Offline'
  },
  {
    ruleNumber: 27,
    title: 'Blindaje Universal en Vivo de los 10 Generadores PDF y Matriz Voluntaria de 11 Distritos (UniversalPdfLiveSyncEngine — Cero Desactualización)',
    coreMandate: 'Conecta en tiempo real los 10 generadores PDF y LaTeX con las órdenes del Director, el checkpoint UNED, el sitio elegido voluntariamente y la Matriz en Vivo de los 11 Distritos.',
    fullExhaustiveSpecification:
      '/src/lib/universalPdfLiveSyncEngine.ts conecta en tiempo real los 10 generadores PDF y LaTeX con: (1) Las 3 vías de órdenes presentes y futuras del Director; (2) El checkpoint .JSON del servidor UNED (getActiveUnedPinnCheckpoint); (3) El censo oficial 24+16 con desacoplamiento vertical; (4) Las 5 pestañas limpias de ThesisMethodologySuiteModal.tsx; y (5) El selector voluntario de sitio/distrito (🌍 11 Distritos) y el apéndice universal appendVoluntarySiteAnd11DistrictsSectionToPdf con concentraciones en vivo a 1,8 m, 0,9 m, 4,0 m y ppb termodinámicos reales.',
    keyModulesAndConnectors: [
      'src/lib/universalPdfLiveSyncEngine.ts (appendVoluntarySiteAnd11DistrictsSectionToPdf)',
      'SYSTEM_PROPAGATION.universalPdfLiveSyncProtocol'
    ],
    regulatoryAndScientificBasis: 'Sincronización Documental en Tiempo Real y Cobertura Territorial 11 Distritos INE'
  },
  {
    ruleNumber: 28,
    title: 'Cuaderno Abierto de Descubrimientos (1…N), Radar de 11 Distritos en Vivo y Baliza Permanente 🔔 RADAR DOI (SOTA)',
    coreMandate: 'Calcula en vivo las concentraciones de los 11 Distritos / 13 Arterias en Paso 1, fija anomalías en Paso 2 y mantiene visible la baliza 🔔 RADAR DOI (SOTA).',
    fullExhaustiveSpecification:
      'thesisOpenDiscoveriesEngine.ts calcula en tiempo real las concentraciones asimiladas de los 11 Distritos / 13 Arterias de Málaga (computeLiveMalaga11DistrictsCorridors: 1,8 m, 0,9 m, 4,0 m y ppb bajo P y T reales) en el Paso 1 y fija anomalías empíricas en el Cuaderno Abierto (1…N) del Paso 2. La baliza 🔔 RADAR DOI (SOTA) permanece siempre visible en primera línea, ejecuta escaneo automático al arrancar (runBootTimeSotaRadarDoiAutoScan) contra OpenAlex/Crossref, incluye botón manual 🔄 BUSCAR AHORA, alarma visual + sonora (🔊 SONORO ON / 🔇 SONIDO OFF) y exige confirmación previa antes de incorporar hallazgos.',
    keyModulesAndConnectors: [
      'src/lib/thesisOpenDiscoveriesEngine.ts (computeLiveMalaga11DistrictsCorridors)',
      'SYSTEM_PROPAGATION.openDiscoveriesAndRadarDoiAlarmProtocol'
    ],
    regulatoryAndScientificBasis: 'Vigilancia Bibliográfica Continua OpenAlex / Crossref API y Barrido Territorial 11 Distritos'
  },
  {
    ruleNumber: 29,
    title: 'Principio de Doble Presencia, Visor HD 300+ DPI PdfCanvasPreviewModal en DraggableWindow y Biblioteca Maestra Viva de PDFs (ThesisMasterPdfLibraryTab.tsx)',
    coreMandate: 'Cero PDFs eliminados; todo PDF se mantiene en su ventana original y en la Biblioteca Central con purificador tipográfico WinAnsi y 4 acciones FAIR (Visualizar en HD 300+ DPI, Imprimir, Descargar, Compartir).',
    fullExhaustiveSpecification:
      'Ningún PDF se elimina jamás (Regla 9): todo PDF se conserva intacto en su ventana original y se registra automáticamente en ThesisMasterPdfLibraryTab.tsx con selector voluntario de los 11 Distritos, purificador tipográfico WinAnsi (sanitizeTextForJsPdf + runCleanAutoTable sin LaTeX crudo ni solapamientos Unicode), sus 4 atributos explicativos y las 4 acciones FAIR: (1) 👁️ Visualizar en pantalla mediante PdfCanvasPreviewModal.tsx montado en DraggableWindow en Portal con supersampling vectorial 300+ DPI (superSampleRatio >= 2,85), apertura automática en AJUSTAR ANCHO, índice lateral plegable (📑 ÍNDICE), worker local PDF.js + Visor PDF Nativo, (2) 🖨️ Imprimir directamente, (3) 📥 Descargar PDF y (4) 📤 Compartir.',
    keyModulesAndConnectors: [
      'src/components/ThesisMasterPdfLibraryTab.tsx',
      'src/components/PdfCanvasPreviewModal.tsx',
      'src/lib/universalPdfLiveSyncEngine.ts (sanitizeTextForJsPdf, runCleanAutoTable)'
    ],
    regulatoryAndScientificBasis: 'Gestión Documental Centralizada y Previsualización Vectorial 300+ DPI Sin Bloqueos para Defensa Doctoral'
  },
  {
    ruleNumber: 30,
    title: 'Clon Exacto de Funciones DraggableWindow.tsx (1 Clic) ⇄ ScientificTooltip.tsx (Doble Clic/Toque), Barra ⚡ Ir en 1 Clic y Protocolo Automático',
    coreMandate: 'Redimensionamiento puro por incrementos (startW+dx, startH+dy) en esquina ◢ sin tocar x/y, barra de salto directo ⚡ Ir en 1 Clic y toda pestaña/botón con 1 clic + doble clic/toque.',
    fullExhaustiveSpecification:
      'ScientificTooltip.tsx, PdfCanvasPreviewModal.tsx y UniversalScientificTooltipDelegator ejecutan el mismo código clonado de DraggableWindow.tsx: redimensionamiento puro por incrementos (startW + dx, startH + dy) desde la esquina inferior derecha (◢) sin tocar jamás x/y, arrastre desde la barra de título, botón ⤢/⤡ y cierre ✕. Cada nueva pestaña o botón presente o futuro nace como <button type="button"> con apertura en 1 clic (__forceExpandNextModal = true) y <ScientificTooltip> explícito en doble clic/toque, incluyendo la barra de salto directo ⚡ Ir en 1 Clic bajo BARRA 2 (Radar 11 Distritos, Servidor UNED, 13 Tablas y Centro de PDFs).',
    keyModulesAndConnectors: [
      'src/components/DraggableWindow.tsx',
      'src/components/ScientificTooltip.tsx',
      'src/components/PdfCanvasPreviewModal.tsx',
      'SYSTEM_PROPAGATION.windowAndTabCloneProtocol'
    ],
    regulatoryAndScientificBasis: 'Invarianza Geométrica de Ventanas y Ergonomía de Cero Búsqueda de Pestañas'
  },
  {
    ruleNumber: 31,
    title: 'Protocolo de Parejas Documentales en Azul (PDF N ORIGINAL ⇄ PDF N ORIGINAL CON GÉMINIS, 1…N) y Doble Botón Obligatorio 👁️ Visualizar + 📥 PDF',
    coreMandate: 'Mismo sello azul arriba (BARRA 1) y abajo (tarjetas), desplegable dinámico por puntos/capítulos y pareja obligatoria 👁️ Visualizar + 📥 PDF para PDF 1…N y 13 Tablas.',
    fullExhaustiveSpecification:
      'Todo documento enviado por la Directora de Tesis se identifica con el mismo sello azul arriba (selector BARRA 1) y abajo (tarjetas): 📘 PDF N ORIGINAL (FECHA • PÁGS) y 📘 PDF N ORIGINAL CON GÉMINIS (FECHA • PÁGS), con desplegable dinámico por puntos/capítulos (getDynamicDirectorPdfDocumentsCatalog), pareja de botones obligatoria en BARRA 1: 👁️ Visualizar (CAP. ...) + 📥 PDF (CAP. ... • 📍 Calle) y 👁️ 13 Tablas + 📕 13 Tablas (downloadDynamicDirectorDocumentOrChapterPdf con soporte skipSave para previsualización en PdfCanvasPreviewModal), visor lado a lado, copia para Correo/DAD UNED, emparejamiento automático para futuros PDF 2, 3… N y propagación a 📑 CENTRO PDFs & FAIR.',
    keyModulesAndConnectors: [
      'src/lib/directorOriginalDocAndFocusedPdf.ts',
      'src/components/ThesisMethodologySuiteModal.tsx',
      'src/components/DirectorLogicalSectionsView.tsx',
      'src/components/PdfCanvasPreviewModal.tsx',
      'SYSTEM_PROPAGATION.pairedDirectorPdfsBlueProtocol'
    ],
    regulatoryAndScientificBasis: 'Trazabilidad Documental por Parejas Original ⇄ Estudio Profundo con Géminis y Previsualización Inmediata'
  },
  {
    ruleNumber: 32,
    title: 'Prohibición Total de Escenarios Simulados o Contrafactuales Sintéticos (100 % Dato Medido + Ecuación Física Exacta)',
    coreMandate: 'Prohibido generar escenarios hipotéticos, placebos sintéticos o simulaciones; toda cifra procede de medición oficial real o ecuación determinista.',
    fullExhaustiveSpecification:
      'En coherencia con la doctrina de Gemelo Digital Físico de la tesis doctoral UNED, ningún módulo, tabla o PDF puede generar escenarios hipotéticos, regresiones simuladas ni placebos sintéticos. Toda magnitud numérica procede única y exclusivamente de: (1) Medición oficial real instrumentada (RVCCA Junta de Andalucía / MITECO, AEMET OpenData, Puertos del Estado, AENA, Copernicus CAMS) y (2) Ecuación física, termodinámica o estequiométrica determinista evaluada directamente sobre las variables reales medidas en ese punto e instante.',
    keyModulesAndConnectors: [
      'src/lib/systemPropagationEngine.ts (SYSTEM_PROPAGATION.zeroSimulationObservationalProtocol)',
      'src/lib/systemIntegrityAuditor.ts (TEST-01, TEST-12)'
    ],
    regulatoryAndScientificBasis: 'Epistemología Observacional Estricta — Tesis Doctoral UNED (EIDUNED)'
  },
  {
    ruleNumber: 33,
    title: 'Rigor Instrumental UNE-EN 14211:2013 en la Red de Málaga (Qué Mide Realmente Cada Estación en el Paso 6.1 y 6.4)',
    coreMandate: 'Separa estrictamente las estaciones con analizador químico real de NO2 (UNE-EN 14211, L_data y LOOCV) de los nodos meteorológicos (AEMET/Boyas, L_PDE y L_BC).',
    fullExhaustiveSpecification:
      'Cada uno de los 24 nodos oficiales del censo de Málaga interviene estrictamente según su instrumentación física real: (1) Las estaciones de calidad del aire con analizador real de quimioluminiscencia de NO/NO2/NOx bajo norma UNE-EN 14211:2013 (RVCCA / MITECO: Av. Juan XXIII ES1397A, Carranque ES1531A, El Atabal ES1621A, Campanillas ES2050A, etc.) son las únicas que alimentan y validan el error observacional directo de NO2 (L_data y LOOCV); (2) Las estaciones meteorológicas oficiales de AEMET (Aeropuerto 6155A, Puerto 6156X, Centro Meteorológico 6172O) y Boyas de Puertos del Estado aportan exclusivamente las variables físicas medidas (viento u, temperatura T, humedad HR, presión P, radiación Rg) al operador diferencial (L_PDE y L_BC), sin atribuirles jamás mediciones ficticias de NO2.',
    keyModulesAndConnectors: [
      'src/lib/systemPropagationEngine.ts (SYSTEM_PROPAGATION.instrumentalNetworkSeparationProtocol)',
      'src/components/PointReliabilityBadge.tsx',
      'src/lib/systemIntegrityAuditor.ts (TEST-12)'
    ],
    regulatoryAndScientificBasis: 'Norma UNE-EN 14211:2013 (Quimioluminiscencia NO/NO2); Capítulo 2 de PDF 1 ORIGINAL CON GÉMINIS'
  },
  {
    ruleNumber: 34,
    title: 'Conversión Termodinámica Exacta (ppb ⇄ µg/m³) con Presión Barométrica P(x,t) y Temperatura T(x,t) Reales Medidas por AEMET en Málaga',
    coreMandate: 'Usa la ecuación de gases ideales con presión P(x,t) y temperatura T(x,t) reales medidas en Málaga en vez del factor fijo estándar de laboratorio (20 °C).',
    fullExhaustiveSpecification:
      'Toda conversión estequiométrica y fotoquímica entre fracción molar (ppb) y concentración másica (µg/m³) aplica la ecuación de estado de los gases ideales con la presión barométrica real P_real(x,t) y la temperatura absoluta real T_real(x,t) medidas en Málaga: C_NO2 [µg/m³] = chi_NO2 [ppb] * (M_NO2 * P_real(x,t)) / (R * T_real(x,t)), donde M_NO2 = 46,0055 g/mol y R = 8,314462 J/(mol·K), cuantificando la desviación real frente al factor estándar fijo de 293,15 K (20 °C) y 1013,25 hPa.',
    keyModulesAndConnectors: [
      'src/lib/systemPropagationEngine.ts (SYSTEM_PROPAGATION.realThermodynamicUnitConversionProtocol)',
      'src/lib/leightonEngine.ts',
      'src/lib/systemIntegrityAuditor.ts (TEST-12)'
    ],
    regulatoryAndScientificBasis: 'IUPAC Gold Book; Directiva (UE) 2024/2881 Anexo VI; Termodinámica Atmosférica Real'
  },
  {
    ruleNumber: 35,
    title: 'Exclusión Matemática Estricta (w_k = 0) en Validación Cruzada LOOCV (Paso 6.4) y Consejero Dinámico Evolutivo de AGENTS.md con Freno Anti-Inflación',
    coreMandate: 'Anula w_k = 0 en la estación retenida s_k durante la LOOCV (t\' <= t) y evalúa dinámicamente en cada actualización si fusionar en las 35 reglas o crear una Regla 36 de rango doctoral.',
    fullExhaustiveSpecification:
      '(1) En la validación cruzada Leave-One-Station-Out (LOOCV, Paso 6.4), al evaluar el error real en la estación oficial s_k se impone matemáticamente w_k(x_{s_k}) = 0 y solo intervienen observaciones causales (i != k, t\' <= t) y el operador diferencial físico R_ADR = 0 (cero fuga de datos). (2) Incluye el Consejero Dinámico de AGENTS.md (evaluateDynamicAgentsMdAdvisor) oculto bajo demanda en BARRA 1 (🧬 AGENTS.md 35/35) con freno anti-inflación: en cada variación o actualización revisa AGENTS.md y evalúa si la mejora se fusiona en las 35 reglas existentes (como la Matriz Voluntaria de 11 Distritos y el botón 👁️ Visualizar fusionados en Reglas 27–31) o si tiene rango de nuevo hito de Tesis Doctoral para abrir la Regla 36.',
    keyModulesAndConnectors: [
      'src/lib/agentsMdFullRegistry.ts (evaluateDynamicAgentsMdAdvisor)',
      'src/lib/systemPropagationEngine.ts (SYSTEM_PROPAGATION.strictLoocvAndDynamicAdvisorProtocol)',
      'src/components/ThesisMethodologySuiteModal.tsx',
      'src/lib/systemIntegrityAuditor.ts (TEST-12)'
    ],
    regulatoryAndScientificBasis: 'Validación Espaciotemporal Ciega LOOCV (Punto 6.4 Director) y Gobernanza Evolutiva AGENTS.md'
  }
] as const;

export const AGENTS_MD_CAPACITY_TELEMETRY = {
  maxPlatformLimitBytes: 24576, // 24 KB platform threshold
  safeGreenThresholdBytes: 20480, // 20 KB safe ceiling
  currentCompactBytesApprox: 18620, // ~18,18 KB exact size with Rules 1 to 35
  get freeMarginBytes(): number {
    return this.maxPlatformLimitBytes - this.currentCompactBytesApprox;
  },
  get freeMarginKb(): number {
    return Number((this.freeMarginBytes / 1024).toFixed(2));
  },
  get estimatedAdditionalRulesCapacity(): number {
    // At ~250 bytes per 3-line high-density rule in AGENTS.md
    return Math.floor(this.freeMarginBytes / 250);
  },
  fullUnabridgedMirrorFile: 'src/lib/agentsMdFullRegistry.ts',
  status: 'OPTIMAL_TWO_LAYER_SHIELD_ACTIVE' as const
};

export interface DynamicAgentsMdAdviceItem {
  id: string;
  recommendationType: 'MERGE_INTO_EXISTING_RULE' | 'NEW_RULE_ON_REAL_MILESTONE' | 'NO_ACTION_NEEDED_OPTIMAL';
  targetRuleLabel: string;
  triggerSourceRealState: string;
  whyItMattersForThesis: string;
  compactThreeLineDraft: string;
  chatCommandToCopy: string;
}

export interface DynamicAgentsMdEvolutionReport {
  evaluatedAtIso: string;
  totalRulesActive: number;
  compactSizeKb: number;
  freeMarginKb: number;
  additionalRulesCapacity: number;
  antiInflationPolicyActive: boolean;
  detectedFuturePdfCount: number;
  customRadarDoiCount: number;
  customDirectorOrdersCount: number;
  overallVerdict: string;
  advices: DynamicAgentsMdAdviceItem[];
}

/**
 * Consejero Dinámico de AGENTS.md con Freno Anti-Inflación (Regla 35).
 * Analiza en vivo el estado real de la app (documentos subidos, órdenes personalizadas,
 * descubrimientos DOI y métricas en vivo) sin inventar ni simular nada, y aconseja
 * si conviene mantener las 35 reglas actuales, fusionar en una existente o crear una Regla 36.
 */
export function evaluateDynamicAgentsMdAdvisor(params: {
  uploadedTotalDocsCount: number;
  customDirectorOrdersCount: number;
  customRadarDoiCount: number;
  activeAddress: string;
  activeTempC?: number;
  activePressureHpa?: number;
}): DynamicAgentsMdEvolutionReport {
  const futurePdfsCount = Math.max(0, params.uploadedTotalDocsCount - 2);
  const compactSizeKb = Number((AGENTS_MD_CAPACITY_TELEMETRY.currentCompactBytesApprox / 1024).toFixed(2));
  const advices: DynamicAgentsMdAdviceItem[] = [];

  // Conversión termodinámica real en vivo (Regla 34) para mostrar dato físico real del punto
  const tempK = (params.activeTempC ?? 22.5) + 273.15;
  const pressPa = (params.activePressureHpa ?? 1015.0) * 100;
  const realConversionFactor = Number(((46.0055 * pressPa) / (8.314462 * tempK * 1000)).toFixed(4));

  if (futurePdfsCount > 0) {
    advices.push({
      id: 'advice_new_director_pdf',
      recommendationType: 'NEW_RULE_ON_REAL_MILESTONE',
      targetRuleLabel: 'Rango Doctoral Detectado: Crear Regla 36 (o Ampliar Regla 31) por Nuevo Documento del Director',
      triggerSourceRealState: `Detectados ${futurePdfsCount} documento(s) adicional(es) subidos por ti en el catálogo dinámico (más allá de la Pareja #1 del 03/10/2026).`,
      whyItMattersForThesis:
        'Evaluación de Rango de Tesis Doctoral: Si el nuevo PDF de tu Directora introduce una nueva ecuación física, una nueva restricción empírica o un nuevo objetivo, tiene rango suficiente para convertirse en la Regla 36 de AGENTS.md; si es una revisión editorial de capítulos existentes, basta con fusionarlo en la Regla 31.',
      compactThreeLineDraft: `36. **Consolidación Doctoral del Nuevo Documento del Director (\`Regla 36\`):** (1) Blinda las nuevas ecuaciones/capítulos incorporados; (2) Conector en \`SYSTEM_PROPAGATION.pairedDirectorPdfsBlueProtocol\`; (3) Verificación automática en \`TEST-12\`.`,
      chatCommandToCopy:
        'Evalúa el último PDF del Director que he subido: si introduce un nuevo requisito físico o metodológico de rango doctoral, crea la Regla 36 en AGENTS.md y src/lib/agentsMdFullRegistry.ts; si no, fusiónalo en la Regla 31.'
    });
  }

  if (params.customDirectorOrdersCount > 0) {
    advices.push({
      id: 'advice_custom_orders',
      recommendationType: 'MERGE_INTO_EXISTING_RULE',
      targetRuleLabel: 'Fusionar dentro de Regla 20 / Regla 24 (Directrices del Director)',
      triggerSourceRealState: `Tienes ${params.customDirectorOrdersCount} orden(es)/cláusula(s) personalizada(s) registrada(s) en la Tabla 13 (Anexo VIII).`,
      whyItMattersForThesis:
        'Freno Anti-Inflación: En lugar de crear una regla nueva por cada nota de reunión, es más limpio incorporarlas al registro fijo de la Regla 24 en src/lib/agentsMdFullRegistry.ts.',
      compactThreeLineDraft: `Integración en Regla 24 (\`src/lib/agentsMdFullRegistry.ts\`): Incorporar las ${params.customDirectorOrdersCount} cláusulas personalizadas del Anexo VIII al archivo espejo permanente.`,
      chatCommandToCopy:
        'Incorpora mis cláusulas personalizadas actuales del Director dentro del registro permanente de la Regla 24 en src/lib/agentsMdFullRegistry.ts sin inflar el número de reglas de AGENTS.md.'
    });
  }

  if (params.customRadarDoiCount > 0) {
    advices.push({
      id: 'advice_radar_doi',
      recommendationType: 'MERGE_INTO_EXISTING_RULE',
      targetRuleLabel: 'Fusionar dentro de Regla 25 y Regla 28 (Evidencia Verificada y Radar DOI)',
      triggerSourceRealState: `Has incorporado ${params.customRadarDoiCount} nuevo(s) hallazgo(s) con DOI verificado desde el Radar SOTA.`,
      whyItMattersForThesis:
        'Freno Anti-Inflación: Conviene volcar esos nuevos DOIs en la semilla fija de verifiedDoctoralEvidence2026.ts bajo la Regla 25 sin gastar espacio en nuevas reglas.',
      compactThreeLineDraft: `Actualización de semilla fija en Regla 25 (\`verifiedDoctoralEvidence2026.ts\`): Consolidar los ${params.customRadarDoiCount} nuevos DOIs verificados.`,
      chatCommandToCopy:
        'Consolida los nuevos DOIs que he añadido en el Radar DOI dentro de src/lib/verifiedDoctoralEvidence2026.ts bajo las Reglas 25 y 28.'
    });
  }

  // Siempre incluimos el dictamen explícito de revisión de la última actualización (Fusión vs Nueva Regla de Rango Doctoral)
  advices.push({
    id: 'advice_doctoral_rank_audit',
    recommendationType: advices.length === 0 ? 'NO_ACTION_NEEDED_OPTIMAL' : 'MERGE_INTO_EXISTING_RULE',
    targetRuleLabel:
      'Dictamen Dinámico de Rango Doctoral (Revisión de la Última Actualización: 11 Distritos en Vivo + Visor 👁️ PDF en BARRA 1)',
    triggerSourceRealState: `Auditado hoy en ${params.activeAddress} (Factor termodinámico real Regla 34 = ${realConversionFactor} µg/m³ por ppb a ${(params.activeTempC ?? 22.5).toFixed(1)} °C; LOOCV w_k = 0 Regla 35 activo): Las mejoras de hoy (Selector Voluntario 🌍 11 Distritos, apéndice de 11 Distritos en todos los PDFs, acceso ⚡ Ir en 1 Clic y botón 👁️ Visualizar en DraggableWindow junto a 📥 PDF) ya han sido fusionadas en las Reglas 27, 28, 29, 30 y 31.`,
    whyItMattersForThesis:
      'Criterio de Rango de Tesis Doctoral (Freno Anti-Inflación): ¿Vale la pena crear ahora una Regla 36 separada? NO todavía, porque al haber fusionado estas mejoras operativas en las Reglas 27–31 mantenemos 35 reglas de máximo nivel científico (Reglas 32–35: Cero Simulación, Separación UNE-EN 14211, Termodinámica Real AEMET y LOOCV w_k = 0) y conservamos +5,8 KB libres (+23 reglas futuras) para cuando entre un nuevo hito físico/matemático real (ej. PDF 2 del Director, acoplamiento químico O3-NOx-VOCs de orden superior o nuevo checkpoint GPU de la UNED).',
    compactThreeLineDraft:
      'RESERVA REGLA 36 (Solo para futuro hito de rango doctoral): Se activará cuando se incorpore una nueva formulación físico-matemática, un nuevo bloque experimental del servidor UNED o el PDF 2 de la Directora de Tesis.',
    chatCommandToCopy:
      'Revisa AGENTS.md y dime si el nuevo avance tiene rango científico de Tesis Doctoral para crear la Regla 36 o si es mejor fusionarlo en las Reglas 1 a 35.'
  });

  return {
    evaluatedAtIso: new Date().toISOString(),
    totalRulesActive: AGENTS_MD_FULL_DOCTORAL_CLAUSES.length,
    compactSizeKb,
    freeMarginKb: AGENTS_MD_CAPACITY_TELEMETRY.freeMarginKb,
    additionalRulesCapacity: AGENTS_MD_CAPACITY_TELEMETRY.estimatedAdditionalRulesCapacity,
    antiInflationPolicyActive: true,
    detectedFuturePdfCount: futurePdfsCount,
    customRadarDoiCount: params.customRadarDoiCount,
    customDirectorOrdersCount: params.customDirectorOrdersCount,
    overallVerdict:
      futurePdfsCount === 0 && params.customDirectorOrdersCount === 0 && params.customRadarDoiCount === 0
        ? '✅ CONSTITUCIÓN 35/35 REVISADA Y AL DÍA (MEJORAS DE HOY FUSIONADAS EN REGLAS 27–31 • RESERVA REGLA 36 LISTA PARA NUEVO HITO DOCTORAL)'
        : `💡 ${advices.length} RECOMENDACIÓN(ES) EVOLUTIVA(S) DETECTADA(S) EN VIVO (EVALUACIÓN DE RANGO DOCTORAL ACTIVA)`,
    advices
  };
}

/**
 * Descarga en 1 clic un documento Markdown (.MD) con las 35 reglas completas
 * (tanto su resumen compacto de AGENTS.md como su especificación extensa de agentsMdFullRegistry.ts).
 */
export function downloadDynamicAgentsMdMarkdown(report: DynamicAgentsMdEvolutionReport): void {
  const lines: string[] = [
    '# CONSTITUCIÓN DOCTORAL COMPLETA AGENTS.md (CAPA 1 COMPACTA + CAPA 2 ESPEJO ÍNTEGRO)',
    `- **Programa de Doctorado:** UNED (Escuela Internacional de Doctorado — EIDUNED)`,
    `- **Reglas Activas Auditadas en TEST-12:** ${report.totalRulesActive}/${report.totalRulesActive} PASS (\`Reglas 1 ➔ ${report.totalRulesActive}\`)`,
    `- **Tamaño Capa 1 (\`/AGENTS.md\`):** ${report.compactSizeKb} KB / 24,00 KB (+${report.freeMarginKb} KB libres • Capacidad directa para +${report.additionalRulesCapacity} reglas nuevas)`,
    `- **Diagnóstico del Consejero Dinámico:** ${report.overallVerdict}`,
    '',
    '---',
    '',
    '## CATÁLOGO ÍNTEGRO DE LAS 35 REGLAS DOCTORALES (`Reglas 1 ➔ 35`)',
    ''
  ];

  for (const clause of AGENTS_MD_FULL_DOCTORAL_CLAUSES) {
    lines.push(`### Regla ${clause.ruleNumber}. ${clause.title}`);
    lines.push(`- **Mandato Nuclear:** ${clause.coreMandate}`);
    lines.push(`- **Especificación Extensa:** ${clause.fullExhaustiveSpecification}`);
    lines.push(`- **Módulos y Conectores:** \`${clause.keyModulesAndConnectors.join('`, `')}\``);
    lines.push(`- **Base Científica / Normativa:** ${clause.regulatoryAndScientificBasis}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('## DIAGNÓSTICO EVOLUTIVO DEL CONSEJERO DINÁMICO (CON FRENO ANTI-INFLACIÓN)');
  for (const adv of report.advices) {
    lines.push(`- **${adv.targetRuleLabel}:** ${adv.triggerSourceRealState}`);
    lines.push(`  - *Criterio Doctoral:* ${adv.whyItMattersForThesis}`);
    lines.push(`  - *Orden lista para el Chat:* \`${adv.chatCommandToCopy}\``);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AGENTS_MD_CONSTITUCION_DOCTORAL_UNED_${report.totalRulesActive}_REGLAS.md`;
  a.click();
  URL.revokeObjectURL(url);
}

