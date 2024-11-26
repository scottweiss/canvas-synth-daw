import { AudioEngine } from "../../audio/AudioEngine";
import { CanvasController } from "../../canvas/CanvasController";
import { Drum } from "../../midi/Drum";
import { Timer } from "../../Timer";
import { CsdSequencerTrack } from "./csd-sequencer-track/csd-sequencer-track";
import styles from "./index.scss?inline";

export class CsdSequencer extends HTMLElement {
  audioEngine: AudioEngine = AudioEngine.getInstance();
  canvasController: CanvasController = new CanvasController();
  canvas: HTMLCanvasElement = this.canvasController.getCanvasElement();
  context: CanvasRenderingContext2D | null;
  frame: number = 0;
  beat: number = 0;
  timer: Timer = new Timer();
  kick: Drum;
  snare: Drum;
  play: boolean = false;
  tracks: Array<CsdSequencerTrack> = [];
  playToggle: HTMLButtonElement;

  constructor() {
    super();
    this.context = this.canvasController.getCtx();
    this.playToggle = this.renderPlayToggle();
    this.kick = new Drum(700, "triangle", 0.1, 0.1);
    this.snare = new Drum(600, "triangle", 0.1, 0.1);
    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    shadowRoot.append(this.buildTrackTable());
  }

  connectedCallback() {
    this.canvasController.resize();
    this.canvasController.draw(0, this.draw.bind(this));

    this.timer.draw(0, this.beatCallback.bind(this));
  }

  renderPlayToggle(): HTMLButtonElement {
    const playToggle = document.createElement("button");
    playToggle.innerText = "Start";
    playToggle.onclick = () => {
      this.play = !this.play;
      playToggle.innerText = `${this.play ? "Stop" : "Start"}`;
      playToggle.classList.toggle('is-playing')
    };

    return playToggle
  }

  buildTrackTable(): HTMLTableElement {
    for (let i = 60; i < 78; i++) {
      const track = new CsdSequencerTrack({ note: i });
      this.tracks.push(track);
    }


    const table = document.createElement("table");
    table.classList.add("csd-sequencer-step-table");
    const body = document.createElement("tbody");
    const head = document.createElement("thead");
    const canvasRow = document.createElement("tr");
    const canvasCell = document.createElement("td");
    canvasCell.setAttribute("colspan", "16");
    canvasCell.append(this.canvasController.getCanvasElement());
    const playCell = document.createElement("th");
    playCell.append(this.playToggle);
    canvasRow.append(playCell, canvasCell);
    head.append(canvasRow);

    this.tracks.filter((n) => n);
    body.append(
      ...this.tracks.map((track) => {
        return track.render();
      }),
    );
    table.append(head, body);

    return table;
  }

  private draw() {
    if (!this.context) {
      return;
    }

    this.context.save();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.frame % 2) {
      this.context.fillStyle = "#333433";
    } else {
      this.context.fillStyle = "#333433";
    }

    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.restore();
    this.frame++;
    this.drawRetangle(0);
    this.drawRetangle(1);
    this.drawRetangle(2);
    this.drawRetangle(3);

    this.drawRetangle(4);
    this.drawRetangle(5);
    this.drawRetangle(6);
    this.drawRetangle(7);

    this.drawRetangle(8);
    this.drawRetangle(9);
    this.drawRetangle(10);
    this.drawRetangle(11);

    this.drawRetangle(12);
    this.drawRetangle(13);
    this.drawRetangle(14);
    this.drawRetangle(15);
  }

  drawRetangle(number: number): void {
    if (!this.context) {
      return;
    }
    const xPosition = (this.canvas.width / 16) * number;

    if ((this.beat - number) % 16 !== 1) {
      this.context.fillStyle = "orchid";
    } else {
      this.context.fillStyle = "orange";
    }
    this.context.fillRect(
      xPosition,
      0,
      this.canvas.width / 16 + xPosition,
      this.canvas.height,
    );
  }

  beatCallback(): void {
    if (!this.play) return;
    this.tracks.map((track) => {
      if (track.track[this.beat % 16] === true) {
        track.play();
      }
    });

    this.beat++;
  }
}

// Define the new element
customElements.define("csd-sequencer", CsdSequencer);
