import { Drum } from "../../../midi/Drum";
import midiToFrequency, { midiToNote } from "../../../midi/midi-to-frequency";
// import styles from "./index.scss?inline";

export type CsdSequencerTrackProps = {
  note: number;
};
export class CsdSequencerTrack {
  note: number;
  track: Array<boolean> = [];
  drum: Drum;
  constructor(props: CsdSequencerTrackProps) {
    this.note = props.note;
    this.drum = new Drum(midiToFrequency(this.note), "triangle", 0.1, 0.1);

    // add styles
    // const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    // const shadowRoot = this.attachShadow({ mode: "closed" });
    // shadowRoot.adoptedStyleSheets.push(sheet);

    // shadowRoot.append(this.render());
    // return this.render()
    //     this.append(this.render())
  }

  // connectedCallback() {

  // }
  public render(): HTMLElement {
    const row = document.createElement("tr");

    const th = document.createElement("th");
    th.textContent = midiToNote(this.note);
    row.append(th);
    for (let i = 0; i < 16; i++) {
      row.append(this.renderCell(i));
    }
    const sharps = [1, 3, 6, 8, 10];

    if (sharps.includes(this.note % 12)) {
      row.classList.add("is-sharp");
    }

    return row;
  }

  public play() {
    this.drum.play();
  }

  renderCell(index: number): HTMLTableCellElement {
    const cell = document.createElement("td");

    const label = document.createElement('label');
    label.setAttribute('aria-label', `${midiToNote(this.note)}, Step ${index + 1} of 16`);

    const check = document.createElement("input");
    check.type = "checkbox";
    check.addEventListener("change", () => {
      this.track[index] = check.checked;
      // console.log(this.track)
    });
    label.append(check);

    cell.append(label);

    return cell;
  }
}

// Define the new element
// customElements.define("csd-sequencer-track", CsdSequencerTrack);
