import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface ModelQuotaStats {
  modelId: string;
  label: string;
  tierQuotaPriority: number; // Mayor número = mayor cuota por minuto/día disponible
  cooldownUntil: number;
  successCount: number;
  quotaHitCount: number;
  errorCount: number;
  lastLatencyMs: number;
  avgLatencyMs: number;
}

/**
 * Pool jerárquico de modelos oficiales Gemini ordenados por disponibilidad de cuota (RPM/RPD) y velocidad.
 * El balanceador elige dinámicamente el modelo saludable con mayor cuota libre,
 * o rota instantáneamente al siguiente si detecta 429 / RESOURCE_EXHAUSTED / alta latencia.
 */
const MODEL_POOL_CONFIG: Array<{
  modelId: string;
  label: string;
  tierQuotaPriority: number;
  category: "lite" | "flash" | "pro";
}> = [
  {
    modelId: "gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite (Máxima Cuota y Velocidad)",
    tierQuotaPriority: 100,
    category: "lite"
  },
  {
    modelId: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite (Pool Independiente Alta Cuota)",
    tierQuotaPriority: 95,
    category: "lite"
  },
  {
    modelId: "gemini-3-flash-preview",
    label: "Gemini 3 Flash (Equilibrio Multimodal y Cuota Alta)",
    tierQuotaPriority: 90,
    category: "flash"
  },
  {
    modelId: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash (Pool Secundario Multimodal)",
    tierQuotaPriority: 85,
    category: "flash"
  },
  {
    modelId: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro (Razonamiento STEM Doctoral)",
    tierQuotaPriority: 70,
    category: "pro"
  }
];

// Estado en vivo de salud y cuota de cada modelo
const modelHealthMap = new Map<string, ModelQuotaStats>();
for (const m of MODEL_POOL_CONFIG) {
  modelHealthMap.set(m.modelId, {
    modelId: m.modelId,
    label: m.label,
    tierQuotaPriority: m.tierQuotaPriority,
    cooldownUntil: 0,
    successCount: 0,
    quotaHitCount: 0,
    errorCount: 0,
    lastLatencyMs: 350,
    avgLatencyMs: 350
  });
}

export interface GroundingSourceItem {
  title: string;
  uri: string;
}

// Caché LRU global compartida para evitar gastar cuota en consultas repetidas
const globalResponseCache = new Map<
  string,
  { text: string; modelUsed: string; timestamp: number; groundingSources?: GroundingSourceItem[] }
>();
const MAX_GLOBAL_CACHE = 250;

// Recolección dinámica de todas las claves API disponibles en el entorno (rotación automática)
function getAvailableApiKeys(): string[] {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.VITE_GEMINI_API_KEY
  ]
    .map((k) => (k || "").trim())
    .filter((k) => k.length > 10 && !k.includes("YOUR_API_KEY"));

  return Array.from(new Set(candidates));
}

let currentKeyIndex = 0;

/**
 * Normaliza nombres de modelos antiguos o alias de la interfaz al ID oficial vigente
 */
function normalizeRequestedModel(requested?: string): string | null {
  if (!requested || requested === "auto") return null;
  if (requested === "gemini-3.1-flash-lite") return "gemini-3.1-flash-lite-preview";
  if (requested === "gemini-3.8-flash" || requested === "gemini-flash-latest") return "gemini-3-flash-preview";
  return requested;
}

/**
 * Devuelve la lista de modelos ordenada dinámicamente:
 * 1. Primero los modelos que NO están en enfriamiento por cuota (cooldownUntil <= now),
 *    priorizando los de mayor cuota disponible y menor latencia media.
 * 2. Si el usuario pidió un modelo específico y está saludable, se coloca primero.
 */
export function getDynamicallyRankedModels(preferredModel?: string): string[] {
  const now = Date.now();
  const normalizedPref = normalizeRequestedModel(preferredModel);

  const healthy: ModelQuotaStats[] = [];
  const coolingDown: ModelQuotaStats[] = [];

  for (const stats of modelHealthMap.values()) {
    if (stats.cooldownUntil <= now) {
      healthy.push(stats);
    } else {
      coolingDown.push(stats);
    }
  }

  // Ordenar saludables por mayor prioridad de cuota (y desempate por menor latencia)
  healthy.sort((a, b) => {
    const scoreA = a.tierQuotaPriority - a.avgLatencyMs / 200;
    const scoreB = b.tierQuotaPriority - b.avgLatencyMs / 200;
    return scoreB - scoreA;
  });

  // Ordenar los que están en enfriamiento por el que se recupere antes
  coolingDown.sort((a, b) => a.cooldownUntil - b.cooldownUntil);

  const orderedIds = [...healthy.map((m) => m.modelId), ...coolingDown.map((m) => m.modelId)];

  // Si hay un preferido y está saludable, ponerlo al frente
  if (normalizedPref && healthy.some((h) => h.modelId === normalizedPref)) {
    return [normalizedPref, ...orderedIds.filter((id) => id !== normalizedPref)];
  }

  return orderedIds;
}

export function getQuotaBalancerStatus() {
  const now = Date.now();
  const keysCount = getAvailableApiKeys().length;
  const models = Array.from(modelHealthMap.values()).map((m) => ({
    ...m,
    isHealthy: m.cooldownUntil <= now,
    cooldownRemainingSec: m.cooldownUntil > now ? Math.ceil((m.cooldownUntil - now) / 1000) : 0
  }));
  const recommendedModel = getDynamicallyRankedModels("auto")[0];
  return {
    availableApiKeys: keysCount,
    cacheEntries: globalResponseCache.size,
    recommendedModel,
    models
  };
}

export interface BalancedGeminiOptions {
  prompt?: string;
  parts?: any[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  preferredModel?: string;
  perModelTimeoutMs?: number;
  maxModelsToTry?: number;
  cacheKey?: string;
  useGoogleSearch?: boolean;
}

/**
 * Ejecuta una consulta Gemini balanceando dinámicamente entre los modelos con más cuota libre
 * y rotando claves si existen múltiples. Soporta Google Search Grounding en vivo cuando useGoogleSearch=true.
 */
export async function executeBalancedGeminiCall(
  options: BalancedGeminiOptions
): Promise<{
  text: string;
  modelUsed: string;
  fromCache: boolean;
  groundingSources?: GroundingSourceItem[];
} | null> {
  const cacheKey =
    options.cacheKey ||
    (options.prompt
      ? `prompt::${options.useGoogleSearch ? "web" : "std"}::${options.prompt.slice(0, 400)}::${options.systemInstruction?.slice(0, 100) || ""}`
      : "");

  if (cacheKey) {
    const cached = globalResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return {
        text: cached.text,
        modelUsed: `${cached.modelUsed} (Caché 0-Cuota)`,
        fromCache: true,
        groundingSources: cached.groundingSources
      };
    }
  }

  const apiKeys = getAvailableApiKeys();
  if (apiKeys.length === 0) {
    return null;
  }

  // Si se solicita búsqueda en Internet (Google Search Grounding), priorizar modelos Flash/Pro con soporte nativo de Grounding
  const effectivePreferred =
    options.useGoogleSearch && (!options.preferredModel || options.preferredModel === "auto" || options.preferredModel.includes("lite"))
      ? "gemini-3-flash-preview"
      : options.preferredModel;

  const rankedModels = getDynamicallyRankedModels(effectivePreferred);
  const now = Date.now();

  // Filtrar modelos que no estén en cooldown; si todos están en cooldown, probar el primero disponible
  let activeCandidates = rankedModels.filter((id) => {
    const st = modelHealthMap.get(id);
    return !st || st.cooldownUntil <= now;
  });

  // Cuando se requiere Google Search Grounding, ordenar primero los modelos Flash/Pro que soportan tools: [{ googleSearch: {} }]
  if (options.useGoogleSearch && activeCandidates.length > 1) {
    const groundingCapable = activeCandidates.filter((id) => !id.includes("lite"));
    const liteFallback = activeCandidates.filter((id) => id.includes("lite"));
    activeCandidates = [...groundingCapable, ...liteFallback];
  }

  const candidatePool = activeCandidates.length > 0 ? activeCandidates : rankedModels.slice(0, 2);
  if (candidatePool.length === 0) {
    return null;
  }

  const maxTries = Math.min(options.maxModelsToTry ?? 3, candidatePool.length);
  const perModelTimeoutMs = options.perModelTimeoutMs ?? (options.useGoogleSearch ? 12000 : 2600);

  for (let i = 0; i < maxTries; i++) {
    const modelId = candidatePool[i];
    const apiKey = apiKeys[(currentKeyIndex + i) % apiKeys.length];
    const stats = modelHealthMap.get(modelId);
    const t0 = Date.now();
    const supportsGoogleSearchTool = Boolean(options.useGoogleSearch && !modelId.includes("lite"));

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const contentsPayload = options.parts ? { parts: options.parts } : options.prompt || "";

      const callPromise = ai.models.generateContent({
        model: modelId,
        contents: contentsPayload,
        config: {
          ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
          ...(supportsGoogleSearchTool ? { tools: [{ googleSearch: {} }] } : {}),
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 2048
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`MODEL_TIMEOUT_${perModelTimeoutMs}MS`)), perModelTimeoutMs)
      );

      const response: GenerateContentResponse = await Promise.race([callPromise, timeoutPromise]);
      const text = (response?.text || "").trim();

      if (text) {
        const elapsed = Date.now() - t0;
        if (stats) {
          stats.successCount += 1;
          stats.lastLatencyMs = elapsed;
          stats.avgLatencyMs = Math.round(stats.avgLatencyMs * 0.7 + elapsed * 0.3);
          stats.cooldownUntil = 0;
        }

        // Extraer fuentes verificadas de Google Search Grounding si están presentes
        const rawChunks =
          (response as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const groundingSources: GroundingSourceItem[] = [];
        const seenUris = new Set<string>();
        for (const ch of rawChunks) {
          const uri = ch?.web?.uri;
          const title = ch?.web?.title || uri;
          if (uri && typeof uri === "string" && !seenUris.has(uri)) {
            seenUris.add(uri);
            groundingSources.push({ title: String(title), uri });
          }
        }

        if (cacheKey) {
          if (globalResponseCache.size >= MAX_GLOBAL_CACHE) {
            const oldestKey = globalResponseCache.keys().next().value;
            if (oldestKey) globalResponseCache.delete(oldestKey);
          }
          globalResponseCache.set(cacheKey, {
            text,
            modelUsed: modelId,
            timestamp: Date.now(),
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined
          });
        }

        return {
          text,
          modelUsed: modelId,
          fromCache: false,
          groundingSources: groundingSources.length > 0 ? groundingSources : undefined
        };
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      const status = err?.status || err?.code || "";
      const isQuotaOrRate =
        status === 429 ||
        status === "RESOURCE_EXHAUSTED" ||
        /429|quota|exhausted|rate|limit/i.test(msg);
      const isTimeout = /MODEL_TIMEOUT/i.test(msg);

      if (stats) {
        if (isQuotaOrRate) {
          stats.quotaHitCount += 1;
          stats.cooldownUntil = Date.now() + 3 * 60 * 1000;
        } else if (isTimeout) {
          stats.errorCount += 1;
          stats.cooldownUntil = Date.now() + 60 * 1000;
        } else {
          stats.errorCount += 1;
          stats.cooldownUntil = Date.now() + 90 * 1000;
        }
      }

      if (apiKeys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      }
    }
  }

  return null;
}
