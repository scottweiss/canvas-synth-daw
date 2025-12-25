import { Transport } from '../../audio/Transport';
import styles from './csd-timeline.scss?inline';

export class CsdTimeline extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private transport: Transport;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playhead: HTMLDivElement;
  private beatsPerPixel: number = 0.1; // Zoom level (lower = more zoomed in)
  private viewportStart: number = 0; // Start beat visible in viewport
  private isDragging: boolean = false;
  private lastX: number = 0;

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.transport = Transport.getInstance();

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.playhead = document.createElement('div');

    this.render();
    this.setupEventListeners();
  }

  connectedCallback(): void {
    this.updateSize();
    this.draw();

    // Subscribe to transport ticks for playhead animation
    this.transport.onTick(() => {
      this.updatePlayhead();
    });

    // Redraw on window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  disconnectedCallback(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'timeline';

    this.canvas.className = 'timeline-canvas';
    this.playhead.className = 'playhead';

    container.appendChild(this.canvas);
    container.appendChild(this.playhead);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(container);
  }

  private setupEventListeners(): void {
    // Pan the timeline by dragging
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastX;
        this.lastX = e.clientX;

        // Pan the viewport
        const deltaBeat = deltaX * this.beatsPerPixel;
        this.viewportStart -= deltaBeat;
        if (this.viewportStart < 0) {
          this.viewportStart = 0;
        }

        this.draw();
        this.updatePlayhead();

        // Emit pan event for tracks to sync
        this.dispatchEvent(new CustomEvent('timelinePan', {
          detail: { viewportStart: this.viewportStart, beatsPerPixel: this.beatsPerPixel }
        }));
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
    });

    // Zoom with mouse wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      this.beatsPerPixel *= zoomFactor;

      // Limit zoom range
      this.beatsPerPixel = Math.max(0.01, Math.min(1, this.beatsPerPixel));

      this.draw();
      this.updatePlayhead();

      // Emit zoom event
      this.dispatchEvent(new CustomEvent('timelineZoom', {
        detail: { beatsPerPixel: this.beatsPerPixel }
      }));
    });

    // Click to set playback position
    this.canvas.addEventListener('click', (e) => {
      if (!this.isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const beat = this.viewportStart + (x * this.beatsPerPixel);
        const tick = this.transport.beatToTick(Math.floor(beat));
        this.transport.setPosition(tick);
        this.updatePlayhead();
      }
    });
  }

  private handleResize(): void {
    this.updateSize();
    this.draw();
  }

  private updateSize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height || 60;
  }

  private draw(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);

    // Draw beat grid
    this.drawBeatGrid(width, height);
  }

  private drawBeatGrid(width: number, height: number): void {
    const startBeat = Math.floor(this.viewportStart);
    const endBeat = Math.ceil(this.viewportStart + (width * this.beatsPerPixel));

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#888';

    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = (beat - this.viewportStart) / this.beatsPerPixel;

      // Draw measure lines (every 4 beats) thicker
      if (beat % 4 === 0) {
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;

        // Draw measure number
        const measure = beat / 4 + 1;
        this.ctx.fillText(`${measure}`, x + 2, 12);
      } else {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
      }

      // Draw vertical line
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
  }

  private updatePlayhead(): void {
    const currentBeat = this.transport.getCurrentBeat();
    const x = (currentBeat - this.viewportStart) / this.beatsPerPixel;

    this.playhead.style.left = `${x}px`;

    // Auto-scroll to follow playhead if it goes off screen
    if (x < 0 || x > this.canvas.width) {
      this.viewportStart = currentBeat;
      this.draw();
      this.dispatchEvent(new CustomEvent('timelinePan', {
        detail: { viewportStart: this.viewportStart, beatsPerPixel: this.beatsPerPixel }
      }));
    }
  }

  // Public API for external control
  public setZoom(beatsPerPixel: number): void {
    this.beatsPerPixel = Math.max(0.01, Math.min(1, beatsPerPixel));
    this.draw();
    this.updatePlayhead();
  }

  public setViewportStart(beat: number): void {
    this.viewportStart = Math.max(0, beat);
    this.draw();
    this.updatePlayhead();
  }

  public getViewportInfo(): { start: number; beatsPerPixel: number } {
    return {
      start: this.viewportStart,
      beatsPerPixel: this.beatsPerPixel
    };
  }
}

customElements.define('csd-timeline', CsdTimeline);
