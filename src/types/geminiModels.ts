export interface GeminiModelOption {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  category: 'pro' | 'flash' | 'lite' | 'auto';
  description: string;
  recommendedFor: string;
  speed: string;
  reasoning: string;
  isPro?: boolean;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Pensamiento y Razonamiento Científico Avanzado)',
    shortName: 'Gemini 3.1 Pro',
    tag: 'PRO STEM',
    category: 'pro',
    description: 'Máxima profundidad analítica para ecuaciones Navier-Stokes, tensores Reynolds, balances fotoquímicos y dictamen doctoral.',
    recommendedFor: 'Tesis doctoral, EDPs PINN, cinética rígida y peritaje judicial',
    speed: 'Medio (~2-3s)',
    reasoning: 'Máximo (STEM & Física)',
    isPro: true
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Alta Fidelidad y Velocidad)',
    shortName: 'Gemini 3.8 Flash',
    tag: 'FLASH 3.8',
    category: 'flash',
    description: 'Última generación multimodal con latencia ultrabaja y rigor determinista para streaming en tiempo real.',
    recommendedFor: 'Evaluación ágil de microclima, ZBE y respuestas interactivas',
    speed: 'Rápido (~0.9s)',
    reasoning: 'Alto'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite (Ultraligero y Mínima Latencia)',
    shortName: 'Gemini Flash Lite',
    tag: 'LITE',
    category: 'lite',
    description: 'Modelo altamente optimizado para consultas inmediatas con el menor consumo de recursos.',
    recommendedFor: 'Dispositivos móviles, consultas de campo y bajo ancho de banda',
    speed: 'Ultra Rápido (~0.4s)',
    reasoning: 'Estándar'
  },
  {
    id: 'auto',
    name: 'Auto-Adaptativo (Cascada Pro ➔ Flash ➔ Lite)',
    shortName: 'Auto (Cascada)',
    tag: 'AUTO',
    category: 'auto',
    description: 'Prioriza el razonamiento profundo de Gemini 3.1 Pro y desciende a Flash/Lite automáticamente ante saturación de cuota.',
    recommendedFor: 'Disponibilidad resiliente continua bajo cualquier condición de red',
    speed: 'Dinámico',
    reasoning: 'Adaptativo'
  }
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-pro-preview';
