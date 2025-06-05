export class CanvasController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animationId: number | null = null;
  private lightAngle = 45;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  getCtx(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  draw(timestamp: number, callback: () => void): void {
    callback();
    this.animationId = requestAnimationFrame((t) => this.draw(t, callback));
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getAngleToLightSource(): number {
    return this.lightAngle;
  }

  setAngleToLightSource(angle: number): void {
    this.lightAngle = angle;
  }
}
