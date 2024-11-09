import styles from './csd-adsr.scss?inline';
import '../csd-range/csd-range';

type Adsr = {
  attack: number,
  decay: number,
  sustain: number,
  release: number
};

class CsdAdsr extends HTMLElement {
    #attack: number;
    #decay: number;
    #sustain: number;
    #release: number;
    #canvas: HTMLCanvasElement;
    #ctx;

    constructor(props: any) {
      super();
      console.log(props)
      this.#attack = 0.2;
      this.#decay = 0.2;
      this.#sustain = 0.2;
      this.#release = 0.2;
      this.#canvas = document.createElement('canvas');
      this.#ctx = this.#canvas.getContext('2d');


      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);

      const shadowRoot = this.attachShadow({mode: 'open'});

      // this.rangeElement = this.renderRangeElement();
      // this.inputElement= this.renderRangeValueDisplayElement();

      shadowRoot.adoptedStyleSheets.push(sheet);

      shadowRoot.append(...this.renderAdsr())
      // shadowRoot.appendChild(this.inputElement);
      // shadowRoot.appendChild(this.rangeElement);
    }

    get adsr(): Adsr {
      return {
        attack: this.#attack,
        decay: this.#decay,
        sustain: this.#sustain,
        release: this.#release
      }
    }

    set adsr(adsr: Adsr){
      this.#attack = adsr.attack;
      this.#decay = adsr.decay;
      this.#sustain = adsr.sustain;
      this.#release = adsr.release;
      console.log('set adsr', adsr)
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

      const range = document.createElement('csd-range');
      range.id = 'csd-adsr-' + type;

      range.addEventListener('csdRange', (event) =>{
        console.log(event)
        const newValue = (event as any).detail.value;
        if (newValue == null) {
          return;
        }
        switch(type){
          case 'attack':
            this.#attack = Number(newValue);
            break;
          case 'sustain':
            this.#sustain = Number(newValue);
            break;
          case 'decay':
            this.#decay = Number(newValue);
            break;
          case 'release':
            this.#release = Number(newValue);
            break;
        }

        this.drawADSR();
        this.dispatchEvent(new CustomEvent('CsdAdsr', {detail: {adsr: {
          attack: this.#attack,
          decay: this.#decay,
          sustain: this.#sustain,
          release: this.#release
        } }}))
      })

      fieldset.append(legend, range)

      return fieldset;
    }

    drawADSR() { 
      if (
        this.#ctx == null ||
        this.#attack == null ||
        this.#decay== null ||
        this.#sustain == null ||
         this.#release == null
        ) {
          return;
        }
        
      const canvasWidth = this.#ctx.canvas.width;
      const canvasHeight = this.#ctx.canvas.height;
      console.log(this.#attack,  this.#decay, this.#sustain, this.#release)
      this.#ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const totalDuration = this.#attack + this.#decay + this.#sustain + this.#release; 
      const attackWidth = (this.#attack / totalDuration) * canvasWidth; 
      const decayWidth = (this.#decay / totalDuration) * canvasWidth; 
      const sustainWidth = (this.#sustain / totalDuration) * canvasWidth; 
      const releaseWidth = (this.#release / totalDuration) * canvasWidth;
      this.#ctx.beginPath(); 
      this.#ctx.moveTo(0, canvasHeight); // Attack 
      this.#ctx.lineTo(attackWidth, 0); // Decay 
      this.#ctx.lineTo(attackWidth + decayWidth, canvasHeight / 2); // Sustain 
      this.#ctx.lineTo(attackWidth + decayWidth + sustainWidth, canvasHeight / 2); // Release 
      this.#ctx.lineTo(attackWidth + decayWidth + sustainWidth + releaseWidth, canvasHeight);
      this.#ctx.lineTo(canvasWidth, canvasHeight); 
      this.#ctx.strokeStyle = 'blue'; 
      this.#ctx.lineWidth = 10; 
      this.#ctx.lineJoin = "round";
      this.#ctx.stroke();
      
      }



    connectedCallback() {
      console.log('connectedCallback')
      this.drawADSR();
    }
    disconnectedCallback() {
      console.log('disconnected')
    }




}

// Define the new element
customElements.define('csd-adsr', CsdAdsr);