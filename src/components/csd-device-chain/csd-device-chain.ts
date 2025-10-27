import { TrackManager, ITrack } from '../../audio/TrackManager';
import { SynthPatch } from '../../audio/SynthPatch';
import { CsdKnob } from '../csd-knob/csd-knob';
import { CsdFilter } from '../csd-filter/csd-filter';
import { CsdAdsr } from '../csd-adsr/csd-adsr';
import { CsdOscillatorPanel } from '../csd-oscillator-panel/csd-oscillator-panel';
import { CsdModulationMatrix } from '../csd-modulation-matrix/csd-modulation-matrix';
import styles from './csd-device-chain.scss?inline';

export class CsdDeviceChain extends HTMLElement {
  private trackManager: TrackManager;
  private shadowRoot: ShadowRoot;
  private currentTrack: ITrack | null = null;
  private currentPatch: SynthPatch | null = null;

  // Device components
  private oscillatorPanels: CsdOscillatorPanel[] = [];
  private filterControl: CsdFilter = new CsdFilter();
  private adsrControl: CsdAdsr;
  private modulationMatrix: CsdModulationMatrix = new CsdModulationMatrix();

  // Effect knobs
  private reverbMixKnob!: CsdKnob;
  private delayMixKnob!: CsdKnob;
  private delayTimeKnob!: CsdKnob;
  private delayFeedbackKnob!: CsdKnob;

  // Device sections
  private sectionsState: Map<string, boolean> = new Map([
    ['oscillators', true],
    ['filter', true],
    ['envelope', true],
    ['effects', false],
    ['modulation', false]
  ]);

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.trackManager = TrackManager.getInstance();

    // Initialize ADSR with default values
    this.adsrControl = new CsdAdsr({
      adsr: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.4,
        release: 0.3
      }
    });

    this.render();
    this.attachEventListeners();
  }

  connectedCallback(): void {
    // Subscribe to track changes
    this.trackManager.on('trackSelected', this.handleTrackSelected.bind(this));

    // Initialize with current track
    const track = this.trackManager.getSelectedTrack();
    if (track) {
      this.loadTrack(track);
    }
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'device-chain';

    // Oscillators Section
    const oscillatorsSection = this.createDeviceSection(
      'oscillators',
      'Oscillators',
      this.buildOscillatorsContent()
    );

    // Filter Section
    const filterSection = this.createDeviceSection(
      'filter',
      'Filter',
      this.buildFilterContent()
    );

    // Envelope Section
    const envelopeSection = this.createDeviceSection(
      'envelope',
      'Envelope',
      this.buildEnvelopeContent()
    );

    // Effects Section
    const effectsSection = this.createDeviceSection(
      'effects',
      'Effects',
      this.buildEffectsContent()
    );

    // Modulation Section
    const modulationSection = this.createDeviceSection(
      'modulation',
      'Modulation',
      this.buildModulationContent()
    );

    container.appendChild(oscillatorsSection);
    container.appendChild(filterSection);
    container.appendChild(envelopeSection);
    container.appendChild(effectsSection);
    container.appendChild(modulationSection);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  private createDeviceSection(id: string, title: string, content: HTMLElement): HTMLElement {
    const section = document.createElement('div');
    section.className = 'device-section';
    section.dataset.deviceId = id;

    const header = document.createElement('div');
    header.className = 'device-header';
    header.addEventListener('click', () => this.toggleSection(id));

    const titleEl = document.createElement('h4');
    titleEl.textContent = title;

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▼';

    header.appendChild(titleEl);
    header.appendChild(chevron);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'device-content';
    contentWrapper.appendChild(content);

    // Set initial collapsed state
    if (!this.sectionsState.get(id)) {
      section.classList.add('collapsed');
    }

    section.appendChild(header);
    section.appendChild(contentWrapper);

    return section;
  }

  private buildOscillatorsContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'oscillators-grid';

    // Create 3 oscillator panels
    for (let i = 0; i < 3; i++) {
      const panel = new CsdOscillatorPanel({
        oscillatorIndex: i,
        initial: {
          type: 'sawtooth',
          detune: 0,
          octave: 0,
          level: 0.5
        }
      });
      this.oscillatorPanels.push(panel);
      content.appendChild(panel);
    }

    return content;
  }

  private buildFilterContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'filter-content';
    content.appendChild(this.filterControl);
    return content;
  }

  private buildEnvelopeContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'envelope-content';
    content.appendChild(this.adsrControl);
    return content;
  }

  private buildEffectsContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'effects-grid';

    this.reverbMixKnob = new CsdKnob({
      label: 'Reverb Mix',
      min: 0,
      max: 1,
      value: 0.3
    });

    this.delayMixKnob = new CsdKnob({
      label: 'Delay Mix',
      min: 0,
      max: 1,
      value: 0.2
    });

    this.delayTimeKnob = new CsdKnob({
      label: 'Delay Time',
      min: 0.05,
      max: 1.5,
      value: 0.25,
      unit: 's'
    });

    this.delayFeedbackKnob = new CsdKnob({
      label: 'Delay FB',
      min: 0,
      max: 0.9,
      value: 0.4
    });

    content.appendChild(this.reverbMixKnob);
    content.appendChild(this.delayMixKnob);
    content.appendChild(this.delayTimeKnob);
    content.appendChild(this.delayFeedbackKnob);

    return content;
  }

  private buildModulationContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'modulation-content';
    content.appendChild(this.modulationMatrix);
    return content;
  }

  private toggleSection(id: string): void {
    const section = this.shadowRoot.querySelector(`[data-device-id="${id}"]`);
    if (!section) return;

    const isCollapsed = section.classList.toggle('collapsed');
    this.sectionsState.set(id, !isCollapsed);
  }

  private attachEventListeners(): void {
    // Oscillator events
    this.oscillatorPanels.forEach((panel, index) => {
      panel.addEventListener('oscillatorChange', ((e: CustomEvent) => {
        if (this.currentPatch) {
          this.currentPatch.updateOscillator(index, e.detail.settings);
        }
      }) as EventListener);
    });

    // Filter events
    this.filterControl.addEventListener('filterChange', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateFilter(e.detail);
      }
    }) as EventListener);

    // ADSR events
    this.adsrControl.addEventListener('CsdAdsr', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateEnvelope(e.detail.adsr);
      }
    }) as EventListener);

    // Effects events
    this.reverbMixKnob.addEventListener('change', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateEffects({ reverbMix: e.detail.value });
      }
    }) as EventListener);

    this.delayMixKnob.addEventListener('change', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateEffects({ delayMix: e.detail.value });
      }
    }) as EventListener);

    this.delayTimeKnob.addEventListener('change', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateEffects({ delayTime: e.detail.value });
      }
    }) as EventListener);

    this.delayFeedbackKnob.addEventListener('change', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateEffects({ delayFeedback: e.detail.value });
      }
    }) as EventListener);

    // Modulation events
    this.modulationMatrix.addEventListener('modulationChange', ((e: CustomEvent) => {
      if (this.currentPatch) {
        this.currentPatch.updateModulation(e.detail);
      }
    }) as EventListener);
  }

  private handleTrackSelected(track: ITrack): void {
    this.loadTrack(track);
  }

  private loadTrack(track: ITrack): void {
    this.currentTrack = track;
    this.currentPatch = track.patch;

    const state = track.patch.getState();

    // Update oscillator panels
    this.oscillatorPanels.forEach((panel, index) => {
      const oscState = state.oscillators[index];
      if (oscState) {
        panel.setSettings(oscState);
      }
    });

    // Update filter
    this.filterControl.setFrequency(state.filter.frequency);
    this.filterControl.setResonance(state.filter.resonance);
    this.filterControl.setType(state.filter.type);

    // Update envelope
    this.adsrControl.setAdsr(state.envelope);

    // Update effects
    this.reverbMixKnob.value = state.effects.reverbMix;
    this.delayMixKnob.value = state.effects.delayMix;
    this.delayTimeKnob.value = state.effects.delayTime;
    this.delayFeedbackKnob.value = state.effects.delayFeedback;

    // Update modulation
    this.modulationMatrix.setState(state.modulation);
  }
}

customElements.define('csd-device-chain', CsdDeviceChain);
