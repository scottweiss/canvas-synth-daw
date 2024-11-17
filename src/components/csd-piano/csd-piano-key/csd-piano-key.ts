import { ADSR, Adsr } from "../../../midi/ADSR";
import { AudioEngine } from "../../../midi/AudioEngine";
import midiToFrequency, { midiToNote } from "../../../midi/midi-to-frequency";
import styles from "./csd-piano-key.scss?inline";

export class CsdPianoKey extends HTMLElement {
    // pianoDomReference;
    pianoKeyElement: HTMLElement;
    audioEngine: AudioEngine;
    oscillator: OscillatorNode;
    #midiKey: number;
    #keyboardKey: string;
    #waveType: OscillatorType;
    gainNode: GainNode;
    isPlaying: boolean;
    adsr: Adsr;


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

    set waveType(value: OscillatorType) {
        this.#waveType = value;
        this.oscillator.type = value;
    }

    get waveType(): OscillatorType {
        return this.#waveType;
    }

    constructor(props: any) {
        super();

        this.#midiKey = props.midiKey;
        this.#keyboardKey = props.keyboardKey;

        this.audioEngine = AudioEngine.getInstance();
        this.oscillator = this.audioEngine.createOscillator(this.midiKey);
        this.gainNode = this.audioEngine.audioContext.createGain();
        this.#waveType = props.waveType || 'sine';
        // Connect the oscillator to the gain node
        this.oscillator.type = this.waveType;

        // Connect the oscillator to the gain node and then to the destination
        this.oscillator.connect(this.gainNode).connect(this.audioEngine.audioContext.destination);
        this.gainNode.connect(this.audioEngine.audioContext.destination);
        this.gainNode.connect(this.audioEngine.getAnalyser());
        this.adsr = ADSR.getInstance().adsr;
  


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

        this.pianoKeyElement.addEventListener("mousedown", () => {
            this.playNote();
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStart', { bubbles: true, detail: { midiKey: this.midiKey } }));
        })


        this.pianoKeyElement.addEventListener('mouseup', () => {
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
            this.releaseEnvelope()
        })

        this.pianoKeyElement.addEventListener('mouseleave', () => {
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
            this.releaseEnvelope()
        })
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
        key.setAttribute('aria-label', String(midiToNote(this.midiKey)));

        key.append(keyLable);

        return key;
    }

    playNote(): void {
        if (!this.oscillator) return;

        this.gainNode.gain.setValueAtTime(0, this.audioEngine.audioContext.currentTime);
        this.applyADSR();
        if (!this.isPlaying) {
            this.oscillator.start()
            this.isPlaying = true;
        }

    }


    applyADSR() {
        const currentTime = this.audioEngine.audioContext.currentTime;
        this.oscillator.frequency.setValueAtTime(midiToFrequency(this.midiKey), this.audioEngine.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(0.001, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.1, currentTime + this.adsr.attack);
        this.gainNode.gain.linearRampToValueAtTime(this.adsr.sustain * 0.1, currentTime + this.adsr.attack + this.adsr.decay);
        this.gainNode.gain.setValueAtTime(this.adsr.sustain * 0.1, currentTime + this.adsr.attack + this.adsr.decay);
    }

    releaseEnvelope() {
        const currentTime = this.audioEngine.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, currentTime + this.adsr.release);
        // this.oscillator.stop();
    }
}

// Define the new element
customElements.define("csd-piano-key", CsdPianoKey);
