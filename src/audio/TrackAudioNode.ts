/**
 * TrackAudioNode - Manages per-track audio processing
 *
 * Each track has its own audio chain:
 * Input -> Gain (volume) -> StereoPanner (pan) -> Analyser -> Output
 */
export class TrackAudioNode {
  private audioContext: AudioContext;

  // Audio nodes
  private inputGain: GainNode;
  private panNode: StereoPannerNode;
  private outputGain: GainNode;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;

  // State
  private _volume: number = 0.75;
  private _pan: number = 0;
  private _muted: boolean = false;
  private _solo: boolean = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create audio nodes
    this.inputGain = audioContext.createGain();
    this.panNode = audioContext.createStereoPanner();
    this.outputGain = audioContext.createGain();
    this.analyser = audioContext.createAnalyser();

    // Configure analyser for peak metering
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.3;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // Connect the chain
    this.inputGain.connect(this.panNode);
    this.panNode.connect(this.outputGain);
    this.outputGain.connect(this.analyser);

    // Set initial values
    this.inputGain.gain.value = this._volume;
    this.panNode.pan.value = this._pan;
    this.outputGain.gain.value = this._muted ? 0 : 1;
  }

  // Connect a source to this track's input
  public connectInput(source: AudioNode): void {
    source.connect(this.inputGain);
  }

  // Connect this track's output to a destination
  public connectOutput(destination: AudioNode): void {
    this.analyser.connect(destination);
  }

  // Disconnect from destination
  public disconnectOutput(destination?: AudioNode): void {
    if (destination) {
      this.analyser.disconnect(destination);
    } else {
      this.analyser.disconnect();
    }
  }

  // Volume control (0-1)
  public setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    const now = this.audioContext.currentTime;
    this.inputGain.gain.setTargetAtTime(this._volume, now, 0.01);
  }

  public getVolume(): number {
    return this._volume;
  }

  // Pan control (-1 to 1)
  public setPan(pan: number): void {
    this._pan = Math.max(-1, Math.min(1, pan));
    const now = this.audioContext.currentTime;
    this.panNode.pan.setTargetAtTime(this._pan, now, 0.01);
  }

  public getPan(): number {
    return this._pan;
  }

  // Mute control
  public setMute(muted: boolean): void {
    this._muted = muted;
    const now = this.audioContext.currentTime;
    this.outputGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.01);
  }

  public isMuted(): boolean {
    return this._muted;
  }

  // Solo control (state only, actual muting handled by mixer logic)
  public setSolo(solo: boolean): void {
    this._solo = solo;
  }

  public isSolo(): boolean {
    return this._solo;
  }

  // Get current peak level (0-1) for metering
  public getPeakLevel(): number {
    this.analyser.getByteTimeDomainData(this.dataArray);

    let max = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = Math.abs((this.dataArray[i] - 128) / 128);
      if (normalized > max) {
        max = normalized;
      }
    }

    return max;
  }

  // Get RMS level for smoother metering
  public getRMSLevel(): number {
    this.analyser.getByteTimeDomainData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / this.dataArray.length);
  }

  // Get the input gain node for direct voice connections
  public getInputNode(): GainNode {
    return this.inputGain;
  }

  // Get the analyser for visualization
  public getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  // Cleanup
  public disconnect(): void {
    this.inputGain.disconnect();
    this.panNode.disconnect();
    this.outputGain.disconnect();
    this.analyser.disconnect();
  }
}
