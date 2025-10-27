import { Filter, FilterSettings, FilterType } from './Filter';
import { LFO, LFOWaveform } from './LFO';
import { ADSR } from './ADSR';
import midiToFrequency from '../midi/midi-to-frequency';
import { SynthPatchState } from './SynthPatch';

export interface OscillatorSettings {
  type: OscillatorType;
  detune: number;
  octave: number;
  level: number;
}

export class SynthVoice {
  private audioContext: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private oscillatorGains: GainNode[] = [];
  private oscillatorSettings: OscillatorSettings[] = [];
  private filter: Filter;
  private amplitudeEnvelope: GainNode;
  private outputGain: GainNode;
  private lfo: LFO;
  private pitchModGains: GainNode[] = [];
  private filterModGain: GainNode;
  private isPlaying: boolean = false;
  private currentMidiNote: number | null = null;
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.filter = new Filter(audioContext);
    this.amplitudeEnvelope = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.lfo = new LFO(audioContext);
    
    const lfoOutput = this.lfo.getOutput();

    const defaultOscSettings: OscillatorSettings[] = [
      { type: 'sawtooth', detune: 0, octave: 0, level: 0.5 },
      { type: 'square', detune: -5, octave: -1, level: 0.3 },
      { type: 'triangle', detune: 7, octave: 1, level: 0.2 },
    ];

    // Initialize with 3 oscillators
    for (let i = 0; i < 3; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.filter.getInput());

      this.oscillators.push(osc);
      this.oscillatorGains.push(gain);
      this.oscillatorSettings.push(defaultOscSettings[i] ?? defaultOscSettings[0]);
      this.applyOscillatorSettings(i);

      const pitchGain = audioContext.createGain();
      pitchGain.gain.value = 0;
      lfoOutput.connect(pitchGain);
      pitchGain.connect(osc.detune);
      this.pitchModGains.push(pitchGain);
    }

    // Connect signal chain
    this.filter.connect(this.amplitudeEnvelope);
    this.amplitudeEnvelope.connect(this.outputGain);
    
    // Set defaults
    this.amplitudeEnvelope.gain.value = 0;
    this.outputGain.gain.value = 0.3;
    
    // Prime filter defaults
    const filterDefaults: FilterSettings = this.filter.getSettings();
    this.filter.setType(filterDefaults.type);
    this.filter.setFrequency(filterDefaults.frequency);
    this.filter.setResonance(filterDefaults.resonance);
    this.filter.setEnvelopeAmount(filterDefaults.envelopeAmount);

    this.filterModGain = audioContext.createGain();
    this.filterModGain.gain.value = 0;
    lfoOutput.connect(this.filterModGain);
    this.filterModGain.connect(this.filter.getInput().frequency);
  }

  connect(destination: AudioNode): void {
    this.outputGain.connect(destination);
  }

  disconnect(destination?: AudioNode): void {
    if (destination) {
      this.outputGain.disconnect(destination);
    } else {
      this.outputGain.disconnect();
    }
  }

  applyPatch(patch: SynthPatchState): void {
    patch.oscillators.forEach((osc, index) => {
      this.setOscillatorSettings(index, osc);
    });
    this.setFilterType(patch.filter.type);
    this.setFilterFrequency(patch.filter.frequency);
    this.setFilterResonance(patch.filter.resonance);
    this.setFilterEnvelopeAmount(patch.filter.envelopeAmount);
    this.setLFORate(patch.modulation.lfoRate);
    this.setLFOWaveform(patch.modulation.waveform as LFOWaveform);
    this.setLFOPitchAmount(patch.modulation.pitchAmount);
    this.setLFOFilterAmount(patch.modulation.filterAmount);
  }
  
  noteOn(midiNote: number, velocity: number = 100): void {
    if (!this.isPlaying) {
      this.oscillators.forEach(osc => osc.start());
      this.isPlaying = true;
    }
    
    const frequency = midiToFrequency(midiNote);
    const now = this.audioContext.currentTime;
    
    this.oscillators.forEach((_osc, index) => {
      this.setOscillatorFrequency(index, frequency, now);
    });

    // Trigger envelopes
    const adsr = ADSR.getInstance().adsr;
    const maxVolume = velocity / 127;
    
    // Amplitude envelope
    this.amplitudeEnvelope.gain.cancelScheduledValues(now);
    this.amplitudeEnvelope.gain.setValueAtTime(0, now);
    this.amplitudeEnvelope.gain.linearRampToValueAtTime(maxVolume, now + adsr.attack);
    this.amplitudeEnvelope.gain.linearRampToValueAtTime(
      adsr.sustain * maxVolume,
      now + adsr.attack + adsr.decay
    );
    
    // Filter envelope
    this.filter.triggerEnvelope(now);
    this.currentMidiNote = midiNote;
  }
  
  noteOff(): void {
    const now = this.audioContext.currentTime;
    const adsr = ADSR.getInstance().adsr;
    
    // Release amplitude envelope
    this.amplitudeEnvelope.gain.cancelScheduledValues(now);
    this.amplitudeEnvelope.gain.setValueAtTime(this.amplitudeEnvelope.gain.value, now);
    this.amplitudeEnvelope.gain.linearRampToValueAtTime(0, now + adsr.release);
    
    // Release filter envelope
    this.filter.releaseEnvelope(now);

    this.currentMidiNote = null;
  }

  setOscillatorSettings(index: number, settings: Partial<OscillatorSettings>): void {
    if (index < 0 || index >= this.oscillators.length) return;
    this.oscillatorSettings[index] = {
      ...this.oscillatorSettings[index],
      ...settings,
    };
    this.applyOscillatorSettings(index);
  }

  setFilterFrequency(frequency: number): void {
    this.filter.setFrequency(frequency);
  }

  setFilterResonance(resonance: number): void {
    this.filter.setResonance(resonance);
  }

  setFilterType(type: FilterType): void {
    this.filter.setType(type);
  }

  setFilterEnvelopeAmount(amount: number): void {
    this.filter.setEnvelopeAmount(amount);
  }

  setLFOPitchAmount(amount: number): void {
    const cents = amount * 120; // +/- one semitone range
    this.pitchModGains.forEach((gain) => {
      gain.gain.value = cents;
    });
  }

  setLFOFilterAmount(amount: number): void {
    const hz = amount * 2000;
    this.filterModGain.gain.value = hz;
  }

  setLFORate(rate: number): void {
    this.lfo.setFrequency(rate);
  }

  setLFOWaveform(waveform: LFOWaveform): void {
    this.lfo.setWaveform(waveform);
  }

  destroy(): void {
    if (this.isPlaying) {
      this.oscillators.forEach(osc => osc.stop());
    }
    this.lfo.stop();
  }

  private applyOscillatorSettings(index: number): void {
    const osc = this.oscillators[index];
    const gain = this.oscillatorGains[index];
    const settings = this.oscillatorSettings[index];
    if (!osc || !gain || !settings) {
      return;
    }

    osc.type = settings.type;
    osc.detune.value = settings.detune;
    gain.gain.value = settings.level;

    if (this.currentMidiNote !== null) {
      const baseFrequency = midiToFrequency(this.currentMidiNote);
      this.setOscillatorFrequency(index, baseFrequency, this.audioContext.currentTime);
    }
  }

  private setOscillatorFrequency(index: number, baseFrequency: number, time: number): void {
    const osc = this.oscillators[index];
    const settings = this.oscillatorSettings[index];
    if (!osc || !settings) return;

    const frequency = baseFrequency * Math.pow(2, settings.octave);
    osc.frequency.setValueAtTime(frequency, time);
    osc.detune.value = settings.detune;
  }
}
