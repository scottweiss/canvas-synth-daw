import midiToFrequency, { midiToNote } from "../../../midi/midi-to-frequency";
import { Adsr } from "../../csd-adsr/csd-adsr";
import styles from "./csd-piano-key.scss?inline";



export class CsdPianoKey extends HTMLElement {
    // pianoDomReference;
    pianoKeyElement: HTMLElement;
    #audioContext: AudioContext;
    oscillator: OscillatorNode;
    #midiKey: number;
    #keyboardKey: string;
    gainNode: GainNode;
    #adsr: Adsr;
    isPlaying: boolean;

    set midiKey(value: number) {
        this.#midiKey = value;
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

    set adsr(value: Adsr) {
        this.#adsr = value;
    }

    get adsr(): Adsr {
        return this.#adsr;
    }



    constructor(props: any) {
        super();

        this.#midiKey = props.midiKey;
        this.#keyboardKey = props.keyboardKey;
        this.#audioContext = props.audioContext;
        this.gainNode = this.#audioContext.createGain();
        this.oscillator = this.#audioContext.createOscillator();
        // Connect the oscillator to the gain node
        this.oscillator.type = "sine";//"custom" | "sawtooth" | "sine" | "square" | "triangle"
        

        this.oscillator.connect(this.gainNode);
        // Then connect the gain node to the destination
        this.gainNode.connect(this.#audioContext.destination);

        this.#adsr = props.adsr;

        this.oscillator.frequency.setValueAtTime(midiToFrequency(props.midiKey), this.#audioContext.currentTime);


        this.isPlaying = false;


        // add styles
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.adoptedStyleSheets.push(sheet);

        // add element
        if (this.isSharp()) {
            this.setAttribute('sharp', '')
        }
        this.pianoKeyElement = this.renderKey();
        shadowRoot.appendChild(this.pianoKeyElement);
    }

    connectedCallback() {
        window.addEventListener('keydown', (event) => {
            if (event.repeat) { return }
            if (event.key === this.keyboardKey) {
                this.pianoKeyElement.classList.add('active');
                this.playNote()
            }
        });
        window.addEventListener('keyup', (event) => {
            if (event.key === this.keyboardKey) {
                this.pianoKeyElement.classList.remove('active');
                this.releaseEnvelope();
            }
        });
    }

    isSharp() {
        const sharps = [1, 3, 6, 8, 10]; // Representing the sharp note steps in an octave 
        return sharps.includes(this.midiKey % 12);
    }

    getClasses(): string {
        let classes = ['csd-piano-key'];
        if (this.isSharp()) {
            classes.push('csd-piano-key-sharp')
        }
        return classes.join(' ');
    }
    renderKey(): HTMLButtonElement {
        let key = document.createElement("button");
        let keyLable = document.createElement("kbd");
        keyLable.textContent = this.keyboardKey;
        key.className = this.getClasses();

        key.append(keyLable);
        // key.textContent = String(midiToNote(this.midiKey));
        // key.textContent = this.keyboardKey;

        key.addEventListener("mousedown", () => {
            this.playNote();
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStart', { bubbles: true, detail: { midiKey: this.midiKey } }));
        })


        key.addEventListener('mouseup', () => {
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
            this.releaseEnvelope()
        })

        key.addEventListener('mouseleave', () => {
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
            this.releaseEnvelope()
        })


        return key;
    }
    playNote(): void {
        if (!this.isPlaying) {
            this.oscillator.start()
            this.isPlaying = true;
        }
        this.applyADSR()
    }

    applyADSR() {
        const currentTime = this.#audioContext.currentTime;
        this.oscillator.frequency.setValueAtTime(midiToFrequency(this.midiKey), this.#audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(0, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(.08, currentTime + this.adsr.attack);
        this.gainNode.gain.linearRampToValueAtTime(this.adsr.sustain, currentTime + this.adsr.attack + this.adsr.decay);
        this.gainNode.gain.setValueAtTime(this.adsr.sustain, currentTime + this.adsr.attack + this.adsr.decay);
    }

    releaseEnvelope() {
        const currentTime = this.#audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, currentTime + this.adsr.release);
    }

}

// Define the new element
customElements.define("csd-piano-key", CsdPianoKey);
