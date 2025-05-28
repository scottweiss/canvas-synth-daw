import { AudioEngine } from './audio/AudioEngine';

export type TimerProps = {
  bpm?: number;
  bpMeasure?: number;
};
export class Timer {
  private static instance: Timer;
  private audioEngine: AudioEngine = AudioEngine.getInstance();
  // private fpsInterval: number = 1000 / 60; // 60 fps
  private bpmeasure: number;
  private then: number = this.audioEngine.audioContext.currentTime;
  private beatCount: number = 0;

  constructor(props?: TimerProps) {
    this.bpmeasure = props?.bpMeasure || 4;
  }

  public beat(timestamp: number, callback?: (e: number) => void): void {
    requestAnimationFrame((timestamp) => this.beat(timestamp, callback));
    const bpm = this.audioEngine.bpm;
    if (timestamp < this.then + 6000 / (bpm / this.bpmeasure)) return;

    this.then = timestamp;
    // this.then = timestamp - ((timestamp - this.then) % (6000 / bpm));
    this.beatCount++;
    if (callback) {
      callback(this.beatCount);
    }
  }

  public static getInstance(): Timer {
    if (!Timer.instance) {
      Timer.instance = new Timer();
    }
    return Timer.instance;
  }
}
