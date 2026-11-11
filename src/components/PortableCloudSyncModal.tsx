import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import {
  PreFlightIntegrityReport,
  syncWorkspaceWithCloud,
  pushWorkspaceToCloud,
  runPreFlightIntegrityCheck,
  downloadPortableDualEngineExecutableHtml
} from '../lib/workspaceCloudSync';

export interface PortableCloudSyncModalProps {
  onClose: () => void;
  onOpenModal?: (modalId: string) => void;
}

export const PortableCloudSyncModal: React.FC<PortableCloudSyncModalProps> = ({
  onClose
}) => {
  const activePointCtx = useActivePoint();
  const assimilation = activePointCtx?.assimilation;

  const currentPointState = React.useMemo(() => {
    const lat = activePointCtx?.activePoint?.lat ?? activePointCtx?.location?.lat ?? 36.7168;
    const lon = activePointCtx?.activePoint?.lon ?? activePointCtx?.location?.lon ?? -4.4234;
    const address =
      activePointCtx?.activePoint?.nearestStreetName ||
      activePointCtx?.activePoint?.name ||
      'Alameda Principal, Málaga';
    return {
      lat,
      lon,
      address,
      streetName: address
    };
  }, [activePointCtx?.activePoint, activePointCtx?.location]);

  const [preFlightReport, setPreFlightReport] = useState<PreFlightIntegrityReport>(() =>
    runPreFlightIntegrityCheck(currentPointState)
  );
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const refreshAllState = React.useCallback(() => {
    setPreFlightReport(runPreFlightIntegrityCheck(currentPointState));
  }, [currentPointState]);

  useEffect(() => {
    refreshAllState();
    void syncWorkspaceWithCloud(currentPointState).then(() => {
      setPreFlightReport(runPreFlightIntegrityCheck(currentPointState));
    });

    const handleSyncUpdated = () => {
      refreshAllState();
    };
    window.addEventListener('doctoral-workspace-sync-updated', handleSyncUpdated);
    return () => window.removeEventListener('doctoral-workspace-sync-updated', handleSyncUpdated);
  }, [currentPointState, refreshAllState]);

  const showTempFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [isPushingGitHub, setIsPushingGitHub] = useState<boolean>(false);
  const [showGitHubSetupBox, setShowGitHubSetupBox] = useState<boolean>(false);
  const [githubTokenInput, setGithubTokenInput] = useState<string>('');
  const [githubRepoInput, setGithubRepoInput] = useState<string>('gemelo-digital-malaga-uned');
  const [githubStatus, setGithubStatus] = useState<{
    configured: boolean;
    githubUser: string;
    repoName: string;
    repoUrl: string | null;
    lastPushIso: string | null;
    lastCommitUrl: string | null;
    lastVerificationCode: string | null;
  }>({
    configured: false,
    githubUser: '',
    repoName: 'gemelo-digital-malaga-uned',
    repoUrl: null,
    lastPushIso: null,
    lastCommitUrl: null,
    lastVerificationCode: null
  });

  useEffect(() => {
    fetch('/api/workspace-sync/github-status')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.configured === 'boolean') {
          setGithubStatus(data);
          if (data.repoName) setGithubRepoInput(data.repoName);
        }
      })
      .catch(() => {
        // Ignore offline errors
      });
  }, []);

  const handlePushToGitHubNow = async (overrideToken?: string) => {
    const tokenToUse = (overrideToken ?? githubTokenInput).trim();
    if (!githubStatus.configured && !tokenToUse) {
      setShowGitHubSetupBox(true);
      showTempFeedback('🐙 Conecta tu GitHub una sola vez en el recuadro inferior (tardas 20 segundos).');
      return;
    }

    setIsPushingGitHub(true);
    try {
      await pushWorkspaceToCloud(currentPointState, false);
      setPreFlightReport(runPreFlightIntegrityCheck(currentPointState));

      const resp = await fetch('/api/workspace-sync/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse || undefined,
          repoName: githubRepoInput.trim() || 'gemelo-digital-malaga-uned'
        })
      });
      const data = await resp.json();

      if (!resp.ok || data.status !== 'ok') {
        if (data.status === 'needs_config') {
          setShowGitHubSetupBox(true);
        }
        showTempFeedback(`⚠️ ${data.message || 'No se pudo subir a GitHub.'}`);
        return;
      }

      setGithubStatus({
        configured: true,
        githubUser: data.githubUser,
        repoName: data.repoName,
        repoUrl: data.repoUrl,
        lastPushIso: data.lastPushIso,
        lastCommitUrl: data.commitUrl,
        lastVerificationCode: data.verificationCode
      });
      setGithubTokenInput('');
      setShowGitHubSetupBox(false);
      showTempFeedback(
        `✅ Subido a tu GitHub (${data.githubUser}/${data.repoName} • ${data.filesPushedCount} archivos descomprimidos + Datos ${data.verificationCode}). ¡Listo para AI Studio!`
      );
    } catch {
      showTempFeedback('⚠️ Error de red al conectar con el servidor para subir a GitHub.');
    } finally {
      setIsPushingGitHub(false);
    }
  };

  const handleDownloadFullAiStudioGithubZip = async () => {
    setIsDownloadingZip(true);
    showTempFeedback('⏳ Empaquetando código fuente + datos en vivo en archivo .ZIP...');
    try {
      const syncRes = await pushWorkspaceToCloud(currentPointState, false);
      setPreFlightReport(runPreFlightIntegrityCheck(currentPointState));

      const response = await fetch(`/api/workspace-sync/aistudio-github-zip?t=${Date.now()}`, {
        method: 'GET',
        headers: { Accept: 'application/zip' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawBlob = await response.blob();
      const zipBlob = new Blob([rawBlob], { type: 'application/zip' });
      const blobUrl = URL.createObjectURL(zipBlob);

      const safeCode = (syncRes?.status?.verificationCode || preFlightReport.verificationCode || 'UNED').replace(/[^A-Z0-9_-]/gi, '');
      const dateTag = new Date().toISOString().slice(0, 10);
      const filename = `Gemelo_UNED_Proyecto_Completo_AIStudio_GitHub_${dateTag}_${safeCode}.zip`;

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(blobUrl);
      }, 6000);

      showTempFeedback(
        `✅ Proyecto Completo (.ZIP de ${(zipBlob.size / (1024 * 1024)).toFixed(2)} MB • Código Fuente + Tus Datos en Vivo • ${syncRes.status.verificationCode}) descargado en tu ordenador.`
      );
    } catch (err: any) {
      showTempFeedback(`⚠️ Error al descargar el .ZIP (${err?.message || 'Fallo de red'}). Reintentando descarga directa...`);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = `/api/workspace-sync/aistudio-github-zip?t=${Date.now()}`;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadBlindadoExecutableHtml = () => {
    downloadPortableDualEngineExecutableHtml(currentPointState, {
      no2Adult18m: assimilation?.no2PedestrianLevel1_8mUgM3 ?? activePointCtx?.data?.no2_satelite_base ?? 24.6,
      no2Pediatric09m: (assimilation?.no2PedestrianLevel1_8mUgM3 ?? 24.6) * 1.11,
      no2Cabin40m: (assimilation?.no2PedestrianLevel1_8mUgM3 ?? 18.9) * 0.77,
      o3UgM3: assimilation?.ozoneO3UgM3 ?? activePointCtx?.data?.ozone ?? 64.2,
      pm25UgM3: assimilation?.pm25UgM3 ?? activePointCtx?.data?.pm2_5 ?? 9.8,
      pm10UgM3: assimilation?.pm10UgM3 ?? activePointCtx?.data?.pm10 ?? 19.4,
      aspectRatioHW: activePointCtx?.activePoint?.aspectRatioHw ?? 1.35,
      skyViewFactor: activePointCtx?.activePoint?.skyViewFactorSvf ?? 0.58
    });
    showTempFeedback(
      `🛡️ App Íntegra Blindada (.HTML Solo-Lectura con Datos en Vivo • ${preFlightReport.verificationCode}) descargada.`
    );
  };

  return (
    <DraggableWindow
      windowId="portableCloudSync"
      title={`📦 CLOUD SYNC, GITHUB & USB (${preFlightReport.verificationCode})`}
      className="w-[680px] max-w-[95vw]"
      onClose={onClose}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2 text-slate-100 font-mono text-[11px]">
        {feedbackBanner && (
          <div className="bg-emerald-950/95 border border-emerald-400 text-emerald-200 px-2.5 py-1.5 rounded text-[10.5px] font-bold flex items-center justify-between">
            <span>{feedbackBanner}</span>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="text-emerald-400 hover:text-white ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===================================================================================== */}
        {/* BLOQUE ÚNICO: SUBIR A MI GITHUB EN 1 CLIC + BAJAR .ZIP + BAJAR .HTML EJECUTABLE      */}
        {/* ===================================================================================== */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-slate-900 border border-emerald-400 rounded-md p-2.5 flex flex-col gap-2 shadow-md">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <ScientificTooltip
              position="bottom"
              width="w-[360px]"
              title="Arquitectura de Respaldo Triple Doctoral (GitHub + .ZIP + .HTML)"
              formula="\mathcal{B}_{\text{UNED}} = \{\text{GitHub Tree API}, \; \text{ZIP Fuente+Datos}, \; \text{HTML Ejecutable Blindado}\}"
              regulatory="Regla 26 AGENTS.md — Custodia y Reproducibilidad Científica UNED"
              content="Garantiza la preservación íntegra del código fuente TypeScript/React y del estado sincronizado del Punto Activo para su reimportación inmediata en Google AI Studio o ejecución autónoma ante el tribunal."
            >
              <div className="flex items-center gap-1.5 flex-wrap cursor-help">
                <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[9.5px] uppercase">
                  🐙 GITHUB 1-CLIC &amp; AI STUDIO
                </span>
                <span className="text-xs font-black text-white uppercase">
                  Respaldo Directo a tu GitHub (Descomprimido para AI Studio)
                </span>
              </div>
            </ScientificTooltip>
            <div className="flex items-center gap-1.5">
              <ScientificTooltip
                position="bottom"
                width="w-[320px]"
                title="Identificador de Custodia Doctoral & Sello de Sincronización"
                content={`Cuenta doctoral vinculada (${githubStatus.configured ? `${githubStatus.githubUser}/${githubStatus.repoName}` : 'dioni100669@gmail.com'}) con código de verificación ${preFlightReport.verificationCode} sincronizado con ${currentPointState.address}.`}
              >
                <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-500/60 font-bold text-[9.5px] cursor-help">
                  {githubStatus.configured
                    ? `🟢 ${githubStatus.githubUser}/${githubStatus.repoName}`
                    : `dioni100669@gmail.com • ${preFlightReport.verificationCode}`}
                </span>
              </ScientificTooltip>
              <ScientificTooltip
                position="bottom"
                width="w-[300px]"
                title="Asistente de Vinculación con GitHub (1 Sola Vez)"
                content="Abre o cierra el panel guiado de 2 pasos para vincular tu token personal de GitHub y automatizar las subidas en 1 clic."
              >
                <button
                  type="button"
                  onClick={() => setShowGitHubSetupBox((prev) => !prev)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-600 text-[9px] font-bold cursor-pointer"
                >
                  ⚙️ {githubStatus.configured ? 'Cambiar' : 'Conectar 1ª vez'}
                </button>
              </ScientificTooltip>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL GRANDE: SUBIR A MI GITHUB AHORA */}
          <div className="flex flex-col gap-1.5">
            <ScientificTooltip
              position="bottom"
              width="w-[360px]"
              title="Subir Proyecto Descomprimido + Datos en Vivo a mi GitHub Ahora"
              formula="\text{Push}_{\text{GitHub}} \implies \texttt{src/} + \texttt{server/} + \texttt{/data/doctoral\_workspace\_sync.json}"
              normative="Recuperación 1-Clic en Google AI Studio (Import from GitHub)"
              content="Sube directamente todas las carpetas del proyecto descomprimidas más tus últimas variaciones en vivo a tu repositorio de GitHub, para que puedas reimportar la app entera en AI Studio cuando quieras."
            >
              <button
                type="button"
                onClick={() => void handlePushToGitHubNow()}
                disabled={isPushingGitHub}
                className="w-full py-2.5 px-3 rounded bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 text-slate-950 font-black text-[11.5px] uppercase tracking-wide shadow-[0_0_16px_rgba(16,185,129,0.55)] border-2 border-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Upload className={`w-4 h-4 stroke-[2.5] shrink-0 ${isPushingGitHub ? 'animate-bounce' : ''}`} />
                <span>
                  {isPushingGitHub
                    ? '⏳ Subiendo Proyecto + Datos Descomprimidos a tu GitHub...'
                    : githubStatus.configured
                    ? `🐙 Subir Respaldo a mi GitHub Ahora (${githubStatus.githubUser}/${githubStatus.repoName})`
                    : '🐙 Subir Respaldo a mi GitHub Ahora (Conectar 1 sola vez)'}
                </span>
              </button>
            </ScientificTooltip>

            {githubStatus.configured && githubStatus.lastPushIso && (
              <div className="flex items-center justify-between gap-2 bg-slate-950/90 border border-emerald-500/50 rounded px-2 py-1 text-[9.5px]">
                <span className="text-emerald-300 truncate">
                  ✅ Última subida a GitHub: <strong>{new Date(githubStatus.lastPushIso).toLocaleTimeString()}</strong> ({githubStatus.lastVerificationCode})
                </span>
                {githubStatus.repoUrl && (
                  <a
                    href={githubStatus.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold border border-emerald-400 shrink-0"
                  >
                    Abrir mi GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ASISTENTE GUIADO DE 1 SOLA VEZ */}
          {showGitHubSetupBox && (
            <div className="bg-slate-950/95 border border-amber-400 rounded p-2.5 flex flex-col gap-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 uppercase">
                  🔑 Conexión guiada de 1 sola vez con tu correo (dioni100669@gmail.com)
                </span>
                <button
                  type="button"
                  onClick={() => setShowGitHubSetupBox(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-200 leading-snug">
                  <strong>Paso 1:</strong> Pulsa este botón (abre tu GitHub ya marcado), baja abajo del todo, dale al botón verde <em>"Generate token"</em> y copia el código que sale:
                </span>
                <a
                  href="https://github.com/settings/tokens/new?description=Gemelo_Digital_Tesis_UNED&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase shrink-0 text-center border border-white"
                >
                  1. Abrir mi GitHub ↗
                </a>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-1.5">
                <input
                  type="password"
                  value={githubTokenInput}
                  onChange={(e) => setGithubTokenInput(e.target.value)}
                  placeholder="Paso 2: Pega aquí el código ghp_... de GitHub (se guarda para siempre)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-[10px] focus:border-emerald-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={githubRepoInput}
                  onChange={(e) => setGithubRepoInput(e.target.value)}
                  placeholder="Nombre repositorio"
                  className="w-full sm:w-44 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-cyan-300 text-[10px] focus:border-cyan-400 focus:outline-none"
                  title="Nombre del repositorio que se creará/actualizará en tu GitHub"
                />
                <button
                  type="button"
                  onClick={() => void handlePushToGitHubNow(githubTokenInput)}
                  disabled={isPushingGitHub || !githubTokenInput.trim()}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-[10px] uppercase border border-white cursor-pointer shrink-0"
                >
                  {isPushingGitHub ? 'Subiendo...' : '2. Guardar y Subir'}
                </button>
              </div>
            </div>
          )}

          {/* DOS BOTONES DE DESCARGA DIRECTA A PC / USB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Descargar Proyecto Completo en .ZIP a tu PC/USB"
              formula="\text{ZIP}_{\text{Íntegro}} = \text{Código Fuente (\texttt{src/}, \texttt{server/})} \cup \text{Datos en Vivo (\texttt{/data/})}"
              normative="Copia Física Local en Ordenador / USB"
              content="Descarga todo el código fuente del proyecto junto con tus últimas variaciones y PDFs del Director en un archivo .ZIP en tu ordenador."
            >
              <button
                onClick={() => void handleDownloadFullAiStudioGithubZip()}
                disabled={isDownloadingZip}
                className="w-full py-1.5 px-2.5 rounded bg-slate-950/90 hover:bg-slate-800 text-cyan-300 font-bold text-[10px] uppercase border border-cyan-500/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isDownloadingZip
                    ? '⏳ Empaquetando .ZIP...'
                    : '📦 Bajar Proyecto Completo (.ZIP a mi PC)'}
                </span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              position="bottom"
              width="w-[340px]"
              title="Descargar App Íntegra Ejecutable (.HTML Blindada en Solo-Lectura)"
              formula="\text{HTML}_{\text{Blindado}} \implies \text{Datos en Vivo (24+16)} \wedge \Delta\text{Parámetros} = 0"
              normative="Integridad Criptográfica Doctoral EIDUNED / UNED"
              content="Descarga Gemelo_Digital_UNED_Malaga_App_Integra_Blindada.html con bloqueo de Solo-Lectura ya incorporado para abrir con doble clic en cualquier PC o iPad viendo datos en tiempo real sin manipular parámetros."
            >
              <button
                onClick={handleDownloadBlindadoExecutableHtml}
                className="w-full py-1.5 px-2.5 rounded bg-slate-950/90 hover:bg-slate-800 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-500/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>🛡️ Bajar App Activa Ejecutable (.HTML)</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};


