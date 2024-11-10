import styles from "./csd-piano.scss?inline";
import { CsdPianoKey } from "./csd-piano-key/csd-piano-key"
import { keyboardKeyArray } from "../../midi/midi-to-frequency";
import { Adsr, CsdAdsr } from "../csd-adsr/csd-adsr";

export class CsdPiano extends HTMLElement {
  props: any;
  pianoElement: HTMLElement;

  audioContext: AudioContext;
  #adsr: Adsr;

  constructor(props: any) {
    super();

    this.audioContext = new window.AudioContext;

    this.#adsr = {
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

     shadowRoot.append(this.pianoElement);


  }

  set adsr(value: Adsr) {
    this.#adsr = value;
    this.pianoElement.querySelectorAll<CsdPianoKey>('csd-piano-key').forEach((pianoKey) => {
      pianoKey.adsr = this.adsr;
     });
}

get adsr(): Adsr {
    return this.#adsr;
}
  renderPianoElement(): HTMLElement {
    const octives = 1.5;
    let startingKey = 60;
    const keyCount = (octives * 12) + startingKey;

    let pianoElement = document.createElement("div");
    pianoElement.className = "csd-piano";

    for (let i = startingKey; i < keyCount; i++) {
      let pianoKey = new CsdPianoKey({ midiKey: i, audioContext: this.audioContext, keyboardKey: keyboardKeyArray[i - startingKey], adsr: this.adsr });
      pianoElement.append(pianoKey);
    }

    return pianoElement;
  }

}

// Define the new element
customElements.define("csd-piano", CsdPiano);
