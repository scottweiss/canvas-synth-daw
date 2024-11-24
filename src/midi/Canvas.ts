import { AudioEngine } from "../audio/AudioEngine";

export class Canvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  audioEngine: AudioEngine;
  timePerFrame: number = 1000 / 60;
  then: number;
  frames: number = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.audioEngine = AudioEngine.getInstance();
    this.then = this.audioEngine.audioContext.currentTime;
  }

  connectedCallback() {
    this.resize();
    // this.draw();
  }

  getCtx(): CanvasRenderingContext2D | null {
    return this.context;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  shouldDraw(): boolean {
    // if (!this.context) return false;

    const currentTime = this.audioEngine.audioContext.currentTime;
    const timePassed = currentTime - this.then;

    if (timePassed < this.timePerFrame) {
      return false;
    }
    requestAnimationFrame(() => {
      this.shouldDraw();
    });

    this.then = currentTime - (timePassed % this.timePerFrame);
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return true;
  }

  // Add a getter for the underlying canvas element if needed
  getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }
}
