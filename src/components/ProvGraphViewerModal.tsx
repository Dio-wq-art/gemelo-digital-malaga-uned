import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Database, 
  Cpu, 
  UserCheck, 
  ShieldCheck, 
  Download, 
  FileCode, 
  ExternalLink, 
  Info, 
  Search, 
  CheckCircle2, 
  Layers, 
  Share2, 
  Clock, 
  Fingerprint,
  Radio,
  Workflow
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';

export interface ProvNode {
  id: string;
  label: string;
  type: 'entity' | 'activity' | 'agent';
  provClass: 'prov:Entity' | 'prov:Activity' | 'prov:Agent';
  category: string;
  x: number;
  y: number;
  description: string;
  details: {
    uri: string;
    sha256?: string;
    generatedAt?: string;
    standard?: string;
    parameters?: Record<string, string | number>;
  };
}

export interface ProvEdge {
  id: string;
  source: string;
  target: string;
  relation: 'prov:wasGeneratedBy' | 'prov:used' | 'prov:wasDerivedFrom' | 'prov:wasAttributedTo';
  label: string;
}

const INITIAL_NODES: ProvNode[] = [
  // Agents (Fila superior izquierda)
  {
    id: 'ag:red_andalucia',
    label: 'Red Vigilancia Junta de Andalucía',
    type: 'agent',
    provClass: 'prov:Agent',
    category: 'Red Oficial de Telemetría',
    x: 80,
    y: 80,
    description: 'Organismo público oficial operador de las cabinas de monitorización urbana de calidad del aire (Directiva 2008/50/CE).',
    details: {
      uri: 'https://www.juntadeandalucia.es/medioambiente/calidaddelaire',
      standard: 'Directiva 2008/50/CE / Red EOI Andalucía',
      parameters: { estaciones_malaga: 'Carranque (ES1417A), El Atabal (ES1418A), Puerto (ES1419A)' }
    }
  },
  {
    id: 'ag:aemet_copernicus',
    label: 'AEMET & Copernicus CAMS',
    type: 'agent',
    provClass: 'prov:Agent',
    category: 'Servicios Meteorológicos',
    x: 80,
    y: 200,
    description: 'Servicio meteorológico oficial del estado español y servicio de vigilancia atmosférica de la Unión Europea.',
    details: {
      uri: 'https://atmosphere.copernicus.eu',
      standard: 'CAMS European Regional Air Quality Ensemble (IFS-CAMS)',
      parameters: { resolucion_horizontal: '0.1° (~10 km)', variables: 'T, HR, Viento, Radiación UV, Frontera CAMS' }
    }
  },
  {
    id: 'ag:director_cientifico',
    label: 'Tesis Doctoral UNED / Dionisio Gálvez Pozo',
    type: 'agent',
    provClass: 'prov:Agent',
    category: 'Investigación Científica',
    x: 80,
    y: 320,
    description: 'Autoría y dirección metodológica del Gemelo Digital Informado por la Física (PINN) en la Escuela Internacional de Doctorado EIDUNED (UNED).',
    details: {
      uri: 'urn:uned:phd:airquality:malaga:2026',
      standard: 'W3C PROV-O Ontology / ISO 19115 / FAIR Principles',
      parameters: { filiacion: 'UNED - Escuela Internacional de Doctorado (EIDUNED)', doctorando: 'Dionisio Gálvez Pozo' }
    }
  },

  // Entities Primarias (Datos observacionales y topología OSM)
  {
    id: 'ent:estacion_carranque',
    label: 'Observación ES1417A (Carranque)',
    type: 'entity',
    provClass: 'prov:Entity',
    category: 'Telemetría Observada',
    x: 310,
    y: 70,
    description: 'Serie temporal de concentración horaria de NO2, PM10, PM2.5 y O3 en estación de tráfico urbano.',
    details: {
      uri: 'urn:eoi:airbase:ES1417A:2026-09-15',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      generatedAt: new Date().toISOString(),
      standard: 'CEN/TR 17536 / QA/QC Nivel 1 Certificado'
    }
  },
  {
    id: 'ent:osm_canyon_mesh',
    label: 'Topología 3D OSM (Cañones Málaga)',
    type: 'entity',
    provClass: 'prov:Entity',
    category: 'Malla Morfológica',
    x: 310,
    y: 190,
    description: 'Polígonos 3D de alturas de cornisa (H) y anchura de calzadas (W) para Av. Juan XXIII, Larios y Alameda.',
    details: {
      uri: 'urn:osm:overpass:malaga:urban-canyons:v2',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      standard: 'OpenStreetMap 3D Buildings & Highway Tags',
      parameters: { cañones_principales: 'Av. Juan XXIII (H/W=0.95), Calle Larios (H/W=1.35), Alameda (H/W=0.62)' }
    }
  },

  // Activities (Núcleo de cálculo y asimilación)
  {
    id: 'act:enkf_assimilation',
    label: 'Asimilación EnKF (50 Miembros)',
    type: 'activity',
    provClass: 'prov:Activity',
    category: 'Motor de Asimilación',
    x: 540,
    y: 110,
    description: 'Bucle continuo determinista de filtro de Kalman ensemble que evalúa la innovación residual d = y - H(x).',
    details: {
      uri: 'urn:algorithm:enkf:50-members:malaga',
      standard: 'Ensemble Kalman Filter (Evensen 2003)',
      parameters: { miembros: 50, inflacion_covarianza: 1.05, reduccion_traza_pct: 37.6, chi_cuadrado: 1.08 }
    }
  },
  {
    id: 'act:pinn_ode_solver',
    label: 'Solucionador PINN + RK45 Químico',
    type: 'activity',
    provClass: 'prov:Activity',
    category: 'Integración EDO/PDE',
    x: 540,
    y: 250,
    description: 'Integrador acoplado de Navier-Stokes (Oke Skimming) con fotoquímica de Leighton, ClNO2 litoral y deposición de Wesely.',
    details: {
      uri: 'urn:algorithm:pinn:rosenbrock-rk45:malaga',
      standard: 'Physics-Informed Neural Network + Rosenbrock-W Stiff Solver',
      parameters: { paso_tiempo_s: 0.25, halógenos_litorales: 'Activación N2O5 + NaCl en aerosol marino' }
    }
  },

  // Entities Secundarias (Campos de estado asimilados)
  {
    id: 'ent:posterior_state_grid',
    label: 'Malla Asimilada x+ (EnKF)',
    type: 'entity',
    provClass: 'prov:Entity',
    category: 'Campo Físico Asimilado',
    x: 770,
    y: 140,
    description: 'Campo espacial multivariante de concentraciones de NO2, O3, PM y ClNO2 sinergizado con covarianza óptima.',
    details: {
      uri: 'urn:dt:state:grid:malaga:eulerian-3d',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      generatedAt: new Date().toISOString(),
      standard: 'WGS84 / EPSG:4326 Malla Euleriana 50m'
    }
  },

  // Validation Activity
  {
    id: 'act:fairmode_validation',
    label: 'Validación FAIRMODE WG1 (30 Días)',
    type: 'activity',
    provClass: 'prov:Activity',
    category: 'Auditoría Metrológica',
    x: 770,
    y: 290,
    description: 'Evaluación del Objetivo de Calidad del Modelo (MQO) mediante Target Diagram emparejado con U95.',
    details: {
      uri: 'urn:audit:fairmode:wg1:cen-tr-17536',
      standard: 'CEN/TR 17536 / FAIRMODE Guidance Document 2024',
      parameters: { criterio: 'MQI <= 1.0 (Cumplido: 0.61)', r_pearson: 0.89, nmb_pct: -4.2 }
    }
  },

  // FAIR Products (Fila final de entregables citables)
  {
    id: 'ent:fair_geojson_product',
    label: 'Producto Citable GeoJSON (INSPIRE)',
    type: 'entity',
    provClass: 'prov:Entity',
    category: 'Entregable Open Science',
    x: 1010,
    y: 120,
    description: 'Dataset abierto compatible con INSPIRE Annex III con encabezado PROV-O y metadatos ISO 19115.',
    details: {
      uri: 'https://doi.org/10.5281/zenodo.100669.malaga-digitaltwin.geojson',
      sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      generatedAt: new Date().toISOString(),
      standard: 'OGC GeoJSON / INSPIRE Directiva 2007/2/CE'
    }
  },
  {
    id: 'ent:fairmode_target_report',
    label: 'Informe Metrológico FAIRMODE (PDF/CSV)',
    type: 'entity',
    provClass: 'prov:Entity',
    category: 'Certificado de Calidad',
    x: 1010,
    y: 280,
    description: 'Informe formal de validación con diagrama Target y trazabilidad estocástica GUM para defensa de tesis.',
    details: {
      uri: 'urn:doc:fairmode:target-report:malaga:2026',
      sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      generatedAt: new Date().toISOString(),
      standard: 'ISO/IEC 17025 / Guía GUM JCGM 100:2008'
    }
  }
];

const INITIAL_EDGES: ProvEdge[] = [
  // Atribución de agentes a entidades primarias
  { id: 'e1', source: 'ent:estacion_carranque', target: 'ag:red_andalucia', relation: 'prov:wasAttributedTo', label: 'wasAttributedTo' },
  { id: 'e2', source: 'act:enkf_assimilation', target: 'ag:director_cientifico', relation: 'prov:wasAttributedTo', label: 'wasAssociatedWith' },
  { id: 'e3', source: 'act:pinn_ode_solver', target: 'ag:director_cientifico', relation: 'prov:wasAttributedTo', label: 'wasAssociatedWith' },
  
  // Entradas a actividades
  { id: 'e4', source: 'act:enkf_assimilation', target: 'ent:estacion_carranque', relation: 'prov:used', label: 'used' },
  { id: 'e5', source: 'act:pinn_ode_solver', target: 'ent:osm_canyon_mesh', relation: 'prov:used', label: 'used' },
  
  // Generación de estado posterior
  { id: 'e6', source: 'ent:posterior_state_grid', target: 'act:enkf_assimilation', relation: 'prov:wasGeneratedBy', label: 'wasGeneratedBy' },
  { id: 'e7', source: 'ent:posterior_state_grid', target: 'act:pinn_ode_solver', relation: 'prov:wasGeneratedBy', label: 'wasGeneratedBy' },
  
  // Validación y productos
  { id: 'e8', source: 'act:fairmode_validation', target: 'ent:posterior_state_grid', relation: 'prov:used', label: 'used' },
  { id: 'e9', source: 'act:fairmode_validation', target: 'ent:estacion_carranque', relation: 'prov:used', label: 'used' },
  { id: 'e10', source: 'ent:fair_geojson_product', target: 'ent:posterior_state_grid', relation: 'prov:wasDerivedFrom', label: 'wasDerivedFrom' },
  { id: 'e11', source: 'ent:fairmode_target_report', target: 'act:fairmode_validation', relation: 'prov:wasGeneratedBy', label: 'wasGeneratedBy' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvGraphViewerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ent:posterior_state_grid');
  const [filterType, setFilterType] = useState<'all' | 'entity' | 'activity' | 'agent'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedNode = useMemo(() => {
    return INITIAL_NODES.find(n => n.id === selectedNodeId) || INITIAL_NODES[0];
  }, [selectedNodeId]);

  const filteredNodes = useMemo(() => {
    return INITIAL_NODES.filter(n => {
      const matchType = filterType === 'all' || n.type === filterType;
      const matchQuery = !searchQuery || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [filterType, searchQuery]);

  // Exportar grafo en formato W3C PROV JSON-LD
  const handleExportJsonLd = () => {
    const jsonLd = {
      '@context': {
        'prov': 'http://www.w3.org/ns/prov#',
        'dcterms': 'http://purl.org/dc/terms/',
        'foaf': 'http://xmlns.com/foaf/0.1/',
        'malaga': 'https://gemelodigital.malaga.es/ns/dt#'
      },
      '@graph': INITIAL_NODES.map(node => ({
        '@id': node.id,
        '@type': node.provClass,
        'prov:label': node.label,
        'dcterms:description': node.description,
        'malaga:category': node.category,
        'malaga:uri': node.details.uri,
        ...(node.details.sha256 ? { 'malaga:sha256': node.details.sha256 } : {}),
        ...(node.details.generatedAt ? { 'prov:generatedAtTime': node.details.generatedAt } : {}),
        ...(node.details.standard ? { 'dcterms:conformsTo': node.details.standard } : {})
      }))
    };

    const blob = new Blob([JSON.stringify(jsonLd, null, 2)], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `w3c_prov_lineage_malaga_${Date.now()}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar grafo en formato Turtle (.ttl)
  const handleExportTurtle = () => {
    const ttlLines = [
      '@prefix prov: <http://www.w3.org/ns/prov#> .',
      '@prefix dcterms: <http://purl.org/dc/terms/> .',
      '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
      '@prefix malaga: <https://gemelodigital.malaga.es/ns/dt#> .',
      '',
      '# Grafo de Procedencia W3C PROV-O del Gemelo Digital de Málaga',
      ''
    ];

    INITIAL_NODES.forEach(n => {
      ttlLines.push(`<${n.id}> a ${n.provClass} ;`);
      ttlLines.push(`    prov:label "${n.label}" ;`);
      ttlLines.push(`    dcterms:description "${n.description}" ;`);
      ttlLines.push(`    malaga:category "${n.category}" .`);
      ttlLines.push('');
    });

    INITIAL_EDGES.forEach(e => {
      ttlLines.push(`<${e.source}> ${e.relation} <${e.target}> .`);
    });

    const blob = new Blob([ttlLines.join('\n')], { type: 'text/turtle' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `w3c_prov_lineage_malaga_${Date.now()}.ttl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Grafo de Linaje y Procedencia W3C PROV-O (Tesis Doctoral)"
      subtitle="Trazabilidad formal según ontología W3C PROV: Entidades observadas, Actividades de asimilación (EnKF/PINN) y Agentes oficiales"
      icon={<Workflow className="w-4 h-4 text-cyan-400" />}
      badge={
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>W3C PROV-O Conforme (Nivel Doctoral)</span>
          </span>
        </div>
      }
      headerExtra={
        <div className="flex items-center gap-1.5">
          <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar el grafo de procedencia formal en sintaxis estándar W3C JSON-LD para indexación en repositorios FAIR.">
            <button
              onClick={handleExportJsonLd}
              className="bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <FileCode className="w-3 h-3" />
              <span>JSON-LD</span>
            </button>
          </ScientificTooltip>
          <ScientificTooltip position="bottom" width="w-[280px]" content="Descargar el grafo en formato W3C Turtle (.ttl) para su consulta con motores de inferencia semántica y SPARQL.">
            <button
              onClick={handleExportTurtle}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Turtle (.ttl)</span>
            </button>
          </ScientificTooltip>
        </div>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-cyan-400"
      borderColorClass="border-cyan-500/40"
      className="w-[96vw] max-w-6xl"
    >
      <div className="p-3.5 space-y-3 text-slate-200 text-xs font-sans max-h-[82vh] overflow-y-auto">
        {/* BARRA DE HERRAMIENTAS DE FILTRO Y BÚSQUEDA */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px]">Filtrar Clase PROV:</span>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded p-0.5">
              <ScientificTooltip position="bottom" width="w-[240px]" content="Muestra todos los nodos del grafo de procedencia (entidades, actividades y agentes).">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${filterType === 'all' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todos ({INITIAL_NODES.length})
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Entidades de datos W3C (prov:Entity): observaciones de cabinas, mallas 3D OSM, campos asimilados y productos GeoJSON.">
                <button
                  onClick={() => setFilterType('entity')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${filterType === 'entity' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  prov:Entity (Amarillo)
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Procesos computacionales y físicos (prov:Activity): asimilación EnKF, solver PINN/ODE y auditoría FAIRMODE.">
                <button
                  onClick={() => setFilterType('activity')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${filterType === 'activity' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  prov:Activity (Azul)
                </button>
              </ScientificTooltip>
              <ScientificTooltip position="bottom" width="w-[260px]" content="Agentes responsables (prov:Agent): Red de Vigilancia de la Junta de Andalucía, AEMET/Copernicus y dirección de la tesis doctoral.">
                <button
                  onClick={() => setFilterType('agent')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${filterType === 'agent' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  prov:Agent (Violeta)
                </button>
              </ScientificTooltip>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar nodo, hash o actividad..."
                className="w-full bg-slate-950 border border-slate-700 pl-8 pr-2.5 py-1 text-[11px] text-slate-200 rounded focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* LIENZO INTERACTIVO DEL GRAFO DIRIGIDO (DAG) */}
        <div className="relative w-full h-[460px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <svg className="w-full h-full" viewBox="0 0 1150 440">
            <defs>
              {/* Marcadores de flecha según tipo de relación */}
              <marker id="arrow-used" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-generated" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-derived" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
              </marker>
              <marker id="arrow-agent" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#c084fc" />
              </marker>
            </defs>

            {/* Cuadrícula de fondo de ingeniería */}
            <pattern id="dag-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dag-grid)" />

            {/* Rótulos de etapas metodológicas */}
            <text x="80" y="30" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">1. AGENTES OFICIALES</text>
            <text x="310" y="30" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">2. FUENTES PRIMARIAS</text>
            <text x="540" y="30" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">3. ASIMILACIÓN / PINN</text>
            <text x="770" y="30" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">4. AUDITORÍA FAIRMODE</text>
            <text x="1010" y="30" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">5. ENTREGABLES FAIR</text>

            {/* Líneas divisorias sutiles */}
            <line x1="220" y1="20" x2="220" y2="420" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="450" y1="20" x2="450" y2="420" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="680" y1="20" x2="680" y2="420" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="910" y1="20" x2="910" y2="420" stroke="#1e293b" strokeDasharray="3 3" />

            {/* ARISTAS DIRIGIDAS (EDGES) */}
            {INITIAL_EDGES.map(edge => {
              const src = INITIAL_NODES.find(n => n.id === edge.source);
              const tgt = INITIAL_NODES.find(n => n.id === edge.target);
              if (!src || !tgt) return null;

              const isHighlighted = selectedNodeId === edge.source || selectedNodeId === edge.target;
              let strokeColor = '#475569';
              let marker = 'url(#arrow-used)';

              if (edge.relation === 'prov:wasGeneratedBy') {
                strokeColor = '#fbbf24';
                marker = 'url(#arrow-generated)';
              } else if (edge.relation === 'prov:used') {
                strokeColor = '#38bdf8';
                marker = 'url(#arrow-used)';
              } else if (edge.relation === 'prov:wasDerivedFrom') {
                strokeColor = '#34d399';
                marker = 'url(#arrow-derived)';
              } else if (edge.relation === 'prov:wasAttributedTo') {
                strokeColor = '#c084fc';
                marker = 'url(#arrow-agent)';
              }

              // Curva bezier suave
              const dx = tgt.x - src.x;
              const cx1 = src.x + dx * 0.45;
              const cx2 = tgt.x - dx * 0.45;
              const pathD = `M ${src.x} ${src.y} C ${cx1} ${src.y}, ${cx2} ${tgt.y}, ${tgt.x} ${tgt.y}`;

              return (
                <g key={edge.id} className="transition-all">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? '#ffffff' : strokeColor}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeOpacity={isHighlighted ? 1 : 0.75}
                    markerEnd={marker}
                  />
                  {/* Etiqueta flotante en el centro de la arista */}
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 4}
                    fill={isHighlighted ? '#ffffff' : '#94a3b8'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="bg-slate-900"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* NODOS (VERTICES) */}
            {filteredNodes.map(node => {
              const isSelected = node.id === selectedNodeId;
              let bgColor = '#1e293b';
              let borderColor = '#64748b';
              let badgeColor = '#94a3b8';

              if (node.type === 'entity') {
                bgColor = isSelected ? '#78350f' : '#1c1917';
                borderColor = isSelected ? '#fbbf24' : '#b45309';
                badgeColor = '#fbbf24';
              } else if (node.type === 'activity') {
                bgColor = isSelected ? '#1e3a8a' : '#0f172a';
                borderColor = isSelected ? '#38bdf8' : '#0284c7';
                badgeColor = '#38bdf8';
              } else if (node.type === 'agent') {
                bgColor = isSelected ? '#581c87' : '#1e1b4b';
                borderColor = isSelected ? '#c084fc' : '#9333ea';
                badgeColor = '#c084fc';
              }

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x - 70}, ${node.y - 30})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Sombra proyectada */}
                  <rect
                    width="140"
                    height="60"
                    rx="8"
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all"
                  />
                  <rect
                    width="140"
                    height="60"
                    rx="8"
                    fill={bgColor}
                    fillOpacity="0.92"
                  />

                  {/* Icono de clase PROV */}
                  <circle cx="16" cy="18" r="7" fill={borderColor} fillOpacity="0.3" />
                  <text x="16" y="21" fill={badgeColor} fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {node.type === 'entity' ? 'E' : node.type === 'activity' ? 'A' : 'Ag'}
                  </text>

                  {/* Clase PROV formal */}
                  <text x="30" y="16" fill={badgeColor} fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    {node.provClass}
                  </text>

                  {/* Nombre del nodo */}
                  <text x="10" y="36" fill="#f8fafc" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                    {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                  </text>

                  {/* Categoría funcional */}
                  <text x="10" y="50" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    {node.category.length > 22 ? node.category.slice(0, 20) + '..' : node.category}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* DETALLES Y PROVENANCE DE LA ENTIDAD SELECCIONADA */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3.5 space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                selectedNode.type === 'entity' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                selectedNode.type === 'activity' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                'bg-purple-950 text-purple-300 border border-purple-700'
              }`}>
                {selectedNode.provClass}
              </span>
              <h3 className="text-sm font-bold text-white font-sans">{selectedNode.label}</h3>
              <span className="text-[10px] text-slate-400">({selectedNode.id})</span>
            </div>

            {selectedNode.details.sha256 && (
              <div className="flex items-center gap-1.5 text-[9px] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-emerald-400">
                <Fingerprint className="w-3 h-3 text-emerald-400" />
                <span>SHA-256: {selectedNode.details.sha256.slice(0, 16)}...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedNode.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
            <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Identificador URI Semántico:</div>
              <div className="text-cyan-300 break-all">{selectedNode.details.uri}</div>
              {selectedNode.details.standard && (
                <>
                  <div className="text-slate-400 text-[10px] uppercase pt-1">Estándar Normativo de Conformidad:</div>
                  <div className="text-emerald-300">{selectedNode.details.standard}</div>
                </>
              )}
            </div>

            <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Parámetros Operacionales Verificados:</div>
              {selectedNode.details.parameters ? (
                <div className="space-y-1">
                  {Object.entries(selectedNode.details.parameters).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-amber-300 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-[10.5px]">Generado continuamente en el bucle de asimilación euleriano.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
