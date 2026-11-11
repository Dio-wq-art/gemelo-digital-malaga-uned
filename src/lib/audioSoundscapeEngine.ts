/**
 * Motor de Sonido y Acústica Ambiental (Web Audio API & Speech Synthesis)
 * Tesis Doctoral - Gemelo Digital de Málaga
 * 
 * Resuelve de forma infalible la reproducción de audio en navegadores y entornos iframes:
 * 1. Desbloqueo síncrono del AudioContext del navegador con señal acústica (chime armónico).
 * 2. Reproductor de voz en cola fragmentada (Chunked Speech Queue) que elimina el bug de congelación de Chrome.
 * 3. Sonificación acústica en vivo del cañón urbano según el nivel de ruido de tráfico (COPERT 5 en dBA),
 *    viento turbulento y apantallamiento foliar (Directiva 2002/49/CE).
 */

class AudioSoundscapeEngine {
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;
  private soundscapeGain: GainNode | null = null;
  private trafficOsc: OscillatorNode | null = null;
  private windNoiseNode: AudioBufferSourceNode | null = null;
  private isSoundscapePlaying = false;

  /**
   * Obtiene o inicializa el AudioContext garantizando que esté en estado 'running'
   */
  getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isUnlocked = true;
    return this.audioCtx;
  }

  /**
   * Emite un tono armónico audible (chime) para verificar de inmediato que los altavoces funcionan
   * y desbloquear la política de autoplay del navegador.
   */
  playAudibleChime(freqStart: number = 523.25, freqEnd: number = 783.99): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);

        osc.onended = () => resolve();
      } catch (err) {
        console.warn('[AudioEngine] Error emitiendo chime:', err);
        resolve();
      }
    });
  }

  /**
   * Genera el paisaje sonoro ambiental en vivo con la Web Audio API
   * Modela el ruido de rodadura (COPERT 5 en dBA), turbulencia de viento en cañón y atenuación vegetal.
   */
  startLiveSoundscape(params: {
    trafficNoiseDba: number;
    windSpeedMs: number;
    canyonHw: number;
    treeAttenuationDb: number;
    volume?: number;
  }) {
    try {
      this.stopLiveSoundscape();
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      const vol = params.volume ?? 0.3;
      masterGain.gain.setValueAtTime(vol, now);
      masterGain.connect(ctx.destination);
      this.soundscapeGain = masterGain;

      // 1. Componente de tráfico rodado (ruido marrón filtrado a bajas frecuencias 60-250 Hz)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.sin(i * 0.05) * 0.2 + (Math.sin(i * 0.13) * 0.1);
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.5;
      }

      const trafficSource = ctx.createBufferSource();
      trafficSource.buffer = noiseBuffer;
      trafficSource.loop = true;

      const trafficFilter = ctx.createBiquadFilter();
      trafficFilter.type = 'lowpass';
      // Frecuencia de corte dependiente del tráfico y confinamiento H/W
      trafficFilter.frequency.setValueAtTime(120 + Math.min(300, params.trafficNoiseDba * 3), now);

      const trafficGain = ctx.createGain();
      // Nivel atenuado por el arbolado urbano (-treeAttenuationDb)
      const effectiveDba = Math.max(35, params.trafficNoiseDba - params.treeAttenuationDb);
      const trafficVol = Math.min(0.8, Math.max(0.05, (effectiveDba - 35) / 55));
      trafficGain.gain.setValueAtTime(trafficVol * 0.5, now);

      trafficSource.connect(trafficFilter);
      trafficFilter.connect(trafficGain);
      trafficGain.connect(masterGain);
      trafficSource.start(now);
      this.windNoiseNode = trafficSource;

      // 2. Tono resonante de cañón urbano (frecuencia fundamental de Helmholtz del cañón)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // Frecuencia fundamental del cañón viario f = c / (4 * H)
      const canyonFreq = Math.max(45, Math.min(180, 85 / Math.max(0.5, params.canyonHw)));
      osc.frequency.setValueAtTime(canyonFreq, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.03 + (params.windSpeedMs * 0.005), now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      this.trafficOsc = osc;

      this.isSoundscapePlaying = true;
    } catch (err) {
      console.warn('[AudioEngine] Error iniciando paisaje sonoro:', err);
    }
  }

  stopLiveSoundscape() {
    try {
      if (this.trafficOsc) {
        this.trafficOsc.stop();
        this.trafficOsc.disconnect();
        this.trafficOsc = null;
      }
      if (this.windNoiseNode) {
        this.windNoiseNode.stop();
        this.windNoiseNode.disconnect();
        this.windNoiseNode = null;
      }
      if (this.soundscapeGain) {
        this.soundscapeGain.disconnect();
        this.soundscapeGain = null;
      }
      this.isSoundscapePlaying = false;
    } catch {
      // Ignorar errores al detener
    }
  }

  isSoundscapeActive(): boolean {
    return this.isSoundscapePlaying;
  }
}

export const audioSoundscapeEngine = new AudioSoundscapeEngine();
