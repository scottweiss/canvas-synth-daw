import { Transport } from '../../audio/Transport';
import { CanvasController } from '../../canvas/CanvasController';
import { Drum } from '../../midi/Drum';
import { CsdRange } from '../csd-range/csd-range';
import { CsdSequencerTrack } from './csd-sequencer-track/csd-sequencer-track';
import styles from './csd-sequencer.scss?inline';

const TOTAL_STEPS = 16;

export class CsdSequencer extends HTMLElement {
  private readonly transport: Transport = Transport.getInstance();
  private readonly canvasController: CanvasController = new CanvasController();
  private readonly canvas: HTMLCanvasElement = this.canvasController.getCanvasElement();
  private readonly context: CanvasRenderingContext2D | null = this.canvasController.getCtx();
  private readonly kick: Drum = new Drum(30, 'square', 0.1, 0.1);
  private readonly snare: Drum = new Drum(600, 'triangle', 0.1, 0.1);
  private readonly tracks: Array<CsdSequencerTrack> = [];

  private playToggle: HTMLButtonElement;
  private bpmRange: CsdRange;
  private currentTick: number = 0;
  private tickUnsubscribe: (() => void) | null = null;
  private stateUnsubscribe: (() => void) | null = null;
  private bpmUnsubscribe: (() => void) | null = null;

  constructor() {
    super();

    this.playToggle = this.renderPlayToggle();
    this.updatePlayToggleState(this.transport.isPlaying());

    this.bpmRange = new CsdRange({
      label: 'bpm',
      min: 24,
      max: 250,
      stepSize: 1,
      value: this.transport.getBpm(),
    });

    this.bpmRange.addEventListener('csdRange', (event) => {
      const newValue = (event as CustomEvent).detail.value;
      if (newValue == null) {
        return;
      }
      this.transport.setBpm(newValue);
    });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    shadowRoot.append(this.bpmRange, this.buildTrackTable());
  }

  connectedCallback(): void {
    this.canvasController.resize();
    this.canvasController.draw(0, this.draw.bind(this));

    this.tickUnsubscribe = this.transport.onTick(this.handleTick);
    this.stateUnsubscribe = this.transport.onStateChange(this.updatePlayToggleState);
    this.bpmUnsubscribe = this.transport.onBpmChange((bpm) => {
      if (this.bpmRange.value !== bpm) {
        this.bpmRange.value = bpm;
      }
    });
    this.updatePlayToggleState(this.transport.isPlaying());
  }

  disconnectedCallback(): void {
    this.tickUnsubscribe?.();
    this.stateUnsubscribe?.();
    this.bpmUnsubscribe?.();
    this.tickUnsubscribe = null;
    this.stateUnsubscribe = null;
    this.bpmUnsubscribe = null;
  }

  private renderPlayToggle(): HTMLButtonElement {
    const playToggle = document.createElement('button');
    playToggle.addEventListener('click', () => {
      this.transport.toggle();
    });
    return playToggle;
  }

  private updatePlayToggleState = (isRunning: boolean): void => {
    this.playToggle.innerText = isRunning ? 'Stop' : 'Start';
    this.playToggle.classList.toggle('is-playing', isRunning);
  };

  private buildTrackTable(): HTMLTableElement {
    if (this.tracks.length === 0) {
      const kickTrack = new CsdSequencerTrack({ note: 'kick', drum: this.kick });
      const snareTrack = new CsdSequencerTrack({ note: 'snare', drum: this.snare });
      this.tracks.push(kickTrack, snareTrack);
      for (let midi = 60; midi < 78; midi++) {
        this.tracks.push(new CsdSequencerTrack({ note: midi }));
      }
    }

    const table = document.createElement('table');
    table.classList.add('csd-sequencer-step-table');

    const head = document.createElement('thead');
    const canvasRow = document.createElement('tr');
    const playCell = document.createElement('th');
    playCell.append(this.playToggle);
    const canvasCell = document.createElement('td');
    canvasCell.setAttribute('colspan', TOTAL_STEPS.toString());
    canvasCell.append(this.canvas);
    canvasRow.append(playCell, canvasCell);
    head.append(canvasRow);

    const body = document.createElement('tbody');
    body.append(...this.tracks.map((track) => track.render()));

    table.append(head, body);
    return table;
  }

  private handleTick = (tick: number): void => {
    this.currentTick = tick % TOTAL_STEPS;
    const bpm = this.transport.getBpm();

    this.tracks.forEach((track) => {
      if (track.isStepActive(this.currentTick)) {
        track.trigger(bpm);
      }
    });
  };

  private draw(): void {
    const ctx = this.context;
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let step = 0; step < TOTAL_STEPS; step++) {
      const xPosition = (this.canvas.width / TOTAL_STEPS) * step;
      ctx.fillStyle = step === this.currentTick ? 'orange' : 'orchid';
      ctx.fillRect(xPosition, 0, this.canvas.width / TOTAL_STEPS, this.canvas.height);
    }
  }
}

// Define the new element
customElements.define('csd-sequencer', CsdSequencer);
