import styles from './csd-peak-meter.scss?inline';

export class CsdPeakMeter extends HTMLElement {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private level: number = 0;
  private peakLevel: number = 0;
  private peakHoldTime: number = 0;
  private animationId: number | null = null;

  constructor() {
    super();

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 20;
    this.canvas.height = 200;
    this.ctx = this.canvas.getContext('2d');

    const container = document.createElement('div');
    container.className = 'meter-container';
    container.appendChild(this.canvas);

    shadowRoot.appendChild(container);
  }

  connectedCallback(): void {
    this.startAnimation();
  }

  disconnectedCallback(): void {
    this.stopAnimation();
  }

  public setLevel(level: number): void {
    this.level = Math.max(0, Math.min(1, level));

    if (this.level > this.peakLevel) {
      this.peakLevel = this.level;
      this.peakHoldTime = 60; // Hold for 60 frames (~1 second)
    }
  }

  private startAnimation(): void {
    const animate = () => {
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
    const segmentCount = 20;
    const segmentHeight = height / segmentCount;
    const segmentGap = 2;
    const levelHeight = this.level * height;

    for (let i = 0; i < segmentCount; i++) {
      const y = height - (i + 1) * segmentHeight;
      const segmentBottom = height - i * segmentHeight;

      if (segmentBottom <= levelHeight) {
        // Determine color based on position
        let color;
        if (i < segmentCount * 0.7) {
          color = '#4ecdc4'; // Green zone
        } else if (i < segmentCount * 0.9) {
          color = '#ffaa00'; // Yellow zone
        } else {
          color = '#ff4444'; // Red zone
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(2, y + segmentGap, width - 4, segmentHeight - segmentGap);
      }
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
