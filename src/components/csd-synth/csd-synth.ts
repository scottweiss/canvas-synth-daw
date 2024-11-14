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
     let waveTypeLabel = document.createElement('label');
     let waveTableLabelSpan = document.createElement('span').textContent = "Wave shape";

     waveTypeLabel.append(waveTableLabelSpan, this.waveTypeRef);
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(this.renderSvg(), waveTypeLabel, this.adsrRef, this.pianoRef);
  }

  renderSelectOption(label: string, value: string): HTMLElement {
    let option = document.createElement('option');
    option.text = label;
    option.value = value;
    return option;
  }

  renderSvg(): SVGSVGElement {
    const svgRef = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    const lighting = document.createElementNS('http://www.w3.org/2000/svg', 'feDiffuseLighting');
    const distantLight = document.createElementNS('http://www.w3.org/2000/svg', 'feDistantLight');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');


    svgRef.setAttribute('width', '100%');
    svgRef.setAttribute('height', '100%');

    // x='0%' y='0%' width='100%' height="100%"
    filter.setAttribute('id', 'plasticTexture');
    filter.setAttribute('x', '0%');
    filter.setAttribute('y', '0%');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');


    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '0.04');
    turbulence.setAttribute('result', 'noise');
    turbulence.setAttribute('numOctaves', '5');

    lighting.setAttribute('in', 'noise');
    lighting.setAttribute('lighting-color', '#333');
    lighting.setAttribute('surfaceScale', '2');

    distantLight.setAttribute('azimuth', '45')
    distantLight.setAttribute('elevation', '60')

    lighting.append(distantLight)

    filter.append(turbulence, lighting);

    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('filter', 'url(#plasticTexture)');
    rect.setAttribute('fill', 'none');

    svgRef.append(filter, rect)
  

    return svgRef;
  }

}

// Define the new element
customElements.define('csd-synth', CsdSynth);