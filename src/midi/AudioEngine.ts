export class AudioEngine {
  private static instance: AudioEngine;
  public audioContext: AudioContext;
  
  private constructor() {
      this.audioContext = new window.AudioContext();
  }

  public static getInstance(): AudioEngine {
      if (!AudioEngine.instance) {
          AudioEngine.instance = new AudioEngine();
      }
      return AudioEngine.instance;
  }
}