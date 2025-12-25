import { Transport } from '../../audio/Transport';
import styles from './csd-transport-bar.scss?inline';
import '../csd-view-toggle/csd-view-toggle';

export class CsdTransportBar extends HTMLElement {
  private transport: Transport;
  private playButton: HTMLButtonElement;
  private bpmInput: HTMLInputElement;
  private positionDisplay: HTMLSpanElement;
  private shadowRootRef: ShadowRoot;

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.transport = Transport.getInstance();

    // Create elements
    this.playButton = document.createElement('button');
    this.bpmInput = document.createElement('input');
    this.positionDisplay = document.createElement('span');

    this.render();
    this.attachEventListeners();
  }

  connectedCallback(): void {
    // Subscribe to transport changes
    this.transport.onStateChange(this.handleTransportStateChange.bind(this));
    this.transport.onBpmChange(this.handleBpmChange.bind(this));
    this.transport.onTick(this.handleTick.bind(this));

    // Initialize state
    this.updatePlayButton(this.transport.isPlaying());
    this.bpmInput.value = this.transport.getBpm().toString();
    this.updatePosition(0);
  }

  private render(): void {
    // Create style element
    const style = document.createElement('style');
    style.textContent = styles;

    // Build HTML structure
    const container = document.createElement('div');
    container.className = 'transport-bar';

    // Transport controls section
    const controlsSection = document.createElement('div');
    controlsSection.className = 'transport-controls';

    this.playButton.className = 'play-button';
    this.playButton.innerHTML = '▶';
    this.playButton.title = 'Play/Stop (Space)';

    const stopButton = document.createElement('button');
    stopButton.className = 'stop-button';
    stopButton.innerHTML = '■';
    stopButton.title = 'Stop';
    stopButton.addEventListener('click', () => {
      this.transport.stop();
      this.transport.setPosition(0);
    });

    controlsSection.appendChild(this.playButton);
    controlsSection.appendChild(stopButton);

    // View toggle section
    const viewToggle = document.createElement('csd-view-toggle');
    viewToggle.className = 'view-toggle-wrapper';

    // BPM section
    const bpmSection = document.createElement('div');
    bpmSection.className = 'bpm-section';

    const bpmLabel = document.createElement('label');
    bpmLabel.textContent = 'BPM';
    bpmLabel.className = 'bpm-label';

    this.bpmInput.type = 'number';
    this.bpmInput.min = '40';
    this.bpmInput.max = '240';
    this.bpmInput.step = '1';
    this.bpmInput.className = 'bpm-input';
    this.bpmInput.value = '120';

    bpmSection.appendChild(bpmLabel);
    bpmSection.appendChild(this.bpmInput);

    // Position display section
    const positionSection = document.createElement('div');
    positionSection.className = 'position-section';

    const positionLabel = document.createElement('label');
    positionLabel.textContent = 'Position';
    positionLabel.className = 'position-label';

    this.positionDisplay.className = 'position-display';
    this.positionDisplay.textContent = '1.1.0';

    positionSection.appendChild(positionLabel);
    positionSection.appendChild(this.positionDisplay);

    // Assemble
    container.appendChild(controlsSection);
    container.appendChild(viewToggle);
    container.appendChild(bpmSection);
    container.appendChild(positionSection);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(container);
  }

  private attachEventListeners(): void {
    this.playButton.addEventListener('click', () => {
      this.transport.toggle();
    });

    this.bpmInput.addEventListener('change', () => {
      const bpm = parseInt(this.bpmInput.value, 10);
      if (!isNaN(bpm) && bpm >= 40 && bpm <= 240) {
        this.transport.setBpm(bpm);
      } else {
        this.bpmInput.value = this.transport.getBpm().toString();
      }
    });

    this.bpmInput.addEventListener('input', () => {
      const bpm = parseInt(this.bpmInput.value, 10);
      if (!isNaN(bpm) && bpm >= 40 && bpm <= 240) {
        this.transport.setBpm(bpm);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        this.transport.toggle();
      }
    });
  }

  private handleTransportStateChange(isPlaying: boolean): void {
    this.updatePlayButton(isPlaying);
  }

  private handleBpmChange(bpm: number): void {
    if (document.activeElement !== this.bpmInput) {
      this.bpmInput.value = bpm.toString();
    }
  }

  private handleTick(tick: number): void {
    this.updatePosition(tick);
  }

  private updatePlayButton(isPlaying: boolean): void {
    if (isPlaying) {
      this.playButton.innerHTML = '⏸';
      this.playButton.classList.add('playing');
      this.playButton.title = 'Pause (Space)';
    } else {
      this.playButton.innerHTML = '▶';
      this.playButton.classList.remove('playing');
      this.playButton.title = 'Play (Space)';
    }
  }

  private updatePosition(tick: number): void {
    // Convert tick (0-15) to bars:beats:ticks
    // For now, simple display: bar 1, beat 1-4, tick within beat
    const beat = Math.floor(tick / 4) + 1;
    const subTick = tick % 4;
    this.positionDisplay.textContent = `1.${beat}.${subTick}`;
  }
}

customElements.define('csd-transport-bar', CsdTransportBar);
