import { AudioEngine } from '../../../audio/AudioEngine';
import { midiToNote } from '../../../midi/midi-to-frequency';
import styles from './csd-piano-key.scss?inline';

export type CsdPianoKeyProps = {
  midiKey: number;
  keyboardKey: string;
};

export class CsdPianoKey extends HTMLElement {
  pianoKeyElement: HTMLElement;
  keyNoteRef: HTMLElement;
  audioEngine: AudioEngine;
  private _midiKey: number;
  private _keyboardKey: string;

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }
    if (event.key === this.keyboardKey) {
      this.pianoKeyElement.classList.add('active');
      this.playNote();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === this.keyboardKey) {
      this.pianoKeyElement.classList.remove('active');
      this.releaseEnvelope();
    }
  };

  set midiKey(value: number) {
    this._midiKey = value;
    this.keyNoteRef.textContent = String(midiToNote(value));
    this.pianoKeyElement.setAttribute('aria-label', midiToNote(value));
  }

  get midiKey(): number {
    return this._midiKey;
  }

  set keyboardKey(value: string) {
    this._keyboardKey = value;
  }

  get keyboardKey(): string {
    return this._keyboardKey;
  }

  constructor(props: CsdPianoKeyProps) {
    super();

    this._midiKey = props.midiKey;
    this._keyboardKey = props.keyboardKey;

    this.keyNoteRef = document.createElement('span');
    this.keyNoteRef.classList.add('key-note');
    this.keyNoteRef.textContent = String(midiToNote(this.midiKey));

    this.audioEngine = AudioEngine.getInstance();

    // Add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // Add element
    if (this.isSharp()) {
      this.setAttribute('sharp', '');
    }
    this.pianoKeyElement = this.renderKey();
    shadowRoot.appendChild(this.pianoKeyElement);
  }

  connectedCallback(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.pianoKeyElement.addEventListener('touchstart', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.playNote();
      this.pianoKeyElement.classList.add('active');
    });

    this.pianoKeyElement.addEventListener('touchend', () => {
      this.releaseEnvelope();
      this.pianoKeyElement.classList.remove('active');
    });

    this.pianoKeyElement.addEventListener('mousedown', () => {
      this.playNote();
      this.dispatchEvent(
        new CustomEvent('CsdPianoKeyStart', {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        })
      );
    });

    this.pianoKeyElement.addEventListener('mouseup', () => {
      this.dispatchEvent(
        new CustomEvent('CsdPianoKeyStop', {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        })
      );
      this.releaseEnvelope();
    });

    this.pianoKeyElement.addEventListener('mouseleave', () => {
      this.dispatchEvent(
        new CustomEvent('CsdPianoKeyStop', {
          bubbles: true,
          detail: { midiKey: this.midiKey },
        })
      );
      this.releaseEnvelope();
      this.pianoKeyElement.classList.remove('active');
    });

    this.pianoKeyElement.addEventListener('mouseenter', (e: MouseEvent) => {
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.buttons === 1) {
        this.playNote();
        this.pianoKeyElement.classList.add('active');
      }
    });
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  isSharp(): boolean {
    const noteInOctave = this.midiKey % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  }

  getClasses(): string {
    const classes = ['csd-piano-key'];
    if (this.isSharp()) {
      classes.push('csd-piano-key-sharp');
    }
    return classes.join(' ');
  }

  renderKey(): HTMLButtonElement {
    const key = document.createElement('button');
    const keyKeyboardLabel = document.createElement('kbd');
    keyKeyboardLabel.textContent = this.keyboardKey;
    key.className = this.getClasses();
    key.setAttribute('aria-label', String(midiToNote(this.midiKey)));

    key.append(this.keyNoteRef, keyKeyboardLabel);

    return key;
  }

  playNote(): void {
    this.audioEngine.noteOn(this.midiKey);
    this.dispatchEvent(
      new CustomEvent('CsdPianoKeyStart', {
        bubbles: true,
        detail: { midiKey: this.midiKey },
      })
    );

    // Dispatch global note on event for clip recording
    window.dispatchEvent(
      new CustomEvent('noteOn', {
        detail: { pitch: this.midiKey, velocity: 100 }
      })
    );
  }

  releaseEnvelope(): void {
    this.audioEngine.noteOff(this.midiKey);
    this.dispatchEvent(
      new CustomEvent('CsdPianoKeyStop', {
        bubbles: true,
        detail: { midiKey: this.midiKey },
      })
    );

    // Dispatch global note off event for clip recording
    window.dispatchEvent(
      new CustomEvent('noteOff', {
        detail: { pitch: this.midiKey }
      })
    );
  }
}

// Define the new element
customElements.define('csd-piano-key', CsdPianoKey);
