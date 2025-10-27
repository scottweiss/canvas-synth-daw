import { AudioEngine } from './AudioEngine';

export type TickListener = (tick: number, time: number) => void;
export type StateListener = (isRunning: boolean) => void;
export type BpmListener = (bpm: number) => void;
export type PlaybackMode = 'session' | 'arrangement';
export type ModeListener = (mode: PlaybackMode) => void;

const TICKS_PER_MEASURE = 16;

export class Transport {
  private static instance: Transport;

  private readonly audioEngine: AudioEngine;
  private tickListeners: Set<TickListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private bpmListeners: Set<BpmListener> = new Set();
  private modeListeners: Set<ModeListener> = new Set();
  private timeoutId: number | null = null;
  private currentTick: number = 0;
  private isRunning: boolean = false;
  private bpmValue: number;
  private playbackMode: PlaybackMode = 'arrangement';

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.bpmValue = this.audioEngine.bpm;
  }

  static getInstance(): Transport {
    if (!Transport.instance) {
      Transport.instance = new Transport();
    }
    return Transport.instance;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.currentTick = 0;
    this.emitState();
    this.emitTick();
    this.scheduleNextTick();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRunning = false;
    this.emitState();
  }

  toggle(): void {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  isPlaying(): boolean {
    return this.isRunning;
  }

  getBpm(): number {
    return this.bpmValue;
  }

  setBpm(bpm: number): void {
    if (this.bpmValue === bpm) {
      return;
    }
    this.bpmValue = bpm;
    this.audioEngine.bpm = bpm;
    this.emitBpm();
    if (this.isRunning && this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.scheduleNextTick();
    }
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  setPosition(tick: number): void {
    if (this.playbackMode === 'session') {
      this.currentTick = Math.max(0, tick) % TICKS_PER_MEASURE;
    } else {
      this.currentTick = Math.max(0, tick);
    }
  }

  getMode(): PlaybackMode {
    return this.playbackMode;
  }

  setMode(mode: PlaybackMode): void {
    if (this.playbackMode === mode) {
      return;
    }
    this.playbackMode = mode;
    this.emitMode();
  }

  // Beat conversion methods (4 ticks per beat in 4/4 time)
  tickToBeat(tick: number): number {
    return tick / 4;
  }

  beatToTick(beat: number): number {
    return beat * 4;
  }

  getCurrentBeat(): number {
    return this.tickToBeat(this.currentTick);
  }

  onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onBpmChange(listener: BpmListener): () => void {
    this.bpmListeners.add(listener);
    return () => this.bpmListeners.delete(listener);
  }

  onModeChange(listener: ModeListener): () => void {
    this.modeListeners.add(listener);
    return () => this.modeListeners.delete(listener);
  }

  private scheduleNextTick(): void {
    const intervalMs = 60000 / (this.bpmValue * 4);
    this.timeoutId = window.setTimeout(() => {
      this.advanceTick();
      this.emitTick();
      if (this.isRunning) {
        this.scheduleNextTick();
      }
    }, intervalMs);
  }

  private advanceTick(): void {
    if (this.playbackMode === 'session') {
      this.currentTick = (this.currentTick + 1) % TICKS_PER_MEASURE;
    } else {
      // Arrangement mode - continuous playback
      this.currentTick = this.currentTick + 1;
    }
  }

  private emitTick(): void {
    const time = this.audioEngine.audioContext.currentTime;
    this.tickListeners.forEach((listener) => listener(this.currentTick, time));
  }

  private emitState(): void {
    this.stateListeners.forEach((listener) => listener(this.isRunning));
  }

  private emitBpm(): void {
    this.bpmListeners.forEach((listener) => listener(this.bpmValue));
  }

  private emitMode(): void {
    this.modeListeners.forEach((listener) => listener(this.playbackMode));
  }
}
