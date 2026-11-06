import { ExecutionStep } from '../types/visualizer';

export type OscillatorWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type FilterMode = 'lowpass' | 'bandpass' | 'highpass';

export interface DspAudioConfig {
  enabled: boolean;
  masterGainDb: number; // -24dB to +6dB
  waveform: OscillatorWaveform;
  filterMode: FilterMode;
  cutoffHz: number; // 200Hz to 8000Hz
  resonanceQ: number; // 0.5 to 12.0
  spatialPanEnabled: boolean;
  compressorEnabled: boolean;
  attackMs: number;
  decayMs: number;
  sustainLevel: number;
  releaseMs: number;
  voiceWarmthDb: number; // Low-shelf 120Hz
  voicePresenceDb: number; // Peaking 2.4kHz
}

export interface StepSoundProfile {
  baseFrequencyHz: number;
  harmonicFrequencyHz: number;
  stereoPan: number; // -1.0 (left) to +1.0 (right)
  filterCutoffHz: number;
  filterQ: number;
  linearGain: number;
  waveform: OscillatorWaveform;
  operationAcousticTag: string;
}

export const DEFAULT_DSP_CONFIG: DspAudioConfig = {
  enabled: false,
  masterGainDb: -6,
  waveform: 'triangle',
  filterMode: 'lowpass',
  cutoffHz: 2400,
  resonanceQ: 2.2,
  spatialPanEnabled: true,
  compressorEnabled: true,
  attackMs: 12,
  decayMs: 95,
  sustainLevel: 0.35,
  releaseMs: 140,
  voiceWarmthDb: 2.5,
  voicePresenceDb: 3.5,
};

/**
 * Pure Sound Engineering & DSP calculation mapping an ExecutionStep's memory state,
 * pointer addresses, and operation type to acoustic synthesis parameters:
 * - Pitch (Hz): Pentatonic / harmonic mapping from active heap cell value & step index
 * - Spatial Panning (-1..+1): Mapped from active pointer target index across the heap block
 * - Dynamic Filter Cutoff (Hz): Modulated by operation type (ALLOCATE_HEAP, SHIFT_POINTER, etc.)
 * - dBFS to Linear Gain conversion: 10^(dB / 20)
 */
export function computeStepSoundProfile(
  step: ExecutionStep,
  config: DspAudioConfig = DEFAULT_DSP_CONFIG
): StepSoundProfile {
  const cells = step.heapObjects[0]?.cells || [];
  const totalCells = Math.max(1, cells.length);

  const primaryPtr = step.pointers[0];
  const targetIdxNum =
    primaryPtr && primaryPtr.targetIndex !== null && !isNaN(Number(primaryPtr.targetIndex))
      ? Number(primaryPtr.targetIndex)
      : step.stepIndex % totalCells;

  // Spatial stereo field (-0.85 Left to +0.85 Right) mapped to memory offset index
  const normalizedPos = totalCells > 1 ? targetIdxNum / (totalCells - 1) : 0.5;
  const stereoPan = config.spatialPanEnabled
    ? Number(((normalizedPos * 2 - 1) * 0.85).toFixed(2))
    : 0;

  // Extract numeric value from active cell to modulate fundamental pitch
  const activeCell =
    cells.find((c) => c.status === 'mutated' || c.status === 'active' || c.status === 'target') ||
    cells[Math.min(targetIdxNum, cells.length - 1)];
  const rawVal = activeCell ? Number(String(activeCell.value).replace(/[^0-9.-]/g, '')) : 0;
  const cleanVal = isNaN(rawVal) ? step.stepIndex + 1 : Math.abs(rawVal);

  // Harmonic scale frequencies (A3 minor pentatonic / Dorian studio intervals)
  const scaleSemitones = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
  const degree = (Math.round(cleanVal) + step.stepIndex) % scaleSemitones.length;
  const semitoneOffset = scaleSemitones[degree];

  // f = f0 * 2^(n/12), f0 = 220Hz (A3)
  const baseFrequencyHz = Number((220 * Math.pow(2, semitoneOffset / 12)).toFixed(2));

  // Perfect fifth (3:2 ratio) or octave (2:1) harmonic overtone depending on operation type
  let harmonicRatio = 1.5;
  let cutoffMultiplier = 1.0;
  let operationAcousticTag = 'Pointer Shift Harmonic (3:2 Fifth)';

  switch (step.operationType) {
    case 'ALLOCATE_HEAP':
      harmonicRatio = 2.0; // Octave bloom
      cutoffMultiplier = 1.35;
      operationAcousticTag = 'Heap Allocation Octave (2:1 Overtone)';
      break;
    case 'MUTATE_MEMORY':
      harmonicRatio = 1.25; // Major third warmth
      cutoffMultiplier = 1.15;
      operationAcousticTag = 'In-Place Mutation (5:4 Third)';
      break;
    case 'COMPARE_VALUES':
      harmonicRatio = 1.333; // Perfect fourth probe
      cutoffMultiplier = 0.85;
      operationAcousticTag = 'Register Comparison Probe (4:3 Fourth)';
      break;
    case 'RETURN_RESULT':
      harmonicRatio = 2.0;
      cutoffMultiplier = 1.6;
      operationAcousticTag = 'Return Resolution Cadence (2:1 Octave)';
      break;
    default:
      harmonicRatio = 1.5;
      cutoffMultiplier = 1.0;
  }

  const harmonicFrequencyHz = Number((baseFrequencyHz * harmonicRatio).toFixed(2));
  const filterCutoffHz = Math.min(
    10000,
    Math.max(180, Math.round(config.cutoffHz * cutoffMultiplier))
  );

  // Convert masterGainDb to linear amplitude: A = 10^(dB/20), scaled safely for headroom
  const linearGain = Number((Math.pow(10, config.masterGainDb / 20) * 0.28).toFixed(4));

  return {
    baseFrequencyHz,
    harmonicFrequencyHz,
    stereoPan,
    filterCutoffHz,
    filterQ: config.resonanceQ,
    linearGain,
    waveform: config.waveform,
    operationAcousticTag,
  };
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Synthesizes a real-time Web Audio API acoustic transient for an execution step
 * using Dual Oscillators -> BiquadFilterNode (Resonant Filter) -> ADSR Gain Envelope
 * -> StereoPannerNode (Heap Address Panning) -> DynamicsCompressorNode (Master Bus Limiter).
 */
export function triggerStepSonification(
  step: ExecutionStep,
  config: DspAudioConfig
): StepSoundProfile | null {
  const profile = computeStepSoundProfile(step, config);
  if (!config.enabled) return profile;

  const ctx = getAudioContext();
  if (!ctx) return profile;

  const now = ctx.currentTime;
  const attackSec = Math.max(0.004, config.attackMs / 1000);
  const decaySec = Math.max(0.02, config.decayMs / 1000);
  const releaseSec = Math.max(0.03, config.releaseMs / 1000);
  const totalDuration = attackSec + decaySec + releaseSec;

  // 1. Primary Fundamental Oscillator + Secondary Harmonic Sub/Overtone Oscillator
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = profile.waveform;
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(profile.baseFrequencyHz, now);
  osc2.frequency.setValueAtTime(profile.harmonicFrequencyHz, now);

  // 2. Biquad Resonant Filter with subtle filter-envelope sweep
  const biquad = ctx.createBiquadFilter();
  biquad.type = config.filterMode;
  biquad.frequency.setValueAtTime(profile.filterCutoffHz * 1.4, now);
  biquad.frequency.exponentialRampToValueAtTime(
    Math.max(120, profile.filterCutoffHz),
    now + attackSec + decaySec
  );
  biquad.Q.setValueAtTime(profile.filterQ, now);

  // 3. ADSR Amplitude Envelope Generator
  const envGain = ctx.createGain();
  const peakGain = Math.max(0.001, profile.linearGain);
  const sustainGain = Math.max(0.0005, peakGain * config.sustainLevel);

  envGain.gain.setValueAtTime(0.0001, now);
  envGain.gain.linearRampToValueAtTime(peakGain, now + attackSec);
  envGain.gain.exponentialRampToValueAtTime(sustainGain, now + attackSec + decaySec);
  envGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

  //Sub-mix gain for harmonic overtone (-6dB relative to fundamental)
  const harmonicMix = ctx.createGain();
  harmonicMix.gain.setValueAtTime(0.45, now);

  // 4. Spatial Stereo Panner mapped to Heap Memory Offset
  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(profile.stereoPan, now);

  // 5. Master Bus Dynamics Compressor
  osc1.connect(biquad);
  osc2.connect(harmonicMix);
  harmonicMix.connect(biquad);
  biquad.connect(envGain);
  envGain.connect(panner);

  if (config.compressorEnabled) {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(12, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.15, now);
    panner.connect(compressor);
    compressor.connect(ctx.destination);
  } else {
    panner.connect(ctx.destination);
  }

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + totalDuration + 0.02);
  osc2.stop(now + totalDuration + 0.02);

  return profile;
}
