import { AudioEngine } from "../audio/AudioEngine";

export class Drum {
  gainNode: GainNode;
  audioEngine: AudioEngine;
  oscillator: OscillatorNode;
  isPlaying: boolean;
  attackTime: number;
  releaseTime: number;

  constructor(
    frequency: number,
    type: OscillatorType,
    attackTime: number = 0.1,
    releaseTime: number = 2,
  ) {
    this.isPlaying = false;
    this.audioEngine = AudioEngine.getInstance();
    this.oscillator = this.audioEngine.createOscillator(frequency);
    this.gainNode = this.audioEngine.audioContext.createGain();
    this.oscillator.type = type;
    this.oscillator.frequency.value = frequency; // value in hertz
    this.gainNode.gain.setValueAtTime(
      0,
      this.audioEngine.audioContext.currentTime,
    );

    this.oscillator
      .connect(this.gainNode)
      .connect(this.audioEngine.audioContext.destination);
    this.gainNode.connect(this.audioEngine.audioContext.destination);
    this.gainNode.connect(this.audioEngine.getAnalyser());

    this.attackTime = attackTime;
    this.releaseTime = releaseTime;

    // // set attack and release times
    // this.gainNode.gain.setValueAtTime(0.001, this.audioEngine.audioContext.currentTime)
    // this.gainNode.gain.linearRampToValueAtTime(1, this.audioEngine.audioContext.currentTime + attackTime);
    // this.gainNode.gain.linearRampToValueAtTime(0, this.audioEngine.audioContext.currentTime + attackTime + releaseTime);
  }

  play() {
    const now = this.audioEngine.audioContext.currentTime;
    const maxVolumne = 0.5;
    if (!this.isPlaying) {
      this.oscillator.start(now);
      this.isPlaying = true;
    }
    this.gainNode.gain.linearRampToValueAtTime(
      maxVolumne,
      this.audioEngine.audioContext.currentTime + this.attackTime,
    );
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioEngine.audioContext.currentTime +
        this.attackTime +
        this.releaseTime,
    );
  }
}
