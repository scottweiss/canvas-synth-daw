type OscillatorType = 'sine' | 'square' | 'sawtooth';

export class Oscillator {
  private frequency: number;
  private type: OscillatorType;
  private phase: number;

  constructor(frequency: number = 440, type: OscillatorType = 'sine') {
    this.frequency = frequency;
    this.type = type;
    this.phase = 0;
  }

  // Generate a single sample of the oscillation
  public getSample(time: number): number {
    const PI2 = Math.PI * 2;
    switch (this.type) {
      case 'sine':
        return Math.sin(PI2 * this.frequency * time + this.phase);
      case 'square':
        return Math.sin(PI2 * this.frequency * time + this.phase) >= 0 ? 1 : -1;
      case 'sawtooth':
        return ((this.frequency * time + this.phase) % PI2) - Math.PI;
      default:
        throw new Error(`Unsupported oscillator type: ${this.type}`);
    }
  }

  // Play a buffer of samples
  public play(
    buffer: Float32Array,
    context: AudioContext,
    start: number = 0
  ): Float32Array {
    const sampleRate = context.sampleRate;
    for (let i = start; i < buffer.length; i++) {
      const time = i / sampleRate;
      buffer[i] = this.getSample(time);
    }
    return buffer;
  }

  public setFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  public setType(type: OscillatorType): void {
    this.type = type;
  }

  public getFrequency(): number {
    return this.frequency;
  }

  public getType(): OscillatorType {
    return this.type;
  }
}
