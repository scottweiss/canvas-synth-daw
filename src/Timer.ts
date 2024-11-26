// import { AudioEngine } from "./audio/AudioEngine";
// import { CanvasController } from "./canvas/CanvasController";

export class Timer {
  // private audioEngine: AudioEngine;
  // private canvasController: CanvasController;
  private then: number = 0;
  private bpm: number = 60000 / 480;

  public draw(timestamp: number, callback?: (e: number) => void): void {
    requestAnimationFrame((timestamp) => this.draw(timestamp, callback));

    if (timestamp < this.then + this.bpm) return; // Skip frames to maintain 60 fps

    this.then = timestamp - ((timestamp - this.then) % this.bpm);

    if (callback) {
      // Clear the canvas before drawing each frame

      // Call the provided draw callback function
      callback(this.then / 1000);
    }
  }
}
