import { IAdsr } from './ADSR';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface IFilterSettings {
  frequency: number;
  resonance: number;
  type: FilterType;
  envelopeAmount: number;
}

export class Filter {
  private filter: BiquadFilterNode;
  private envelopeAmount: number = 0.5;
  private baseCutoff: number = 1000;
  private filterAdsr: IAdsr = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.2
  };
  
  constructor(audioContext: AudioContext) {
    this.filter = audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.baseCutoff;
    this.filter.Q.value = 1;
  }
  
  connect(destination: AudioNode): void {
    this.filter.connect(destination);
  }
  
  getInput(): BiquadFilterNode {
    return this.filter;
  }
  
  setType(type: FilterType): void {
    this.filter.type = type;
  }
  
  setFrequency(frequency: number): void {
    this.baseCutoff = frequency;
    this.filter.frequency.value = frequency;
  }
  
  setResonance(resonance: number): void {
    this.filter.Q.value = resonance;
  }
  
  setEnvelopeAmount(amount: number): void {
    this.envelopeAmount = amount;
  }

  getEnvelopeAmount(): number {
    return this.envelopeAmount;
  }

  getSettings(): IFilterSettings {
    return {
      frequency: this.baseCutoff,
      resonance: this.filter.Q.value,
      type: this.filter.type as FilterType,
      envelopeAmount: this.envelopeAmount,
    };
  }
  
  setFilterEnvelope(adsr: IAdsr): void {
    this.filterAdsr = adsr;
  }
  
  triggerEnvelope(time: number): void {
    const maxFreq = Math.min(20000, this.baseCutoff + (this.envelopeAmount * 5000));
    
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(this.baseCutoff, time);
    this.filter.frequency.linearRampToValueAtTime(maxFreq, time + this.filterAdsr.attack);
    this.filter.frequency.linearRampToValueAtTime(
      this.baseCutoff + (this.envelopeAmount * 5000 * this.filterAdsr.sustain),
      time + this.filterAdsr.attack + this.filterAdsr.decay
    );
  }
  
  releaseEnvelope(time: number): void {
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, time);
    this.filter.frequency.linearRampToValueAtTime(this.baseCutoff, time + this.filterAdsr.release);
  }
}
