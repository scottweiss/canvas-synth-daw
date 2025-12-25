import styles from './csd-peak-meter.scss?inline';

export class CsdPeakMeter extends HTMLElement {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private level: number = 0;
  private peakLevel: number = 0;
  private peakHoldTime: number = 0;
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLDivElement;

  constructor() {
    super();

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 12;
    this.canvas.height = 100; // Default height
    this.ctx = this.canvas.getContext('2d');

    this.container = document.createElement('div');
    this.container.className = 'meter-container';
    this.container.appendChild(this.canvas);

    shadowRoot.appendChild(this.container);

    // Set up resize observer to handle dynamic sizing
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.min(140, Math.max(60, entry.contentRect.height));
        if (this.canvas.height !== height) {
          this.canvas.height = height;
          this.draw(); // Redraw after resize
        }
      }
    });
  }

  connectedCallback(): void {
    this.startAnimation();
    if (this.resizeObserver) {
      this.resizeObserver.observe(this.container);
    }
  }

  disconnectedCallback(): void {
    this.stopAnimation();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  public setLevel(level: number): void {
    this.level = Math.max(0, Math.min(1, level));

    if (this.level > this.peakLevel) {
      this.peakLevel = this.level;
      this.peakHoldTime = 60; // Hold for 60 frames (~1 second)
    }
  }

  private startAnimation(): void {
    const animate = (): void => {
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private draw(): void {
    if (!this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw background
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-elevated').trim();
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw segments
    const segmentCount = 16;
    const segmentHeight = height / segmentCount;
    const segmentGap = 2;
    const levelHeight = this.level * height;
    const filledSegments = Math.min(segmentCount, Math.floor(levelHeight / segmentHeight + 0.0001));

    for (let i = 0; i < segmentCount; i++) {
      const y = height - (i + 1) * segmentHeight;
      const isFilled = i < filledSegments;

      if (!isFilled) {
        continue;
      }

      const positionRatio = (i + 1) / segmentCount;
      let color;
      if (positionRatio < 0.7) {
        color = '#4ecdc4'; // Bottom green zone
      } else if (positionRatio < 0.9) {
        color = '#ffaa00'; // Mid yellow zone
      } else {
        color = '#ff4444'; // Top red zone
      }

      this.ctx.fillStyle = color;
      this.ctx.fillRect(2, y + segmentGap, width - 4, segmentHeight - segmentGap);
    }

    // Draw peak indicator
    if (this.peakHoldTime > 0) {
      const peakY = height - (this.peakLevel * height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(2, peakY - 2, width - 4, 2);
      this.peakHoldTime--;
    } else {
      // Decay peak slowly
      this.peakLevel *= 0.98;
    }

    // Decay level
    this.level *= 0.85;
  }
}

customElements.define('csd-peak-meter', CsdPeakMeter);
