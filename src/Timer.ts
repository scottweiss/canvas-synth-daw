import { AudioEngine } from './audio/AudioEngine';

export class Timer {
  private intervalId: number | null = null;
  private audioEngine: AudioEngine;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  beat(startBeat: number, callback: () => void): void {
    let beat = startBeat;
    const interval = 60000 / (this.audioEngine.bpm * 4); // 16th notes

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      callback();
      beat++;
    }, interval);

    // Update interval when BPM changes
    const originalBpm = this.audioEngine.bpm;
    const checkBpmChange = (): void => {
      if (this.audioEngine.bpm !== originalBpm) {
        this.stop();
        this.beat(beat, callback);
      } else {
        requestAnimationFrame(checkBpmChange);
      }
    };
    checkBpmChange();
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
