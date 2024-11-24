export class CanvasController {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private then: number = 0;
  private fpsInterval: number = 1000 / 60; // 60 fps

  constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    window.addEventListener("resize", () => this.handleResize);
    // this.handleResize()

    //   this.draw(0); // Start drawing the first frame
  }
  getCtx(): CanvasRenderingContext2D | null {
    return this.context;
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    console.log("hahhh");
  }

  public resize() {
    if (this.context == null) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  public getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  public draw(timestamp: number, callback?: () => void): void {
    requestAnimationFrame((timestamp) => this.draw(timestamp, callback));

    if (timestamp < this.then + this.fpsInterval) return; // Skip frames to maintain 60 fps

    this.then = timestamp - ((timestamp - this.then) % this.fpsInterval);

    if (this.context && callback) {
      // Clear the canvas before drawing each frame
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Call the provided draw callback function
      callback();
    }
  }
}
