import { CsdKnob } from '../csd-knob/csd-knob';
import { IOscillatorPatch } from '../../audio/SynthPatch';
import styles from './csd-oscillator-panel.scss?inline';

export interface ICsdOscillatorPanelProps {
  oscillatorIndex: number;
  initial?: IOscillatorPatch;
  label?: string;
}

export class CsdOscillatorPanel extends HTMLElement {
  private oscillatorIndex: number;
  private waveformSelect: HTMLSelectElement;
  private octaveKnob: CsdKnob;
  private detuneKnob: CsdKnob;
  private levelKnob: CsdKnob;
  private pendingFrame: number | null = null;
  private labelText: string;
  private settings: IOscillatorPatch;
  
  constructor(props: ICsdOscillatorPanelProps) {
    super();
    
    this.oscillatorIndex = props.oscillatorIndex;
    this.settings = props.initial ?? {
      type: 'sawtooth',
      detune: 0,
      octave: 0,
      level: 0.5,
    };
    this.labelText = props.label ?? `Oscillator ${this.oscillatorIndex + 1}`;
    
    // Create controls
    this.waveformSelect = document.createElement('select');
    ['sine', 'square', 'sawtooth', 'triangle'].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      this.waveformSelect.appendChild(option);
    });
    this.waveformSelect.value = this.settings.type;

    this.octaveKnob = new CsdKnob({
      label: 'Octave',
      min: -2,
      max: 2,
      value: this.settings.octave,
      stepSize: 1,
    });

    this.detuneKnob = new CsdKnob({
      label: 'Detune',
      min: -50,
      max: 50,
      value: this.settings.detune,
      unit: 'c'
    });

    this.levelKnob = new CsdKnob({
      label: 'Level',
      min: 0,
      max: 1,
      value: this.settings.level
    });
    
    // Setup shadow DOM
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'oscillator-panel';
    
    const header = document.createElement('h3');
    header.textContent = this.labelText;
    
    const waveLabel = document.createElement('label');
    waveLabel.textContent = 'Waveform';
    waveLabel.appendChild(this.waveformSelect);
    
    container.append(
      header,
      waveLabel,
      this.octaveKnob,
      this.detuneKnob,
      this.levelKnob
    );
    
    shadowRoot.appendChild(container);
    
    // Event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const schedule = (): void => this.scheduleDispatch();

    this.waveformSelect.addEventListener('change', schedule);
    this.octaveKnob.addEventListener('change', schedule);
    this.detuneKnob.addEventListener('change', schedule);
    this.levelKnob.addEventListener('change', schedule);
  }

  setSettings(settings: IOscillatorPatch): void {
    this.settings = { ...settings };
    if (this.waveformSelect.value !== settings.type) {
      this.waveformSelect.value = settings.type;
    }
    if (this.octaveKnob.value !== settings.octave) {
      this.octaveKnob.value = settings.octave;
    }
    if (this.detuneKnob.value !== settings.detune) {
      this.detuneKnob.value = settings.detune;
    }
    if (Math.abs(this.levelKnob.value - settings.level) > 0.001) {
      this.levelKnob.value = settings.level;
    }
  }

  private scheduleDispatch(): void {
    if (this.pendingFrame) {
      cancelAnimationFrame(this.pendingFrame);
    }
    this.pendingFrame = requestAnimationFrame(() => {
      this.pendingFrame = null;
      this.dispatchEvent(new CustomEvent('oscillatorChange', {
        detail: {
          index: this.oscillatorIndex,
          settings: {
            type: this.waveformSelect.value as OscillatorType,
            octave: this.octaveKnob.value,
            detune: this.detuneKnob.value,
            level: this.levelKnob.value,
          },
        },
        bubbles: true,
        composed: true,
      }));
    });
  }
}

customElements.define('csd-oscillator-panel', CsdOscillatorPanel);
