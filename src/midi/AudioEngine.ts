import midiToFrequency from "./midi-to-frequency";

export class AudioEngine {
  private static instance: AudioEngine;
  private analyserNode: AnalyserNode;
  private dataArray: Uint8Array;
  public audioContext: AudioContext;

  private constructor() {
    this.audioContext = new window.AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
  }

  getAudioData(): Uint8Array {
    return this.dataArray;
  }

  getAnalyser(): AnalyserNode {
    return this.analyserNode;
  }

  createOscillator(midiKey: number): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();

    // Set up the oscillator
    oscillator.frequency.value = midiToFrequency(midiKey);

    return oscillator;
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }
}
