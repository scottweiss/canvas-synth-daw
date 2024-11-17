import { Adsr } from "../components/csd-adsr/csd-adsr";
import { ADSR } from "./ADSR";
import midiToFrequency from "./midi-to-frequency";

export class AudioEngine {
  private static instance: AudioEngine;
  private analyserNode: AnalyserNode;
  private dataArray: Uint8Array;
  private adsr: Adsr;
  public audioContext: AudioContext;


  private constructor() {
    this.audioContext = new window.AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.adsr = ADSR.getInstance().adsr;
    console.log(this.adsr)

  }



  getAudioData(): Uint8Array {
    return this.dataArray;
  }

  createOscillator(midiKey: number, adsr: Adsr): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();

    // Set up the oscillator
    oscillator.frequency.value = midiToFrequency(midiKey);

    // Apply ADSR envelope to the gain node
    this.applyADSR(oscillator, adsr);

    return oscillator;
  }

  applyADSR(oscillator: OscillatorNode) {
    const now = this.audioContext.currentTime;
    const gainNode = oscillator.context.createGain();
    oscillator.connect(gainNode);
    // Connect the gain node to the analyser and destination
    gainNode.connect(this.analyserNode);
    gainNode.connect(this.audioContext.destination);

    // Connect the gain node to the analyser and destination
    gainNode.connect(this.analyserNode);
    gainNode.connect(this.audioContext.destination);

    // Set initial value of the gain
    gainNode.gain.setValueAtTime(0, now);

    // Attack phase: increase gain from 0 to 1 over the duration of the attack time
    // Set initial value of the gain
    gainNode.gain.setValueAtTime(0, now);

    // Attack phase: increase gain from 0 to 1 over the duration of the attack time
    gainNode.gain.linearRampToValueAtTime(1, now + this.adsr.attack);

    gainNode.gain.linearRampToValueAtTime(this.adsr.sustain * 0.1, now + this.adsr.attack + this.adsr.decay);
    gainNode.gain.setValueAtTime(this.adsr.sustain * 0.1, now + this.adsr.attack + this.adsr.decay);

  }


  public releaseEnvelope(gainNode: GainNode): void {
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + this.adsr.release);
    // this.oscillator.stop();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }
}