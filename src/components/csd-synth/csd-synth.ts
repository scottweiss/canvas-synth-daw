import { Adsr, CsdAdsr } from '../csd-adsr/csd-adsr';
import { CsdPiano } from '../csd-piano/csd-piano';
import styles from './csd-synth.scss?inline';



export class CsdSynth extends HTMLElement {
  props: any;
  
  waveType: OscillatorType;
  waveTypeRef: HTMLSelectElement;
  pianoRef: CsdPiano;
  adsrRef: CsdAdsr;
  adsr: Adsr;
 

  constructor(props: any) {
    super();
    this.props = props;

    this.adsr = {
      attack: .5,
      decay: .5,
      sustain: .5,
      release: .5
    }

    this.waveType = "sine";

    this.pianoRef = new CsdPiano({adsr: this.adsr})
    this.adsrRef = new CsdAdsr({adsr: this.adsr});



    this.adsrRef.addEventListener('CsdAdsr', (event) => {
      const adsrValue = (event as CustomEvent).detail.adsr;
      if  (adsrValue) {
        this.adsr = adsrValue;
        this.pianoRef.adsr = this.adsr;
       }
     });

     this.waveTypeRef = document.createElement('select');

     this.waveTypeRef.append(
        this.renderSelectOption('sawtooth', 'sawtooth'),
        this.renderSelectOption('sine', 'sine'),
        this.renderSelectOption('square', 'square'),
        this.renderSelectOption('triangle', 'triangle'),
     )

     this.waveTypeRef.addEventListener('change', () => {
        this.pianoRef.waveType = this.waveTypeRef.value as OscillatorType;
     })

     this.waveTypeRef.value = this.waveType;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(this.waveTypeRef, this.adsrRef, this.pianoRef);
  }

  renderSelectOption(label: string, value: string): HTMLElement {
    let option = document.createElement('option');
    option.text = label;
    option.value = value;
    return option;
  }

}

// Define the new element
customElements.define('csd-synth', CsdSynth);