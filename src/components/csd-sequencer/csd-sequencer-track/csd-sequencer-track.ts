import { AudioEngine } from '../../../audio/AudioEngine';
import { Drum } from '../../../midi/Drum';
import midiToFrequency from '../../../midi/midi-to-frequency';
// import styles from './index.scss?inline';

export interface ICsdSequencerTrackProps {
  note: string | number;
  drum?: Drum;
}

export class CsdSequencerTrack {
  note: string | number;
  drum: Drum;
  track: boolean[] = new Array(16).fill(false);
  private audioEngine: AudioEngine = AudioEngine.getInstance();

  private static midiToNote(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];

    if (midiNote === 60) {
      return `${noteName}${octave} (Middle C)`;
    }

    return `${noteName}${octave}`;
  }

  constructor(props: ICsdSequencerTrackProps) {
    this.note = props.note;
    this.drum =
      props.drum ||
      (typeof this.note === 'number'
        ? new Drum(midiToFrequency(this.note), 'triangle', 0.1, 0.1)
        : new Drum(midiToFrequency(440), 'triangle', 0.1, 0.1));

    // add styles
    // const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    // const shadowRoot = this.attachShadow({ mode: "closed" });
    // shadowRoot.adoptedStyleSheets.push(sheet);

    // shadowRoot.append(this.render());
    // return this.render()
    // this.append(this.render())
    const localStorageTracks = localStorage.getItem(
      `csd-sequencer-track-${this.note}`
    );

    if (localStorageTracks) {
      this.track = JSON.parse(localStorageTracks);
    }
  }

  public render(): HTMLElement {
    const row = document.createElement('tr');

    const th = document.createElement('th');
    const sharps = [1, 3, 6, 8, 10];
    switch (typeof this.note) {
      case 'number':
        th.textContent = CsdSequencerTrack.midiToNote(this.note);
        if (sharps.includes(this.note % 12)) {
          row.classList.add('is-sharp');
        }
        break;
      case 'string':
      default:
        th.textContent = this.note;
        break;
    }

    row.append(th);
    for (let i = 0; i < 16; i++) {
      row.append(this.renderCell(i));
    }

    return row;
  }

  public isStepActive(step: number): boolean {
    return this.track[step % this.track.length] === true;
  }

  public trigger(bpm: number): void {
    if (typeof this.note === 'number') {
      this.triggerSynthNote(bpm);
      return;
    }

    this.drum.play();
  }

  renderCell(index: number): HTMLTableCellElement {
    const cell = document.createElement('td');

    const label = document.createElement('label');
    const noteLabel =
      typeof this.note === 'string'
        ? this.note
        : CsdSequencerTrack.midiToNote(this.note);
    label.setAttribute('aria-label', `${noteLabel}, Step ${index + 1} of 16`);

    const check = document.createElement('input');
    check.type = 'checkbox';

    if (this.track[index]) {
      check.checked = true;
    }

    check.addEventListener('change', () => {
      this.track[index] = check.checked;
      localStorage.setItem(
        `csd-sequencer-track-${this.note}`,
        JSON.stringify(this.track)
      );
    });

    label.append(check);

    cell.append(label);

    return cell;
  }

  private triggerSynthNote(bpm: number): void {
    if (typeof this.note !== 'number') {
      return;
    }

    const velocity = 100;
    this.audioEngine.noteOn(this.note, velocity);

    const sixteenthMs = 60000 / (bpm * 4);
    window.setTimeout(() => {
      this.audioEngine.noteOff(this.note as number);
    }, sixteenthMs * 0.9);
  }
}

// Define the new element
// customElements.define("csd-sequencer-track", CsdSequencerTrack);
