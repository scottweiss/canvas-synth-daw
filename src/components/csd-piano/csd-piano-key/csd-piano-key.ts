import { AudioEngine } from "../../../audio/AudioEngine";
import midiToFrequency, { midiToNote } from "../../../midi/midi-to-frequency";
import styles from "./csd-piano-key.scss?inline";

export type CsdPianoKeyProps = {
  midiKey: number;
  keyboardKey: string;
  waveType: OscillatorType;
};
export class CsdPianoKey extends HTMLElement {
  pianoKeyElement: HTMLElement;
  keyNoteRef: HTMLElement;
  audioEngine: AudioEngine;
  oscillator: OscillatorNode;
  #midiKey: number;
  #keyboardKey: string;
  #waveType: OscillatorType;
  gainNode: GainNode;
  isPlaying: boolean;

  set midiKey(value: number) {
    this.#midiKey = value;
    this.keyNoteRef.textContent = String(midiToNote(value));
    this.oscillator.frequency.setValueAtTime(midiToFrequency(value), 0);
    this.pianoKeyElement.setAttribute("aria-label", midiToNote(value));
  }

  get midiKey(): number {
    return this.#midiKey;
  }

  set keyboardKey(value: string) {
    this.#keyboardKey = value;
  }

  get keyboardKey(): string {
    return this.#keyboardKey;
  }

  set waveType(value: OscillatorType) {
    this.#waveType = value;
    this.oscillator.type = value;
  }

  get waveType(): OscillatorType {
    return this.#waveType;
  }

  constructor(props: CsdPianoKeyProps) {
    super();

    this.#midiKey = props.midiKey;
    this.#keyboardKey = props.keyboardKey;
    this.keyNoteRef = document.createElement("span");
    this.keyNoteRef.classList.add("key-note");
    this.keyNoteRef.textContent = String(midiToNote(this.midiKey));

    this.audioEngine = AudioEngine.getInstance();
    this.oscillator = this.audioEngine.createOscillator(this.midiKey);
    this.gainNode = this.audioEngine.audioContext.createGain();
    this.#waveType = props.waveType || "sine";
    // Connect the oscillator to the gain node
    this.oscillator.type = this.#waveType;

    // Connect the oscillator to the gain node and then to the destination
    this.oscillator.connect(this.gainNode);
    // .connect(this.audioEngine.audioContext.destination);
    this.gainNode.connect(this.audioEngine.audioContext.destination);

    this.gainNode.connect(this.audioEngine.getAnalyser());

    this.isPlaying = false;

    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // add element
    if (this.isSharp()) {
      this.setAttribute("sharp", "");
    }
    this.pianoKeyElement = this.renderKey();
    shadowRoot.appendChild(this.pianoKeyElement);
  }

  connectedCallback() {
    window.addEventListener("keydown", (event) => {
      if (event.repeat) {
        return;
      }
      if (event.key === this.keyboardKey) {
        this.pianoKeyElement.classList.add("active");
        this.playNote();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.key === this.keyboardKey) {
        this.pianoKeyElement.classList.remove("active");
        this.releaseEnvelope();
      }
    });
    this.pianoKeyElement.addEventListener("touchstart", (event) => {
      console.log(event);
      event.preventDefault();
      event.stopImmediatePropagation();
      this.playNote();
      this.pianoKeyElement.classList.add("active");
      // if (event.key === this.keyboardKey) {
      //   this.pianoKeyElement.classList.add("active");
      //   this.playNote();
      // }
    });
    this.pianoKeyElement.addEventListener("touchend", () => {
      this.releaseEnvelope();
      this.pianoKeyElement.classList.remove("active");
    });

    this.pianoKeyElement.addEventListener("mousedown", (event: MouseEvent) => {
      console.log(event);
      this.playNote();
      this.dispatchEvent(
        new CustomEvent("CsdPianoKeyStart", {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        }),
      );
    });

    this.pianoKeyElement.addEventListener("mouseup", () => {
      this.dispatchEvent(
        new CustomEvent("CsdPianoKeyStop", {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        }),
      );
      this.releaseEnvelope();
    });

    this.pianoKeyElement.addEventListener("mouseleave", () => {
      this.dispatchEvent(
        new CustomEvent("CsdPianoKeyStop", {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        }),
      );
      this.releaseEnvelope();
    });
  }

  isSharp() {
    const sharps = [1, 3, 6, 8, 10]; // Representing the sharp note steps in an octave
    return sharps.includes(this.midiKey % 12);
  }

  getClasses(): string {
    const classes = ["csd-piano-key"];
    if (this.isSharp()) {
      classes.push("csd-piano-key-sharp");
    }
    return classes.join(" ");
  }
  renderKey(): HTMLButtonElement {
    const key = document.createElement("button");
    const keyKeyboardLable = document.createElement("kbd");
    keyKeyboardLable.textContent = this.keyboardKey;
    key.className = this.getClasses();
    key.setAttribute("aria-label", String(midiToNote(this.midiKey)));

    key.append(this.keyNoteRef, keyKeyboardLable);

    return key;
  }

  playNote(): void {
    if (!this.isPlaying) {
      this.oscillator.start();
      this.isPlaying = true;
    }
    this.audioEngine.playNote(this.oscillator, this.gainNode);
  }

  releaseEnvelope() {
    this.audioEngine.releaseEnvelope(this.gainNode);
  }
}

// Define the new element
customElements.define("csd-piano-key", CsdPianoKey);
