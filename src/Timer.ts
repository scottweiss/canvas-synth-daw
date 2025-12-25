import { AudioEngine } from './audio/AudioEngine';

export class Timer {
  private intervalId: number | null = null;
  private audioEngine: AudioEngine;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  beat(callback: () => void): void {
    const scheduleNext = (): void => {
      const interval = 60000 / (this.audioEngine.bpm * 4); // 16th notes
      this.intervalId = window.setTimeout(() => {
        callback();
        scheduleNext();
      }, interval);
    };

    this.stop();
    scheduleNext();
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
}
