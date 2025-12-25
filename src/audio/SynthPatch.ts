import { FilterType } from './Filter';
import { IAdsr } from './ADSR';
import { LFOWaveform } from './LFO';

export interface IOscillatorPatch {
  type: OscillatorType;
  detune: number;
  octave: number;
  level: number;
}

export interface IFilterPatch {
  type: FilterType;
  frequency: number;
  resonance: number;
  envelopeAmount: number;
}

export interface IEffectsPatch {
  reverbMix: number;
  delayMix: number;
  delayTime: number;
  delayFeedback: number;
}

export interface IMasterPatch {
  volume: number;
  waveType: OscillatorType;
}

export type ModDestination = 'pitch' | 'filter';

export interface IModulationPatch {
  lfoRate: number;
  waveform: LFOWaveform;
  pitchAmount: number;
  filterAmount: number;
}

export interface ISynthPatchState {
  oscillators: IOscillatorPatch[];
  filter: IFilterPatch;
  envelope: IAdsr;
  effects: IEffectsPatch;
  master: IMasterPatch;
  modulation: IModulationPatch;
}

type PatchListener<T> = (value: T) => void;

type PatchSection = keyof ISynthPatchState;

type SectionListeners = {
  [K in PatchSection]: Set<PatchListener<ISynthPatchState[K]>>;
};

const defaultState: ISynthPatchState = {
  oscillators: [
    { type: 'sawtooth', detune: 0, octave: 0, level: 0.5 },
    { type: 'square', detune: -5, octave: -1, level: 0.3 },
    { type: 'triangle', detune: 7, octave: 1, level: 0.2 },
  ],
  filter: {
    type: 'lowpass',
    frequency: 1000,
    resonance: 1,
    envelopeAmount: 0.5,
  },
  envelope: {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.4,
    release: 0.3,
  },
  effects: {
    reverbMix: 0.3,
    delayMix: 0.2,
    delayTime: 0.25,
    delayFeedback: 0.4,
  },
  master: {
    volume: 0.7,
    waveType: 'sawtooth',
  },
  modulation: {
    lfoRate: 2,
    waveform: 'sine',
    pitchAmount: 0,
    filterAmount: 0,
  },
};

export class SynthPatch {
  private state: ISynthPatchState;
  private listeners: SectionListeners;

  constructor(initialState: Partial<ISynthPatchState> = {}) {
    this.state = {
      ...defaultState,
      ...initialState,
      oscillators: initialState.oscillators ?? [...defaultState.oscillators],
      filter: { ...defaultState.filter, ...initialState.filter },
      envelope: { ...defaultState.envelope, ...initialState.envelope },
      effects: { ...defaultState.effects, ...initialState.effects },
      master: { ...defaultState.master, ...initialState.master },
      modulation: { ...defaultState.modulation, ...initialState.modulation },
    };

    this.listeners = {
      oscillators: new Set(),
      filter: new Set(),
      envelope: new Set(),
      effects: new Set(),
      master: new Set(),
      modulation: new Set(),
    };
  }

  getState(): ISynthPatchState {
    return {
      oscillators: this.state.oscillators.map((osc) => ({ ...osc })),
      filter: { ...this.state.filter },
      envelope: { ...this.state.envelope },
      effects: { ...this.state.effects },
      master: { ...this.state.master },
      modulation: { ...this.state.modulation },
    };
  }

  getSection<K extends PatchSection>(section: K): ISynthPatchState[K] {
    const value = this.state[section];
    return Array.isArray(value)
      ? (value.map((item) => ({ ...item })) as ISynthPatchState[K])
      : ({ ...value } as ISynthPatchState[K]);
  }

  on<K extends PatchSection>(
    section: K,
    listener: PatchListener<ISynthPatchState[K]>
  ): () => void {
    const listeners = this.listeners[section];
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  off<K extends PatchSection>(
    section: K,
    listener: PatchListener<ISynthPatchState[K]>
  ): void {
    const listeners = this.listeners[section];
    listeners.delete(listener);
  }

  updateOscillator(index: number, patch: Partial<IOscillatorPatch>): void {
    if (!this.state.oscillators[index]) {
      return;
    }
    const next = {
      ...this.state.oscillators[index],
      ...patch,
    };
    this.state = {
      ...this.state,
      oscillators: this.state.oscillators.map((osc, i) =>
        i === index ? next : osc
      ),
    };
    this.emit('oscillators');
  }

  updateFilter(patch: Partial<IFilterPatch>): void {
    this.state = {
      ...this.state,
      filter: {
        ...this.state.filter,
        ...patch,
      },
    };
    this.emit('filter');
  }

  updateEnvelope(patch: Partial<IAdsr>): void {
    this.state = {
      ...this.state,
      envelope: {
        ...this.state.envelope,
        ...patch,
      },
    };
    this.emit('envelope');
  }

  updateEffects(patch: Partial<IEffectsPatch>): void {
    this.state = {
      ...this.state,
      effects: {
        ...this.state.effects,
        ...patch,
      },
    };
    this.emit('effects');
  }

  updateMaster(patch: Partial<IMasterPatch>): void {
    this.state = {
      ...this.state,
      master: {
        ...this.state.master,
        ...patch,
      },
    };
    this.emit('master');
  }

  updateModulation(patch: Partial<IModulationPatch>): void {
    this.state = {
      ...this.state,
      modulation: {
        ...this.state.modulation,
        ...patch,
      },
    };
    this.emit('modulation');
  }

  private emit<K extends PatchSection>(section: K): void {
    const listeners = this.listeners[section];
    const payload = this.getSection(section);
    listeners.forEach((listener) => listener(payload));
  }
}

export function createSynthPatch(
  initialState: Partial<ISynthPatchState> = {}
): SynthPatch {
  return new SynthPatch(initialState);
}

export function getDefaultPatchState(): ISynthPatchState {
  return new SynthPatch().getState();
}
