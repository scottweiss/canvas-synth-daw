import { IAdsr } from '../../audio/ADSR';
import { CanvasController } from '../../canvas/CanvasController';
import { CsdRange } from '../csd-range/csd-range';
import styles from './csd-adsr.scss?inline';

export interface ICsdAdsrProps {
  adsr: IAdsr;
}

export class CsdAdsr extends HTMLElement {
  private adsr: IAdsr;
  private canvasController: CanvasController;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private attackRange: CsdRange;
  private decayRange: CsdRange;
  private sustainRange: CsdRange;
  private releaseRange: CsdRange;

  constructor(props: ICsdAdsrProps) {
    super();

    this.adsr = props.adsr;
    this.canvasController = new CanvasController();
    this.canvas = this.canvasController.getCanvasElement();
    this.ctx = this.canvasController.getCtx();

    // Create range controls
    this.attackRange = new CsdRange({
      label: 'attack',
      min: 0,
      max: 2,
      stepSize: 0.01,
      value: this.adsr.attack,
    });

    this.decayRange = new CsdRange({
      label: 'decay',
      min: 0,
      max: 2,
      stepSize: 0.01,
      value: this.adsr.decay,
    });

    this.sustainRange = new CsdRange({
      label: 'sustain',
      min: 0,
      max: 1,
      stepSize: 0.01,
      value: this.adsr.sustain,
    });

    this.releaseRange = new CsdRange({
      label: 'release',
      min: 0,
      max: 2,
      stepSize: 0.01,
      value: this.adsr.release,
    });

    // Setup event listeners
    this.setupEventListeners();

    // Setup shadow DOM
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // Create canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrapper';
    canvasWrapper.appendChild(this.canvas);

    // Create fieldsets for each control
    const attackFieldset = this.createFieldset('Attack', this.attackRange);
    const decayFieldset = this.createFieldset('Decay', this.decayRange);
    const sustainFieldset = this.createFieldset('Sustain', this.sustainRange);
    const releaseFieldset = this.createFieldset('Release', this.releaseRange);

    shadowRoot.append(
      canvasWrapper,
      attackFieldset,
      decayFieldset,
      sustainFieldset,
      releaseFieldset
    );
  }

  connectedCallback(): void {
    this.canvasController.resize();
    this.canvasController.draw(0, this.drawEnvelope.bind(this));
  }

  private createFieldset(legend: string, range: CsdRange): HTMLFieldSetElement {
    const fieldset = document.createElement('fieldset');
    const legendElement = document.createElement('legend');
    legendElement.textContent = legend;
    fieldset.append(legendElement, range);
    return fieldset;
  }

  private setupEventListeners(): void {
    this.attackRange.addEventListener('csdRange', (event) => {
      this.adsr.attack = (event as CustomEvent).detail.value;
      this.emitAdsrChange();
    });

    this.decayRange.addEventListener('csdRange', (event) => {
      this.adsr.decay = (event as CustomEvent).detail.value;
      this.emitAdsrChange();
    });

    this.sustainRange.addEventListener('csdRange', (event) => {
      this.adsr.sustain = (event as CustomEvent).detail.value;
      this.emitAdsrChange();
    });

    this.releaseRange.addEventListener('csdRange', (event) => {
      this.adsr.release = (event as CustomEvent).detail.value;
      this.emitAdsrChange();
    });
  }

  private emitAdsrChange(): void {
    this.dispatchEvent(
      new CustomEvent('CsdAdsr', {
        detail: { adsr: this.adsr },
        bubbles: true,
      })
    );
  }

  private drawEnvelope(): void {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 20;
    const maxTime = this.adsr.attack + this.adsr.decay + 1 + this.adsr.release;

    this.ctx.clearRect(0, 0, width, height);

    // Draw grid
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i * (width - 2 * padding)) / 10;
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, height - padding);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - 2 * padding)) / 5;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(width - padding, y);
      this.ctx.stroke();
    }

    // Draw envelope
    this.ctx.strokeStyle = '#1f1';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#1f1';

    this.ctx.beginPath();

    const scaleX = (width - 2 * padding) / maxTime;
    const scaleY = height - 2 * padding;

    // Start point
    this.ctx.moveTo(padding, height - padding);

    // Attack
    const attackX = padding + this.adsr.attack * scaleX;
    this.ctx.lineTo(attackX, padding);

    // Decay
    const decayX = attackX + this.adsr.decay * scaleX;
    const sustainY = padding + (1 - this.adsr.sustain) * scaleY;
    this.ctx.lineTo(decayX, sustainY);

    // Sustain
    const sustainX = decayX + 1 * scaleX;
    this.ctx.lineTo(sustainX, sustainY);

    // Release
    const releaseX = sustainX + this.adsr.release * scaleX;
    this.ctx.lineTo(releaseX, height - padding);

    this.ctx.stroke();

    // Draw labels
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.shadowBlur = 0;

    this.ctx.fillText('A', attackX - 5, height - 5);
    this.ctx.fillText('D', decayX - 5, height - 5);
    this.ctx.fillText('S', sustainX - 5, height - 5);
    this.ctx.fillText('R', releaseX - 5, height - 5);
  }
}

customElements.define('csd-adsr', CsdAdsr);
