import styles from './csd-adsr.scss?inline';
import '../csd-range/csd-range';
import { CsdRange } from '../csd-range/csd-range';

export type Adsr = {
  attack: number,
  decay: number,
  sustain: number,
  release: number
};

export class CsdAdsr extends HTMLElement {
  #attack: number;
  #decay: number;
  #sustain: number;
  #release: number;
  #canvas: HTMLCanvasElement;
  #ctx;

  constructor(props: any) {
    super();
    this.adsr = props.adsr;
    this.#attack = props.adsr.attack;
    this.#decay = props.adsr.decay;
    this.#sustain = props.adsr.sustain;
    this.#release = props.adsr.release;
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');
    
    if(this.#ctx != null) {
      this.#ctx.lineJoin = "round";
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(...this.renderAdsr())
  }

  get adsr(): Adsr {
    return {
      attack: this.#attack,
      decay: this.#decay,
      sustain: this.#sustain,
      release: this.#release
    }
  }

  set adsr(adsr: Adsr) {
    this.#attack = adsr.attack;
    this.#decay = adsr.decay;
    this.#sustain = adsr.sustain;
    this.#release = adsr.release;
    this.drawADSR();
  }

  renderAdsr(): Array<HTMLElement> {
    return [
      this.#canvas,
      this.renderFieldset('attack'),
      this.renderFieldset('decay'),
      this.renderFieldset('sustain'),
      this.renderFieldset('release'),
    ]
  }

  renderFieldset(type: string): HTMLElement {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = type;

    // const range = document.createElement('csd-range');
    const range = new CsdRange({});
    range.id = 'csd-adsr-' + type;


    switch (type) {
      case 'attack':
        range.value = String(this.#attack);
        break;

      case 'decay':
        range.value = String(this.#decay);
        break;
      case 'sustain':
        range.value = String(this.#sustain);
        break;
      case 'release':
        range.value = String(this.#release);
        break;
    }

    range.addEventListener('csdRange', (event) => {
      const newValue = (event as any).detail.value;
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
      this.dispatchEvent(new CustomEvent('CsdAdsr', { detail: { adsr: this.adsr }, bubbles: true }))
    })

    fieldset.append(legend, range)

    return fieldset;
  }

  drawADSR() {
    if (
      this.#ctx == null ||
      this.#attack == null ||
      this.#decay == null ||
      this.#sustain == null ||
      this.#release == null
    ) {
      return;
    }
    this.#ctx.lineJoin = "round";
    const width = this.#canvas.clientWidth;
    const height = this.#canvas.clientHeight;
 
    const canvasWidth = this.#ctx.canvas.width;
    const canvasHeight = this.#ctx.canvas.height;
    this.#canvas.width = width;
    this.#canvas.height = height;
    this.#ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const totalDuration = this.#attack + this.#decay + this.#sustain + this.#release;
    const attackWidth = (this.#attack / totalDuration) * canvasWidth;
    const decayWidth = (this.#decay / totalDuration) * canvasWidth;
    const sustainWidth = (this.#sustain / totalDuration) * canvasWidth;
    const releaseWidth = (this.#release / totalDuration) * canvasWidth;
    this.#ctx.beginPath();
    this.#ctx.lineJoin = "round";
    this.#ctx.moveTo(10, canvasHeight - 10); // Attack 
    this.#ctx.lineTo(attackWidth, 10); // Decay 
    this.#ctx.lineTo(attackWidth + decayWidth, canvasHeight / 2); // Sustain 
    this.#ctx.lineTo(attackWidth + decayWidth + sustainWidth, canvasHeight / 2); // Release 
    this.#ctx.lineTo(attackWidth + decayWidth + sustainWidth + releaseWidth - 10 , canvasHeight - 10);
    // this.#ctx.lineTo(canvasWidth - 10, canvasHeight - 10);
    this.#ctx.strokeStyle = 'blue';
    this.#ctx.lineWidth = 10;
    this.#ctx.lineJoin = "round";
    this.#ctx.stroke();

  }



  connectedCallback() {
    
    this.drawADSR();
  }

}

// Define the new element
customElements.define('csd-adsr', CsdAdsr);