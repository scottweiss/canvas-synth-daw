import styles from "./csd-piano.scss?inline";
import { CsdPianoKey } from "./csd-piano-key/csd-piano-key"
import { keyboardKeyArray } from "../../midi/midi-to-frequency";

class CsdPiano extends HTMLElement {
  // pianoDomReference;
  pianoElement: HTMLElement;

  audioContext: AudioContext;

  constructor() {
    super();
    this.audioContext = new window.AudioContext;

    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // add element
    this.pianoElement = this.renderPianoElement();
    shadowRoot.appendChild(this.pianoElement);
  }

  connectedCallback() {
    console.log("connectedCallback");
  }

  renderPianoElement(): HTMLElement {
    const octives = 1.5;
    let startingKey = 60;
    const keyCount = (octives * 12) + startingKey;

    let pianoElement = document.createElement("div");
    pianoElement.className = "csd-piano";


    for (let i = startingKey; i < keyCount; i++) {
      pianoElement.append(new CsdPianoKey({ midiKey: i, audioContext: this.audioContext, keyboardKey: keyboardKeyArray[i - startingKey] }));
    }

    return pianoElement;
  }
}

// Define the new element
customElements.define("csd-piano", CsdPiano);
