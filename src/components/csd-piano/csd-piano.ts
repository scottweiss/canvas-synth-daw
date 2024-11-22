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
  #octiveOffset: number;
  octiveUpRef: HTMLElement;
  octiveDownRef: HTMLElement;
  

  constructor(props: CsdPianoProps) {
    super();

    this.audioEngine = AudioEngine.getInstance();
    this.audioContext = this.audioEngine.audioContext;
    this.#waveType = props.waveType || "sawtooth";
    this.#octiveOffset = 0;
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

    this.octiveUpRef = this.renderOctiveUp();
    this.octiveDownRef = this.renderOctiveDown();

    const container = document.createElement('div');
    container.classList.add('octive-controller');

    container.append(this.octiveUpRef, this.octiveDownRef)


    shadowRoot.append(container, this.pianoElement);
  }
  connectedCallback() {
    window.addEventListener("keydown", (event) => {
  
      if (event.key === 'z') {
        this.octiveOffset--;
        console.log(this.pianoElement.querySelectorAll('button'))
        this.octiveDownRef.classList.add('active');
      }
      if (event.key === 'x') {
        this.octiveOffset++
        this.octiveDownRef.classList.add('active');
      }
    });

    window.addEventListener("keyup", (event) => {
  
      if (event.key === 'z') {
        this.octiveDownRef.classList.remove('active');
      }
      if (event.key === 'x') {
        this.octiveDownRef.classList.remove('active');
      }
    });
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

  set octiveOffset(offset: number) {
    this.#octiveOffset = offset;
    this.pianoElement
      .querySelectorAll<CsdPianoKey>("csd-piano-key")
      .forEach((pianoKey, index) => {
        pianoKey.midiKey = 60 + index + this.octiveOffset * 12;
      });
  }

  get octiveOffset(): number {
    return this.#octiveOffset;
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
    const startingKey = 60 + this.octiveOffset * 12;

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

  renderOctiveUp(): HTMLElement {
    const octiveUp = document.createElement('button');
    const upkeyLable = document.createElement("kbd");
    upkeyLable.textContent = 'x';
    const upSpan = document.createElement('span');
    upSpan.textContent = "+"
    octiveUp.append(upSpan, upkeyLable);

    octiveUp.addEventListener('click', () => {
      this.octiveOffset++;
    })


    return octiveUp;
  }

  renderOctiveDown(): HTMLElement {
    const octivedown = document.createElement('button');
    const downKeyLabel = document.createElement("kbd");
    downKeyLabel.textContent = 'z';
    const downSpan = document.createElement('span');
    downSpan.textContent = "-"
    octivedown.append(downSpan, downKeyLabel)

     octivedown.addEventListener('click', () => {
      this.octiveOffset--;
    })

    return octivedown

  }
}

customElements.define("csd-piano", CsdPiano);
