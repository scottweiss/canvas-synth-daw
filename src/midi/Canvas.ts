export class Canvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
  }

  connectedCallback() {
    this.resize();
    this.draw();
  }

  getCtx(): CanvasRenderingContext2D | null {
    return this.context;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  draw() {
    if (!this.context) return;
    requestAnimationFrame(() => this.draw());
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Add a getter for the underlying canvas element if needed
  getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }
}
