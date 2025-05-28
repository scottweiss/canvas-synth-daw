export class CanvasController {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private then: number = 0;
  private fpsInterval: number = 1000 / 60; // 60 fps
  public lightAngle: number;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.lightAngle = this.getAngleToLightSource();

    window.addEventListener('resize', () => this.handleResize());

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
  }

  public resize(): void {
    if (this.context == null) {
      return;
    }
    this.lightAngle = this.getAngleToLightSource();

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  public getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  public getAngleToLightSource(): number {
    const sX = window.innerWidth / 2; // Light source X coordinate is center of the screen
    const sY = 0; // Light source Y coordinate is top of the screen

    const cX =
      this.canvas.getBoundingClientRect().left + this.canvas.clientWidth / 2; // Center of canvas X
    const cY =
      this.canvas.getBoundingClientRect().top + this.canvas.clientHeight / 2; // Top of canvas Y

    const dx = sX - cX;
    const dy = sY - cY;

    // Use Math.atan2 to get the angle in radian
    // Use Math.atan2 to get the angle in radian and convert it to degrees
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  public draw(timestamp: number, callback?: () => void): void {
    requestAnimationFrame((timestamp) => this.draw(timestamp, callback));

    if (timestamp < this.then + this.fpsInterval) return; // Skip frames to maintain 60 fps

    this.then = timestamp - ((timestamp - this.then) % this.fpsInterval);

    if (this.context && callback) {
      // Clear the canvas before drawing each frame
      // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Call the provided draw callback function
      callback();
    }
  }
}
