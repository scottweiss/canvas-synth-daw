import styles from './csd-adsr.scss?inline';
import '../csd-range/csd-range';
import { CsdRange } from '../csd-range/csd-range';
import { IAdsr } from '../../audio/ADSR';

export class CsdAdsr extends HTMLElement {
  #attack: number;
  #decay: number;
  #sustain: number;
  #release: number;
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D | null;

  constructor(props: { adsr: IAdsr }) {
    super();
    this.adsr = props.adsr;
    this.#attack = props.adsr.attack;
    this.#decay = props.adsr.decay;
    this.#sustain = props.adsr.sustain;
    this.#release = props.adsr.release;
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');

    if (this.#ctx != null) {
      this.#ctx.lineJoin = 'round';
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(...this.renderAdsr());
  }

  get adsr(): IAdsr {
    return {
      attack: this.#attack,
      decay: this.#decay,
      sustain: this.#sustain,
      release: this.#release,
    };
  }

  set adsr(adsr: IAdsr) {
    this.#attack = adsr.attack;
    this.#decay = adsr.decay;
    this.#sustain = adsr.sustain;
    this.#release = adsr.release;
    this.drawADSR();
  }

  renderAdsr(): Array<HTMLElement> {
    const canvasWrapper = document.createElement('div');
    canvasWrapper.classList.add('canvas-wrapper');
    canvasWrapper.append(this.#canvas);
    return [
      canvasWrapper,
      this.renderFieldset('attack'),
      this.renderFieldset('decay'),
      this.renderFieldset('sustain'),
      this.renderFieldset('release'),
    ];
  }

  renderFieldset(type: string): HTMLElement {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = type;

    // const range = document.createElement('csd-range');
    const range = new CsdRange({ label: type });
    range.id = 'csd-adsr-' + type;

    switch (type) {
      case 'attack':
        range.value = this.#attack;
        break;
      case 'decay':
        range.value = this.#decay;
        break;
      case 'sustain':
        range.value = this.#sustain;
        break;
      case 'release':
        range.value = this.#release;
        break;
    }

    range.addEventListener('csdRange', (event) => {
      const newValue = (event as CustomEvent).detail.value;
      if (newValue == null) {
        return;
      }
      switch (type) {
        case 'attack':
          this.#attack = Number(newValue);
          break;
        case 'decay':
          this.#decay = Number(newValue);
          break;
        case 'sustain':
          this.#sustain = Number(newValue);
          break;
        case 'release':
          this.#release = Number(newValue);
          break;
      }

      this.drawADSR();
      this.dispatchEvent(
        new CustomEvent('CsdAdsr', {
          detail: { adsr: this.adsr },
          bubbles: true,
        })
      );
    });

    fieldset.append(legend, range);

    return fieldset;
  }

  drawADSR(): void {
    if (
      this.#ctx == null ||
      this.#attack == null ||
      this.#decay == null ||
      this.#sustain == null ||
      this.#release == null
    ) {
      return;
    }
    this.#ctx.save();
    const width = this.#canvas.clientWidth;
    const height = this.#canvas.clientHeight;

    const canvasWidth = this.#ctx.canvas.width;
    const canvasHeight = this.#ctx.canvas.height;

    this.#canvas.width = width;
    this.#canvas.height = height;

    // this.#ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.#ctx.fillStyle = '#333433';
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#ctx.lineWidth = 3;
    this.#ctx.strokeStyle = '#1f1';

    this.#ctx.shadowBlur = 20;
    this.#ctx.shadowColor = '#1f1';

    const margin = 20;
    const innerWidth = canvasWidth - 1 * margin;
    const totalDuration =
      this.#attack + this.#decay + this.#sustain + this.#release;
    const attackWidth = (this.#attack / totalDuration) * innerWidth;
    const decayWidth = (this.#decay / totalDuration) * innerWidth;
    const sustainWidth = (this.#sustain / totalDuration) * innerWidth;
    const releaseWidth = (this.#release / totalDuration) * innerWidth;

    // Calculate Y position for sustain line based on ratio, not percentage
    // const sustainY = (canvasHeight - 10) * this.#sustain;
    // const sustainY = (1 - this.#sustain) * (canvasHeight - margin) - margin;

    const sustainY =
      (1 - this.#sustain) * (canvasHeight - margin - margin) + margin;

    this.#ctx.beginPath();
    this.#ctx.lineJoin = 'round';
    this.#ctx.lineCap = 'round';
    this.#ctx.moveTo(margin, canvasHeight - margin); // Attack
    this.#ctx.lineTo(attackWidth + margin, margin); // Decay

    // Sustain line is drawn from the top to sustainY and then to release point
    this.#ctx.lineTo(attackWidth + decayWidth + margin, sustainY);
    this.#ctx.lineTo(attackWidth + decayWidth + sustainWidth, sustainY); // Release

    this.#ctx.lineTo(
      attackWidth + decayWidth + sustainWidth + releaseWidth,
      canvasHeight - margin
    );

    this.#ctx.stroke();
    this.#ctx.restore();
    this.drawGridOverlay();
  }

  drawGridOverlay(): void {
    if (!this.#ctx) return;
    this.#ctx.save();
    this.#ctx.lineWidth = 0.5;
    this.#ctx.strokeStyle = '#00000066';
    this.#ctx.beginPath();
    // this.#ctx.translate(, 2)
    const cellSize = 24;

    for (let i = 8; i < this.#canvas.width; i += cellSize) {
      this.#ctx.moveTo(i, 0);
      this.#ctx.lineTo(i, this.#canvas.height);
    }

    for (let i = 20; i < this.#canvas.height; i += cellSize) {
      this.#ctx.moveTo(0, i);
      this.#ctx.lineTo(this.#canvas.width, i);
    }
    this.#ctx.stroke();
    this.#ctx.closePath();
    // this.#ctx.beginPath();

    // this.#ctx.moveTo(0, this.canvas.height / 2);
    // this.#ctx.lineTo(this.canvas.width, this.canvas.height / 2);

    // this.#ctx.moveTo(this.canvas.width / 2, 0);
    // this.#ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    // this.#ctx.strokeStyle = "#00000033";
    // this.#ctx.stroke();
    this.#ctx.restore();
  }

  connectedCallback(): void {
    this.drawADSR();
  }
}

// Define the new element
customElements.define('csd-adsr', CsdAdsr);
