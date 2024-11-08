import midiToFrequency, { midiToNote } from "../../../midi/midi-to-frequency";
import styles from "./csd-piano-key.scss?inline";

export class CsdPianoKey extends HTMLElement {
    // pianoDomReference;
    pianoKeyElement: HTMLElement;
    #audioContext: AudioContext;
    #midiKey: number;
    #keyboardKey: string;
    gainNode: GainNode;

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

    constructor(props: any) {
        super();

        console.log(props)
        this.#midiKey = props.midiKey;
        this.#keyboardKey = props.keyboardKey;
        this.#audioContext = props.audioContext;
        this.gainNode = this.#audioContext.createGain();
        this.gainNode.gain.setValueAtTime(0.08, 0);

        // allows volume to decrease with time



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
        console.log("connectedCallback");
        window.addEventListener('keydown', (event) => {
            if (event.key === this.keyboardKey) {
                this.pianoKeyElement.classList.add('active');
                this.playNote()
            }

        });
        window.addEventListener('keyup', (event) => {
            if (event.key === this.keyboardKey) {
                this.pianoKeyElement.classList.remove('active');
                // this.playNote()
            }
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
        key.className = this.getClasses();
        key.textContent = String(midiToNote(this.midiKey));
        key.textContent = this.keyboardKey;
        // key.addEventListener("mousedown", () => {
        //     this.dispatchEvent(new CustomEvent('CsdPianoKeyStart', { bubbles: true, detail: { midiKey: this.midiKey } }));
        // })
        key.addEventListener("click", () => {
            this.playNote();
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStart', { bubbles: true, detail: { midiKey: this.midiKey } }));
        })


        // key.addEventListener('mouseup', () => {
        //     this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
        // })

        return key;
    }
    playNote(): void {
        let oscillator = this.#audioContext.createOscillator();
        oscillator.frequency.setValueAtTime(midiToFrequency(this.midiKey), this.#audioContext.currentTime);

        // lower gain for higher frequency notes
        // connect gain node to destination (speakers)
        this.gainNode.gain.setValueAtTime(0.08, this.#audioContext.currentTime);

        if (midiToFrequency(this.midiKey) > 699) {
            this.gainNode.gain.setValueAtTime(0.03, this.#audioContext.currentTime);
        }

        oscillator.connect(this.gainNode);



        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.#audioContext.currentTime + 1.5);



        this.gainNode.connect(this.#audioContext.destination);

        oscillator.start(0);

        // tone will play for 1.5 seconds 
        oscillator.stop(this.#audioContext.currentTime + 1.5);

    }
}

// Define the new element
customElements.define("csd-piano-key", CsdPianoKey);
