import { Drum } from '../../midi/Drum';
import styles from './csd-drum-kit.scss?inline';

export class CsdDrumKit extends HTMLElement {
  kick: Drum;
  snare: Drum;
  lowTom: Drum;
  conga: Drum;
  rimshot: Drum;
  sidestick: Drum;
  handclap: Drum;
  maraca: Drum;
  cowbell: Drum;
  crash: Drum;
  hiHatClosed: Drum;
  hiHatOpen: Drum;

  constructor() {
    super();
    this.kick = new Drum(60, 'sine', 0.1, 2);
    this.snare = new Drum(300, 'triangle', 0.05, 0.2);
    this.lowTom = new Drum(71.2, 'triangle', 0.05, 0.2);
    this.conga = new Drum(34.6, 'sine');
    this.rimshot = new Drum(180, 'triangle', 0.01, 0.4);
    this.sidestick = new Drum(520, 'square');
    this.handclap = new Drum(1379, 'sine', 0.1, 1);
    this.maraca = new Drum(650, 'triangle', 0.05, 0.3);
    this.cowbell = new Drum(800, 'square');
    this.crash = new Drum(120, 'sine');
    this.hiHatClosed = new Drum(264, 'triangle', 0.05, 0.3);
    this.hiHatOpen = new Drum(528, 'square');

    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    shadowRoot.append(
      this.renderDrumButton('kick', this.kick),
      this.renderDrumButton('snare', this.snare),
      this.renderDrumButton('lowTom', this.lowTom),
      this.renderDrumButton('conga', this.conga),
      this.renderDrumButton('rimshot', this.rimshot),
      this.renderDrumButton('sidestick', this.sidestick),
      this.renderDrumButton('handclap', this.handclap),
      this.renderDrumButton('maraca', this.maraca),
      this.renderDrumButton('cowbell', this.cowbell),
      this.renderDrumButton('crash', this.crash),
      this.renderDrumButton('hiHatOpen', this.hiHatClosed),
      this.renderDrumButton('hiHatClosed', this.hiHatOpen)
    );
  }

  renderDrumButton(label: string, drum: Drum): HTMLButtonElement {
    const key = document.createElement('button');
    key.textContent = label;
    key.addEventListener('click', () => {
      drum.play();
    });
    return key;
  }
}

// Define the new element
customElements.define('csd-drum-kit', CsdDrumKit);
