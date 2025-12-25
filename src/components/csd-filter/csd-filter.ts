import { CsdKnob } from '../csd-knob/csd-knob';
import styles from './csd-filter.scss?inline';

export class CsdFilter extends HTMLElement {
  private frequencyKnob: CsdKnob;
  private resonanceKnob: CsdKnob;
  private typeSelect: HTMLSelectElement;
  
  constructor() {
    super();
    
    this.frequencyKnob = new CsdKnob({
      label: 'Frequency',
      min: 20,
      max: 20000,
      value: 1000,
      unit: 'Hz'
    });
    
    this.resonanceKnob = new CsdKnob({
      label: 'Resonance',
      min: 0.1,
      max: 30,
      value: 1
    });
    
    this.typeSelect = document.createElement('select');
    ['lowpass', 'highpass', 'bandpass', 'notch'].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      this.typeSelect.appendChild(option);
    });
    
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);
    
    const container = document.createElement('div');
    container.className = 'filter-controls';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Filter Type';
    typeLabel.appendChild(this.typeSelect);
    
    container.append(typeLabel, this.frequencyKnob, this.resonanceKnob);
    shadowRoot.appendChild(container);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    const dispatchChange = (): void => {
      this.dispatchEvent(new CustomEvent('filterChange', {
        detail: {
          frequency: this.frequencyKnob.value,
          resonance: this.resonanceKnob.value,
          type: this.typeSelect.value as BiquadFilterType
        }
      }));
    };
    
    this.frequencyKnob.addEventListener('change', dispatchChange);
    this.resonanceKnob.addEventListener('change', dispatchChange);
    this.typeSelect.addEventListener('change', dispatchChange);
  }

  setFrequency(value: number): void {
    if (Math.abs(this.frequencyKnob.value - value) > 0.5) {
      this.frequencyKnob.value = value;
    }
  }

  setResonance(value: number): void {
    if (Math.abs(this.resonanceKnob.value - value) > 0.01) {
      this.resonanceKnob.value = value;
    }
  }

  setType(type: BiquadFilterType): void {
    if (this.typeSelect.value !== type) {
      this.typeSelect.value = type;
    }
  }
}

customElements.define('csd-filter', CsdFilter);
