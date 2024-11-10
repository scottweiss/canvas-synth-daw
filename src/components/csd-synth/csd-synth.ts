import { Adsr, CsdAdsr } from '../csd-adsr/csd-adsr';
import { CsdPiano } from '../csd-piano/csd-piano';
import styles from './csd-synth.scss?inline';



export class CsdSynth extends HTMLElement {
  props: any;
  
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

    this.pianoRef = new CsdPiano({adsr: this.adsr})
    this.adsrRef = new CsdAdsr({adsr: this.adsr});


    this.adsrRef.addEventListener('CsdAdsr', (event) => {
      const adsrValue = (event as CustomEvent).detail.adsr;
      if  (adsrValue) {
        this.adsr = adsrValue;
        this.pianoRef.adsr = this.adsr;
       }
     });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(this.adsrRef, this.pianoRef);
  }

}

// Define the new element
customElements.define('csd-synth', CsdSynth);