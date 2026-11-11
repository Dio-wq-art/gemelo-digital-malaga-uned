import React, { useState } from 'react';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import {
  Skull,
  Biohazard,
  Atom,
  BookOpen,
  FileText,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Building,
  Wind,
  HeartCrack,
  Dna
} from 'lucide-react';

interface SubstanceDetail {
  id: string;
  name: string;
  chemicalFormula: string;
  casNumber: string;
  iarcClassification: string;
  formationMechanism: string;
  toxicologicalPathways: string[];
  targetOrgans: string[];
  regulatoryLimits: string;
  thesisImpactAnalysis: string;
}

const CRITICAL_CEMENT_TOXICS: SubstanceDetail[] = [
  {
    id: 'pcdd_f',
    name: 'Dioxinas y Furanos (PCDD/PCDF & PCB-DL)',
    chemicalFormula: 'C₁₂H₄Cl₄O₂ (TCDD eq.)',
    casNumber: '1746-01-6 (2,3,7,8-TCDD)',
    iarcClassification: 'Grupo 1 (Carcinógeno Humano Demostrado)',
    formationMechanism: 'Síntesis "de novo" en la zona de enfriamiento de gases (200 °C - 450 °C) en el precalentador/filtro, catalizada por cobre y hollín en presencia de cloro de combustibles alternativos (CDR/plásticos/neumáticos).',
    toxicologicalPathways: [
      'Unión de alta afinidad al receptor celular AhR (Aryl Hydrocarbon Receptor)',
      'Desregulación transcripcional de genes de desintoxicación (CYP1A1, CYP1B1)',
      'Disrupción endocrina tiroidea, estrogénica y androgénica a concentraciones de picogramos',
      'Teratogénesis, toxicidad inmunitaria y biomagnificación acumulativa en tejido adiposo (semivida > 7-11 años en humanos)'
    ],
    targetOrgans: ['Hígado', 'Sistema Linfático', 'Tiroides', 'Glándula Mamaria', 'Sistema Reproductor'],
    regulatoryLimits: 'Directiva 2010/75/UE: 0.1 ng TEQ/Nm³ (Límite MTD)',
    thesisImpactAnalysis: 'El ISCIII demostró una correlación espacial entre la cercanía a hornos con co-incineración y el incremento de linfomas no Hodgkin y sarcomas de tejidos blandos.'
  },
  {
    id: 'mercury',
    name: 'Mercurio Elemental y Metilmercurio (Hg⁰, Hg²⁺, MeHg)',
    chemicalFormula: 'Hg / [CH₃Hg]⁺',
    casNumber: '7439-97-6',
    iarcClassification: 'Grupo 2B / 3 (Metilmercurio neurotóxico crítico)',
    formationMechanism: 'Volatilización termodinámica completa en el horno (T_eb = 356.7 °C). A diferencia de otros metales pesados, el Hg no se condensa en el clinker ni es retenido eficazmente por filtros de mangas/electrostáticos, saliendo en fase vapor por la chimenea.',
    toxicologicalPathways: [
      'Inhibición de la tioredoxina reductasa y selenoproteínas neuronales',
      'Pérdida de integridad de la barrera hematoencefálica y daño sináptico irreversible',
      'Metilación biológica en aguas de la Bahía de Málaga y bioacumulación trófica en peces (pez espada, atún)',
      'Neurotoxicidad del desarrollo fetal: pérdida de CI, déficit de atención y trastornos motores'
    ],
    targetOrgans: ['Cerebro', 'Corteza Cerebral', 'Riñones', 'Sistema Cardiovascular'],
    regulatoryLimits: 'Directiva 2010/75/UE (BREF 2013): 0.05 mg/Nm³',
    thesisImpactAnalysis: 'La planta de La Araña declara emisiones periódicas de Hg en E-PRTR que se dispersan sobre la franja litoral de Málaga Este y el Mar de Alborán.'
  },
  {
    id: 'chromium_vi',
    name: 'Cromo Hexavalente (Cr VI)',
    chemicalFormula: 'CrO₄²⁻ / Cr₂O₇²⁻',
    casNumber: '18540-29-9',
    iarcClassification: 'Grupo 1 (Carcinógeno Humano de Máxima Potencia)',
    formationMechanism: 'Oxidación térmica del cromo trivalente (Cr III) de los ladrillos refractarios de magnesita-espinela y materias primas a más de 1.400 °C en atmósfera oxidante dentro del horno rotatorio.',
    toxicologicalPathways: [
      'Entrada celular indiscriminada a través de transportadores de sulfato inorgánico',
      'Reducción intracelular a Cr(III) con generación masiva de radicales hidroxilo (OH•)',
      'Aductos covalentes ADN-proteína, roturas de doble cadena y mutaciones en oncogenes p53 y KRAS',
      'Rinitis ulcerativa, perforación del tabique nasal, asma ocupacional y carcinoma broncogénico'
    ],
    targetOrgans: ['Epitelio Bronquial', 'Alvéolos Pulmonares', 'Fosas Nasales', 'Piel'],
    regulatoryLimits: 'Suma de metales pesados volátiles: 0.5 mg/Nm³',
    thesisImpactAnalysis: 'El polvo de cemento fugitivo y de chimenea contiene Cr(VI) hidrosoluble bioasimilable, altamente irritante para vías respiratorias infantiles.'
  },
  {
    id: 'caustic_clinker',
    name: 'Aerosol Cáustico de Clinker & Sílice Cristalina (CaO libre, SiO₂)',
    chemicalFormula: 'CaO + H₂O → Ca(OH)₂ (pH > 11.5) + SiO₂ (Cuarzo)',
    casNumber: '1305-78-8 (CaO) / 14808-60-7 (SiO₂)',
    iarcClassification: 'Grupo 1 (Sílice Cristalina Inhalada en Forma de Cuarzo)',
    formationMechanism: 'Fracción micronizada de harina cruda y clinker no retenida o fugitiva durante el enfriamiento y molienda. Contiene óxido de calcio libre altamente reactivo.',
    toxicologicalPathways: [
      'Reacción exotérmica inmediata con el surfactante pulmonar acuoso produciendo hidróxido de calcio fuertemente alcalino',
      'Lisis alcalina de membranas celulares y quemadura química del endotelio bronquiolar',
      'Fagocitosis frustrada por macrófagos alveolares expuestos a microcristales de cuarzo/sílice',
      'Desencadenamiento de cascada fibrótica pulmonar (silicosis acelerada) y EPOC no tabáquico'
    ],
    targetOrgans: ['Parénquima Pulmonar', 'Macrófagos Alveolares', 'Pleura'],
    regulatoryLimits: 'Límite de emisión canalizada: 10-20 mg/Nm³ (PM total)',
    thesisImpactAnalysis: 'El carácter alcalino cáustico diferencia al polvo de cementera del tráfico rodado: produce daño lítico de contacto en epitelios húmedos.'
  },
  {
    id: 'ultrafine_soot',
    name: 'Partículas Ultrafinas (PM₀.₁ / PM₁) & HAPs Adsorbidos',
    chemicalFormula: 'C (Carbon Black) + Benzo[a]pireno C₂₀H₁₂',
    casNumber: '50-32-8 (B[a]P)',
    iarcClassification: 'Grupo 1 (Emisiones de hollín y HAPs policíclicos)',
    formationMechanism: 'Combustión incompleta de combustibles fósiles pesados (coque de petróleo) y residuos sólidos en el quemador principal, generando aerosoles de condensación sub-100 nm.',
    toxicologicalPathways: [
      'Evasión del aclaramiento mucociliar y translocación instantánea a los capilares alveolares',
      'Paso a la circulación sistémica: inflamación vascular endotelial y aterosclerosis acelerada',
      'Paso de la barrera olfatoria al bulbo raquídeo con neuroinflamación precoz',
      'Intercalación de metabolitos diol-epóxido de HAPs en el ADN celular'
    ],
    targetOrgans: ['Endotelio Vascular', 'Sistema Coronario', 'Bulbo Olfatorio Cerebral', 'Pulmones'],
    regulatoryLimits: 'Sin valor límite específico para PM0.1 en normativa europea (vacío regulatorio)',
    thesisImpactAnalysis: 'Constituyen el vector físico que transporta metales pesados y dioxinas hasta la profundidad del lecho vascular de los residentes de El Candado y El Palo.'
  }
];

export const CementToxicologyThesisReport: React.FC = () => {
  const [selectedSubstance, setSelectedSubstance] = useState<string>('pcdd_f');
  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);
  const activeCtx = useActivePoint();

  const currentSubstance = CRITICAL_CEMENT_TOXICS.find((s) => s.id === selectedSubstance) || CRITICAL_CEMENT_TOXICS[0];

  // Cálculo geodésico desde la planta cementera de La Araña (36.7153°N, -4.3164°W) hasta el Punto Activo
  const aranaLat = 36.7153;
  const aranaLon = -4.3164;
  const activeLat = activeCtx?.activePoint?.lat ?? 36.7196;
  const activeLon = activeCtx?.activePoint?.lon ?? -4.4200;
  const activeStreet = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Calle Marqués de Larios';
  const activeDistrict = activeCtx?.activePoint?.districtName || 'Distrito 1: Centro';
  const dLatKm = (activeLat - aranaLat) * 111.32;
  const dLonKm = (activeLon - aranaLon) * 111.32 * Math.cos((aranaLat * Math.PI) / 180);
  const distFromAranaKm = Math.max(0.15, Math.sqrt(dLatKm * dLatKm + dLonKm * dLonKm));
  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.4;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? 9.8;
  const activePM10 = activeCtx?.assimilation?.pm10UgM3 ?? 18.5;
  const estimatedClinkerFractionUgM3 = Number((Math.max(0.12, (activePM10 * 0.18) / (1 + distFromAranaKm * 0.35))).toFixed(2));

  const bibtexCitation = `@article{garcia_perez_cement_2015,
  title = {Cancer mortality in towns in the vicinity of Spanish cement plants: a spatial analysis},
  author = {García-Pérez, Javier and López-Abente, Gonzalo and Gómez-Barroso, Diana and Morales-Piga, Antonio and Romaguera, Rosario and Fernández-Navarro, Pablo},
  journal = {Environmental Research},
  volume = {136},
  pages = {362--375},
  year = {2015},
  publisher = {Elsevier},
  doi = {10.1016/j.envres.2014.09.043}
}`;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(bibtexCitation);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2500);
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* BANNER SINCRONIZADO CON EL PUNTO ACTIVO (REGLA 10 AGENTS.MD) */}
      <div className="bg-slate-950/95 border border-emerald-500/40 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-emerald-300 font-bold">RECEPTOR ACTIVO SINCRONIZADO:</span>
          <span className="text-white font-bold">{activeStreet}</span>
          <span className="text-slate-400">({activeDistrict} • Distancia a Cementera La Araña: <strong className="text-amber-300">{distFromAranaKm.toFixed(2)} km</strong>)</span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px]">
          <span className="text-rose-300">NO₂: <strong>{activeNO2.toFixed(1)} µg/m³</strong></span>
          <span className="text-amber-300">PM₂.₅: <strong>{activePM25.toFixed(1)} µg/m³</strong></span>
          <span className="text-cyan-300">PM₁₀: <strong>{activePM10.toFixed(1)} µg/m³</strong></span>
          <span className="text-purple-300">Aporte Clinker Est.: <strong>{estimatedClinkerFractionUgM3} µg/m³</strong></span>
        </div>
      </div>
      
      {/* 1. SÍNTESIS EJECUTIVA DE LA TESIS: ¿POR QUÉ SON TAN DAÑINAS LAS CEMENTERAS? */}
      <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-900/60 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-950 border border-red-700 rounded-lg text-red-400">
              <Biohazard className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-red-300 font-mono tracking-wide uppercase">
                Evidencia Científica & Fisiopatología de Emisiones Cementeras
              </h3>
              <span className="text-[10px] text-slate-400 font-sans">
                Fundamento de Tesis Doctoral: Co-incineración de Residuos, Toxicidad de Mezcla y Exposición Crónica
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-mono font-bold">
            REVISIÓN TOXICOLÓGICA ISCIII
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          A diferencia de una central térmica o de los motores diésel de automoción, un horno de cemento con <strong>co-incineración de residuos (CDR, lodos, neumáticos, plásticos)</strong> opera a temperaturas extremas de llama (hasta <strong>2.000 °C</strong>) y trata minerales calcáreos con impurezas complejas. Esto genera una <strong>matriz de polución multipoluto singular</strong> caracterizada por:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] font-sans pt-1">
          <div className="bg-slate-900/90 border border-red-900/40 p-2.5 rounded-lg space-y-1">
            <span className="font-bold text-red-300 flex items-center gap-1.5 font-mono text-[10.5px]">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>1. Co-incineración & Dioxinas</span>
            </span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              La quema de harinas de residuos clorados induce síntesis de novo de <strong>PCDD/F y PCBs tipo dioxina</strong> en zonas de post-enfriamiento de gases, los compuestos más cancerígenos conocidos (IARC Grupo 1).
            </p>
          </div>

          <div className="bg-slate-900/90 border border-amber-900/40 p-2.5 rounded-lg space-y-1">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-[10.5px]">
              <Atom className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Escape Térmico de Mercurio</span>
            </span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              El <strong>Mercurio (Hg)</strong> se vaporiza íntegramente a 357 °C y escapa en fase gas a través de los filtros de mangas convencionales, depositándose en el litoral malagueño con alta bioacumulación marina.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-sky-900/40 p-2.5 rounded-lg space-y-1">
            <span className="font-bold text-sky-300 flex items-center gap-1.5 font-mono text-[10.5px]">
              <Skull className="w-3.5 h-3.5 text-sky-400" />
              <span>3. Aerosol Alcalino Cáustico</span>
            </span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              El polvo de clinker contiene <strong>CaO libre (cal viva)</strong>. Al inhalarse, reacciona con la humedad alveolar produciendo hidróxido de calcio a <strong>pH &gt; 11.5</strong>, causando quemaduras químicas y necrosis tisular.
            </p>
          </div>
        </div>
      </div>

      {/* 2. EXPLORADOR INTERACTIVO DE CONTAMINANTES CRÍTICOS */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">
              Matriz de Toxicidad Específica de la Planta de La Araña
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Seleccione un vector químico:</span>
        </div>

        {/* Botones de Selección de Sustancia */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {CRITICAL_CEMENT_TOXICS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubstance(sub.id)}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                selectedSubstance === sub.id
                  ? 'bg-purple-600 text-white shadow-md scale-102'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{sub.name.split(' (')[0]}</span>
            </button>
          ))}
        </div>

        {/* Ficha Detallada de la Sustancia Seleccionada */}
        <div className="bg-slate-900/90 border border-purple-900/40 rounded-xl p-3.5 space-y-3 font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 font-mono">
            <div>
              <span className="text-sm font-bold text-purple-300 block">{currentSubstance.name}</span>
              <span className="text-[10px] text-slate-400">Fórmula: {currentSubstance.chemicalFormula} • CAS: {currentSubstance.casNumber}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-800 text-[10px] font-bold">
                {currentSubstance.iarcClassification}
              </span>
              <ScientificTooltip
                title={`Clasificación IARC & Toxicología: ${currentSubstance.name}`}
                content={`Monografías IARC (Agencia Internacional para la Investigación del Cáncer / OMS). Clasificación toxicológica y evidencia de carcinogenicidad en humanos. Análisis para la planta cementera de La Araña.`}
                formula={currentSubstance.chemicalFormula}
                regulatory={currentSubstance.regulatoryLimits}
                citation="IARC Monographs on the Identification of Carcinogenic Hazards to Humans (WHO)"
                position="left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                  Mecanismo Termodinámico de Formación en Horno:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800">
                  {currentSubstance.formationMechanism}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                    Límites Regulatorios Europeos:
                  </span>
                  <ScientificTooltip
                    title="Valores Límite de Emisión (VLE MTD)"
                    content="Conclusiones sobre las Mejores Técnicas Disponibles (MTD / BAT) para la fabricación de cemento, cal y óxido de magnesio. Directiva 2010/75/UE de emisiones industriales."
                    regulatory={currentSubstance.regulatoryLimits}
                    citation="Decisión de Ejecución 2013/163/UE de la Comisión Europea (BREF Cemento)"
                    position="top"
                  />
                </div>
                <span className="text-emerald-400 font-mono text-[11px] font-bold block bg-slate-950/80 p-2 rounded border border-slate-800">
                  {currentSubstance.regulatoryLimits}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                  Vías de Fisiopatología Molecular & Toxicogenómica:
                </span>
                <ul className="space-y-1 bg-slate-950/80 p-2 rounded border border-slate-800 text-[10.5px]">
                  {currentSubstance.toxicologicalPathways.map((path, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                      <ChevronRight className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                      <span>{path}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                  Órganos Diana Afectados:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentSubstance.targetOrgans.map((organ, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-700 rounded text-[9.5px] font-mono">
                      {organ}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-950/30 border border-purple-800/40 p-2 rounded-lg text-[10.5px] text-purple-200 font-sans">
            <strong>Relevancia en la Tesis de Málaga:</strong> {currentSubstance.thesisImpactAnalysis}
          </div>
        </div>
      </div>

      {/* 3. DOSSIER DE INVESTIGACIONES EPIDEMIOLÓGICAS: ISCIII & TESIS DOCTORALES */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-emerald-300 font-mono uppercase">
              Evidencia Epidemiológica Consolidada (ISCIII / Tesis Doctorales)
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Peer-Reviewed Science</span>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300">
          {/* Estudio 1: ISCIII García-Pérez et al. */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 font-mono text-[11px]">
                García-Pérez et al. (ISCIII, 2015 / 2017) — Environmental Research & Environment International
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-mono">
                Cohorte Nacional Española
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              El estudio de referencia a nivel estatal del <strong>Centro Nacional de Epidemiología (Instituto de Salud Carlos III)</strong> analizó la mortalidad por cáncer en municipios situados en el radio de <strong>2 a 5 km</strong> de las plantas cementeras españolas. Se comprobó un <strong>exceso de riesgo estadísticamente significativo</strong> de mortalidad por:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 font-mono text-[10px]">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-rose-400 font-bold block">Cáncer Colorrectal</span>
                <span className="text-[9px] text-slate-400">RR = 1.09 (p &lt; 0.05)</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-rose-400 font-bold block">Cáncer de Estómago</span>
                <span className="text-[9px] text-slate-400">RR = 1.14 (p &lt; 0.01)</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-rose-400 font-bold block">Cáncer Pleural</span>
                <span className="text-[9px] text-slate-400">RR = 1.25 (Mesotelioma)</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-rose-400 font-bold block">Leucemias / Linfomas</span>
                <span className="text-[9px] text-slate-400">RR = 1.10 (Pediátrico)</span>
              </div>
            </div>
          </div>

          {/* Estudio 2: Cohortes Pediátricas y Función Pulmonar */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 font-mono text-[11px]">
                Bertoldi et al. & Pelucchi et al. — Morbilidad Respiratoria Infantil
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[9px] font-mono">
                Pediatric Cohort
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Las cohortes infantiles que residen a sotavento de chimeneas cementeras muestran una <strong>reducción clínicamente relevante del FEV₁</strong> (Volumen Espiratorio Forzado en el primer segundo), una tasa incrementada de hospitalizaciones por crisis de broncoespasmo y mayor prevalencia de sensibilización alérgica debida a la lisis química que los aerosoles alcalinos provocan sobre la mucosa respiratoria inmadura.
            </p>
          </div>

          {/* Estudio 3: Tesis Universitat Rovira i Virgili */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 font-mono text-[11px]">
                Rovira, Schuhmacher & Domingo (URV) — Biomonitorización de Metales y Dioxinas
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono">
                Biomonitoring
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Las tesis de biomonitorización confirman que la población residente cercana a plantas con co-incineración acumula concentraciones estadísticamente más elevadas de <strong>PCDD/F en suero sanguíneo</strong> y de <strong>metales traza (Cr, Cd, Tl, Pb) en orina y cabello</strong>, confirmando la ingesta e inhalación crónica por vía ambiental.
            </p>
          </div>
        </div>

        {/* Tarjeta de Exportación de la Cita BibTeX para la Tesis */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              Cita citable del ISCIII (García-Pérez et al., 2015) para la Memoria de Tesis Doctoral:
            </span>
          </div>
          <button
            onClick={handleCopyCitation}
            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            {copiedBibtex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedBibtex ? '¡Copiado!' : 'Copiar BibTeX'}</span>
          </button>
        </div>
      </div>

      {/* 4. VULNERABILIDAD MICROCLIMÁTICA Y TERRITORIAL DE MÁLAGA ESTE */}
      <div className="bg-slate-950/80 border border-amber-900/40 rounded-xl p-3.5 space-y-3 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-amber-300 font-mono uppercase">
              Microclima de Málaga: Por qué La Araña Afecta con Fuerza a El Candado y El Palo
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Orografía & Fumigación TIBL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 font-mono text-[11px] block">
              1. Encajonamiento Topográfico & Brisa de Levante
            </span>
            <p className="text-slate-300 text-[10.5px]">
              La fábrica se emplaza a cota +15 m s.n.m. en una estrecha cornisa entre el mar y las laderas calizas de Peñón del Cuervo y la Sierra de San Antón. Cuando entra el <strong>viento de Levante (60° - 140°)</strong>, la pluma de gases no puede dispersarse libremente hacia el norte debido a la barrera orográfica de los Montes de Málaga, siendo <strong>canalizada longitudinalmente hacia el Oeste</strong> sobre las urbanizaciones de <em>El Candado, Miraflores del Palo, El Palo y Pedregalejo</em>.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 font-mono text-[11px] block">
              2. Efecto de Fumigación Costera (TIBL)
            </span>
            <p className="text-slate-300 text-[10.5px]">
              Al pasar el aire marítimo frío y estable sobre la superficie urbana recalentada de la costa malagueña, se forma la <strong>Capa Límite Térmica Interna (TIBL)</strong>. Cuando la pluma elevada de Holland (Hs = 85 m, Heff ≈ 265 m) entra en contacto con el techo de la TIBL, la turbulencia térmica <strong>"atrapa" y fuerza la caída súbita del penacho al nivel del suelo (*fumigation*)</strong>, generando picos agudos de inmisión de NO₂, SO₂ y micropartículas en zonas densamente habitadas.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
