import styles from "./csd-piano.scss?inline";
import { CsdPianoKey } from "./csd-piano-key/csd-piano-key"
import { keyboardKeyArray } from "../../midi/midi-to-frequency";
type CdsAsdr = {
  attack: number,
  decay: number,
  sustain: number,
  release: number
};
class CsdPiano extends HTMLElement {
  // pianoDomReference;
  pianoElement: HTMLElement;
  adsrElement: HTMLElement;

  audioContext: AudioContext;

  adsr: CdsAsdr;

  constructor(props: any) {
    super();
    console.log(props)
    this.audioContext = new window.AudioContext;

    this.adsr = {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.4,
      release: 0.2
    }
    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // add element
    this.pianoElement = this.renderPianoElement();
    this.adsrElement = this.renderAdsrElement();
    shadowRoot.append( this.adsrElement, this.pianoElement);
  }

  // connectedCallback() {
  //   console.log("connectedCallback");
  // }

  renderPianoElement(): HTMLElement {
    const octives = 1.5;
    let startingKey = 60;
    const keyCount = (octives * 12) + startingKey;

    let pianoElement = document.createElement("div");
    pianoElement.className = "csd-piano";


    for (let i = startingKey; i < keyCount; i++) {
      pianoElement.append(new CsdPianoKey({ midiKey: i, audioContext: this.audioContext, keyboardKey: keyboardKeyArray[i - startingKey] , adsr: this.adsr}));
    }

    return pianoElement;
  }

  renderAdsrElement(): HTMLElement {
    let adsr = document.createElement('csd-adsr');
    adsr.addEventListener('CsdAdsr', (event) => {
      console.log('ahhh')
      const value = (event as any).detail.adsr;
      if (value) {
        this.adsr = value;
      }
    })
    return adsr;
  }
}

// Define the new element
customElements.define("csd-piano", CsdPiano);
