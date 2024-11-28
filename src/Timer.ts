import { AudioEngine } from "./audio/AudioEngine";

export type TimerProps = {
  bpm?: number;
};
export class Timer {
  private static instance: Timer;
  private audioEngine: AudioEngine = AudioEngine.getInstance();
  // private fpsInterval: number = 1000 / 60; // 60 fps
  private then: number = 0;

  public beat(timestamp: number, callback?: (e: number) => void): void {
    requestAnimationFrame((timestamp) => this.beat(timestamp, callback));
    const bpm = this.audioEngine.bpm;
    if (timestamp < this.then + 6000 / bpm) return;

    this.then = timestamp - ((timestamp - this.then) % (6000 / bpm));

    if (callback) {
      callback(this.then / 1000);
    }
  }

  // public draw(timestamp: number, callback?: () => void): void {
  //   requestAnimationFrame((timestamp) => this.draw(timestamp, callback));

  //   if (timestamp < this.then + this.fpsInterval) return; // Skip frames to maintain 60 fps

  //   this.then = timestamp - ((timestamp - this.then) % this.fpsInterval);

  //   if (callback) {
  //     // Call the provided draw callback function
  //     callback();
  //   }
  // }

  public static getInstance(): Timer {
    if (!Timer.instance) {
      Timer.instance = new Timer();
    }
    return Timer.instance;
  }
}
