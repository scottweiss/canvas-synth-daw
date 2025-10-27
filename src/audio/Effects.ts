export class Reverb {
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private outputGain: GainNode;
  
  constructor(audioContext: AudioContext) {
    this.convolver = audioContext.createConvolver();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();

    // Create impulse response
    this.createImpulseResponse(audioContext, 2, 2);
    
    // Set default mix
    this.setMix(0.3);
    
    // Connect nodes
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);
    this.dryGain.connect(this.outputGain);
  }
  
  private createImpulseResponse(
    context: AudioContext,
    duration: number,
    decay: number
  ): void {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    this.convolver.buffer = impulse;
  }
  
  connect(destination: AudioNode): AudioNode {
    this.outputGain.connect(destination);
    return this.outputGain;
  }
  
  getInput(): AudioNode {
    return this.convolver;
  }
  
  getDryInput(): AudioNode {
    return this.dryGain;
  }
  
  setMix(mix: number): void {
    const wetLevel = Math.max(0, Math.min(1, mix));
    const dryLevel = 1 - wetLevel;
    
    this.wetGain.gain.value = wetLevel;
    this.dryGain.gain.value = dryLevel;
  }
  
  setSize(size: number): void {
    const context = this.convolver.context as AudioContext;
    this.createImpulseResponse(context, size, 2);
  }
}

export class Delay {
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private outputGain: GainNode;
  private filterNode: BiquadFilterNode;
  
  constructor(audioContext: AudioContext) {
    this.delayNode = audioContext.createDelay(5);
    this.feedbackGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    
    // Default settings
    this.delayNode.delayTime.value = 0.25;
    this.feedbackGain.gain.value = 0.4;
    this.filterNode.frequency.value = 2000;
    this.filterNode.type = 'highpass';
    this.setMix(0.3);
    
    // Connect feedback loop
    this.delayNode.connect(this.filterNode);
    this.filterNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    
    // Connect output
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);
    this.dryGain.connect(this.outputGain);
  }
  
  connect(destination: AudioNode): AudioNode {
    this.outputGain.connect(destination);
    return this.outputGain;
  }
  
  getInput(): AudioNode {
    return this.delayNode;
  }
  
  getDryInput(): AudioNode {
    return this.dryGain;
  }
  
  setTime(time: number): void {
    this.delayNode.delayTime.value = Math.max(0, Math.min(5, time));
  }
  
  setFeedback(feedback: number): void {
    this.feedbackGain.gain.value = Math.max(0, Math.min(0.95, feedback));
  }
  
  setMix(mix: number): void {
    const wetLevel = Math.max(0, Math.min(1, mix));
    const dryLevel = 1 - wetLevel;
    
    this.wetGain.gain.value = wetLevel;
    this.dryGain.gain.value = dryLevel;
  }
  
  setFilterFrequency(frequency: number): void {
    this.filterNode.frequency.value = frequency;
  }
}
