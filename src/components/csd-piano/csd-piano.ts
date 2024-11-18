import styles from "./csd-piano.scss?inline";
import { CsdPianoKey } from "./csd-piano-key/csd-piano-key";
import { keyboardKeyArray } from "../../midi/midi-to-frequency";
import { Adsr } from "../csd-adsr/csd-adsr";
import { AudioEngine } from "../../midi/AudioEngine";

export type CsdPianoProps = {
  adsr: Adsr;
  waveType?: OscillatorType;
};
export class CsdPiano extends HTMLElement {
  pianoElement: HTMLElement;
  audioEngine: AudioEngine;
  audioContext: AudioContext;
  #adsr: Adsr;
  #waveType: OscillatorType;

  constructor(props: CsdPianoProps) {
    super();

    this.audioEngine = AudioEngine.getInstance();
    this.audioContext = this.audioEngine.audioContext;
    this.#waveType = props.waveType || "sawtooth";

    this.#adsr = props.adsr || {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.4,
      release: 0.2,
    };
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
    this.pianoElement
      .querySelectorAll<CsdPianoKey>("csd-piano-key")
      .forEach((pianoKey) => {
        pianoKey.adsr = this.adsr;
      });
  }

  get adsr(): Adsr {
    return this.#adsr;
  }

  set waveType(value: OscillatorType) {
    this.#waveType = value;
    this.pianoElement
      .querySelectorAll<CsdPianoKey>("csd-piano-key")
      .forEach((pianoKey) => {
        pianoKey.waveType = value;
      });
  }

  get waveType(): OscillatorType {
    return this.#waveType;
  }
  renderPianoElement(): HTMLElement {
    const octives = 1.5;
    const startingKey = 60;

    const keyCount = octives * 12 + startingKey;

    const pianoElement = document.createElement("div");
    pianoElement.className = "csd-piano";

    for (let i = startingKey; i < keyCount; i++) {
      const pianoKey = new CsdPianoKey({
        midiKey: i,
        keyboardKey: keyboardKeyArray[i - startingKey],
        waveType: this.waveType,
      });
      pianoElement.append(pianoKey);
    }

    return pianoElement;
  }
}

customElements.define("csd-piano", CsdPiano);
