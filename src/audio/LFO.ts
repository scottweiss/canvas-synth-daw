export type LFOWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export class LFO {
  private oscillator: OscillatorNode;
  private gainNode: GainNode;
  private frequency: number;
  private amount: number;
  
  constructor(audioContext: AudioContext) {
    this.oscillator = audioContext.createOscillator();
    this.gainNode = audioContext.createGain();
    
    this.frequency = 2; // 2 Hz default
    this.amount = 0;
    
    this.oscillator.frequency.value = this.frequency;
    this.gainNode.gain.value = this.amount;
    
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
  }
  
  connect(param: AudioParam): void {
    this.gainNode.connect(param);
  }
  
  disconnect(): void {
    this.gainNode.disconnect();
  }
  
  setFrequency(frequency: number): void {
    this.frequency = frequency;
    this.oscillator.frequency.value = frequency;
  }
  
  setAmount(amount: number): void {
    this.amount = amount;
    this.gainNode.gain.value = amount;
  }
  
  setWaveform(waveform: LFOWaveform): void {
    this.oscillator.type = waveform;
  }

  stop(): void {
    this.oscillator.stop();
    this.oscillator.disconnect();
    this.gainNode.disconnect();
  }

  getOutput(): GainNode {
    return this.gainNode;
  }
}
