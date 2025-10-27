import { AudioEngine } from '../../audio/AudioEngine';
import { MidiApi } from '../../midi/MidiApi';
import { CsdPianoKey } from './csd-piano-key/csd-piano-key';
import styles from './csd-piano.scss?inline';

export class CsdPiano extends HTMLElement {
  audioEngine: AudioEngine;
  audioContext: AudioContext;
  midiApi: MidiApi;
  private octaveOffset: number;
  pianoElement: HTMLElement;
  octaveUpRef: HTMLButtonElement;
  octaveDownRef: HTMLButtonElement;
  private keyComponents: CsdPianoKey[] = [];
  // Keyboard layout mimics piano: lower row = white keys, upper row = black keys
  // Pattern matches actual piano: W E _ T Y U _ O P (black keys have gaps)
  private readonly keyboardMap = [
    'a',  // C (white)
    'w',  // C# (black)
    's',  // D (white)
    'e',  // D# (black)
    'd',  // E (white)
    'f',  // F (white) - no black key between E-F
    't',  // F# (black)
    'g',  // G (white)
    'y',  // G# (black)
    'h',  // A (white)
    'u',  // A# (black)
    'j',  // B (white)
    'k',  // C (white) - no black key between B-C
    'o',  // C# (black)
    'l',  // D (white)
    'p',  // D# (black)
    ';',  // E (white)
    "'",  // F (white) - no black key between E-F
  ];

  constructor() {
    super();

    this.audioEngine = AudioEngine.getInstance();
    this.audioContext = this.audioEngine.audioContext;
    this.octaveOffset = 0;

    // Add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    this.midiApi = new MidiApi();

    // Render octave buttons first (needed for renderPianoElement)
    this.octaveUpRef = this.renderOctaveUp();
    this.octaveDownRef = this.renderOctaveDown();

    // Add element
    this.pianoElement = this.renderPianoElement();
  }

  connectedCallback(): void {
    const shadowRoot = this.shadowRoot;
    if (shadowRoot) {
      shadowRoot.appendChild(this.pianoElement);
    }
  }

  renderPianoElement(): HTMLElement {
    const piano = document.createElement('div');
    piano.className = 'csd-piano';

    const octaveController = document.createElement('div');
    octaveController.className = 'octive-controller';
    octaveController.append(this.octaveUpRef, this.octaveDownRef);

    piano.appendChild(octaveController);

    // Add piano keys
    this.keyComponents = this.createPianoKeys();
    piano.append(...this.keyComponents);

    return piano;
  }

  createPianoKeys(): CsdPianoKey[] {
    const baseNote = 60 + this.octaveOffset * 12;

    return this.keyboardMap.map((key, index) => {
      const pianoKey = new CsdPianoKey({
        midiKey: baseNote + index,
        keyboardKey: key,
      });
      return pianoKey;
    });
  }

  updatePianoKeys(): void {
    const baseNote = 60 + this.octaveOffset * 12;
    this.keyComponents.forEach((key, index) => {
      key.midiKey = baseNote + index;
    });
  }

  renderOctaveUp(): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = '<span>+</span><kbd>Z</kbd>';
    button.addEventListener('click', () => {
      if (this.octaveOffset < 2) {
        this.octaveOffset++;
        this.updatePianoKeys();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' && this.octaveOffset < 2) {
        this.octaveOffset++;
        this.updatePianoKeys();
      }
    });

    return button;
  }

  renderOctaveDown(): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = '<span>-</span><kbd>X</kbd>';
    button.addEventListener('click', () => {
      if (this.octaveOffset > -2) {
        this.octaveOffset--;
        this.updatePianoKeys();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'x' && this.octaveOffset > -2) {
        this.octaveOffset--;
        this.updatePianoKeys();
      }
    });

    return button;
  }
}

// Define the new element
customElements.define('csd-piano', CsdPiano);
