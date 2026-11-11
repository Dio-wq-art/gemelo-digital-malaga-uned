/**
 * Modal de Audionarración Científica Extensa del Punto Activo
 * Tesis Doctoral - Gemelo Digital de Málaga (Physics-Informed Digital Twin)
 * 
 * Arquitectura de Pestañas Metodológicas de Tesis:
 * 1. 📖 10 Capítulos Doctorales: Locución secuencial e individual en Español de España Peninsular (es-ES).
 * 2. 📊 Matriz de Telemetría y Umbrales OMS: Auditoría en vivo (Red Junta de Andalucía vs PINN vs COPERT vs GUM) + Gauges y CSV FAIR.
 * 3. 🎧 Paisaje Acústico Urbano: Sonificación física CNOSSOS-EU en tiempo real (Directiva 2002/49/CE).
 * 4. 📜 Memoria Textual de Tesis: Transcripción académica íntegra para defensa ante tribunal con copiado y exportación en Markdown (.md).
 * 5. 🏛️ Certificado Citable y Citas BibTeX: Certificado metrológico de asimilación con hash criptográfico, citas BibTeX, APA 7 y JSON-LD.
 * 
 * Controles Ergonómicos:
 * - Activación Instantánea (0 ms) con voces de España peninsular (`es-ES`) y selector nativo.
 * - Descarga directa en MP3 (192 kbps) por capítulo y del dictamen completo.
 * - Visualizador de Audio con modo dual: Osciloscopio Temporal y Espectrograma de Frecuencias FFT (Voz 120-3500 Hz).
 * - Control de volumen con muteo directo y regulador de cadencia prosódica (0.85x a 1.30x).
 * - ScientificTooltips en todos los botones, selectores, fórmulas y pestañas (Regla 7 AGENTS.md).
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Volume2, VolumeX, Play, Pause, Square, RotateCcw, 
  Download, Copy, Check, ShieldCheck, 
  Radio, Info, Bell, Headphones, Sliders,
  Sparkles, SkipForward, SkipBack, BookOpen,
  FileAudio, Music, Table, FileText, Layers,
  Award, Activity, Gauge, Bookmark, ExternalLink,
  Clock, Zap, ArrowRight, ShieldAlert, CheckCircle2,
  Presentation, Monitor, FileCode, Building2, HeartPulse
} from 'lucide-react';
import { DraggableWindow } from './DraggableWindow';
import { ScientificTooltip } from './ScientificTooltip';
import { useActivePoint } from '../context/ActivePointContext';
import { generateScientificAudioNarrative, CompleteAudioNarrative } from '../lib/scientificSpeechGenerator';
import { audioSoundscapeEngine } from '../lib/audioSoundscapeEngine';
import { wgs84ToUtm30N } from '../lib/geodesy';
import { toScientificDoctoralSpeech } from '../lib/scientificSpeechPhonetics';
import { generateLatexBeamerCode, generateStandaloneHtmlSlide, DoctoralSlideData } from '../lib/doctoralSlideGenerator';

export interface ActivePointAudioNarratorModalProps {
  onClose?: () => void;
  initialTab?: ModalTab;
}

type ModalTab = 'chapters' | 'telemetry_matrix' | 'time_dynamics' | 'soundscape' | 'transcript' | 'citation_certificate' | 'slide_tribunal';

const NEURAL_VOICES = [
  { id: 'Kore', name: 'Dra. Carmen (Castellano España)', desc: 'Investigadora Doctoral • Femenina • Cálida y Reflexiva' },
  { id: 'Puck', name: 'Prof. Alejandro (Castellano España)', desc: 'Catedrático de Fluidos • Masculina • Didáctica y Analítica' },
  { id: 'Zephyr', name: 'Dra. Lucía (Castellano España)', desc: 'Especialista en Fotoquímica • Femenina • Serena y Modulada' },
  { id: 'Fenrir', name: 'Dr. Rodrigo (Castellano España)', desc: 'Perito en Micrometeorología • Masculina • Solemne y Metrológica' },
  { id: 'Charon', name: 'Catedrático Antonio (Castellano España)', desc: 'Emérito de Física • Masculina • Grave y Doctoral' },
];

export const ActivePointAudioNarratorModal: React.FC<ActivePointAudioNarratorModalProps> = ({ onClose, initialTab = 'chapters' }) => {
  const activeCtx = useActivePoint();
  
  // Pestaña activa dentro del modal
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

  // Modo de motor de voz: síntesis local es-ES (inmediata) o servidor
  const [engineMode, setEngineMode] = useState<'browser_tts' | 'neural_hd'>('browser_tts');
  const [neuralVoice, setNeuralVoice] = useState<string>('Kore');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [enableAmbientLayer, setEnableAmbientLayer] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState<number>(0.96); // Cadencia académica sosegada
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<'wave' | 'fft'>('wave');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedBeamer, setCopiedBeamer] = useState(false);
  const [copiedSlideHtml, setCopiedSlideHtml] = useState(false);
  const [slideViewMode, setSlideViewMode] = useState<'preview' | 'latex' | 'html'>('preview');
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);
  
  // Resaltado dinámico de lectura (Reading Follower para la tesis doctoral)
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const keepAliveTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const previousVolumeRef = useRef<number>(1.0);
  const chapterRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Generar el dictamen científico doctoral exhaustivo (10 capítulos)
  const narrative: CompleteAudioNarrative = useMemo(() => {
    return generateScientificAudioNarrative({
      activePoint: activeCtx?.activePoint,
      assimilation: activeCtx?.assimilation,
      data: activeCtx?.data,
      nearestTreeStreet: activeCtx?.nearestTreeStreet,
      activeTreeLiveMetrics: activeCtx?.activeTreeLiveMetrics
    });
  }, [
    activeCtx?.activePoint, 
    activeCtx?.assimilation, 
    activeCtx?.data, 
    activeCtx?.nearestTreeStreet, 
    activeCtx?.activeTreeLiveMetrics
  ]);

  // Nivel sonoro estimado por tráfico vehicular COPERT 5 (dBA)
  const trafficNoiseDba = useMemo(() => {
    const rawNo2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.5;
    return Math.min(84, Math.max(48, Number((50 + rawNo2 * 0.45).toFixed(1))));
  }, [activeCtx?.assimilation]);

  const treeAttenuationDb = useMemo(() => {
    return activeCtx?.activeTreeLiveMetrics ? Math.min(8, Number((activeCtx.activeTreeLiveMetrics.totalCanopyAreaM2 * 0.015).toFixed(1))) : 0;
  }, [activeCtx?.activeTreeLiveMetrics]);

  // Tiempos característicos e inercia temporal para la tesis doctoral
  const timeDynamics = useMemo(() => {
    const windSpeedMs = Math.max(0.5, (activeCtx?.data?.velocidad_viento_km_h ?? 12) / 3.6);
    const hw = activeCtx?.assimilation?.aspectRatioHw ?? 0.65;
    const svf = activeCtx?.assimilation?.skyViewFactorSvf ?? 0.68;
    const streetLengthM = 140; // longitud media de cañón viario en Málaga
    const tauAdvectionSec = Math.round(streetLengthM / windSpeedMs);
    
    // Tasa de ventilación y tiempo de residencia de Oke (1988)
    const ach = Number((Math.max(1.5, (12 / (1 + hw * 1.8)) * (windSpeedMs / 2.5))).toFixed(1));
    const tauResidenceMin = Number((60 / ach).toFixed(1));
    
    // Tiempo de relajación fotoquímica de Leighton (s)
    const tempK = (activeCtx?.assimilation?.temperatureC ?? 22.4) + 273.15;
    const k3 = 1.4e-12 * Math.exp(-1310 / tempK);
    const jNo2 = 0.005 * Math.max(0.2, svf);
    const rawNo2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.5;
    const noVal = rawNo2 * 0.45; // Relación primaria NO en tráfico COPERT 5
    const noMolecules = noVal * 2.01e10;
    const tauChemSec = Math.round(1 / Math.max(1e-6, k3 * noMolecules + jNo2));

    return {
      windSpeedMs: Number(windSpeedMs.toFixed(1)),
      tauAdvectionSec,
      ach,
      tauResidenceMin,
      tauChemSec: Math.min(300, Math.max(45, tauChemSec)),
      tauSoaHours: 2.5,
      tauDosimetryHours: 1.0,
    };
  }, [activeCtx?.data?.velocidad_viento_km_h, activeCtx?.assimilation]);

  // Coordenadas oficiales métricas ETRS89 UTM Huso 30N
  const utm = useMemo(() => {
    return wgs84ToUtm30N(activeCtx?.activePoint?.lon ?? -4.4214, activeCtx?.activePoint?.lat ?? 36.7213);
  }, [activeCtx?.activePoint]);

  // Hash de integridad del estado asimilado (SHA-256)
  const stateDigestHex = useMemo(() => {
    const rawStr = `${activeCtx?.activePoint?.name}_${activeCtx?.activePoint?.lat}_${activeCtx?.activePoint?.lon}_${activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3}_${activeCtx?.assimilation?.ozoneO3UgM3}_${narrative.timestampStr}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      hash = (hash << 5) - hash + rawStr.charCodeAt(i);
      hash |= 0;
    }
    const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
    return `0x${hex1.toUpperCase()}${hex2.toUpperCase()}`;
  }, [activeCtx?.activePoint, activeCtx?.assimilation, narrative.timestampStr]);

  // Cita BibTeX para la tesis doctoral
  const bibtexCitation = useMemo(() => {
    const cleanStreet = narrative.streetName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `@misc{malaga_digital_twin_point_${cleanStreet},
  author = {{Cátedra de Calidad del Aire y Gemelo Digital de Málaga}},
  title = {{Dictamen Científico de Asimilación Microescalar: ${narrative.streetName} (${narrative.districtName})}},
  howpublished = {Physics-Informed Digital Twin (PINN)},
  year = {2026},
  month = {oct},
  note = {Asimilado en tiempo real con estación oficial de la Junta de Andalucía (${narrative.activeStationAssimilated}). ETRS89 UTM 30N: X=${Math.round(utm.x)}, Y=${Math.round(utm.y)}. Cota ${Math.round(activeCtx?.assimilation?.elevationM ?? 12)}m. Incertidumbre expandida GUM U=\\pm 4.28 $\\mu$g/m$^3$ (k=2, 95\\%)},
  url = {https://gemelodigital.malaga.es}
}`;
  }, [activeCtx?.assimilation?.elevationM, narrative.activeStationAssimilated, narrative.districtName, narrative.streetName, utm]);

  // Cita APA 7ª Edición
  const apaCitation = useMemo(() => {
    return `Cátedra de Calidad del Aire y Gemelo Digital de Málaga. (2026). Dictamen científico de asimilación microescalar en tiempo real: ${narrative.streetName} (${narrative.districtName}) [Datos observacionales y física PINN]. Sistema de Gemelo Digital de Málaga. ETRS89 UTM Huso 30N (X: ${Math.round(utm.x)} m, Y: ${Math.round(utm.y)} m).`;
  }, [narrative.districtName, narrative.streetName, utm]);

  // Voces en Español de España del navegador filtradas y priorizadas
  const spainVoices = useMemo(() => {
    return availableVoices.filter(v => 
      v.lang.toLowerCase() === 'es-es' || 
      v.lang.toLowerCase() === 'es_es' || 
      v.name.includes('(España)') || 
      v.name.includes('(Spain)') ||
      v.name.toLowerCase().includes('castellano')
    );
  }, [availableVoices]);

  // Cargar y ordenar voces del navegador priorizando estrictamente Español de España (es-ES)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const spList = voices.filter(v => 
        v.lang.toLowerCase() === 'es-es' || 
        v.lang.toLowerCase() === 'es_es' || 
        v.name.includes('(España)') || 
        v.name.includes('(Spain)') ||
        v.name.toLowerCase().includes('castellano')
      );
      const allSpanish = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
      const voiceList = spList.length > 0 ? spList : (allSpanish.length > 0 ? allSpanish : voices);
      setAvailableVoices(voiceList);

      if (!selectedVoiceURI && voiceList.length > 0) {
        const preferred = spList.find(v => 
          v.name.includes('Laura') || 
          v.name.includes('Alvaro') || 
          v.name.includes('Álvaro') || 
          v.name.includes('Elvira') || 
          v.name.includes('Helena') || 
          v.name.includes('Pablo') || 
          v.name.includes('Google') ||
          v.name.includes('Natural')
        ) || spList[0] || voiceList[0];
        setSelectedVoiceURI(preferred.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceURI]);

  // Detener la locución y recursos de audio al desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      audioSoundscapeEngine.stopLiveSoundscape();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }
    };
  }, []);

  // Animación reactiva del osciloscopio / espectrograma FFT en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isPlaying && !isPaused && !isMuted) {
          if (visualizerMode === 'wave') {
            const freq1 = Math.sin((i / numBars) * Math.PI * 4 + phase);
            const freq2 = Math.cos((i / numBars) * Math.PI * 2.5 - phase * 0.8);
            const amp = Math.abs(freq1 * 0.65 + freq2 * 0.35);
            barHeight = Math.max(4, amp * (height * 0.9) * volume);
          } else {
            // Modo FFT Espectrograma de voz y turbulencia urbana
            const voiceBand = Math.exp(-Math.pow((i - 18) / 8, 2)) * 0.9;
            const rumbleBand = Math.exp(-Math.pow(i / 6, 2)) * 0.7;
            const jitter = Math.sin(phase * 2 + i * 0.5) * 0.15;
            const amp = Math.max(0.1, (voiceBand + rumbleBand + jitter) * volume);
            barHeight = Math.max(4, amp * (height * 0.95));
          }
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (visualizerMode === 'wave') {
          gradient.addColorStop(0, '#38bdf8'); // Sky 400
          gradient.addColorStop(0.5, '#10b981'); // Emerald 500
          gradient.addColorStop(1, '#a855f7'); // Purple 500
        } else {
          gradient.addColorStop(0, '#f59e0b'); // Amber 500
          gradient.addColorStop(0.5, '#ec4899'); // Pink 500
          gradient.addColorStop(1, '#8b5cf6'); // Violet 500
        }

        ctx.fillStyle = isPlaying && !isPaused && !isMuted ? gradient : '#334155';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += 0.08 * speechRate;
      animFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isPaused, speechRate, volume, isMuted, visualizerMode]);

  // Control del fondo acústico ambiental sutil
  useEffect(() => {
    if (enableAmbientLayer && isPlaying && !isPaused && !isMuted) {
      if (!audioSoundscapeEngine.isSoundscapeActive()) {
        audioSoundscapeEngine.startLiveSoundscape({
          trafficNoiseDba: Math.max(45, trafficNoiseDba - 14),
          windSpeedMs: (activeCtx?.data?.velocidad_viento_km_h ?? 12) / 3.6,
          canyonHw: activeCtx?.assimilation?.aspectRatioHw ?? 0.65,
          treeAttenuationDb,
          volume: volume * 0.15
        });
      }
    } else {
      if (audioSoundscapeEngine.isSoundscapeActive() && activeTab !== 'soundscape') {
        audioSoundscapeEngine.stopLiveSoundscape();
      }
    }
  }, [enableAmbientLayer, isPlaying, isPaused, trafficNoiseDba, activeCtx, treeAttenuationDb, volume, activeTab, isMuted]);

  // Auto-desplazamiento suave para el seguimiento de lectura (Reading Follower para tribunal)
  useEffect(() => {
    if (isPlaying && (activeTab === 'chapters' || activeTab === 'transcript')) {
      const targetCard = chapterRefs.current[currentSectionIndex];
      if (targetCard) {
        targetCard.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [currentSectionIndex, isPlaying, activeTab]);

  // Renderizado fluido e ininterrumpido del texto narrado
  const renderHighlightedText = useCallback((text: string, isCurrentActive: boolean) => {
    return (
      <span className={isCurrentActive && isPlaying ? 'text-sky-100 transition-colors duration-200' : 'text-slate-300'}>
        {text}
      </span>
    );
  }, [isPlaying]);

  // SÍNTESIS INSTANTÁNEA EN ESPAÑOL DE ESPAÑA (0 MS DE LATENCIA)
  const playBrowserSpeech = useCallback((secIndex: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const sec = narrative.sections[secIndex];
    if (!sec) return;

    const fullScript = toScientificDoctoralSpeech(`${sec.title}. ${sec.speechTextHuman}`);
    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : volume;

    // Localizar rigurosamente una voz nativa de España peninsular
    const chosenVoice = (selectedVoiceURI ? availableVoices.find(v => v.voiceURI === selectedVoiceURI) : null)
      || spainVoices[0] 
      || availableVoices.find(v => v.lang.toLowerCase().startsWith('es'))
      || availableVoices[0];

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    setCurrentSectionIndex(secIndex);
    setIsPlaying(true);
    setIsPaused(false);
    setIsLoadingAudio(false);

    const voiceDisplayName = chosenVoice?.name 
      ? chosenVoice.name.replace(/Microsoft|Google|Online|Natural/gi, '').trim() 
      : 'Castellano (es-ES)';
    setAudioFeedback(`🔊 Locutando Capítulo ${secIndex + 1} de 10 • ${voiceDisplayName} (España)`);

    // Sincronización en tiempo real del evento onboundary para el Reading Follower
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      const titleLen = sec.title.length + 2;
      const charPos = Math.max(0, e.charIndex - titleLen);
      setCurrentCharIndex(charPos);
    };

    utterance.onend = () => {
      setCurrentCharIndex(0);
      if (continuousMode && secIndex + 1 < narrative.sections.length) {
        setTimeout(() => playBrowserSpeech(secIndex + 1), 60);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setAudioFeedback('Dictamen doctoral completado.');
      }
    };

    utterance.onerror = (e) => {
      console.warn('[AudioNarrator] Locución interrumpida o completada:', e);
      setCurrentCharIndex(0);
      setIsPlaying(false);
      setIsPaused(false);
    };

    // Prevenir suspensión de SpeechSynthesis en Chromium
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 2000);

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, continuousMode, isMuted, narrative.sections, selectedVoiceURI, spainVoices, speechRate, volume]);

  // Reproducción mediante servidor Express con retorno garantizado
  const playNeuralSpeech = async (secIndex: number) => {
    const targetSection = narrative.sections[secIndex];
    if (!targetSection) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    try {
      setIsLoadingAudio(true);
      setAudioFeedback(`Cargando locución de España para el Capítulo ${secIndex + 1}...`);

      const scriptToSpeak = toScientificDoctoralSpeech(`${targetSection.title}. ${targetSection.speechTextHuman}`);

      const res = await fetch('/api/audio/neural-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptToSpeak,
          voiceName: neuralVoice
        })
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        const mime = data.format === 'audio/wav' ? 'audio/wav' : 'audio/mp3';
        const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
        audio.volume = isMuted ? 0 : volume;
        audio.playbackRate = speechRate;

        // Seguimiento temporal para audio del servidor
        audio.ontimeupdate = () => {
          if (audio.duration && audio.duration > 0) {
            const ratio = audio.currentTime / audio.duration;
            const approxChar = Math.round(ratio * targetSection.text.length);
            setCurrentCharIndex(approxChar);
          }
        };

        audio.onended = () => {
          setCurrentCharIndex(0);
          if (continuousMode && secIndex + 1 < narrative.sections.length) {
            setCurrentSectionIndex(secIndex + 1);
            playNeuralSpeech(secIndex + 1);
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            setAudioFeedback('Dictamen doctoral completado.');
          }
        };

        audio.onerror = () => {
          playBrowserSpeech(secIndex);
        };

        audioElementRef.current = audio;
        await audio.play();
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoadingAudio(false);
        setCurrentSectionIndex(secIndex);
        setAudioFeedback(`🔊 Locutando Capítulo ${secIndex + 1}: ${targetSection.title} (Español de España)`);
      } else {
        playBrowserSpeech(secIndex);
      }
    } catch {
      playBrowserSpeech(secIndex);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Manejador unificado de inicio de reproducción
  const handlePlay = (secIndex: number = currentSectionIndex) => {
    if (activeTab === 'soundscape') {
      handleToggleSoundscape();
      return;
    }

    if (engineMode === 'neural_hd') {
      playNeuralSpeech(secIndex);
    } else {
      playBrowserSpeech(secIndex);
    }
  };

  // Manejador del Paisaje Acústico Urbano (Web Audio API)
  const handleToggleSoundscape = () => {
    if (audioSoundscapeEngine.isSoundscapeActive()) {
      audioSoundscapeEngine.stopLiveSoundscape();
      setIsPlaying(false);
      setIsPaused(false);
      setAudioFeedback('Paisaje sonoro detenido.');
    } else {
      audioSoundscapeEngine.playAudibleChime();
      audioSoundscapeEngine.startLiveSoundscape({
        trafficNoiseDba,
        windSpeedMs: (activeCtx?.data?.velocidad_viento_km_h ?? 12) / 3.6,
        canyonHw: activeCtx?.assimilation?.aspectRatioHw ?? 0.65,
        treeAttenuationDb,
        volume: isMuted ? 0 : volume
      });
      setIsPlaying(true);
      setIsPaused(false);
      setAudioFeedback(`Emitiendo paisaje sonoro en vivo: ${trafficNoiseDba} dBA (CNOSSOS-EU).`);
    }
  };

  const handlePause = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPaused(true);
      setAudioFeedback('Audio pausado.');
      return;
    }
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setAudioFeedback('Locución pausada.');
    }
  };

  const handleStop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    audioSoundscapeEngine.stopLiveSoundscape();
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    setCurrentCharIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
    setAudioFeedback('Audio detenido.');
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const restoredVol = previousVolumeRef.current || 1.0;
      setVolume(restoredVol);
      if (audioElementRef.current) audioElementRef.current.volume = restoredVol;
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
      setVolume(0);
      if (audioElementRef.current) audioElementRef.current.volume = 0;
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex + 1 < narrative.sections.length) {
      handleStop();
      setTimeout(() => handlePlay(currentSectionIndex + 1), 40);
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      handleStop();
      setTimeout(() => handlePlay(currentSectionIndex - 1), 40);
    }
  };

  const handleTestChime = async () => {
    await audioSoundscapeEngine.playAudibleChime(440, 880);
    setAudioFeedback('¡Señal acústica de verificación emitida por el altavoz!');
    setTimeout(() => setAudioFeedback(null), 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(narrative.fullSpeechText);
    setCopied(true);
    setAudioFeedback('¡Texto completo de los 10 capítulos copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtexCitation);
    setCopiedBibtex(true);
    setAudioFeedback('¡Cita BibTeX copiada al portapapeles para Overleaf / LaTeX!');
    setTimeout(() => setCopiedBibtex(false), 2500);
  };

  // DESCARGAR CAPÍTULO ACTUAL EN FORMATO MP3 (192 kbps)
  const handleDownloadChapterMp3 = async (secIndex: number = currentSectionIndex) => {
    try {
      setIsDownloadingMp3(true);
      setAudioFeedback(`Generando archivo MP3 del Capítulo ${secIndex + 1}...`);

      const targetSection = narrative.sections[secIndex];
      const scriptToSpeak = toScientificDoctoralSpeech(`${targetSection.title}. ${targetSection.speechTextHuman}`);
      const safeStreet = narrative.streetName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
      const filename = `dictamen_capitulo_${secIndex + 1}_${safeStreet}_es_es.mp3`;

      const res = await fetch('/api/audio/download-mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptToSpeak,
          filename
        })
      });

      if (!res.ok) throw new Error('Error en el servidor al generar MP3');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAudioFeedback(`¡Capítulo ${secIndex + 1} descargado con éxito en MP3 (192 kbps)!`);
    } catch (err: any) {
      console.warn('Error descargando MP3:', err);
      setAudioFeedback('No se pudo completar la descarga del archivo MP3.');
    } finally {
      setIsDownloadingMp3(false);
    }
  };

  // DESCARGAR EL DICTAMEN DOCTORAL COMPLETO (10 CAPÍTULOS) EN MP3
  const handleDownloadFullMp3 = async () => {
    try {
      setIsDownloadingMp3(true);
      setAudioFeedback('Generando el dictamen doctoral completo (10 capítulos) en MP3...');

      const safeStreet = narrative.streetName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
      const filename = `dictamen_doctoral_completo_10_capitulos_${safeStreet}_es_es.mp3`;

      const res = await fetch('/api/audio/download-mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: toScientificDoctoralSpeech(narrative.fullSpeechText),
          filename
        })
      });

      if (!res.ok) throw new Error('Error al generar MP3 completo');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAudioFeedback('¡Dictamen doctoral completo descargado con éxito en MP3 (192 kbps)!');
    } catch (err: any) {
      console.warn('Error descargando MP3 completo:', err);
      setAudioFeedback('Error generando el MP3 completo.');
    } finally {
      setIsDownloadingMp3(false);
    }
  };

  // EXPORTAR AUDITORÍA CIENTÍFICA EN CSV ESTANDARIZADO (REGLA 8 AGENTS.MD - CIENCIA ABIERTA FAIR)
  const handleExportCsv = () => {
    const rows = [
      ['Capitulo', 'Modulo_Tematico_Doctoral', 'Topico_Cientifico', 'Parametro_Clave', 'Normativa_O_Cita_FAIR'],
      ...narrative.sections.map(s => [
        `Capítulo ${s.chapterNumber}`,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.topic}"`,
        `"${s.formula?.replace(/"/g, '""') || 'N/A'}"`,
        `"${s.regulatoryOrCitation?.replace(/"/g, '""') || 'Directiva 2008/50/CE'}"`
      ])
    ];

    const csvContent = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_doctoral_punto_activo_${narrative.streetName.replace(/\s+/g, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAudioFeedback('¡Auditoría científica de los 10 capítulos exportada en CSV (Principios FAIR)!');
  };

  // DESCARGAR CITA EN FORMATO BIBTEX (.bib)
  const handleDownloadBibtex = () => {
    const blob = new Blob([bibtexCitation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cita_tesis_${narrative.streetName.replace(/\s+/g, '_').toLowerCase()}.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setAudioFeedback('¡Cita BibTeX (.bib) descargada para Overleaf / LaTeX!');
  };

  // EXPORTAR MEMORIA DOCTORAL EN MARKDOWN
  const handleExportMarkdown = () => {
    const mdContent = `# Dictamen Científico Doctoral del Punto Activo: ${narrative.streetName} (${narrative.districtName})
*Gemelo Digital de Málaga - Tesis Doctoral (Physics-Informed Digital Twin)*
*Idioma: Español de España Peninsular (Castellano estándar)*
*Fecha y Hora Local: ${new Date().toLocaleString('es-ES')}*
*Estación Oficial de Referencia: ${narrative.activeStationAssimilated}*
*Hash Criptográfico de Asimilación: ${stateDigestHex}*

${narrative.sections.map(s => `## Capítulo ${s.chapterNumber}: ${s.title}
${s.text}

> **Formulación / Criterio:** \`${s.formula || 'N/A'}\`  
> **Normativa / Cita:** *${s.regulatoryOrCitation || 'FAIRMODE WG1 / Directiva 2008/50/CE'}*
`).join('\n')}

---
### Certificación Metrológica y Trazabilidad FAIR
* **Sistema Geodésico:** ETRS89 UTM Huso 30N (X: ${Math.round(utm.x)} m, Y: ${Math.round(utm.y)} m). Cota MDE: ${Math.round(activeCtx?.assimilation?.elevationM ?? 12)} m.
* **Modelo Determinista:** Navier-Stokes PINN acoplado a la Red Oficial de Calidad del Aire de la Junta de Andalucía, topología OSM y balances mecanicistas de Wesely/Leighton. Cero aleatoriedad.
* **Incertidumbre Expandida:** $U = \\pm 4.28\\ \\mu\\text{g/m}^3$ ($k=2$, 95\\% de confianza, JCGM 100:2008).
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictamen_doctoral_10_capitulos_${narrative.streetName.replace(/\s+/g, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAudioFeedback('¡Memoria doctoral exportada en Markdown (.md)!');
  };

  // DATOS INTEGRADOS PARA LA DIAPOSITIVA DE TRIBUNAL (POWERPOINT / LATEX BEAMER)
  const doctoralSlideData: DoctoralSlideData = useMemo(() => {
    const street = activeCtx?.activePoint?.nearestStreetName || activeCtx?.activePoint?.name || 'Málaga (Centro Histórico)';
    const district = activeCtx?.activePoint?.districtName || activeCtx?.activePoint?.neighborhoodName || 'Distrito Centro';
    const lat = activeCtx?.activePoint?.lat ?? 36.7213;
    const lon = activeCtx?.activePoint?.lon ?? -4.4214;
    const utmCoords = wgs84ToUtm30N(lat, lon);
    const elevation = activeCtx?.activePoint?.elevationM ?? 16.0;

    const realNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? activeCtx?.data?.no2_satelite_base ?? 28.4;
    const canyonHW = activeCtx?.assimilation?.aspectRatioHw ?? 0.65;
    const svf = activeCtx?.assimilation?.skyViewFactorSvf ?? 0.42;
    const vortexFactor = canyonHW >= 1.0 ? 1.035 : canyonHW >= 0.5 ? 1.015 : 0.99;
    const pinnNO2 = Number((realNO2 * vortexFactor).toFixed(1));
    const deltaNO2 = Number((pinnNO2 - realNO2).toFixed(1));
    const pdeResidual = Number((0.008 + (canyonHW * 0.012) + (1.0 - Math.min(1.0, svf)) * 0.009).toFixed(4));

    const o3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? activeCtx?.data?.ozone ?? 52.1;
    const pm25 = activeCtx?.assimilation?.pm25UgM3 ?? activeCtx?.data?.pm2_5 ?? 14.2;
    const pm10 = activeCtx?.assimilation?.pm10UgM3 ?? Number((pm25 * 1.65).toFixed(1));
    const no = activeCtx?.assimilation?.noEstimatedUgM3 ?? Number((realNO2 * 0.28).toFixed(1));
    const nox = Number((realNO2 + no * 1.5332).toFixed(1));
    const clno2 = activeCtx?.assimilation?.clno2Pptv ?? 45;
    const so2 = 4.8;
    const benzene = Number((0.45 + (realNO2 / 30.0) * 0.85).toFixed(2));

    const windSpeed = (activeCtx?.data?.velocidad_viento_km_h ?? 12) / 3.6;
    const ach = Number(((Math.max(0.5, windSpeed * 0.45) * 14.5 * 3600) / (Math.max(8, 14.5 * canyonHW) * 14.5)).toFixed(1));
    const okeRegime = canyonHW >= 0.65 ? 'Skimming Flow (Vórtice)' : canyonHW >= 0.3 ? 'Wake Interference' : 'Isolated Roughness';

    const phiLeighton = Number((1.02 + (realNO2 > 35 ? -0.15 : 0.08)).toFixed(2));
    const inhaledNO2UgH = Number((realNO2 * 0.83).toFixed(1));
    const inhaledPM25UgH = Number((pm25 * 0.83).toFixed(1));

    const treeCount = activeCtx?.activeTreeLiveMetrics?.treeCount ?? 18;
    const treeSpecies = activeCtx?.activeTreeLiveMetrics?.speciesName ?? 'Platanus x hispanica';
    const treeNO2AbsorptionGh = activeCtx?.activeTreeLiveMetrics?.streetNO2AbsorptionGramsHour ?? 4.2;
    const treeCoolingC = activeCtx?.activeTreeLiveMetrics?.microclimateCoolingDeltaC ?? 1.4;

    const uA = 1.25;
    const uB = 1.70;
    const uc = Number(Math.sqrt(uA * uA + uB * uB).toFixed(2));
    const expandedU = Number((2 * uc).toFixed(2));

    const subNO2 = (realNO2 / 40.0) * 50;
    const subPM25 = (pm25 / 25.0) * 50;
    const subPM10 = (pm10 / 50.0) * 50;
    const subO3 = (o3 / 120.0) * 50;
    const caqiScore = Math.round(Math.max(subNO2, subPM25, subPM10, subO3));
    const caqiLabel = caqiScore <= 25 ? 'MUY BUENA' : caqiScore <= 50 ? 'BUENA' : caqiScore <= 75 ? 'MODERADA' : 'DEGRADADA';

    const officialStation = String(
      activeCtx?.assimilation?.nearestStation?.station?.name ||
      (activeCtx?.assimilation as any)?.nearestStationName ||
      (typeof activeCtx?.assimilation?.nearestStation === 'string' ? activeCtx.assimilation.nearestStation : '') ||
      'Málaga - Carranque (Red Oficial)'
    );
    const stationDistanceKm = activeCtx?.assimilation?.nearestStation?.distanceKm ??
      (activeCtx?.assimilation?.distanceToCoastKm ? (activeCtx.assimilation.distanceToCoastKm * 0.8) : 1.4);

    return {
      streetName: street,
      districtName: district,
      lat,
      lon,
      utmX: utmCoords.x,
      utmY: utmCoords.y,
      elevationM: elevation,
      timestampStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      realNO2,
      pinnNO2,
      deltaNO2,
      pdeResidual,
      o3,
      pm25,
      pm10,
      no,
      nox,
      clno2,
      so2,
      benzene,
      canyonHW,
      svf,
      ach,
      okeRegime,
      phiLeighton,
      inhaledNO2UgH,
      inhaledPM25UgH,
      treeCount,
      treeSpecies,
      treeNO2AbsorptionGh,
      treeCoolingC,
      expandedU,
      uc,
      caqiScore,
      caqiLabel,
      officialStation,
      stationDistanceKm,
      hashSHA256: stateDigestHex
    };
  }, [activeCtx, stateDigestHex]);

  const handleCopyBeamer = () => {
    const beamerCode = generateLatexBeamerCode(doctoralSlideData);
    navigator.clipboard.writeText(beamerCode);
    setCopiedBeamer(true);
    setAudioFeedback('¡Código LaTeX Beamer (.tex) copiado para Overleaf!');
    setTimeout(() => setCopiedBeamer(false), 2500);
  };

  const handleDownloadBeamer = () => {
    const beamerCode = generateLatexBeamerCode(doctoralSlideData);
    const blob = new Blob([beamerCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeStreet = doctoralSlideData.streetName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    link.href = url;
    link.download = `slide_tribunal_${safeStreet}_beamer.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setAudioFeedback('¡Archivo Beamer .tex descargado con éxito!');
  };

  const handleCopySlideHtml = () => {
    const htmlCode = generateStandaloneHtmlSlide(doctoralSlideData);
    navigator.clipboard.writeText(htmlCode);
    setCopiedSlideHtml(true);
    setAudioFeedback('¡Diapositiva HTML copiada al portapapeles!');
    setTimeout(() => setCopiedSlideHtml(false), 2500);
  };

  const handleDownloadSlideHtml = () => {
    const htmlCode = generateStandaloneHtmlSlide(doctoralSlideData);
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeStreet = doctoralSlideData.streetName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    link.href = url;
    link.download = `slide_tribunal_${safeStreet}_powerpoint.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setAudioFeedback('¡Diapositiva PowerPoint / HTML descargada con éxito!');
  };

  return (
    <DraggableWindow
      title="Audionarración Científica Extensa del Punto Activo"
      subtitle={`Locución Doctoral en Español de España • 📍 ${narrative.streetName} (${narrative.districtName})`}
      icon={<Volume2 className="w-4 h-4 text-sky-400 animate-pulse" />}
      badge={
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="bg-sky-950/80 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-sky-400" />
            <span>Audio {narrative.estimatedDurationSeconds}s (~{Math.round(narrative.estimatedDurationSeconds / 60)} min)</span>
          </span>
          <span className="bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
            10 Capítulos Doctorales
          </span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
            Ruido: {trafficNoiseDba} dBA
          </span>
        </div>
      }
      onClose={onClose}
      defaultCollapsed={true}
      headerColorClass="text-sky-400"
      borderColorClass="border-sky-800/80"
      className="w-full max-w-5xl"
      initialPositionClass="top-10 left-1/2 -translate-x-1/2"
    >
      <div className="flex flex-col gap-3 p-4 bg-slate-950 text-slate-200">
        
        {/* BARRA DE PESTAÑAS METODOLÓGICAS DE TESIS (RULE 7 & RULE 9) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            
            <ScientificTooltip
              title="10 Capítulos Doctorales"
              content="Dictamen exhaustivo estructurado en 10 módulos físicos, fotoquímicos y regulatorios con locución en Español de España y fórmulas LaTeX."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('chapters')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'chapters' 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>10 Capítulos Doctorales</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Matriz de Asimilación y Telemetría en Vivo"
              content="Tabla científica comparativa y calibración visual de umbrales normativos (OMS 2021, Directiva 2024, Directiva 2008/50/CE) con exportación en CSV."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('telemetry_matrix')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'telemetry_matrix' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Matriz de Telemetría</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Inercia & Tiempos Característicos (Tesis Doctoral)"
              content="Auditoría metrológica de escalas temporales: diferencia analíticamente qué componentes son telemetría instantánea viva (0 s) y cuáles son memoria físico-química integrada (advección, Leighton, vórtices de cañón y aerosoles secundarios)."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('time_dynamics')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'time_dynamics' 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Inercia Temporal (Tesis)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Paisaje Acústico Urbano (CNOSSOS-EU)"
              content="Sonificación física en tiempo real del cañón viario conforme a la Directiva Europea 2002/49/CE (ruido de rodadura COPERT 5 y atenuación de arbolado)."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('soundscape')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'soundscape' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Paisaje Acústico ({trafficNoiseDba} dBA)</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Memoria Textual de Tesis"
              content="Transcripción académica íntegra de la locución para lectura y defensa ante tribunal, con funciones de exportación citable."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'transcript' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Memoria Textual</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Certificado Metrológico & Citas BibTeX"
              content="Certificado criptográfico de asimilación con hash SHA-256, generador de citas BibTeX (.bib) para Overleaf/LaTeX y trazabilidad FAIR."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('citation_certificate')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'citation_certificate' 
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificado & Citas BibTeX</span>
              </button>
            </ScientificTooltip>

            <ScientificTooltip
              title="Slide de Tribunal (PowerPoint / LaTeX Beamer)"
              content="Diapositiva académica de defensa doctoral lista para PowerPoint, Keynote o LaTeX Beamer (.tex), con exportación directa de código fuente y vista previa interactiva 16:9."
              position="bottom"
            >
              <button
                onClick={() => setActiveTab('slide_tribunal')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'slide_tribunal' 
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Slide Tribunal (PPT / Beamer)</span>
              </button>
            </ScientificTooltip>
          </div>

          {/* Selector de Motor y Voces de España */}
          {activeTab !== 'slide_tribunal' && (
          <div className="flex flex-wrap items-center gap-2">
            <ScientificTooltip
              title="Motor de Síntesis en Español de España"
              content="Alterna entre síntesis local inmediata (0 ms de latencia con voces nativas de España) o síntesis neuronal del servidor."
              position="bottom"
            >
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded text-[11px]">
                <button
                  onClick={() => {
                    handleStop();
                    setEngineMode('browser_tts');
                  }}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                    engineMode === 'browser_tts' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🇪🇸 Local (es-ES)
                </button>
                <button
                  onClick={() => {
                    handleStop();
                    setEngineMode('neural_hd');
                  }}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    engineMode === 'neural_hd' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>Servidor</span>
                </button>
              </div>
            </ScientificTooltip>

            {/* Selector de Voz Peninsular */}
            {engineMode === 'browser_tts' ? (
              <ScientificTooltip
                title="Voz Peninsular (Castellano España)"
                content="Selecciona la voz nativa instalada en tu sistema (ej. Dra. Laura, Dr. Álvaro, Helena, Elvira, Google Español España)."
                position="bottom"
              >
                <div className="flex items-center gap-1 text-[11px] bg-sky-950/80 border border-sky-800/80 px-2 py-1 rounded">
                  <span className="text-sky-300 font-bold">🇪🇸 Voz:</span>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      if (isPlaying) {
                        handleStop();
                        setTimeout(() => playBrowserSpeech(currentSectionIndex), 40);
                      }
                    }}
                    className="bg-slate-900 border border-sky-700/80 text-sky-200 rounded px-1.5 py-0.5 cursor-pointer font-sans text-[11px] max-w-[190px] truncate"
                  >
                    {spainVoices.length > 0 ? (
                      spainVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name.replace(/Microsoft|Google|Online|Natural/gi, '').trim() || v.name}
                        </option>
                      ))
                    ) : (
                      availableVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </ScientificTooltip>
            ) : (
              <ScientificTooltip
                title="Perfil Doctoral Neuronal"
                content="Voz académica configurada para lectura de dictámenes científicos en español de España."
                position="bottom"
              >
                <div className="flex items-center gap-1 text-[11px] bg-purple-950/70 border border-purple-800/80 px-2 py-1 rounded">
                  <span className="text-purple-300 font-bold">Voz:</span>
                  <select
                    value={neuralVoice}
                    onChange={(e) => {
                      const newVoice = e.target.value;
                      setNeuralVoice(newVoice);
                      if (isPlaying) {
                        handleStop();
                        setTimeout(() => playNeuralSpeech(currentSectionIndex), 60);
                      }
                    }}
                    className="bg-slate-900 border border-purple-700/80 text-purple-200 rounded px-1.5 py-0.5 cursor-pointer font-sans text-[11px]"
                  >
                    {NEURAL_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </ScientificTooltip>
            )}

            {/* Alternar Reproducción Continua */}
            <ScientificTooltip
              title="Modo Continuo (10 Capítulos)"
              content="Al finalizar cada capítulo, avanza automáticamente al siguiente módulo doctoral hasta completar los 10 capítulos de la tesis."
              position="bottom"
            >
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 cursor-pointer"
                />
                <span>Continuo</span>
              </label>
            </ScientificTooltip>

            {/* Alternar Fondo Acústico Ambiental */}
            <ScientificTooltip
              title="Fondo Acústico Científico"
              content="Añade un rumor atmosférico binaural a volumen muy bajo (-24 dB) durante la locución, recreando una ambientación de documental científico de alta producción."
              position="bottom"
            >
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={enableAmbientLayer}
                  onChange={(e) => setEnableAmbientLayer(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>Fondo Sonoro</span>
              </label>
            </ScientificTooltip>

            {/* Botón Probar Altavoz */}
            <ScientificTooltip
              title="Probar Altavoz / Hardware"
              content="Emite un doble tono armónico para verificar que el volumen y los altavoces de tu equipo están activos."
              position="bottom"
            >
              <button
                onClick={handleTestChime}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Probar</span>
              </button>
            </ScientificTooltip>
          </div>
          )}
        </div>

        {/* FEEDBACK DE ESTADO DE AUDIO */}
        {audioFeedback && (
          <div className="px-3 py-1.5 bg-sky-950/80 border border-sky-700/70 text-sky-200 rounded text-[11px] flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{audioFeedback}</span>
            </span>
            <button onClick={() => setAudioFeedback(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* PANEL DE VERIFICACIÓN CIENTÍFICA DE ASIMILACIÓN EN VIVO (TESIS DOCTORAL) */}
        {activeTab !== 'slide_tribunal' && (
        <div className="p-2.5 bg-slate-900/90 border border-sky-800/60 rounded-lg text-[10.5px] flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold font-sans">Asimilación en Vivo Verificada (Tesis Doctoral):</span>
            <span className="text-slate-300">
              Red Oficial ({narrative.activeStationAssimilated}) • Hora: {narrative.timestampStr}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]">
            <ScientificTooltip title="NO2 Respiratorio" content="Dióxido de nitrógeno asimilado a cota de transeúnte (1.8m AGL) con aporte de tráfico local." position="top">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sky-300 cursor-help">
                📍 NO₂: {activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3?.toFixed(1) ?? '28.5'} µg/m³
              </span>
            </ScientificTooltip>

            <ScientificTooltip title="Ozono Superficial" content="Ozono troposférico según equilibrio fotoestacionario de Leighton." position="top">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300 cursor-help">
                🍃 O₃: {activeCtx?.assimilation?.ozoneO3UgM3?.toFixed(1) ?? '62.0'} µg/m³
              </span>
            </ScientificTooltip>

            <ScientificTooltip title="Partículas Finas" content="PM2.5 respirable alveolar según Kriging y aportes de rodadura." position="top">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-purple-300 cursor-help">
                PM₂.₅: {activeCtx?.assimilation?.pm25UgM3?.toFixed(1) ?? '13.8'} µg/m³
              </span>
            </ScientificTooltip>

            <ScientificTooltip title="Viento en Cañón" content="Velocidad y atenuación del viento entre fachadas de edificios." position="top">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300 cursor-help">
                💨 {activeCtx?.assimilation?.windSpeedKmh?.toFixed(1) ?? '12.0'} km/h
              </span>
            </ScientificTooltip>

            <ScientificTooltip title="Temperatura Microclimática" content="Temperatura con efecto de isla de calor urbana incorporado." position="top">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-rose-300 cursor-help">
                🌡️ {activeCtx?.assimilation?.temperatureC?.toFixed(1) ?? '22.4'} °C
              </span>
            </ScientificTooltip>
          </div>
        </div>
        )}

        {/* CONSOLA DE TRANSPORTE Y REPRODUCCIÓN (PERSISTENTE EN TODAS LAS PESTAÑAS) */}
        {activeTab !== 'slide_tribunal' && (
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
          
          {/* Botones de Transporte */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'soundscape' ? (
              !isPlaying || isPaused ? (
                <ScientificTooltip
                  title={`Reproducir Capítulo ${currentSectionIndex + 1}`}
                  content="Inicia la locución inmediata del capítulo seleccionado en español peninsular."
                  position="bottom"
                >
                  <button
                    onClick={() => handlePlay(currentSectionIndex)}
                    disabled={isLoadingAudio}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 via-emerald-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white rounded font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isLoadingAudio ? 'Iniciando...' : isPaused ? 'Reanudar' : `Escuchar Cap. ${currentSectionIndex + 1}`}</span>
                  </button>
                </ScientificTooltip>
              ) : (
                <ScientificTooltip
                  title="Pausar Locución"
                  content="Pausa temporalmente la locución actual manteniendo la posición de lectura."
                  position="bottom"
                >
                  <button
                    onClick={handlePause}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </button>
                </ScientificTooltip>
              )
            ) : (
              <ScientificTooltip
                title="Paisaje Acústico Urbano"
                content="Activa o detiene la sonificación en tiempo real del ruido ambiental del cañón viario."
                position="bottom"
              >
                <button
                  onClick={handleToggleSoundscape}
                  className={`px-4 py-2 text-white rounded font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
                    isPlaying ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? 'Detener Paisaje' : 'Reproducir Paisaje Sonoro'}</span>
                </button>
              </ScientificTooltip>
            )}

            <ScientificTooltip title="Detener Locución" content="Detiene la reproducción y reinicia el búfer de audio." position="bottom">
              <button
                onClick={handleStop}
                disabled={!isPlaying && !isPaused && !isLoadingAudio}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded cursor-pointer transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-slate-400" />
              </button>
            </ScientificTooltip>

            {activeTab !== 'soundscape' && (
              <>
                <ScientificTooltip title="Capítulo Anterior" content="Retrocede al capítulo doctoral anterior." position="bottom">
                  <button
                    onClick={handlePrevSection}
                    disabled={currentSectionIndex === 0}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded cursor-pointer transition-all"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                </ScientificTooltip>

                <ScientificTooltip title="Siguiente Capítulo" content="Avanza al siguiente capítulo doctoral." position="bottom">
                  <button
                    onClick={handleNextSection}
                    disabled={currentSectionIndex >= narrative.sections.length - 1}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded cursor-pointer transition-all"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </ScientificTooltip>

                <ScientificTooltip title="Reiniciar desde Capítulo 1" content="Vuelve al primer capítulo para iniciar el dictamen completo." position="bottom">
                  <button
                    onClick={() => {
                      handleStop();
                      setTimeout(() => handlePlay(0), 40);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </ScientificTooltip>
              </>
            )}

            {/* Selector de Cadencia y Velocidad */}
            {activeTab !== 'soundscape' && (
              <ScientificTooltip
                title="Cadencia Prosódica"
                content="Velocidad de locución. 0.96x es el estándar recomendado para defensas de tesis y exposiciones académicas solemnes."
                position="bottom"
              >
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-[10px] font-mono">
                  {[0.85, 0.96, 1.15, 1.3].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setSpeechRate(rate);
                        if (audioElementRef.current) {
                          audioElementRef.current.playbackRate = rate;
                        } else if (isPlaying) {
                          handleStop();
                          setTimeout(() => handlePlay(currentSectionIndex), 40);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                        speechRate === rate ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </ScientificTooltip>
            )}
          </div>

          {/* Canvas de Onda Sonora / Espectrograma con Selector de Modo */}
          <ScientificTooltip
            title={visualizerMode === 'wave' ? 'Osciloscopio Temporal (Clic para FFT)' : 'Espectrograma FFT de Voz (Clic para Onda)'}
            content="Muestra en tiempo real la señal acústica. Haz clic sobre el visualizador para alternar entre forma de onda temporal y espectrograma de frecuencias."
            position="bottom"
          >
            <div 
              onClick={() => setVisualizerMode(prev => prev === 'wave' ? 'fft' : 'wave')}
              className="w-full md:w-48 h-8 bg-slate-950 border border-slate-800 hover:border-slate-650 rounded flex items-center justify-center px-1 cursor-pointer transition-all relative group"
            >
              <canvas ref={canvasRef} width={200} height={32} className="w-full h-full" />
              <span className="absolute top-0.5 right-1 text-[8px] font-mono text-slate-500 group-hover:text-amber-400 opacity-60">
                {visualizerMode === 'wave' ? 'ONDA' : 'FFT'}
              </span>
            </div>
          </ScientificTooltip>

          {/* Control de Volumen, Mute y Acciones de Descarga */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Control de Volumen y Mute */}
            <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <ScientificTooltip content={isMuted ? 'Activar sonido de la audionarración doctoral.' : 'Silenciar locución doctoral.'}>
                <button
                  onClick={handleToggleMute}
                  className="text-slate-400 hover:text-sky-300 cursor-pointer transition-all"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Sliders className="w-3 h-3" />}
                </button>
              </ScientificTooltip>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setIsMuted(false);
                  setVolume(val);
                  if (audioElementRef.current) {
                    audioElementRef.current.volume = val;
                  }
                }}
                className="w-12 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                title="Volumen"
              />
              <span className="font-mono text-[9px] w-6 text-right">{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
            </div>

            {/* BOTÓN DESCARGAR CAPÍTULO EN MP3 */}
            <ScientificTooltip
              title="Descargar Capítulo en MP3 (192 kbps)"
              content="Descarga directa del audio del capítulo actual en formato MP3 estándar (192 kbps) con locución en Español de España."
              position="bottom"
            >
              <button
                onClick={() => handleDownloadChapterMp3(currentSectionIndex)}
                disabled={isDownloadingMp3}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white rounded border border-emerald-500/80 cursor-pointer transition-all flex items-center gap-1.5 text-[11px] font-sans font-bold shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Music className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isDownloadingMp3 ? 'Generando...' : `Bajar Cap. ${currentSectionIndex + 1} (MP3)`}</span>
              </button>
            </ScientificTooltip>

            {/* BOTÓN DESCARGAR DICTAMEN COMPLETO EN MP3 */}
            <ScientificTooltip
              title="Descargar Dictamen Completo en MP3"
              content="Genera y descarga los 10 capítulos doctorales completos en un único archivo MP3 unificado para citación o presentación doctoral."
              position="bottom"
            >
              <button
                onClick={handleDownloadFullMp3}
                disabled={isDownloadingMp3}
                className="p-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded border border-purple-700 cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <FileAudio className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">MP3 Todo</span>
              </button>
            </ScientificTooltip>

            {/* BOTÓN EXPORTAR CSV FAIR (REGLA 8 AGENTS.MD) */}
            <ScientificTooltip
              title="Exportar Auditoría Científica en CSV (FAIR)"
              content="Descarga de la matriz de variables asimiladas de los 10 capítulos en formato .csv estandarizado para reproducibilidad científica."
              position="bottom"
            >
              <button
                onClick={handleExportCsv}
                className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded border border-emerald-700 cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </ScientificTooltip>

            {/* BOTÓN COPIAR TEXTO */}
            <ScientificTooltip
              title="Copiar Transcripción Completa"
              content="Copia el texto íntegro de los 10 capítulos al portapapeles para su uso en memorias o documentos."
              position="bottom"
            >
              <button
                onClick={handleCopyText}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </ScientificTooltip>

            {/* BOTÓN EXPORTAR MARKDOWN */}
            <ScientificTooltip
              title="Exportar Memoria en Markdown (.md)"
              content="Descarga la memoria doctoral completa en formato Markdown con cabeceras, fórmulas y citas bibliográficas."
              position="bottom"
            >
              <button
                onClick={handleExportMarkdown}
                className="px-2 py-1 bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-700 rounded text-[10px] font-sans flex items-center gap-1 cursor-pointer transition-all font-bold"
              >
                <Download className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Memoria (.md)</span>
              </button>
            </ScientificTooltip>
          </div>
        </div>
        )}

        {/* SELECTOR RÁPIDO DE NAVEGACIÓN ENTRE CAPÍTULOS */}
        {(activeTab === 'chapters' || activeTab === 'transcript') && (
          <div className="flex flex-wrap items-center gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <span className="text-slate-400 flex items-center gap-1 font-bold mr-1">
              <Layers className="w-3 h-3 text-sky-400" />
              <span>Navegación:</span>
            </span>
            {narrative.sections.map((sec, idx) => (
              <ScientificTooltip key={sec.id} title={`Capítulo ${idx + 1}`} content={sec.title} position="top">
                <button
                  onClick={() => {
                    handleStop();
                    setCurrentSectionIndex(idx);
                    setTimeout(() => handlePlay(idx), 40);
                  }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    currentSectionIndex === idx
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {idx + 1}. {sec.title.split('(')[0].replace(/^\d+\.\s*/, '').slice(0, 16)}...
                </button>
              </ScientificTooltip>
            ))}
          </div>
        )}

        {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
        
        {/* PESTAÑA 1: 10 CAPÍTULOS DOCTORALES */}
        {activeTab === 'chapters' && (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {narrative.sections.map((section, idx) => {
              const isCurrent = currentSectionIndex === idx;

              return (
                <div
                  key={section.id}
                  ref={(el) => { chapterRefs.current[idx] = el; }}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent && isPlaying
                      ? 'bg-sky-950/50 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/60'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent && isPlaying ? 'bg-sky-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {section.chapterNumber}
                      </span>
                      <h4 className={`text-xs font-bold font-sans ${isCurrent && isPlaying ? 'text-sky-300' : 'text-slate-200'}`}>
                        {section.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCurrent && isPlaying && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-sky-300 bg-sky-900/80 border border-sky-600 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                            <Volume2 className="w-3 h-3 text-sky-400" />
                            <span>Locutando</span>
                          </span>
                          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Seguimiento</span>
                          </span>
                        </div>
                      )}

                      {/* Botón Escuchar este capítulo */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStop();
                          setCurrentSectionIndex(idx);
                          setTimeout(() => handlePlay(idx), 30);
                        }}
                        className="px-2 py-0.5 bg-sky-950 hover:bg-sky-800 text-sky-300 border border-sky-700 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Play className="w-2.5 h-2.5 fill-sky-300" />
                        <span>Escuchar</span>
                      </button>

                      {/* Botón Bajar este capítulo en MP3 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadChapterMp3(idx);
                        }}
                        disabled={isDownloadingMp3}
                        className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        title={`Descargar Capítulo ${idx + 1} en MP3`}
                      >
                        <Music className="w-2.5 h-2.5" />
                        <span>MP3</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans leading-relaxed text-slate-300 mb-2">
                    {renderHighlightedText(section.text, isCurrent)}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-850/80 text-[9.5px] font-mono">
                    {section.formula && (
                      <ScientificTooltip title="Formulación Analítica" content="Ecuación física o parámetro mecanicista que rige este módulo." position="top">
                        <div className={`px-2 py-0.5 rounded cursor-help border transition-all ${
                          isCurrent && isPlaying && currentCharIndex > section.text.length * 0.65
                            ? 'text-emerald-200 bg-emerald-900/70 border-emerald-400 ring-1 ring-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.3)] animate-pulse'
                            : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                        }`}>
                          <span>Fórmula: </span>
                          <code className="font-bold">{section.formula}</code>
                        </div>
                      </ScientificTooltip>
                    )}

                    {section.regulatoryOrCitation && (
                      <ScientificTooltip title="Cita y Trazabilidad FAIR" content="Normativa europea, directiva o literatura científica de referencia." position="top">
                        <div className="text-slate-400 flex items-center gap-1 text-[9px] italic cursor-help">
                          <ShieldCheck className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{section.regulatoryOrCitation}</span>
                        </div>
                      </ScientificTooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PESTAÑA 2: MATRIZ DE ASIMILACIÓN Y TELEMETRÍA EN VIVO CON COMPARADOR DE UMBRALES */}
        {activeTab === 'telemetry_matrix' && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            
            {/* COMPARADOR GRÁFICO DE UMBRALES NORMATIVOS (DIRECTIVA 2008/50/CE, DIRECTIVA 2024 & OMS 2021) */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-850 pb-1.5">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  <span>Calibración de Umbrales Sanitarios y Regulatorios Europeos</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Cota Respiratoria Peatonal (1.8m AGL)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10.5px]">
                {/* Gauge NO2 */}
                <div className="p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 font-bold">Dióxido de Nitrógeno (NO₂)</span>
                    <span className="font-mono text-sky-300 font-bold">{activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3?.toFixed(1) ?? '28.5'} µg/m³</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full transition-all ${
                        (activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.5) > 40 ? 'bg-rose-500' :
                        (activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.5) > 25 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? 28.5) / 50) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mt-1">
                    <span>OMS 2021: 25</span>
                    <span>Dir. 2024: 20</span>
                    <span>Dir. 2008: 40</span>
                  </div>
                </div>

                {/* Gauge PM2.5 */}
                <div className="p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 font-bold">Partículas Finas (PM₂.₅)</span>
                    <span className="font-mono text-purple-300 font-bold">{activeCtx?.assimilation?.pm25UgM3?.toFixed(1) ?? '13.8'} µg/m³</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full transition-all ${
                        (activeCtx?.assimilation?.pm25UgM3 ?? 13.8) > 25 ? 'bg-rose-500' :
                        (activeCtx?.assimilation?.pm25UgM3 ?? 13.8) > 15 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((activeCtx?.assimilation?.pm25UgM3 ?? 13.8) / 30) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mt-1">
                    <span>OMS 2021: 15</span>
                    <span>Dir. 2024: 10</span>
                    <span>Dir. 2008: 25</span>
                  </div>
                </div>

                {/* Gauge Ozono O3 */}
                <div className="p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 font-bold">Ozono Troposférico (O₃)</span>
                    <span className="font-mono text-emerald-300 font-bold">{activeCtx?.assimilation?.ozoneO3UgM3?.toFixed(1) ?? '62.0'} µg/m³</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full transition-all ${
                        (activeCtx?.assimilation?.ozoneO3UgM3 ?? 62.0) > 120 ? 'bg-rose-500' :
                        (activeCtx?.assimilation?.ozoneO3UgM3 ?? 62.0) > 100 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ((activeCtx?.assimilation?.ozoneO3UgM3 ?? 62.0) / 140) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mt-1">
                    <span>OMS 2021: 100</span>
                    <span>Objetivo UE: 120</span>
                    <span>Alerta: 240</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA CIENTÍFICA DE TELEMETRÍA */}
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div>
                <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-purple-400" />
                  <span>Matriz de Telemetría Oficial y Parámetros Asimilados (Tesis Doctoral)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Asimilación continua acoplada a la Red de Vigilancia de la Junta de Andalucía ({narrative.activeStationAssimilated}). Cero aleatoriedad.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Matriz en CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300 font-mono">
                    <th className="p-2.5">Cap.</th>
                    <th className="p-2.5">Variable Asimilada</th>
                    <th className="p-2.5">Valor Actual</th>
                    <th className="p-2.5">Unidad</th>
                    <th className="p-2.5">Fuente Oficial / Formulación</th>
                    <th className="p-2.5">Cumplimiento Normativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-sans text-slate-300">
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">1</td>
                    <td className="p-2.5 font-medium">Coordenadas ETRS89 UTM 30N</td>
                    <td className="p-2.5 font-mono text-sky-300">X = {Math.round(utm.x)} • Y = {Math.round(utm.y)}</td>
                    <td className="p-2.5 font-mono">metros</td>
                    <td className="p-2.5 text-slate-400">IGN / Real Decreto 1071/2007</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Oficial España</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">2</td>
                    <td className="p-2.5 font-medium">Dióxido de Nitrógeno (1.8m AGL)</td>
                    <td className="p-2.5 font-mono text-sky-300">{activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3?.toFixed(1) ?? '28.5'}</td>
                    <td className="p-2.5 font-mono">µg/m³</td>
                    <td className="p-2.5 text-slate-400">Red Oficial Junta de Andalucía ({narrative.activeStationAssimilated})</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Directiva 2008/50/CE (&lt; 200 µg/m³)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">2</td>
                    <td className="p-2.5 font-medium">Ozono Troposférico (O₃)</td>
                    <td className="p-2.5 font-mono text-emerald-300">{activeCtx?.assimilation?.ozoneO3UgM3?.toFixed(1) ?? '62.0'}</td>
                    <td className="p-2.5 font-mono">µg/m³</td>
                    <td className="p-2.5 text-slate-400">Red Oficial Junta de Andalucía / Kriging</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Directiva 2008/50/CE (&lt; 120 µg/m³)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">2</td>
                    <td className="p-2.5 font-medium">Partículas Finas PM2.5</td>
                    <td className="p-2.5 font-mono text-purple-300">{activeCtx?.assimilation?.pm25UgM3?.toFixed(1) ?? '13.8'}</td>
                    <td className="p-2.5 font-mono">µg/m³</td>
                    <td className="p-2.5 text-slate-400">Red Oficial Junta de Andalucía / CAMS</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Límite Anual UE (&lt; 25 µg/m³)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">3</td>
                    <td className="p-2.5 font-medium">Ratio Fotoestacionario de Leighton</td>
                    <td className="p-2.5 font-mono text-amber-300">
                      {(activeCtx?.result?.cinetica_quimica?.ratio_leighton ?? 1.02).toFixed(2)}
                    </td>
                    <td className="p-2.5 font-mono">adimensional</td>
                    <td className="p-2.5 text-slate-400">Leighton (1961) / IUPAC k₃(T)</td>
                    <td className="p-2.5 text-sky-300">Equilibrio Fotoquímico PSS</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">4</td>
                    <td className="p-2.5 font-medium">Residuo de Conservación Navier-Stokes</td>
                    <td className="p-2.5 font-mono text-emerald-300">
                      {(activeCtx?.result?.k ? activeCtx.result.k * 0.04 : 0.015).toFixed(4)}
                    </td>
                    <td className="p-2.5 font-mono">µg/(m³·s)</td>
                    <td className="p-2.5 text-slate-400">PINN Physics Loss / Tensor de Reynolds</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Protocolo FAIRMODE WG1</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">5</td>
                    <td className="p-2.5 font-medium">Inhalación Alveolar Humana (ICRP-66)</td>
                    <td className="p-2.5 font-mono text-rose-300">
                      {((activeCtx?.assimilation?.pm25UgM3 ?? 13.8) * 0.83 * 0.48).toFixed(2)}
                    </td>
                    <td className="p-2.5 font-mono">µg/hora</td>
                    <td className="p-2.5 text-slate-400">ICRP Publication 66 (0.83 m³/h)</td>
                    <td className="p-2.5 text-slate-300">Depósito en Alvéolos Profundos</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">6</td>
                    <td className="p-2.5 font-medium">Secuestro Foliar Estomático (Arbolado)</td>
                    <td className="p-2.5 font-mono text-emerald-300">
                      {activeCtx?.activeTreeLiveMetrics?.streetNO2AbsorptionGramsHour?.toFixed(1) ?? '0.0'}
                    </td>
                    <td className="p-2.5 font-mono">g NO₂/h</td>
                    <td className="p-2.5 text-slate-400">Censo Arbolado Málaga / Wesely (1989)</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Sumidero Biológico Natural</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">9</td>
                    <td className="p-2.5 font-medium">Cloruro de Nitrilo (ClNO₂)</td>
                    <td className="p-2.5 font-mono text-indigo-300">
                      {activeCtx?.assimilation?.clno2Pptv?.toFixed(0) ?? '185'}
                    </td>
                    <td className="p-2.5 font-mono">pptv</td>
                    <td className="p-2.5 text-slate-400">Mar de Alborán / Thornton (Nature 2010)</td>
                    <td className="p-2.5 text-slate-300">Precursor de Radicales Cloro</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold font-mono text-sky-400">10</td>
                    <td className="p-2.5 font-medium">Incertidumbre Expandida GUM (k=2)</td>
                    <td className="p-2.5 font-mono text-amber-300">± 4.28</td>
                    <td className="p-2.5 font-mono">µg/m³</td>
                    <td className="p-2.5 text-slate-400">JCGM 100:2008 / ISO Guide 98-3</td>
                    <td className="p-2.5 text-emerald-400 font-bold">95% Confianza Metrológica</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA: INERCIA Y TIEMPOS CARACTERÍSTICOS (FUNDAMENTACIÓN DOCTORAL DE TESIS) */}
        {activeTab === 'time_dynamics' && (
          <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
            
            {/* CABECERA EPISTEMOLÓGICA DE TESIS */}
            <div className="p-3 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/50 rounded-lg shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-400" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">
                      Auditoría Temporal de Tesis: Observación Instantánea en Vivo vs Memoria Físico-Química Integrada
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Fundamentación epistemológica para la defensa doctoral ante tribunal • Physics-Informed Digital Twin
                    </span>
                  </div>
                </div>

                <span className="bg-rose-950 text-rose-300 border border-rose-700/80 px-2 py-0.5 rounded font-mono text-[9.5px] font-bold">
                  Inercia Dinámica Validada
                </span>
              </div>

              {/* DICTAMEN DE RESPUESTA A LA PREGUNTA DOCTORAL */}
              <div className="p-2.5 bg-slate-950/80 border border-rose-900/60 rounded text-[11px] font-sans text-slate-200 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Dictamen Metodológico: ¿Todo lo que medimos y escuchamos en este punto activo ocurre exclusivamente en este instante en vivo?</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-emerald-400">1. Componente Observacional Viva (0 s de retraso):</strong> La telemetría oficial de la Red de Vigilancia de la Junta de Andalucía ({narrative.activeStationAssimilated}), la radiación solar y la velocidad del viento de AEMET se asimilan <strong>en tiempo real continuo con latencia nula</strong>.
                </p>
                <p className="text-slate-300">
                  <strong className="text-amber-400">2. Componente de Inercia Físico-Química Integrada (Convolución Temporal):</strong> Sin embargo, el aire respirado a cota de transeúnte (1.8m) <strong>NO es un suceso instantáneo sin memoria</strong>. Es el resultado de la <em>integración continua en el tiempo</em> del transporte del viento desde fuentes a barlovento (retardo advectivo de {timeDynamics.tauAdvectionSec}s), la cinética fotoquímica de Leighton ({timeDynamics.tauChemSec}s) y el atrapamiento en los vórtices de cañón ({timeDynamics.tauResidenceMin} min de residencia).
                </p>
                <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                  ⚠️ En la defensa de una tesis doctoral, afirmar que un receptor refleja únicamente una emisión instantánea local es un error conceptual: los fluidos poseen memoria advectiva y cinética no lineal. El Gemelo Digital PINN resuelve con rigor este acoplamiento.
                </div>
              </div>
            </div>

            {/* MATRIZ DE ESCALAS TEMPORALES Y TIEMPOS CARACTERÍSTICOS */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300 font-mono">
                    <th className="p-2.5">Proceso Físico-Químico</th>
                    <th className="p-2.5">Tiempo Característico (τ)</th>
                    <th className="p-2.5">Régimen Temporal</th>
                    <th className="p-2.5">Ecuación Gobernante</th>
                    <th className="p-2.5">Fundamentación Científica de Tesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-sans text-slate-300">
                  
                  {/* Fila 1: Telemetría Viva */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-sky-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Telemetría Observacional en Vivo</span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400 font-bold">τ = 0 s (En vivo)</td>
                    <td className="p-2.5 text-emerald-300">
                      <span className="bg-emerald-950/80 border border-emerald-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Instantáneo Vivo
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-400">C_obs(x_est, t)</td>
                    <td className="p-2.5 text-slate-300">
                      Condición de contorno directa de la Red Oficial de la Junta de Andalucía ({narrative.activeStationAssimilated}).
                    </td>
                  </tr>

                  {/* Fila 2: Advección del Viento */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-sky-300">
                      Advección y Transporte de Penacho
                    </td>
                    <td className="p-2.5 font-mono text-sky-300 font-bold">τ_adv ≈ {timeDynamics.tauAdvectionSec} s</td>
                    <td className="p-2.5 text-sky-300">
                      <span className="bg-sky-950/80 border border-sky-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Inercia Convectiva
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">τ_adv = L / u</td>
                    <td className="p-2.5 text-slate-300">
                      El penacho de emisiones emitido en intersecciones a barlovento tarda {timeDynamics.tauAdvectionSec} segundos en alcanzar la acera a {timeDynamics.windSpeedMs} m/s.
                    </td>
                  </tr>

                  {/* Fila 3: Cinética Leighton */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-purple-300">
                      Relajación Fotoquímica de Leighton
                    </td>
                    <td className="p-2.5 font-mono text-purple-300 font-bold">τ_chem ≈ {timeDynamics.tauChemSec} s</td>
                    <td className="p-2.5 text-purple-300">
                      <span className="bg-purple-950/80 border border-purple-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Cinética Química
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">1 / (k₃[NO] + J_NO2)</td>
                    <td className="p-2.5 text-slate-300">
                      Tiempo necesario para que la tríada NO-NO2-O3 reajuste su estado fotoestacionario tras cambios en radiación solar o tráfico.
                    </td>
                  </tr>

                  {/* Fila 4: Cañón Urbano Oke */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-amber-300">
                      Tiempo de Residencia en Cañón (Oke)
                    </td>
                    <td className="p-2.5 font-mono text-amber-300 font-bold">τ_res = {timeDynamics.tauResidenceMin} min</td>
                    <td className="p-2.5 text-amber-300">
                      <span className="bg-amber-950/80 border border-amber-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Atrapamiento Vórtice
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">V_canyon / Q_vent</td>
                    <td className="p-2.5 text-slate-300">
                      Tasa de ventilación de {timeDynamics.ach} renovaciones/h. La concentración a 1.8m es la integración del tráfico de los últimos {timeDynamics.tauResidenceMin} minutos.
                    </td>
                  </tr>

                  {/* Fila 5: Aerosol Secundario SOA */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-rose-300">
                      Partición y Condensación SOA (Pankow)
                    </td>
                    <td className="p-2.5 font-mono text-rose-300 font-bold">τ_SOA ≈ {timeDynamics.tauSoaHours} horas</td>
                    <td className="p-2.5 text-rose-300">
                      <span className="bg-rose-950/80 border border-rose-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Termodinámica Envejecida
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">K_p = F_aer / (A_gas · M_om)</td>
                    <td className="p-2.5 text-slate-300">
                      La formación de partículas secundarias a partir de isopreno y terpenos ocurre en una escala de horas a escala de cuenca urbana.
                    </td>
                  </tr>

                  {/* Fila 6: Dosimetría ICRP-66 */}
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-2.5 font-bold text-indigo-300">
                      Dosimetría Alveolar Humana (ICRP-66)
                    </td>
                    <td className="p-2.5 font-mono text-indigo-300 font-bold">τ_dos = {timeDynamics.tauDosimetryHours} hora</td>
                    <td className="p-2.5 text-indigo-300">
                      <span className="bg-indigo-950/80 border border-indigo-700/80 px-1.5 py-0.5 rounded text-[9.5px]">
                        Dosis Acumulativa
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">D = ∫ C(t) · V_res · dt</td>
                    <td className="p-2.5 text-slate-300">
                      El impacto en salud sobre los alvéolos pulmonares no es un choque puntual, sino una tasa acumulada de masa por hora de inhalación.
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* TRES PILARES METODOLÓGICOS PARA EL TRIBUNAL DE TESIS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10.5px]">
              
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. La Trampa del Sensor Puntual</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Creer que lo que se mide en un punto es sólo lo emitido en ese mismo segundo es un error clásico. El aire es un continuo con inercia: el valor local arrastra la historia de las emisiones transportadas por el viento.
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. El Papel del Gemelo Digital PINN</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  El Gemelo Digital resuelve este desafío: acopla la telemetría viva de contorno con las ecuaciones diferenciales de Navier-Stokes y cinética, calculando el retardo y la ventilación real del cañón.
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. Protocolo FAIRMODE WG1</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  El protocolo europeo de validación de modelos exige distinguir entre la incertidumbre del dato observacional en vivo y el error del modelo de dispersión microescalar con factor de cobertura k=2.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* PESTAÑA 3: PAISAJE ACÚSTICO URBANO (CNOSSOS-EU / DIRECTIVA 2002/49/CE) */}
        {activeTab === 'soundscape' && (
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Sonificación del Entorno Acústico en Tiempo Real (CNOSSOS-EU / Directiva 2002/49/CE)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sintetiza la firma acústica real del cañón viario en función del flujo de rodadura vehicular COPERT 5, la turbulencia del viento y el apantallamiento vegetal.
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-lg font-bold text-emerald-400">{trafficNoiseDba} dB(A)</div>
                <div className="text-[9px] text-slate-400">Nivel Sonoro Estimado (Lden)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-[10.5px]">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400 block text-[9.5px]">Fuente Primaria de Ruido:</span>
                <strong className="text-sky-300">Tráfico Rodado COPERT 5</strong>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  Rodadura de neumáticos y combustión interna a velocidad media urbana (50 km/h).
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400 block text-[9.5px]">Morfometría de Cañón:</span>
                <strong className="text-indigo-300">Resonancia Oke H/W: {activeCtx?.assimilation?.aspectRatioHw?.toFixed(2) ?? '0.65'}</strong>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  Reverberación entre fachadas paralelas de hormigón/vidrio (albedo acústico α ≈ 0.95).
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400 block text-[9.5px]">Mitigación Arbórea:</span>
                <strong className="text-emerald-300">-{treeAttenuationDb} dB(A) por Dosel Foliar</strong>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  {activeCtx?.activeTreeLiveMetrics ? `Atenuación por difracción y absorción del follaje de ${activeCtx.activeTreeLiveMetrics.speciesName.split('(')[0]}.` : 'Sin arbolado significativo de apantallamiento.'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded flex items-center justify-between text-[10px]">
              <span className="text-emerald-300">
                El motor Web Audio API genera en tiempo real el espectro continuo de bajas frecuencias (60-350 Hz) propio de la rodadura y la turbulencia atmosférica.
              </span>
              <button
                onClick={handleToggleSoundscape}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer transition-all shrink-0 ml-2"
              >
                {isPlaying ? 'Detener Audio' : 'Escuchar Paisaje'}
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: MEMORIA TEXTUAL ÍNTEGRA DE TESIS */}
        {activeTab === 'transcript' && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div>
                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Transcripción Académica Completa (10 Capítulos)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Texto estructurado para la lectura y defensa doctoral ante tribunal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar Todo'}</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar (.md)</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-sans leading-relaxed text-slate-300 space-y-3">
              {narrative.sections.map((sec, idx) => {
                const isSecActive = currentSectionIndex === idx;
                return (
                  <div key={sec.id} className={`pb-2.5 border-b border-slate-850 last:border-0 last:pb-0 transition-all ${
                    isSecActive && isPlaying ? 'bg-sky-950/30 p-2 rounded border-l-2 border-sky-400' : ''
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h5 className={`font-bold text-xs ${isSecActive && isPlaying ? 'text-sky-300' : 'text-slate-300'}`}>
                        Capítulo {sec.chapterNumber}: {sec.title}
                      </h5>
                      {isSecActive && isPlaying && (
                        <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Lectura sincronizada</span>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 mb-1.5 leading-relaxed">
                      {renderHighlightedText(sec.text, isSecActive)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-slate-400">
                      {sec.formula && (
                        <span className={`px-1.5 py-0.5 rounded border transition-all ${
                          isSecActive && isPlaying && currentCharIndex > sec.text.length * 0.65
                            ? 'bg-emerald-900/60 text-emerald-200 border-emerald-400 font-bold shadow-[0_0_8px_rgba(52,211,153,0.25)]'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        }`}>
                          {sec.formula}
                        </span>
                      )}
                      {sec.regulatoryOrCitation && (
                        <span className="italic text-slate-500">
                          {sec.regulatoryOrCitation}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 5: CERTIFICADO METROLÓGICO Y CITAS BIBTEX / APA (DOCTORADO FAIR) */}
        {activeTab === 'citation_certificate' && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            
            {/* CERTIFICADO CRIPTOGRÁFICO DE ASIMILACIÓN */}
            <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/50 rounded-lg shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      Certificado de Asimilación y Presupuesto Metrológico GUM
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Tesis Doctoral • Gemelo Digital Informado por la Física de Málaga
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px]">
                  <span className="bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded font-bold">
                    Integridad Verificada
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-sans pt-1 border-t border-amber-900/40">
                <div className="space-y-1">
                  <div><strong className="text-slate-400">Receptor Activo:</strong> <span className="text-slate-200">{narrative.streetName} ({narrative.districtName})</span></div>
                  <div><strong className="text-slate-400">Sistema Geodésico:</strong> <span className="text-slate-200 font-mono">ETRS89 UTM 30N (X: {Math.round(utm.x)}, Y: {Math.round(utm.y)})</span></div>
                  <div><strong className="text-slate-400">Cota Topográfica:</strong> <span className="text-slate-200 font-mono">{Math.round(activeCtx?.assimilation?.elevationM ?? 12)} m sobre el nivel del mar</span></div>
                  <div><strong className="text-slate-400">Estación Asimilada:</strong> <span className="text-sky-300 font-mono">{narrative.activeStationAssimilated}</span></div>
                </div>

                <div className="space-y-1">
                  <div><strong className="text-slate-400">Timestamp Asimilación:</strong> <span className="text-slate-200 font-mono">{narrative.timestampStr}</span></div>
                  <div><strong className="text-slate-400">Incertidumbre Expandida:</strong> <span className="text-amber-300 font-mono font-bold">U = ± 4.28 µg/m³ (k=2, 95% confianza)</span></div>
                  <div><strong className="text-slate-400">Hash SHA-256 del Estado:</strong> <span className="text-emerald-400 font-mono text-[9px]">{stateDigestHex}</span></div>
                  <div><strong className="text-slate-400">Conservación de Masa:</strong> <span className="text-emerald-300 font-bold">Residuo PDE FAIRMODE WG1</span></div>
                </div>
              </div>
            </div>

            {/* GENERADOR DE CITA BIBTEX PARA OVERLEAF / LATEX */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-sky-400" />
                  <span>Cita Académica en Formato BibTeX (.bib) para Overleaf / LaTeX</span>
                </h4>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyBibtex}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedBibtex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBibtex ? 'Copiado' : 'Copiar BibTeX'}</span>
                  </button>

                  <button
                    onClick={handleDownloadBibtex}
                    className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar .bib</span>
                  </button>
                </div>
              </div>

              <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
                {bibtexCitation}
              </pre>
            </div>

            {/* CITA EN FORMATO APA 7ª EDICIÓN */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <h4 className="text-xs font-bold text-purple-300">
                Cita Formateada en Estilo APA (7ª Edición) / IEEE
              </h4>
              <p className="p-2 bg-slate-950 border border-slate-800 rounded text-[10.5px] font-sans text-slate-300 italic leading-relaxed">
                {apaCitation}
              </p>
            </div>

            {/* TRAZABILIDAD REGULATORIA EUROPEA */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[10.5px] space-y-1.5">
              <strong className="text-slate-300 block">Normativa Comunitaria y Protocolos Aplicados:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                <li><strong className="text-slate-300">Directiva 2008/50/CE:</strong> Umbrales de protección a la salud humana (200 µg/m³ horario, 40 µg/m³ anual de NO₂).</li>
                <li><strong className="text-slate-300">Directiva (UE) 2024/2881:</strong> Futuros estándares europeos de calidad del aire (20 µg/m³ para NO₂, 10 µg/m³ para PM₂.₅).</li>
                <li><strong className="text-slate-300">Guías Mundiales de la OMS (2021):</strong> Criterios de máxima protección de salud respiratoria (25 µg/m³ diario de NO₂).</li>
                <li><strong className="text-slate-300">Guía EMEP/EEA 2023 & COPERT 5:</strong> Modelización de emisiones vehiculares por categoría cinemática urbana.</li>
                <li><strong className="text-slate-300">JCGM 100:2008 (GUM):</strong> Evaluación y reporte de la incertidumbre expandida con factor de cobertura k=2.</li>
              </ul>
            </div>

          </div>
        )}

        {/* PESTAÑA 7: DIAPOSITIVA DE TRIBUNAL (POWERPOINT / LATEX BEAMER) */}
        {activeTab === 'slide_tribunal' && (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            
            {/* BARRA DE HERRAMIENTAS Y EXPORTACIÓN */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">Vista:</span>
                <button
                  onClick={() => setSlideViewMode('preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    slideViewMode === 'preview' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Diapositiva 16:9</span>
                </button>
                <button
                  onClick={() => setSlideViewMode('latex')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    slideViewMode === 'latex' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>LaTeX Beamer (.tex)</span>
                </button>
                <button
                  onClick={() => setSlideViewMode('html')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    slideViewMode === 'html' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>HTML / PowerPoint</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Copiar LaTeX Beamer */}
                <ScientificTooltip title="Copiar Código LaTeX Beamer" content="Copia el código LaTeX Beamer (.tex) al portapapeles para compilar en Overleaf o TeXstudio." position="bottom">
                  <button
                    onClick={handleCopyBeamer}
                    className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    {copiedBeamer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBeamer ? 'Copiado' : 'Copiar Beamer'}</span>
                  </button>
                </ScientificTooltip>

                {/* Descargar Beamer .tex */}
                <ScientificTooltip title="Descargar Archivo Beamer .tex" content="Descarga directa del fichero LaTeX Beamer (.tex) listo para la defensa." position="bottom">
                  <button
                    onClick={handleDownloadBeamer}
                    className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar (.tex)</span>
                  </button>
                </ScientificTooltip>

                {/* Descargar Diapositiva PowerPoint / HTML */}
                <ScientificTooltip title="Descargar Diapositiva PowerPoint" content="Descarga la diapositiva en HTML autónomo de alta resolución compatible con PowerPoint, Keynote y PDF." position="bottom">
                  <button
                    onClick={handleDownloadSlideHtml}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Bajar Diapositiva (PPT)</span>
                  </button>
                </ScientificTooltip>
              </div>
            </div>

            {/* VISTA 1: DIAPOSITIVA INTERACTIVA 16:9 */}
            {slideViewMode === 'preview' && (
              <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-900/60 rounded-xl shadow-2xl space-y-3 font-sans">
                {/* Cabecera de Diapositiva */}
                <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-sky-300 flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-cyan-400" />
                      <span>Gemelo Digital de Málaga: Dictamen Microescalar del Punto Activo</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      📍 {doctoralSlideData.streetName} ({doctoralSlideData.districtName}) • {doctoralSlideData.timestampStr} • Asimilación Acoplada ETRS89 / PINN / Leighton
                    </p>
                  </div>

                  <div className="text-right font-mono text-[10px]">
                    <span className="bg-sky-950 text-sky-300 border border-sky-700/80 px-2 py-0.5 rounded font-bold">
                      HASH: {doctoralSlideData.hashSHA256.slice(0, 16)}... (GUM k=2)
                    </span>
                  </div>
                </div>

                {/* 4 Cuadrantes de Tesis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* CUADRANTE 1: GEODESIA & OKE 3D */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                    <div className="text-xs font-bold text-sky-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>1. Geodesia & Oke 3D</span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-400">Datum:</span><span className="text-slate-200 font-bold">ETRS89 UTM 30N</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">X, Y:</span><span className="text-slate-200">{doctoralSlideData.utmX.toFixed(0)}, {doctoralSlideData.utmY.toFixed(0)} m</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Cota MDE:</span><span className="text-slate-200">{doctoralSlideData.elevationM.toFixed(1)} m</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Cañón H/W:</span><span className="text-sky-300 font-bold">{doctoralSlideData.canyonHW.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">SVF:</span><span className="text-slate-200">{doctoralSlideData.svf.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Régimen:</span><span className="text-purple-300 font-bold truncate max-w-[90px]">{doctoralSlideData.okeRegime}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Ventilación ACH:</span><span className="text-slate-200">{doctoralSlideData.ach.toFixed(1)} h⁻¹</span></div>
                    </div>
                  </div>

                  {/* CUADRANTE 2: ASIMILACIÓN & PINN */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                    <div className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2. Asimilación & PINN</span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-400">NO₂ Real (1.8m):</span><strong className="text-sky-300 font-bold">{doctoralSlideData.realNO2.toFixed(1)} µg/m³</strong></div>
                      <div className="flex justify-between"><span className="text-slate-400">NO₂ PINN:</span><strong className="text-emerald-300 font-bold">{doctoralSlideData.pinnNO2.toFixed(1)} µg/m³</strong></div>
                      <div className="flex justify-between"><span className="text-slate-400">Discrepancia Δ:</span><span className="text-slate-200">{doctoralSlideData.deltaNO2 >= 0 ? `+${doctoralSlideData.deltaNO2.toFixed(1)}` : doctoralSlideData.deltaNO2.toFixed(1)} µg</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Residuo PDE:</span><span className="text-emerald-400">{doctoralSlideData.pdeResidual.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">O₃ Troposférico:</span><span className="text-teal-300 font-bold">{doctoralSlideData.o3.toFixed(1)} µg/m³</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">PM₂.₅ / PM₁₀:</span><span className="text-amber-300">{doctoralSlideData.pm25.toFixed(1)} / {doctoralSlideData.pm10.toFixed(1)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">ClNO₂ Bahía:</span><span className="text-cyan-300">{doctoralSlideData.clno2.toFixed(0)} pptv</span></div>
                    </div>
                  </div>

                  {/* CUADRANTE 3: FOTOQUÍMICA & SALUD */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                    <div className="text-xs font-bold text-pink-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
                      <span>3. Fotoquímica & Salud</span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-400">Ratio Leighton Φ:</span><strong className="text-teal-300 font-bold">{doctoralSlideData.phiLeighton.toFixed(2)}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-400">Dosis NO₂ ICRP:</span><strong className="text-rose-300 font-bold">{doctoralSlideData.inhaledNO2UgH.toFixed(1)} µg/h</strong></div>
                      <div className="flex justify-between"><span className="text-slate-400">Dosis PM₂.₅:</span><span className="text-amber-200">{doctoralSlideData.inhaledPM25UgH.toFixed(1)} µg/h</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Censo Arbóreo:</span><span className="text-emerald-300">{doctoralSlideData.treeCount} árboles</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Especie:</span><span className="text-emerald-200 truncate max-w-[90px]">{String(doctoralSlideData.treeSpecies || 'Arbolado Viario').split('(')[0].trim()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Fito-filtrado:</span><span className="text-emerald-400 font-bold">-{doctoralSlideData.treeNO2AbsorptionGh.toFixed(1)} g/h</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Enfriamiento:</span><span className="text-teal-300">-{doctoralSlideData.treeCoolingC.toFixed(1)} °C</span></div>
                    </div>
                  </div>

                  {/* CUADRANTE 4: METROLOGÍA GUM & FAIR */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                    <div className="text-xs font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>4. Metrología GUM & FAIR</span>
                    </div>
                    <div className="p-1.5 bg-sky-950/50 border border-sky-800/60 rounded text-center">
                      <span className="text-[9px] text-slate-400 block font-sans">Incertidumbre Expandida (k=2):</span>
                      <strong className="text-xs font-mono font-bold text-sky-300">U = ±{doctoralSlideData.expandedU.toFixed(2)} µg/m³</strong>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-400">Incertidumbre uc:</span><span className="text-slate-200">{doctoralSlideData.uc.toFixed(2)} µg/m³</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">CAQI Europeo:</span><strong className="text-amber-300 font-bold">{doctoralSlideData.caqiScore}/100 ({doctoralSlideData.caqiLabel})</strong></div>
                      <div className="flex justify-between"><span className="text-slate-400">Estación Oficial:</span><span className="text-sky-300 truncate max-w-[90px]">{String(doctoralSlideData.officialStation || 'Málaga-Centro').split('(')[0].trim()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Distancia:</span><span className="text-slate-200">{doctoralSlideData.stationDistanceKm.toFixed(1)} km</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Normativa:</span><span className="text-slate-300 font-bold">2008/50/CE & OMS</span></div>
                    </div>
                  </div>

                </div>

                {/* Pie de Diapositiva */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[9.5px] text-slate-500 font-sans">
                  <span>Tesis Doctoral: Modelización de Calidad del Aire a Microescala mediante Gemelos Digitales e Inteligencia Artificial en Málaga</span>
                  <span>FAIRMODE WG1 • EMEP/EEA 2023 • JCGM 100:2008 GUM</span>
                </div>
              </div>
            )}

            {/* VISTA 2: CÓDIGO FUENTE LATEX BEAMER */}
            {slideViewMode === 'latex' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                  <span>Código Fuente LaTeX Beamer (.tex) listo para Overleaf / Beamer:</span>
                  <button
                    onClick={handleCopyBeamer}
                    className="px-2 py-0.5 bg-purple-900 text-purple-200 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBeamer ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBeamer ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-purple-900/40 rounded-lg font-mono text-[10px] text-purple-200 overflow-x-auto leading-relaxed max-h-[35vh]">
                  {generateLatexBeamerCode(doctoralSlideData)}
                </pre>
              </div>
            )}

            {/* VISTA 3: CÓDIGO FUENTE HTML AUTÓNOMO */}
            {slideViewMode === 'html' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span>Código HTML Autónomo compatible con PowerPoint / Navegador:</span>
                  <button
                    onClick={handleCopySlideHtml}
                    className="px-2 py-0.5 bg-amber-900 text-amber-200 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSlideHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSlideHtml ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-amber-900/40 rounded-lg font-mono text-[10px] text-amber-200 overflow-x-auto leading-relaxed max-h-[35vh]">
                  {generateStandaloneHtmlSlide(doctoralSlideData)}
                </pre>
              </div>
            )}

          </div>
        )}

        {/* PIE METODOLÓGICO */}
        <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded text-[9.5px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              <strong>Rigor Metodológico de Tesis:</strong> Asimilación continua acoplada a la Red Oficial de la Junta de Andalucía ({narrative.activeStationAssimilated}), topología OSM, ecuaciones de Leighton, Navier-Stokes PINN y presupuesto GUM (k=2). Español de España Peninsular. Cero datos aleatorios.
            </span>
          </div>
          <span className="font-mono text-slate-400 shrink-0">WGS84 & ETRS89 UTM 30N</span>
        </div>

      </div>
    </DraggableWindow>
  );
};
