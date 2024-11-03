import { midiToNote } from "../../../midi/midi-to-frequency";
import styles from "./csd-piano-key.scss?inline";

export class CsdPianoKey extends HTMLElement {
    // pianoDomReference;
    pianoKeyElement: HTMLElement;

    #midiKey: number;
    #keyboardKey: string;

    set midiKey(value: number) {
        this.#midiKey = value;
    }

    get midiKey(): number {
        return this.#midiKey;
    }

    set keyboardKey(value: string){
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
            this.dispatchEvent(new CustomEvent('CsdPianoKeyStart', { bubbles: true, detail: { midiKey: this.midiKey } }));
        })


        // key.addEventListener('mouseup', () => {
        //     this.dispatchEvent(new CustomEvent('CsdPianoKeyStop', { bubbles: true, detail: { midiKey: this.midiKey } }));
        // })

        return key;
    }
}

// Define the new element
customElements.define("csd-piano-key", CsdPianoKey);
