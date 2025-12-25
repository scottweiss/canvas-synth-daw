import { ADSR } from '../../audio/ADSR';
import { AudioEngine } from '../../audio/AudioEngine';
import { IModulationPatch, SynthPatch, ISynthPatchState } from '../../audio/SynthPatch';
import { CsdAdsr } from '../csd-adsr/csd-adsr';
import { CsdDrumKit } from '../csd-drum-kit/csd-drum-kit';
import { CsdEqualizer } from '../csd-equalizer/csd-equalizer';
import { CsdFilter } from '../csd-filter/csd-filter';
import { CsdKnob } from '../csd-knob/csd-knob';
import { CsdModulationMatrix } from '../csd-modulation-matrix/csd-modulation-matrix';
import { CsdMixer } from '../csd-mixer/csd-mixer';
import { CsdOscillatorPanel } from '../csd-oscillator-panel/csd-oscillator-panel';
import { CsdPiano } from '../csd-piano/csd-piano';
import { CsdRadioButtonGroup } from '../csd-radio-button-group/csd-radio-button-group';
import { CsdSequencer } from '../csd-sequencer/csd-sequencer';
import { CsdVisualizer } from '../csd-visualizer/csd-visualizer';
import styles from './csd-synth.scss?inline';

export class CsdSynth extends HTMLElement {
  private readonly audioEngine = AudioEngine.getInstance();
  private readonly patch: SynthPatch;
  private readonly shadowRootRef: ShadowRoot;

  private readonly visualizer = new CsdVisualizer();
  private readonly equalizer = new CsdEqualizer();
  private readonly sequencer = new CsdSequencer();
  private readonly drumKit = new CsdDrumKit();
  private readonly modulationMatrix = new CsdModulationMatrix();
  private readonly mixer = new CsdMixer();

  private readonly oscillatorPanels: CsdOscillatorPanel[] = [];
  private readonly filterControl = new CsdFilter();
  private readonly adsrRef: CsdAdsr;
  private readonly pianoRef: CsdPiano;

  private readonly masterVolumeKnob: CsdKnob;
  private readonly reverbMixKnob: CsdKnob;
  private readonly delayMixKnob: CsdKnob;
  private readonly delayTimeKnob: CsdKnob;
  private readonly delayFeedbackKnob: CsdKnob;
  private readonly filterEnvelopeAmount: CsdKnob;
  private readonly waveSelect: CsdRadioButtonGroup;

  constructor() {
    super();

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.shadowRootRef.adoptedStyleSheets.push(sheet);

    const existingPatch = this.audioEngine.getPatch();
    this.patch = existingPatch ?? new SynthPatch();

    const state = this.patch.getState();

    this.masterVolumeKnob = new CsdKnob({
      label: 'Master Volume',
      min: 0,
      max: 1,
      value: state.master.volume,
    });

    this.reverbMixKnob = new CsdKnob({
      label: 'Reverb Mix',
      min: 0,
      max: 1,
      value: state.effects.reverbMix,
    });

    this.delayMixKnob = new CsdKnob({
      label: 'Delay Mix',
      min: 0,
      max: 1,
      value: state.effects.delayMix,
    });

    this.delayTimeKnob = new CsdKnob({
      label: 'Delay Time',
      min: 0.05,
      max: 1.5,
      value: state.effects.delayTime,
      unit: 's',
    });

    this.delayFeedbackKnob = new CsdKnob({
      label: 'Delay FB',
      min: 0,
      max: 0.9,
      value: state.effects.delayFeedback,
    });

    this.filterEnvelopeAmount = new CsdKnob({
      label: 'Filter Env',
      min: 0,
      max: 1,
      value: state.filter.envelopeAmount,
    });

    this.waveSelect = new CsdRadioButtonGroup({
      id: 'wave-select',
      legend: 'Waveform',
      options: [
        { id: 'sawtooth', label: 'Saw' },
        { id: 'sine', label: 'Sine' },
        { id: 'square', label: 'Square' },
        { id: 'triangle', label: 'Triangle' },
      ],
      value: state.master.waveType,
    });

    // Envelope + piano reuse ADSR state from patch
    this.adsrRef = new CsdAdsr({ adsr: state.envelope });
    this.pianoRef = new CsdPiano();

    this.initializeOscillators(state);
    this.initializeFilter(state);
    this.modulationMatrix.setState(state.modulation);
    this.registerEventHandlers();

    const layout = this.buildLayout();
    this.shadowRootRef.append(layout);

    this.registerPatchSync();
  }

  private initializeOscillators(state: ISynthPatchState): void {
    this.oscillatorPanels.length = 0;
    state.oscillators.forEach((osc, index) => {
      const panel = new CsdOscillatorPanel({
        oscillatorIndex: index,
        initial: osc,
      });
      this.oscillatorPanels.push(panel);
    });
  }

  private initializeFilter(state: ISynthPatchState): void {
    this.filterControl.setFrequency(state.filter.frequency);
    this.filterControl.setResonance(state.filter.resonance);
    this.filterControl.setType(state.filter.type);
  }

  private buildLayout(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'synth-grid';

    wrapper.append(
      this.buildHeaderSection(),
      this.buildOscillatorSection(),
      this.buildFilterSection(),
      this.buildEnvelopeSection(),
      this.buildEffectsSection(),
      this.buildModulationSection(),
      this.buildMixerSection(),
      this.buildPerformanceSection(),
      this.buildAnalysisSection()
    );

    return wrapper;
  }

  private buildHeaderSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__header';
    section.append(this.waveSelect, this.masterVolumeKnob);
    return section;
  }

  private buildOscillatorSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__oscillators';

    const title = document.createElement('h2');
    title.textContent = 'Oscillators';
    section.append(title);

    const panelGroup = document.createElement('div');
    panelGroup.className = 'oscillator-grid';
    panelGroup.append(...this.oscillatorPanels);
    section.append(panelGroup);

    return section;
  }

  private buildFilterSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__filter';

    const title = document.createElement('h2');
    title.textContent = 'Filter';
    section.append(title, this.filterControl, this.filterEnvelopeAmount);

    return section;
  }

  private buildEnvelopeSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__envelope';

    const title = document.createElement('h2');
    title.textContent = 'Amplitude Envelope';
    section.append(title, this.adsrRef);

    return section;
  }

  private buildEffectsSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__effects';

    const title = document.createElement('h2');
    title.textContent = 'Effects';
    section.append(
      title,
      this.reverbMixKnob,
      this.delayMixKnob,
      this.delayTimeKnob,
      this.delayFeedbackKnob
    );

    return section;
  }

  private buildModulationSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__modulation';
    section.append(this.modulationMatrix);

    return section;
  }

  private buildMixerSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__mixer';
    const title = document.createElement('h2');
    title.textContent = 'Mixer';
    section.append(title, this.mixer);
    return section;
  }

  private buildPerformanceSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__performance';

    const title = document.createElement('h2');
    title.textContent = 'Performance';

    section.append(title, this.pianoRef, this.drumKit, this.sequencer);

    return section;
  }

  private buildAnalysisSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'synth-section synth-section__analysis';

    const title = document.createElement('h2');
    title.textContent = 'Analysis';

    section.append(title, this.visualizer, this.equalizer);

    return section;
  }

  private registerEventHandlers(): void {
    this.waveSelect.addEventListener('CsdRadioButtonGroupValueChange', (event) => {
      const value = (event as CustomEvent).detail.value as OscillatorType;
      this.patch.updateMaster({ waveType: value });
    });

    this.masterVolumeKnob.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateMaster({ volume: value });
    });

    this.reverbMixKnob.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateEffects({ reverbMix: value });
    });

    this.delayMixKnob.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateEffects({ delayMix: value });
    });

    this.delayTimeKnob.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateEffects({ delayTime: value });
    });

    this.delayFeedbackKnob.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateEffects({ delayFeedback: value });
    });

    this.filterEnvelopeAmount.addEventListener('change', (event) => {
      const value = (event as CustomEvent).detail.value;
      this.patch.updateFilter({ envelopeAmount: value });
    });

    this.filterControl.addEventListener('filterChange', (event) => {
      const { frequency, resonance, type } = (event as CustomEvent).detail;
      this.patch.updateFilter({ frequency, resonance, type });
    });

    this.adsrRef.addEventListener('CsdAdsr', (event) => {
      const adsr = (event as CustomEvent).detail.adsr;
      this.patch.updateEnvelope(adsr);
    });

    this.oscillatorPanels.forEach((panel) => {
      panel.addEventListener('oscillatorChange', (event) => {
        const detail = (event as CustomEvent).detail;
        this.patch.updateOscillator(detail.index, detail.settings);
      });
    });

    this.modulationMatrix.addEventListener('modulationChange', (event) => {
      const detail = (event as CustomEvent).detail as IModulationPatch;
      this.patch.updateModulation(detail);
    });
  }

  private registerPatchSync(): void {
    this.patch.on('master', (master) => {
      if (this.waveSelect.value !== master.waveType) {
        this.waveSelect.value = master.waveType;
      }
      if (Math.abs(this.masterVolumeKnob.value - master.volume) > 0.001) {
        this.masterVolumeKnob.value = master.volume;
      }
    });

    this.patch.on('effects', (effects) => {
      if (Math.abs(this.reverbMixKnob.value - effects.reverbMix) > 0.001) {
        this.reverbMixKnob.value = effects.reverbMix;
      }
      if (Math.abs(this.delayMixKnob.value - effects.delayMix) > 0.001) {
        this.delayMixKnob.value = effects.delayMix;
      }
      if (Math.abs(this.delayTimeKnob.value - effects.delayTime) > 0.001) {
        this.delayTimeKnob.value = effects.delayTime;
      }
      if (Math.abs(this.delayFeedbackKnob.value - effects.delayFeedback) > 0.001) {
        this.delayFeedbackKnob.value = effects.delayFeedback;
      }
    });

    this.patch.on('filter', (filter) => {
      if (Math.abs(this.filterEnvelopeAmount.value - filter.envelopeAmount) > 0.001) {
        this.filterEnvelopeAmount.value = filter.envelopeAmount;
      }
      this.filterControl.setFrequency(filter.frequency);
      this.filterControl.setResonance(filter.resonance);
      this.filterControl.setType(filter.type);
    });

    this.patch.on('oscillators', (oscillators) => {
      oscillators.forEach((osc, index) => {
        const panel = this.oscillatorPanels[index];
        if (!panel) return;
        panel.setSettings(osc);
      });
    });

    this.patch.on('envelope', (envelope) => {
      ADSR.getInstance().adsr = envelope;
    });

    this.patch.on('modulation', (modulation) => {
      this.modulationMatrix.setState(modulation);
    });
  }
}

customElements.define('csd-synth', CsdSynth);
