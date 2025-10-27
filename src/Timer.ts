import { AudioEngine } from './audio/AudioEngine';

export class Timer {
  private intervalId: number | null = null;
  private audioEngine: AudioEngine;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  beat(startBeat: number, callback: () => void): void {
    let beat = startBeat;

    const scheduleNext = () => {
      const interval = 60000 / (this.audioEngine.bpm * 4); // 16th notes
      this.intervalId = window.setTimeout(() => {
        callback();
        beat += 1;
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
