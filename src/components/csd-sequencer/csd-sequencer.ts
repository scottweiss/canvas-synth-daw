import { AudioEngine } from "../../audio/AudioEngine";
import styles from "./index.scss?inline";


export class CsdSequencer extends HTMLElement {

  audioEngine: AudioEngine;
 


  constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
 

    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    const domNode = document.createElement('p');
    domNode.textContent = "Helo world"

    shadowRoot.appendChild(domNode);
  }

  connectedCallback() {
   
  }

}

// Define the new element
customElements.define("csd-sequencer", CsdSequencer);
