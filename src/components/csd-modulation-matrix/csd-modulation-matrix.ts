import { LFOWaveform } from '../../audio/LFO';
import { IModulationPatch } from '../../audio/SynthPatch';
import { CsdKnob } from '../csd-knob/csd-knob';
import styles from './csd-modulation-matrix.scss?inline';

export interface IModulationMatrixState {
  lfoRate: number;
  waveform: LFOWaveform;
  pitchAmount: number;
  filterAmount: number;
}

const defaultState: IModulationMatrixState = {
  lfoRate: 2,
  waveform: 'sine',
  pitchAmount: 0,
  filterAmount: 0,
};

export class CsdModulationMatrix extends HTMLElement {
  private rateKnob: CsdKnob;
  private pitchKnob: CsdKnob;
  private filterKnob: CsdKnob;
  private waveformSelect: HTMLSelectElement;
  private state: IModulationMatrixState;
  private isApplyingPatch: boolean = false;

  constructor(initialState?: Partial<IModulationMatrixState>) {
    super();

    this.state = {
      ...defaultState,
      ...initialState,
    };

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    this.waveformSelect = this.createWaveformSelect();
    this.rateKnob = new CsdKnob({
      label: 'LFO Rate',
      min: 0.1,
      max: 12,
      value: this.state.lfoRate,
      unit: 'Hz',
    });

    this.pitchKnob = new CsdKnob({
      label: 'Pitch Amt',
      min: -1,
      max: 1,
      value: this.state.pitchAmount,
    });

    this.filterKnob = new CsdKnob({
      label: 'Filter Amt',
      min: -1,
      max: 1,
      value: this.state.filterAmount,
    });

    const container = document.createElement('div');
    container.className = 'modulation-container';

    const header = document.createElement('div');
    header.className = 'modulation-header';
    const title = document.createElement('h2');
    title.textContent = 'Modulation';
    header.append(title, this.waveformSelect);

    const knobRow = document.createElement('div');
    knobRow.className = 'modulation-knobs';
    knobRow.append(this.rateKnob, this.pitchKnob, this.filterKnob);

    container.append(header, knobRow);
    shadowRoot.append(container);

    this.registerListeners();
  }

  private createWaveformSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'waveform-select';
    const options: LFOWaveform[] = ['sine', 'triangle', 'square', 'sawtooth'];
    options.forEach((wave) => {
      const option = document.createElement('option');
      option.value = wave;
      option.textContent = wave;
      select.appendChild(option);
    });
    select.value = this.state.waveform;
    return select;
  }

  private registerListeners(): void {
    this.waveformSelect.addEventListener('change', () => {
      this.state.waveform = this.waveformSelect.value as LFOWaveform;
      this.emitChange();
    });

    this.rateKnob.addEventListener('change', (event) => {
      this.state.lfoRate = (event as CustomEvent).detail.value;
      this.emitChange();
    });

    this.pitchKnob.addEventListener('change', (event) => {
      this.state.pitchAmount = (event as CustomEvent).detail.value;
      this.emitChange();
    });

    this.filterKnob.addEventListener('change', (event) => {
      this.state.filterAmount = (event as CustomEvent).detail.value;
      this.emitChange();
    });
  }

  setState(state: IModulationPatch): void {
    this.isApplyingPatch = true;
    this.state = { ...state };
    if (this.waveformSelect.value !== state.waveform) {
      this.waveformSelect.value = state.waveform;
    }
    if (Math.abs(this.rateKnob.value - state.lfoRate) > 0.001) {
      this.rateKnob.value = state.lfoRate;
    }
    if (Math.abs(this.pitchKnob.value - state.pitchAmount) > 0.001) {
      this.pitchKnob.value = state.pitchAmount;
    }
    if (Math.abs(this.filterKnob.value - state.filterAmount) > 0.001) {
      this.filterKnob.value = state.filterAmount;
    }
    this.isApplyingPatch = false;
  }

  private emitChange(): void {
    if (this.isApplyingPatch) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('modulationChange', {
        detail: { ...this.state },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define('csd-modulation-matrix', CsdModulationMatrix);
