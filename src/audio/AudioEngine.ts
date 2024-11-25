import { ADSR } from "../audio/ADSR";
import midiToFrequency from "../midi/midi-to-frequency";


export class AudioEngine {
  private static instance: AudioEngine;
  private analyserNode: AnalyserNode;
  private dataArray: Uint8Array;
  public audioContext: AudioContext;
  #bpm: number;

  private constructor() {
    this.audioContext = new window.AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.#bpm = 120;
  }

  get bpm(): number {
    return this.#bpm;
  }

  set bpm(value: number) {
    this.#bpm = value;
  }

  getAudioData(): Uint8Array {
    return this.dataArray;
  }

  getAnalyser(): AnalyserNode {
    return this.analyserNode;
  }

  playNote(oscillator: OscillatorNode, gainNode: GainNode): void {
    if (!oscillator) return;
    // if (oscillator.context.state == "suspended") {

    //   oscillator.start();
    //   }

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.applyADSR(gainNode);
  }

  applyADSR(gainNode: GainNode) {
    const currentTime = this.audioContext.currentTime;
    const maxVolumne = 0.5;
    const adsr = ADSR.getInstance().adsr;
    // oscillator.frequency.setValueAtTime(
    //   midiToFrequency(midiKey),
    //   this.audioContext.currentTime,
    // );
    
    gainNode.gain.setValueAtTime(gainNode.gain.value || 0.001, currentTime);
    gainNode.gain.linearRampToValueAtTime(
      maxVolumne,
      currentTime + adsr.attack,
    );
    gainNode.gain.linearRampToValueAtTime(
      adsr.sustain * maxVolumne,
      currentTime + adsr.attack + adsr.decay,
    );
    gainNode.gain.setValueAtTime(
      adsr.sustain * maxVolumne,
      currentTime + adsr.attack + adsr.decay,
    );
  }

  releaseEnvelope(gainNode: GainNode) {
    const release = ADSR.getInstance().adsr.release;
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + release);
    // this.oscillator.stop();
  }

  createOscillator(midiKey: number): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = midiToFrequency(midiKey);
    // oscillator.connect(this.audioContext.destination)
    return oscillator;
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }
}
