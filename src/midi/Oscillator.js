class Oscillator {
  constructor(frequency = 440, type = "sine") {
    this.frequency = frequency;
    this.type = type;
    this.phase = 0;
  }

  // Generate a single sample of the oscillation
  getSample(time) {
    const PI2 = Math.PI * 2;
    switch (this.type) {
      case "sine":
        return Math.sin(PI2 * this.frequency * time + this.phase);
      case "square":
        return Math.sin(PI2 * this.frequency * time + this.phase) >= 0 ? 1 : -1;
      case "sawtooth":
        return ((this.frequency * time + this.phase) % PI2) - Math.PI;
      default:
        throw new Error(`Unsupported oscillator type: ${this.type}`);
    }
  }

  // Play a buffer of samples
  play(buffer, canvasContext, start = 0) {
    const sampleRate = canvasContext.sampleRate;
    for (let i = start; i < buffer.length; i++) {
      const time = i / sampleRate;
      buffer[i] = this.getSample(time);
    }
    return buffer;
  }
}
