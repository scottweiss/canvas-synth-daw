import { AudioEngine } from '../audio/AudioEngine';

export class Drum {
  private frequency: number;
  private waveType: OscillatorType;
  private attack: number;
  private release: number;
  private audioEngine: AudioEngine;

  constructor(
    frequency: number,
    waveType: OscillatorType = 'sine',
    attack: number = 0.01,
    release: number = 0.1
  ) {
    this.frequency = frequency;
    this.waveType = waveType;
    this.attack = attack;
    this.release = release;
    this.audioEngine = AudioEngine.getInstance();
  }

  play(): void {
    const oscillator = this.audioEngine.audioContext.createOscillator();
    const gainNode = this.audioEngine.audioContext.createGain();

    oscillator.type = this.waveType;
    oscillator.frequency.value = this.frequency;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioEngine.audioContext.destination);
    gainNode.connect(this.audioEngine.getAnalyser());

    const now = this.audioEngine.audioContext.currentTime;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + this.attack);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      now + this.attack + this.release
    );

    oscillator.start(now);
    oscillator.stop(now + this.attack + this.release + 0.1);
  }
}
