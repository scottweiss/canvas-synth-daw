import styles from "./csd-piano.scss?inline";
import { CsdPianoKey } from "./csd-piano-key/csd-piano-key"
import midiToFrequency from "../../midi/midi-to-frequency";

class CsdPiano extends HTMLElement {
  // pianoDomReference;
  pianoElement: HTMLElement;

  constructor() {
    super();

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
    this.pianoElement.addEventListener('CsdPianoKeyStart', (event) => {
      console.log(event);

      this.playSound((event as CustomEvent).detail.midiKey)
    });

    this.pianoElement.addEventListener('CsdPianoKeyStop', (event) => {
      console.log(event);
    })

    
  }

  renderPianoElement(): HTMLElement {
    const octives = 2;
    let startingKey = 60;
    const keyCount = (octives * 12) + startingKey;

    let pianoElement = document.createElement("div");
    pianoElement.className = "csd-piano";


    for (let i = startingKey; i < keyCount; i++) {
      pianoElement.append(new CsdPianoKey({ midiKey: i }));
    }

    return pianoElement;
  }


  playSound(midiNote = 69) {

    console.log(midiNote)

    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = midiToFrequency(midiNote); // set frequency in Hz
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0); // start immediately
    gainNode.gain.value = .10; // set initial gain to maximum

    oscillator.stop(.1); // start immediately

};

  


}

// Define the new element
customElements.define("csd-piano", CsdPiano);
