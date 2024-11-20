import { AudioEngine } from "../../midi/AudioEngine";
import { Canvas } from "../../midi/Canvas";
import styles from "./csd-equalizer.scss?inline";

export class CsdEqualizer extends HTMLElement {
  private canvasController: Canvas;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private audioEngine: AudioEngine;
  private analyserNode: AnalyserNode;

  constructor() {
    super();

    this.audioEngine = AudioEngine.getInstance(); // get the singleton instance of AudioEngine
    this.canvasController = new Canvas();

    this.canvas = this.canvasController.getCanvasElement();
    // this.canvas = document.createElement("canvas");
    this.context = this.canvasController.getCtx();

    if (!this.context) {
      throw new Error("Could not get 2D rendering context from canvas.");
    }

    this.analyserNode = this.audioEngine.getAnalyser(); // use the audio context from AudioEngine
    this.analyserNode.fftSize = 256;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(styleSheet);
    shadowRoot.appendChild(this.canvas);
  }

  connectedCallback() {
    this.canvasController.resize();
    this.canvasController.draw();

    this.resize();
    this.draw();
  }

  drawGridOverlay() {
    if (!this.context) return;
    this.context.save();
    this.context.lineWidth = 2;
    this.context.strokeStyle = "#00000033";
    this.context.beginPath();
    // this.context.translate(, 2)
    const cellSize = 24;

    for (let i = 8; i < this.canvas.width; i += cellSize) {
      this.context.moveTo(i, 0);
      this.context.lineTo(i, this.canvas.height);
    }

    for (let i = 20; i < this.canvas.height; i += cellSize) {
      this.context.moveTo(0, i);
      this.context.lineTo(this.canvas.width, i);
    }
    this.context.stroke();
    this.context.closePath();
    // this.context.beginPath();

    // this.context.moveTo(0, this.canvas.height / 2);
    // this.context.lineTo(this.canvas.width, this.canvas.height / 2);

    // this.context.moveTo(this.canvas.width / 2, 0);
    // this.context.lineTo(this.canvas.width / 2, this.canvas.height);
    // this.context.strokeStyle = "#00000033";
    // this.context.stroke();
    this.context.restore();
  }

  private draw() {
    requestAnimationFrame(() => this.draw());
    if (!this.context) return;
    const bufferLength = this.analyserNode.frequencyBinCount;

    // this.canvasController.draw()
    this.context.save();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.analyserNode.getByteFrequencyData(this.audioEngine.getAudioData());

    this.context.fillStyle = "#333433";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.lineWidth = 3;
    this.context.strokeStyle = "#1f1";

    this.context.shadowBlur = 20;
    this.context.shadowColor = "#1f1";

    this.context.beginPath();

    const sliceWidth = (this.canvas.width * 1.0) / bufferLength;

    // const maxLogIndex = Math.log(bufferLength / (2 * this.audioEngine.audioContext.sampleRate)) / Math.log(2) * bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      // const  logIndex = maxLogIndex * (Math.log(i + 1) / Math.log(bufferLength)) - 1; // Calculate the log-scale index
      // Map the log-scale index to a x coordinate on the canvas
      // x = logIndex / maxLogIndex * this.canvas.width;
      const v = this.audioEngine.getAudioData()[i] / 128.0;
      const y = this.canvas.height - (v * this.canvas.height) / 2;

      if (i === 0) {
        this.context.moveTo(x, y);
      } else {
        this.context.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.context.stroke();

    this.context.restore();
    this.drawGridOverlay();
  }

  private resize() {
    if (this.context == null) {
      return;
    }

    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
}

customElements.define("csd-equalizer", CsdEqualizer);
