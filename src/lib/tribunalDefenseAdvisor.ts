/**
 * Motor de Simulación de Preguntas del Tribunal de Tesis y Validación Q1 (EIDUNED / Tribunal Review)
 * Tesis Doctoral - Modelización de Calidad del Aire a Microescala en Málaga
 * 
 * Funciones Principales:
 * - Simulación de preguntas críticas de expertos internacionales (revisores ACP / GMD).
 * - Criterios de defensa de rigurosidad científica y ecuaciones de gobierno (PINN + ODE Solvers).
 * - CERO ALEATORIEDAD (Zero Stochastic Data): Formulación analítica basada en respuestas metodológicas formales.
 */

import { BoundedCache, hashParams } from './computationEngine';

export interface TribunalQuestion {
  id: string;
  category: 'Metodología PINN' | 'Cinética Química' | 'Dispersión Urbana' | 'Validación FAIRMODE' | 'Ciencia Abierta';
  reviewerPersona: string;
  questionText: string;
  defenseArgument: string;
  mathematicalProof: string;
  normativeReference: string;
  confidenceScore: number;
}

const tribunalCache = new BoundedCache<string, TribunalQuestion[]>(20);

export function getTribunalQuestions(): TribunalQuestion[] {
  return [
    {
      id: 'q1',
      category: 'Metodología PINN',
      reviewerPersona: 'Revisor Anónimo 1 (Atmospheric Environment / Q1)',
      questionText: '¿Cómo garantiza que la red neuronal informada por la física (PINN) no viola las leyes de conservación de masa y momento en los cañones estrechos de Málaga (ej. Calle Larios)?',
      defenseArgument: 'El término de pérdida (loss function) de la PINN incluye explícitamente las ecuaciones de Navier-Stokes y la ecuación de continuidad con restricciones duras (hard constraints) sobre las paredes de los edificios extraídas de la topología OSM LOD2.',
      mathematicalProof: 'ℒ_PINN = ℒ_data + λ₁ ||∇ · u||² + λ₂ ||u · ∇u + ∇p - ν ∇²u - F||²',
      normativeReference: 'Raissi et al. (2019) J. Comput. Phys. 378, 686-707.',
      confidenceScore: 98
    },
    {
      id: 'q2',
      category: 'Cinética Química',
      reviewerPersona: 'Especialista en Fotoquímica (Atmos. Chem. Phys.)',
      questionText: '¿Por qué se ha extendido el estado fotoestacionario de Leighton considerando la química nocturna de N₂O₅ y el ciclo de halógenos litorales en la Bahía de Málaga?',
      defenseArgument: 'Málaga presenta un marcado carácter costero donde la interacción entre el penacho urbano de NOx y las sales marinas (NaCl) produce activaciones heterogéneas nocturnas de ClNO₂, alterando significativamente el radical OH• matinal mediante fotólisis rápida.',
      mathematicalProof: 'Φ = ([NO] · [O₃]) / (J(NO₂) · [NO₂]) & d[ClNO₂]/dt = k_het · A_aerosol · v_rel · [N₂O₅]',
      normativeReference: 'Bertram & Thornton (2009) GRL 36, L19801; Directiva 2008/50/CE.',
      confidenceScore: 96
    },
    {
      id: 'q3',
      category: 'Validación FAIRMODE',
      reviewerPersona: 'Tribunal UNED (EIDUNED - Criterio de Calidad)',
      questionText: '¿Cómo se demuestra que los resultados del modelo superan los objetivos de calidad de modelización (MQO) exigidos por FAIRMODE WG1?',
      defenseArgument: 'Se evalúa mediante el indicador de calidad de modelización (MQI) y el análisis Target Plot, garantizando que el MQI sea estrictamente inferior a 1.0 en todas las estaciones de fondo y tráfico de la red oficial de Málaga.',
      mathematicalProof: 'MQI = RMSE / (ℬ · RMS_obs) ≤ 1.0 (CEN/TR 17538:2018)',
      normativeReference: 'FAIRMODE Guidance Document WG1 (Thunis et al., 2019 / JRC Science for Policy).',
      confidenceScore: 99
    },
    {
      id: 'q4',
      category: 'Dispersión Urbana',
      reviewerPersona: 'Experto en Dinámica de Capa Límite (Boundary Layer Meteorology)',
      questionText: '¿Cómo se maneja la transición entre el flujo de coronamiento de tejados (skimming flow) y el penacho inducido por tráfico en los bulevares de Málaga?',
      defenseArgument: 'Se implementa el modelo analítico EPA R-LINE / CALINE4 con corrección de meandro en bajo viento (Venkatram 2004) y el cálculo de la tasa de intercambio de aire (ACH) basada en la geometría local H/W de Oke (1987).',
      mathematicalProof: 'C(x,z) = (q_L / (√2π u σ_z)) · exp(-z²/(2σ_z²)) · erf(y/(√2σ_y))',
      normativeReference: 'Snyder et al. (2013) R-LINE Model Formulation; Oke (1988) Energy and Buildings.',
      confidenceScore: 97
    },
    {
      id: 'q5',
      category: 'Ciencia Abierta',
      reviewerPersona: 'Presidente del Tribunal de Tesis',
      questionText: '¿De qué manera cumple este trabajo con los principios de Ciencia Abierta y reutilización FAIR (Findable, Accessible, Interoperable, Reusable)?',
      defenseArgument: 'Todos los conjuntos de datos, mallas de cinéticas ODEs y metadatos se exportan de forma nativa en formatos abiertos estandarizados (GeoJSON espaciales, tablas CSV tabulares y fragmentos LaTeX reproducibles).',
      mathematicalProof: 'FAIR Metadata Compliance Level 4 + Open Science Framework Interoperability.',
      normativeReference: 'Wilkinson et al. (2016) Scientific Data 3, 160018.',
      confidenceScore: 100
    }
  ];
}
