import { Router } from "express";
import { executeBalancedGeminiCall, getQuotaBalancerStatus } from "../lib/geminiQuotaBalancer";
import {
  buildUnifiedDoctoralCropDictamen,
  cleanScientificSymbols,
  type FramedElementDetail,
  type DoctoralCropAnalysisInput
} from "../../src/lib/doctoralCropEngine";

const router = Router();

/**
 * Endpoint GET /api/gemini/quota-status
 * Devuelve en tiempo real el estado del Pool Dinámico de Modelos Gemini (cuota RPM/RPD restante,
 * modelo óptimo seleccionado automáticamente y estadísticas de caché y rotación).
 */
router.get("/api/gemini/quota-status", (_req, res) => {
  return res.json({
    success: true,
    ...getQuotaBalancerStatus()
  });
});

export type FramedElementPayload = FramedElementDetail;

export interface ScreenAnalysisRequest extends DoctoralCropAnalysisInput {
  imageBase64?: string;
  mimeType?: string;
  preferLocalQuotaSaver?: boolean;
  preferredModel?: string;
  useGoogleSearch?: boolean;
}

/**
 * Motor Determinista Exhaustivo de Síntesis Doctoral (0 Consumo de Cuota y Respuesta en <5ms)
 * Delegado a la fuente única de verdad isomórfica (`src/lib/doctoralCropEngine.ts`).
 */
export function buildDeterministicDoctoralAnalysis(req: ScreenAnalysisRequest): string {
  return buildUnifiedDoctoralCropDictamen(req);
}

router.post("/api/gemini/screen-analysis", async (req, res) => {
  try {
    const body: ScreenAnalysisRequest = req.body || {};
    const {
      imageBase64,
      mimeType = "image/jpeg",
      userPrompt,
      croppedDomText,
      capturedVisibleText,
      capturedWindowTitles,
      capturedActiveTabs,
      capturedHeadings,
      capturedStructuredItems,
      capturedElements,
      preferLocalQuotaSaver,
      preferredModel,
      useGoogleSearch = false,
      activePointContext
    } = body;

    const effectiveDomText = croppedDomText || capturedVisibleText || "";
    const effectiveItems = capturedStructuredItems || capturedElements || [];

    if (!imageBase64 && !effectiveDomText && effectiveItems.length === 0) {
      return res.status(400).json({ error: "Falta la imagen o el contexto del recuadro seleccionado" });
    }

    const promptText =
      userPrompt?.trim() ||
      "Explica de forma exhaustiva y muy extensa ÚNICAMENTE todo lo que hay dentro del recuadro o pestaña seleccionada: qué es cada elemento, cada cifra, cada símbolo, cada gráfica y cada botón, y para qué está ahí.";

    // 1. Si el usuario solicita Síntesis Instantánea 0-Cuota (y NO ha pedido conexión explícita a Internet), responder en <5ms
    if (preferLocalQuotaSaver && !useGoogleSearch) {
      const localAnalysis = buildDeterministicDoctoralAnalysis(body);
      return res.json({
        success: true,
        analysis: localAnalysis,
        model: "Síntesis Doctoral Exhaustiva UNED (0 Consumo Cuota)",
        quotaSaved: true,
        webSearchUsed: false,
        groundingSources: [],
        balancerStatus: getQuotaBalancerStatus(),
        timestamp: new Date().toISOString(),
        userPrompt: promptText,
        activePointContext
      });
    }

    // 2. Preparar el inventario exacto del recuadro para el Balanceador Dinámico Multi-Modelo
    let contextDescription = `[VENTANA / MÓDULO ENMARCADO]: ${(capturedWindowTitles || []).join(" · ") || "Área seleccionada por el usuario"}
[PESTAÑA / SUBPESTAÑA ACTIVA EN EL RECUADRO]: ${(capturedActiveTabs || []).join(" · ") || "Vista activa del recuadro"}
[SECCIONES / TÍTULOS DENTRO DEL RECUADRO]: ${(capturedHeadings || []).join(" · ") || "N/A"}
[PUNTO ACTIVO SINCRONIZADO]: ${activePointContext?.streetName || "Málaga"} (${activePointContext?.lat ?? 36.72}°N, ${activePointContext?.lon ?? -4.42}°W, cota ${activePointContext?.elevationM ?? 12}m) | NO₂=${activePointContext?.no2 ?? 32.5} µg/m³, O₃=${activePointContext?.o3 ?? 64} µg/m³, PM₂.₅=${activePointContext?.pm25 ?? 14.5} µg/m³, Temp=${activePointContext?.tempC ?? 24}°C, Viento=${activePointContext?.windSpeedMs ?? 2.5} m/s.`;

    if (effectiveItems.length > 0) {
      const formattedItems = effectiveItems
        .slice(0, 50)
        .map(
          (it, idx) =>
            `${idx + 1}. [${it.kind}] ${it.text}${it.formula ? ` | Fórmula: ${it.formula}` : ""}${it.tooltipContent || it.tooltipText ? ` | Fundamento: ${it.tooltipContent || it.tooltipText}` : ""}`
        )
        .join("\n");
      contextDescription += `\n\n[INVENTARIO EXACTO DE ELEMENTOS CAPTURADOS DENTRO DEL RECUADRO (${effectiveItems.length} ELEMENTOS)]:\n${formattedItems}`;
    } else if (effectiveDomText.trim().length > 0) {
      contextDescription += `\n\n[TEXTOS Y ELEMENTOS EXTRAÍDOS DENTRO DEL RECUADRO]:\n${effectiveDomText.slice(0, 6000)}`;
    }

    const systemInstruction = `Eres Catedrático del Tribunal de Tesis Doctoral en Física, Química Atmosférica y Modelización Ambiental de la UNED (Programa de Doctorado).
REGLAS ESTRICTAS E INQUEBRANTABLES DE TU EXPLICACIÓN:
1. PROHIBIDO IRSE POR OTRO SITIO: Debes explicar ÚNICA Y EXCLUSIVAMENTE lo que está dentro del recuadro o pestaña enmarcada que se te entrega en el inventario y en la imagen recortada. NO hables de otros módulos que no estén en el recuadro ni describas el mapa de fondo si el usuario ha enmarcado una ventana o pestaña.
2. EXPLICACIÓN MUCHO MÁS EXTENSA Y EXHAUSTIVA: Desarrolla un dictamen muy extenso, minucioso y profundo donde recorras UNO POR UNO absolutamente todos los elementos, títulos, pestañas, métricas numéricas, ecuaciones, ejes de gráficas, filas de tablas y botones capturados dentro del recuadro. Para cada elemento explica:
   - ¿Qué es exactamente ese elemento o cifra dentro del recuadro?
   - ¿Cómo se calcula físicamente/estadísticamente y qué significa su valor actual?
   - ¿Para qué está ahí dentro de esa pestaña y qué demuestra ante el Tribunal Doctoral?
3. SÍMBOLOS CIENTÍFICOS 100 % LEGIBLES: Escribe todos los símbolos químicos, matemáticos y unidades en Unicode limpio y legible (NO₂, O₃, PM₂.₅, PM₁₀, µg/m³, ∂C/∂t, u·∇C, rₐ, r_b, r_c, u*, R², RMSE, FAC2, MQI, ΔT, →, ≈, ≤, ≥). PROHIBIDO usar comandos LaTeX crudos como \\text{}, \\mathbf{}, \\frac{} o \\partial.`;

    const webSearchDirective = useGoogleSearch
      ? `\n4. CONEXIÓN A INTERNET EN TIEMPO REAL ACTIVA (GOOGLE SEARCH GROUNDING): Contrasta y enriquece la respuesta con datos científicos verificables en Internet (Directiva UE 2024/2881 en DOUE, Guías OMS 2021, inventarios EMEP/EEA, literatura Q1 reciente y contexto de Málaga / AEMET / Copernicus CAMS), integrando esa precisión directamente sobre los elementos y métricas del recuadro consultado.`
      : "";

    const fullPrompt = `${contextDescription}${webSearchDirective}\n\nDirectriz / Consulta del Doctorando:\n${promptText}`;

    const detectedMime =
      imageBase64?.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/)?.[1] || mimeType || "image/jpeg";
    const cleanBase64 = (imageBase64 || "").replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, "");

    const parts: any[] = [];
    if (cleanBase64 && cleanBase64.length > 50) {
      parts.push({
        inlineData: {
          mimeType: detectedMime,
          data: cleanBase64
        }
      });
    }
    parts.push({ text: fullPrompt });

    const cacheKey = `vision_v3::${useGoogleSearch ? "web" : "local"}::${promptText.toLowerCase().slice(0, 180)}::${(capturedWindowTitles || []).join("|")}::${(capturedActiveTabs || []).join("|")}::${effectiveDomText.slice(0, 320)}`;

    // 3. Ejecutar mediante el Balanceador Dinámico de Cuota Multi-Modelo (con Google Search Grounding si useGoogleSearch=true)
    const balancedResult = await executeBalancedGeminiCall({
      parts,
      systemInstruction: `${systemInstruction}${webSearchDirective}`,
      temperature: 0.2,
      maxOutputTokens: 4096,
      preferredModel: preferredModel || "auto",
      perModelTimeoutMs: useGoogleSearch ? 12000 : 2500,
      maxModelsToTry: 2,
      cacheKey,
      useGoogleSearch
    });

    if (balancedResult && balancedResult.text && balancedResult.text.length > 120) {
      return res.json({
        success: true,
        analysis: cleanScientificSymbols(balancedResult.text),
        model: `${balancedResult.modelUsed}${useGoogleSearch ? " + 🌐 Google Search en Vivo" : " (Balanceador Dinámico)"}`,
        fromCache: balancedResult.fromCache,
        webSearchUsed: Boolean(useGoogleSearch),
        groundingSources: balancedResult.groundingSources || [],
        balancerStatus: getQuotaBalancerStatus(),
        timestamp: new Date().toISOString(),
        userPrompt: promptText,
        activePointContext
      });
    }

    // 4. Respaldo Doctoral Exhaustivo Instantáneo ceñido al 100% al recuadro
    const fallbackAnalysis = buildDeterministicDoctoralAnalysis(body);
    return res.json({
      success: true,
      analysis: fallbackAnalysis,
      model: "Motor Doctoral Exhaustivo UNED (Continuidad Garantizada 0-Cuota)",
      webSearchUsed: false,
      groundingSources: [],
      balancerStatus: getQuotaBalancerStatus(),
      timestamp: new Date().toISOString(),
      userPrompt: promptText,
      activePointContext
    });
  } catch (error: any) {
    console.error("[Gemini Screen Analysis Fallback]:", error?.message);
    const fallbackText = buildDeterministicDoctoralAnalysis(req.body || {});
    return res.json({
      success: true,
      analysis: fallbackText,
      model: "Motor Doctoral Exhaustivo UNED (Respaldo Instantáneo)",
      balancerStatus: getQuotaBalancerStatus(),
      timestamp: new Date().toISOString(),
      userPrompt: req.body?.userPrompt || "Análisis exhaustivo del recuadro seleccionado"
    });
  }
});

export default router;
